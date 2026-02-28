const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const sql = fs.readFileSync('supabase/migrations/005_purchases.sql', 'utf8');

    const hosts = [
        "aws-0-eu-central-1.pooler.supabase.com",
        "aws-0-eu-west-1.pooler.supabase.com",
        "aws-0-eu-west-2.pooler.supabase.com",
        "db.vmkfwhnpevbamrfbjkzv.supabase.co"
    ];

    for (const host of hosts) {
        for (const port of [5432, 6543]) {
            let user = "postgres.vmkfwhnpevbamrfbjkzv";
            if (host.startsWith('db.')) user = "postgres";

            const client = new Client({
                host,
                port,
                user,
                password: "ISLam@2006#@",
                database: "postgres",
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000
            });

            console.log(`Trying ${host}:${port} user=${user}...`);
            try {
                await client.connect();
                console.log(`Connected to ${host}`);
                await client.query(sql);
                console.log(`Migration applied successfully!`);
                await client.end();
                return;
            } catch (err) {
                console.log(`Failed: ${err.message}`);
                try { await client.end(); } catch (e) { }
            }
        }
    }
    console.log("All connections failed.");
}

run();
