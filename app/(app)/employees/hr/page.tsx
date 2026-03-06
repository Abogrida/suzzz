'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type HREmployee = {
    id: number; name: string; job_title: string; phone: string;
    national_id: string; hire_date: string; base_salary: number;
    is_active: boolean; notes: string; created_at: string;
    work_start_time?: string; work_end_time?: string;
    late_threshold_minutes?: number; off_days?: number[];
    pin_code?: string;
};
type Payment = {
    id: number; employee_id: number; payment_type: string; amount: number;
    payment_date: string; notes: string; hr_employees?: { name: string };
};
type Attendance = {
    id: number; employee_id: number; attendance_date: string; status: string;
    notes: string; check_in_time?: string; check_out_time?: string;
    source?: string; synced_from_local?: boolean;
    hr_employees?: { name: string; job_title: string; work_start_time?: string };
};
type Leave = {
    id: number; employee_id: number; leave_start: string; leave_end: string;
    leave_type: string; notes: string;
};
type Purchase = {
    id: string; employee_id: number; item_name: string; amount: number;
    purchase_date: string; notes: string; hr_employees?: { name: string };
};

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const leaveTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
    annual: { label: 'إجازة سنوية', color: '#0ea5e9', bg: '#e0f2fe' },
    sick: { label: 'إجازة مرضية', color: '#f59e0b', bg: '#fef3c7' },
    unpaid: { label: 'إجازة بدون أجر', color: '#ef4444', bg: '#fee2e2' },
    other: { label: 'أخرى', color: '#6366f1', bg: '#ede9fe' },
};

const paymentLabels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    salary: { label: 'راتب', color: '#16a34a', bg: '#dcfce7', icon: '💵' },
    advance: { label: 'سلفة', color: '#f59e0b', bg: '#fef3c7', icon: '💳' },
    bonus: { label: 'حافز', color: '#6366f1', bg: '#ede9fe', icon: '🎁' },
    deduction: { label: 'خصم', color: '#ef4444', bg: '#fee2e2', icon: '✂️' },
};
const attendanceLabels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    present: { label: 'حاضر', color: '#16a34a', bg: '#dcfce7', icon: '✅' },
    absent: { label: 'غائب', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
    late: { label: 'متأخر', color: '#f59e0b', bg: '#fef3c7', icon: '⏰' },
    excused: { label: 'إجازة', color: '#0ea5e9', bg: '#e0f2fe', icon: '📋' },
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 30px', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, background: type === 'success' ? '#16a34a' : '#ef4444', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', fontFamily: 'Cairo' }}>{msg}</div>;
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Cairo', outline: 'none', background: '#fff', boxSizing: 'border-box' };
const label: React.CSSProperties = { display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 14, color: '#475569' };

const emptyEmp = { name: '', job_title: '', phone: '', national_id: '', hire_date: '', base_salary: '', is_active: true, notes: '', pin_code: '0000' };
const emptyPay = { employee_id: '', payment_type: 'salary', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' };
const emptyPurchase = { employee_id: '', item_name: '', amount: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' };

export default function HRPage() {
    const router = useRouter();
    const [tab, setTab] = useState<'employees' | 'payments' | 'attendance' | 'reports'>('employees');
    const [employees, setEmployees] = useState<HREmployee[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [saving, setSaving] = useState(false);

    // Employee modal
    const [empModal, setEmpModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState<HREmployee | null>(null);
    const [empForm, setEmpForm] = useState<any>(emptyEmp);

    // Payment modal
    const [payModal, setPayModal] = useState(false);
    const [payForm, setPayForm] = useState<any>(emptyPay);

    // Purchase modal
    const [purchaseModal, setPurchaseModal] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState<any>(emptyPurchase);

    // Attendance date & filters
    // Helper to get local date string YYYY-MM-DD avoiding UTC shift bugs
    const getLocalYYYYMMDD = (d = new Date()) => {
        const off = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - off).toISOString().split('T')[0];
    };

    const [attDate, setAttDate] = useState(getLocalYYYYMMDD());
    const [attSearch, setAttSearch] = useState('');
    const [attStatusFilter, setAttStatusFilter] = useState('all');
    const [attLoading, setAttLoading] = useState(false);

    // Selected employee for profile view
    const [selectedEmp, setSelectedEmp] = useState<HREmployee | null>(null);
    const [empPayments, setEmpPayments] = useState<Payment[]>([]);
    const [empPurchases, setEmpPurchases] = useState<Purchase[]>([]);
    const [empAttendance, setEmpAttendance] = useState<Attendance[]>([]);
    const [empLeaves, setEmpLeaves] = useState<Leave[]>([]);
    const [empProfileMonth, setEmpProfileMonth] = useState(getLocalYYYYMMDD().slice(0, 7));
    const [empProfileLoading, setEmpProfileLoading] = useState(false);

    // Employee modal tab
    const [empModalTab, setEmpModalTab] = useState<'info' | 'schedule' | 'leaves'>('info');

    // Leave form
    const [leaveForm, setLeaveForm] = useState({ leave_start: '', leave_end: '', leave_type: 'annual', notes: '' });

    // Manual attendance modal
    type ManualAttForm = { employee_id: number; employee_name: string; attendance_date: string; check_in_time: string; check_out_time: string; status: string; notes: string; };
    const emptyManualAtt: ManualAttForm = { employee_id: 0, employee_name: '', attendance_date: '', check_in_time: '', check_out_time: '', status: 'present', notes: '' };
    const [manualAttModal, setManualAttModal] = useState(false);
    const [manualAttForm, setManualAttForm] = useState<ManualAttForm>(emptyManualAtt);

    const openManualAtt = (empId: number, empName: string, dateStr: string) => {
        setManualAttForm({ ...emptyManualAtt, employee_id: empId, employee_name: empName, attendance_date: dateStr });
        setManualAttModal(true);
    };

    const loadEmployees = useCallback(async () => {
        const d = await fetch('/api/hr/employees').then(r => r.json());
        setEmployees(Array.isArray(d) ? d : []);
    }, []);

    const loadPayments = useCallback(async () => {
        const d = await fetch('/api/hr/payments').then(r => r.json());
        setPayments(Array.isArray(d) ? d : []);
    }, []);

    const loadPurchases = useCallback(async (monthOrDate: string) => {
        const d = await fetch(`/api/hr/purchases?month=${monthOrDate}`).then(r => r.json());
        setAllPurchases(Array.isArray(d) ? d : []);
    }, []);

    const loadAttendance = useCallback(async (monthOrDate: string) => {
        setAttLoading(true);
        // If it's a full date (YYYY-MM-DD), use it. If it's just a month (YYYY-MM), the backend should be able to handle it
        // and fetch all records starting with that month.
        const d = await fetch(`/api/hr/attendance?date=${monthOrDate}`).then(r => r.json());
        setAttendance(Array.isArray(d) ? d : []);
        setAttLoading(false);
    }, []);

    useEffect(() => {
        // By default load the current month for attendance
        const currentMonthPrefix = getLocalYYYYMMDD().slice(0, 7);
        Promise.all([loadEmployees(), loadPayments(), loadPurchases(currentMonthPrefix), loadAttendance(currentMonthPrefix)]).finally(() => setLoading(false));
    }, []);

    const handleSaveEmp = async () => {
        setSaving(true);
        const url = editingEmp ? `/api/hr/employees/${editingEmp.id}` : '/api/hr/employees';
        const method = editingEmp ? 'PUT' : 'POST';
        const payload = {
            ...empForm,
            base_salary: parseFloat(empForm.base_salary) || 0,
            late_threshold_minutes: empForm.late_threshold_minutes ?? 15,
            off_days: empForm.off_days || [],
        };
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setSaving(false);
        if (res.ok) {
            setToast({ msg: editingEmp ? 'تم التحديث' : 'تم الإضافة', type: 'success' });
            setEmpModal(false); setEditingEmp(null); setEmpForm(emptyEmp); setEmpModalTab('info'); loadEmployees();
        } else setToast({ msg: 'حدث خطأ', type: 'error' });
    };

    const handleDeleteEmp = async (id: number) => {
        if (!confirm('حذف الموظف وكل بياناته؟')) return;
        const r = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); loadEmployees(); if (selectedEmp?.id === id) setSelectedEmp(null); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const handleSavePay = async () => {
        if (!payForm.employee_id || !payForm.amount) return;
        setSaving(true);
        const res = await fetch('/api/hr/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payForm) });
        setSaving(false);
        if (res.ok) { setToast({ msg: 'تم التسجيل', type: 'success' }); setPayModal(false); setPayForm(emptyPay); loadPayments(); }
        else setToast({ msg: 'حدث خطأ', type: 'error' });
    };

    const handleSavePurchase = async () => {
        if (!purchaseForm.employee_id || !purchaseForm.item_name || !purchaseForm.amount) return;
        setSaving(true);
        const res = await fetch('/api/hr/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(purchaseForm) });
        setSaving(false);
        if (res.ok) { setToast({ msg: 'تم تسجيل المسحوبة', type: 'success' }); setPurchaseModal(false); setPurchaseForm(emptyPurchase); loadPurchases(getLocalYYYYMMDD().slice(0, 7)); if (selectedEmp) { const pur = await fetch(`/api/hr/purchases?employee_id=${selectedEmp.id}`).then(r => r.json()); setEmpPurchases(Array.isArray(pur) ? pur : []); } }
        else setToast({ msg: 'حدث خطأ', type: 'error' });
    };

    const handleDeletePay = async (id: number) => {
        if (!confirm('حذف هذه المدفوعة؟')) return;
        const r = await fetch(`/api/hr/payments/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (r.success) { setToast({ msg: 'تم الحذف', type: 'success' }); loadPayments(); }
        else setToast({ msg: 'فشل الحذف', type: 'error' });
    };

    const handleAttendance = async (empId: number, status: string) => {
        await fetch('/api/hr/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_id: empId, attendance_date: attDate, status }) });
        loadAttendance(attDate);
    };

    const loadEmpProfileMonth = async (empId: number, month: string) => {
        setEmpProfileLoading(true);
        const a = await fetch(`/api/hr/attendance?employee_id=${empId}&date=${month}`).then(r => r.json());
        setEmpAttendance(Array.isArray(a) ? a : []);
        setEmpProfileLoading(false);
    };

    const openEmpProfile = async (emp: HREmployee) => {
        setSelectedEmp(emp);
        const currentMonth = getLocalYYYYMMDD().slice(0, 7);
        setEmpProfileMonth(currentMonth);
        setEmpProfileLoading(true);

        const [p, pur, l] = await Promise.all([
            fetch(`/api/hr/payments?employee_id=${emp.id}`).then(r => r.json()),
            fetch(`/api/hr/purchases?employee_id=${emp.id}`).then(r => r.json()),
            fetch(`/api/hr/employees/${emp.id}/leaves`).then(r => r.json()),
        ]);
        setEmpPayments(Array.isArray(p) ? p : []);
        setEmpPurchases(Array.isArray(pur) ? pur : []);
        setEmpLeaves(Array.isArray(l) ? l : []);

        await loadEmpProfileMonth(emp.id, currentMonth);
    };

    const handleAddLeave = async (empId: number) => {
        if (!leaveForm.leave_start || !leaveForm.leave_end) return;
        setSaving(true);
        const res = await fetch(`/api/hr/employees/${empId}/leaves`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveForm),
        });
        setSaving(false);
        if (res.ok) {
            setToast({ msg: 'تمت إضافة الإجازة', type: 'success' });
            setLeaveForm({ leave_start: '', leave_end: '', leave_type: 'annual', notes: '' });
            const l = await fetch(`/api/hr/employees/${empId}/leaves`).then(r => r.json());
            setEmpLeaves(Array.isArray(l) ? l : []);
        } else setToast({ msg: 'فشل إضافة الإجازة', type: 'error' });
    };

    const handleDeleteLeave = async (empId: number, leaveId: number) => {
        await fetch(`/api/hr/employees/${empId}/leaves/${leaveId}`, { method: 'DELETE' });
        const l = await fetch(`/api/hr/employees/${empId}/leaves`).then(r => r.json());
        setEmpLeaves(Array.isArray(l) ? l : []);
        setToast({ msg: 'تم حذف الإجازة', type: 'success' });
    };

    const handleManualAtt = async () => {
        if (!manualAttForm.check_in_time) {
            setToast({ msg: 'يرجى إدخال وقت الحضور على الأقل', type: 'error' }); return;
        }
        setSaving(true);
        const res = await fetch('/api/hr/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id: manualAttForm.employee_id,
                attendance_date: manualAttForm.attendance_date,
                status: manualAttForm.status,
                check_in_time: manualAttForm.check_in_time || null,
                check_out_time: manualAttForm.check_out_time || null,
                notes: manualAttForm.notes || '',
                source: 'manual',
            }),
        });
        setSaving(false);
        if (res.ok) {
            setToast({ msg: 'تم تسجيل الحضور بنجاح ✅', type: 'success' });
            setManualAttModal(false);
            setManualAttForm(emptyManualAtt);
            if (selectedEmp) loadEmpProfileMonth(selectedEmp.id, empProfileMonth);
        } else {
            setToast({ msg: 'حدث خطأ أثناء الحفظ', type: 'error' });
        }
    };


    const tabs = [
        { key: 'employees', label: '👥 الموظفون' },
        { key: 'payments', label: '💰 المدفوعات' },
        { key: 'attendance', label: '📅 الحضور والغياب' },
        { key: 'reports', label: '📊 التقارير' },
    ] as const;

    // Reports calculations
    const currentMonth = getLocalYYYYMMDD().slice(0, 7);
    const monthPayments = payments.filter(p => p.payment_date?.startsWith(currentMonth));
    const monthPurchases = allPurchases.filter(p => p.purchase_date?.startsWith(currentMonth));

    if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 52 }}>⏳</div><div style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>جاري التحميل...</div></div>;

    return (
        <div className="page-content" style={{ direction: 'rtl', minHeight: '100vh' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                <span onClick={() => router.push('/employees')} style={{ cursor: 'pointer', color: '#0ea5e9', fontWeight: 700 }}>👥 الموظفون</span>
                <span>{'›'}</span>
                <span style={{ color: '#1e293b' }}>👔 إدارة الموظفين</span>
            </div>
            <h1 className="page-title" style={{ marginBottom: 20 }}>👔 إدارة الموظفين <span style={{ fontSize: 16, color: '#0ea5e9', fontWeight: 700 }}>HR System</span></h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', borderRadius: 14, padding: 6, flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{
                            flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                            background: tab === t.key ? '#fff' : 'transparent',
                            color: tab === t.key ? '#0ea5e9' : '#64748b',
                            boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        }}>{t.label}</button>
                ))}
            </div>

            {/* ===== TAB: EMPLOYEES ===== */}
            {tab === 'employees' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>{employees.filter(e => e.is_active).length} موظف نشط من {employees.length}</div>
                        <button onClick={() => { setEditingEmp(null); setEmpForm(emptyEmp); setEmpModal(true); }}
                            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 8 }}>
                            ➕ إضافة موظف
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {employees.map(emp => (
                            <div key={emp.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0', cursor: 'pointer' }}
                                onClick={() => openEmpProfile(emp)}>
                                {/* Header */}
                                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '20px 22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                                                {emp.is_active ? '👔' : '😴'}
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{emp.name}</div>
                                                <div style={{ color: '#7dd3fc', fontSize: 13, marginTop: 2 }}>{emp.job_title || 'موظف'}</div>
                                            </div>
                                        </div>
                                        <span style={{ background: emp.is_active ? '#16a34a' : '#6b7280', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                                            {emp.is_active ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </div>
                                </div>
                                {/* Body */}
                                <div style={{ padding: '16px 22px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>الراتب الأساسي</div>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{emp.base_salary.toLocaleString('ar-EG')} ج.م</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>تاريخ التعيين</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ar-EG') : '—'}</div>
                                        </div>
                                    </div>
                                    {emp.phone && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>📞 {emp.phone}</div>}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => { setEditingEmp(emp); setEmpForm({ ...emp, base_salary: emp.base_salary.toString(), hire_date: emp.hire_date || '' }); setEmpModal(true); }}
                                            style={{ flex: 1, background: '#f0f9ff', color: '#0ea5e9', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '8px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo' }}>✏️ تعديل</button>
                                        <button onClick={() => handleDeleteEmp(emp.id)}
                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, padding: '8px 12px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo' }}>🗑</button>
                                        <button onClick={() => { setPurchaseForm({ ...emptyPurchase, employee_id: emp.id.toString() }); setPurchaseModal(true); }}
                                            style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, padding: '8px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo' }}>🍔 مسحوبات</button>
                                        <button onClick={() => { setPayForm({ ...emptyPay, employee_id: emp.id.toString() }); setPayModal(true); }}
                                            style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '8px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo' }}>💰 حساب</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {employees.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: 56, marginBottom: 16 }}>👔</div>
                                <div style={{ fontWeight: 800, fontSize: 20, color: '#374151' }}>لا يوجد موظفون بعد</div>
                                <div style={{ fontSize: 14, marginTop: 8 }}>اضغط "إضافة موظف" للبدء</div>
                            </div>
                        )}
                    </div>

                    {/* Employee Profile Modal */}
                    {selectedEmp && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setSelectedEmp(null)}>
                            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                                {/* Header */}
                                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '28px 30px', borderRadius: '24px 24px 0 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👔</div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{selectedEmp.name}</div>
                                                <div style={{ color: '#7dd3fc', fontSize: 14, marginTop: 3 }}>{selectedEmp.job_title || 'موظف'}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedEmp(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', fontSize: 20 }}>✕</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
                                        {[
                                            { label: 'الراتب الأساسي', value: `${selectedEmp.base_salary.toLocaleString()} ج.م`, color: '#4ade80' },
                                            { label: 'إجمالي مدفوعاته', value: `${empPayments.filter(p => p.payment_type !== 'deduction').reduce((s, p) => s + p.amount, 0).toLocaleString()} ج.م`, color: '#60a5fa' },
                                            { label: 'إجمالي الخصومات', value: `${(empPayments.filter(p => p.payment_type === 'deduction').reduce((s, p) => s + p.amount, 0) + empPurchases.reduce((s, p) => s + Number(p.amount), 0)).toLocaleString()} ج.م`, color: '#f87171' },
                                        ].map(s => (
                                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ padding: '24px 30px' }}>
                                    {/* Details */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                        {selectedEmp.phone && <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}><div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>الهاتف</div><div style={{ fontWeight: 800, fontSize: 15 }}>📞 {selectedEmp.phone}</div></div>}
                                        {selectedEmp.national_id && <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}><div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>الرقم القومي</div><div style={{ fontWeight: 800, fontSize: 15 }}>🪪 {selectedEmp.national_id}</div></div>}
                                        {selectedEmp.hire_date && <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}><div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>تاريخ التعيين</div><div style={{ fontWeight: 800, fontSize: 15 }}>📅 {new Date(selectedEmp.hire_date).toLocaleDateString('ar-EG')}</div></div>}
                                        {selectedEmp.notes && <div style={{ background: '#fffbeb', borderRadius: 12, padding: '12px 16px' }}><div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>ملاحظات</div><div style={{ fontWeight: 700, fontSize: 14 }}>📝 {selectedEmp.notes}</div></div>}
                                    </div>

                                    {/* Payments History */}
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 14px', color: '#1e293b' }}>💰 سجل المدفوعات</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
                                        {empPayments.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>لا توجد مدفوعات</div> : empPayments.map(p => {
                                            const t = paymentLabels[p.payment_type] || paymentLabels.salary;
                                            return (
                                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '12px 16px', border: `1.5px solid ${t.bg}` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ background: t.bg, borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 800, color: t.color }}>{t.icon} {t.label}</span>
                                                        <span style={{ fontSize: 13, color: '#64748b' }}>{new Date(p.payment_date).toLocaleDateString('ar-EG')}</span>
                                                        {p.notes && <span style={{ fontSize: 12, color: '#94a3b8' }}>— {p.notes}</span>}
                                                    </div>
                                                    <div style={{ fontWeight: 900, fontSize: 16, color: p.payment_type === 'deduction' ? '#ef4444' : '#16a34a' }}>
                                                        {p.payment_type === 'deduction' ? '-' : '+'}{p.amount.toLocaleString()} ج.م
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Purchases History */}
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: '24px 0 14px', color: '#1e293b' }}>🍔 سجل المسحوبات كافيتيريا</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
                                        {empPurchases.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>لا توجد مسحوبات</div> : empPurchases.map(p => {
                                            return (
                                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, padding: '12px 16px', border: `1.5px solid #fecaca` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ background: '#fee2e2', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 800, color: '#ef4444' }}>🥤 {p.item_name}</span>
                                                        <span style={{ fontSize: 13, color: '#64748b' }}>{new Date(p.purchase_date).toLocaleDateString('ar-EG')}</span>
                                                        {p.notes && <span style={{ fontSize: 12, color: '#94a3b8' }}>— {p.notes}</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ fontWeight: 900, fontSize: 16, color: '#ef4444' }}>
                                                            -{Number(p.amount).toLocaleString()} ج.م
                                                        </div>
                                                        <button onClick={async () => {
                                                            if (!confirm('حذف هذه المسحوبة؟')) return;
                                                            await fetch(`/api/hr/purchases/${p.id}`, { method: 'DELETE' });
                                                            const pur = await fetch(`/api/hr/purchases?employee_id=${selectedEmp.id}`).then(r => r.json());
                                                            setEmpPurchases(Array.isArray(pur) ? pur : []);
                                                            loadPurchases(getLocalYYYYMMDD().slice(0, 7)); // update reports
                                                        }} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 13 }}>🗑</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Attendance Summary */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 14px' }}>
                                        <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1e293b', margin: 0 }}>📅 سجل وإحصائيات الحضور</h3>
                                        <input type="month" value={empProfileMonth} onChange={e => {
                                            setEmpProfileMonth(e.target.value);
                                            loadEmpProfileMonth(selectedEmp.id, e.target.value);
                                        }} style={{ ...inp, width: 'auto', padding: '6px 12px', fontSize: 14 }} />
                                    </div>

                                    {empProfileLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 800 }}>⏳ جاري التحميل...</div>
                                    ) : (() => {
                                        // Calculate late days — count unique DATES that have at least one 'late' record
                                        const lateDates = new Set(
                                            empAttendance.filter(a => a.status === 'late').map(a => a.attendance_date)
                                        );
                                        const lateDays = lateDates.size;

                                        const y = parseInt(empProfileMonth.split('-')[0]);
                                        const m = parseInt(empProfileMonth.split('-')[1]) - 1;
                                        const isCurrentMonth = new Date().getFullYear() === y && new Date().getMonth() === m;
                                        const daysInMonth = new Date(y, m + 1, 0).getDate();
                                        const todayDay = new Date().getDate();

                                        const offDaysKeys = selectedEmp.off_days || [];
                                        let expectedWorkDays = 0;
                                        let attendedDays = 0;
                                        let approvedLeaveDays = 0;
                                        let calculatedAbsences = 0;

                                        // Generate the detailed daily logs to view
                                        const dailyLogs = [];

                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const date = new Date(y, m, d);
                                            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                            const isFuture = date > new Date();
                                            const isOffDay = offDaysKeys.includes(date.getDay());

                                            // Check if employee has an approved leave for this day (sick/annual/etc)
                                            // Ensure leaves are loaded from empLeaves array
                                            const hasLeave = empLeaves.find(lv => {
                                                const ls = new Date(lv.leave_start).getTime();
                                                const le = new Date(lv.leave_end).getTime();
                                                const curr = date.getTime();
                                                return curr >= ls && curr <= le && !['unpaid'].includes(lv.leave_type);
                                            });

                                            // Find ALL attendance records for this date (multiple sessions possible)
                                            const dayRecords = empAttendance.filter(a => a.attendance_date === dateStr);
                                            const firstRecord = dayRecords[0] || null;
                                            const didAttend = dayRecords.some(r => ['present', 'late'].includes(r.status));
                                            const isExcused = dayRecords.some(r => r.status === 'excused');

                                            let displayStatus = '—';
                                            let displayObj: any = null;

                                            if (firstRecord) {
                                                displayObj = attendanceLabels[firstRecord.status] || attendanceLabels.present;
                                                displayStatus = displayObj.label;
                                            } else if (isFuture) {
                                                displayStatus = 'مستقبل';
                                            } else if (hasLeave) {
                                                displayStatus = 'إجازة معتمدة';
                                                displayObj = attendanceLabels.excused;
                                            } else if (isOffDay) {
                                                displayStatus = 'عطلة أسبوعية';
                                            } else {
                                                displayStatus = 'غائب';
                                                displayObj = attendanceLabels.absent;
                                            }

                                            dailyLogs.push({
                                                dayNum: d,
                                                dateStr,
                                                date,
                                                dayRecords,
                                                record: firstRecord,
                                                hasLeave,
                                                isOffDay,
                                                isFuture,
                                                displayStatus,
                                                displayObj,
                                            });

                                            // Stop counting stats for days that haven't arrived yet
                                            if (isFuture && isCurrentMonth) continue;

                                            if (!isOffDay) {
                                                expectedWorkDays++;
                                                if (hasLeave || isExcused) {
                                                    approvedLeaveDays++;
                                                } else if (didAttend) {
                                                    attendedDays++;
                                                } else {
                                                    calculatedAbsences++;
                                                }
                                            }
                                        }

                                        const actualAttended = attendedDays; // pure work days!
                                        const actualBase = Math.max(0, expectedWorkDays - approvedLeaveDays);
                                        const completionRate = actualBase > 0 ? Math.round((actualAttended / actualBase) * 100) : (approvedLeaveDays > 0 ? 100 : 0);

                                        let rating = { label: 'ممتاز 🌟', color: '#16a34a', bg: '#dcfce7' };
                                        if (completionRate < 70) rating = { label: 'ضعيف ⚠️', color: '#ef4444', bg: '#fee2e2' };
                                        else if (completionRate < 90) rating = { label: 'متوسط 📊', color: '#f59e0b', bg: '#fef3c7' };

                                        return (
                                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0' }}>
                                                {/* Stats Grid */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                                                    <div style={{ background: '#fff', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>{actualAttended}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>يوم عمل (حضور)</div>
                                                    </div>
                                                    <div style={{ background: '#fff', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: 24, fontWeight: 900, color: calculatedAbsences > 0 ? '#ef4444' : '#64748b' }}>{calculatedAbsences}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>يوم غياب (بدون عذر)</div>
                                                    </div>
                                                    <div style={{ background: '#fff', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{lateDays}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>مرات تأخير من الحضور</div>
                                                    </div>
                                                    <div style={{ background: rating.bg, borderRadius: 12, padding: '12px', textAlign: 'center', border: `1px solid ${rating.color}40` }}>
                                                        <div style={{ fontSize: 24, fontWeight: 900, color: rating.color }}>{completionRate}%</div>
                                                        <div style={{ fontSize: 12, color: rating.color, fontWeight: 800 }}>التقييم {rating.label}</div>
                                                    </div>
                                                </div>

                                                {/* Daily Logs Table — multiple sessions per day */}
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', marginBottom: 12 }}>تفاصيل السجل اليومي لشهر {new Date(y, m).toLocaleDateString('ar-EG', { month: 'long' })}:</div>
                                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                                                            <thead>
                                                                <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 800 }}>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>التاريخ</th>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>الجلسة</th>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>الحالة</th>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>حضور</th>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>انصراف</th>
                                                                    <th style={{ padding: '10px', borderBottom: '1.5px solid #e2e8f0' }}>إجراء</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {dailyLogs.slice().reverse().flatMap((log) => {
                                                                    const rowBg = log.isOffDay ? '#f8fafc' : (log.isFuture && isCurrentMonth) ? '#F9FAFB' : '#fff';
                                                                    const opacity = (log.isFuture && isCurrentMonth) ? 0.6 : 1;
                                                                    const dateCell = (
                                                                        <td style={{ padding: '10px', fontWeight: 800, color: '#374151', verticalAlign: 'top' }}>
                                                                            {log.dayNum} {log.date.toLocaleDateString('ar-EG', { weekday: 'short' })}
                                                                        </td>
                                                                    );

                                                                    // Days with no sessions at all → single summary row
                                                                    if (!log.dayRecords || log.dayRecords.length === 0) {
                                                                        return [
                                                                            <tr key={`${log.dayNum}-empty`} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg, opacity }}>
                                                                                {dateCell}
                                                                                <td style={{ padding: '10px' }}>—</td>
                                                                                <td style={{ padding: '10px' }}>
                                                                                    {log.displayObj ? (
                                                                                        <span style={{ background: log.displayObj.bg, color: log.displayObj.color, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                                                                                            {log.displayObj.icon} {log.displayObj.label}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{log.displayStatus}</span>
                                                                                    )}
                                                                                </td>
                                                                                <td style={{ padding: '10px', color: '#94a3b8' }}>—</td>
                                                                                <td style={{ padding: '10px', color: '#94a3b8' }}>—</td>
                                                                                <td style={{ padding: '10px' }}>
                                                                                    {!log.isFuture && !log.hasLeave && !log.isOffDay && (
                                                                                        <button
                                                                                            onClick={() => openManualAtt(selectedEmp.id, selectedEmp.name, log.dateStr)}
                                                                                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 800, fontFamily: 'Cairo', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                                            ✏️ تحضير يدوي
                                                                                        </button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ];
                                                                    }

                                                                    // Days WITH one or more sessions → one row per session
                                                                    return log.dayRecords.map((session: any, si: number) => {
                                                                        const sObj = attendanceLabels[session.status] || attendanceLabels.present;
                                                                        return (
                                                                            <tr key={`${log.dayNum}-s${si}`} style={{ borderBottom: '1px solid #f1f5f9', background: si % 2 === 0 ? rowBg : '#fafff8', opacity }}>
                                                                                {/* Show date only on first session */}
                                                                                {si === 0 ? dateCell : <td style={{ padding: '10px' }} />}
                                                                                <td style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                                                                                    {log.dayRecords.length > 1 ? `جلسة ${si + 1}` : '—'}
                                                                                </td>
                                                                                <td style={{ padding: '10px' }}>
                                                                                    <span style={{ background: sObj.bg, color: sObj.color, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                                                                                        {sObj.icon} {sObj.label}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '10px', fontWeight: 900, color: '#16a34a' }}>
                                                                                    {session.check_in_time ? session.check_in_time.slice(0, 5) : '—'}
                                                                                </td>
                                                                                <td style={{ padding: '10px', fontWeight: 900, color: '#ea580c' }}>
                                                                                    {session.check_out_time ? session.check_out_time.slice(0, 5) : '—'}
                                                                                </td>
                                                                                <td style={{ padding: '10px' }}>
                                                                                    <button
                                                                                        onClick={async () => {
                                                                                            if (!confirm('حذف هذه الجلسة نهائياً؟')) return;
                                                                                            await fetch(`/api/hr/attendance/${session.id}`, { method: 'DELETE' });
                                                                                            loadEmpProfileMonth(selectedEmp.id, empProfileMonth);
                                                                                        }}
                                                                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo' }}>🗑</button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    });
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== TAB: PAYMENTS ===== */}
            {tab === 'payments' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>{payments.length} سجل مدفوعات</div>
                        <button onClick={() => { setPayForm(emptyPay); setPayModal(true); }}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo' }}>
                            ➕ تسجيل مدفوعة
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                        {Object.entries(paymentLabels).map(([key, cfg]) => {
                            const total = payments.filter(p => p.payment_type === key).reduce((s, p) => s + p.amount, 0);
                            return (
                                <div key={key} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `2px solid ${cfg.bg}` }}>
                                    <div style={{ fontSize: 24, marginBottom: 6 }}>{cfg.icon}</div>
                                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>{cfg.label}</div>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color, marginTop: 4 }}>{total.toLocaleString()} ج.م</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payments Table */}
                    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'ملاحظات', ''].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#374151', fontSize: 14, borderBottom: '1.5px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p, i) => {
                                    const cfg = paymentLabels[p.payment_type] || paymentLabels.salary;
                                    const emp = employees.find(e => e.id === p.employee_id);
                                    return (
                                        <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 800 }}>{emp?.name || '—'}</td>
                                            <td style={{ padding: '12px 16px' }}><span style={{ background: cfg.bg, color: cfg.color, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 800 }}>{cfg.icon} {cfg.label}</span></td>
                                            <td style={{ padding: '12px 16px', fontWeight: 900, color: p.payment_type === 'deduction' ? '#ef4444' : '#16a34a' }}>
                                                {p.payment_type === 'deduction' ? '-' : '+'}{p.amount.toLocaleString()} ج.م
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(p.payment_date).toLocaleDateString('ar-EG')}</td>
                                            <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{p.notes || '—'}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <button onClick={() => handleDeletePay(p.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 13 }}>🗑 حذف</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {payments.length === 0 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>لا توجد مدفوعات بعد</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== TAB: ATTENDANCE ===== */}
            {tab === 'attendance' && (() => {
                const activeEmployees = employees.filter(e => e.is_active);

                // Provide a safe fallback if attendance state isn't an array
                const safeAttendance = Array.isArray(attendance) ? attendance : [];

                // Filter attendance based on the filters
                const filteredAttendance = safeAttendance.filter(a => {
                    if (attStatusFilter !== 'all' && a.status !== attStatusFilter) return false;

                    const emp = employees.find(e => e.id === a.employee_id);
                    if (attSearch && emp && !emp.name.toLowerCase().includes(attSearch.toLowerCase())) return false;

                    return true;
                });

                // Calculate month statistics based on filtered attendance
                const totalPresent = filteredAttendance.filter(a => a.status === 'present').length;
                const totalLate = filteredAttendance.filter(a => a.status === 'late').length;
                const totalAbsent = filteredAttendance.filter(a => a.status === 'absent').length;

                return (
                    <div>
                        {/* New Filter Bar Matching the Image */}
                        <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: 24, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>جدول الحضور والانصراف</span>
                                    <span>📅</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                <button onClick={() => { setAttDate(''); setAttSearch(''); setAttStatusFilter('all'); loadAttendance(''); }}
                                    style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                                    إلغاء الفلاتر
                                </button>

                                <select value={attStatusFilter} onChange={e => setAttStatusFilter(e.target.value)}
                                    style={{ ...inp, width: '200px', cursor: 'pointer' }}>
                                    <option value="all">كل الحالات</option>
                                    <option value="present">حاضر</option>
                                    <option value="late">متأخر</option>
                                    <option value="absent">غائب</option>
                                </select>

                                <input type="text" placeholder="ابحث باسم الموظف..." value={attSearch} onChange={e => setAttSearch(e.target.value)}
                                    style={{ ...inp, flex: 1, minWidth: '200px' }} />

                                <input type="date" value={attDate} onChange={e => {
                                    const val = e.target.value;
                                    setAttDate(val);
                                    if (val) loadAttendance(val);
                                    else loadAttendance(new Date().toISOString().slice(0, 7)); // reload month if date cleared
                                }}
                                    style={{ ...inp, width: '220px', color: '#0ea5e9', fontWeight: 800, background: '#f8fafc', borderColor: '#bae6fd' }} />
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'حاضر', value: totalPresent, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
                                { label: 'متأخر', value: totalLate, color: '#f59e0b', bg: '#fffbeb', border: '#fef08a', icon: '⏰' },
                                { label: 'غائب', value: totalAbsent, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
                            ].map(s => (
                                <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, border: `1px solid #e2e8f0`, borderRight: `5px solid ${s.color}` }}>
                                    <div style={{ fontSize: 26, background: s.bg, width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>{s.icon}</div>
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b' }}>{s.value}</div>
                                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 800 }}>إجمالي {s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {attLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, fontSize: 18, fontWeight: 800, color: '#64748b' }}>⏳ جاري الفلترة والتحميل...</div>
                        ) : (
                            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['الموظف', 'التاريخ', 'الحضور', 'الانصراف', 'الحالة', 'المصدر'].map(h => (
                                                <th key={h} style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 900, color: '#1e293b', borderBottom: '2px solid #e2e8f0', fontSize: 15 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAttendance.slice().sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()).map((record, i) => {
                                            const emp = employees.find(e => e.id === record.employee_id);
                                            const statusObj = attendanceLabels[record.status] || attendanceLabels.present;

                                            return (
                                                <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'default' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '16px 24px', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>
                                                        {emp?.name || 'مجهول'}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: '#64748b', fontWeight: 800, textAlign: 'center' }}>
                                                        {record.attendance_date}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: '#16a34a', fontWeight: 900, textAlign: 'center', fontSize: 15 }}>
                                                        {record.check_in_time ? record.check_in_time.slice(0, 5) : '—'}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: '#ea580c', fontWeight: 900, textAlign: 'center', fontSize: 15 }}>
                                                        {record.check_out_time ? record.check_out_time.slice(0, 5) : '—'}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ background: statusObj.bg, color: statusObj.color, borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            {statusObj.label} {statusObj.icon}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ background: '#f3e8ff', color: '#7e22ce', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            تطبيق البصمة 📱
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAttendance.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                                    <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#475569' }}>لا توجد بيانات مطابقة للفلتر المحدد</div>
                                                    <div style={{ fontSize: 14, marginTop: 8 }}>حاول تغيير التاريخ أو الغاء الفلاتر</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ===== TAB: REPORTS ===== */}
            {tab === 'reports' && (
                <div>
                    <div style={{ marginBottom: 20, fontSize: 18, fontWeight: 900, color: '#1e293b' }}>
                        📊 تقرير شهر {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                    </div>

                    {/* Overall Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                        {[
                            { label: 'إجمالي الرواتب', value: monthPayments.filter(p => p.payment_type === 'salary').reduce((s, p) => s + p.amount, 0), color: '#16a34a', icon: '💵' },
                            { label: 'إجمالي السلف', value: monthPayments.filter(p => p.payment_type === 'advance').reduce((s, p) => s + p.amount, 0), color: '#f59e0b', icon: '💳' },
                            { label: 'إجمالي الحوافز', value: monthPayments.filter(p => p.payment_type === 'bonus').reduce((s, p) => s + p.amount, 0), color: '#6366f1', icon: '🎁' },
                            { label: 'الخصومات + المسحوبات', value: monthPayments.filter(p => p.payment_type === 'deduction').reduce((s, p) => s + p.amount, 0) + monthPurchases.reduce((s, p) => s + Number(p.amount), 0), color: '#ef4444', icon: '✂️' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value.toLocaleString()} ج.م</div>
                                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Per Employee Report */}
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 16 }}>تفصيل لكل موظف</h3>
                    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['الموظف', 'الراتب الأساسي', 'الرواتب المدفوعة', 'السلف', 'الحوافز', 'الخصومات + المسحوبات', 'الصافي'].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#374151', borderBottom: '1.5px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, i) => {
                                    const empPays = monthPayments.filter(p => p.employee_id === emp.id);
                                    const salaries = empPays.filter(p => p.payment_type === 'salary').reduce((s, p) => s + p.amount, 0);
                                    const advances = empPays.filter(p => p.payment_type === 'advance').reduce((s, p) => s + p.amount, 0);
                                    const bonuses = empPays.filter(p => p.payment_type === 'bonus').reduce((s, p) => s + p.amount, 0);

                                    const empPur = monthPurchases.filter(p => p.employee_id === emp.id);
                                    const deductionsAndPurchases = empPays.filter(p => p.payment_type === 'deduction').reduce((s, p) => s + p.amount, 0) + empPur.reduce((s, p) => s + Number(p.amount), 0);

                                    const net = salaries + bonuses - deductionsAndPurchases - advances;
                                    return (
                                        <tr key={emp.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 900 }}>{emp.name}<div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.job_title}</div></td>
                                            <td style={{ padding: '12px 16px', color: '#64748b' }}>{emp.base_salary.toLocaleString()} ج.م</td>
                                            <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 800 }}>{salaries.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 800 }}>{advances.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', color: '#6366f1', fontWeight: 800 }}>{bonuses.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 800 }}>{deductionsAndPurchases.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 16, color: net >= 0 ? '#16a34a' : '#ef4444' }}>{net.toLocaleString()} ج.م</td>
                                        </tr>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>لا يوجد موظفون</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== EMPLOYEE MODAL ===== */}
            {empModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
                        {/* Modal Header */}
                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: '24px 24px 0 0', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{editingEmp ? '✏️ تعديل بيانات الموظف' : '➕ إضافة موظف جديد'}</div>
                            <button onClick={() => { setEmpModal(false); setEditingEmp(null); setEmpForm(emptyEmp); setEmpModalTab('info'); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>

                        {/* Modal Tabs */}
                        <div style={{ display: 'flex', gap: 0, background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            {([['info', '📋 البيانات'], ['schedule', '⏰ جدول العمل'], ['leaves', '🗓️ الإجازات']] as const).map(([k, l]) => (
                                <button key={k} onClick={() => setEmpModalTab(k)}
                                    style={{
                                        flex: 1, padding: '12px', border: 'none', background: 'transparent', fontFamily: 'Cairo', fontWeight: 800, fontSize: 14,
                                        color: empModalTab === k ? '#0ea5e9' : '#64748b',
                                        borderBottom: empModalTab === k ? '3px solid #0ea5e9' : '3px solid transparent',
                                        cursor: 'pointer', transition: 'all 0.15s'
                                    }}>{l}</button>
                            ))}
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            {/* TAB: بيانات */}
                            {empModalTab === 'info' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ gridColumn: '1/-1' }}><label style={label}>الاسم الكامل *</label><input style={inp} value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} placeholder="مثال: أحمد محمد علي" /></div>
                                    <div><label style={label}>المسمى الوظيفي</label><input style={inp} value={empForm.job_title} onChange={e => setEmpForm({ ...empForm, job_title: e.target.value })} placeholder="مثال: كاشير" /></div>
                                    <div><label style={label}>الرقم السري (PIN)</label><input type="text" style={inp} value={empForm.pin_code} onChange={e => setEmpForm({ ...empForm, pin_code: e.target.value })} placeholder="مثال: 1234" maxLength={4} title="رقم سري مكون من 4 أرقام للموظف" /></div>
                                    <div><label style={label}>رقم الهاتف</label><input style={inp} value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} placeholder="01xxxxxxxxx" /></div>
                                    <div><label style={label}>الرقم القومي</label><input style={inp} value={empForm.national_id} onChange={e => setEmpForm({ ...empForm, national_id: e.target.value })} placeholder="14 رقم" /></div>
                                    <div><label style={label}>تاريخ التعيين</label><input type="date" style={inp} value={empForm.hire_date} onChange={e => setEmpForm({ ...empForm, hire_date: e.target.value })} /></div>
                                    <div><label style={label}>الراتب الأساسي (ج.م)</label><input type="number" style={inp} value={empForm.base_salary} onChange={e => setEmpForm({ ...empForm, base_salary: e.target.value })} placeholder="0" /></div>
                                    <div style={{ gridColumn: '1/-1' }}><label style={label}>ملاحظات</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 72 } as React.CSSProperties} value={empForm.notes} onChange={e => setEmpForm({ ...empForm, notes: e.target.value })} placeholder="أي ملاحظات إضافية..." /></div>
                                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <input type="checkbox" id="is_active" checked={empForm.is_active} onChange={e => setEmpForm({ ...empForm, is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
                                        <label htmlFor="is_active" style={{ fontWeight: 700, fontSize: 15, color: '#374151', cursor: 'pointer' }}>موظف نشط</label>
                                    </div>
                                </div>
                            )}

                            {/* TAB: جدول العمل */}
                            {empModalTab === 'schedule' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div><label style={label}>⏰ بداية الدوام</label><input type="time" style={inp} value={empForm.work_start_time || '09:00'} onChange={e => setEmpForm({ ...empForm, work_start_time: e.target.value })} /></div>
                                        <div><label style={label}>🔚 نهاية الدوام</label><input type="time" style={inp} value={empForm.work_end_time || '17:00'} onChange={e => setEmpForm({ ...empForm, work_end_time: e.target.value })} /></div>
                                        <div style={{ gridColumn: '1/-1' }}><label style={label}>⏱️ هامش التأخير (دقيقة)</label><input type="number" style={inp} value={empForm.late_threshold_minutes ?? 15} onChange={e => setEmpForm({ ...empForm, late_threshold_minutes: parseInt(e.target.value) || 15 })} min={0} max={120} /></div>
                                    </div>
                                    <div>
                                        <label style={{ ...label, marginBottom: 12 }}>📅 أيام الراحة الأسبوعية</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {DAY_NAMES.map((day, idx) => {
                                                const offDays: number[] = empForm.off_days || [];
                                                const isOff = offDays.includes(idx);
                                                return (
                                                    <button key={idx} onClick={() => {
                                                        const next = isOff ? offDays.filter(d => d !== idx) : [...offDays, idx];
                                                        setEmpForm({ ...empForm, off_days: next });
                                                    }} style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${isOff ? '#ef4444' : '#e2e8f0'}`, background: isOff ? '#fee2e2' : '#f8fafc', color: isOff ? '#ef4444' : '#64748b', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 14, transition: 'all 0.15s' }}>
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>الأيام المضللة بالأحمر تُعتبر أيام راحة — لن يُحتسب الغياب فيها</div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: الإجازات */}
                            {empModalTab === 'leaves' && (
                                <div>
                                    {!editingEmp ? (
                                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                            <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
                                            <div style={{ fontWeight: 700 }}>احفظ بيانات الموظف أولاً ثم أضف الإجازات</div>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Add Leave Form */}
                                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '18px 20px', marginBottom: 20, border: '1.5px solid #e2e8f0' }}>
                                                <div style={{ fontWeight: 900, fontSize: 15, color: '#1e293b', marginBottom: 14 }}>➕ إضافة إجازة جديدة</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    <div><label style={label}>من تاريخ</label><input type="date" style={inp} value={leaveForm.leave_start} onChange={e => setLeaveForm({ ...leaveForm, leave_start: e.target.value })} /></div>
                                                    <div><label style={label}>إلى تاريخ</label><input type="date" style={inp} value={leaveForm.leave_end} onChange={e => setLeaveForm({ ...leaveForm, leave_end: e.target.value })} /></div>
                                                    <div>
                                                        <label style={label}>نوع الإجازة</label>
                                                        <select style={inp} value={leaveForm.leave_type} onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                                                            {Object.entries(leaveTypeLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div><label style={label}>ملاحظات</label><input style={inp} value={leaveForm.notes} onChange={e => setLeaveForm({ ...leaveForm, notes: e.target.value })} placeholder="اختياري" /></div>
                                                </div>
                                                <button onClick={() => handleAddLeave(editingEmp!.id)} disabled={saving || !leaveForm.leave_start || !leaveForm.leave_end}
                                                    style={{ marginTop: 14, width: '100%', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!leaveForm.leave_start || !leaveForm.leave_end) ? 0.6 : 1 }}>
                                                    {saving ? 'جاري الحفظ...' : '✅ إضافة الإجازة'}
                                                </button>
                                            </div>
                                            {/* Leaves List */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {empLeaves.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>لا توجد إجازات مسجلة</div>
                                                ) : empLeaves.map(lv => {
                                                    const cfg = leaveTypeLabels[lv.leave_type] || leaveTypeLabels.other;
                                                    return (
                                                        <div key={lv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: `1.5px solid ${cfg.bg}`, borderRadius: 12, padding: '12px 16px' }}>
                                                            <div>
                                                                <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800, marginLeft: 10 }}>{cfg.label}</span>
                                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{new Date(lv.leave_start).toLocaleDateString('ar-EG')} — {new Date(lv.leave_end).toLocaleDateString('ar-EG')}</span>
                                                                {lv.notes && <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>{lv.notes}</span>}
                                                            </div>
                                                            <button onClick={() => handleDeleteLeave(editingEmp!.id, lv.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 13 }}>🗑</button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer Buttons — only show on info/schedule tabs */}
                            {empModalTab !== 'leaves' && (
                                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                    <button onClick={handleSaveEmp} disabled={saving || !empForm.name.trim()}
                                        style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo', opacity: !empForm.name.trim() ? 0.6 : 1 }}>
                                        {saving ? 'جاري الحفظ...' : editingEmp ? '💾 حفظ التعديلات' : '➕ إضافة'}
                                    </button>
                                    <button onClick={() => { setEmpModal(false); setEditingEmp(null); setEmpForm(emptyEmp); setEmpModalTab('info'); }}
                                        style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== PAYMENT MODAL ===== */}
            {payModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>💰 تسجيل مدفوعة</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={label}>الموظف *</label>
                                <select style={inp} value={payForm.employee_id} onChange={e => setPayForm({ ...payForm, employee_id: e.target.value })}>
                                    <option value="">اختر موظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={label}>نوع المدفوعة *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {Object.entries(paymentLabels).map(([key, cfg]) => (
                                        <button key={key} onClick={() => setPayForm({ ...payForm, payment_type: key })}
                                            style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${payForm.payment_type === key ? cfg.color : '#e2e8f0'}`, background: payForm.payment_type === key ? cfg.bg : '#fff', color: payForm.payment_type === key ? cfg.color : '#64748b', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 800, fontSize: 15, transition: 'all 0.15s' }}>
                                            {cfg.icon} {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div><label style={label}>المبلغ (ج.م) *</label><input type="number" style={inp} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0" /></div>
                            <div><label style={label}>التاريخ</label><input type="date" style={inp} value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
                            <div><label style={label}>ملاحظات</label><input style={inp} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="مثال: راتب شهر فبراير" /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button onClick={handleSavePay} disabled={saving || !payForm.employee_id || !payForm.amount}
                                style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!payForm.employee_id || !payForm.amount) ? 0.6 : 1 }}>
                                {saving ? 'جاري التسجيل...' : '✅ تسجيل'}
                            </button>
                            <button onClick={() => { setPayModal(false); setPayForm(emptyPay); }}
                                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== PURCHASE MODAL ===== */}
            {purchaseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>🍔 تسجيل مسحوبة (كافيتيريا)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={label}>الموظف *</label>
                                <select style={inp} value={purchaseForm.employee_id} onChange={e => setPurchaseForm({ ...purchaseForm, employee_id: e.target.value })}>
                                    <option value="">اختر موظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div><label style={label}>الصنف / المسحوبة *</label><input style={inp} value={purchaseForm.item_name} onChange={e => setPurchaseForm({ ...purchaseForm, item_name: e.target.value })} placeholder="مثال: قهوة، شاي، وجبة..." /></div>
                            <div><label style={label}>المبلغ (ج.م) *</label><input type="number" style={inp} value={purchaseForm.amount} onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} placeholder="0" /></div>
                            <div><label style={label}>التاريخ</label><input type="date" style={inp} value={purchaseForm.purchase_date} onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} /></div>
                            <div><label style={label}>ملاحظات</label><input style={inp} value={purchaseForm.notes} onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="اختياري" /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button onClick={handleSavePurchase} disabled={saving || !purchaseForm.employee_id || !purchaseForm.amount || !purchaseForm.item_name}
                                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo', opacity: (!purchaseForm.employee_id || !purchaseForm.amount || !purchaseForm.item_name) ? 0.6 : 1 }}>
                                {saving ? 'جاري التسجيل...' : '✅ خصم'}
                            </button>
                            <button onClick={() => { setPurchaseModal(false); setPurchaseForm(emptyPurchase); }}
                                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ===== MANUAL ATTENDANCE MODAL ===== */}
            {manualAttModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
                    onClick={() => { setManualAttModal(false); }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, boxShadow: '0 30px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>✏️ تحضير يدوي</div>
                                <div style={{ color: '#7dd3fc', fontSize: 14, marginTop: 4 }}>
                                    {manualAttForm.employee_name} • {manualAttForm.attendance_date}
                                </div>
                            </div>
                            <button onClick={() => setManualAttModal(false)}
                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Status */}
                            <div>
                                <label style={label}>حالة الحضور</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {[
                                        { key: 'present', label: '✅ حاضر', color: '#16a34a', bg: '#dcfce7' },
                                        { key: 'late', label: '⏰ متأخر', color: '#f59e0b', bg: '#fef3c7' },
                                        { key: 'excused', label: '📋 إجازة', color: '#0ea5e9', bg: '#e0f2fe' },
                                    ].map(s => (
                                        <button key={s.key}
                                            onClick={() => setManualAttForm(f => ({ ...f, status: s.key }))}
                                            style={{
                                                flex: 1, padding: '10px 0', borderRadius: 12,
                                                border: `2px solid ${manualAttForm.status === s.key ? s.color : '#e2e8f0'}`,
                                                background: manualAttForm.status === s.key ? s.bg : '#f8fafc',
                                                color: manualAttForm.status === s.key ? s.color : '#64748b',
                                                fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo',
                                                transition: 'all 0.15s',
                                            }}>{s.label}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Times row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={label}>🟢 وقت الحضور *</label>
                                    <input type="time" value={manualAttForm.check_in_time}
                                        onChange={e => setManualAttForm(f => ({ ...f, check_in_time: e.target.value }))}
                                        style={{ ...inp, borderColor: manualAttForm.check_in_time ? '#16a34a' : '#e2e8f0', fontWeight: 800, fontSize: 20, textAlign: 'center' }} />
                                </div>
                                <div>
                                    <label style={label}>🔴 وقت الانصراف</label>
                                    <input type="time" value={manualAttForm.check_out_time}
                                        onChange={e => setManualAttForm(f => ({ ...f, check_out_time: e.target.value }))}
                                        style={{ ...inp, borderColor: manualAttForm.check_out_time ? '#ea580c' : '#e2e8f0', fontWeight: 800, fontSize: 20, textAlign: 'center' }} />
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>اختياري — اتركه فارغاً إذا لم ينصرف بعد</div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={label}>📝 ملاحظات (اختياري)</label>
                                <input style={inp} value={manualAttForm.notes}
                                    onChange={e => setManualAttForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="مثال: تأخر بسبب..."
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                <button onClick={handleManualAtt} disabled={saving || !manualAttForm.check_in_time}
                                    style={{
                                        flex: 1, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff',
                                        border: 'none', borderRadius: 14, padding: '14px', fontWeight: 900, fontSize: 16,
                                        cursor: saving || !manualAttForm.check_in_time ? 'not-allowed' : 'pointer',
                                        fontFamily: 'Cairo', opacity: !manualAttForm.check_in_time ? 0.5 : 1,
                                        transition: 'all 0.2s',
                                    }}>
                                    {saving ? '⏳ جاري الحفظ...' : '✅ تسجيل الحضور'}
                                </button>
                                <button onClick={() => setManualAttModal(false)}
                                    style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Cairo' }}>
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
