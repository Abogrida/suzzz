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
        const { data: emp } = await supabase
            .from('employees')
            .select('id, name, role, job_title, permissions, is_system_user')
            .eq('password', password)
            .eq('is_active', true)
            .maybeSingle();

        if (emp) {
            const userData = { 
                id: emp.id, 
                name: emp.name, 
                role: emp.role || 'staff', 
                job_title: emp.job_title || '', 
                permissions: emp.permissions || [] 
            };
            const res = NextResponse.json({ success: true, ...userData });
            // Base64 is the absolute safest way to store JSON in a cookie
            const base64Data = Buffer.from(JSON.stringify(userData)).toString('base64');
            res.cookies.set('sys-user-token', base64Data, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
            });
            res.cookies.delete('employee-token'); // Clear the old name explicitly on login
            res.cookies.delete('auth-token');
            return res;
        }

        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
