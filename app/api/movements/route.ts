import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/movements
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    const limit = parseInt(searchParams.get('limit') || '200');

    let qb = db.from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (productId) qb = qb.eq('product_id', productId);

    const { data: movements, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get product names separately
    const productIds = [...new Set((movements || []).map((m: any) => m.product_id).filter(Boolean))];
    let productMap: Record<number, string> = {};

    if (productIds.length > 0) {
        const { data: products } = await db
            .from('products')
            .select('id, name')
            .in('id', productIds);
        (products || []).forEach((p: any) => { productMap[p.id] = p.name; });
    }

    const formatted = (movements || []).map((m: any) => ({
        ...m,
        product_name: productMap[m.product_id] || '—',
    }));

    return NextResponse.json(formatted);
}
