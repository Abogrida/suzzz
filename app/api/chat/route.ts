import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const supabase = createAdminClient();
    
    // Fetch chats
    // Admin (ID 0) is participant1_emp_id = null
    let query = supabase
        .from('chats')
        .select(`
            *,
            p1:employees!participant1_emp_id(id, name, job_title),
            p2:employees!participant2_emp_id(id, name, job_title)
        `);

    if (session.id === 0) {
        query = query.or('participant1_emp_id.is.null');
    } else {
        query = query.or(`participant1_emp_id.eq.${session.id},participant2_emp_id.eq.${session.id},and(participant1_emp_id.is.null,participant2_emp_id.eq.${session.id})`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const session = getSession(req);
    if (!session || session.id === undefined) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { target_emp_id } = await req.json();
    if (target_emp_id === undefined) return NextResponse.json({ error: 'يجب تحديد الموظف' }, { status: 400 });

    const supabase = createAdminClient();

    // Admin (ID 0) is always NULL in DB participant1_emp_id field
    let p1, p2;
    if (session.id === 0 || target_emp_id === 0) {
        p1 = null;
        p2 = session.id === 0 ? target_emp_id : session.id;
    } else {
        [p1, p2] = [session.id, target_emp_id].sort((a, b) => a - b);
    }

    // Manual search first to handle NULL in uniqueness (Admin case)
    let query = supabase.from('chats').select('*');
    
    if (p1 === null) {
        query = query.is('participant1_emp_id', null).eq('participant2_emp_id', p2);
    } else {
        query = query.eq('participant1_emp_id', p1).eq('participant2_emp_id', p2);
    }

    const { data: existingChat } = await query
        .select(`
            *,
            p1:employees!participant1_emp_id(id, name, job_title),
            p2:employees!participant2_emp_id(id, name, job_title)
        `)
        .maybeSingle();

    if (existingChat) {
        return NextResponse.json(existingChat);
    }

    // Create new if not exist
    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({ participant1_emp_id: p1, participant2_emp_id: p2 })
        .select(`
            *,
            p1:employees!participant1_emp_id(id, name, job_title),
            p2:employees!participant2_emp_id(id, name, job_title)
        `)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(newChat);
}
