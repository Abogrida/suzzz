import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/recipes - Get all menu items with their recipe ingredients
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const db = createAdminClient();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        let query = db.from('menu_items').select(`
            *,
            recipe_items (
                id,
                product_id,
                manual_name,
                quantity,
                unit,
                products (
                    name,
                    unit
                )
            )
        `).order('name');

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/recipes - Create or update a menu item and its recipe
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const db = createAdminClient();
        const body = await req.json();
        const { id, name, category, price, description, items } = body;

        // items is an array of { product_id, quantity, unit }

        if (id) {
            // UPDATE
            const { error: updateError } = await db.from('menu_items').update({
                name,
                category: category || '',
                price: parseFloat(price) || 0,
                description: description || '',
            }).eq('id', id);

            if (updateError) throw updateError;

            // Delete old recipe items and insert new ones
            await db.from('recipe_items').delete().eq('menu_item_id', id);

            if (items && items.length > 0) {
                const recipeItems = items.map((item: any) => ({
                    menu_item_id: id,
                    product_id: item.product_id || null,
                    manual_name: item.manual_name || null,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || '',
                }));
                const { error: recipeError } = await db.from('recipe_items').insert(recipeItems);
                if (recipeError) throw recipeError;
            }

            return NextResponse.json({ success: true, message: 'تم تحديث المنتج بنجاح' });
        } else {
            // CREATE
            const { data: newItem, error: insertError } = await db.from('menu_items').insert({
                name,
                category: category || '',
                price: parseFloat(price) || 0,
                description: description || '',
            }).select().single();

            if (insertError) throw insertError;

            if (items && items.length > 0) {
                const recipeItems = items.map((item: any) => ({
                    menu_item_id: newItem.id,
                    product_id: item.product_id || null,
                    manual_name: item.manual_name || null,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || '',
                }));
                const { error: recipeError } = await db.from('recipe_items').insert(recipeItems);
                if (recipeError) throw recipeError;
            }

            return NextResponse.json({ success: true, id: newItem.id, message: 'تم إضافة المنتج بنجاح' });
        }
    } catch (error: any) {
        console.error('Recipe API Error:', error);
        let message = error.message;

        // Handle Supabase unique constraint error (usually 23505)
        if (error.code === '23505') {
            message = 'هذا الاسم موجود بالفعل، يرجى اختيار اسم آخر';
        }

        return NextResponse.json({ success: false, message }, { status: 400 });
    }
}
