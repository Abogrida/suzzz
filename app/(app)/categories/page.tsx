'use client';
import { useEffect, useState } from 'react';

type Category = { id: number; name: string; description: string; product_count: number };
type Product = { id: number; name: string; category: string; unit: string; current_quantity: number; min_quantity: number; price: number; sale_price: number; barcode: string; warehouse: string };
const n2 = (v: number) => Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

export default function CategoriesPage() {
    const [cats, setCats] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [expandedCat, setExpandedCat] = useState<number | null>(null);
    const [catProducts, setCatProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const load = async () => {
        const data = await fetch('/api/categories').then(r => r.json());
        setCats(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!newName.trim()) return; setSaving(true);
        const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), description: newDesc }) });
        const r = await res.json(); setSaving(false);
        if (res.ok) { setToast({ msg: 'تم الإضافة', type: 'success' }); setNewName(''); setNewDesc(''); load(); }
        else setToast({ msg: r.error || 'خطأ', type: 'error' });
    };

    const handleEdit = async (id: number) => {
        setSaving(true);
        const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
        const r = await res.json(); setSaving(false);
        if (res.ok) { setToast({ msg: 'تم التحديث', type: 'success' }); setEditId(null); load(); }
        else setToast({ msg: r.error || 'خطأ', type: 'error' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('حذف الفئة؟')) return;
        const r = await fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); if (expandedCat === id) setExpandedCat(null); load(); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const toggleExpand = async (cat: Category) => {
        if (expandedCat === cat.id) { setExpandedCat(null); return; }
        setExpandedCat(cat.id);
        setLoadingProducts(true);
        // warehouse=all to get products from ALL warehouses
        const data = await fetch('/api/products?warehouse=all').then(r => r.json());
        const prods = (Array.isArray(data) ? data : []).filter((p: Product) => p.category === cat.name);
        setCatProducts(prods);
        setLoadingProducts(false);
    };

    const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

    // Stats for expanded category
    const cStats = {
        count: catProducts.length,
        totalQty: catProducts.reduce((s, p) => s + p.current_quantity, 0),
        totalValue: catProducts.reduce((s, p) => s + (p.current_quantity * p.price), 0),
        avgPrice: catProducts.length ? catProducts.reduce((s, p) => s + p.sale_price, 0) / catProducts.length : 0,
        low: catProducts.filter(p => p.current_quantity > 0 && p.current_quantity <= p.min_quantity).length,
        out: catProducts.filter(p => p.current_quantity <= 0).length,
        minPrice: catProducts.length ? Math.min(...catProducts.map(p => p.sale_price)) : 0,
        maxPrice: catProducts.length ? Math.max(...catProducts.map(p => p.sale_price)) : 0,
    };

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 26px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900 }}>🏷️ إدارة الفئات</h1>
                <button onClick={() => history.back()} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'Cairo' }}>→ العودة للرئيسية</button>
            </div>

            {/* Add Form */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px 24px', marginBottom: 22 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#16a34a', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</span>
                    إضافة فئة جديدة
                </h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15 }}>اسم الفئة *</label>
                        <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: مواد غذائية" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    </div>
                    <div style={{ flex: 2, minWidth: 240 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15 }}>الوصف (اختياري)</label>
                        <input style={inp} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="وصف مختصر للفئة" />
                    </div>
                    <button onClick={handleAdd} disabled={saving || !newName.trim()} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo', opacity: !newName.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ➕ إضافة
                    </button>
                </div>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 18 }}>⏳ جاري التحميل...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                    {cats.map(c => (
                        <div key={c.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', border: expandedCat === c.id ? '2px solid #0ea5e9' : '1.5px solid #f1f5f9', transition: 'all 0.2s' }}>
                            <div style={{ background: '#f8fafc', padding: '18px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 54, height: 54, background: '#dbeafe', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => handleDelete(c.id)} title="حذف" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>🗑</button>
                                    <button onClick={() => { setEditId(c.id); setEditForm({ name: c.name, description: c.description || '' }) }} title="تعديل" style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>✏️</button>
                                    <button onClick={() => toggleExpand(c)} title="عرض المنتجات" style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>📋</button>
                                </div>
                            </div>
                            {editId === c.id ? (
                                <div style={{ padding: '12px 18px 18px' }}>
                                    <input style={{ ...inp, marginBottom: 10 }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    <input style={{ ...inp, marginBottom: 12 }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="الوصف" />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleEdit(c.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo', flex: 1, textAlign: 'center' as const }}>✅ حفظ</button>
                                        <button onClick={() => setEditId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '8px 18px 18px' }}>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{c.name}</div>
                                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{c.description || 'لا يوجد وصف'}</div>
                                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 700 }}>📊 {c.product_count || 0} منتج</span>
                                        <button onClick={() => toggleExpand(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', fontSize: 20, fontWeight: 900, transform: expandedCat === c.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {cats.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '70px 0', color: '#94a3b8' }}><div style={{ fontSize: 52, marginBottom: 14 }}>🏷️</div><div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا توجد فئات بعد</div></div>}
                </div>
            )}

            {/* Expanded Category Section */}
            {expandedCat && (
                <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', border: '2px solid #e0f2fe' }}>
                    {/* Section Header */}
                    <div style={{ background: '#f0f9ff', padding: '18px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #bae6fd' }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 10 }}>
                            📊 {cats.find(c => c.id === expandedCat)?.name} ({catProducts.length} منتج)
                        </h2>
                        <button onClick={() => setExpandedCat(null)} style={{ background: '#fbbf24', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 6 }}>
                            ✕ إغلاق
                        </button>
                    </div>

                    {loadingProducts ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 44 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div>
                    ) : (
                        <div style={{ padding: 24 }}>
                            {/* Statistics Title */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: 8 }}>📈 إحصائيات الفئة</h3>
                            </div>

                            {/* Stats Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
                                {[
                                    { label: 'عدد المنتجات', value: cStats.count.toString(), color: '#1e293b', bg: '#fff' },
                                    { label: 'إجمالي الكمية', value: cStats.totalQty.toString(), color: '#1e293b', bg: '#fff' },
                                    { label: 'قيمة المخزون', value: `${n2(cStats.totalValue)} ج.م`, color: '#0ea5e9', bg: '#e0f2fe' },
                                    { label: 'متوسط السعر', value: `${n2(cStats.avgPrice)} ج.م`, color: '#1e293b', bg: '#fff' },
                                    { label: 'منخفضة المخزون', value: cStats.low.toString(), color: '#1e293b', bg: '#fff' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 16px', textAlign: 'center', border: s.bg === '#e0f2fe' ? '2px solid #7dd3fc' : '1.5px solid #e2e8f0' }}>
                                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
                                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Range */}
                            {catProducts.length > 0 && (
                                <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 15, color: '#64748b' }}>
                                    أقل سعر: <strong style={{ color: '#16a34a' }}>{n2(cStats.minPrice)} ج.م</strong>
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    أعلى سعر: <strong style={{ color: '#ef4444' }}>{n2(cStats.maxPrice)} ج.م</strong>
                                </div>
                            )}

                            {/* Products Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {catProducts.map((p, i) => (
                                    <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 900, fontSize: 17, color: '#1e293b' }}>{i + 1}. {p.name}</div>
                                                <div style={{ fontSize: 12, marginTop: 3 }}>
                                                    <span style={{ background: p.warehouse === 'suzz1' ? '#e0f2fe' : '#ede9fe', color: p.warehouse === 'suzz1' ? '#0369a1' : '#6366f1', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                                                        {p.warehouse === 'suzz1' ? '📦 suzz1' : '🏛️ رئيسي'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{
                                                background: p.current_quantity <= 0 ? '#fee2e2' : p.current_quantity <= p.min_quantity ? '#fef9c3' : '#dcfce7',
                                                color: p.current_quantity <= 0 ? '#b91c1c' : p.current_quantity <= p.min_quantity ? '#92400e' : '#15803d',
                                                borderRadius: 8, padding: '4px 14px', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' as const
                                            }}>
                                                {p.current_quantity <= 0 ? 'نافذ' : p.current_quantity <= p.min_quantity ? 'منخفض' : 'متوفر'}
                                            </span>
                                        </div>
                                        <div style={{ padding: '0 18px 16px' }}>
                                            {/* Quantity display */}
                                            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', textAlign: 'center', marginBottom: 12, border: '1.5px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 28, fontWeight: 900, color: p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a' }}>{p.current_quantity}</span>
                                                    <span style={{ fontSize: 24 }}>📦</span>
                                                </div>
                                                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{p.unit || 'قطعة'}</div>
                                            </div>
                                            {/* Price & Barcode */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15 }}>
                                                <span style={{ color: '#16a34a', fontWeight: 800 }}>💰 {n2(p.sale_price)} ج.م</span>
                                                <span style={{ color: '#94a3b8', fontSize: 13 }}>{p.barcode ? `🔖 ${p.barcode}` : 'لا يوجد باركود'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {catProducts.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                                        <div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>لا توجد منتجات في هذه الفئة</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
