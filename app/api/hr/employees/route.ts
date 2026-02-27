import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/hr/employees
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const { data, error } = await db.from('hr_employees').select('*').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/hr/employees
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const body = await req.json();
    const { data, error } = await db.from('hr_employees').insert({
        name: body.name,
        job_title: body.job_title || '',
        phone: body.phone || '',
        national_id: body.national_id || '',
        hire_date: body.hire_date || new Date().toISOString().split('T')[0],
        base_salary: parseFloat(body.base_salary) || 0,
        is_active: body.is_active !== false,
        notes: body.notes || '',
        work_start_time: body.work_start_time || '09:00',
        work_end_time: body.work_end_time || '17:00',
        late_threshold_minutes: body.late_threshold_minutes ?? 15,
        off_days: body.off_days || [5, 6],
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
