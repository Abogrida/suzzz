import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const body = await req.json();

    // Partial update allowed
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.check_in_time !== undefined) updateData.check_in_time = body.check_in_time;
    if (body.check_out_time !== undefined) updateData.check_out_time = body.check_out_time;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await db
        .from('hr_attendance')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { error } = await db.from('hr_attendance').delete().eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
