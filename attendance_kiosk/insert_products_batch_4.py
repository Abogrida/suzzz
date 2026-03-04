import sqlite3, sys

def insert_products_batch_4():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price, price_m, price_l, has_sizes, category_id)
    # Using Category 4 for cold drinks/juices/soft drinks
    
    products = [
        # Image 1 (Juice & Shake)
        ('موز بلح باللبن', 120, None, None, 0, 4), # From image 1 bottom right

        # Image 2 & 3: Milkshakes
        ('ميلك شيك فستق', 140, None, None, 0, 4),
        ('ميلك شيك لوتس', 130, None, None, 0, 4),
        ('ميلك شيك وايت شوكليت', 125, None, None, 0, 4),
        ('ميلك شيك توت ازرق', 140, None, None, 0, 4),
        ('ميلك شيك توت ازر', 125, None, None, 0, 4), # As written in image
        ('ميلك شيك كراميل', 120, None, None, 0, 4),
        ('ميلك شيك مانجو', 125, None, None, 0, 4),
        ('ميلك شيك باشون', 125, None, None, 0, 4),
        ('ميلك شيك خوخ', 125, None, None, 0, 4),
        ('ميلك شيك اناناس', 125, None, None, 0, 4),
        ('ميلك شيك كيوي', 125, None, None, 0, 4),
        ('ميلك شيك فراوله', 125, None, None, 0, 4),
        ('ميلك شيك فانيليا', 125, None, None, 0, 4),

        # Image 4: Mojitos & Sodas
        ('ميكس سوزز مو جيتو', 135, None, None, 0, 4), # Renamed to specify mojito
        ('مو جيتو توت ازرق', 100, None, None, 0, 4),
        ('مو جيتو', 80, None, None, 0, 4),
        ('بلو هواي', 95, None, None, 0, 4),
        ('صن رايز', 75, None, None, 0, 4),
        ('صن شاين', 75, None, None, 0, 4),
        ('شيري كولا', 95, None, None, 0, 4),
        ('بلو سكاي', 95, None, None, 0, 4),

        # Image 5: Cans & Energy Drinks
        ('بيبسي', 30, None, None, 0, 4),
        ('ريد بول', 70, None, None, 0, 4),
        ('ستينج', None, 30, 25, 1, 4), # 2 prices -> M/L logic (starting from medium)
        ('باور هورس', None, 80, 75, 1, 4), # 2 prices
        ('فيروز', 30, None, None, 0, 4),
        ('سفن اب', 30, None, None, 0, 4),
        ('فانتا', 30, None, None, 0, 4),
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
    insert_products_batch_4()
