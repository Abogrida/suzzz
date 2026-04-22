'use client';
import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Pencil, Trash2, Key, CheckCircle2, XCircle, LayoutDashboard, Package, ChefHat, Tag, FileText, TrendingUp, UserCheck, ClipboardList, StickyNote, Settings } from 'lucide-react';

const PAGES = [
    { id: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: '/products', label: 'المخزن', icon: Package },
    { id: '/recipes', label: 'الريسبي', icon: ChefHat },
    { id: '/categories', label: 'الفئات', icon: Tag },
    { id: '/customers', label: 'العملاء والموردين', icon: Users },
    { id: '/invoices', label: 'الفواتير', icon: FileText },
    { id: '/reports', label: 'التقارير', icon: TrendingUp },
    { id: '/employees', label: 'إدارة الموظفين (HR)', icon: UserCheck },
    { id: '/employee/inventory', label: 'صفحة الجرد', icon: ClipboardList },
    { id: '/employee/settlement', label: 'رواتب وتقفيلات', icon: FileText },
    { id: '/inventory-reports', label: 'تقارير الجرد', icon: ClipboardList },
    { id: '/cashier-stats', label: 'لوحة الكاشير', icon: LayoutDashboard },
    { id: '/notes', label: 'ملاحظات الشغل', icon: StickyNote },
    { id: '/settings', label: 'إعدادات النظام', icon: Settings },
    { id: '/settings/users', label: 'إدارة المستخدمين', icon: Users },
];

const S: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };

export default function UsersManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        password: '',
        job_title: '',
        role: 'staff',
        permissions: [] as string[],
        is_active: true,
        is_jard_only: false
    });

    const loadUsers = async () => {
        setLoading(true);
        const res = await fetch('/api/settings/users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { loadUsers(); }, []);

    const openModal = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setForm({
                name: user.name,
                password: '',
                job_title: user.job_title || '',
                role: user.role || 'staff',
                permissions: user.permissions || [],
                is_active: user.is_active !== false,
                is_jard_only: user.role === 'jard' || (user.permissions?.length === 1 && user.permissions[0] === '/employee/inventory')
            });
        } else {
            setEditingUser(null);
            setForm({ 
                name: '', 
                password: '', 
                job_title: 'موظف جرد', 
                role: 'staff', 
                permissions: ['/employee/inventory'], 
                is_active: true,
                is_jard_only: true 
            });
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || (!editingUser && !form.password)) return alert('يرجى إكمال البيانات الأساسية');
        setSaving(true);
        const url = editingUser ? `/api/settings/users/${editingUser.id}` : '/api/settings/users';
        const method = editingUser ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setSaving(false);
        if (res.ok) {
            setModalOpen(false);
            loadUsers();
        } else {
            const err = await res.json();
            alert('حدث خطأ أثناء الحفظ: ' + (err.error || 'خطأ غير معروف'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
        const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' });
        if (res.ok) loadUsers();
    };

    const togglePermission = (path: string) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(path) 
                ? prev.permissions.filter(p => p !== path)
                : [...prev.permissions, path]
        }));
    };

    return (
        <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Cairo' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#fff', padding: '20px 24px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Shield size={32} color="#6366f1" /> إدارة المستخدمين والصلاحيات
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>تحكم في من يدخل السيستم وماذا يرى</p>
                </div>
                <button onClick={() => openModal()} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    <UserPlus size={20} /> إضافة مستخدم جديد
                </button>
            </div>

            {/* Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: '#94a3b8' }}>جاري التحميل...</div>
                ) : users.map(user => (
                    <div key={user.id} style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
                            <button onClick={() => openModal(user)} style={{ background: '#f8fafc', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', cursor: 'pointer' }}><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(user.id)} style={{ background: '#f8fafc', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, background: user.role === 'admin' ? '#fef3c7' : '#e0f2fe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.role === 'admin' ? '#d97706' : '#0ea5e9', fontWeight: 900, fontSize: 24 }}>
                                {user.name[0]}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{user.name}</div>
                                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{user.job_title || 'بدون مسمى وظيفي'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                            <span style={{ background: user.is_active ? '#dcfce7' : '#fee2e2', color: user.is_active ? '#16a34a' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {user.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {user.is_active ? 'نشط' : 'معطل'}
                            </span>
                            <span style={{ background: user.role === 'admin' ? '#fef3c7' : (user.role === 'jard' ? '#f5f3ff' : '#e0f2fe'), color: user.role === 'admin' ? '#d97706' : (user.role === 'jard' ? '#6366f1' : '#0ea5e9'), padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                                {user.role === 'admin' ? 'مدير نظام' : (user.role === 'jard' || user.permissions?.includes('/employee/inventory') ? 'مسؤول جرد' : 'موظف')}
                            </span>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 10 }}>الصلاحيات ({user.permissions?.length || 0})</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {user.permissions?.slice(0, 4).map((p: string) => {
                                    const page = PAGES.find(pg => pg.id === p);
                                    return (
                                        <div key={p} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                            {page?.label || p}
                                        </div>
                                    );
                                })}
                                {user.permissions?.length > 4 && <div style={{ color: '#6366f1', fontSize: 11, fontWeight: 800 }}>+{user.permissions.length - 4} أخرى</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entry Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 25, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ background: '#6366f1', padding: '24px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer' }}><XCircle size={24} /></button>
                        </div>
                        
                        <div style={{ padding: 30 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 8 }}>الاسم بالكامل *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={S} placeholder="مثال: أحمد محمد" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 8 }}>{editingUser ? 'كلمة المرور (اتركها فارغة لعدم التغيير)' : 'كلمة المرور *'}</label>
                                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={S} placeholder="••••••••" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 8 }}>المسمى الوظيفي</label>
                                    <input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} style={S} placeholder="مثال: كاشير مسائي" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 8 }}>نوع الحساب</label>
                                    <div style={{ background: form.is_jard_only ? '#f5f3ff' : '#f8fafc', padding: '16px', borderRadius: 15, border: '1.5px dashed', borderColor: form.is_jard_only ? '#6366f1' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: 12, gridColumn: '1 / -1' }}>
                                        <input 
                                            type="checkbox" 
                                            id="jard_only"
                                            checked={form.is_jard_only} 
                                            onChange={e => {
                                                const val = e.target.checked;
                                                setForm({ 
                                                    ...form, 
                                                    is_jard_only: val,
                                                    role: val ? 'jard' : 'staff',
                                                    permissions: val ? ['/employee/inventory'] : ['/dashboard'],
                                                    job_title: val ? 'موظف جرد' : form.job_title
                                                });
                                            }}
                                            style={{ width: 22, height: 22, cursor: 'pointer' }}
                                        />
                                        <label htmlFor="jard_only" style={{ fontSize: 16, fontWeight: 900, color: form.is_jard_only ? '#6366f1' : '#1e293b', cursor: 'pointer' }}>تفعيل "موظف جرد فقط" (يفتح له صفحة الجرد مباشرة)</label>
                                    </div>
                                </div>
                            </div>

                            {!form.is_jard_only && (
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontWeight: 800, marginBottom: 12, borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>تحديد صفحات الوصول (الصلاحيات):</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                                        {PAGES.map(page => (
                                            <div 
                                                key={page.id} 
                                                onClick={() => togglePermission(page.id)}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: '1.5px solid',
                                                    borderColor: form.permissions.includes(page.id) ? '#6366f1' : '#e2e8f0',
                                                    background: form.permissions.includes(page.id) ? '#f5f3ff' : '#fff',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                <page.icon size={18} color={form.permissions.includes(page.id) ? '#6366f1' : '#64748b'} />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: form.permissions.includes(page.id) ? '#6366f1' : '#475569' }}>{page.label}</span>
                                                {form.permissions.includes(page.id) && <CheckCircle2 size={16} color="#6366f1" style={{ marginLeft: 'auto' }} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 20, height: 20 }} id="active" />
                                <label htmlFor="active" style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>الحساب نشط (يمكنه تسجيل الدخول)</label>
                            </div>

                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 15, padding: '16px', fontWeight: 900, fontSize: 18, cursor: 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(99,102,241,0.4)' }}
                            >
                                {saving ? 'جاري الحفظ...' : (editingUser ? 'حفظ التعديلات' : 'إنشاء الحساب')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
