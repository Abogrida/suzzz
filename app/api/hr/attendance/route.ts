import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

    let t = checkInTime;
    if (t.includes('T')) t = t.split('T')[1];
    const match = t.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 'present'; // fallback

    const checkInMins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const [wh, wm] = workStartTime.split(':').map(Number);
    const workStartMins = wh * 60 + wm;

    return checkInMins - workStartMins > Number(lateThreshold) ? 'late' : 'present';
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
        .select('*, hr_employees!inner(name, job_title, work_start_time, work_end_time, late_threshold_minutes)')
        .order('attendance_date', { ascending: false });
    if (date) {
        if (date.length === 7) {
            // YYYY-MM prefix -> query the whole month
            const [y, m] = date.split('-');
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
            qb = qb.gte('attendance_date', `${date}-01`).lte('attendance_date', `${date}-${lastDay}`);
        } else {
            qb = qb.eq('attendance_date', date);
        }
    }
    if (employeeId) qb = qb.eq('employee_id', employeeId);
    const { data: attendance, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let finalData = [...(attendance || [])];

    if (date) {
        const isMonthQuery = date.length === 7;
        let y, m, startDay, lastDay;

        if (isMonthQuery) {
            [y, m] = date.split('-').map(Number);
            startDay = 1;
            lastDay = new Date(y, m, 0).getDate();
        } else {
            const parts = date.split('-');
            y = parseInt(parts[0]);
            m = parseInt(parts[1]);
            startDay = parseInt(parts[2]);
            lastDay = startDay;
        }

        const now = new Date();
        const todayY = now.getFullYear();
        const todayM = now.getMonth() + 1;
        const todayD = now.getDate();

        let empQb = db.from('hr_employees')
            .select('id, name, job_title, work_start_time, work_end_time, late_threshold_minutes, off_days')
            .eq('is_active', true);
        if (employeeId) empQb = empQb.eq('id', employeeId);

        const { data: emps } = await empQb;
        const activeEmps = emps || [];

        // Preload leaves to avoid marking approved leaves as absent
        const { data: leaves } = await db.from('hr_employee_leaves').select('*');
        const allLeaves = leaves || [];

        for (const emp of activeEmps) {
            const offDays = emp.off_days || [];

            for (let d = startDay; d <= lastDay; d++) {
                // Skip future dates
                if (y > todayY) continue;
                if (y === todayY && m > todayM) continue;
                if (y === todayY && m === todayM && d > todayD) continue;

                const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dateObj = new Date(y, m - 1, d);

                // If it's an off day, skip
                if (offDays.includes(dateObj.getDay())) continue;

                // If on leave, skip
                const hasLeave = allLeaves.some(lv => {
                    if (lv.employee_id !== emp.id) return false;
                    const ls = new Date(lv.leave_start).getTime();
                    const le = new Date(lv.leave_end).getTime();
                    const curr = dateObj.getTime();
                    return curr >= ls && curr <= le && !['unpaid'].includes(lv.leave_type);
                });
                if (hasLeave) continue;

                const hasRecord = finalData.some(a => a.employee_id === emp.id && a.attendance_date === dateStr);

                if (!hasRecord) {
                    finalData.push({
                        id: `sys-${emp.id}-${dateStr}` as any,
                        employee_id: emp.id,
                        attendance_date: dateStr,
                        status: 'absent',
                        notes: 'غياب غير مسجل',
                        source: 'system',
                        synced_from_local: true,
                        hr_employees: {
                            name: emp.name,
                            job_title: emp.job_title,
                            work_start_time: emp.work_start_time,
                            work_end_time: emp.work_end_time,
                            late_threshold_minutes: emp.late_threshold_minutes
                        }
                    } as any);
                }
            }
        }

        // Re-sort descending by date
        finalData.sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
    }

    return NextResponse.json(finalData);
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

    const { data, error } = await db.from('hr_attendance').insert({
        employee_id: body.employee_id,
        attendance_date: body.attendance_date || new Date().toISOString().split('T')[0],
        status: resolvedStatus,
        check_in_time: body.check_in_time || null,
        check_out_time: body.check_out_time || null,
        source: body.source || 'manual',
        synced_from_local: body.synced_from_local || false,
        notes: body.notes || '',
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
