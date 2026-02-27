import { NextRequest, NextResponse } from 'next/server';

export function getAuthFromRequest(req: NextRequest): boolean {
    // 1. Check cookies (for browser/admin UI)
    const cookieToken = req.cookies.get('auth-token')?.value;
    if (cookieToken === process.env.NEXTAUTH_SECRET) return true;

    // 2. Check Authorization header (for kiosk/API sync)
    const authHeader = req.headers.get('Authorization');
    const syncKey = process.env.ATTENDANCE_SYNC_KEY || 'attendance-sync-secret-2026';
    if (authHeader === `Bearer ${syncKey}`) return true;

    return false;
}

export function requireAuth(req: NextRequest): NextResponse | null {
    if (!getAuthFromRequest(req)) {
        return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }
    return null;
}

export function createAuthCookie(res: NextResponse): NextResponse {
    res.cookies.set('auth-token', process.env.NEXTAUTH_SECRET!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
    return res;
}

export function clearAuthCookie(res: NextResponse): NextResponse {
    res.cookies.delete('auth-token');
    return res;
}
