'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Tag, Users, FileText, TrendingUp, Settings, LogOut, Menu, X, ClipboardList, UserCheck } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/products', label: 'المنتجات', icon: Package },
    { href: '/categories', label: 'الفئات', icon: Tag },
    { href: '/customers', label: 'العملاء والموردين', icon: Users },
    { href: '/invoices', label: 'الفواتير', icon: FileText },
    { href: '/reports', label: 'التقارير', icon: TrendingUp },
    { href: '/employees', label: 'الموظفين', icon: UserCheck },
    { href: '/inventory-reports', label: 'تقارير الجرد', icon: ClipboardList },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, background: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                        <Package size={26} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, color: '#fff', fontSize: 16, lineHeight: 1.2 }}>نظام المخزون</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>Inventory System</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 14px', borderRadius: 10,
                                fontSize: 15, fontWeight: 700,
                                color: isActive ? '#fff' : '#94a3b8',
                                background: isActive ? '#6366f1' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                                fontFamily: 'Cairo, sans-serif',
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1e293b'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } }}
                        >
                            <Icon size={20} style={{ flexShrink: 0 }} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    <LogOut size={20} style={{ flexShrink: 0 }} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header - Only visible on small screens */}
            <div className="mobile-header lg:hidden" style={{
                position: 'fixed', top: 0, right: 0, left: 0, height: 60,
                background: '#0f172a', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 16px', zIndex: 35,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)', direction: 'rtl',
                display: undefined // Let CSS handle visibility
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color="#fff" />
                    </div>
                    <div style={{ fontWeight: 900, color: '#fff', fontSize: 14 }}>نظام المخزون</div>
                </div>
                <button onClick={() => setMobileOpen(true)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <Menu size={28} />
                </button>
            </div>

            {/* Backdrop for Mobile */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 38, backdropFilter: 'blur(2px)' }}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div style={{ justifyContent: 'flex-end', padding: '10px', display: mobileOpen ? 'flex' : 'none' }}>
                    <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={28} />
                    </button>
                </div>
                <SidebarContent />
            </aside>
        </>
    );
}
