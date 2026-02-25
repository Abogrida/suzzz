import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/hr/payments?employee_id=X
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employee_id');
    let qb = db.from('hr_payments').select('*, hr_employees(name)').order('payment_date', { ascending: false });
    if (employeeId) qb = qb.eq('employee_id', employeeId);
    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/hr/payments
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const body = await req.json();
    const { data, error } = await db.from('hr_payments').insert({
        employee_id: body.employee_id,
        payment_type: body.payment_type,
        amount: parseFloat(body.amount) || 0,
        payment_date: body.payment_date || new Date().toISOString().split('T')[0],
        notes: body.notes || '',
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
