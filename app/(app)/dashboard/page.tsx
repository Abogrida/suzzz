'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    Package, Tag, Users, FileText, TrendingUp,
    Settings, ClipboardList, UserCheck, ChefHat,
    LayoutDashboard, StickyNote, DollarSign, ShoppingCart,
    ArrowUpRight
} from 'lucide-react';

const pages = [
    {
        href: '/cashier-stats',
        label: 'لوحة الكاشير',
        desc: 'إحصائيات الشيفتات والمبيعات اليومية',
        icon: ShoppingCart,
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
        shadow: 'rgba(6,182,212,0.35)',
        glow: '#06b6d4',
    },
    {
        href: '/products',
        label: 'المخزن',
        desc: 'إدارة المنتجات والمخزون والكميات',
        icon: Package,
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
        shadow: 'rgba(14,165,233,0.35)',
        glow: '#0ea5e9',
    },
    {
        href: '/categories',
        label: 'الفئات',
        desc: 'تصنيف المنتجات وتنظيمها',
        icon: Tag,
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        shadow: 'rgba(139,92,246,0.35)',
        glow: '#8b5cf6',
    },
    {
        href: '/customers',
        label: 'العملاء والموردين',
        desc: 'إدارة بيانات العملاء والموردين',
        icon: Users,
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        shadow: 'rgba(245,158,11,0.35)',
        glow: '#f59e0b',
    },
    {
        href: '/invoices',
        label: 'الفواتير',
        desc: 'فواتير البيع والشراء وسجل المعاملات',
        icon: FileText,
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        shadow: 'rgba(16,185,129,0.35)',
        glow: '#10b981',
    },
    {
        href: '/recipes',
        label: 'الريسبي',
        desc: 'وصفات الأصناف ومكوناتها',
        icon: ChefHat,
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        shadow: 'rgba(239,68,68,0.35)',
        glow: '#ef4444',
    },
    {
        href: '/reports',
        label: 'التقارير',
        desc: 'تقارير المبيعات والأرباح والمصروفات',
        icon: TrendingUp,
        gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        shadow: 'rgba(99,102,241,0.35)',
        glow: '#6366f1',
    },
    {
        href: '/employees',
        label: 'الموظفين',
        desc: 'بيانات وسجلات الحضور والغياب',
        icon: UserCheck,
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
        shadow: 'rgba(20,184,166,0.35)',
        glow: '#14b8a6',
    },
    {
        href: '/employee/settlement',
        label: 'رواتب وتقفيلات',
        desc: 'حساب الرواتب وتسوية الحسابات',
        icon: DollarSign,
        gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        shadow: 'rgba(249,115,22,0.35)',
        glow: '#f97316',
    },
    {
        href: '/inventory-reports',
        label: 'تقارير الجرد',
        desc: 'تقارير الجرد الدوري والمقارنات',
        icon: ClipboardList,
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        shadow: 'rgba(236,72,153,0.35)',
        glow: '#ec4899',
    },
    {
        href: '/notes',
        label: 'ملاحظات الشغل',
        desc: 'مسودات وملاحظات العمل اليومية',
        icon: StickyNote,
        gradient: 'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)',
        shadow: 'rgba(132,204,22,0.35)',
        glow: '#84cc16',
    },
    {
        href: '/settings',
        label: 'الإعدادات',
        desc: 'ضبط إعدادات النظام والتفضيلات',
        icon: Settings,
        gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
        shadow: 'rgba(100,116,139,0.35)',
        glow: '#64748b',
    },
];

export default function DashboardPage() {
    const [visible, setVisible] = useState(false);
    const [user, setUser] = useState<{ id?: number; role: string; permissions: string[] } | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setUser(data);
            })
            .catch(() => { });

        return () => clearTimeout(t);
    }, []);

    // Filter cards based on user permissions
    const filteredPages = pages.filter(page => {
        if (!user) return false;
        // Super Admin bypass
        if (user.role === 'admin' && !user.id) return true;
        // Check permission checklist
        return user.permissions?.includes(page.href) || user.permissions?.some(p => page.href.startsWith(p + '/'));
    });

    return (
        <div style={{ direction: 'rtl', minHeight: '100vh', padding: '32px 20px 48px', fontFamily: 'Cairo, sans-serif' }}>

            {/* Hero Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: 48,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-24px)',
                transition: 'all 0.5s ease',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 72, height: 72, borderRadius: 20,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
                    marginBottom: 18,
                }}>
                    <LayoutDashboard size={36} color="#fff" />
                </div>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                    لوحة التحكم الرئيسية
                </h1>
                <p style={{ marginTop: 10, fontSize: 16, color: '#64748b', fontWeight: 600 }}>
                    اختر القسم الذي تريد الوصول إليه
                </p>
                <div style={{
                    width: 60, height: 4, borderRadius: 99, margin: '16px auto 0',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }} />
            </div>

            {/* Grid of Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 20,
                maxWidth: 1100,
                margin: '0 auto',
            }}>
                {filteredPages.map((page, i) => (
                    <NavCard key={page.href} page={page} index={i} visible={visible} />
                ))}
            </div>
        </div>
    );
}

function NavCard({ page, index, visible }: { page: typeof pages[0]; index: number; visible: boolean }) {
    const [hovered, setHovered] = useState(false);
    const Icon = page.icon;

    return (
        <Link
            href={page.href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'block',
                textDecoration: 'none',
                borderRadius: 20,
                background: '#fff',
                border: '1.5px solid',
                borderColor: hovered ? page.glow : 'rgba(0,0,0,0.06)',
                padding: '24px 22px',
                boxShadow: hovered
                    ? `0 16px 40px ${page.shadow}`
                    : '0 2px 12px rgba(0,0,0,0.06)',
                transform: visible
                    ? hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)'
                    : 'translateY(30px) scale(0.95)',
                opacity: visible ? 1 : 0,
                transition: `all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                transitionDelay: visible ? `${index * 45}ms` : '0ms',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background glow blob on hover */}
            <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 100, height: 100, borderRadius: '50%',
                background: page.gradient,
                opacity: hovered ? 0.12 : 0,
                transition: 'opacity 0.3s ease',
                filter: 'blur(20px)',
                pointerEvents: 'none',
            }} />

            {/* Icon */}
            <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: page.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 16px ${page.shadow}`,
                marginBottom: 16,
                transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
                transition: 'transform 0.3s ease',
            }}>
                <Icon size={26} color="#fff" />
            </div>

            {/* Text */}
            <div style={{ fontWeight: 900, fontSize: 17, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>
                {page.label}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, lineHeight: 1.6 }}>
                {page.desc}
            </div>

            {/* Arrow */}
            <div style={{
                position: 'absolute', bottom: 18, left: 18,
                width: 28, height: 28, borderRadius: 99,
                background: page.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(45deg)',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 10px ${page.shadow}`,
            }}>
                <ArrowUpRight size={14} color="#fff" style={{ transform: 'scaleX(-1)' }} />
            </div>
        </Link>
    );
}
