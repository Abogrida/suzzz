import sqlite3
import os

def check_cashier_db():
    db_path = r"c:\Users\hacker\Desktop\suzz system\cashier.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    names = ['فيري جو', 'بريل', 'في كولا بيناكولادا', 'في كولا فراوله', 'في كولا توت ازرق']
    placeholders = ','.join(['?'] * len(names))
    
    try:
        # First check if the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
        if not cursor.fetchone():
            print("Table 'products' does not exist in this database.")
            return

        cursor.execute(f"SELECT name FROM products WHERE name IN ({placeholders})", names)
        found = cursor.fetchall()
        print("Found in cashier.db:", [row[0] for row in found])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_cashier_db()
