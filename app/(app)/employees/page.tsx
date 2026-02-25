'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmployeesHubPage() {
    const router = useRouter();
    const [accountsCount, setAccountsCount] = useState<number | null>(null);
    const [hrCount, setHrCount] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/employees').then(r => r.json()).then(d => setAccountsCount(Array.isArray(d) ? d.length : 0)).catch(() => setAccountsCount(0));
        fetch('/api/hr/employees').then(r => r.json()).then(d => setHrCount(Array.isArray(d) ? d.length : 0)).catch(() => setHrCount(0));
    }, []);

    const cardStyle = (color: string, bg: string): React.CSSProperties => ({
        background: '#fff',
        borderRadius: 24,
        boxShadow: `0 20px 70px ${bg}`,
        cursor: 'pointer',
        overflow: 'hidden',
        border: `2px solid ${bg}`,
        transition: 'transform 0.25s, box-shadow 0.25s',
    });

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            <h1 className="page-title" style={{ marginBottom: 8 }}>👥 الموظفون</h1>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 36, fontWeight: 600 }}>اختر القسم الذي تريد إدارته</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, maxWidth: 900 }}>

                {/* Card 1: حسابات الجرد */}
                <div
                    style={cardStyle('#6366f1', 'rgba(99,102,241,0.18)')}
                    onClick={() => router.push('/employees/accounts')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(99,102,241,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(99,102,241,0.18)'; }}
                >
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                    <div style={{ padding: '30px 28px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, boxShadow: '0 8px 24px rgba(99,102,241,0.32)' }}>🔐</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>حسابات الجرد</div>
                                <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 700, marginTop: 4 }}>Inventory Accounts</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>موظفو الجرد النشطون</div>
                            <div style={{ fontSize: 38, fontWeight: 900, color: '#6366f1' }}>{accountsCount ?? '...'}</div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>حساب دخول للنظام</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px solid #e0e7ff', paddingTop: 18 }}>
                            <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 800 }}>اضغط للدخول</span>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>←</div>
                        </div>
                    </div>
                </div>

                {/* Card 2: إدارة الموظفين HR */}
                <div
                    style={cardStyle('#0ea5e9', 'rgba(14,165,233,0.15)')}
                    onClick={() => router.push('/employees/hr')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(14,165,233,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(14,165,233,0.15)'; }}
                >
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }} />
                    <div style={{ padding: '30px 28px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, boxShadow: '0 8px 24px rgba(14,165,233,0.32)' }}>👔</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>إدارة الموظفين</div>
                                <div style={{ fontSize: 14, color: '#0ea5e9', fontWeight: 700, marginTop: 4 }}>HR Management</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(14,165,233,0.08)', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>إجمالي موظفي الشركة</div>
                            <div style={{ fontSize: 38, fontWeight: 900, color: '#0ea5e9' }}>{hrCount ?? '...'}</div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>مرتبات · حضور · حوافز · خصومات</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px solid #e0f2fe', paddingTop: 18 }}>
                            <span style={{ fontSize: 14, color: '#0ea5e9', fontWeight: 800 }}>اضغط للدخول</span>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>←</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
