-- ===================================================
-- نظام الكاشير - جداول السحابة (Supabase)
-- ===================================================

-- ===== جدول الشيفتات (Shifts) =====
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id INTEGER,
  shift_name TEXT NOT NULL,
  shift_number INTEGER,
  shift_date DATE NOT NULL,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  opened_by TEXT,
  closed_by TEXT,
  status TEXT,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  cash_drawer_amount DECIMAL(12,2) DEFAULT 0,
  cash_expected DECIMAL(12,2) DEFAULT 0,
  cash_difference DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_name, shift_date, shift_number)
);

-- ===== جدول الأوردرات (Orders) =====
CREATE TABLE IF NOT EXISTS cashier_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id INTEGER,
  order_number INTEGER NOT NULL,
  table_number INTEGER DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL,
  invoice_number TEXT,
  branch TEXT DEFAULT 'الفرع الرئيسي',
  cashier TEXT DEFAULT 'كاشير',
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  vat_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  shift_id uuid REFERENCES cashier_shifts(id) ON DELETE SET NULL,
  sync_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول تفاصيل الأوردرات (Order Items) =====
CREATE TABLE IF NOT EXISTS cashier_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES cashier_orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  size TEXT,
  additions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول الفواتير (Invoices) =====
CREATE TABLE IF NOT EXISTS cashier_invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id INTEGER,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id uuid REFERENCES cashier_orders(id) ON DELETE SET NULL,
  order_number TEXT,
  table_number INTEGER DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  invoice_location TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_before_vat DECIMAL(12,2) DEFAULT 0,
  vat_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'cash',
  branch TEXT,
  cashier TEXT,
  created_at TIMESTAMPTZ,
  shift_id uuid REFERENCES cashier_shifts(id) ON DELETE SET NULL,
  sync_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes لتحسين الأداء =====
CREATE INDEX IF NOT EXISTS idx_cashier_orders_shift_id ON cashier_orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_cashier_orders_created_at ON cashier_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_cashier_invoices_shift_id ON cashier_invoices(shift_id);
CREATE INDEX IF NOT EXISTS idx_cashier_invoices_created_at ON cashier_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_date ON cashier_shifts(shift_date);

-- ===== RLS Policies =====
ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_invoices ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Allow service role full access on cashier_shifts" ON cashier_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on cashier_orders" ON cashier_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on cashier_order_items" ON cashier_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on cashier_invoices" ON cashier_invoices FOR ALL USING (true) WITH CHECK (true);

-- Allow public read access (optional, if Next.js uses anon key)
CREATE POLICY "Allow public read access on cashier_shifts" ON cashier_shifts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cashier_orders" ON cashier_orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cashier_order_items" ON cashier_order_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cashier_invoices" ON cashier_invoices FOR SELECT USING (true);
