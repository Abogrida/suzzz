import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/categories
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();

    // Get categories
    const { data: categories, error } = await db
        .from('categories')
        .select('*')
        .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get product count per category
    const { data: products } = await db
        .from('products')
        .select('category');

    const countMap: Record<string, number> = {};
    (products || []).forEach((p: any) => {
        if (p.category) countMap[p.category] = (countMap[p.category] || 0) + 1;
    });

    const formatted = (categories || []).map((c: any) => ({
        ...c,
        product_count: countMap[c.name] || 0,
    }));

    return NextResponse.json(formatted);
}

// POST /api/categories
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const data = await req.json();
    const name = data.name?.trim();

    if (!name) return NextResponse.json({ error: 'اسم الفئة مطلوب' }, { status: 400 });

    const { data: category, error } = await db
        .from('categories')
        .insert({ name, description: data.description || '' })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'الفئة موجودة مسبقاً' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: category.id });
}
