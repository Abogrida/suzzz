import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    // Only admin can change password
    const authError = requireAuth(req);
    if (authError) return authError;

    try {
        const { newPassword } = await req.json();
        if (!newPassword || newPassword.length < 4) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Update the setting in DB
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'admin_password', value: newPassword, updated_at: new Date().toISOString() });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
    } catch {
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
