import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// GET /api/export/products/excel
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { data: products } = await db
        .from('products')
        .select('*')
        .order('category')
        .order('name');

    const date = new Date().toLocaleDateString('ar-EG');

    // ترتيب المنتجات وتصنيفها
    let rowNum = 1;
    const rows = (products || []).map((p: any) => {
        const status =
            p.current_quantity <= 0
                ? 'نافذ'
                : p.current_quantity <= p.min_quantity
                    ? 'منخفض'
                    : 'متوفر';
        return {
            'م': rowNum++,
            'اسم المنتج': p.name,
            'الفئة': p.category || '—',
            'الوحدة': p.unit || '—',
            'الكمية': p.current_quantity,
            'الحد الأدنى': p.min_quantity,
            'الحالة': status,
        };
    });

    const wb = XLSX.utils.book_new();

    // ======= Sheet 1: كشف المخزن =======
    const wsData: any[][] = [];

    // الهيدر الرئيسي
    wsData.push(['كشف المخزن']);
    wsData.push([`تاريخ الكشف: ${date}`]);
    wsData.push([`إجمالي المنتجات: ${rows.length} منتج`]);
    wsData.push([]); // سطر فاضي

    // رؤوس الأعمدة
    wsData.push(['م', 'اسم المنتج', 'الفئة', 'الوحدة', 'الكمية', 'الحد الأدنى', 'الحالة']);

    // البيانات
    rows.forEach(r => {
        wsData.push([
            r['م'],
            r['اسم المنتج'],
            r['الفئة'],
            r['الوحدة'],
            r['الكمية'],
            r['الحد الأدنى'],
            r['الحالة'],
        ]);
    });

    // ملخص في النهاية
    wsData.push([]);
    wsData.push(['ملخص الحالة']);
    wsData.push(['متوفر', rows.filter(r => r['الحالة'] === 'متوفر').length]);
    wsData.push(['منخفض', rows.filter(r => r['الحالة'] === 'منخفض').length]);
    wsData.push(['نافذ', rows.filter(r => r['الحالة'] === 'نافذ').length]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // عرض الأعمدة
    ws['!cols'] = [
        { wch: 5 },   // م
        { wch: 30 },  // اسم المنتج
        { wch: 18 },  // الفئة
        { wch: 10 },  // الوحدة
        { wch: 10 },  // الكمية
        { wch: 12 },  // الحد الأدنى
        { wch: 10 },  // الحالة
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'كشف المخزن');

    // ======= Sheet 2: منخفض ونافذ =======
    const alertRows = rows.filter(r => r['الحالة'] !== 'متوفر');
    if (alertRows.length > 0) {
        const ws2Data: any[][] = [];
        ws2Data.push(['منتجات تحتاج تدخل']);
        ws2Data.push([`تاريخ: ${date}`]);
        ws2Data.push([]);
        ws2Data.push(['م', 'اسم المنتج', 'الفئة', 'الوحدة', 'الكمية', 'الحد الأدنى', 'الحالة']);
        alertRows.forEach(r => {
            ws2Data.push([r['م'], r['اسم المنتج'], r['الفئة'], r['الوحدة'], r['الكمية'], r['الحد الأدنى'], r['الحالة']]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
        ws2['!cols'] = ws['!cols'];
        XLSX.utils.book_append_sheet(wb, ws2, 'تنبيهات المخزن');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `كشف-المخزن-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
    });
}
