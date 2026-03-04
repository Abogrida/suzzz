import sqlite3, sys

def insert_products_batch_3():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price, category_id)
    # Using Category 4 for cold drinks
    
    products = [
        # Image 1 & 2: Ice Latites & Matcha
        ('ايس لاتيه كراميل', 120, 4),
        ('ايس لاتيه فانيليا', 120, 4),
        ('ايس لاتيه', 95, 4),
        ('ايس لاتيه جوز هند', 120, 4),
        ('ايس لاتيه فستق', 120, 4),
        ('ايس لاتيه بندق', 120, 4),
        ('ايس وايت موكا', 120, 4),
        ('ايس موكا', 120, 4),
        ('ايس اسبانش لاتيه', 120, 4),
        ('ايس بينك لاتيه', 130, 4),
        ('ايس امريكانو', 90, 4),
        ('ايس كراميل ميكاتو', 120, 4),
        ('ايس ماتشا جوز هند', 130, 4),
        ('ايس ماتشا فانيليا', 130, 4),
        ('ايس ماتشا', 105, 4),
        ('ايس ماتشا توت احمر', 145, 4),
        ('ايس ماتشا فراوله', 145, 4),
        ('ايس ماتشا مانجو', 145, 4),
        ('ايس ماتشا توت ازرق', 145, 4),

        # Image 3, 4, 5, 6: Frappes & Frappuccinos
        ('فرابيه دارك شوكليت', 115, 4),
        ('فرابيه كلاسيك', 95, 4),
        ('فرابيه كراميل', 105, 4),
        ('فرابيه نوتيلا', 125, 4),
        ('فرابيه وايت شوكليت', 115, 4),
        ('فرابيه سولتد كراميل', 105, 4),
        ('فرابتشينو وايت شوكليت', 135, 4),
        ('فرابتشينو دارك شوكليت', 135, 4),
        ('فرابتشينو كراميل مملح', 135, 4),
        ('فرابتشينو كراميل', 135, 4),
        ('فرابتشينو نوتيلا', 160, 4),
        ('فرابتشينو كلاسيك', 120, 4),
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
    insert_products_batch_3()
