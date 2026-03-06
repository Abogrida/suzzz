import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');
    const month = searchParams.get('month'); // YYYY-MM

    if (!pin || !month) {
        return NextResponse.json({ error: 'Missing pin or month' }, { status: 400 });
    }

    try {
        // 1. Authenticate and get employee
        const { data: emp, error: empErr } = await supabase
            .from('hr_employees')
            .select('id, name, job_title, base_salary, is_active, off_days')
            .eq('pin_code', pin)
            .single();

        if (empErr || !emp || !emp.is_active) {
            return NextResponse.json({ error: 'مستخدم غير مسجل' }, { status: 404 });
        }

        // 2. Fetch Attendance for the given month
        const [y, m] = month.split('-');
        const startDate = `${month}-01`;
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        const endDate = `${month}-${lastDay}`;

        const { data: attendance } = await supabase
            .from('hr_attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('attendance_date', startDate)
            .lte('attendance_date', endDate);

        // Fetch Leaves
        const { data: leaves } = await supabase
            .from('hr_employee_leaves')
            .select('*')
            .eq('employee_id', emp.id)
            .lte('leave_start', endDate)
            .gte('leave_end', startDate);

        // 3. Fetch Payments for the given month
        const { data: payments } = await supabase
            .from('hr_payments')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);

        // 4. Fetch Purchases for the given month
        const { data: purchases } = await supabase
            .from('hr_employee_purchases')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('purchase_date', startDate)
            .lte('purchase_date', endDate);

        // Calculate Stats
        const empAttendance = (attendance || []);
        const empLeaves = (leaves || []);

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;
        let paidLeaveDaysInMonth = 0;

        const offDaysKeys = emp.off_days || [];
        const isCurrentMonth = new Date().getFullYear() === parseInt(y) && (new Date().getMonth() + 1) === parseInt(m);
        const todayDay = new Date().getDate();

        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${y}-${m}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(parseInt(y), parseInt(m) - 1, d);

            const isFuture = (isCurrentMonth && d > todayDay) || (new Date() < dateObj);
            const isOffDay = offDaysKeys.includes(dateObj.getDay());

            const hasLeave = empLeaves.find(lv => {
                const ls = new Date(lv.leave_start).getTime();
                const le = new Date(lv.leave_end).getTime();
                const curr = dateObj.getTime();
                return curr >= ls && curr <= le && !['unpaid'].includes(lv.leave_type);
            });

            const dayRecords = empAttendance.filter(a => a.attendance_date === dateStr);
            const didAttend = dayRecords.some(r => ['present', 'late'].includes(r.status));
            const isLate = dayRecords.some(r => r.status === 'late');
            const isExcused = dayRecords.some(r => r.status === 'excused');
            const isExplicitlyAbsent = dayRecords.some(r => r.status === 'absent');

            if (isFuture && isCurrentMonth) continue;

            if (hasLeave || isExcused) {
                excusedCount++;
                if (hasLeave) paidLeaveDaysInMonth++;
            } else if (didAttend) {
                presentCount++;
                if (isLate) lateCount++;
            } else if (isExplicitlyAbsent) {
                absentCount++;
            } else if (!isOffDay && !isFuture) {
                absentCount++;
            }
        }

        let penaltyAbsences = Math.max(0, absentCount - paidLeaveDaysInMonth);

        return NextResponse.json({
            ...emp,
            attendance: empAttendance,
            payments: payments || [],
            purchases: purchases || [],
            stats: {
                present: presentCount,
                absent: absentCount,
                penalty_absences: penaltyAbsences,
                late: lateCount,
                excused: excusedCount,
                paid_leaves: paidLeaveDaysInMonth
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
