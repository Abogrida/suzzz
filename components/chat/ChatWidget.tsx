'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ChatWidget({ user }: { user: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserList, setShowUserList] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            fetchChats();
            fetchEmployees();
        }
        fetchUnreadCount();
    }, [isOpen]);

    useEffect(scrollToBottom, [messages]);

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;
        
        const channel = supabase
            .channel('global_chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (activeChat && Number(newMsg.chat_id) === Number(activeChat.id)) {
                    setMessages(prev => {
                        // Prevent duplicates if fetchMessages also triggered
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                } else {
                    // If not the active chat, just update counts/list
                    fetchUnreadCount();
                }
                fetchChats();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, activeChat]);

    const fetchChats = async () => {
        const res = await fetch('/api/chat');
        const data = await res.json();
        if (Array.isArray(data)) setChats(data);
    };

    const fetchUnreadCount = async () => {
        const res = await fetch('/api/chat/unread-count');
        const data = await res.json();
        setUnreadCount(data.count || 0);
    };

    const fetchEmployees = async () => {
        const res = await fetch('/api/employees');
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data.filter(e => e.id !== user.id));
    };

    const fetchMessages = async (chatId: number) => {
        const res = await fetch(`/api/chat/${chatId}/messages`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
    };

    const startChat = async (targetEmpId: number) => {
        const res = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ target_emp_id: targetEmpId })
        });
        const data = await res.json();
        if (data.id) {
            // Use the data from the server which has p1/p2 joined
            setActiveChat(data);
            fetchMessages(data.id);
            setShowUserList(false);
        } else {
            console.error('Failed to start chat:', data);
            alert('عذراً، تعذر بدء المحادثة: ' + (data.error || 'خطأ غير معروف'));
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const content = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            chat_id: activeChat.id,
            content,
            sender_id: user.id === 0 ? null : user.id,
            sender_is_admin: user.id === 0,
            created_at: new Date().toISOString(),
            is_optimistic: true // marker to avoid confusion
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const res = await fetch(`/api/chat/${activeChat.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        
        if (data.error) {
            alert('تعذر إرسال الرسالة: ' + data.error);
            // Rollback optimistic update
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            // Replace optimistic message with real one, but ONLY if it's not already there from Realtime
            setMessages(prev => {
                const results = [];
                let replaced = false;
                
                for (const m of prev) {
                    if (m.id === data.id) {
                        // Real message already exists (from Realtime), discard the optimistic one
                        replaced = true;
                        continue; 
                    }
                    if (m.id === tempId) {
                        results.push(data);
                        replaced = true;
                    } else {
                        results.push(m);
                    }
                }
                
                // If by any chance it wasn't replaced (shouldn't happen), add it
                if (!replaced) results.push(data);
                
                return results;
            });
        }
    };

    const isInventoryOnly = user?.permissions?.length === 1 && user?.permissions[0] === '/employee/inventory';
    if (isInventoryOnly || (user?.id === undefined && !user?.is_admin)) return null;

    return (
        <div className="chat-container" style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 100, direction: 'rtl' }}>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: 60, height: 60, borderRadius: '50%', 
                    background: '#6366f1', color: '#fff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)', border: 'none', cursor: 'pointer'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {unreadCount > 0 && !isOpen && (
                    <div style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', width: 24, height: 24, borderRadius: '50%', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #f1f5f9' }}>
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{ position: 'absolute', bottom: 80, left: 0, width: 360, height: 500, background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header */}
                    <div style={{ background: '#6366f1', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {activeChat ? (
                                <>
                                    <button onClick={() => setActiveChat(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight /></button>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                                        {activeChat.participant1_emp_id === user.id || (activeChat.participant1_emp_id === null && user.id === 0) 
                                            ? activeChat.p2?.name 
                                            : (activeChat.p1?.name || 'مدير النظام')}
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: 18, fontWeight: 900 }}>الرسائل</div>
                            )}
                        </div>
                        {!activeChat && (
                            <button 
                                onClick={() => setShowUserList(!showUserList)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 10, padding: '6px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                            >
                                {showUserList ? 'المكاتبات' : 'جديد +'}
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                        {showUserList ? (
                            <div style={{ padding: 12 }}>
                                <div style={{ position: 'relative', marginBottom: 12 }}>
                                    <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input 
                                        type="text" placeholder="بحث عن موظف..." 
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'Cairo' }} 
                                    />
                                </div>
                                {employees.filter(e => e.name.includes(searchQuery)).map(emp => (
                                    <div key={emp.id} onClick={() => startChat(emp.id)} style={{ padding: '12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{emp.name[0]}</div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800 }}>{emp.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{emp.job_title}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeChat ? (
                            <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender_id === user.id || (msg.sender_is_admin && user.id === 0);
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
                                            <div style={{ 
                                                background: isMe ? '#6366f1' : '#fff', 
                                                color: isMe ? '#fff' : '#1e293b',
                                                padding: '10px 14px', borderRadius: 16, 
                                                borderBottomRightRadius: isMe ? 4 : 16,
                                                borderBottomLeftRadius: isMe ? 16 : 4,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                fontSize: 14, fontWeight: 600
                                            }}>
                                                {msg.content}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                                                {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div style={{ padding: 12 }}>
                                    {chats.length === 0 ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>لا توجد محادثات بدأت بعد</div>
                                    ) : (
                                        chats.map(chat => {
                                            // Handle cases where participant1_emp_id is NULL (Admin)
                                            let otherUser;
                                            if (user.id === 0) {
                                                // I am Admin (NULL), look for p2
                                                otherUser = chat.p2;
                                            } else {
                                                // I am Employee. If p1 is NULL, other is Admin. Otherwise, find non-me.
                                                if (chat.participant1_emp_id === null) {
                                                    otherUser = { name: 'مدير النظام' };
                                                } else {
                                                    otherUser = chat.participant1_emp_id === user.id ? chat.p2 : chat.p1;
                                                }
                                            }
                                            
                                            // Fallback for names
                                            const otherName = otherUser?.name || 'مستخدم غير متوفر';

                                            return (
                                                <div key={chat.id} onClick={() => { setActiveChat(chat); fetchMessages(chat.id); setShowUserList(false); }} style={{ padding: '14px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background 0.2s', background: activeChat?.id === chat.id ? '#f1f5f9' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => { if(activeChat?.id !== chat.id) e.currentTarget.style.background = 'transparent' }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>{otherName[0]}</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 15, fontWeight: 800 }}>{otherName}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.last_message || 'ابدأ المحادثة...'}</div>
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                                        {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Input */}
                    {activeChat && !showUserList && (
                        <form onSubmit={sendMessage} style={{ padding: 16, background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                            <input 
                                type="text" placeholder="اكتب رسالتك..." 
                                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                style={{ flex: 1, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'Cairo' }} 
                            />
                            <button type="submit" style={{ width: 44, height: 44, borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
