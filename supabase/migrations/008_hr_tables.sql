-- =====================================================
-- HR System Tables
-- =====================================================

-- موظفو الشركة (الـ HR)
CREATE TABLE IF NOT EXISTS hr_employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  national_id TEXT DEFAULT '',
  hire_date DATE DEFAULT CURRENT_DATE,
  base_salary DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المدفوعات (راتب / سلفة / حافز / خصم)
CREATE TABLE IF NOT EXISTS hr_payments (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('salary','advance','bonus','deduction')),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الحضور والغياب
CREATE TABLE IF NOT EXISTS hr_attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hr_payments_employee ON hr_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_payments_date ON hr_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee ON hr_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON hr_attendance(attendance_date);

-- RLS
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access on hr_employees" ON hr_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on hr_payments" ON hr_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on hr_attendance" ON hr_attendance FOR ALL USING (true) WITH CHECK (true);
