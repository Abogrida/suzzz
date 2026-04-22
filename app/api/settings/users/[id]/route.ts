import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// PUT /api/settings/users/[id] - Update a user
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id: idParam } = await params;
    const supabase = createAdminClient();
    const body = await req.json();
    const id = Number(idParam);

    if (isNaN(id)) return NextResponse.json({ error: 'معرف مستخدم غير صالح' }, { status: 400 });

    const updateData: any = {
        name: body.name,
        role: body.role || 'staff',
        job_title: body.job_title || '',
        permissions: body.permissions || [],
        is_active: body.is_active !== false,
        is_system_user: true
    };

    if (body.password) {
        updateData.password = body.password;
    }

    const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
}

// DELETE /api/settings/users/[id] - Delete a user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id: idParam } = await params;
    const supabase = createAdminClient();
    const id = Number(idParam);

    if (isNaN(id)) return NextResponse.json({ error: 'معرف مستخدم غير صالح' }, { status: 400 });

    const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
