import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const chat_id = parseInt(id);
    const supabase = createAdminClient();

    // Fetch messages for this chat
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true })
        .limit(100);

    // Mark messages from others as read
    let updateQuery = supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chat_id);

    if (session.id === 0) {
        // Admin: mark messages from others (non-null) as read
        updateQuery = updateQuery.not('sender_id', 'is', null);
    } else {
        // Employee: mark messages from admin (null) or other employees as read
        updateQuery = updateQuery.or(`sender_id.neq.${session.id},sender_id.is.null`);
    }
    
    await updateQuery;

    return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = getSession(req);
    if (!session || (session.id === undefined && !session.is_admin)) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const chat_id = parseInt(id);
    const { content } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'محتوى الرسالة مطلوب' }, { status: 400 });

    const supabase = createAdminClient();
    
    // 1. Insert message
    const { data, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chat_id,
            sender_id: session.id === 0 ? null : session.id,
            sender_is_admin: session.id === 0,
            content: content
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 2. Update chat with last message info
    await supabase
        .from('chats')
        .update({
            last_message: content,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', chat_id);

    return NextResponse.json(data);
}
