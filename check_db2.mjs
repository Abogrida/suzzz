import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying hr_attendance table for employee 8 (Kareem)...');
    let qb = db.from('hr_attendance')
        .select('*, hr_employees!inner(name, job_title, work_start_time, work_end_time, late_threshold_minutes)')
        .order('attendance_date', { ascending: false });

    qb = qb.gte('attendance_date', `2026-02-01`).lte('attendance_date', `2026-02-31`);
    qb = qb.eq('employee_id', 8);

    const { data: records, error } = await qb;
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${records?.length} records.`);
        console.log(JSON.stringify(records, null, 2));
    }
}
check();
