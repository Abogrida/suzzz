import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isSuperAdmin } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't need auth (or handle it with their own API keys)
    const publicPaths = ['/login', '/api/auth/login', '/api/auth/me', '/share/', '/api/employee/profile', '/api/products', '/api/inventory/sync'];
    if (publicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Public API: single inventory count (used by share page)
    if (/^\/api\/inventory-counts\/\d+$/.test(pathname)) {
        return NextResponse.next();
    }

    const isAdmin = isSuperAdmin(request);
    const empToken = request.cookies.get('sys-user-token')?.value;
    let userPermissions: string[] = [];
    let userRole = '';

    if (empToken) {
        try {
            // Base64 decode
            const decoded = Buffer.from(empToken, 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded);
            userPermissions = parsed.permissions || [];
            userRole = parsed.role || 'staff';
        } catch (e) {
            console.error('Middleware: Error parsing base64 employee token', e);
        }
    }

    // API routes
    if (pathname.startsWith('/api/')) {
        // 🏆 Super Admin bypass
        if (isAdmin) return NextResponse.next();

        // 1. Common APIs & Super Admin bypass
        const isChat = pathname.includes('/api/chat');
        const commonApis = ['/api/auth/logout', '/api/auth/me', '/api/employee/profile', '/api/employees', '/api/settings/inventory-items', '/api/inventory-counts/latest'];
        const isCommon = commonApis.some(p => pathname === p || pathname.startsWith(p + '/'));
        
        if (isAdmin || isChat || isCommon) {
            return NextResponse.next();
        }

        // 2. Permission-based APIs
        const apiPermissionMap: Record<string, string[]> = {
            '/api/chat': ['/inventory-reports', '/employee/inventory', '/products', '/categories', '/customers', '/invoices', '/recipes', '/reports', '/employees', '/employee/settlement', '/settings/users', '/settings', '/notes', '/employee/profile'],
            '/api/inventory-counts': ['/inventory-reports', '/employee/inventory'],
            '/api/products': ['/products', '/inventory-reports', '/recipes'],
            '/api/categories': ['/categories', '/products'],
            '/api/customers': ['/customers', '/invoices'],
            '/api/invoices': ['/invoices', '/reports'],
            '/api/recipes': ['/recipes'],
            '/api/reports': ['/reports'],
            '/api/hr': ['/employees', '/employee/settlement'],
            '/api/settings/users': ['/settings/users'],
            '/api/settings/inventory-items': ['/employee/inventory', '/settings'],
            '/api/settings': ['/settings'],
            '/api/notes': ['/notes'],
        };

        if (userRole) {
            // Check if any of the user's permissions grant access to this API
            const hasApiAccess = Object.entries(apiPermissionMap).some(([apiPath, allowedPages]) => {
                if (pathname.startsWith(apiPath)) {
                    return allowedPages.some(page => userPermissions.includes(page));
                }
                return false;
            });

            if (hasApiAccess) return NextResponse.next();
        }

        return NextResponse.json({ error: 'غير مصرح لك بالوصول لهذه العملية' }, { status: 403 });
    }

    // Page routes
    if (pathname === '/login') {
        if (isAdmin || userRole) return NextResponse.redirect(new URL('/dashboard', request.url));
        return NextResponse.next();
    }

    // 🏆 SUPER ADMIN BYPASS - Has total access
    if (isAdmin) return NextResponse.next();

    // 🔒 SYSTEM USER BYPASS (Staff/Admin from DB) - Must follow permissions checklist
    if (userRole) {
        // Essential pages for everyone with a system login
        const essentialPages = ['/employee/inventory', '/employee/profile'];
        if (essentialPages.some(p => pathname.startsWith(p))) return NextResponse.next();

        // Check if user has explicit permission for this page
        const hasPermission = userPermissions.some(p => pathname === p || pathname.startsWith(p + '/'));
        
        if (hasPermission) return NextResponse.next();

        // If no permission, redirect to their first allowed page or a default
        const defaultPage = userPermissions.length > 0 ? userPermissions[0] : '/employee/inventory';
        return NextResponse.redirect(new URL(defaultPage, request.url));
    }

    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
