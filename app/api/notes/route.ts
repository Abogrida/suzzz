import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/notes
export async function GET(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    let qb = db.from('work_notes').select('*').order('created_at', { ascending: false });

    if (status) qb = qb.eq('status', status);
    if (category) qb = qb.eq('category', category);
    if (q) qb = qb.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/notes
export async function POST(req: NextRequest) {
    const authError = requireAuth(req);
    if (authError) return authError;

    const db = createAdminClient();
    const body = await req.json();

    const { data: note, error } = await db.from('work_notes').insert({
        title: body.title || '',
        content: body.content || '',
        category: body.category || 'general',
        status: body.status || 'pending',
    }).select().single();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, note });
}
