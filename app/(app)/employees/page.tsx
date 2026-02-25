'use client';
import { useEffect, useState } from 'react';

type Employee = { id: number; name: string; password: string; is_active: boolean; created_at: string };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPass, setNewPass] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [showPass, setShowPass] = useState<number | null>(null);

    const load = async () => {
        const data = await fetch('/api/employees').then(r => r.json());
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!newName.trim() || !newPass.trim()) return;
        setSaving(true);
        const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), password: newPass.trim() }) });
        const r = await res.json(); setSaving(false);
        if (res.ok) { setToast({ msg: 'تم إضافة الموظف', type: 'success' }); setNewName(''); setNewPass(''); load(); }
        else setToast({ msg: r.error || 'خطأ', type: 'error' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('حذف الموظف؟')) return;
        const r = await fetch(`/api/employees/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); load(); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const inp: React.CSSProperties = { width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 17, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

    return (
        <div style={{ padding: 28, direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 26px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900 }}>👥 إدارة الموظفين</h1>
                <button onClick={() => history.back()} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'Cairo' }}>→ العودة</button>
            </div>

            {/* Add Form */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '24px 28px', marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>+</span>
                    إضافة موظف جديد
                </h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#374151' }}>اسم الموظف *</label>
                        <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: أحمد محمد" />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#374151' }}>كلمة المرور *</label>
                        <input style={inp} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="باسوورد فريد للموظف" />
                    </div>
                    <button onClick={handleAdd} disabled={saving || !newName.trim() || !newPass.trim()} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!newName.trim() || !newPass.trim()) ? 0.5 : 1 }}>
                        ➕ إضافة
                    </button>
                </div>
            </div>

            {/* Employees List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                    {employees.map(emp => (
                        <div key={emp.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 19 }}>{emp.name}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{new Date(emp.created_at).toLocaleDateString('en-US')}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(emp.id)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', fontSize: 18 }}>🗑</button>
                            </div>
                            <div style={{ padding: '16px 22px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>كلمة المرور:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', fontFamily: 'monospace', letterSpacing: 2 }}>
                                            {showPass === emp.id ? emp.password : '••••••'}
                                        </span>
                                        <button onClick={() => setShowPass(showPass === emp.id ? null : emp.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo', color: '#6366f1', fontWeight: 700 }}>
                                            {showPass === emp.id ? 'إخفاء' : 'عرض'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {employees.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '70px 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: 52, marginBottom: 14 }}>👥</div>
                            <div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا يوجد موظفين بعد</div>
                            <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 6 }}>أضف موظف جديد من الأعلى</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
