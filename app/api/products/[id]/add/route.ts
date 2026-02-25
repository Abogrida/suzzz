import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// POST /api/products/[id]/add
export async function POST(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const data = await req.json();
    const quantity = parseFloat(data.quantity) || 0;
    const notes = data.notes || '';

    // Update current_quantity
    const { data: product, error: fetchError } = await db
        .from('products')
        .select('current_quantity')
        .eq('id', id)
        .single();

    if (fetchError || !product) {
        return NextResponse.json({ success: false, message: 'المنتج غير موجود' }, { status: 404 });
    }

    const { error } = await db.from('products').update({
        current_quantity: product.current_quantity + quantity,
    }).eq('id', id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });

    // Log movement
    await db.from('stock_movements').insert({
        product_id: parseInt(id),
        movement_type: 'إضافة',
        quantity,
        notes,
    });

    return NextResponse.json({ success: true, message: 'تم إضافة الكمية بنجاح' });
}
