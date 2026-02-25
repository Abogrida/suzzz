'use client';
import { useEffect, useState } from 'react';

type Employee = { id: number; name: string };
type CountItem = { id: number; item_name: string; quantity: number };
type InventoryCount = {
    id: number;
    employee_id: number;
    employees: { name: string };
    count_date: string;
    shift: string;
    branch: string;
    notes: string;
    created_at: string;
    inventory_count_items: CountItem[]
};

export default function InventoryReportsPage() {
    const [counts, setCounts] = useState<InventoryCount[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branch, setBranch] = useState<'all' | 'Suzz 1' | 'Suzz 2'>('all');
    const [employeeId, setEmployeeId] = useState<string>('all');
    const [expandedCount, setExpandedCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/employees').then(r => r.json()).then(d => {
            setEmployees(Array.isArray(d) ? d : []);
        });
    }, []);

    const loadCounts = async () => {
        setLoading(true);
        let url = `/api/inventory-counts?count_date=${date}&branch=${branch}`;
        if (employeeId !== 'all') url += `&employee_id=${employeeId}`;

        const data = await fetch(url).then(r => r.json());
        setCounts(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        loadCounts();
    }, [date, branch, employeeId]);

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Header */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 26px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900 }}>📊 تقارير الجرد</h1>
                <button onClick={() => window.history.back()} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'Cairo' }}>→ العودة</button>
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 10, fontSize: 15, color: '#475569' }}>📅 التاريخ</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc' }} />
                </div>

                <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 10, fontSize: 15, color: '#475569' }}>👤 الموظف</label>
                    <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 16, fontFamily: 'Cairo', outline: 'none', background: '#f8fafc', cursor: 'pointer' }}>
                        <option value="all">كل الموظفين</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 2, minWidth: 250 }}>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 10, fontSize: 15, color: '#475569' }}>📍 الفرع</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'Suzz 1', 'Suzz 2'].map(b => (
                            <button key={b} onClick={() => setBranch(b as any)}
                                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid', borderColor: branch === b ? '#6366f1' : '#e2e8f0', background: branch === b ? '#6366f1' : '#fff', color: branch === b ? '#fff' : '#1e293b', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                {b === 'all' ? 'الكل' : b}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={loadCounts} style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>🔄</button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 50 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 15, fontWeight: 700 }}>جاري التحميل...</div></div>
            ) : counts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 20, border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>📭</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>لا يوجد عمليات جرد مـتاحة</div>
                    <div style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>تأكد من الفلاتر المختارة</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px 5px' }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: '#1e293b' }}>🔢 إجمالي العمليات: {counts.length}</span>
                    </div>
                    {counts.map(c => (
                        <div key={c.id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                            <button onClick={() => setExpandedCount(expandedCount === c.id ? null : c.id)}
                                style={{ width: '100%', padding: '20px 24px', background: expandedCount === c.id ? '#f8fafc' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Cairo' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 54, height: 54, background: c.shift === 'morning' ? '#fef9c3' : (c.shift === 'evening' ? '#dbeafe' : '#1e293b'), borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                                        {c.shift === 'morning' ? '☀️' : (c.shift === 'evening' ? '🌙' : '✨')}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>{c.employees?.name || 'موظف غير معروف'}</span>
                                            <span style={{ background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 7 }}>{c.branch}</span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                                            {c.count_date} • {c.shift === 'morning' ? 'صباحي' : (c.shift === 'evening' ? 'مسائي' : 'ليلي')} • 🕐 {new Date(c.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#6366f1', background: '#f0f4ff', padding: '6px 14px', borderRadius: 9 }}>{c.inventory_count_items.length} صنف</span>
                                    <span style={{ fontSize: 22, color: '#6366f1', fontWeight: 900, transform: expandedCount === c.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
                                </div>
                            </button>

                            {expandedCount === c.id && (
                                <div style={{ padding: '0 24px 24px' }}>
                                    <div style={{ height: 1.5, background: '#f1f5f9', margin: '0 0 18px' }}></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                                        {c.inventory_count_items.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontWeight: 700, color: '#475569', fontSize: 14 }}>{item.item_name}</span>
                                                <span style={{ fontWeight: 900, color: '#1e293b', fontSize: 16 }}>{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {c.notes && (
                                        <div style={{ marginTop: 18, padding: '12px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, color: '#92400e', fontSize: 14 }}>
                                            <strong>📝 ملاحظات:</strong> {c.notes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
