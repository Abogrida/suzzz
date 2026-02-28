import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// DELETE /api/hr/purchases/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15
) {
    const { id } = await params;

    const db = createAdminClient();
    const { error } = await db
        .from('hr_employee_purchases')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
