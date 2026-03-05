'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettlementDashboard() {
    const router = useRouter();
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSettlements = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/hr/settlement?month=${month}`);
            if (!res.ok) throw new Error('فشل جلب التقفيلات');
            const data = await res.json();
            setSettlements(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, [month]);

    const copyShareLink = (empId: string) => {
        const link = `${window.location.origin}/employee/stats/${empId}/${month}`;
        navigator.clipboard.writeText(link);
        alert('تم نسخ رابط مشاركة إحصائيات الموظف بنجاح!');
    };

    return (
        <div style={{ padding: 20, direction: 'rtl', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>التقفيلة الشهرية للموظفين</h1>
                <button
                    onClick={() => router.push('/employee')}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                    رجوع
                </button>
            </div>

            <div style={{ background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <label style={{ fontWeight: 600 }}>اختر الشهر:</label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }}
                    />
                    <button
                        onClick={fetchSettlements}
                        style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                        {loading ? 'جاري الحساب...' : 'حساب الرواتب والتقفيل'}
                    </button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>}

            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>الموظف</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>الأساسي</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>حضور/غياب/تأخير</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', color: '#16a34a' }}>حوافز</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>خصومات ومسحوبات</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>الصافي</th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {settlements.map(s => {
                            const emp = s.employee;
                            const st = s.stats;
                            const fin = s.financials;

                            return (
                                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{emp.name}</td>
                                    <td style={{ padding: '16px 20px' }}>{fin.base_salary} ج.م</td>
                                    <td style={{ padding: '16px 20px', fontSize: 14 }}>
                                        <span style={{ color: '#16a34a' }}>ح: {st.present}</span> |
                                        <span style={{ color: '#dc2626' }}> غ: {st.absent}</span> |
                                        <span style={{ color: '#f59e0b' }}> ت: {st.late}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#16a34a', fontWeight: 600 }}>{fin.bonuses} ج.م</td>
                                    <td style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600 }}>
                                        سلف: {fin.advances} | خصومات: {fin.deductions}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: 18, color: '#4f46e5' }}>
                                        {fin.net_salary} ج.م
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <button
                                            onClick={() => copyShareLink(emp.id)}
                                            style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                                            🔗 نسخ الرابط
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {settlements.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>لا توجد بيانات ليتم عرضها</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
