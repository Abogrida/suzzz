-- ===================================================
-- Drop Unique Constraints to Allow Multiple Branches/Reset DBs to Sync
-- ===================================================

-- Drop unique constraint on invoice_number
ALTER TABLE cashier_invoices DROP CONSTRAINT IF EXISTS cashier_invoices_invoice_number_key;

-- Drop unique constraint on shifts 
ALTER TABLE cashier_shifts DROP CONSTRAINT IF EXISTS cashier_shifts_shift_name_shift_date_shift_number_key;

-- Add a non-unique index on invoice_number for performance (optional but good practice since Next.js might query it)
CREATE INDEX IF NOT EXISTS idx_cashier_invoices_invoice_number ON cashier_invoices(invoice_number);
