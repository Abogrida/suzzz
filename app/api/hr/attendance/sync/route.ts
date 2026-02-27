import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const SYNC_API_KEY = process.env.ATTENDANCE_SYNC_KEY || 'attendance-sync-secret-2026';

// Helper: calculate status from check-in time vs. work schedule
function calcStatus(
    checkInTime: string | null,
    workStartTime: string | null,
    lateThreshold: number
): string {
    if (!checkInTime) return 'absent';
    if (!workStartTime) return 'present';
    const [ih, im] = checkInTime.split(':').map(Number);
    const [wh, wm] = workStartTime.split(':').map(Number);
    const checkInMins = ih * 60 + im;
    const workStartMins = wh * 60 + wm;
    return checkInMins - workStartMins > lateThreshold ? 'late' : 'present';
}

// POST /api/hr/attendance/sync
// Called by Python EXE when internet is available
// Body: Array of attendance records from local SQLite
// Auth: Authorization: Bearer <SYNC_API_KEY>
export async function POST(req: NextRequest) {
    const auth = req.headers.get('Authorization') || '';
    if (auth !== `Bearer ${SYNC_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createAdminClient();
    const records: any[] = await req.json();
    if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    // Fetch all relevant employees' schedules once
    const empIds = [...new Set(records.map(r => r.employee_id))];
    const { data: employees } = await db
        .from('hr_employees')
        .select('id, work_start_time, late_threshold_minutes')
        .in('id', empIds);

    const empMap = new Map((employees || []).map(e => [e.id, e]));

    // Build upsert payload
    const upsertData = records.map(r => {
        const emp = empMap.get(r.employee_id);
        const resolvedStatus = r.status && r.status !== 'auto'
            ? r.status
            : calcStatus(r.check_in_time, emp?.work_start_time, emp?.late_threshold_minutes ?? 15);

        return {
            employee_id: r.employee_id,
            attendance_date: r.attendance_date,
            status: resolvedStatus,
            check_in_time: r.check_in_time || null,
            check_out_time: r.check_out_time || null,
            source: 'kiosk',
            synced_from_local: true,
            notes: r.notes || '',
        };
    });

    const { data, error } = await db
        .from('hr_attendance')
        .upsert(upsertData, { onConflict: 'employee_id,attendance_date' })
        .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        success: true,
        synced: data?.length || 0,
        message: `تم مزامنة ${data?.length || 0} سجل حضور`
    });
}

// GET /api/hr/attendance/sync — health check for Python EXE
export async function GET(req: NextRequest) {
    const auth = req.headers.get('Authorization') || '';
    if (auth !== `Bearer ${SYNC_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, message: 'Attendance sync endpoint ready', timestamp: new Date().toISOString() });
}
