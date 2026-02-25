-- ===================================================
-- Recipe Management System - Migration
-- ===================================================

-- ===== Table for Actual Products (Sellable Items/Menu Items) =====
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  description TEXT DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Table for Recipes (Linking Menu Items to Ingredients/Inventory) =====
CREATE TABLE IF NOT EXISTS recipe_items (
  id BIGSERIAL PRIMARY KEY,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes for Performance =====
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_recipe_items_menu_item_id ON recipe_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_product_id ON recipe_items(product_id);

-- ===== Updated_at Trigger =====
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== Row Level Security (RLS) =====
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (used in server-side API)
CREATE POLICY "Allow service role full access on menu_items" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on recipe_items" ON recipe_items
  FOR ALL USING (true) WITH CHECK (true);
