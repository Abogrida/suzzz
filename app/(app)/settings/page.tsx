'use client';

import { useState } from 'react';
import { Settings, Lock, Info, CheckCircle, XCircle } from 'lucide-react';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useState(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); });
    return <div className={type === 'success' ? 'toast-success' : 'toast-error'}>{msg}</div>;
}

export default function SettingsPage() {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setToast({ msg: 'كلمة المرور الجديدة وتأكيدها غير متطابقتان', type: 'error' });
            return;
        }
        if (newPass.length < 4) {
            setToast({ msg: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            // Verify old password first by trying to login
            const verifyRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: oldPass }),
            });

            if (!verifyRes.ok) {
                setToast({ msg: 'كلمة المرور الحالية غير صحيحة', type: 'error' });
                setLoading(false);
                return;
            }

            // Update password in DB
            const updateRes = await fetch('/api/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: newPass }),
            });

            if (updateRes.ok) {
                setToast({ msg: 'تم تغيير كلمة المرور بنجاح!', type: 'success' });
                setOldPass(''); setNewPass(''); setConfirmPass('');
            } else {
                const data = await updateRes.json();
                setToast({ msg: data.error || 'حدث خطأ أثناء التحديث', type: 'error' });
            }
        } catch {
            setToast({ msg: 'حدث خطأ في الاتصال بالسيرفر', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const sysInfo = [
        { label: 'اسم النظام', value: 'نظام إدارة المخزون' },
        { label: 'الإصدار', value: '1.0.0' },
        { label: 'قاعدة البيانات', value: 'Supabase PostgreSQL' },
        { label: 'المشروع', value: 'vmkfwhnpevbamrfbjkzv' },
        { label: 'Framework', value: 'Next.js 16' },
        { label: 'البيئة', value: process.env.NODE_ENV || 'development' },
    ];

    return (
        <div className="page-content">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            <div className="page-header">
                <h1 className="page-title">الإعدادات</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Change Password */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">تغيير كلمة المرور</h2>
                    </div>
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">كلمة المرور الحالية</label>
                            <input type="password" className="form-input" value={oldPass} onChange={e => setOldPass(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">كلمة المرور الجديدة</label>
                            <input type="password" className="form-input" value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={4} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                            <input type="password" className="form-input" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
                        </div>
                        {newPass && confirmPass && (
                            <div className={`flex items-center gap-2 text-sm ${newPass === confirmPass ? 'text-green-600' : 'text-red-600'}`}>
                                {newPass === confirmPass ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {newPass === confirmPass ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? <div className="spinner" /> : <><Lock className="w-4 h-4" /> تغيير كلمة المرور</>}
                        </button>
                    </form>
                </div>

                {/* System Info */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">معلومات النظام</h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {sysInfo.map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500 text-sm">{label}</span>
                                <span className="font-semibold text-gray-800 text-sm">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">إجراءات النظام</h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        <a href="/api/export/products/excel" className="btn btn-outline justify-start">
                            📥 تصدير المنتجات (Excel)
                        </a>
                        <a href="/api/export/invoices/excel" className="btn btn-outline justify-start">
                            📥 تصدير الفواتير (Excel)
                        </a>
                        <button
                            onClick={async () => {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/login';
                            }}
                            className="btn btn-danger justify-start"
                        >
                            🚪 تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
