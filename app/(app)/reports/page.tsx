'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Download } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

type Summary = { total_sales: number; total_purchases: number; total_profit: number; total_paid: number; total_remaining: number; inventory_value: number };
type Monthly = { month: string; sales: number; purchases: number; profit: number; monthName?: string };

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 0 });
const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b'];
const MONTHS: Record<string, string> = { '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل', '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس', '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر' };

export default function ReportsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthly, setMonthly] = useState<Monthly[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/reports/financial-summary').then(r => r.json()),
            fetch(`/api/reports/monthly-financial?year=${year}`).then(r => r.json()),
        ]).then(([s, m]) => {
            setSummary(s);
            setMonthly((Array.isArray(m) ? m : []).map((item: Monthly) => ({ ...item, monthName: MONTHS[item.month?.slice(5, 7) ?? ''] || item.month })));
            setLoading(false);
        });
    }, [year]);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

    const pieData = [
        { name: 'المبيعات', value: summary?.total_sales || 0 },
        { name: 'المشتريات', value: summary?.total_purchases || 0 },
        { name: 'قيمة المخزون', value: summary?.inventory_value || 0 },
    ];

    return (
        <div className="page-content">
            <div className="page-header">
                <h1 className="page-title">التقارير والإحصائيات</h1>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="form-input w-32">
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'إجمالي المبيعات', val: summary?.total_sales, color: 'text-green-600', bg: 'bg-green-50', Icon: TrendingUp },
                    { label: 'إجمالي المشتريات', val: summary?.total_purchases, color: 'text-blue-600', bg: 'bg-blue-50', Icon: TrendingDown },
                    { label: 'صافي الربح', val: summary?.total_profit, color: (summary?.total_profit ?? 0) >= 0 ? 'text-indigo-600' : 'text-red-600', bg: 'bg-indigo-50', Icon: DollarSign },
                    { label: 'قيمة المخزون', val: summary?.inventory_value, color: 'text-amber-600', bg: 'bg-amber-50', Icon: Package },
                    { label: 'إجمالي المدفوع', val: summary?.total_paid, color: 'text-green-600', bg: 'bg-green-50', Icon: DollarSign },
                    { label: 'إجمالي المتبقي', val: summary?.total_remaining, color: 'text-red-600', bg: 'bg-red-50', Icon: DollarSign },
                ].map(({ label, val, color, bg, Icon }) => (
                    <div key={label} className="stat-card">
                        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2`}><Icon className={`w-5 h-5 ${color}`} /></div>
                        <div className={`text-2xl font-bold ${color}`}>{fmt(val)}</div>
                        <div className="text-sm text-gray-500">{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="col-span-2 card">
                    <h2 className="font-bold text-gray-800 mb-4">المبيعات والمشتريات الشهرية - {year}</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={((v: number | undefined) => fmt(v)) as any} />
                            <Legend />
                            <Bar dataKey="sales" name="مبيعات" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="purchases" name="مشتريات" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h2 className="font-bold text-gray-800 mb-4">توزيع المبالغ</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={((v: number | undefined) => fmt(v)) as any} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-2">
                        {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} /><span className="text-gray-600">{d.name}</span></div>
                                <span className="font-semibold">{fmt(d.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card mb-6">
                <h2 className="font-bold text-gray-800 mb-4">الربح الشهري</h2>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={((v: number | undefined) => fmt(v)) as any} />
                        <Line type="monotone" dataKey="profit" name="الربح" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">التفاصيل الشهرية</h2>
                    <a href="/api/export/invoices/excel" className="btn btn-outline btn-sm"><Download className="w-4 h-4" />تصدير</a>
                </div>
                <table className="data-table">
                    <thead><tr><th>الشهر</th><th>المبيعات</th><th>المشتريات</th><th>الربح</th></tr></thead>
                    <tbody>
                        {(monthly as any[]).map((m: any) => (
                            <tr key={m.month}>
                                <td className="font-medium">{m.monthName}</td>
                                <td className="amount text-green-600">{fmt(m.sales)}</td>
                                <td className="amount text-blue-600">{fmt(m.purchases)}</td>
                                <td className={`amount font-bold ${m.profit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{fmt(m.profit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
