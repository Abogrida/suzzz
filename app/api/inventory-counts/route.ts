import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employee_id');
        const countDate = searchParams.get('count_date');
        const branch = searchParams.get('branch');

        const supabase = createAdminClient();
        let query = supabase.from('inventory_counts').select('*, employees(name), inventory_count_items(*)').order('created_at', { ascending: false });

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (countDate) query = query.eq('count_date', countDate);
        if (branch && branch !== 'all') query = query.eq('branch', branch);

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    try {
        const { employee_id, count_date, shift, branch, items, notes } = await req.json();
        const supabase = createAdminClient();

        // 1. Create main record
        const { data: count, error: countErr } = await supabase
            .from('inventory_counts')
            .insert({ employee_id, count_date, shift, branch: branch || 'Suzz 1', notes })
            .select()
            .single();

        if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });

        // 2. Create items
        const itemsToInsert = items.map((it: any) => ({
            inventory_count_id: count.id,
            item_name: it.item_name,
            quantity: it.quantity
        }));

        const { error: itemsErr } = await supabase.from('inventory_count_items').insert(itemsToInsert);
        if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

        return NextResponse.json({ success: true, id: count.id });
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}
