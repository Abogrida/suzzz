import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'hr_kiosk_admin_pin')
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pin: data?.value || '1234' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const isAuth = getAuthFromRequest(request);
        if (!isAuth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
        const { pin } = body;

        if (!pin || pin.length < 4) {
            return NextResponse.json({ error: 'الرقم السري يجب أن يكون 4 أرقام على الأقل' }, { status: 400 });
        }

        // Upsert the setting
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'hr_kiosk_admin_pin', value: pin }, { onConflict: 'key' });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, pin });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
