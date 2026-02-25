import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const { data, error } = await db.from('products').select('*').eq('id', id).single();

    if (error || !data) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    return NextResponse.json(data);
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const data = await req.json();

    const { error } = await db.from('products').update({
        name: data.name,
        category: data.category || '',
        unit: data.unit || '',
        min_quantity: parseFloat(data.min_quantity) || 0,
        price: parseFloat(data.price) || 0,
        sale_price: parseFloat(data.sale_price) || 0,
        barcode: data.barcode || '',
        description: data.description || '',
    }).eq('id', id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'تم تحديث المنتج بنجاح' });
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();

    // Delete related stock movements first
    await db.from('stock_movements').delete().eq('product_id', id);
    const { error } = await db.from('products').delete().eq('id', id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' });
}
