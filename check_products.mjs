import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    const names = ['فيري جو', 'بريل', 'في كولا بيناكولادا', 'في كولا فراوله', 'في كولا توت ازرق'];
    const { data, error } = await db.from('products').select('name').in('name', names);
    if (error) {
        console.error("Error checking products:", error);
        return;
    }
    console.log("Found products:", data.map(p => p.name));
}
checkProducts();
