import sqlite3, sys

def insert_products_batch_2():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price_s, price_m, price_l, has_sizes, category_id)
    # Using existing categories: 2 (Tea), 3 (Hot Coffee), 4 (Cold Drinks/Coffee)
    
    products = [
        # Image 1 & 5 (Juices/Mixed - Category 4 for now)
        ('موز باللبن', 95, None, None, 0, 4),
        ('بلح باللبن', 95, None, None, 0, 4),
        ('افوكادو', 110, None, None, 0, 4),
        ('رمان', 75, None, None, 0, 4),
        ('كركديه', 45, None, None, 0, 4),
        ('تين شوكي', 95, None, None, 0, 4),
        ('كيوي', 130, None, None, 0, 4),
        ('ليمون نعناع فريش', 55, None, None, 0, 4), # Renamed to avoid confusion with the tea version
        ('مانجو', 75, None, None, 0, 4),
        ('باور سوزز', 160, None, None, 0, 4),
        ('زبادي خلاط', 85, None, None, 0, 4),
        ('بينا كولادا', 65, None, None, 0, 4),
        ('جوافه', 75, None, None, 0, 4),
        ('فراوله', 75, None, None, 0, 4),
        ('ميكس سوزز', 95, None, None, 0, 4),

        # Image 2 (Tea/Hot - Category 2)
        ('شاي كرك', 55, 65, 75, 1, 2),
        ('شاي حليب', 45, 50, 55, 1, 2),
        ('شاي الافطار', 25, 30, 35, 1, 2),

        # Image 3 & 4 (Hot Drinks - Category 3 for others, Category 2 for cider/tea-like)
        ('هوت سيدر', 40, 50, 55, 1, 2),
        ('وايت شوكليت', 55, 65, 80, 1, 3),
        ('هوت شوكليت', 55, 65, 80, 1, 3),
        ('ماتشا اسبانش', 105, None, None, 0, 3),
        ('ماتشا فانيليا', 125, None, None, 0, 3),
        ('هوت ماتشا', 90, None, None, 0, 3),
        ('سحلب نوتيلا', 110, None, None, 0, 3),
        ('سحلب مكسرات', 110, None, None, 0, 3),
        ('سحلب', 80, None, None, 0, 3),
        ('كوفي ميكس', 40, None, None, 0, 3),
        ('نسكافيه حليب', 75, None, None, 0, 3),
        ('نسكافيه بلاك', 50, None, None, 0, 3),
    ]

    for name, p_s, p_m, p_l, has_sizes, cat_id in products:
        # Check if exists
        cursor.execute("SELECT id FROM products WHERE name = ?", (name,))
        if cursor.fetchone():
            print(f"Skipping {name} (already exists)")
            continue
        
        main_price = p_s if not has_sizes else 0

        cursor.execute("""
            INSERT INTO products (name, price, category_id, has_sizes, price_s, price_m, price_l, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (name, main_price, cat_id, has_sizes, p_s, p_m, p_l))
        print(f"Added {name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    insert_products_batch_2()
