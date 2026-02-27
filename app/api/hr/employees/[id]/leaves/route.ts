import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/hr/employees/[id]/leaves
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const { id } = await params;
    const db = createAdminClient();
    const { data, error } = await db
        .from('hr_employee_leaves')
        .select('*')
        .eq('employee_id', id)
        .order('leave_start', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/hr/employees/[id]/leaves
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const { id } = await params;
    const db = createAdminClient();
    const body = await req.json();
    if (!body.leave_start || !body.leave_end) {
        return NextResponse.json({ error: 'leave_start and leave_end are required' }, { status: 400 });
    }
    const { data, error } = await db
        .from('hr_employee_leaves')
        .insert({
            employee_id: parseInt(id),
            leave_start: body.leave_start,
            leave_end: body.leave_end,
            leave_type: body.leave_type || 'annual',
            notes: body.notes || '',
        })
        .select()
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
