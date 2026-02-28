import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET /api/hr/purchases?employee_id=X&month=YYYY-MM
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const employee_id = searchParams.get('employee_id');
    const month = searchParams.get('month'); // Expecting format YYYY-MM

    const db = createAdminClient();
    let query = db.from('hr_employee_purchases')
        .select('*, hr_employees(name)')
        .order('purchase_date', { ascending: false });

    if (employee_id) {
        query = query.eq('employee_id', employee_id);
    }

    if (month) {
        const startOfMonth = `${month}-01`;
        const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];
        query = query.gte('purchase_date', startOfMonth).lte('purchase_date', endOfMonth);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/hr/purchases
// Body: { employee_id, item_name, amount, purchase_date, notes }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { employee_id, item_name, amount, purchase_date, notes } = body;

        if (!employee_id || !item_name || amount === undefined || amount === null || !purchase_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = createAdminClient();
        const { data, error } = await db
            .from('hr_employee_purchases')
            .insert([{ employee_id, item_name, amount, purchase_date, notes }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
