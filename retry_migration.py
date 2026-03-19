import psycopg2
import os

PROJECT_REF = "vmkfwhnpevbamrfbjkzv"
PASSWORD = "ISLam@2006#@"
SQL_FILE = "supabase/migrations/014_cashier_tables.sql"

HOSTS_TO_TRY = [
    ("db.vmkfwhnpevbamrfbjkzv.supabase.co", 5432, "postgres"),
    ("aws-0-eu-central-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-eu-central-1.pooler.supabase.com", 5432, f"postgres.{PROJECT_REF}"),
]

if not os.path.exists(SQL_FILE):
    print(f"Error: {SQL_FILE} not found")
    exit(1)

with open(SQL_FILE, "r", encoding="utf-8") as f:
    sql = f.read()

conn = None
for host, port, user in HOSTS_TO_TRY:
    try:
        print(f"Trying {host}:{port} user={user}...")
        conn = psycopg2.connect(
            host=host, port=port, database="postgres",
            user=user, password=PASSWORD,
            sslmode="require", connect_timeout=10
        )
        print(f"SUCCESS! Connected to {host}:{port}")
        break
    except Exception as e:
        print(f"  Failed: {str(e).splitlines()[0]}")

if not conn:
    print("\nAll connections failed. Please apply the SQL manually in Supabase Dashboard.")
    exit(1)

conn.autocommit = True
cur = conn.cursor()

try:
    print(f"Applying {SQL_FILE}...")
    cur.execute(sql)
    print("Migration applied successfully!")
except Exception as e:
    print(f"Error applying migration: {e}")
finally:
    cur.close()
    conn.close()
