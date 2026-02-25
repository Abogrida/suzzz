import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/reports/monthly-financial
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const { data: invoices } = await db
        .from('invoices')
        .select('invoice_type,total_amount,created_at')
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31T23:59:59`);

    // Group by month
    const monthlyMap: { [key: string]: { sales: number; purchases: number; sales_count: number; purchases_count: number } } = {};

    for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        monthlyMap[key] = { sales: 0, purchases: 0, sales_count: 0, purchases_count: 0 };
    }

    for (const inv of (invoices || [])) {
        const month = inv.created_at.slice(0, 7);
        if (!monthlyMap[month]) continue;

        if (inv.invoice_type === 'sale') {
            monthlyMap[month].sales += inv.total_amount;
            monthlyMap[month].sales_count++;
        } else {
            monthlyMap[month].purchases += inv.total_amount;
            monthlyMap[month].purchases_count++;
        }
    }

    const result = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        ...data,
        profit: data.sales - data.purchases,
    }));

    return NextResponse.json(result);
}
