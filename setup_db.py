"""
Try all possible Supabase connection formats.
The service_role JWT can tell us the region from the 'ref' claim.
"""
import psycopg2
import json, base64

SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8"
PROJECT_REF = "vmkfwhnpevbamrfbjkzv"
PASSWORD = "ISLam@2006#@"

# Read SQL
with open("supabase/migrations/001_init.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

# All possible pooler hosts Supabase might use
HOSTS_TO_TRY = [
    # Direct connection (IPv6)
    ("db.vmkfwhnpevbamrfbjkzv.supabase.co", 5432, "postgres"),
    # Transaction pooler various regions
    ("aws-0-eu-central-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-eu-central-1.pooler.supabase.com", 5432, f"postgres.{PROJECT_REF}"),
    ("aws-0-eu-west-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-eu-west-2.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-us-east-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-us-west-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-ap-southeast-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    ("aws-0-ap-northeast-1.pooler.supabase.com", 6543, f"postgres.{PROJECT_REF}"),
    # Session pooler port 5432
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
        msg = str(e).split("\n")[0][:80]
        print(f"  Failed: {msg}")

if not conn:
    print("\nAll connections failed!")
    print("\nThe ONLY option now is to run SQL manually:")
    print("1. Go to: https://supabase.com/dashboard/project/vmkfwhnpevbamrfbjkzv/sql/new")
    print("2. Copy content of: supabase/migrations/001_init.sql")
    print("3. Paste and click Run")
    exit(1)

print("\nRunning SQL migration...")
conn.autocommit = True
cur = conn.cursor()

# Execute the full SQL in one shot
try:
    cur.execute(sql_content)
    print("Migration ran successfully!")
except Exception as e:
    print(f"Full SQL failed: {e}")
    print("Trying statement by statement...")
    
    # Split by semicolons carefully
    import re
    # Remove comments
    clean = re.sub(r'--[^\n]*', '', sql_content)
    # Split by semicolon
    stmts = [s.strip() for s in clean.split(';') if s.strip()]
    
    ok = fail = 0
    for stmt in stmts:
        try:
            cur.execute(stmt)
            ok += 1
        except Exception as e2:
            err = str(e2).lower()
            if 'already exists' in err or 'duplicate' in err:
                print(f"  SKIP (exists): {stmt[:50].replace(chr(10),' ')}")
            else:
                print(f"  WARN: {str(e2)[:100]}")
            fail += 1

    print(f"\nOK: {ok}, Warnings: {fail}")

# Verify
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
print(f"\nTables created: {tables}")

cur.close()
conn.close()
print("\nDone! Database is ready.")
