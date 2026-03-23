// Apply notes migration via Supabase REST API
const SUPABASE_URL = 'https://vmkfwhnpevbamrfbjkzv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3aG5wZXZiYW1yZmJqa3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NTk5OCwiZXhwIjoyMDg3NTYxOTk4fQ.2-vQNcrkLaenO2McoC5qkGdxf-lcGQ3Np__I5a35QI8';

const sql = `
CREATE TABLE IF NOT EXISTS work_notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_notes_status ON work_notes(status);
CREATE INDEX IF NOT EXISTS idx_work_notes_category ON work_notes(category);
CREATE INDEX IF NOT EXISTS idx_work_notes_created_at ON work_notes(created_at DESC);

CREATE OR REPLACE FUNCTION update_work_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_work_notes_updated_at ON work_notes;
CREATE TRIGGER update_work_notes_updated_at
  BEFORE UPDATE ON work_notes
  FOR EACH ROW EXECUTE FUNCTION update_work_notes_updated_at();

ALTER TABLE work_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='work_notes' AND policyname='Allow full access on work_notes'
  ) THEN
    CREATE POLICY "Allow full access on work_notes" ON work_notes
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
});

if (response.ok) {
    console.log('✅ Migration applied via RPC!');
} else {
    // Try via pg-meta API
    const pgMeta = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
    });
    const status = pgMeta.status;
    const body = await pgMeta.text();
    console.log(`pg/query status: ${status}`);
    console.log(body.substring(0, 400));
}
