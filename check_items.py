import requests

URL = "https://vmkfwhnpevbamrfbjkzv.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Prefer": "count=exact"
}

resp = requests.get(f"{URL}/rest/v1/cashier_order_items?select=id", headers=headers)

if resp.status_code == 200 or resp.status_code == 206:
    count = resp.headers.get("Content-Range", "").split("/")[-1]
    print(f"Table 'cashier_order_items': {count} rows")
else:
    print(f"Error {resp.status_code}")
