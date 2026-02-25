import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // Check admin cookie
    const adminToken = req.cookies.get('auth-token')?.value;
    if (adminToken === process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ role: 'admin' });
    }

    // Check employee cookie
    const empToken = req.cookies.get('employee-token')?.value;
    if (empToken) {
        try {
            const emp = JSON.parse(empToken);
            return NextResponse.json({ role: 'employee', id: emp.id, name: emp.name });
        } catch { }
    }

    return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });
}
