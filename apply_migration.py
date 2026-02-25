import psycopg2
import os

PROJECT_REF = "vmkfwhnpevbamrfbjkzv"
PASSWORD = "ISLam@2006#@"

# Read the latest migrations
sql_files = [
    "supabase/migrations/003_settings.sql",
    "supabase/migrations/004_branches_and_edits.sql"
]

HOSTS_TO_TRY = [
    ("aws-0-eu-central-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-eu-central-1.pooler.supabase.com", 5432, f"postgres.{PROJECT_REF}"),
]

conn = None
for host, port, user in HOSTS_TO_TRY:
    try:
        print(f"Trying {host}:{port} user={user}...", flush=True)
        conn = psycopg2.connect(
            host=host, port=port, database="postgres",
            user=user, password=PASSWORD,
            sslmode="require", connect_timeout=5
        )
        print(f"SUCCESS! Connected to {host}:{port}")
        break
    except Exception as e:
        print(f"  Failed: {e}")

if not conn:
    print("\nAll connections failed!")
    exit(1)

conn.autocommit = True
cur = conn.cursor()

for fpath in sql_files:
    print(f"Applying {fpath}...")
    with open(fpath, "r", encoding="utf-8") as f:
        sql = f.read()
        cur.execute(sql)
        print("  Success!")
        
cur.close()
conn.close()
print("Done.")
