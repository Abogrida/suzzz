'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Invoice = { id: number; invoice_number: string; type: string; customer_name: string; supplier_name: string; total: number; notes: string; created_at: string; items?: any[] };
const n2 = (v: number) => Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/invoices').then(r => r.json()).then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); });
    }, []);

    const filtered = invoices.filter(inv => {
        const q = search.toLowerCase();
        const ms = !q || inv.invoice_number.toLowerCase().includes(q) || (inv.customer_name || '').toLowerCase().includes(q) || (inv.supplier_name || '').toLowerCase().includes(q);
        const mt = typeFilter === 'all' ? true : inv.type === typeFilter;
        return ms && mt;
    });

    const sales = invoices.filter(i => i.type === 'sale');
    const purchases = invoices.filter(i => i.type === 'purchase');
    const totalSales = sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1e293b' }}>📄 الفواتير</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/invoices/purchase" style={{ background: '#0ea5e9', color: '#fff', borderRadius: 10, padding: '12px 22px', fontWeight: 800, textDecoration: 'none', fontSize: 16, fontFamily: 'Cairo' }}>➕ فاتورة شراء</Link>
                    <Link href="/invoices/sale" style={{ background: '#16a34a', color: '#fff', borderRadius: 10, padding: '12px 22px', fontWeight: 800, textDecoration: 'none', fontSize: 16, fontFamily: 'Cairo' }}>➕ فاتورة بيع</Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderRight: '6px solid #6366f1' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي الفواتير</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#6366f1', marginTop: 4 }}>{invoices.length}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderRight: '6px solid #16a34a' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي المبيعات</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{n2(totalSales)} ج.م</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{sales.length} فاتورة</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderRight: '6px solid #0ea5e9' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي المشتريات</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0ea5e9', marginTop: 4 }}>{n2(totalPurchases)} ج.م</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{purchases.length} فاتورة</div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    {[{ v: 'all' as const, l: 'الكل' }, { v: 'sale' as const, l: 'مبيعات' }, { v: 'purchase' as const, l: 'مشتريات' }].map(t => (
                        <button key={t.v} onClick={() => setTypeFilter(t.v)}
                            style={{ background: typeFilter === t.v ? '#1e293b' : '#f1f5f9', color: typeFilter === t.v ? '#fff' : '#374151', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>{t.l}</button>
                    ))}
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc' }} />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {loading ? <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 44 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div> :
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: '#1e293b' }}>
                            {['رقم الفاتورة', 'النوع', 'العميل/المورد', 'الإجمالي', 'ملاحظات', 'التاريخ'].map(h => (
                                <th key={h} style={{ padding: '18px 20px', color: '#fff', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 16 }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {filtered.map((inv, i) => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#1e293b', fontSize: 16 }}>{inv.invoice_number}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ background: inv.type === 'sale' ? '#dcfce7' : '#dbeafe', color: inv.type === 'sale' ? '#15803d' : '#1d4ed8', borderRadius: 8, padding: '5px 16px', fontWeight: 800, fontSize: 14 }}>
                                            {inv.type === 'sale' ? '📈 بيع' : '📉 شراء'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#374151', fontSize: 16 }}>{inv.customer_name || inv.supplier_name || '—'}</td>
                                    <td style={{ padding: '16px 20px', fontWeight: 900, fontSize: 18, color: inv.type === 'sale' ? '#16a34a' : '#0ea5e9' }}>{n2(inv.total)} ج.م</td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 15 }}>{inv.notes || '—'}</td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14 }}>{new Date(inv.created_at).toLocaleString('en-US')}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
                                <div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا توجد فواتير</div>
                            </td></tr>}
                        </tbody>
                    </table>}
            </div>
        </div>
    );
}
