import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const data = await req.json();

    const { error } = await db.from('customers').update({
        name: data.name,
        phone: data.phone || '',
        address: data.address || '',
        notes: data.notes || '',
    }).eq('id', id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}

// DELETE /api/customers/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const db = createAdminClient();
    const { error } = await db.from('customers').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
