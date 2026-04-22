'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Tag, Users, FileText, TrendingUp, Settings, LogOut, Menu, X, ClipboardList, UserCheck, ChefHat, ShoppingBag, Clock, StickyNote, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';

const navLinks = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/products', label: 'المخزن', icon: Package },
    { href: '/recipes', label: 'الريسبي', icon: ChefHat },
    { href: '/categories', label: 'الفئات', icon: Tag },
    { href: '/customers', label: 'العملاء والموردين', icon: Users },
    { href: '/invoices', label: 'الفواتير', icon: FileText },
    { href: '/reports', label: 'التقارير', icon: TrendingUp },
    { href: '/employees', label: 'الموظفين', icon: UserCheck },
    { href: '/employee/settlement', label: 'رواتب وتقفيلات', icon: FileText },
    { href: '/inventory-reports', label: 'تقارير الجرد', icon: ClipboardList },
    { href: '/cashier-stats', label: 'لوحة الكاشير', icon: LayoutDashboard },
    { href: '/notes', label: 'ملاحظات الشغل', icon: StickyNote },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
    { href: '/settings/users', label: 'إدارة المستخدمين', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<{ id?: number; name: string; role: string; permissions: string[]; job_title: string } | null>(null);
    const { unreadCount } = useChat(user?.id);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setUser(data);
            })
            .catch(() => { });
    }, []);

    // Filter links based on permissions
    const filteredLinks = navLinks.filter(link => {
        if (!user) return false;
        
        // 🏆 Super Admin (Owner) - Bypasses everything
        // We know it's the owner because they don't have a DB 'id'
        if (user.role === 'admin' && !user.id) return true;

        // 🔒 Other Users (Admins/Staff from DB) - Must follow permissions
        if (user.permissions?.includes(link.href)) return true;
        
        // Check for sub-paths (e.g. /products/suzz1 should be allowed if /products is allowed)
        if (user.permissions?.some(p => link.href.startsWith(p + '/'))) return true;
        
        return false;
    });

    const isAuthorized = (href: string) => {
        if (!user) return false;
        if (user.role === 'admin' && !user.id) return true;
        return user.permissions?.includes(href) || user.permissions?.some(p => href.startsWith(p + '/'));
    };

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
                {filteredLinks.map(({ href, label, icon: Icon }) => {
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
                                position: 'relative'
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1e293b'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } }}
                        >
                            <Icon size={20} style={{ flexShrink: 0 }} />
                            <span>{label}</span>
                            {/* Special Badge for messages if we had a specific chat link, but since it's a widget, we just show unread in corner */}
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            {user && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: user.role === 'admin' ? '#f59e0b' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>
                            {user.name?.[0] || 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>{user.job_title || (user.role === 'admin' ? 'مدير النظام' : 'موظف')}</div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Mobile Bottom Navigation Bar */}
            <nav className="mobile-bottom-nav" style={{ direction: 'rtl' }}>
                {[
                    { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
                    { href: '/cashier-stats', label: 'الكاشير', icon: ShoppingBag },
                    { href: '/employees', label: 'الموظفين', icon: UserCheck },
                    { href: '/products', label: 'المخزن', icon: Package },
                ].filter(link => isAuthorized(link.href)).map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`mobile-nav-item${isActive ? ' active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon size={22} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
