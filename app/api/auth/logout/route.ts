import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const res = NextResponse.json({ success: true });
    return clearAuthCookie(res);
}
