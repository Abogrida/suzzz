import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// DELETE /api/hr/employees/[id]/leaves/[leaveId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; leaveId: string }> }
) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const { leaveId } = await params;
    const db = createAdminClient();
    const { error } = await db
        .from('hr_employee_leaves')
        .delete()
        .eq('id', leaveId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
