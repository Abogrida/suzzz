import sqlite3
import os

def get_schema():
    db_path = r"c:\Users\hacker\Desktop\suzz system\cashier.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'")
        schema = cursor.fetchone()
        if schema:
            print("Schema for 'products':")
            print(schema[0])
        else:
            print("Table 'products' not found.")
            
        # Also check categories for the new products
        cursor.execute("SELECT name FROM categories")
        categories = cursor.fetchall()
        print("\nExisting categories:", [c[0] for c in categories])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    get_schema()
