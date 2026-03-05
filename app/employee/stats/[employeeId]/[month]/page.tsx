'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function EmployeeStatsPage() {
    const params = useParams();
    const employeeId = params.employeeId as string;
    const month = params.month as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!employeeId || !month) return;
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/hr/settlement?month=${month}&employee_id=${employeeId}`);
                if (!res.ok) throw new Error('فشل جلب الإحصائيات');
                const json = await res.json();
                if (json && json.length > 0) {
                    setData(json[0]);
                } else {
                    throw new Error('لم يتم العثور على بيانات الموظف');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [employeeId, month]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>جاري التحميل...</div>;
    if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ef4444' }}>{error}</div>;
    if (!data) return null;

    const emp = data.employee;
    const fin = data.financials;
    const stats = data.stats;

    const [year, m] = month.split('-');
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthLabel = `${monthNames[parseInt(m) - 1]} ${year}`;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '40px 20px',
            direction: 'rtl',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{
                width: '100%',
                maxWidth: 480,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 32,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Header Gradient Strip */}
                <div style={{ height: 6, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />

                <div style={{ padding: 32 }}>

                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                            إحصائيات شهر {monthLabel}
                        </div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                            {emp.name}
                        </h1>
                        <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: 15 }}>{emp.job_title}</p>
                    </div>

                    {/* Net Salary Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: 24,
                        padding: 24,
                        color: '#fff',
                        boxShadow: '0 20px 40px rgba(79,70,229,0.3)',
                        marginBottom: 32,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />

                        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 8, position: 'relative', zIndex: 1 }}>الراتب الصافي (بعد الخصومات)</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative', zIndex: 1 }}>
                            <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1px' }}>{fin.net_salary}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.9 }}>ج.م</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>{stats.present}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>أيام الحضور</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>{stats.absent}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>أيام الغياب</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>{stats.late}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>تأخير</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>{stats.excused}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>إذن وتصريح</div>
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div style={{ padding: '0 8px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#e2e8f0', fontWeight: 800 }}>تفاصيل المدفوعات</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#64748b' }}></span> الراتب الأساسي
                            </span>
                            <span style={{ color: '#fff', fontWeight: 700 }}>{fin.base_salary} ج.م</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981' }}></span> حوافز ومكافآت
                            </span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>+ {fin.bonuses} ج.م</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }}></span> سلف
                            </span>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>- {fin.advances} ج.م</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }}></span> خصومات إدارية
                            </span>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>- {fin.deductions} ج.م</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }}></span> خصم أيام الغياب
                            </span>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>- {fin.absent_penalty} ج.م</span>
                        </div>

                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 32px', textAlign: 'center', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    هذا التقرير تم إنشاؤه آلياً بواسطة نظام الموارد البشرية
                </div>
            </div>
        </div>
    );
}
