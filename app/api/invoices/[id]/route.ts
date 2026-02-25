import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// GET /api/invoices/[id]
export async function GET(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const { data, error } = await db
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single();

    if (error || !data) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    return NextResponse.json(data);
}

// DELETE /api/invoices/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();

    // Get invoice items to reverse stock
    const { data: invoice } = await db
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single();

    if (invoice) {
        for (const item of (invoice.invoice_items || [])) {
            if (item.product_id) {
                const { data: prod } = await db.from('products').select('current_quantity').eq('id', item.product_id).single();
                if (prod) {
                    // Reverse stock change
                    const reverseQty = invoice.invoice_type === 'sale'
                        ? prod.current_quantity + item.quantity
                        : prod.current_quantity - item.quantity;
                    await db.from('products').update({ current_quantity: Math.max(0, reverseQty) }).eq('id', item.product_id);
                }
            }
        }
    }

    // Delete invoice items and invoice (cascade handles items)
    const { error } = await db.from('invoices').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });

    return NextResponse.json({ success: true, message: 'تم حذف الفاتورة' });
}
