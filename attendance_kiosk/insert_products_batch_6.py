import sqlite3, sys

def insert_products_batch_6():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price, category_id)
    # Using Category 4 for cold drinks/soft drinks/energy/misc
    # Double check if any are already added from previous batches
    
    products = [
        ('كوب ثلج', 10, 4),
        ('دبل دير', 30, 4),
        ('بيبسي دايت', 30, 4),
        ('بريل', 30, 4),
        ('همر ريد بول', 110, 4),
        ('تويست', 30, 4),
    ]

    for name, price, cat_id in products:
        # Check if exists
        cursor.execute("SELECT id FROM products WHERE name = ?", (name,))
        if cursor.fetchone():
            print(f"Skipping {name} (already exists)")
            continue
        
        cursor.execute("""
            INSERT INTO products (name, price, category_id, has_sizes, is_enabled)
            VALUES (?, ?, ?, 0, 1)
        """, (name, price, cat_id))
        print(f"Added {name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    insert_products_batch_6()
