import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// POST /api/products/[id]/withdraw
export async function POST(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const data = await req.json();
    const quantity = parseFloat(data.quantity) || 0;
    const notes = data.notes || '';

    // Check available quantity
    const { data: product, error: fetchError } = await db
        .from('products')
        .select('current_quantity, name')
        .eq('id', id)
        .single();

    if (fetchError || !product) {
        return NextResponse.json({ success: false, message: 'المنتج غير موجود' }, { status: 404 });
    }

    if (product.current_quantity < quantity) {
        return NextResponse.json({
            success: false,
            message: `الكمية المتاحة غير كافية. المتوفر: ${product.current_quantity}`,
        }, { status: 400 });
    }

    const { error } = await db.from('products').update({
        current_quantity: product.current_quantity - quantity,
    }).eq('id', id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });

    // Log movement
    await db.from('stock_movements').insert({
        product_id: parseInt(id),
        movement_type: 'سحب',
        quantity,
        notes,
    });

    return NextResponse.json({ success: true, message: 'تم السحب بنجاح' });
}
