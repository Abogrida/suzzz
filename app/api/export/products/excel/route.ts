import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// GET /api/export/products/excel
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { data: products } = await db.from('products').select('*').order('name');

    const rows = (products || []).map((p: any) => ({
        'الاسم': p.name,
        'الفئة': p.category,
        'الوحدة': p.unit,
        'الكمية الافتتاحية': p.initial_quantity,
        'الكمية الحالية': p.current_quantity,
        'الحد الأدنى': p.min_quantity,
        'سعر الشراء': p.price,
        'سعر البيع': p.sale_price,
        'الباركود': p.barcode,
        'الوصف': p.description,
        'تاريخ الإضافة': new Date(p.created_at).toLocaleDateString('ar-EG'),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="products-${Date.now()}.xlsx"`,
        },
    });
}
