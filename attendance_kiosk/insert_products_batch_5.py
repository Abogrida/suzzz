import sqlite3, sys

def insert_products_batch_5():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = r'f:\cashier.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Product list: (name, price, price_m, price_l, has_sizes, category_id)
    # Using Category 4 for add-ons/misc
    # Category 5 for desserts (Need to check if it exists or create it)
    
    # Check for desserts category
    cursor.execute("SELECT id FROM categories WHERE name = 'حلويات' OR name = 'desserts'")
    cat_row = cursor.fetchone()
    if cat_row:
        dessert_cat_id = cat_row[0]
    else:
        cursor.execute("INSERT INTO categories (name, is_enabled) VALUES ('حلويات', 1)")
        dessert_cat_id = cursor.lastrowid
        print(f"Created new category 'حلويات' with ID {dessert_cat_id}")

    # Check for add-ons category
    cursor.execute("SELECT id FROM categories WHERE name = 'اضافات' OR name = 'add-ons'")
    addon_row = cursor.fetchone()
    if addon_row:
        addon_cat_id = addon_row[0]
    else:
        cursor.execute("INSERT INTO categories (name, is_enabled) VALUES ('اضافات', 1)")
        addon_cat_id = cursor.lastrowid
        print(f"Created new category 'اضافات' with ID {addon_cat_id}")

    products = [
        # Image 1 & 3 & 4: Add-ons
        ('اضافة حليب', 25, None, None, 0, addon_cat_id),
        ('اضافة اسبريسو', 20, 20, None, 1, addon_cat_id), # 2 prices shown as 20, 20
        ('مياه', 10, None, None, 0, addon_cat_id),
        ('اضافة ويبد كريم', 40, None, None, 0, addon_cat_id),
        ('اضافة توبينج', 25, None, None, 0, addon_cat_id),
        ('اضافة نكهات', 25, None, None, 0, addon_cat_id),
        ('اضافة لوتس', 40, None, None, 0, addon_cat_id),
        ('اضافة نوتيلا', 40, None, None, 0, addon_cat_id),
        ('اضافة ايس كريم', 40, None, None, 0, addon_cat_id),
        ('اضافة اوريو', 25, None, None, 0, addon_cat_id),
        ('اضافة مرشميلو', 25, None, None, 0, addon_cat_id),
        ('اضافة بستاشيو', 25, None, None, 0, addon_cat_id),
        ('hqhtm pgdf l;et', 25, None, None, 0, addon_cat_id), # As written in image (looks like 'milk condensate' typo)

        # Image 2: More Milkshakes (Category 4)
        ('ميلك شيك دارك شوكليت', 125, None, None, 0, 4),
        ('ميلك شيك اوريو', 130, None, None, 0, 4),
        ('ميلك شيك نوتيلا', 130, None, None, 0, 4),

        # Image 5: Desserts (Category dessert_cat_id)
        ('تشيز كيك', 80, None, None, 0, dessert_cat_id),
        ('مولتن ريد فيلفت', 90, None, None, 0, dessert_cat_id),
        ('مولتن كيك', 90, None, None, 0, dessert_cat_id),
        ('وافل نوتيلا', 90, None, None, 0, dessert_cat_id),
        ('براونيز', 95, None, None, 0, dessert_cat_id),
        ('سويسرول', 90, None, None, 0, dessert_cat_id),
        ('دونتس', 65, None, None, 0, dessert_cat_id),
        ('وافل بستاشيو', 110, None, None, 0, dessert_cat_id),
        ('وافل لوتس', 110, None, None, 0, dessert_cat_id),
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
    insert_products_batch_5()
