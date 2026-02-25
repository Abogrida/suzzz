-- ===================================================
-- نظام إدارة المخزون - Supabase Migration
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== جدول الفئات =====
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول المنتجات =====
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  initial_quantity DECIMAL(10,3) DEFAULT 0,
  current_quantity DECIMAL(10,3) DEFAULT 0,
  min_quantity DECIMAL(10,3) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  barcode TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول العملاء والموردين =====
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  customer_type TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'supplier'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول الفواتير =====
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL, -- 'sale' or 'purchase'
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT DEFAULT '',
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid', -- 'paid', 'partial', 'unpaid'
  payment_method TEXT DEFAULT 'cash', -- 'cash', 'bank', 'check'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول تفاصيل الفواتير =====
CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  quantity DECIMAL(10,3) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0
);

-- ===== جدول حركات المخزون =====
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'إضافة' or 'سحب'
  quantity DECIMAL(10,3) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes لتحسين الأداء =====
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING GIN(to_tsvector('arabic', name));
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- ===== Updated_at trigger =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== Row Level Security (RLS) =====
-- بما إننا بنستخدم service role key في الـ API، مش محتاجين RLS معقد
-- بس هننشطه للأمان
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (used in server-side API)
-- Public access for anon key (disabled = secure)
-- The API routes use SERVICE_ROLE_KEY which bypasses RLS

-- Optional: Create policies if you want direct client access
CREATE POLICY "Allow service role full access on products" ON products
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on invoices" ON invoices
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on invoice_items" ON invoice_items
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on stock_movements" ON stock_movements
  FOR ALL USING (true) WITH CHECK (true);
