'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import Link from 'next/link';

type Stats = { total_products: number; inventory_value: number; low_stock_count: number; out_of_stock_count: number };
type InvStats = { total_sales: number; total_purchases: number; total_profit: number; sales_count: number; purchases_count: number };
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
            fetch('/api/products').then(r => r.json()),
        ]).then(([s, iv, p]) => {
            setStats(s);
            setInvStats(iv);
            setProducts(Array.isArray(p) ? p : []);
            setLoading(false);
        });
    }, []);

    const filtered = products.filter(p => !search || p.name.includes(search) || p.category.includes(search));
    const lowStock = products.filter(p => p.current_quantity <= p.min_quantity && p.current_quantity > 0).length;
    const outOfStock = products.filter(p => p.current_quantity <= 0).length;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', direction: 'rtl', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <div style={{ fontSize: 18, color: '#64748b', fontFamily: 'Cairo' }}>جاري التحميل...</div>
        </div>
    );

    return (
        <div style={{ padding: 28, direction: 'rtl' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1e293b' }}>📊 لوحة التحكم</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/invoices/purchase" style={{ background: '#f1f5f9', color: '#374151', borderRadius: 10, padding: '11px 20px', fontWeight: 700, textDecoration: 'none', fontSize: 15, fontFamily: 'Cairo' }}>
                        ➕ فاتورة شراء
                    </Link>
                    <Link href="/invoices/sale" style={{ background: '#16a34a', color: '#fff', borderRadius: 10, padding: '11px 20px', fontWeight: 800, textDecoration: 'none', fontSize: 15, fontFamily: 'Cairo' }}>
                        ➕ فاتورة بيع
                    </Link>
                </div>
            </div>

            {/* Stat Cards Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 20 }}>
                {[
                    { label: 'إجمالي المنتجات', value: stats?.total_products ?? 0, icon: '📦', color: '#0ea5e9', bg: '#e0f2fe', border: '#0ea5e9' },
                    { label: 'قيمة المخزون (ج.م)', value: n0(stats?.inventory_value ?? 0), icon: '💰', color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
                    { label: 'منخفضة المخزون', value: lowStock, icon: '⚠️', color: '#f59e0b', bg: '#fef9c3', border: '#f59e0b' },
                    { label: 'منتجات نافذة', value: outOfStock, icon: '❌', color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderRight: `6px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                        </div>
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{s.icon}</div>
                    </div>
                ))}
            </div>

            {/* Invoice Stats Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
                {[
                    { label: 'إجمالي المبيعات', value: n2(invStats?.total_sales ?? 0), sub: `${invStats?.sales_count ?? 0} فاتورة`, color: '#16a34a', border: '#16a34a', icon: '📈' },
                    { label: 'إجمالي المشتريات', value: n2(invStats?.total_purchases ?? 0), sub: `${invStats?.purchases_count ?? 0} فاتورة`, color: '#0ea5e9', border: '#0ea5e9', icon: '📉' },
                    { label: 'صافي الربح', value: n2(invStats?.total_profit ?? 0), sub: '', color: (invStats?.total_profit ?? 0) >= 0 ? '#6366f1' : '#ef4444', border: '#6366f1', icon: '💵' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: `4px solid ${s.border}` }}>
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
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b' }}>📦 جميع المنتجات ({products.length})</h2>
                    <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 400, alignItems: 'center' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث سريع..."
                            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc' }} />
                        <Link href="/products" style={{ background: '#0ea5e9', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap', fontFamily: 'Cairo' }}>
                            إدارة المنتجات →
                        </Link>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                        <thead>
                            <tr style={{ background: '#1e293b' }}>
                                {['#', 'المنتج', 'الفئة', 'الكمية', 'سعر الشراء', 'سعر البيع', 'الحالة'].map(h => (
                                    <th key={h} style={{ padding: '16px 20px', color: '#fff', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 15 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 700 }}>#{p.id}</td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 16 }}>{p.name}</div>
                                        {p.barcode && <div style={{ fontSize: 12, color: '#94a3b8' }}>🔖 {p.barcode}</div>}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {p.category ? <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 8, padding: '4px 14px', fontSize: 14, fontWeight: 700 }}>{p.category}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '14px 20px', fontWeight: 900, fontSize: 20 }}>
                                        <span style={{ color: p.current_quantity <= 0 ? '#ef4444' : p.current_quantity <= p.min_quantity ? '#f59e0b' : '#16a34a' }}>{p.current_quantity}</span>
                                        {p.unit && <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}> {p.unit}</span>}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#374151', fontWeight: 700 }}>{n2(p.price)}</td>
                                    <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 900, fontSize: 17 }}>{n2(p.sale_price)}</td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {p.current_quantity <= 0
                                            ? <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 700 }}>نافذ</span>
                                            : p.current_quantity <= p.min_quantity
                                                ? <span style={{ background: '#fef9c3', color: '#92400e', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 700 }}>منخفض</span>
                                                : <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 8, padding: '5px 14px', fontSize: 14, fontWeight: 700 }}>متوفر</span>}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '70px 0', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>{products.length === 0 ? 'لا توجد منتجات' : 'لا نتائج'}</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
