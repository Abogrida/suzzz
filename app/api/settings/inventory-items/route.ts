import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthFromRequest } from '@/lib/auth';

const DEFAULT_HOT_ITEMS = ['فاتح ساده', 'فاتح محوج', 'وسط ساده', 'وسط محوج', 'غامق ساده', 'غامق محوج', 'بندق', 'اسبريسو', 'نسكافيه', 'سكر', 'شاي اسطف', 'شاي إفطار ليبتون', 'شاي احمد تى', 'ينسون', 'نعناع', 'قرفه', 'جنزبيل', 'شاي نكهات', 'شاي كرك', 'شاي عدنى'];
const DEFAULT_COLD_ITEMS = ['فيري جو', 'بريل', 'في كولا بيناكولادا', 'في كولا فراوله', 'في كولا توت ازرق', 'بيبسي دايت', 'سفن', 'ريد بول', 'ستينج', 'دبل دير', 'فيروز', 'تويست', 'باور هورس', 'بيبسي', 'مياه', 'حليب', 'ايس كريم', 'بلح', 'افوكادو', 'موز', 'ليمون', 'كركديه', 'مانجو', 'فراوله', 'جوافه', 'ماتشا', 'بودر كوفي', 'بودر شوكليت', 'بودر فانيليا', 'نوتيلا', 'صوص بستاشيو', 'صوص لوتس', 'صوص دارك', 'صوص وايت', 'حليب مكثف', 'كريمة خفق', 'سيرب فانيليا', 'سيرب كراميل', 'سيرب نعناع', 'سيرب بلو كورواسو', 'سيرب بندق', 'سيرب توفي', 'سيرب جوز هند', 'سيرب ايرش', 'سيرب موخيتو', 'سيرب كراميل مملح', 'سيرب شيري كولا', 'سيرب بيناكولادا', 'سيرب فراوله', 'سيرب كريز', 'سيرب راسبيري', 'سيرب روز', 'توبينج خوخ', 'توبينج باشون', 'توبينج بلوبيري', 'توبينج راسبيري', 'توبينج كيوي', 'توبينج مانجو', 'توبينج فراوله', 'مونين وايت', 'مونين دارك', 'مونين كراميل', 'مولتن كيك', 'شوكليت كيك', 'شيز كيك', 'سويسرول', 'براونيزك', 'كوكيز'];

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'inventory_items')
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (data?.value) {
            try {
                const parsed = JSON.parse(data.value);
                return NextResponse.json({ hot: parsed.hot || DEFAULT_HOT_ITEMS, cold: parsed.cold || DEFAULT_COLD_ITEMS });
            } catch {
                return NextResponse.json({ hot: DEFAULT_HOT_ITEMS, cold: DEFAULT_COLD_ITEMS });
            }
        }

        return NextResponse.json({ hot: DEFAULT_HOT_ITEMS, cold: DEFAULT_COLD_ITEMS });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const isAuth = getAuthFromRequest(request);
        if (!isAuth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Additionally, we might check if user is admin, but getAuthFromRequest just checks for valid token.
        // Assuming admin is the only one who can access the settings page.

        const body = await request.json();
        const { hot, cold } = body;

        if (!Array.isArray(hot) || !Array.isArray(cold)) {
            return NextResponse.json({ error: 'البيانات غير صالحة' }, { status: 400 });
        }

        const valueStr = JSON.stringify({ hot, cold });

        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'inventory_items', value: valueStr }, { onConflict: 'key' });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, hot, cold });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
