-- ============================================================
-- STEP 1: Add warehouse column to products table
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse TEXT NOT NULL DEFAULT 'main';
UPDATE products SET warehouse = 'main' WHERE warehouse IS NULL OR warehouse = '';
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse);

-- ============================================================
-- STEP 2: Insert ALL products into suzz1 Warehouse (المخزن الفرعي)
-- ============================================================
INSERT INTO products (name, category, unit, initial_quantity, current_quantity, min_quantity, price, sale_price, barcode, description, warehouse)
VALUES
  ('نسكافيه جولد',           'قهوة',     'علبة',    1,    1,    0, 0, 0, '', '', 'suzz1'),
  ('نسكافيه كلاسيك',         'قهوة',     'علبة',    1,    1,    0, 0, 0, '', '', 'suzz1'),
  ('اسبريسو',                'قهوة',     'كجم',     2,    2,    0, 0, 0, '', '', 'suzz1'),
  ('وسط ساده',               'قهوة',     'كجم',     3,    3,    0, 0, 0, '', '', 'suzz1'),
  ('فاتح ساده',              'قهوة',     'كجم',     1.5,  1.5,  0, 0, 0, '', '', 'suzz1'),
  ('وسط محوج',               'قهوة',     'كجم',     2.5,  2.5,  0, 0, 0, '', '', 'suzz1'),
  ('غامق ساده',              'قهوة',     'كجم',     1.5,  1.5,  0, 0, 0, '', '', 'suzz1'),
  ('غامق محوج',              'قهوة',     'كجم',     2.5,  2.5,  0, 0, 0, '', '', 'suzz1'),
  ('قهوه فرنساوي ابو عوف',   'قهوة',     'عبوة',    2,    2,    0, 0, 0, '', '', 'suzz1'),
  ('مياه',                   'مشروبات',  'كرتونة',  4,    4,    0, 0, 0, '', '', 'suzz1'),
  ('حليب مكثف',              'ألبان',    'علبة',    2,    2,    0, 0, 0, '', '', 'suzz1'),
  ('ويبينج كريم',            'ألبان',    'عبوة',    1,    1,    0, 0, 0, '', '', 'suzz1'),
  ('حليب',                   'ألبان',    'لتر',     11,   11,   0, 0, 0, '', '', 'suzz1');

-- ============================================================
-- STEP 3: Log stock movements for all new products
-- ============================================================
INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
SELECT id, 'إضافة', initial_quantity, 'رصيد افتتاحي'
FROM products
WHERE initial_quantity > 0
  AND created_at > NOW() - INTERVAL '10 minutes';
