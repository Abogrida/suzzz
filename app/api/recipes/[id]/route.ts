import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// DELETE /api/recipes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const { id } = await params;
        const db = createAdminClient();

        // Cascade delete will handle recipe_items
        const { error } = await db.from('menu_items').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
