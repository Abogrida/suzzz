'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Attendance = { date: string; status: 'present' | 'absent' | 'late' | 'excused'; time_in: string; time_out: string; };
type Payment = { payment_type: 'salary' | 'advance' | 'bonus' | 'deduction'; amount: number; payment_date: string; };
type Purchase = { item_name: string; amount: number; purchase_date: string; };
type EmployeeData = { name: string; job_title: string; base_salary: number; attendance: Attendance[]; payments: Payment[]; purchases: Purchase[]; };

export default function EmployeeProfilePage() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<EmployeeData | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const res = await fetch(`/api/employee/profile?pin=${pin}&month=${currentMonth}`);
            if (!res.ok) {
                if (res.status === 404) setError('الرقم السري غير صحيح');
                else setError('حدث خطأ في النظام');
                setLoading(false);
                return;
            }
            const empData = await res.json();
            setData(empData);
        } catch (err) {
            setError('تعذر الاتصال بالخادم');
        }
        setLoading(false);
    };

    if (!data) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', direction: 'rtl', padding: 20 }}>
                <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 20 }}>👤</div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#1e293b' }}>بوابة الموظفين</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>أدخل الرقم السري الخاص بك للدخول</p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="الرقم السري (PIN)"
                            maxLength={4}
                            style={{ padding: '16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'monospace' }}
                            onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        {error && <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>{error}</div>}
                        <button
                            type="submit"
                            disabled={loading || pin.length !== 4}
                            style={{ padding: '16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 800, cursor: 'pointer', opacity: (loading || pin.length !== 4) ? 0.7 : 1, transition: 'opacity 0.2s', fontFamily: 'Cairo' }}
                        >
                            {loading ? 'جاري التحقق...' : 'دخول'}
                        </button>
                    </form>
                    <button onClick={() => router.push('/employee')} style={{ marginTop: 24, background: 'none', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo' }}>&rarr; العودة للرئيسية</button>
                </div>
            </div>
        );
    }

    // Calculations
    const salaries = data.payments.filter(p => p.payment_type === 'salary').reduce((s, p) => s + p.amount, 0);
    const advances = data.payments.filter(p => p.payment_type === 'advance').reduce((s, p) => s + p.amount, 0);
    const bonuses = data.payments.filter(p => p.payment_type === 'bonus').reduce((s, p) => s + p.amount, 0);
    const hrDeductions = data.payments.filter(p => p.payment_type === 'deduction').reduce((s, p) => s + p.amount, 0);
    const purchasesTotal = data.purchases.reduce((s, p) => s + Number(p.amount), 0);

    const totalDeductions = hrDeductions + purchasesTotal;
    const netSalary = data.base_salary + bonuses - totalDeductions - advances;

    const presentDays = data.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentDays = data.attendance.filter(a => a.status === 'absent').length;

    // Get expected payday (1st of next month)
    const today = new Date();
    const payday = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', direction: 'rtl', fontFamily: 'Cairo' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: '#1e293b' }}>أهلاً بك، {data.name}</h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>{data.job_title}</p>
                    </div>
                    <button onClick={() => setData(null)} style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', color: '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo' }}>تسجيل خروج</button>
                </div>

                {/* Financial Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'الراتب الأساسي', value: data.base_salary, color: '#0ea5e9', bg: '#e0f2fe' },
                        { label: 'الصافي المتوقع (هذا الشهر)', value: netSalary, color: netSalary >= 0 ? '#10b981' : '#ef4444', bg: netSalary >= 0 ? '#d1fae5' : '#fee2e2' },
                        { label: 'إجمالي الخصومات والمسحوبات', value: totalDeductions, color: '#ef4444', bg: '#fee2e2' },
                        { label: 'السلف المستلمة', value: advances, color: '#f59e0b', bg: '#fef3c7' },
                    ].map((idx, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>{idx.label}</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: idx.color }}>{Number(idx.value).toLocaleString()} <span style={{ fontSize: 16 }}>ج.م</span></div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Left Column: Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Payroll Status */}
                        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900, color: '#1e293b' }}>🗓️ موعد القبض القادم</h3>
                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: '#334155' }}>{payday.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>يتبقى {Math.ceil((payday.getTime() - today.getTime()) / (1000 * 3600 * 24))} يوماً</div>
                                </div>
                                <div style={{ fontSize: 32 }}>💰</div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900, color: '#1e293b' }}>⏱️ ملخص الشهر الجاري</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>{presentDays}</div>
                                    <div style={{ fontSize: 13, color: '#15803d', fontWeight: 700 }}>أيام الحضور</div>
                                </div>
                                <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #fecaca' }}>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{absentDays}</div>
                                    <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>أيام الغياب</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Purchases & Deductions List */}
                    <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900, color: '#1e293b' }}>🍔 تفاصيل المسحوبات والخصومات</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                            {data.purchases.length === 0 && hrDeductions === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>لا توجد مخصومات أو مسحوبات هذا الشهر 🎉</div>
                            ) : (
                                <>
                                    {data.purchases.map((p, i) => (
                                        <div key={`pur-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#334155', fontSize: 14 }}>{p.item_name}</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>مسحوبات كافيتيريا • {new Date(p.purchase_date).toLocaleDateString('ar-EG')}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 900, color: '#ef4444' }}>-{Number(p.amount).toLocaleString()} ج.م</div>
                                        </div>
                                    ))}
                                    {data.payments.filter(p => p.payment_type === 'deduction').map((p, i) => (
                                        <div key={`ded-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#334155', fontSize: 14 }}>خصم إداري</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>الموارد البشرية • {new Date(p.payment_date).toLocaleDateString('ar-EG')}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 900, color: '#ef4444' }}>-{Number(p.amount).toLocaleString()} ج.م</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
