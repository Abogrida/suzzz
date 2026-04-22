'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = { id: number; name: string; category: string; unit: string; current_quantity: number; min_quantity: number; initial_quantity: number; price: number; sale_price: number; barcode: string; description: string; };
type FilterMode = 'all' | 'low' | 'out';
const n2 = (v: number) => Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const empty = { name: '', category: '', unit: '', initial_quantity: 0, current_quantity: 0, min_quantity: 0, price: 0, sale_price: 0, barcode: '', description: '' };
const S: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

export default function Suzz1WarehousePage() {
    const router = useRouter();
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
        const [p, c] = await Promise.all([
            fetch('/api/products?warehouse=suzz1').then(r => r.json()),
            fetch('/api/categories').then(r => r.json())
        ]);
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
        const body = { ...form, warehouse: 'suzz1' };
        const res = await fetch(editing ? `/api/products/${editing.id}` : '/api/products', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
        background: a ? bg : '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: a ? '0 6px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.07)',
        borderRight: `6px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transform: a ? 'translateY(-3px)' : 'none', transition: 'all 0.2s', outline: a ? `2px solid ${c}` : 'none', outlineOffset: 2,
    });

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                <span onClick={() => router.push('/products')} style={{ cursor: 'pointer', color: '#0ea5e9', fontWeight: 700 }}>🏭 المخزن</span>
                <span>{'›'}</span>
                <span style={{ color: '#1e293b' }}>📦 المخزن الفرعي (suzz1)</span>
            </div>

            <h1 className="page-title" style={{ marginBottom: 20 }}>📦 المخزن الفرعي <span style={{ color: '#0ea5e9' }}>(suzz1)</span></h1>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div onClick={() => setFilterMode('all')} style={cs(filterMode === 'all', '#0ea5e9', '#e0f2fe')}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>{stats.total}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 700 }}>إجمالي المنتجات</div>
                    </div>
                </div>
                <div style={cs(false, '#16a34a', '#dcfce7')}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: '#bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💰</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{Math.floor(stats.value).toLocaleString('en-US')}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 700 }}>قيمة المخزون (ج.م)</div>
                    </div>
                </div>
                <div onClick={() => setFilterMode(filterMode === 'low' ? 'all' : 'low')} style={cs(filterMode === 'low', '#f59e0b', '#fef9c3')}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⚠️</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{stats.low}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 700 }}>⚡ منخفضة — اضغط للفلتر</div>
                    </div>
                </div>
                <div onClick={() => setFilterMode(filterMode === 'out' ? 'all' : 'out')} style={cs(filterMode === 'out', '#ef4444', '#fee2e2')}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>❌</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{stats.out}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 700 }}>⚡ نافذة — اضغط للفلتر</div>
                    </div>
                </div>
            </div>

            {filterMode !== 'all' && <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className={`badge ${filterMode === 'low' ? 'badge-yellow' : 'badge-red'}`} style={{ padding: '8px 20px', fontWeight: 800, fontSize: 15 }}>
                    {filterMode === 'low' ? `⚠️ فلتر: منخفضة — ${filtered.length} منتج` : `❌ فلتر: نافذة — ${filtered.length} منتج`}
                </span>
                <button onClick={() => setFilterMode('all')} className="btn btn-secondary">✕ إلغاء الفلتر</button>
            </div>}

            {/* Toolbar */}
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => { setEditing(null); setForm(empty); setModalOpen(true) }} className="btn btn-success">＋ إضافة منتج</button>
                <button onClick={load} className="btn btn-primary" style={{ background: '#0ea5e9' }}>🔄 تحديث</button>
                <button onClick={() => { loadMov(); setMovModal(true) }} className="btn btn-primary" style={{ background: '#6366f1' }}>📋 الحركات</button>
                <a href="/api/export/products/excel?warehouse=suzz1" className="btn btn-success" style={{ background: '#059669', textDecoration: 'none' }}>📥 تصدير</a>
                <div style={{ flex: 1, minWidth: 200 }}><input className="form-input" value={search} onChange={e => setSearch(e.target.value)} style={{ background: '#f8fafc' }} placeholder="ابحث عن منتج..." /></div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }}></div><div style={{ color: '#64748b', fontSize: 16, marginTop: 12 }}>جاري التحميل...</div></div> :
                    <>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead><tr>
                                    {['الرقم', 'اسم المنتج', 'الفئة', 'الوحدة', 'الكمية', 'السعر', 'سعر البيع', 'الحالة', 'الإجراءات'].map(h => <th key={h}>{h}</th>)}
                                </tr></thead>
                                <tbody>
                                    {filtered.map((p) => <tr key={p.id}>
                                        <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{p.id}</td>
                                        <td><div style={{ fontWeight: 800, color: '#1e293b' }}>{p.name}</div>{p.barcode && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>🔖 {p.barcode}</div>}</td>
                                        <td>{p.category ? <span className="badge badge-blue">{p.category}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                        <td style={{ color: '#475569', fontWeight: 700 }}>{p.unit || '—'}</td>
                                        <td style={{ fontWeight: 900, fontSize: 20 }}>
                                            <span style={{ color: p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a' }}>{p.current_quantity}</span>
                                            {p.unit && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}> {p.unit}</span>}
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#374151' }}>{n2(p.price)}</td>
                                        <td style={{ fontWeight: 900, color: '#16a34a' }}>{n2(p.sale_price)}</td>
                                        <td>
                                            {p.current_quantity <= 0 ? <span className="badge badge-red">نافذ</span>
                                                : p.current_quantity <= p.min_quantity ? <span className="badge badge-yellow">منخفض</span>
                                                    : <span className="badge badge-green">متوفر</span>}
                                        </td>
                                        <td><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <button onClick={() => setStockModal({ type: 'add', product: p })}
                                                style={{ width: 42, height: 42, borderRadius: 10, background: '#16a34a', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                            <button onClick={() => setStockModal({ type: 'withdraw', product: p })}
                                                style={{ width: 42, height: 42, borderRadius: 10, background: '#f59e0b', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                            <button onClick={() => { setEditing(p); setForm({ ...p }); setModalOpen(true) }}
                                                style={{ width: 42, height: 42, borderRadius: 10, background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                                            <button onClick={() => handleDelete(p.id)}
                                                style={{ width: 42, height: 42, borderRadius: 10, background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                                        </div></td>
                                    </tr>)}
                                    {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                        <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                                        <div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>لا توجد منتجات — اضغط "إضافة منتج" للبدء</div>
                                    </td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Card Layout for Products */}
                        <div className="mobile-card-rows" style={{ padding: '12px' }}>
                            {filtered.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>لا توجد منتجات مطابقة</div>
                                </div>
                            ) : filtered.map((p) => {
                                const statusColor = p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a';
                                return (
                                    <div key={p.id} className="mobile-card-row" style={{ borderRight: `5px solid ${statusColor}` }}>
                                        <div className="mobile-card-row-header">
                                            <div className="mobile-card-row-title">
                                                {p.name}
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 700 }}>#{p.id} {p.barcode && `| 🔖 ${p.barcode}`}</div>
                                            </div>
                                            {p.current_quantity <= 0 ? <span className="badge badge-red">نافذ</span>
                                                : p.current_quantity <= p.min_quantity ? <span className="badge badge-yellow">منخفض</span>
                                                    : <span className="badge badge-green">متوفر</span>}
                                        </div>
                                        <div className="mobile-card-row-body">
                                            <div className="mobile-card-row-field">
                                                <span className="mobile-card-row-label">الفئة</span>
                                                <span className="mobile-card-row-value">{p.category || '—'}</span>
                                            </div>
                                            <div className="mobile-card-row-field" style={{ alignItems: 'flex-end', textAlign: 'left' }}>
                                                <span className="mobile-card-row-label">الكمية</span>
                                                <span className="mobile-card-row-value" style={{ fontSize: 18, color: statusColor }}>{p.current_quantity} <small style={{ fontSize: 10, color: '#94a3b8' }}>{p.unit}</small></span>
                                            </div>
                                            <div className="mobile-card-row-field mt-1">
                                                <span className="mobile-card-row-label">سعر الشراء</span>
                                                <span className="mobile-card-row-value">{n2(p.price)} ج.م</span>
                                            </div>
                                            <div className="mobile-card-row-field mt-1" style={{ alignItems: 'flex-end', textAlign: 'left' }}>
                                                <span className="mobile-card-row-label">سعر البيع</span>
                                                <span className="mobile-card-row-value" style={{ color: '#16a34a', fontSize: 16 }}>{n2(p.sale_price)} ج.م</span>
                                            </div>
                                        </div>
                                        <div className="mobile-card-row-actions">
                                            <button onClick={() => setStockModal({ type: 'add', product: p })}
                                                className="btn btn-success" style={{ padding: '8px', fontSize: 18 }}>＋</button>
                                            <button onClick={() => setStockModal({ type: 'withdraw', product: p })}
                                                className="btn btn-warning" style={{ padding: '8px', fontSize: 18, color: '#fff' }}>−</button>
                                            <button onClick={() => { setEditing(p); setForm({ ...p }); setModalOpen(true) }}
                                                className="btn btn-primary" style={{ padding: '8px' }}>✏️</button>
                                            <button onClick={() => handleDelete(p.id)}
                                                className="btn btn-danger" style={{ padding: '8px' }}>🗑️</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                }
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 70px rgba(0,0,0,0.25)' }}>
                    <div style={{ background: editing ? '#0ea5e9' : '#16a34a', borderRadius: '20px 20px 0 0', padding: '18px 22px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{editing ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}</h2>
                        <button onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>اسم المنتج *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الفئة</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...S, background: '#fff' }}><option value="">-- اختر --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الوحدة</label><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={S} placeholder="كجم، قطعة..." /></div>
                        {!editing && <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الكمية الافتتاحية</label><input type="number" value={form.initial_quantity} onChange={e => setForm({ ...form, initial_quantity: parseFloat(e.target.value) || 0 })} style={S} /></div>}
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الحد الأدنى</label><input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>سعر الشراء</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>سعر البيع</label><input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} style={S} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الباركود</label><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={S} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...S, resize: 'vertical' }} /></div>
                    </div>
                    <div style={{ padding: '0 22px 22px', display: 'flex', gap: 12 }}>
                        <button onClick={handleSave} disabled={saving || !form.name} style={{ background: editing ? '#0ea5e9' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 30px', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!form.name || saving) ? 0.6 : 1 }}>{saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}</button>
                        <button onClick={() => setModalOpen(false)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '13px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                    </div>
                </div>
            </div>}

            {/* Stock Modal */}
            {stockModal && <div onClick={() => setStockModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '90%', maxWidth: 440, boxShadow: '0 30px 70px rgba(0,0,0,0.25)' }}>
                    <div style={{ background: stockModal.type === 'add' ? '#16a34a' : '#f59e0b', borderRadius: '20px 20px 0 0', padding: '18px 22px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{stockModal.type === 'add' ? '➕ إضافة مخزون' : '➖ سحب'}</h2>
                        <button onClick={() => setStockModal(null)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, border: '1.5px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 17 }}>{stockModal.product.name}</div>
                            <div style={{ color: '#64748b', fontSize: 15, marginTop: 6 }}>الكمية الحالية: <strong style={{ color: '#1e293b' }}>{stockModal.product.current_quantity}</strong> {stockModal.product.unit}</div>
                        </div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>الكمية *</label><input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} autoFocus style={S} /></div>
                        <div><label style={{ display: 'block', fontWeight: 800, marginBottom: 8, fontSize: 14 }}>ملاحظات</label><input value={stockNotes} onChange={e => setStockNotes(e.target.value)} placeholder="سبب..." style={S} /></div>
                    </div>
                    <div style={{ padding: '0 22px 22px', display: 'flex', gap: 12 }}>
                        <button onClick={handleStock} disabled={saving || !stockQty} style={{ flex: 1, background: stockModal.type === 'add' ? '#16a34a' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>{saving ? '⏳...' : stockModal.type === 'add' ? '✅ إضافة' : '✅ سحب'}</button>
                        <button onClick={() => setStockModal(null)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '13px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                    </div>
                </div>
            </div>}

            {/* Movements Modal */}
            {movModal && <div onClick={() => setMovModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(0,0,0,0.3)' }}>
                    <div style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: '18px 22px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>📋 سجل حركات المخزون</h2>
                        <button onClick={() => setMovModal(false)} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input value={movSearch} onChange={e => setMovSearch(e.target.value)} placeholder="ابحث..." style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Cairo', outline: 'none' }} />
                        <span style={{ fontSize: 14, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>إجمالي: <strong>{fMov.length}</strong></span>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
                                <thead><tr style={{ background: '#1e293b', position: 'sticky', top: 0 }}>
                                    {['#', 'المنتج', 'النوع', 'الكمية', 'ملاحظات', 'التاريخ'].map(h => <th key={h} style={{ padding: '14px 16px', color: '#fff', fontWeight: 800, textAlign: 'right', fontSize: 14 }}>{h}</th>)}
                                </tr></thead>
                                <tbody>
                                    {fMov.map((m, i) => <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>#{m.id}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1e293b' }}>{m.product_name || '—'}</td>
                                        <td style={{ padding: '12px 16px' }}><span style={{ background: m.movement_type === 'إضافة' ? '#dcfce7' : '#fee2e2', color: m.movement_type === 'إضافة' ? '#15803d' : '#b91c1c', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{m.movement_type === 'إضافة' ? '▲ إضافة' : '▼ سحب'}</span></td>
                                        <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 18, color: m.movement_type === 'إضافة' ? '#16a34a' : '#ef4444' }}>{m.quantity}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{m.notes || '—'}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>{new Date(m.created_at).toLocaleString('en-US')}</td>
                                    </tr>)}
                                    {fMov.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}><div style={{ fontSize: 40, marginBottom: 10 }}>📊</div><div style={{ fontWeight: 800, fontSize: 16, color: '#374151' }}>لا توجد حركات</div></td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card Layout for Movements */}
                        <div className="mobile-card-rows" style={{ padding: '12px' }}>
                            {fMov.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: '#374151' }}>لا توجد حركات</div>
                                </div>
                            ) : fMov.map((m) => (
                                <div key={m.id} className="mobile-card-row" style={{ borderRight: `5px solid ${m.movement_type === 'إضافة' ? '#16a34a' : '#ef4444'}` }}>
                                    <div className="mobile-card-row-header">
                                        <div className="mobile-card-row-title">
                                            {m.product_name || '—'}
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 700 }}>#{m.id}</div>
                                        </div>
                                        <span style={{ background: m.movement_type === 'إضافة' ? '#dcfce7' : '#fee2e2', color: m.movement_type === 'إضافة' ? '#15803d' : '#b91c1c', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                                            {m.movement_type === 'إضافة' ? '▲ إضافة' : '▼ سحب'}
                                        </span>
                                    </div>
                                    <div className="mobile-card-row-body">
                                        <div className="mobile-card-row-field">
                                            <span className="mobile-card-row-label">الكمية</span>
                                            <span className="mobile-card-row-value" style={{ fontSize: 18, color: m.movement_type === 'إضافة' ? '#16a34a' : '#ef4444' }}>{m.quantity}</span>
                                        </div>
                                        <div className="mobile-card-row-field" style={{ alignItems: 'flex-end', textAlign: 'left' }}>
                                            <span className="mobile-card-row-label">التاريخ</span>
                                            <span className="mobile-card-row-value" style={{ fontSize: 12 }}>{new Date(m.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        {m.notes && (
                                            <div className="mobile-card-row-field" style={{ gridColumn: 'span 2' }}>
                                                <span className="mobile-card-row-label">ملاحظات</span>
                                                <span className="mobile-card-row-value" style={{ fontStyle: 'italic', color: '#64748b' }}>{m.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>}
        </div>
    );
}
