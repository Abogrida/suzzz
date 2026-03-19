import requests

URL = "https://vmkfwhnpevbamrfbjkzv.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}"
}

tables = ["cashier_orders", "cashier_shifts", "cashier_invoices"]

for table in tables:
    resp = requests.get(f"{URL}/rest/v1/{table}?select=id&limit=1", headers=headers)
    if resp.status_code == 200:
        print(f"Table '{table}': EXISTS")
    else:
        print(f"Table '{table}': NOT FOUND (Status: {resp.status_code})")
        print(f"  Details: {resp.text}")
