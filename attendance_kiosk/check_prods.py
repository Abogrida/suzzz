import sqlite3, sys, os

def check_products():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = 'attendance.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT name, category FROM products")
        products = cursor.fetchall()
        print(f"Total products: {len(products)}")
        for p in products:
            print(f"- {p[0]} ({p[1]})")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_products()
