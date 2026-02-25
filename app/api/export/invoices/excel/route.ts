import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// GET /api/export/invoices/excel
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let qb = db.from('invoices').select('*').order('created_at', { ascending: false });
    if (type) qb = qb.eq('invoice_type', type);

    const { data: invoices } = await qb;

    const rows = (invoices || []).map((inv: any) => ({
        'رقم الفاتورة': inv.invoice_number,
        'النوع': inv.invoice_type === 'sale' ? 'مبيعات' : 'مشتريات',
        'العميل/المورد': inv.customer_name,
        'هاتف': inv.customer_phone,
        'الإجمالي': inv.total_amount,
        'المدفوع': inv.paid_amount,
        'المتبقي': inv.remaining_amount,
        'حالة الدفع': inv.payment_status === 'paid' ? 'مدفوع' : inv.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع',
        'طريقة الدفع': inv.payment_method === 'cash' ? 'نقدي' : inv.payment_method === 'bank' ? 'بنك' : 'شيك',
        'التاريخ': new Date(inv.created_at).toLocaleDateString('ar-EG'),
        'ملاحظات': inv.notes,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="invoices-${Date.now()}.xlsx"`,
        },
    });
}
