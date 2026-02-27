-- =====================================================
-- Migration 011: Attendance Schedule & Leaves
-- =====================================================

-- 1. Add work schedule columns to hr_employees
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS late_threshold_minutes INT DEFAULT 15,
  ADD COLUMN IF NOT EXISTS off_days INT[] DEFAULT '{5,6}';
-- off_days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

-- 2. Add detailed timing + source columns to hr_attendance
ALTER TABLE hr_attendance
  ADD COLUMN IF NOT EXISTS check_in_time TIME,
  ADD COLUMN IF NOT EXISTS check_out_time TIME,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS synced_from_local BOOLEAN DEFAULT false;

-- Constraint on source
ALTER TABLE hr_attendance
  DROP CONSTRAINT IF EXISTS hr_attendance_source_check;
ALTER TABLE hr_attendance
  ADD CONSTRAINT hr_attendance_source_check
  CHECK (source IN ('manual', 'kiosk'));

-- 3. Create hr_employee_leaves table
CREATE TABLE IF NOT EXISTS hr_employee_leaves (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_start DATE NOT NULL,
  leave_end   DATE NOT NULL,
  leave_type  TEXT DEFAULT 'annual'
    CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (leave_end >= leave_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hr_leaves_employee ON hr_employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_dates ON hr_employee_leaves(leave_start, leave_end);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_source ON hr_attendance(source);

-- RLS
ALTER TABLE hr_employee_leaves ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hr_employee_leaves'
      AND policyname = 'Allow full access on hr_employee_leaves'
  ) THEN
    CREATE POLICY "Allow full access on hr_employee_leaves"
      ON hr_employee_leaves FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
