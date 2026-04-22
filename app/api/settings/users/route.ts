import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

// GET /api/settings/users - List all system users
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('employees')
        .select('id, name, role, job_title, permissions, is_active, created_at, is_system_user')
        .eq('is_system_user', true)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/settings/users - Create a new user
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const supabase = createAdminClient();
    const body = await req.json();

    const { data, error } = await supabase
        .from('employees')
        .insert({
            name: body.name,
            password: body.password,
            role: body.role || 'staff',
            job_title: body.job_title || '',
            permissions: body.permissions || [],
            is_active: body.is_active !== false,
            is_system_user: true
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
}
