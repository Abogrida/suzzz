import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/hr/attendance?date=YYYY-MM-DD&employee_id=X
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employee_id');
    let qb = db.from('hr_attendance').select('*, hr_employees(name, job_title)').order('attendance_date', { ascending: false });
    if (date) qb = qb.eq('attendance_date', date);
    if (employeeId) qb = qb.eq('employee_id', employeeId);
    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/hr/attendance
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const db = createAdminClient();
    const body = await req.json();
    // Upsert — if record exists for that day, update it
    const { data, error } = await db.from('hr_attendance').upsert({
        employee_id: body.employee_id,
        attendance_date: body.attendance_date || new Date().toISOString().split('T')[0],
        status: body.status || 'present',
        notes: body.notes || '',
    }, { onConflict: 'employee_id,attendance_date' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
}
