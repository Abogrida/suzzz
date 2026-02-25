import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();
        const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const supabase = createAdminClient();

        // 1. Check if there's a dynamic admin password in DB
        const { data: dynamicPass } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'admin_password')
            .maybeSingle();

        const effectiveAdminPassword = (dynamicPass && dynamicPass.value) ? dynamicPass.value : envAdminPassword;

        // Check admin
        if (password === effectiveAdminPassword) {
            const res = NextResponse.json({ success: true, role: 'admin' });
            res.cookies.set('auth-token', process.env.NEXTAUTH_SECRET!, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
            });
            res.cookies.delete('employee-token');
            return res;
        }

        // Check employee password
        const { data: emp } = await supabase.from('employees').select('id, name').eq('password', password).eq('is_active', true).maybeSingle();
        if (emp) {
            const res = NextResponse.json({ success: true, role: 'employee', name: emp.name, id: emp.id });
            res.cookies.set('employee-token', JSON.stringify({ id: emp.id, name: emp.name }), {
                httpOnly: true, secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
            });
            res.cookies.delete('auth-token');
            return res;
        }

        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
