import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    try {
        const { name, password } = await req.json();
        if (!name?.trim() || !password?.trim()) return NextResponse.json({ error: 'الاسم والباسوورد مطلوبين' }, { status: 400 });
        const supabase = createAdminClient();
        // Check if password already used
        const { data: existing } = await supabase.from('employees').select('id').eq('password', password.trim()).maybeSingle();
        if (existing) return NextResponse.json({ error: 'الباسوورد ده مستخدم بالفعل' }, { status: 400 });
        const { data, error } = await supabase.from('employees').insert({ name: name.trim(), password: password.trim() }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch { return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 }); }
}
