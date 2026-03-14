import sqlite3, sys

def insert_new_products():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = 'attendance.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    products = [
        ('فيري جو', 'مشروبات', '', '', 35, 1, 'علبة'),
        ('بريل', 'مشروبات', '', '', 30, 1, 'علبة'),
        ('في كولا بيناكولادا', 'مشروبات', '', '', 20, 1, 'علبة'),
        ('في كولا فراوله', 'مشروبات', '', '', 20, 1, 'علبة'),
        ('في كولا توت ازرق', 'مشروبات', '', '', 20, 1, 'علبة'),
    ]

    for p in products:
        name = p[0]
        cursor.execute("SELECT id FROM products WHERE name = ?", (name,))
        if cursor.fetchone():
            print(f"Skipping {name} (already exists)")
            continue
        
        cursor.execute("""
            INSERT INTO products (name, category, barcode, sku, price, active, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, p)
        print(f"Added {name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    insert_new_products()
