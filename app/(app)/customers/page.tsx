'use client';

import { useEffect, useState } from 'react';

type Customer = { id: number; name: string; phone: string; address: string; customer_type: string; notes: string };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 24px', borderRadius: 12, color: '#fff', fontWeight: 700, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>{msg}</div>;
}

const emptyForm = { name: '', phone: '', address: '', customer_type: 'customer', notes: '' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [tab, setTab] = useState<'customer' | 'supplier'>('customer');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const load = async () => {
        const data = await fetch('/api/customers').then(r => r.json());
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = customers.filter(c =>
        c.customer_type === tab && (!search || c.name.includes(search) || c.phone.includes(search))
    );

    const handleSave = async () => {
        setSaving(true);
        const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
        const method = editing ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const result = await res.json();
        setSaving(false);
        if (res.ok) { setToast({ msg: editing ? 'تم التحديث' : 'تم الإضافة', type: 'success' }); setModalOpen(false); load(); }
        else setToast({ msg: result.message || 'حدث خطأ', type: 'error' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('حذف؟')) return;
        const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) { setToast({ msg: 'تم الحذف', type: 'success' }); load(); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const isSupplier = tab === 'supplier';
    const themeColor = isSupplier ? '#0ea5e9' : '#16a34a';

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">
                    {isSupplier ? '🚛 الموردين' : '👥 العملاء والموردين'}
                </h1>
                <button
                    onClick={() => { setEditing(null); setForm({ ...emptyForm, customer_type: tab }); setModalOpen(true); }}
                    className="btn"
                    style={{ background: themeColor, color: '#fff' }}>
                    ➕ {isSupplier ? 'مورد جديد' : 'عميل جديد'}
                </button>
            </div>

            {/* Tabs + Search */}
            <div className="card" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('customer')}
                    className="btn"
                    style={{ background: tab === 'customer' ? '#16a34a' : '#f1f5f9', color: tab === 'customer' ? '#fff' : '#374151' }}>
                    👥 العملاء
                </button>
                <button onClick={() => setTab('supplier')}
                    className="btn"
                    style={{ background: tab === 'supplier' ? '#0ea5e9' : '#f1f5f9', color: tab === 'supplier' ? '#fff' : '#374151' }}>
                    🚛 الموردين
                </button>
                <div style={{ flex: 1, minWidth: 180 }}>
                    <input value={search} onChange={e => setSearch(e.target.value)} style={inp} placeholder="بحث بالاسم أو الهاتف..." />
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ جاري التحميل...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>لا توجد بيانات</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>لا يوجد {isSupplier ? 'موردين' : 'عملاء'} مسجلين حتى الآن</div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
                            <thead>
                                <tr style={{ background: '#1e293b' }}>
                                    {['#', 'الاسم', 'الهاتف', 'العنوان', 'ملاحظات', 'الإجراءات'].map(h => (
                                        <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600 }}>#{c.id}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: themeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                                    {c.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>📞 {c.phone || '—'}</td>
                                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>📍 {c.address || '—'}</td>
                                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, maxWidth: 160 }}>{c.notes || '—'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => { setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address, customer_type: c.customer_type, notes: c.notes }); setModalOpen(true); }}
                                                    style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✏️</button>
                                                <button onClick={() => handleDelete(c.id)}
                                                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{editing ? '✏️ تعديل' : '➕ إضافة جديد'}</h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {['customer', 'supplier'].map(t => (
                                    <button key={t} onClick={() => setForm({ ...form, customer_type: t })}
                                        style={{ flex: 1, padding: '10px', border: '2px solid', borderColor: form.customer_type === t ? themeColor : '#e2e8f0', borderRadius: 10, background: form.customer_type === t ? themeColor : '#fff', color: form.customer_type === t ? '#fff' : '#374151', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                        {t === 'customer' ? '👥 عميل' : '🚛 مورد'}
                                    </button>
                                ))}
                            </div>
                            {[{ label: 'الاسم *', key: 'name' }, { label: 'الهاتف', key: 'phone' }, { label: 'العنوان', key: 'address' }, { label: 'ملاحظات', key: 'notes' }].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{f.label}</label>
                                    <input style={inp} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
                            <button onClick={handleSave} disabled={saving || !form.name}
                                style={{ flex: 1, background: themeColor, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: !form.name ? 0.6 : 1 }}>
                                {saving ? '⏳...' : '💾 حفظ'}
                            </button>
                            <button onClick={() => setModalOpen(false)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
