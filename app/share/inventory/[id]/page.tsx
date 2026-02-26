'use client';
import { use, useEffect, useState } from 'react';

const HOT_ITEMS = ['فاتح ساده', 'فاتح محوج', 'وسط ساده', 'وسط محوج', 'غامق ساده', 'اسبريسو', 'سكر', 'بندق', 'فرنساوي', 'شاي اسطف', 'شاي ليبتون', 'شاي ليبتون اخضر', 'شاي احمد تي', 'شاي احمد تي اخضر', 'نعناع', 'قرفه زنجبيل', 'قرفه', 'ينسون', 'كركديه', 'شاي عدني', 'كوفي ميكس', 'هوت كاكاو كادبري'];
const COLD_ITEMS = ['ريدبول', 'باور هورس', 'في كولا', 'فيروز', 'بيريل', 'بيبسي', 'تويست', 'دبل دير', 'استينج', 'فيري جو', 'مياه'];
const SHIFT_LABELS: Record<string, string> = { morning: 'صباحي ☀️', evening: 'مسائي 🌙', night: 'ليلي ✨' };

interface InventoryItem { item_name: string; quantity: number; }
interface InventoryData {
    id: number;
    count_date: string;
    shift: string;
    branch: string;
    created_at: string;
    employees: { name: string } | null;
    inventory_count_items: InventoryItem[];
}

export default function ShareInventoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<InventoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/inventory-counts/${id}`)
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(d => setData(d))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Cairo' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 18, color: '#64748b' }}>جاري تحميل الجرد...</div>
            </div>
        </div>
    );

    if (notFound || !data) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Cairo' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>❌</div>
                <div style={{ fontSize: 20, color: '#b91c1c', fontWeight: 700 }}>الجرد غير موجود</div>
            </div>
        </div>
    );

    const itemsMap: Record<string, number> = {};
    data.inventory_count_items.forEach(it => { itemsMap[it.item_name] = it.quantity; });

    const dateFormatted = data.count_date.split('-').reverse().join('/');
    const shiftLabel = SHIFT_LABELS[data.shift] || data.shift;
    const empName = data.employees?.name || 'موظف';
    const createdAt = new Date(data.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)', fontFamily: 'Cairo', direction: 'rtl', padding: '20px 14px' }}>
            {/* Header Card */}
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Brand Header */}
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '20px 20px 0 0', padding: '24px 24px 20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>☕</div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: 1 }}>Suzz</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>تقرير جرد يومي • عرض فقط</div>
                </div>

                {/* Info Strip */}
                <div style={{ background: '#1e293b', padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {[
                        { icon: '👤', label: 'الموظف', val: empName },
                        { icon: '🏪', label: 'الفرع', val: data.branch },
                        { icon: '📅', label: 'التاريخ', val: dateFormatted },
                        { icon: '🕐', label: 'الشيفت', val: shiftLabel },
                    ].map(row => (
                        <div key={row.label}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.icon} {row.label}</div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginTop: 2 }}>{row.val}</div>
                        </div>
                    ))}
                </div>

                {/* Hot Items */}
                <div style={{ background: '#fff', borderRight: '4px solid #f97316', padding: '18px 22px', marginTop: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 22 }}>🔥</span>
                        <span style={{ fontWeight: 900, fontSize: 18, color: '#1e293b' }}>المشروبات الساخنة</span>
                        <span style={{ marginRight: 'auto', background: '#fff7ed', color: '#f97316', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>{HOT_ITEMS.length} صنف</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {HOT_ITEMS.map((item, i) => {
                            const qty = itemsMap[item] ?? 0;
                            return (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: i % 2 === 0 ? '#f8fafc' : '#fff', border: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 15, color: '#374151', fontWeight: 600 }}>{item}</span>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: qty === 0 ? '#94a3b8' : '#1e293b', background: qty === 0 ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: qty === 0 ? 'none' : 'text', WebkitTextFillColor: qty === 0 ? '#94a3b8' : 'transparent', minWidth: 50, textAlign: 'center' }}>{qty}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cold Items */}
                <div style={{ background: '#fff', borderRight: '4px solid #0ea5e9', padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 22 }}>🧊</span>
                        <span style={{ fontWeight: 900, fontSize: 18, color: '#1e293b' }}>المشروبات الباردة</span>
                        <span style={{ marginRight: 'auto', background: '#f0f9ff', color: '#0ea5e9', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>{COLD_ITEMS.length} صنف</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {COLD_ITEMS.map((item, i) => {
                            const qty = itemsMap[item] ?? 0;
                            return (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: i % 2 === 0 ? '#f8fafc' : '#fff', border: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 15, color: '#374151', fontWeight: 600 }}>{item}</span>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: qty === 0 ? '#94a3b8' : '#1e293b', background: qty === 0 ? '#f1f5f9' : 'linear-gradient(135deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: qty === 0 ? 'none' : 'text', WebkitTextFillColor: qty === 0 ? '#94a3b8' : 'transparent', minWidth: 50, textAlign: 'center' }}>{qty}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '16px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                        ✅ تم رفع هذا الجرد في {createdAt} • هذا عرض للقراءة فقط
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                        Suzz Inventory System
                    </div>
                </div>
            </div>
        </div>
    );
}
