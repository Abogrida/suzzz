-- ===================================================
-- Support Manual Recipe Items - Migration
-- ===================================================

-- Allow product_id to be NULL for manual items
ALTER TABLE recipe_items ALTER COLUMN product_id DROP NOT NULL;

-- Add manual_name column for items not in inventory
ALTER TABLE recipe_items ADD COLUMN IF NOT EXISTS manual_name TEXT;

-- Add manual_unit column if needed (otherwise reuse unit)
-- reusing existing 'unit' column is fine for manual entries too
