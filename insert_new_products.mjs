import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseKey);

const newProducts = [
    { name: 'فيري جو', category: 'مشروبات', unit: 'علبة', initial_quantity: 0, current_quantity: 0, min_quantity: 1, price: 0, sale_price: 35, warehouse: 'main' },
    { name: 'بريل', category: 'مشروبات', unit: 'علبة', initial_quantity: 0, current_quantity: 0, min_quantity: 1, price: 0, sale_price: 30, warehouse: 'main' },
    { name: 'في كولا بيناكولادا', category: 'مشروبات', unit: 'علبة', initial_quantity: 0, current_quantity: 0, min_quantity: 1, price: 0, sale_price: 20, warehouse: 'main' },
    { name: 'في كولا فراوله', category: 'مشروبات', unit: 'علبة', initial_quantity: 0, current_quantity: 0, min_quantity: 1, price: 0, sale_price: 20, warehouse: 'main' },
    { name: 'في كولا توت ازرق', category: 'مشروبات', unit: 'علبة', initial_quantity: 0, current_quantity: 0, min_quantity: 1, price: 0, sale_price: 20, warehouse: 'main' }
];

async function addProducts() {
    for (const p of newProducts) {
        const { data: existing } = await db.from('products').select('id').eq('name', p.name).maybeSingle();
        if (!existing) {
            const { error } = await db.from('products').insert([p]);
            if (error) console.error("Error inserting", p.name, error);
            else console.log("Added", p.name);
        } else {
            console.log("Already exists:", p.name);
        }
    }
}
addProducts();
