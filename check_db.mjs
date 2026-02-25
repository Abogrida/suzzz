
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '002_employees.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...');

    // Directly executing SQL is not supported via the JS client easily without a RPC
    // However, we can try to check if tables exist first
    const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
        console.log('Table "employees" does not exist. Please run the SQL migration 002_employees.sql in your Supabase SQL Editor.');
        process.exit(1);
    } else if (error) {
        console.error('Error checking table:', error);
        process.exit(1);
    } else {
        console.log('Table "employees" already exists.');
    }
}

runMigration();
