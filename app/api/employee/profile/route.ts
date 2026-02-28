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
            .select('id, name, job_title, base_salary, is_active')
            .eq('pin_code', pin)
            .single();

        if (empErr || !emp || !emp.is_active) {
            return NextResponse.json({ error: 'مستخدم غير مسجل' }, { status: 404 });
        }

        // 2. Fetch Attendance for the given month
        const { data: attendance } = await supabase
            .from('hr_attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .like('date', `${month}-%`);

        // 3. Fetch Payments for the given month
        const { data: payments } = await supabase
            .from('hr_payments')
            .select('*')
            .eq('employee_id', emp.id)
            .like('payment_date', `${month}-%`);

        // 4. Fetch Purchases for the given month
        const { data: purchases } = await supabase
            .from('hr_employee_purchases')
            .select('*')
            .eq('employee_id', emp.id)
            .like('purchase_date', `${month}-%`);

        return NextResponse.json({
            ...emp,
            attendance: attendance || [],
            payments: payments || [],
            purchases: purchases || []
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
