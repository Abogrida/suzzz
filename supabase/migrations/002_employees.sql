-- ===================================================
-- نظام الموظفين والجرد
-- ===================================================

-- ===== جدول الموظفين =====
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== جدول الجرد =====
CREATE TABLE IF NOT EXISTS inventory_counts (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT NOT NULL DEFAULT 'morning', -- 'morning' or 'evening'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== تفاصيل الجرد =====
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id BIGSERIAL PRIMARY KEY,
  count_id BIGINT NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_counts_employee ON inventory_counts(employee_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_date ON inventory_counts(count_date);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_count ON inventory_count_items(count_id);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access on employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on inventory_counts" ON inventory_counts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on inventory_count_items" ON inventory_count_items FOR ALL USING (true) WITH CHECK (true);
