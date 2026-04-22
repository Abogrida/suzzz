import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// PATCH /api/notes/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = await params;
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const body = await req.json();
    const id = Number(rawId);

    const updates: Record<string, string> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.category !== undefined) updates.category = body.category;
    if (body.status !== undefined) updates.status = body.status;

    const { data: note, error } = await db.from('work_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, note });
}

// DELETE /api/notes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = await params;
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const id = Number(rawId);

    const { error } = await db.from('work_notes').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
