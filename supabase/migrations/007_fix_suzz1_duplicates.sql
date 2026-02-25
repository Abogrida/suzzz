-- ============================================================
-- CLEANUP: Delete ALL suzz1 products (including duplicates)
-- then re-insert correctly once
-- ============================================================

-- Step 1: Delete movements first
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE warehouse = 'suzz1');

-- Step 2: Delete all suzz1 products
DELETE FROM products WHERE warehouse = 'suzz1';

-- Step 3: Re-insert cleanly (once each)
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

-- Step 4: Log movements
INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
SELECT id, 'إضافة', initial_quantity, 'رصيد افتتاحي'
FROM products
WHERE warehouse = 'suzz1'
  AND created_at > NOW() - INTERVAL '5 minutes';
