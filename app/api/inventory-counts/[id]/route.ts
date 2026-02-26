import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('inventory_counts')
            .select('*, employees(name), inventory_count_items(*)')
            .eq('id', id)
            .single();

        if (error || !data) return NextResponse.json({ error: 'الجرد غير موجود' }, { status: 404 });

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
