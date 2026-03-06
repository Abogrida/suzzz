import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    let employeeId = searchParams.get('employee_id'); // Optional

    if (!month || month.length !== 7) {
        return NextResponse.json({ error: 'Month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    const [y, m] = month.split('-');
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${lastDay}`;

    // 1. Fetch Employees
    let empQuery = db.from('hr_employees').select('*').eq('is_active', true);
    if (employeeId) {
        empQuery = empQuery.eq('id', employeeId);
    }
    const { data: employees, error: empError } = await empQuery;
    if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });
    if (!employees || employees.length === 0) return NextResponse.json([]);

    const empIds = employees.map(e => e.id);

    // 2. Fetch Attendance
    const { data: attendance } = await db
        .from('hr_attendance')
        .select('*')
        .in('employee_id', empIds)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

    // 3. Fetch Payments
    const { data: payments } = await db
        .from('hr_payments')
        .select('*')
        .in('employee_id', empIds)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    // 4. Fetch Leaves (to not penalize for paid leaves)
    // We check if leaves overlap with the current month
    const { data: leaves } = await db
        .from('hr_employee_leaves')
        .select('*')
        .in('employee_id', empIds)
        .lte('leave_start', endDate)
        .gte('leave_end', startDate);

    // 5. Calculate Settlements
    const settlements = employees.map(emp => {
        const empAttendance = (attendance || []).filter(a => a.employee_id === emp.id);
        const empPayments = (payments || []).filter(p => p.employee_id === emp.id);
        const empLeaves = (leaves || []).filter(l => l.employee_id === emp.id);

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

            // Stop counting absences for future days
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
                // Not a future day, not an off-day, and NO attendance => Implied Absence
                absentCount++;
            }
        }

        // Just use absentCount for penalties. Leaves are already excluded from it.
        let penaltyAbsences = absentCount;

        let totalAdvances = 0;
        let totalDeductions = 0;
        let totalBonuses = 0;
        let totalPaidSalaries = 0;

        empPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            if (amount > 0) {
                if (p.payment_type === 'advance') totalAdvances += amount;
                else if (p.payment_type === 'deduction') totalDeductions += amount;
                else if (p.payment_type === 'bonus') totalBonuses += amount;
                else if (p.payment_type === 'salary') totalPaidSalaries += amount;
            }
        });

        const baseSalary = Number(emp.base_salary) || 0;
        const dailyRate = baseSalary / 30;

        // Only penalize for unexcused/unpaid absences
        const absentPenalty = penaltyAbsences * dailyRate;

        const latePenalty = lateCount > 0 ? (lateCount * (dailyRate / 2)) : 0; // Keeping the note: we don't automatically deduct late unless HR adds a manual deduction.

        // Assuming Net Salary = Base - Absences + Bonuses - Deductions - Advances
        const netSalary = baseSalary - absentPenalty + totalBonuses - totalDeductions - totalAdvances;

        return {
            employee: emp,
            month: month,
            stats: {
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                excused: excusedCount,
                paid_leaves: paidLeaveDaysInMonth
            },
            financials: {
                base_salary: baseSalary,
                daily_rate: dailyRate.toFixed(2),
                absent_penalty: absentPenalty.toFixed(2),
                bonuses: totalBonuses,
                deductions: totalDeductions,
                advances: totalAdvances,
                paid_salaries: totalPaidSalaries,
                net_salary: netSalary.toFixed(2)
            }
        };
    });

    return NextResponse.json(settlements);
}
