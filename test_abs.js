const { createClient } = require('@supabase/supabase-js');
const url = 'https://vmkfwhnpevbamrfbjkzv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8';
const supabase = createClient(url, key);

async function test() {
    const { data: employees } = await supabase.from('hr_employees').select('*').like('name', '%كريم%');
    const emp = employees[0];
    console.log('Employee off_days:', emp.off_days);

    const { data: attendance } = await supabase.from('hr_attendance').select('*').eq('employee_id', emp.id).gte('attendance_date', '2026-03-01').lte('attendance_date', '2026-03-31');
    console.log('Attendance records:', attendance?.length);
    console.log(attendance);

    const y = 2026;
    const m = 3;
    const lastDay = new Date(y, m, 0).getDate();
    const offDaysKeys = typeof emp.off_days === 'string' ? JSON.parse(emp.off_days) : (emp.off_days || []);
    const isCurrentMonth = new Date().getFullYear() === y && (new Date().getMonth() + 1) === m;
    const todayDay = new Date().getDate();

    let absentCount = 0;
    let presentCount = 0;
    for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${y}-0${m}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(y, m - 1, d);

        const isFuture = (isCurrentMonth && d > todayDay) || (new Date() < dateObj);
        const isOffDay = offDaysKeys.includes(dateObj.getDay());

        // Fallbacks to default empty array if attendance is null
        const dayRecords = (attendance || []).filter(a => a.attendance_date === dateStr);
        const didAttend = dayRecords.some(r => ['present', 'late'].includes(r.status));
        const isExcused = dayRecords.some(r => r.status === 'excused');
        const isExplicitlyAbsent = dayRecords.some(r => r.status === 'absent');

        if (isFuture && isCurrentMonth) continue;

        if (isExcused) {
            // excused
        } else if (didAttend) {
            presentCount++;
        } else if (isExplicitlyAbsent) {
            absentCount++;
        } else if (!isOffDay && !isFuture) {
            absentCount++;
            console.log('Implied absent on:', dateStr, '| isOffDay:', isOffDay, '| dateObj.getDay():', dateObj.getDay());
        }
    }
    console.log('Calculated absent:', absentCount, 'Present:', presentCount);
}
test();
