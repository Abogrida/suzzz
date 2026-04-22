import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // Check admin cookie
    const adminToken = req.cookies.get('auth-token')?.value;
    if (adminToken === process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ role: 'admin' });
    }

    // Check employee cookie
    const empToken = req.cookies.get('sys-user-token')?.value;
    if (empToken) {
        try {
            const decoded = Buffer.from(empToken, 'base64').toString('utf-8');
            const emp = JSON.parse(decoded);
            return NextResponse.json({ 
                role: emp.role || 'staff', 
                id: emp.id, 
                name: emp.name,
                job_title: emp.job_title || '',
                permissions: emp.permissions || []
            });
        } catch { }
    }

    return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });
}
