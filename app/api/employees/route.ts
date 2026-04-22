import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name');
            
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        
        const adminUser = {
            id: 0,
            name: 'مدير النظام',
            job_title: 'المالك',
            is_admin: true,
            permissions: ['admin'],
            role: 'admin'
        };

        // Manual filter: Hide those who only have inventory permission
        const filtered = data.filter(e => {
            const perms = e.permissions || [];
            
            // If they have no permissions, show them (new users)
            if (perms.length === 0) return true;
            
            // If they ONLY have the inventory permission, hide them
            const hasOnlyInventory = perms.length === 1 && perms[0] === '/employee/inventory';
            if (hasOnlyInventory) return false;
            
            // Allow everyone else (Managers, Admins, etc.)
            return true;
        });
        
        return NextResponse.json([adminUser, ...filtered]);
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
