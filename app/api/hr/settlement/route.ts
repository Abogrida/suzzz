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

        empAttendance.forEach(a => {
            if (a.status === 'present') presentCount++;
            else if (a.status === 'absent') absentCount++;
            else if (a.status === 'late') lateCount++;
            else if (a.status === 'excused') excusedCount++;
        });

        // Calculate total days of paid leaves in this month
        let paidLeaveDaysInMonth = 0;
        empLeaves.forEach(leave => {
            if (leave.leave_type === 'unpaid') return; // Unpaid leaves don't reduce absent penalty explicitly, absent counts usually cover them. Or absent penalty will apply.

            // Calculate overlap between leave and this month
            const ls = new Date(leave.leave_start);
            const le = new Date(leave.leave_end);
            const ms = new Date(startDate);
            const me = new Date(endDate);

            const start = ls > ms ? ls : ms;
            const end = le < me ? le : me;

            if (start <= end) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to inclusive
                paidLeaveDaysInMonth += diffDays;
            }
        });

        // Since the user might just mark them as absent on the terminal, we should subtract the paid leaves from the absent count for penalty purposes.
        let penaltyAbsences = absentCount;

        // If they have paid leaves, reduce the penalty absence count, but not below 0
        penaltyAbsences = Math.max(0, penaltyAbsences - paidLeaveDaysInMonth);

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
