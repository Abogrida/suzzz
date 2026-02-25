'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import Link from 'next/link';

type Stats = { total_products: number; total_value: number; low_stock: number; out_of_stock: number };
type InvStats = { total_sales: number; total_purchases: number; profit: number; sale_count: number; purchase_count: number };
type Product = { id: number; name: string; current_quantity: number; min_quantity: number; price: number; sale_price: number; unit: string; category: string; barcode: string };

const n0 = (v: number) => Math.floor(v || 0).toLocaleString('en-US');
const n2 = (v: number) => Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [invStats, setInvStats] = useState<InvStats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/statistics').then(r => r.json()),
            fetch('/api/invoices/statistics').then(r => r.json()),
            fetch('/api/products?limit=50').then(r => r.json()),
        ]).then(([s, iv, p]) => {
            setStats(s);
            setInvStats(iv);
            setProducts(Array.isArray(p) ? p : []);
            setLoading(false);
        });
    }, []);

    const filtered = products.filter(p => !search || p.name.includes(search) || p.category.includes(search));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen flex-col gap-4" style={{ direction: 'rtl' }}>
            <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
            <div className="text-slate-500 font-bold" style={{ fontFamily: 'Cairo' }}>جاري التحميل...</div>
        </div>
    );

    return (
        <div className="page-content" style={{ direction: 'rtl' }}>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">📊 لوحة التحكم</h1>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <Link href="/invoices/purchase" className="btn btn-secondary">
                        ➕ فاتورة شراء
                    </Link>
                    <Link href="/invoices/sale" className="btn btn-primary">
                        ➕ فاتورة بيع
                    </Link>
                </div>
            </div>

            {/* Stat Cards Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                {[
                    { label: 'إجمالي المنتجات', value: stats?.total_products ?? 0, icon: '📦', color: '#0ea5e9', bg: '#e0f2fe', border: '#0ea5e9' },
                    { label: 'قيمة المخزون (ج.م)', value: n0(stats?.total_value ?? 0), icon: '💰', color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
                    { label: 'منخفضة المخزون', value: stats?.low_stock ?? 0, icon: '⚠️', color: '#f59e0b', bg: '#fef9c3', border: '#f59e0b' },
                    { label: 'منتجات نافذة', value: stats?.out_of_stock ?? 0, icon: '❌', color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ borderRight: `6px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                        </div>
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{s.icon}</div>
                    </div>
                ))}
            </div>

            {/* Invoice Stats Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                {[
                    { label: 'إجمالي المبيعات', value: n2(invStats?.total_sales ?? 0), sub: `${invStats?.sale_count ?? 0} فاتورة`, color: '#16a34a', border: '#16a34a', icon: '📈' },
                    { label: 'إجمالي المشتريات', value: n2(invStats?.total_purchases ?? 0), sub: `${invStats?.purchase_count ?? 0} فاتورة`, color: '#0ea5e9', border: '#0ea5e9', icon: '📉' },
                    { label: 'صافي الربح', value: n2(invStats?.profit ?? 0), sub: '', color: (invStats?.profit ?? 0) >= 0 ? '#6366f1' : '#ef4444', border: '#6366f1', icon: '💵' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ borderRight: `4px solid ${s.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 22 }}>{s.icon}</span>
                            <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        {s.sub && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.sub}</div>}
                    </div>
                ))}
            </div>

            {/* All Products Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b' }}>📦 أحدث المنتجات ({products.length})</h2>
                    <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 400, alignItems: 'center' }}>
                        <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث سريع..." style={{ background: '#f8fafc' }} />
                        <Link href="/products" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                            إدارة المنتجات →
                        </Link>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {['#', 'المنتج', 'الفئة', 'الكمية', 'سعر الشراء', 'سعر البيع', 'الحالة'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => (
                                <tr key={p.id}>
                                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{p.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 16 }}>{p.name}</div>
                                        {p.barcode && <div style={{ fontSize: 12, color: '#94a3b8' }}>🔖 {p.barcode}</div>}
                                    </td>
                                    <td>
                                        {p.category ? <span className="badge badge-blue">{p.category}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                                    </td>
                                    <td style={{ fontWeight: 900, fontSize: 20 }}>
                                        <span style={{ color: p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a' }}>{p.current_quantity}</span>
                                        {p.unit && <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}> {p.unit}</span>}
                                    </td>
                                    <td style={{ color: '#374151', fontWeight: 700 }}>{n2(p.price)}</td>
                                    <td style={{ color: '#16a34a', fontWeight: 900, fontSize: 17 }}>{n2(p.sale_price)}</td>
                                    <td>
                                        {p.current_quantity <= 0
                                            ? <span className="badge badge-red">نافذ</span>
                                            : p.current_quantity <= p.min_quantity
                                                ? <span className="badge badge-yellow">منخفض</span>
                                                : <span className="badge badge-green">متوفر</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
