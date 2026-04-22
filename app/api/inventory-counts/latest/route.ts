import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const branch = searchParams.get('branch');

        if (!branch) {
            return NextResponse.json({ error: 'يجب تحديد الفرع' }, { status: 400 });
        }

        const supabase = createAdminClient();
        
        // Fetch the single latest count for this branch
        const { data, error } = await supabase
            .from('inventory_counts')
            .select('*, inventory_count_items(*)')
            .eq('branch', branch)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'لا يوجد جرد سابق لهذا الفرع' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
