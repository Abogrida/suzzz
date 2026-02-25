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
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <h1 className="page-title">📄 الفواتير</h1>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <Link href="/invoices/purchase" className="btn btn-secondary">➕ فاتورة شراء</Link>
                    <Link href="/invoices/sale" className="btn btn-primary">➕ فاتورة بيع</Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ borderRight: '6px solid #6366f1' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي الفواتير</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#6366f1', marginTop: 4 }}>{invoices.length}</div>
                </div>
                <div className="card" style={{ borderRight: '6px solid #16a34a' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي المبيعات</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{n2(totalSales)} ج.م</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{sales.length} فاتورة</div>
                </div>
                <div className="card" style={{ borderRight: '6px solid #0ea5e9' }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>إجمالي المشتريات</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0ea5e9', marginTop: 4 }}>{n2(totalPurchases)} ج.م</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{purchases.length} فاتورة</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <div className="flex gap-1">
                    {[{ v: 'all' as const, l: 'الكل' }, { v: 'sale' as const, l: 'مبيعات' }, { v: 'purchase' as const, l: 'مشتريات' }].map(t => (
                        <button key={t.v} onClick={() => setTypeFilter(t.v)}
                            className={`btn ${typeFilter === t.v ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ background: typeFilter === t.v ? '#1e293b' : '#f1f5f9', color: typeFilter === t.v ? '#fff' : '#374151', padding: '10px 20px' }}>{t.l}</button>
                    ))}
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                        style={{ background: '#f8fafc' }} />
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }}></div><div style={{ color: '#64748b', fontSize: 16, marginTop: 12 }}>جاري التحميل...</div></div> :
                    <div className="table-responsive">
                        <table className="data-table" style={{ minWidth: 560 }}>
                            <thead><tr>
                                {['رقم الفاتورة', 'النوع', 'العميل/المورد', 'الإجمالي', 'ملاحظات', 'التاريخ'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.map((inv) => (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 800, color: '#1e293b' }}>{inv.invoice_number}</td>
                                        <td>
                                            <span className={`badge ${inv.type === 'sale' ? 'badge-green' : 'badge-blue'}`} style={{ padding: '4px 12px', fontWeight: 800 }}>
                                                {inv.type === 'sale' ? '📈 بيع' : '📉 شراء'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#374151' }}>{inv.customer_name || inv.supplier_name || '—'}</td>
                                        <td style={{ fontWeight: 900, color: inv.type === 'sale' ? '#16a34a' : '#0ea5e9' }}>{n2(inv.total)} ج.م</td>
                                        <td style={{ color: '#64748b' }}>{inv.notes || '—'}</td>
                                        <td style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(inv.created_at).toLocaleString('en-US')}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#374151' }}>لا توجد فواتير</div>
                                </td></tr>}
                            </tbody>
                        </table>
                    </div>}
            </div>
        </div>
    );
}
