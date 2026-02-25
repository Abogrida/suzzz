import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const employeeId = req.nextUrl.searchParams.get('employee_id');
        let query = supabase.from('inventory_counts').select('*, employee:employees(name)').order('created_at', { ascending: false });
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Fetch items for each count
        const ids = (data || []).map(c => c.id);
        let items: any[] = [];
        if (ids.length > 0) {
            const { data: itemsData } = await supabase.from('inventory_count_items').select('*').in('count_id', ids);
            items = itemsData || [];
        }

        const result = (data || []).map(c => ({
            ...c,
            employee_name: c.employee?.name || 'غير معروف',
            items: items.filter(i => i.count_id === c.id)
        }));

        return NextResponse.json(result);
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    try {
        const { employee_id, count_date, shift, items, notes } = await req.json();
        if (!employee_id || !items?.length) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });

        const supabase = createAdminClient();

        // Create count record
        const { data: count, error: cErr } = await supabase.from('inventory_counts').insert({
            employee_id,
            count_date: count_date || new Date().toISOString().split('T')[0],
            shift: shift || 'morning',
            notes: notes || ''
        }).select().single();

        if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

        // Insert items
        const itemRows = items.map((i: { item_name: string; quantity: number }) => ({
            count_id: count.id,
            item_name: i.item_name,
            quantity: i.quantity || 0
        }));
        const { error: iErr } = await supabase.from('inventory_count_items').insert(itemRows);
        if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

        return NextResponse.json({ success: true, id: count.id }, { status: 201 });
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}
