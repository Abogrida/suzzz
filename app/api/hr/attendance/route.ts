import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// Helper: calculate status from check-in time vs. work schedule
function calcStatus(
    checkInTime: string | null,
    workStartTime: string | null,
    lateThreshold: number,
    manualStatus?: string
): string {
    if (manualStatus && manualStatus !== 'auto') return manualStatus;
    if (!checkInTime) return 'absent';
    if (!workStartTime) return 'present';
    const [ih, im] = checkInTime.split(':').map(Number);
    const [wh, wm] = workStartTime.split(':').map(Number);
    const checkInMins = ih * 60 + im;
    const workStartMins = wh * 60 + wm;
    return checkInMins - workStartMins > lateThreshold ? 'late' : 'present';
}

// GET /api/hr/attendance?date=YYYY-MM-DD&employee_id=X
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employee_id');
    let qb = db.from('hr_attendance')
        .select('*, hr_employees(name, job_title, work_start_time, work_end_time, late_threshold_minutes)')
        .order('attendance_date', { ascending: false });
    if (date) qb = qb.eq('attendance_date', date);
    if (employeeId) qb = qb.eq('employee_id', employeeId);
    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/hr/attendance
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const body = await req.json();

    // Fetch employee schedule to auto-calculate status
    let resolvedStatus = body.status || 'present';
    if (body.check_in_time) {
        const { data: emp } = await db
            .from('hr_employees')
            .select('work_start_time, late_threshold_minutes')
            .eq('id', body.employee_id)
            .single();
        if (emp) {
            resolvedStatus = calcStatus(
                body.check_in_time,
                emp.work_start_time,
                emp.late_threshold_minutes ?? 15,
                body.status
            );
        }
    }

    const { data, error } = await db.from('hr_attendance').upsert({
        employee_id: body.employee_id,
        attendance_date: body.attendance_date || new Date().toISOString().split('T')[0],
        status: resolvedStatus,
        check_in_time: body.check_in_time || null,
        check_out_time: body.check_out_time || null,
        source: body.source || 'manual',
        synced_from_local: body.synced_from_local || false,
        notes: body.notes || '',
    }, { onConflict: 'employee_id,attendance_date' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
