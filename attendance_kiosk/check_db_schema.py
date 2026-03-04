import sqlite3
import os

db_path = r'f:\cashier.db'
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])

# Get schema for product-related tables
for table in tables:
    table_name = table[0]
    if 'product' in table_name.lower() or 'item' in table_name.lower():
        print(f"\nSchema for {table_name}:")
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for col in columns:
            print(col)

conn.close()
