import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/invoices/statistics
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();

    try {
        // 1. Try high-performance RPC
        const { data: rpcData, error: rpcError } = await db.rpc('get_invoice_stats');

        if (!rpcError && rpcData && rpcData.length > 0) {
            const stats = rpcData[0];
            return NextResponse.json({
                sale_count: parseInt(stats.sale_count),
                purchase_count: parseInt(stats.purchase_count),
                total_sales: parseFloat(stats.total_sales),
                total_purchases: parseFloat(stats.total_purchases),
                profit: parseFloat(stats.total_sales) - parseFloat(stats.total_purchases),
            });
        }

        // 2. Fallback to standard queries if RPC fails
        const { data: sales } = await db.from('invoices').select('total_amount').eq('invoice_type', 'sale');
        const { data: purchases } = await db.from('invoices').select('total_amount').eq('invoice_type', 'purchase');

        const totalSales = (sales || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
        const totalPurchases = (purchases || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);

        return NextResponse.json({
            sale_count: (sales || []).length,
            purchase_count: (purchases || []).length,
            total_sales: totalSales,
            total_purchases: totalPurchases,
            profit: totalSales - totalPurchases,
        });
    } catch {
        return NextResponse.json({ error: 'خطأ في جلب إحصائيات الفواتير' }, { status: 500 });
    }
}
