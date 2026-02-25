'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Stats = { total: number; value: number; low: number; out: number };

async function fetchWarehouseStats(warehouse: string): Promise<Stats> {
    const p = await fetch(`/api/products?warehouse=${warehouse}`).then(r => r.json());
    const products = Array.isArray(p) ? p : [];
    return {
        total: products.length,
        value: products.reduce((s: number, p: any) => s + (p.current_quantity * p.price), 0),
        low: products.filter((p: any) => p.current_quantity > 0 && p.current_quantity <= p.min_quantity).length,
        out: products.filter((p: any) => p.current_quantity <= 0).length,
    };
}

export default function WarehousePage() {
    const router = useRouter();
    const [mainStats, setMainStats] = useState<Stats | null>(null);
    const [suzz1Stats, setSuzz1Stats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchWarehouseStats('main'), fetchWarehouseStats('suzz1')])
            .then(([m, s]) => { setMainStats(m); setSuzz1Stats(s); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const cardStyle = (color: string, shadow: string): React.CSSProperties => ({
        background: '#fff',
        borderRadius: 28,
        boxShadow: `0 20px 70px ${shadow}`,
        border: `2px solid ${color}22`,
        cursor: 'pointer',
        transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease',
        overflow: 'hidden',
        position: 'relative',
    });

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            <h1 className="page-title" style={{ marginBottom: 8 }}>🏭 المخزن</h1>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 36, fontWeight: 600 }}>
                اختر المخزن الذي تريد إدارته
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 28,
                maxWidth: 900,
            }}>

                {/* ===================== المخزن الرئيسي ===================== */}
                <div
                    style={cardStyle('#6366f1', 'rgba(99,102,241,0.18)')}
                    onClick={() => router.push('/products/main')}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(99,102,241,0.28)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(99,102,241,0.18)';
                    }}
                >
                    {/* Top accent bar */}
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />

                    <div style={{ padding: '30px 28px 28px' }}>
                        {/* Icon + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 36, flexShrink: 0,
                                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                            }}>🏛️</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>
                                    المخزن الرئيسي
                                </div>
                                <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 700, marginTop: 4 }}>
                                    Main Warehouse
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
                            </div>
                        ) : mainStats ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#f0f4ff', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#6366f1' }}>{mainStats.total}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>إجمالي المنتجات</div>
                                </div>
                                <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                                        {Math.floor(mainStats.value).toLocaleString('en-US')}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>قيمة المخزون (ج.م)</div>
                                </div>
                                <div style={{ background: '#fffbeb', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{mainStats.low}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>⚠️ منخفضة</div>
                                </div>
                                <div style={{ background: '#fef2f2', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{mainStats.out}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>❌ نافذة</div>
                                </div>
                            </div>
                        ) : null}

                        {/* Arrow */}
                        <div style={{
                            marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderTop: '1.5px solid #e0e7ff', paddingTop: 18,
                        }}>
                            <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 800 }}>اضغط للدخول</span>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: '#fff',
                            }}>←</div>
                        </div>
                    </div>
                </div>

                {/* ===================== المخزن الفرعي suzz1 ===================== */}
                <div
                    style={cardStyle('#0ea5e9', 'rgba(14,165,233,0.15)')}
                    onClick={() => router.push('/products/suzz1')}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(14,165,233,0.25)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(14,165,233,0.15)';
                    }}
                >
                    {/* Top accent bar */}
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }} />

                    <div style={{ padding: '30px 28px 28px' }}>
                        {/* Icon + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 36, flexShrink: 0,
                                boxShadow: '0 8px 24px rgba(14,165,233,0.32)',
                            }}>📦</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>
                                    المخزن الفرعي
                                </div>
                                <div style={{ fontSize: 14, color: '#0ea5e9', fontWeight: 700, marginTop: 4 }}>
                                    (suzz1)
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
                            </div>
                        ) : suzz1Stats ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#e0f2fe', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0ea5e9' }}>{suzz1Stats.total}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>إجمالي المنتجات</div>
                                </div>
                                <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                                        {Math.floor(suzz1Stats.value).toLocaleString('en-US')}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>قيمة المخزون (ج.م)</div>
                                </div>
                                <div style={{ background: '#fffbeb', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{suzz1Stats.low}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>⚠️ منخفضة</div>
                                </div>
                                <div style={{ background: '#fef2f2', borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{suzz1Stats.out}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>❌ نافذة</div>
                                </div>
                            </div>
                        ) : null}

                        {/* Arrow */}
                        <div style={{
                            marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderTop: '1.5px solid #e0f2fe', paddingTop: 18,
                        }}>
                            <span style={{ fontSize: 14, color: '#0ea5e9', fontWeight: 800 }}>اضغط للدخول</span>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: '#fff',
                            }}>←</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
