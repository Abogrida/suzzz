-- Migration 013: Remove Unique Constraint from hr_attendance
-- This allows multiple check-in/out cycles per day for the same employee.

ALTER TABLE hr_attendance
  DROP CONSTRAINT IF EXISTS hr_attendance_employee_id_attendance_date_key;

-- Note: The constraint name might vary depending on how PostgreSQL generated it.
-- Usually it is table_name_column1_column2_key.
-- If the above fails, you can use:
-- ALTER TABLE hr_attendance DROP CONSTRAINT IF EXISTS hr_attendance_employee_id_key;

-- We still want an index for performance
CREATE INDEX IF NOT EXISTS idx_hr_attendance_emp_date ON hr_attendance(employee_id, attendance_date);
