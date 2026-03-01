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
    const upsertData = [];

    // Fetch existing records for that specific date to merge
    const activeDates = [...new Set(records.map(r => r.attendance_date))];
    const { data: existingRecords } = await db
        .from('hr_attendance')
        .select('*')
        .in('employee_id', empIds)
        .in('attendance_date', activeDates);

    const existingMap = new Map();
    (existingRecords || []).forEach((r: any) => {
        // Group existing records by employee_id + attendance_date
        const key = `${r.employee_id}_${r.attendance_date}`;
        if (!existingMap.has(key)) existingMap.set(key, []);
        existingMap.get(key).push(r);
    });

    const recordsToInsert = [];
    const recordsToUpdate = [];

    for (const r of records) {
        const emp = empMap.get(r.employee_id);
        const dayRecords = existingMap.get(`${r.employee_id}_${r.attendance_date}`) || [];

        // Find if this specific check-in time already exists for this employee on this date
        // Sometimes check_in_time from sqlite might have seconds, so we do a prefix match
        const existingSession = dayRecords.find((ex: any) =>
            ex.check_in_time && r.check_in_time &&
            ex.check_in_time.startsWith(r.check_in_time.slice(0, 5))
        );

        const resolvedStatus = r.status && r.status !== 'auto'
            ? r.status
            : calcStatus(r.check_in_time, emp?.work_start_time, emp?.late_threshold_minutes ?? 15);

        if (existingSession) {
            // Update the existing session (add check_out_time if necessary)
            let mergedCheckOut = r.check_out_time || existingSession.check_out_time || null;
            if (r.check_out_time && existingSession.check_out_time) {
                mergedCheckOut = r.check_out_time > existingSession.check_out_time ? r.check_out_time : existingSession.check_out_time;
            }
            recordsToUpdate.push({
                id: existingSession.id,
                employee_id: r.employee_id,
                attendance_date: r.attendance_date,
                status: resolvedStatus,
                check_in_time: r.check_in_time || existingSession.check_in_time,
                check_out_time: mergedCheckOut,
                source: 'kiosk',
                synced_from_local: true,
                notes: r.notes || existingSession.notes || '',
            });
        } else {
            // New shift / session
            recordsToInsert.push({
                employee_id: r.employee_id,
                attendance_date: r.attendance_date,
                status: resolvedStatus,
                check_in_time: r.check_in_time,
                check_out_time: r.check_out_time,
                source: 'kiosk',
                synced_from_local: true,
                notes: r.notes || '',
            });
        }
    }

    let syncedCount = 0;

    // Process Updates
    for (const u of recordsToUpdate) {
        const { error } = await db.from('hr_attendance').update(u).eq('id', u.id);
        if (!error) syncedCount++;
    }

    // Process Inserts
    if (recordsToInsert.length > 0) {
        const { data: inserted, error: insertError } = await db.from('hr_attendance').insert(recordsToInsert).select();
        if (!insertError && inserted) syncedCount += inserted.length;
    }

    // Since we aren't using single upsert, we can just return success if it ran through
    return NextResponse.json({
        success: true,
        synced: syncedCount,
        message: `تم مزامنة ${syncedCount} سجل حضور`
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
