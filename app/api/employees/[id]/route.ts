import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('employees').delete().eq('id', params.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { name, password, is_active } = body;
        const supabase = createAdminClient();

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (password !== undefined) updates.password = password;
        if (is_active !== undefined) updates.is_active = is_active;

        const { error } = await supabase.from('employees').update(updates).eq('id', params.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'خطأ في معالجة الطلب' }, { status: 400 });
    }
}
