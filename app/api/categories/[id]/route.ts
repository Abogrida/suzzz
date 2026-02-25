import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const data = await req.json();
    const name = data.name?.trim();

    if (!name) return NextResponse.json({ error: 'اسم الفئة مطلوب' }, { status: 400 });

    // Get old category name
    const { data: oldCat } = await db.from('categories').select('name').eq('id', id).single();

    const { error } = await db.from('categories').update({
        name,
        description: data.description || '',
    }).eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Update products with old category name
    if (oldCat && oldCat.name !== name) {
        await db.from('products').update({ category: name }).eq('category', oldCat.name);
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/categories/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();

    const { data: cat } = await db.from('categories').select('name').eq('id', id).single();
    if (cat) {
        await db.from('products').update({ category: null }).eq('category', cat.name);
    }

    const { error } = await db.from('categories').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
