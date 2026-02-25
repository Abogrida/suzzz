'use client';
import { useEffect, useState } from 'react';

type Employee = { id: number; name: string; password: string; is_active: boolean; created_at: string };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

export default function EmployeeAccountsPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPass, setNewPass] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [showPass, setShowPass] = useState<number | null>(null);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [editName, setEditName] = useState('');
    const [editPass, setEditPass] = useState('');

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

    const handleUpdate = async () => {
        if (!editingEmp || !editName.trim() || !editPass.trim()) return;
        setSaving(true);
        const res = await fetch(`/api/employees/${editingEmp.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), password: editPass.trim() }) });
        setSaving(false);
        if (res.ok) { setToast({ msg: 'تم تحديث البيانات', type: 'success' }); setEditingEmp(null); load(); }
        else setToast({ msg: 'فشل التحديث', type: 'error' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('حذف الموظف؟')) return;
        const r = await fetch(`/api/employees/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); load(); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const inp: React.CSSProperties = { width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 17, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {editingEmp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 30, width: '100%', maxWidth: 450, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>📝 تعديل بيانات الموظف</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div><label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#475569' }}>الاسم</label><input style={inp} value={editName} onChange={e => setEditName(e.target.value)} /></div>
                            <div><label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 15, color: '#475569' }}>كلمة المرور الجديدة</label><input style={inp} value={editPass} onChange={e => setEditPass(e.target.value)} /></div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                <button onClick={handleUpdate} disabled={saving} style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                                <button onClick={() => setEditingEmp(null)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                <span onClick={() => window.history.back()} style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 700 }}>👥 الموظفون</span>
                <span>{'›'}</span>
                <span style={{ color: '#1e293b' }}>🔐 حسابات الجرد</span>
            </div>

            <div className="page-header">
                <h1 className="page-title">🔐 حسابات الجرد</h1>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</span>
                    إضافة موظف جديد
                </h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 160 }}><label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 14, color: '#374151' }}>اسم الموظف *</label><input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: أحمد محمد" /></div>
                    <div style={{ flex: 1, minWidth: 160 }}><label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 14, color: '#374151' }}>كلمة المرور *</label><input style={inp} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="باسوورد فريد" /></div>
                    <button onClick={handleAdd} disabled={saving || !newName.trim() || !newPass.trim()} className="btn" style={{ background: '#6366f1', color: '#fff', opacity: (!newName.trim() || !newPass.trim()) ? 0.5 : 1 }}>➕ إضافة</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {employees.map(emp => (
                        <div key={emp.id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👤</div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 19 }}>{emp.name}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>{new Date(emp.created_at).toLocaleDateString('ar-EG')}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => { setEditingEmp(emp); setEditName(emp.name); setEditPass(emp.password); }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                                    <button onClick={() => handleDelete(emp.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
                                </div>
                            </div>
                            <div style={{ padding: '18px 22px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>كلمة المرور</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', letterSpacing: showPass === emp.id ? 1 : 4 }}>{showPass === emp.id ? emp.password : '••••••'}</div>
                                </div>
                                <button onClick={() => setShowPass(showPass === emp.id ? null : emp.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo', color: '#6366f1', fontWeight: 800 }}>{showPass === emp.id ? 'إخفاء' : 'عرض'}</button>
                            </div>
                        </div>
                    ))}
                    {employees.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '70px 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: 52, marginBottom: 14 }}>👥</div>
                            <div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا يوجد موظفين بعد</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
