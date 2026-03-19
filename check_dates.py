import requests
import json

URL = "https://vmkfwhnpevbamrfbjkzv.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
}

print("Checking orders...")
resp = requests.get(f"{URL}/rest/v1/cashier_orders?select=created_at&order=created_at.desc&limit=3", headers=headers)
print("Orders:", resp.json())

print("Checking shifts...")
resp = requests.get(f"{URL}/rest/v1/cashier_shifts?select=opened_at&order=opened_at.desc&limit=3", headers=headers)
print("Shifts:", resp.json())
