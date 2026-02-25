import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/reports/financial-summary
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();

    const { data: invoices } = await db.from('invoices').select('invoice_type,total_amount,paid_amount,remaining_amount');
    const { data: products } = await db.from('products').select('current_quantity,price');

    const sales = (invoices || []).filter((i: any) => i.invoice_type === 'sale');
    const purchases = (invoices || []).filter((i: any) => i.invoice_type === 'purchase');

    const totalSales = sales.reduce((s: number, i: any) => s + i.total_amount, 0);
    const totalPurchases = purchases.reduce((s: number, i: any) => s + i.total_amount, 0);
    const totalPaid = (invoices || []).reduce((s: number, i: any) => s + i.paid_amount, 0);
    const totalRemaining = (invoices || []).reduce((s: number, i: any) => s + i.remaining_amount, 0);
    const inventoryValue = (products || []).reduce((s: number, p: any) => s + (p.current_quantity * p.price), 0);

    return NextResponse.json({
        total_sales: totalSales,
        total_purchases: totalPurchases,
        total_profit: totalSales - totalPurchases,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        inventory_value: inventoryValue,
        sales_count: sales.length,
        purchases_count: purchases.length,
        avg_sale: sales.length ? totalSales / sales.length : 0,
        avg_purchase: purchases.length ? totalPurchases / purchases.length : 0,
    });
}
