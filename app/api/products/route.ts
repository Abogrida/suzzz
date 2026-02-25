import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/products
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const db = createAdminClient();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const category = searchParams.get('category');
        const lowStock = searchParams.get('low_stock');

        let qb = db.from('products').select('*').order('name');

        if (query) {
            qb = qb.or(`name.ilike.%${query}%,category.ilike.%${query}%,barcode.ilike.%${query}%`);
        }
        if (category) {
            qb = qb.eq('category', category);
        }

        const { data, error } = await qb;
        if (error) throw error;

        // Filter low stock client-side (current_quantity <= min_quantity)
        const result = lowStock === 'true'
            ? (data || []).filter((p: any) => p.current_quantity <= p.min_quantity)
            : data;

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/products
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const db = createAdminClient();
        const data = await req.json();

        const productData = {
            name: data.name,
            category: data.category || '',
            unit: data.unit || '',
            initial_quantity: parseFloat(data.initial_quantity) || 0,
            current_quantity: parseFloat(data.initial_quantity) || 0,
            min_quantity: parseFloat(data.min_quantity) || 0,
            price: parseFloat(data.price) || 0,
            sale_price: parseFloat(data.sale_price) || 0,
            barcode: data.barcode || '',
            description: data.description || '',
        };

        const { data: product, error } = await db
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;

        // Log initial stock movement
        if (productData.initial_quantity > 0) {
            await db.from('stock_movements').insert({
                product_id: product.id,
                movement_type: 'إضافة',
                quantity: productData.initial_quantity,
                notes: 'رصيد افتتاحي',
            });
        }

        return NextResponse.json({ success: true, id: product.id, message: 'تم إضافة المنتج بنجاح' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
