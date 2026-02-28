'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmployeeHubPage() {
    const router = useRouter();

    // The employee ID should be parsed from the token/session later
    // For now we'll just show the cards
    // The actual login flow and layout might already be setup depending on previous tasks

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
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh', padding: 20 }}>
            <h1 className="page-title" style={{ marginBottom: 8 }}>👋 مرحباً بك</h1>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 36, fontWeight: 600 }}>الرجاء اختيار الخدمة المطلوبة</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, maxWidth: 900 }}>

                {/* Card 1: حسابات الجرد */}
                <div
                    style={cardStyle('#6366f1', 'rgba(99,102,241,0.18)')}
                    onClick={() => router.push('/employee/inventory')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(99,102,241,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(99,102,241,0.18)'; }}
                >
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                    <div style={{ padding: '30px 28px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, boxShadow: '0 8px 24px rgba(99,102,241,0.32)' }}>📦</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>تسجيل الجرد</div>
                                <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 700, marginTop: 4 }}>Inventory Log</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px solid #e0e7ff', paddingTop: 18 }}>
                            <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 800 }}>اضغط للدخول</span>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>←</div>
                        </div>
                    </div>
                </div>

                {/* Card 2: بروفايل الموظف HR */}
                <div
                    style={cardStyle('#0ea5e9', 'rgba(14,165,233,0.15)')}
                    onClick={() => router.push('/employee/profile')}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(14,165,233,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 70px rgba(14,165,233,0.15)'; }}
                >
                    <div style={{ height: 8, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }} />
                    <div style={{ padding: '30px 28px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, boxShadow: '0 8px 24px rgba(14,165,233,0.32)' }}>👤</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>الملف الشخصي</div>
                                <div style={{ fontSize: 14, color: '#0ea5e9', fontWeight: 700, marginTop: 4 }}>My Profile & HR</div>
                            </div>
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
