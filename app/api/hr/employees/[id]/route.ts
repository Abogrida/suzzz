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

    // Partial update payload
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.job_title !== undefined) updateData.job_title = body.job_title || '';
    if (body.phone !== undefined) updateData.phone = body.phone || '';
    if (body.national_id !== undefined) updateData.national_id = body.national_id || '';
    if (body.hire_date !== undefined) updateData.hire_date = body.hire_date;
    if (body.base_salary !== undefined) updateData.base_salary = parseFloat(body.base_salary) || 0;
    if (body.is_active !== undefined) updateData.is_active = body.is_active !== false;
    if (body.notes !== undefined) updateData.notes = body.notes || '';
    if (body.work_start_time !== undefined) updateData.work_start_time = body.work_start_time || '09:00';
    if (body.work_end_time !== undefined) updateData.work_end_time = body.work_end_time || '17:00';
    if (body.late_threshold_minutes !== undefined) updateData.late_threshold_minutes = body.late_threshold_minutes ?? 15;
    if (body.off_days !== undefined) updateData.off_days = body.off_days || [];
    if (body.pin_code !== undefined) updateData.pin_code = body.pin_code;
    if (body.device_id !== undefined) updateData.device_id = body.device_id;

    const { error } = await db.from('hr_employees').update(updateData).eq('id', id);
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
