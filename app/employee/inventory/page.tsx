'use client';
import { useEffect, useState } from 'react';

const HOT_ITEMS = ['فاتح ساده', 'فاتح محوج', 'وسط ساده', 'وسط محوج', 'غامق ساده', 'اسبريسو', 'سكر', 'بندق', 'فرنساوي', 'شاي اسطف', 'شاي ليبتون', 'شاي ليبتون اخضر', 'شاي احمد تي', 'شاي احمد تي اخضر', 'نعناع', 'قرفه زنجبيل', 'قرفه', 'ينسون', 'كركديه', 'شاي عدني', 'كوفي ميكس', 'هوت كاكاو كادبري'];
const COLD_ITEMS = ['ريدبول', 'باور هورس', 'في كولا', 'فيروز', 'بيريل', 'بيبسي', 'تويست', 'دبل دير', 'استينج', 'فيري جو', 'مياه'];

export default function EmployeeInventoryPage() {
    const [empInfo, setEmpInfo] = useState<{ id: number; name: string } | null>(null);
    const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState<'morning' | 'evening' | 'night'>('morning');
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const ALL_ITEMS = [...HOT_ITEMS, ...COLD_ITEMS];

    useEffect(() => {
        // Get employee info from cookie via a small API check
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (d.role === 'employee') setEmpInfo({ id: d.id, name: d.name });
            else window.location.href = '/login';
        }).catch(() => window.location.href = '/login');
    }, []);

    const setVal = (item: string, v: string) => {
        // Only allow numbers and dots
        if (v && !/^\d*\.?\d*$/.test(v)) return;
        setValues(prev => ({ ...prev, [item]: v }));
    };

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        const items = ALL_ITEMS.map(name => ({ item_name: name, quantity: parseFloat(values[name] || '0') || 0 }));

        try {
            const res = await fetch('/api/inventory-counts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: empInfo!.id, count_date: countDate, shift, items })
            });
            if (res.ok) { setDone(true); }
            else { const r = await res.json(); setError(r.error || 'حدث خطأ'); }
        } catch { setError('خطأ في الاتصال'); }
        setSubmitting(false);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    if (!empInfo) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Cairo' }}><div style={{ fontSize: 44 }}>⏳</div></div>;

    if (done) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)', fontFamily: 'Cairo', padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#15803d', marginBottom: 8 }}>تم إرسال الجرد بنجاح!</div>
            <div style={{ fontSize: 17, color: '#16a34a', marginBottom: 24 }}>شكراً {empInfo.name} 🙏</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => { setDone(false); setValues({}) }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'Cairo' }}>📝 جرد جديد</button>
                <button onClick={handleLogout} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'Cairo' }}>🚪 تسجيل خروج</button>
            </div>
        </div>
    );



    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Cairo', direction: 'rtl' }}>
            {/* Top Bar */}
            <div style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>{empInfo.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>صفحة الجرد</div>
                    </div>
                </div>
                <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo' }}>🚪 خروج</button>
            </div>

            <div style={{ padding: '16px 14px', maxWidth: 600, margin: '0 auto' }}>
                {/* Date & Shift */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '18px 18px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#374151' }}>📅 التاريخ</label>
                            <input type="date" value={countDate} onChange={e => setCountDate(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 17, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: '1 1 100%', marginTop: 12 }}>
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#374151' }}>🕐 الشيفت</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setShift('morning')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid', borderColor: shift === 'morning' ? '#6366f1' : '#e2e8f0', background: shift === 'morning' ? '#6366f1' : '#fff', color: shift === 'morning' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    ☀️ صباحي
                                </button>
                                <button onClick={() => setShift('evening')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid', borderColor: shift === 'evening' ? '#6366f1' : '#e2e8f0', background: shift === 'evening' ? '#6366f1' : '#fff', color: shift === 'evening' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    🌙 مسائي
                                </button>
                                <button onClick={() => setShift('night')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid', borderColor: shift === 'night' ? '#6366f1' : '#e2e8f0', background: shift === 'night' ? '#6366f1' : '#fff', color: shift === 'night' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    ✨ ليلي
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div style={{ background: '#1e293b', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26 }}>📋</span>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 19 }}>قائمة الجرد</span>
                    <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '3px 12px', color: '#fff', fontWeight: 700, fontSize: 14, marginRight: 'auto' }}>{ALL_ITEMS.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {ALL_ITEMS.map(item => (
                        <div key={item} style={{ background: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1.5px solid #e2e8f0' }}>
                            <label style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', flex: 1 }}>{item}</label>
                            <input
                                type="text" inputMode="decimal"
                                value={values[item] || ''}
                                onChange={e => setVal(item, e.target.value)}
                                placeholder="0"
                                style={{ width: 110, textAlign: 'center', padding: '14px 8px', border: '2px solid #e2e8f0', borderRadius: 14, fontSize: 24, fontWeight: 900, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 12, padding: '14px 18px', marginBottom: 14, fontWeight: 700, textAlign: 'center', fontSize: 16 }}>{error}</div>}

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting}
                    style={{ width: '100%', padding: '18px 0', borderRadius: 16, background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)', color: '#fff', border: 'none', fontWeight: 900, fontSize: 22, cursor: 'pointer', fontFamily: 'Cairo', boxShadow: '0 6px 20px rgba(22,163,74,0.3)', marginBottom: 30, opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? '⏳ جاري الإرسال...' : '✅ تم الجرد'}
                </button>
            </div>
        </div>
    );
}
