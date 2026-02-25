import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// PUT /api/hr/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const { id } = await params;
    const db = createAdminClient();
    const body = await req.json();
    const { error } = await db.from('hr_employees').update({
        name: body.name,
        job_title: body.job_title || '',
        phone: body.phone || '',
        national_id: body.national_id || '',
        hire_date: body.hire_date,
        base_salary: parseFloat(body.base_salary) || 0,
        is_active: body.is_active !== false,
        notes: body.notes || '',
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}

// DELETE /api/hr/employees/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const { id } = await params;
    const db = createAdminClient();
    const { error } = await db.from('hr_employees').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
