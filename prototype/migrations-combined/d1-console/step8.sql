ALTER TABLE users ADD COLUMN suspended_at TEXT;
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('complaint','content','bug','advertising','other')),
  subject TEXT,
  body TEXT NOT NULL,
  contact TEXT,
  lang TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX idx_reports_status ON reports (status, created_at);
