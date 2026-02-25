import { NextRequest, NextResponse } from 'next/server';

export function getAuthFromRequest(req: NextRequest): boolean {
    const token = req.cookies.get('auth-token')?.value;
    return token === process.env.NEXTAUTH_SECRET;
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
