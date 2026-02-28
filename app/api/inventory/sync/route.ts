import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    // Basic API Key authentication
    const authHeader = request.headers.get('Authorization');
    const expectedKey = `Bearer ${process.env.SYNC_API_KEY || 'default_sync_key'}`;

    if (authHeader !== expectedKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await request.json();

        // payload should be an array of inventory records
        if (!Array.isArray(payload) || payload.length === 0) {
            return NextResponse.json({ success: true, message: 'No records to process' });
        }

        const countsToInsert = payload.map((item: any) => ({
            product_id: item.product_id,
            counted_quantity: item.counted_quantity,
            employee_id: item.employee_id,
            // Only add notes/created_at if you want, but ensure correct mapping
            notes: 'تم عن طريق الجرد المحلي (أوفلاين)'
        }));

        const { error } = await supabase
            .from('inventory_counts')
            .insert(countsToInsert);

        if (error) {
            console.error('Error inserting offline inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Synced ${payload.length} inventory records.` });
    } catch (e: any) {
        console.error('Exception in inventory sync:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
