import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/invoices/statistics
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();

    const { data: sales } = await db
        .from('invoices')
        .select('total_amount,paid_amount')
        .eq('invoice_type', 'sale');

    const { data: purchases } = await db
        .from('invoices')
        .select('total_amount,paid_amount')
        .eq('invoice_type', 'purchase');

    const totalSales = (sales || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
    const totalPurchases = (purchases || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);

    return NextResponse.json({
        sale_count: (sales || []).length,
        purchase_count: (purchases || []).length,
        total_sales: totalSales,
        total_purchases: totalPurchases,
        profit: totalSales - totalPurchases,
    });
}
