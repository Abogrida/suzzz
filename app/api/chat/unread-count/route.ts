import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session || (session.id === undefined && !session.is_admin)) return NextResponse.json({ count: 0 });

    const supabase = createAdminClient();

    // Which chats are mine?
    let chatQuery = supabase.from('chats').select('id');
    if (session.id === 0) {
        chatQuery = chatQuery.is('participant1_emp_id', null);
    } else {
        chatQuery = chatQuery.or(`participant1_emp_id.eq.${session.id},participant2_emp_id.eq.${session.id},and(participant1_emp_id.is.null,participant2_emp_id.eq.${session.id})`);
    }

    const { data: myChats } = await chatQuery;
    const chatIds = myChats?.map(c => c.id) || [];

    // Query messages where sender is NOT me AND chat belongs to me AND is_read is false
    let messageQuery = supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .in('chat_id', chatIds);

    if (session.id === 0) {
        // Admin: sender MUST NOT be NULL (since Admin's own messages are NULL)
        messageQuery = messageQuery.not('sender_id', 'is', null);
    } else {
        // Employee: sender MUST NOT be them (id) AND could be NULL (Admin)
        messageQuery = messageQuery.or(`sender_id.neq.${session.id},sender_id.is.null`);
    }

    const { count, error } = await messageQuery;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    return NextResponse.json({ count: count || 0 });
}
