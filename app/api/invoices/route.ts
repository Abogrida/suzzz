import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/invoices
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'sale' or 'purchase'
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let qb = db.from('invoices')
        .select('*, invoice_items(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (type) qb = qb.eq('invoice_type', type);
    if (from) qb = qb.gte('created_at', from);
    if (to) qb = qb.lte('created_at', to + 'T23:59:59');

    const { data, error, count } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ invoices: data, total: count });
}

// POST /api/invoices
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const data = await req.json();

    // Generate invoice number
    const now = new Date();
    const prefix = data.invoice_type === 'sale' ? 'S' : 'P';
    const invoiceNumber = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    const items = data.items || [];
    const totalAmount = items.reduce((sum: number, item: any) =>
        sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);
    const paidAmount = parseFloat(data.paid_amount) || 0;
    const remainingAmount = totalAmount - paidAmount;

    let paymentStatus = 'unpaid';
    if (paidAmount >= totalAmount) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    // Create invoice
    const { data: invoice, error: invError } = await db.from('invoices').insert({
        invoice_number: invoiceNumber,
        invoice_type: data.invoice_type,
        customer_id: data.customer_id || null,
        customer_name: data.customer_name || '',
        customer_phone: data.customer_phone || '',
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
        payment_method: data.payment_method || 'cash',
        notes: data.notes || '',
    }).select().single();

    if (invError) return NextResponse.json({ success: false, message: invError.message }, { status: 400 });

    // Insert items and update stock
    for (const item of items) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);

        await db.from('invoice_items').insert({
            invoice_id: invoice.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: qty,
            price,
            total: qty * price,
        });

        // Update stock
        if (item.product_id) {
            const { data: prod } = await db.from('products').select('current_quantity').eq('id', item.product_id).single();
            if (prod) {
                const newQty = data.invoice_type === 'sale'
                    ? prod.current_quantity - qty
                    : prod.current_quantity + qty;
                await db.from('products').update({ current_quantity: newQty }).eq('id', item.product_id);
                await db.from('stock_movements').insert({
                    product_id: item.product_id,
                    movement_type: data.invoice_type === 'sale' ? 'سحب' : 'إضافة',
                    quantity: qty,
                    notes: `فاتورة رقم ${invoiceNumber}`,
                });
            }
        }
    }

    return NextResponse.json({ success: true, invoice_id: invoice.id, invoice_number: invoiceNumber });
}
