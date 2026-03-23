'use client';

import { useEffect, useState, useCallback } from 'react';
import { StickyNote, Plus, Trash2, Check, X, Search, Pencil, Clock, CheckCircle2 } from 'lucide-react';

type Note = {
    id: number;
    title: string;
    content: string;
    category: 'general' | 'payment' | 'important' | 'other';
    status: 'pending' | 'done';
    created_at: string;
    updated_at: string;
};

const CATEGORIES = [
    { value: 'general', label: 'عام', icon: '📝', color: '#6366f1' },
    { value: 'payment', label: 'مدفوعات', icon: '💸', color: '#16a34a' },
    { value: 'important', label: 'مهم', icon: '🔴', color: '#ef4444' },
    { value: 'other', label: 'غير ذلك', icon: '📌', color: '#f59e0b' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { title: '', content: '', category: 'general' as Note['category'] };

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [editNote, setEditNote] = useState<Note | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterCat) params.set('category', filterCat);
        if (filterStatus) params.set('status', filterStatus);
        const res = await fetch('/api/notes?' + params.toString());
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
        setLoading(false);
    }, [filterCat, filterStatus]);

    useEffect(() => { load(); }, [load]);

    const filtered = notes.filter(n => {
        if (!search) return true;
        return n.title.includes(search) || n.content.includes(search);
    });

    const openCreate = () => { setEditNote(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (n: Note) => { setEditNote(n); setForm({ title: n.title, content: n.content, category: n.category }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditNote(null); };

    const handleSave = async () => {
        if (!form.title.trim() && !form.content.trim()) return;
        setSaving(true);
        try {
            if (editNote) {
                await fetch(`/api/notes/${editNote.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            } else {
                await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            }
            closeForm();
            await load();
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (note: Note) => {
        const newStatus = note.status === 'done' ? 'pending' : 'done';
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: newStatus } : n));
        await fetch(`/api/notes/${note.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        setNotes(prev => prev.filter(n => n.id !== id));
        setDeletingId(null);
    };

    const pendingCount = notes.filter(n => n.status === 'pending').length;
    const doneCount = notes.filter(n => n.status === 'done').length;

    return (
        <div style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
            {/* Header */}
            <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, background: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StickyNote size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>📋 ملاحظات الشغل</h1>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                            <span style={{ color: '#f59e0b' }}>⏳ {pendingCount} قيد الانتظار</span>
                            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#16a34a' }}>✅ {doneCount} تمت</span>
                        </div>
                    </div>
                </div>
                <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={18} /> ملاحظة جديدة
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        className="form-input"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الملاحظات..."
                        style={{ paddingRight: 36, background: '#fff' }}
                    />
                </div>
                <select className="form-input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
                    <option value="">📂 كل التصنيفات</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
                <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
                    <option value="">📋 كل الحالات</option>
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="done">✅ تمت</option>
                </select>
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>جاري التحميل...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                    <div style={{ fontSize: 64, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>لا توجد ملاحظات</div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>ابدأ بإضافة ملاحظة جديدة من الزر أعلاه</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                    {filtered.map(note => {
                        const cat = CAT_MAP[note.category] ?? CAT_MAP.general;
                        const isDone = note.status === 'done';
                        return (
                            <div key={note.id} className="card" style={{
                                borderRight: `5px solid ${cat.color}`,
                                opacity: isDone ? 0.72 : 1,
                                transition: 'all 0.2s',
                                position: 'relative',
                                padding: '16px 18px',
                            }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, background: cat.color + '18', padding: '2px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 6 }}>
                                            {cat.icon} {cat.label}
                                        </span>
                                        {note.title && (
                                            <div style={{ fontSize: 16, fontWeight: 900, color: isDone ? '#94a3b8' : '#1e293b', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4 }}>
                                                {note.title}
                                            </div>
                                        )}
                                    </div>
                                    {/* Status badge */}
                                    {isDone
                                        ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>✅ تمت</span>
                                        : <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef9c3', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>⏳ معلقة</span>
                                    }
                                </div>

                                {/* Content */}
                                {note.content && (
                                    <div style={{ fontSize: 15, color: isDone ? '#94a3b8' : '#374151', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {note.content}
                                    </div>
                                )}

                                {/* Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10, gap: 6 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {fmt(note.created_at)}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {/* Toggle Done */}
                                        <button
                                            onClick={() => toggleStatus(note)}
                                            title={isDone ? 'إلغاء التنفيذ' : 'تحديد كتم'}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, background: isDone ? '#f1f5f9' : '#dcfce7', color: isDone ? '#64748b' : '#16a34a', transition: 'all 0.15s' }}
                                        >
                                            <CheckCircle2 size={14} /> {isDone ? 'إلغاء' : 'تم'}
                                        </button>
                                        {/* Edit */}
                                        <button
                                            onClick={() => openEdit(note)}
                                            title="تعديل"
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            title="حذف"
                                            disabled={deletingId === note.id}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div onClick={closeForm} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />
                    <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', zIndex: 1, direction: 'rtl' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>
                                {editNote ? '✏️ تعديل الملاحظة' : '➕ ملاحظة جديدة'}
                            </h2>
                            <button onClick={closeForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 14 }}>التصنيف</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {CATEGORIES.map(c => (
                                    <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value as Note['category'] }))}
                                        style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${form.category === c.value ? c.color : '#e2e8f0'}`, background: form.category === c.value ? c.color + '18' : '#f8fafc', color: form.category === c.value ? c.color : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', fontFamily: 'Cairo, sans-serif' }}
                                    >
                                        {c.icon} {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 14 }}>العنوان</label>
                            <input
                                className="form-input"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="مثلاً: دفع فودافون كاش - أحمد محمد"
                            />
                        </div>

                        {/* Content */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 14 }}>التفاصيل</label>
                            <textarea
                                className="form-input"
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                rows={5}
                                placeholder={'مثلاً:\nأحمد محمد دفع 350 جنيه عن طريق فودافون كاش\nالمبلغ المفروض يتحول لحساب الشركة\nرقم المعاملة: 123456'}
                                style={{ resize: 'vertical', lineHeight: 1.7 }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={closeForm} className="btn btn-secondary">إلغاء</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
                                {saving ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
