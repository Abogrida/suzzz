import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runWarehouseMigration() {
    console.log('Adding warehouse column to products table...');

    // Add warehouse column
    const { error: e1 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse TEXT NOT NULL DEFAULT 'main';`
    }).catch(() => ({ error: 'rpc_not_available' }));

    if (e1 && e1 !== 'rpc_not_available') {
        console.error('Error via RPC:', e1);
    }

    // Verify column exists by checking products
    const { data, error } = await supabase
        .from('products')
        .select('id, name, warehouse')
        .limit(3);

    if (error) {
        if (error.message?.includes('warehouse')) {
            console.log('\n⚠️  Column "warehouse" does not exist yet.');
            console.log('Please run the following SQL in your Supabase SQL Editor:\n');
            console.log('─────────────────────────────────────────────────────────');
            console.log(`ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse TEXT NOT NULL DEFAULT 'main';`);
            console.log(`UPDATE products SET warehouse = 'main' WHERE warehouse IS NULL OR warehouse = '';`);
            console.log(`CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse);`);
            console.log('─────────────────────────────────────────────────────────');
            console.log('\nSupabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new');
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }

    console.log('✅ Column "warehouse" already exists!');
    console.log('Sample products:', data);
}

runWarehouseMigration();
