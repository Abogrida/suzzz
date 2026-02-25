-- ===================================================
-- جدول الإعدادات (لتخزين كلمة مرور الأدمن)
-- ===================================================

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة قيمة افتراضية فارغة لكلمة المرور
-- إذا كانت القيمة فارغة، سيعتمد النظام على ADMIN_PASSWORD من ملف .env
INSERT INTO settings (key, value) VALUES ('admin_password', '') 
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
