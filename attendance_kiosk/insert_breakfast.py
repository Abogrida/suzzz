import sqlite3, sys

def insert_breakfast_batch_7():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Define New Categories for Breakfast if they don't exist
    breakfast_categories = [
        (113, 'فول وفلافل'),
        (114, 'بيض'),
        (115, 'كرواسون وتوست'),
        (116, 'ساندوتشات متنوعة')
    ]

    for cat_id, cat_name in breakfast_categories:
        cursor.execute("SELECT id FROM categories WHERE name = ?", (cat_name,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO categories (id, name, is_enabled) VALUES (?, ?, 1)", (cat_id, cat_name))
            print(f"Created category: {cat_name}")

    # Product list: (name, price, category_id)
    products = [
        # Image 1: Sides/Extras
        ('كاتشب', 10, 112), # Category 112 is الإضافات
        ('بطاطس', 25, 113), # Putting sides with main breakfast for now
        ('عيش', 10, 113),
        ('طحينه', 10, 112),
        ('بيض مسلوق', 15, 114),
        ('مايونيز', 10, 112),
        ('سلطه خضراء', 25, 113),
        ('مخلل', 10, 113),

        # Image 2: Toast/Sandwiches
        ('بيف مدخن توست', 100, 115),
        ('ميكس جبن توست', 100, 115),
        ('روز بيف توست', 100, 115),
        ('بيض عيون', 85, 114),
        ('ميكس سوزز توست', 135, 115),

        # Image 3: Croissants
        ('بيف مدخن كرواسون', 100, 115),
        ('ميكس جبن كرواسون', 100, 115),
        ('روز بيف كرواسون', 100, 115),
        ('لوتس كرواسون', 85, 115),
        ('نوتيلا كرواسون', 85, 115),
        ('ميكس سوزز كرواسون', 135, 115),
        ('بستاشيو كرواسون', 100, 115),

        # Image 4: Foul
        ('فول طحينه', 20, 113),
        ('فول زبده', 25, 113),
        ('فول زيت وليمون', 17, 113),
        ('فول بيض', 25, 113),
        ('فول دمياطي', 30, 113),
        ('فول اسكندراني', 30, 113),
        ('فول سوسيس', 35, 113),
        ('فول سجق', 35, 113),
        ('فول بسطرمه', 35, 113),
        ('بطاطس بوم فريت', 35, 113),
        ('طعميه محشيه', 20, 113),
        ('طعميه ساده', 15, 113),

        # Image 5: Eggs & More
        ('بطاطس صوابع', 35, 113),
        # 'طعميه محشيه' (Repeated)
        # 'طعميه ساده' (Repeated)
        ('بيض اومليت', 25, 114),
        ('بيض مدحرج', 35, 114),
        # 'بيض مسلوق' (Repeated)
        ('بيض سجق', 35, 114),
        ('بيض بسطرمه', 35, 114),
        ('بيض عيون (طبق)', 30, 114), # Distinguished from the sandwich one if needed
        ('بيض ميكس جبن', 40, 114),
        ('بيض سوسيس', 35, 114),
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
    insert_breakfast_batch_7()
