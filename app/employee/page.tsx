'use client';
import { useEffect, useState } from 'react';

export default function EmployeeDashboardPage() {
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // For testing and demonstration, since we don't have a rigid employee login, 
    // we'll fetch all employees and let the user select one from a dropdown.
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch all active employees to populate dropdown
        const fetchEmployees = async () => {
            try {
                // To get employees we can query the settlement API without ID, which returns all settlements for the month.
                const res = await fetch(`/api/hr/settlement?month=${month}`);
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json)) {
                        setEmployees(json.map(s => s.employee));
                    }
                }
            } catch (e) {
                console.error('Error fetching employees:', e);
            }
        };
        fetchEmployees();
    }, [month]);

    useEffect(() => {
        if (!selectedEmployeeId || !month) {
            setData(null);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/hr/settlement?month=${month}&employee_id=${selectedEmployeeId}`);
                if (!res.ok) throw new Error('فشل جلب الإحصائيات');
                const json = await res.json();
                if (json && json.length > 0) {
                    setData(json[0]);
                } else {
                    setData(null);
                    throw new Error('لم يتم العثور على بيانات الموظف');
                }
            } catch (err: any) {
                setError(err.message);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedEmployeeId, month]);

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const [y, m] = month.split('-');
    const monthLabel = `${monthNames[parseInt(m) - 1]} ${y}`;

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

            {/* Top Controls: Select Employee & Month */}
            <div style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 12, marginBottom: 24 }}>
                <select
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', appearance: 'none' }}
                >
                    <option value="" style={{ color: '#000' }}>-- اختر اسمك --</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id} style={{ color: '#000' }}>{emp.name}</option>
                    ))}
                </select>

                <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', outline: 'none' }}
                />
            </div>

            {loading && <div style={{ color: '#cbd5e1', marginTop: 40 }}>جاري تحميل البيانات...</div>}

            {!loading && error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.4)' }}>{error}</div>}

            {!loading && !data && !error && selectedEmployeeId === '' && (
                <div style={{ color: '#94a3b8', marginTop: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>مرحباً بك في بوابة الموظفين الخاصة بـ Suzzz</div>
                    <div style={{ fontSize: 14, marginTop: 8 }}>يرجى اختيار اسمك من القائمة لعرض بياناتك</div>
                </div>
            )}

            {!loading && data && (
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
                    position: 'relative',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                    <div style={{ height: 6, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />

                    <div style={{ padding: 32 }}>

                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                                إحصائيات شهر {monthLabel}
                            </div>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                                {data.employee.name}
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: 15 }}>{data.employee.job_title}</p>
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
                                <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1px' }}>{data.financials.net_salary}</span>
                                <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.9 }}>ج.م</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 32 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>{data.stats.present}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>حضور</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>{data.stats.absent}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>غياب</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>{data.stats.late}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>تأخير</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>{data.stats.excused}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>إذن/مأمورية</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#a855f7', marginBottom: 4 }}>{data.stats.paid_leaves || 0}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>إجازة مدفوعة</div>
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div style={{ padding: '0 8px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#e2e8f0', fontWeight: 800 }}>تفاصيل المدفوعات</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#64748b' }}></span> الراتب الأساسي
                                </span>
                                <span style={{ color: '#fff', fontWeight: 700 }}>{data.financials.base_salary} ج.م</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981' }}></span> حوافز ومكافآت
                                </span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>+ {data.financials.bonuses} ج.م</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }}></span> سلف
                                </span>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>- {data.financials.advances} ج.م</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }}></span> خصومات إدارية
                                </span>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>- {data.financials.deductions} ج.م</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }}></span> خصم أيام الغياب
                                </span>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>- {data.financials.absent_penalty} ج.م</span>
                            </div>

                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 32px', textAlign: 'center', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        هذا التقرير تم إنشاؤه آلياً بواسطة نظام الموارد البشرية (Suzzz HR)
                    </div>
                </div>
            )}
        </div>
    );
}
