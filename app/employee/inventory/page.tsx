'use client';
import { useEffect, useState } from 'react';

// Items are now fetched dynamically from settings

const SHIFT_LABELS: Record<string, string> = { morning: 'صباحي ☀️', evening: 'مسائي 🌙', night: 'ليلي ✨' };

export default function EmployeeInventoryPage() {
    const [empInfo, setEmpInfo] = useState<{ id: number; name: string } | null>(null);
    const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState<'morning' | 'evening' | 'night'>('morning');
    const [branch, setBranch] = useState<'Suzz 1' | 'Suzz 2' | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [countId, setCountId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [todayCounts, setTodayCounts] = useState<{ id: number; shift: string; branch: string; created_at: string; employees?: { name: string } | null }[]>([]);
    const [showTodayCounts, setShowTodayCounts] = useState(false);
    
    const [hotItems, setHotItems] = useState<string[]>([]);
    const [coldItems, setColdItems] = useState<string[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingLatest, setLoadingLatest] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    const ALL_ITEMS = [...hotItems, ...coldItems];

    const fetchTodayCounts = (_empId: number, date: string) => {
        fetch(`/api/inventory-counts?count_date=${date}`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setTodayCounts(data); })
            .catch(() => { });
    };

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            // Bulletproof check: If we have an ID, we are logged in. 
            // Admins go to dashboard, everyone else (employee, jard, staff) stays here.
            if (d.id) {
                if (d.role === 'admin') {
                    window.location.href = '/dashboard';
                } else {
                    setEmpInfo({ id: d.id, name: d.name });
                    fetchTodayCounts(d.id, new Date().toISOString().split('T')[0]);
                    
                    // Fetch dynamic inventory items
                    fetch('/api/settings/inventory-items')
                        .then(r => r.json())
                        .then(data => {
                            if (data.hot) setHotItems(data.hot);
                            if (data.cold) setColdItems(data.cold);
                        })
                        .catch(() => console.error('Failed to load inventory items'))
                        .finally(() => setLoadingItems(false));
                }
            } else {
                window.location.href = '/login';
            }
        }).catch(() => {
            console.error('InventoryPage: Auth check failed');
            window.location.href = '/login';
        });
    }, []);

    const setVal = (item: string, v: string) => {
        if (v && !/^\d*\.?\d*$/.test(v)) return;
        setValues(prev => ({ ...prev, [item]: v }));
    };

    const handleCopyLatest = async () => {
        if (!branch) return;
        setLoadingLatest(true);
        setError('');
        try {
            const res = await fetch(`/api/inventory-counts/latest?branch=${encodeURIComponent(branch)}`);
            const data = await res.json();
            if (res.ok && data.inventory_count_items) {
                const newValues: Record<string, string> = {};
                data.inventory_count_items.forEach((it: any) => {
                    newValues[it.item_name] = it.quantity.toString();
                });
                setValues(newValues);
            } else {
                setError(data.error || 'لا يوجد جرد سابق لهذا الفرع');
            }
        } catch {
            setError('خطأ في الاتصال');
        }
        setLoadingLatest(false);
    };

    const handleSubmit = async () => {
        if (!branch) { setError('يرجى اختيار الفرع أولاً'); return; }
        setSubmitting(true); setError('');
        const items = ALL_ITEMS.map(name => ({ item_name: name, quantity: parseFloat(values[name] || '0') || 0 }));

        try {
            const res = await fetch('/api/inventory-counts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: empInfo!.id, count_date: countDate, shift, branch, items })
            });
            if (res.ok) {
                const data = await res.json();
                setCountId(data.id ?? null);
                setDone(true);
                // Refresh today's counts list
                fetchTodayCounts(empInfo!.id, countDate);
            } else { const r = await res.json(); setError(r.error || 'حدث خطأ'); }
        } catch { setError('خطأ في الاتصال'); }
        setSubmitting(false);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const handleShareWhatsApp = () => {
        if (!empInfo || !branch) return;

        const dateFormatted = countDate.split('-').reverse().join('/');
        const shiftLabel = SHIFT_LABELS[shift] || shift;
        const shareUrl = countId ? `${window.location.origin}/share/inventory/${countId}` : '';

        // Build the professional message
        const separator = '━━━━━━━━━━━━━━━━━━━━━━';
        const hotSection = hotItems.map(item => {
            const qty = parseFloat(values[item] || '0') || 0;
            return `  • ${item}: *${qty}*`;
        }).join('\n');
        const coldSection = coldItems.map(item => {
            const qty = parseFloat(values[item] || '0') || 0;
            return `  • ${item}: *${qty}*`;
        }).join('\n');

        const message = [
            `☕ *تقرير جرد يومي - Suzz*`,
            separator,
            `👤 *الموظف:* ${empInfo.name}`,
            `🏪 *الفرع:* ${branch}`,
            `📅 *التاريخ:* ${dateFormatted}`,
            `🕐 *الشيفت:* ${shiftLabel}`,
            separator,
            `🔥 *المشروبات الساخنة:*`,
            hotSection,
            separator,
            `🧊 *المشروبات الباردة:*`,
            coldSection,
            separator,
            shareUrl ? `🔗 *لمشاهدة الجرد كاملاً:*\n${shareUrl}` : '',
            separator,
            `✅ _تم رفع الجرد بنجاح عبر نظام المخزون_`
        ].filter(Boolean).join('\n');

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    if (!empInfo || loadingItems) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Cairo' }}><div style={{ fontSize: 44 }}>⏳</div></div>;

    if (done) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)', fontFamily: 'Cairo', padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#15803d', marginBottom: 8 }}>تم إرسال الجرد بنجاح!</div>
            <div style={{ fontSize: 17, color: '#16a34a', marginBottom: 28 }}>شكراً {empInfo.name} 🙏 (فرع {branch})</div>

            {/* WhatsApp Share Button */}
            <button
                onClick={handleShareWhatsApp}
                style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 16,
                    padding: '16px 36px',
                    fontWeight: 900,
                    fontSize: 20,
                    cursor: 'pointer',
                    fontFamily: 'Cairo',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 6px 24px rgba(37,211,102,0.35)',
                    marginBottom: 16,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.477.643 4.803 1.77 6.82L2 30l7.41-1.74A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="white" fillOpacity="0.25" />
                    <path d="M22.3 19.2c-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.18-.78.18-.23.36-.9 1.14-1.1 1.37-.2.23-.4.26-.75.09-.35-.18-1.48-.55-2.82-1.74-1.04-.93-1.75-2.08-1.95-2.43-.2-.35-.02-.54.15-.72.16-.16.35-.41.53-.62.18-.2.23-.35.35-.58.12-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.67-.57-.58-.78-.59l-.67-.01c-.23 0-.6.09-.92.44-.32.35-1.2 1.17-1.2 2.86 0 1.69 1.23 3.32 1.4 3.55.18.23 2.42 3.7 5.87 5.19.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.07-.85 2.36-1.67.29-.82.29-1.52.2-1.67-.09-.15-.32-.23-.67-.41z" fill="white" />
                </svg>
                شارك الجرد على واتساب
            </button>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => { setDone(false); setValues({}); setBranch(null); setCountId(null); }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'Cairo' }}>📝 جرد جديد</button>
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

                {/* Today's Previous Counts */}
                {todayCounts.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        {/* Collapsible Header */}
                        <div
                            onClick={() => setShowTodayCounts(p => !p)}
                            style={{ background: '#1e293b', borderRadius: showTodayCounts ? '14px 14px 0 0' : 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                        >
                            <span style={{ fontSize: 22 }}>📋</span>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>جرود اليوم السابقة</span>
                            <span style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 10px', color: '#fff', fontWeight: 700, fontSize: 13 }}>{todayCounts.length}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, transition: 'transform 0.2s', transform: showTodayCounts ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
                        </div>
                        {/* Expandable List */}
                        {showTodayCounts && (
                            <div style={{ border: '1.5px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                                {todayCounts.map((c, i) => {
                                    const time = new Date(c.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{SHIFT_LABELS[c.shift] || c.shift}</div>
                                                <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 700, marginTop: 3 }}>👤 {c.employees?.name || '—'}</div>
                                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>🏪 {c.branch}&nbsp;•&nbsp;🕐 {time}</div>
                                            </div>
                                            <a
                                                href={`/share/inventory/${c.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 14, textDecoration: 'none', fontFamily: 'Cairo', whiteSpace: 'nowrap' }}
                                            >
                                                👁 عرض
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Branch Selection */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '18px 18px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2.5px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <label style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>📍 اختر الفرع *</label>
                        <button 
                            onClick={handleCopyLatest}
                            disabled={!branch || loadingLatest}
                            style={{ 
                                background: branch ? '#6366f1' : '#f1f5f9', 
                                color: branch ? '#fff' : '#94a3b8', 
                                border: 'none', 
                                borderRadius: 12, 
                                padding: '8px 16px', 
                                fontSize: 14, 
                                fontWeight: 800, 
                                cursor: branch ? 'pointer' : 'not-allowed', 
                                fontFamily: 'Cairo',
                                boxShadow: branch ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loadingLatest ? '⏳ جاري النسخ...' : '📋 نسخ آخر جرد'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setBranch('Suzz 1')}
                            style={{ flex: 1, padding: '15px 0', borderRadius: 14, border: '2.5px solid', borderColor: branch === 'Suzz 1' ? '#6366f1' : '#e2e8f0', background: branch === 'Suzz 1' ? '#6366f1' : '#fff', color: branch === 'Suzz 1' ? '#fff' : '#1e293b', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'Cairo', transition: 'all 0.2s' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>(تحت)</div>
                            Suzz 1
                        </button>
                        <button onClick={() => setBranch('Suzz 2')}
                            style={{ flex: 1, padding: '15px 0', borderRadius: 14, border: '2.5px solid', borderColor: branch === 'Suzz 2' ? '#6366f1' : '#e2e8f0', background: branch === 'Suzz 2' ? '#6366f1' : '#fff', color: branch === 'Suzz 2' ? '#fff' : '#1e293b', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'Cairo', transition: 'all 0.2s' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>(فوق)</div>
                            Suzz 2
                        </button>
                    </div>
                </div>

                {/* Date & Shift */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#374151' }}>📅 التاريخ</label>
                            <input type="date" value={countDate} onChange={e => setCountDate(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 17, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: '1 1 100%' }}>
                            <label style={{ display: 'block', fontWeight: 700, marginBottom: 10, fontSize: 15, color: '#374151' }}>🕐 الشيفت</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setShift('morning')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2.5px solid', borderColor: shift === 'morning' ? '#6366f1' : '#e2e8f0', background: shift === 'morning' ? '#6366f1' : '#fff', color: shift === 'morning' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    ☀️ صباحي
                                </button>
                                <button onClick={() => setShift('evening')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2.5px solid', borderColor: shift === 'evening' ? '#6366f1' : '#e2e8f0', background: shift === 'evening' ? '#6366f1' : '#fff', color: shift === 'evening' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    🌙 مسائي
                                </button>
                                <button onClick={() => setShift('night')}
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2.5px solid', borderColor: shift === 'night' ? '#6366f1' : '#e2e8f0', background: shift === 'night' ? '#6366f1' : '#fff', color: shift === 'night' ? '#fff' : '#374151', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
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

                {/* Smart Search for Items */}
                <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 ابحث عن منتج..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '12px 14px',
                            fontSize: '16px',
                            fontFamily: 'Cairo',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 12,
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: '#fff',
                            transition: 'all 0.2s',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    {itemSearch && (
                        <button
                            onClick={() => setItemSearch('')}
                            style={{
                                background: '#f1f5f9',
                                color: '#64748b',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '10px 12px',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                                fontFamily: 'Cairo',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                                e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.color = '#64748b';
                            }}
                        >
                            ✕ مسح
                        </button>
                    )}
                </div>

                {/* Filter items based on search and display */}
                {(() => {
                    const filteredItems = ALL_ITEMS.filter(item => {
                        if (!itemSearch) return true;
                        return item.toLowerCase().includes(itemSearch.toLowerCase().trim());
                    });

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                            {filteredItems.map(item => (
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
                    {filteredItems.length === 0 && itemSearch && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#475569', marginBottom: 4 }}>لم يتم العثور على منتجات</div>
                            <div style={{ fontSize: 14 }}>جرب البحث بكلمات مختلفة أو اضغط "مسح" للعودة للقائمة الكاملة</div>
                        </div>
                    )}
                        </div>
                    );
                })()}

                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 12, padding: '14px 18px', marginBottom: 14, fontWeight: 700, textAlign: 'center', fontSize: 16 }}>{error}</div>}

                <button onClick={handleSubmit} disabled={submitting}
                    style={{ width: '100%', padding: '18px 0', borderRadius: 16, background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)', color: '#fff', border: 'none', fontWeight: 900, fontSize: 22, cursor: 'pointer', fontFamily: 'Cairo', boxShadow: '0 6px 20px rgba(22,163,74,0.3)', marginBottom: 30, opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? '⏳ جاري الإرسال...' : '✅ تم الجرد'}
                </button>
            </div>
        </div>
    );
}
