import sqlite3, sys

def insert_products():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price_s, price_m, price_l, has_sizes, category_id)
    # Using existing categories: 2 (Tea), 3 (Hot Coffee), 4 (Cold Coffee)
    # User mentioned: 2 prices -> Starts from Medium. 3 prices -> Starts from Small.
    
    products = [
        # Coffee/Hot Drinks (Category 3)
        ('موكا', 75, 90, 105, 1, 3),
        ('سبانش لاتيه', 75, 90, 105, 1, 3),
        ('كابتشينو', 65, 80, 90, 1, 3),
        ('لاتيه', 65, 80, 90, 1, 3),
        ('وايت موكا', None, 90, 105, 1, 3),
        ('موكا دارك', 75, 90, 105, 1, 3),
        ('امريكانو', None, 60, 90, 1, 3),
        ('لوتس لاتيه', 110, 125, 135, 1, 3),
        ('بينك لاتيه', 90, 100, 115, 1, 3),
        ('كراميل ميكاتو', 85, None, None, 0, 3),
        ('كراميل مملح', None, 90, 100, 1, 3),
        
        # Tea/Herbs (Category 2)
        ('شاي مانجو', 40, 50, 60, 1, 2),
        ('شاي تفاح', 40, 50, 60, 1, 2),
        ('شاي عدني', 55, 65, 75, 1, 2),
        ('شاي توت احمر', 40, 50, 60, 1, 2),
        ('شاي خوخ', 40, 50, 60, 1, 2),
        ('شاي فراوله', 40, 50, 60, 1, 2),
        ('ينسون', 35, 40, 45, 1, 2),
        ('نعناع', 35, 40, 45, 1, 2),
        ('شاي اخضر', 40, 50, 60, 1, 2),
        ('كوكتيل برد', 95, 105, 120, 1, 2),
        ('قرفه', 35, 40, 45, 1, 2),
        ('جنزبيل', 35, 40, 45, 1, 2),
        ('ليمون نعناع', None, 40, 45, 1, 2),
        ('ليمون قرنفل', None, 45, 55, 1, 2),
        ('ليمون', None, 35, 45, 1, 2),

        # More Coffee (Category 3)
        ('قهوه نوتيلا', None, 60, 70, 1, 3),
        ('قهوه فرنساوي', None, 45, 55, 1, 3),
        ('قهوه تركي', None, 30, 45, 1, 3),
        ('اسبريسو', None, 35, 45, 1, 3),
        ('قهوه لوتس', None, 60, 70, 1, 3),
        ('قهوه بندق', None, 60, 75, 1, 3),
        ('كورتادو', 70, None, None, 0, 3),
        ('فلات وايت', 85, None, None, 0, 3),
        ('ميكاتو', None, 45, 55, 1, 3),
        ('كونبانا', 50, None, None, 0, 3),
        ('بون بون', 50, None, None, 0, 3),
        ('افوكاتو', 70, None, None, 0, 3),
    ]

    for name, p_s, p_m, p_l, has_sizes, cat_id in products:
        # Check if exists
        cursor.execute("SELECT id FROM products WHERE name = ?", (name,))
        if cursor.fetchone():
            print(f"Skipping {name} (already exists)")
            continue
        
        # Single Price Mapping: If no sizes, put p_s in 'price' field
        main_price = p_s if not has_sizes else 0

        cursor.execute("""
            INSERT INTO products (name, price, category_id, has_sizes, price_s, price_m, price_l, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (name, main_price, cat_id, has_sizes, p_s, p_m, p_l))
        print(f"Added {name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    insert_products()
