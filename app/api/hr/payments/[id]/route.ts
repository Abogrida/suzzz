import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// DELETE /api/hr/payments/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const { error } = await db.from('hr_payments').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
