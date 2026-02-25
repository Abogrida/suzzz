'use client';
import { useEffect, useState } from 'react';

type Employee = { id: number; name: string; created_at: string };
type CountItem = { id: number; item_name: string; quantity: number };
type InventoryCount = { id: number; employee_id: number; employee_name: string; count_date: string; shift: string; notes: string; created_at: string; items: CountItem[] };

export default function InventoryReportsPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [counts, setCounts] = useState<InventoryCount[]>([]);
    const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
    const [expandedCount, setExpandedCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingCounts, setLoadingCounts] = useState(false);

    useEffect(() => {
        fetch('/api/employees').then(r => r.json()).then(d => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); });
    }, []);

    const selectEmployee = async (empId: number) => {
        if (selectedEmp === empId) { setSelectedEmp(null); return; }
        setSelectedEmp(empId);
        setLoadingCounts(true);
        setExpandedCount(null);
        const data = await fetch(`/api/inventory-counts?employee_id=${empId}`).then(r => r.json());
        setCounts(Array.isArray(data) ? data : []);
        setLoadingCounts(false);
    };

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 26px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900 }}>📊 تقارير الجرد</h1>
                <button onClick={() => history.back()} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'Cairo' }}>→ العودة</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div>
            ) : employees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 0', color: '#94a3b8' }}><div style={{ fontSize: 52, marginBottom: 14 }}>👥</div><div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا يوجد موظفين</div></div>
            ) : (
                <>
                    {/* Employees Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {employees.map(emp => (
                            <button key={emp.id} onClick={() => selectEmployee(emp.id)}
                                style={{ background: selectedEmp === emp.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff', borderRadius: 16, padding: '22px 20px', border: selectedEmp === emp.id ? '2px solid #6366f1' : '1.5px solid #e2e8f0', cursor: 'pointer', textAlign: 'right', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.2s', fontFamily: 'Cairo' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 48, height: 48, background: selectedEmp === emp.id ? 'rgba(255,255,255,0.2)' : '#ede9fe', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: 18, color: selectedEmp === emp.id ? '#fff' : '#1e293b' }}>{emp.name}</div>
                                        <div style={{ fontSize: 13, color: selectedEmp === emp.id ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 2 }}>اضغط لعرض التقارير</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Counts Section */}
                    {selectedEmp && (
                        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', border: '2px solid #e0e7ff' }}>
                            <div style={{ background: '#f0f0ff', padding: '18px 26px', borderBottom: '2px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#4338ca' }}>
                                    📋 تقارير {employees.find(e => e.id === selectedEmp)?.name}
                                </h2>
                                <span style={{ background: '#6366f1', color: '#fff', borderRadius: 10, padding: '6px 16px', fontWeight: 800, fontSize: 15 }}>{counts.length} تقرير</span>
                            </div>

                            {loadingCounts ? (
                                <div style={{ textAlign: 'center', padding: 50 }}><div style={{ fontSize: 40 }}>⏳</div></div>
                            ) : counts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
                                    <div style={{ fontWeight: 700, fontSize: 17, color: '#374151' }}>لا توجد تقارير جرد</div>
                                </div>
                            ) : (
                                <div style={{ padding: 20 }}>
                                    {counts.map(c => (
                                        <div key={c.id} style={{ marginBottom: 14, border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                                            {/* Count Header */}
                                            <button onClick={() => setExpandedCount(expandedCount === c.id ? null : c.id)}
                                                style={{ width: '100%', padding: '16px 20px', background: expandedCount === c.id ? '#f0f0ff' : '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Cairo', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <div style={{ background: c.shift === 'morning' ? '#fef9c3' : '#1e293b', borderRadius: 10, padding: '8px 14px', fontSize: 22 }}>
                                                        {c.shift === 'morning' ? '☀️' : '🌙'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>{c.count_date}</div>
                                                        <div style={{ fontSize: 13, color: '#64748b' }}>{c.shift === 'morning' ? 'شيفت صباحي' : 'شيفت مسائي'} • {c.items.length} صنف</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: 22, color: '#6366f1', fontWeight: 900, transform: expandedCount === c.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>⌄</span>
                                            </button>

                                            {/* Expanded Items */}
                                            {expandedCount === c.id && (
                                                <div style={{ padding: '0 16px 16px', background: '#fff' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                                                        <thead>
                                                            <tr style={{ background: '#1e293b' }}>
                                                                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 800, textAlign: 'right', fontSize: 15, borderRadius: '0 8px 0 0' }}>#</th>
                                                                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 800, textAlign: 'right', fontSize: 15 }}>الصنف</th>
                                                                <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: 15, borderRadius: '8px 0 0 0' }}>الكمية (جرام)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {c.items.map((item, i) => (
                                                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#64748b', fontSize: 14 }}>{i + 1}</td>
                                                                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#1e293b', fontSize: 16 }}>{item.item_name}</td>
                                                                    <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: item.quantity > 0 ? '#16a34a' : '#94a3b8' }}>{item.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {c.notes && <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef9c3', borderRadius: 10, fontSize: 14, color: '#92400e' }}>📝 {c.notes}</div>}
                                                    <div style={{ textAlign: 'left', marginTop: 10, fontSize: 13, color: '#94a3b8' }}>🕐 {new Date(c.created_at).toLocaleString('en-US')}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
