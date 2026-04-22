import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useChat(userId: number | undefined) {
    const [chats, setChats] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!userId) return;
        const res = await fetch('/api/chat');
        const data = await res.json();
        if (Array.isArray(data)) setChats(data);
        setLoading(false);
    }, [userId]);

    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;
        const res = await fetch('/api/chat/unread-count');
        const data = await res.json();
        if (typeof data.count === 'number') setUnreadCount(data.count);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        fetchChats();
        fetchUnreadCount();

        // Subscribe to changes in chats and messages
        const chatChannel = supabase
            .channel('chat_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchChats();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.new.sender_id !== userId) {
                    fetchUnreadCount();
                }
                fetchChats(); // Update last message in list
            })
            .subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
        };
    }, [userId, fetchChats, fetchUnreadCount]);

    return { chats, unreadCount, loading, refresh: fetchChats };
}
