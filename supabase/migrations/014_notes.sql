-- ===== جدول ملاحظات الشغل =====
CREATE TABLE IF NOT EXISTS work_notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general', -- 'general' | 'payment' | 'important' | 'other'
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'done'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_notes_status ON work_notes(status);
CREATE INDEX IF NOT EXISTS idx_work_notes_category ON work_notes(category);
CREATE INDEX IF NOT EXISTS idx_work_notes_created_at ON work_notes(created_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_work_notes_updated_at
  BEFORE UPDATE ON work_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE work_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access on work_notes" ON work_notes
  FOR ALL USING (true) WITH CHECK (true);
