import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/customers
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'customer' or 'supplier'
    const q = searchParams.get('q');

    let qb = db.from('customers').select('*').order('name');

    if (type) qb = qb.eq('customer_type', type);
    if (q) qb = qb.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/customers
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const data = await req.json();

    const { data: customer, error } = await db.from('customers').insert({
        name: data.name,
        phone: data.phone || '',
        address: data.address || '',
        customer_type: data.customer_type || 'customer',
        notes: data.notes || '',
    }).select().single();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, customer_id: customer.id });
}
