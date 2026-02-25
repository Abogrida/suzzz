'use client';

import { useEffect, useState } from 'react';
import { Phone, MapPin } from 'lucide-react';

type Customer = { id: number; name: string; phone: string; address: string; customer_type: string; notes: string };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 24px', borderRadius: 12, color: '#fff', fontWeight: 700, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>{msg}</div>;
}

const emptyForm = { name: '', phone: '', address: '', customer_type: 'customer', notes: '' };
const inp = { width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' as const };

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
        <div style={{ padding: 24, direction: 'rtl', background: '#f8fafc', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ background: themeColor, borderRadius: 14, padding: '16px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 800 }}>
                    {isSupplier ? '🚛 تقارير العملاء والموردين - الموردين' : '👥 تقارير العملاء والموردين'}
                </h1>
                <button onClick={() => history.back()} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                    ← رجوع
                </button>
            </div>

            {/* Tabs + Search */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('customer')}
                    style={{ background: tab === 'customer' ? '#16a34a' : '#f1f5f9', color: tab === 'customer' ? '#fff' : '#374151', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    👥 العملاء
                </button>
                <button onClick={() => setTab('supplier')}
                    style={{ background: tab === 'supplier' ? '#0ea5e9' : '#f1f5f9', color: tab === 'supplier' ? '#fff' : '#374151', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🚛 الموردين
                </button>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <input value={search} onChange={e => setSearch(e.target.value)} style={inp} placeholder="بحث..." />
                </div>
                <button onClick={() => { setEditing(null); setForm({ ...emptyForm, customer_type: tab }); setModalOpen(true); }}
                    style={{ background: themeColor, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ➕ {isSupplier ? 'مورد جديد' : 'عميل جديد'}
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ جاري التحميل...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>لا توجد بيانات</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>لا يوجد {isSupplier ? 'موردين' : 'عملاء'} مسجلين حتى الآن</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: '#1e293b' }}>
                                {['#', 'الاسم', 'الهاتف', 'العنوان', 'ملاحظات', 'الإجراءات'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', color: '#fff', fontWeight: 600, textAlign: 'right' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600 }}>#{c.id}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: themeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#475569' }}>📞 {c.phone || '—'}</td>
                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>📍 {c.address || '—'}</td>
                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, maxWidth: 200 }}>{c.notes || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => { setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address, customer_type: c.customer_type, notes: c.notes }); setModalOpen(true); }}
                                                style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 15 }}>✏️</button>
                                            <button onClick={() => handleDelete(c.id)}
                                                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 15 }}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{editing ? '✏️ تعديل' : '➕ إضافة جديد'}</h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
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
