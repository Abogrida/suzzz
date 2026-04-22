'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Search, ChevronRight, Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import getSessionServer from '@/lib/session-server';

export default function ChatPage() {
    const [user, setUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserList, setShowUserList] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/session');
                const data = await res.json();
                setUser(data.user);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (user?.id !== undefined) {
            fetchChats();
            fetchEmployees();
        }
    }, [user?.id]);

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
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
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

    const fetchEmployees = async () => {
        const res = await fetch('/api/employees');
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data.filter(e => e.id !== user?.id));
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

        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            chat_id: activeChat.id,
            content,
            sender_id: user.id === 0 ? null : user.id,
            sender_is_admin: user.id === 0,
            created_at: new Date().toISOString(),
            is_optimistic: true
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const res = await fetch(`/api/chat/${activeChat.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        
        if (data.error) {
            alert('تعذر إرسال الرسالة: ' + data.error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            setMessages(prev => {
                const results = [];
                let replaced = false;
                
                for (const m of prev) {
                    if (m.id === data.id) {
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
                
                if (!replaced) results.push(data);
                
                return results;
            });
        }
    };

    const isInventoryOnly = user?.permissions?.length === 1 && user?.permissions[0] === '/employee/inventory';
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (isInventoryOnly || (user?.id === undefined && !user?.is_admin)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-600 text-xl">ليس لديك صلاحية للدخول إلى المحادثات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Chats List */}
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
                {/* Header */}
                <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">الرسائل</h1>
                    <button 
                        onClick={() => setShowUserList(!showUserList)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white rounded-lg px-3 py-2 text-sm font-bold cursor-pointer transition-all"
                    >
                        {showUserList ? 'المكاتبات' : 'جديد +'}
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {showUserList ? (
                        <div className="p-3">
                            <div className="relative mb-3">
                                <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" placeholder="بحث عن موظف..." 
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full px-10 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm" 
                                />
                            </div>
                            {employees.filter(e => e.name.includes(searchQuery)).map(emp => (
                                <div key={emp.id} onClick={() => startChat(emp.id)} className="p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">{emp.name[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold">{emp.name}</div>
                                        <div className="text-xs text-gray-500">{emp.job_title}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3">
                            {chats.length === 0 ? (
                                <div className="p-10 text-center text-gray-500">لا توجد محادثات</div>
                            ) : (
                                chats.map(chat => {
                                    let otherUser;
                                    if (user.id === 0) {
                                        otherUser = chat.p2;
                                    } else {
                                        if (chat.participant1_emp_id === null) {
                                            otherUser = { name: 'مدير النظام' };
                                        } else {
                                            otherUser = chat.participant1_emp_id === user.id ? chat.p2 : chat.p1;
                                        }
                                    }
                                    
                                    const otherName = otherUser?.name || 'مستخدم غير متوفر';

                                    return (
                                        <div key={chat.id} onClick={() => { setActiveChat(chat); fetchMessages(chat.id); setShowUserList(false); }} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-100'}`}>
                                            <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">{otherName[0]}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold">{otherName}</div>
                                                <div className="text-xs text-gray-500 truncate">{chat.last_message || 'ابدأ المحادثة...'}</div>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="bg-indigo-600 text-white p-4 flex items-center gap-3">
                            <button onClick={() => setActiveChat(null)} className="bg-transparent border-none text-white cursor-pointer p-2 hover:bg-indigo-700 rounded">
                                <ChevronRight size={24} />
                            </button>
                            <div className="text-lg font-bold">
                                {activeChat.participant1_emp_id === user.id || (activeChat.participant1_emp_id === null && user.id === 0) 
                                    ? activeChat.p2?.name 
                                    : (activeChat.p1?.name || 'مدير النظام')}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === user.id || (msg.sender_is_admin && user.id === 0);
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-xs ${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                                            <p className="text-sm font-semibold">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${isMe ? 'text-indigo-100' : 'text-gray-500'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white flex gap-2">
                            <input 
                                type="text" placeholder="اكتب رسالتك..." 
                                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm" 
                            />
                            <button type="submit" className="w-10 h-10 rounded-lg bg-indigo-600 text-white border-none cursor-pointer flex items-center justify-center hover:bg-indigo-700 transition-colors">
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">اختر محادثة أو ابدأ محادثة جديدة</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
