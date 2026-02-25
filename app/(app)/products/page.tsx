'use client';
import { useEffect, useState } from 'react';

type Product = { id: number; name: string; category: string; unit: string; current_quantity: number; min_quantity: number; initial_quantity: number; price: number; sale_price: number; barcode: string; description: string; };
type FilterMode = 'all' | 'low' | 'out';
const n2 = (v: number) => Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const empty = { name: '', category: '', unit: '', initial_quantity: 0, current_quantity: 0, min_quantity: 0, price: 0, sale_price: 0, barcode: '', description: '' };
const S: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [stockModal, setStockModal] = useState<{ type: 'add' | 'withdraw'; product: Product } | null>(null);
    const [movModal, setMovModal] = useState(false);
    const [movements, setMovements] = useState<any[]>([]);
    const [movSearch, setMovSearch] = useState('');
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState(empty);
    const [stockQty, setStockQty] = useState('');
    const [stockNotes, setStockNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const load = async () => {
        setLoading(true);
        const [p, c] = await Promise.all([fetch('/api/products').then(r => r.json()), fetch('/api/categories').then(r => r.json())]);
        setProducts(Array.isArray(p) ? p : []);
        setCategories((Array.isArray(c) ? c : []).map((x: any) => x.name));
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const stats = { total: products.length, value: products.reduce((s, p) => s + (p.current_quantity * p.price), 0), low: products.filter(p => p.current_quantity > 0 && p.current_quantity <= p.min_quantity).length, out: products.filter(p => p.current_quantity <= 0).length };

    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        const ms = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
        const mf = filterMode === 'all' ? true : filterMode === 'low' ? (p.current_quantity > 0 && p.current_quantity <= p.min_quantity) : (p.current_quantity <= 0);
        return ms && mf;
    });

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch(editing ? `/api/products/${editing.id}` : '/api/products', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const r = await res.json(); setSaving(false);
        if (res.ok) { setToast({ msg: editing ? 'تم التحديث' : 'تم الإضافة', type: 'success' }); setModalOpen(false); load(); }
        else setToast({ msg: r.message || 'حدث خطأ', type: 'error' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل تريد حذف هذا المنتج؟')) return;
        const r = await fetch(`/api/products/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); load(); } else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const handleStock = async () => {
        if (!stockModal || !stockQty) return; setSaving(true);
        const r = await fetch(`/api/products/${stockModal.product.id}/${stockModal.type === 'add' ? 'add' : 'withdraw'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: stockQty, notes: stockNotes }) }).then(r => r.json());
        setSaving(false);
        if (r.success) { setToast({ msg: r.message, type: 'success' }); setStockModal(null); setStockQty(''); setStockNotes(''); load(); }
        else setToast({ msg: r.message, type: 'error' });
    };

    const loadMov = async () => { const d = await fetch('/api/movements').then(r => r.json()); setMovements(Array.isArray(d) ? d : []); };
    const fMov = movements.filter(m => !movSearch || (m.product_name || '').includes(movSearch));

    const cs = (a: boolean, c: string, bg: string): React.CSSProperties => ({
        background: a ? bg : '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: a ? '0 6px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.07)',
        borderRight: `6px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transform: a ? 'translateY(-3px)' : 'none', transition: 'all 0.2s', outline: a ? `2px solid ${c}` : 'none', outlineOffset: 2,
    });

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 24 }}>📦 إدارة المنتجات</h1>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 24 }}>
                <div onClick={() => setFilterMode('all')} style={cs(filterMode === 'all', '#0ea5e9', '#e0f2fe')}>
                    <div><div style={{ fontSize: 32, fontWeight: 900, color: '#0ea5e9' }}>{stats.total}</div><div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>إجمالي المنتجات</div></div>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                </div>
                <div style={cs(false, '#16a34a', '#dcfce7')}>
                    <div><div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>{Math.floor(stats.value).toLocaleString('en-US')}</div><div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>قيمة المخزون (ج.م)</div></div>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💰</div>
                </div>
                <div onClick={() => setFilterMode(filterMode === 'low' ? 'all' : 'low')} style={cs(filterMode === 'low', '#f59e0b', '#fef9c3')}>
                    <div><div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b' }}>{stats.low}</div><div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>⚡ منخفضة — اضغط للفلتر</div></div>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚠️</div>
                </div>
                <div onClick={() => setFilterMode(filterMode === 'out' ? 'all' : 'out')} style={cs(filterMode === 'out', '#ef4444', '#fee2e2')}>
                    <div><div style={{ fontSize: 32, fontWeight: 900, color: '#ef4444' }}>{stats.out}</div><div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>⚡ نافذة — اضغط للفلتر</div></div>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>❌</div>
                </div>
            </div>

            {filterMode !== 'all' && <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ background: filterMode === 'low' ? '#fef9c3' : '#fee2e2', color: filterMode === 'low' ? '#92400e' : '#b91c1c', borderRadius: 10, padding: '8px 20px', fontWeight: 800, fontSize: 15 }}>
                    {filterMode === 'low' ? `⚠️ فلتر: منخفضة — ${filtered.length} منتج` : `❌ فلتر: نافذة — ${filtered.length} منتج`}
                </span>
                <button onClick={() => setFilterMode('all')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontFamily: 'Cairo', color: '#374151', fontWeight: 700, fontSize: 15 }}>✕ إلغاء الفلتر</button>
            </div>}

            {/* Toolbar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <button onClick={() => { setEditing(null); setForm(empty); setModalOpen(true) }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>＋ إضافة منتج</button>
                <button onClick={load} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>🔄 تحديث</button>
                <button onClick={() => { loadMov(); setMovModal(true) }} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>📋 سجل الحركات</button>
                <a href="/api/export/products/excel" style={{ background: '#059669', color: '#fff', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 16, textDecoration: 'none', fontFamily: 'Cairo' }}>📥 تصدير</a>
                <div style={{ flex: 1, minWidth: 240 }}><input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S, background: '#f8fafc' }} placeholder="ابحث عن منتج..." /></div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {loading ? <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 44 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div> :
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: '#1e293b' }}>
                            {['الرقم', 'اسم المنتج', 'الفئة', 'الوحدة', 'الكمية', 'السعر', 'سعر البيع', 'الحالة', 'الإجراءات'].map(h => <th key={h} style={{ padding: '18px 20px', color: '#fff', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 16 }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.map((p, i) => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>#{p.id}</td>
                                <td style={{ padding: '16px 20px' }}><div style={{ fontWeight: 800, color: '#1e293b', fontSize: 17 }}>{p.name}</div>{p.barcode && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>🔖 {p.barcode}</div>}</td>
                                <td style={{ padding: '16px 20px' }}>{p.category ? <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 8, padding: '5px 14px', fontSize: 15, fontWeight: 700 }}>{p.category}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                <td style={{ padding: '16px 20px', color: '#475569', fontSize: 16, fontWeight: 700 }}>{p.unit || '—'}</td>
                                <td style={{ padding: '16px 20px', fontWeight: 900, fontSize: 24 }}>
                                    <span style={{ color: p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a' }}>{p.current_quantity}</span>
                                    {p.unit && <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}> {p.unit}</span>}
                                </td>
                                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#374151', fontSize: 16 }}>{n2(p.price)}</td>
                                <td style={{ padding: '16px 20px', fontWeight: 900, color: '#16a34a', fontSize: 18 }}>{n2(p.sale_price)}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    {p.current_quantity <= 0 ? <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 800 }}>نافذ</span>
                                        : p.current_quantity <= p.min_quantity ? <span style={{ background: '#fef9c3', color: '#92400e', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 800 }}>منخفض</span>
                                            : <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 800 }}>متوفر</span>}
                                </td>
                                <td style={{ padding: '16px 20px' }}><div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => setStockModal({ type: 'add', product: p })} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, width: 38, height: 38, cursor: 'pointer', fontSize: 20, fontWeight: 900 }}>+</button>
                                    <button onClick={() => setStockModal({ type: 'withdraw', product: p })} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, width: 38, height: 38, cursor: 'pointer', fontSize: 22, fontWeight: 900 }}>−</button>
                                    <button onClick={() => { setEditing(p); setForm({ ...p }); setModalOpen(true) }} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, width: 38, height: 38, cursor: 'pointer', fontSize: 16 }}>✏️</button>
                                    <button onClick={() => handleDelete(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, width: 38, height: 38, cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                                </div></td>
                            </tr>)}
                            {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div><div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>{filterMode !== 'all' ? 'لا توجد منتجات في هذا الفلتر' : 'لا توجد منتجات'}</div>
                            </td></tr>}
                        </tbody>
                    </table>}
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 70px rgba(0,0,0,0.25)' }}>
                    <div style={{ background: editing ? '#0ea5e9' : '#16a34a', borderRadius: '20px 20px 0 0', padding: '22px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{editing ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}</h2>
                        <button onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', fontSize: 20 }}>✕</button>
                    </div>
                    <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>اسم المنتج *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الفئة</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...S, background: '#fff' }}><option value="">-- اختر --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الوحدة</label><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={S} placeholder="كجم، قطعة..." /></div>
                        {!editing && <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الكمية الافتتاحية</label><input type="number" value={form.initial_quantity} onChange={e => setForm({ ...form, initial_quantity: parseFloat(e.target.value) || 0 })} style={S} /></div>}
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الحد الأدنى</label><input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>سعر الشراء</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>سعر البيع</label><input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الباركود</label><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={S} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...S, resize: 'vertical' }} /></div>
                    </div>
                    <div style={{ padding: '0 28px 28px', display: 'flex', gap: 12 }}>
                        <button onClick={handleSave} disabled={saving || !form.name} style={{ background: editing ? '#0ea5e9' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontWeight: 900, fontSize: 17, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!form.name || saving) ? 0.6 : 1 }}>{saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}</button>
                        <button onClick={() => setModalOpen(false)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                    </div>
                </div>
            </div>}

            {/* Stock Modal */}
            {stockModal && <div onClick={() => setStockModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 440, boxShadow: '0 30px 70px rgba(0,0,0,0.25)' }}>
                    <div style={{ background: stockModal.type === 'add' ? '#16a34a' : '#f59e0b', borderRadius: '20px 20px 0 0', padding: '22px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>{stockModal.type === 'add' ? '➕ إضافة مخزون' : '➖ سحب'}</h2>
                        <button onClick={() => setStockModal(null)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, width: 38, height: 38, cursor: 'pointer', fontSize: 19 }}>✕</button>
                    </div>
                    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1.5px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 18 }}>{stockModal.product.name}</div>
                            <div style={{ color: '#64748b', fontSize: 16, marginTop: 6 }}>الكمية الحالية: <strong style={{ color: '#1e293b', fontSize: 18 }}>{stockModal.product.current_quantity}</strong> {stockModal.product.unit}</div>
                        </div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 16 }}>الكمية *</label><input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} autoFocus style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 16 }}>ملاحظات</label><input value={stockNotes} onChange={e => setStockNotes(e.target.value)} placeholder="سبب..." style={S} /></div>
                    </div>
                    <div style={{ padding: '0 28px 28px', display: 'flex', gap: 12 }}>
                        <button onClick={handleStock} disabled={saving || !stockQty} style={{ flex: 1, background: stockModal.type === 'add' ? '#16a34a' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 900, fontSize: 17, cursor: 'pointer', fontFamily: 'Cairo' }}>{saving ? '⏳...' : stockModal.type === 'add' ? '✅ إضافة' : '✅ سحب'}</button>
                        <button onClick={() => setStockModal(null)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                    </div>
                </div>
            </div>}

            {/* Movements Modal */}
            {movModal && <div onClick={() => setMovModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(0,0,0,0.3)' }}>
                    <div style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: '22px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>📋 سجل حركات المخزون</h2>
                        <button onClick={() => setMovModal(false)} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', fontSize: 20 }}>✕</button>
                    </div>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input value={movSearch} onChange={e => setMovSearch(e.target.value)} placeholder="ابحث..." style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'Cairo', outline: 'none' }} />
                        <span style={{ fontSize: 15, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>إجمالي: <strong>{fMov.length}</strong></span>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#1e293b', position: 'sticky', top: 0 }}>
                                {['#', 'المنتج', 'النوع', 'الكمية', 'ملاحظات', 'التاريخ'].map(h => <th key={h} style={{ padding: '16px 20px', color: '#fff', fontWeight: 800, textAlign: 'right', fontSize: 16 }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {fMov.map((m, i) => <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 700 }}>#{m.id}</td>
                                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#1e293b', fontSize: 16 }}>{m.product_name || '—'}</td>
                                    <td style={{ padding: '14px 20px' }}><span style={{ background: m.movement_type === 'إضافة' ? '#dcfce7' : '#fee2e2', color: m.movement_type === 'إضافة' ? '#15803d' : '#b91c1c', borderRadius: 8, padding: '5px 16px', fontWeight: 800, fontSize: 14 }}>{m.movement_type === 'إضافة' ? '▲ إضافة' : '▼ سحب'}</span></td>
                                    <td style={{ padding: '14px 20px', fontWeight: 900, fontSize: 20, color: m.movement_type === 'إضافة' ? '#16a34a' : '#ef4444' }}>{m.quantity}</td>
                                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 15 }}>{m.notes || '—'}</td>
                                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 14 }}>{new Date(m.created_at).toLocaleString('en-US')}</td>
                                </tr>)}
                                {fMov.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}><div style={{ fontSize: 44, marginBottom: 12 }}>📊</div><div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>لا توجد حركات</div></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>}
        </div>
    );
}
