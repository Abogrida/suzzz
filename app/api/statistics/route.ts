import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/statistics - Dashboard statistics
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();

    const { data: products } = await db.from('products').select('current_quantity, min_quantity, price, sale_price');

    const total_products = (products || []).length;
    const total_value = (products || []).reduce((s: number, p: any) => s + (p.current_quantity * p.price), 0);
    const low_stock = (products || []).filter((p: any) => p.current_quantity > 0 && p.current_quantity <= p.min_quantity).length;
    const out_of_stock = (products || []).filter((p: any) => p.current_quantity <= 0).length;

    return NextResponse.json({ total_products, total_value, low_stock, out_of_stock });
}
