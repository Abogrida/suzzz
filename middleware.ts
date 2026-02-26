import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't need auth
    const publicPaths = ['/login', '/api/auth/login', '/api/auth/me', '/share/'];
    if (publicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Public API: single inventory count (used by share page)
    if (/^\/api\/inventory-counts\/\d+$/.test(pathname)) {
        return NextResponse.next();
    }

    const isAdmin = getAuthFromRequest(request);
    const hasEmployeeToken = request.cookies.has('employee-token');

    // API routes
    if (pathname.startsWith('/api/')) {
        // Allow inventory-counts and movements for employees
        const allowedForEmployee = ['/api/inventory-counts', '/api/auth/logout', '/api/auth/me'];
        if (hasEmployeeToken && allowedForEmployee.some(p => pathname.startsWith(p))) {
            return NextResponse.next();
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'يجب تسجيل الدخول كمسؤول' }, { status: 401 });
        }
        return NextResponse.next();
    }

    // Page routes

    // If it's an employee route, check for employee token
    if (pathname.startsWith('/employee/')) {
        if (!hasEmployeeToken && !isAdmin) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // For all other pages (admin app), require admin auth
    if (!isAdmin) {
        // Exception: if an employee is logged in but tries to access admin dashboard,
        // redirect them to their inventory page instead of login page (to avoid loop)
        if (hasEmployeeToken) {
            return NextResponse.redirect(new URL('/employee/inventory', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If authenticated as admin and trying to go to login, redirect to dashboard
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
