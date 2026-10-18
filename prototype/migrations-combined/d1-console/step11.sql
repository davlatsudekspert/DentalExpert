ALTER TABLE users ADD COLUMN guest INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_seen_at TEXT;
CREATE INDEX idx_users_guest ON users (guest, last_seen_at);
ALTER TABLE class_assignments ADD COLUMN reveal TEXT NOT NULL DEFAULT 'closed';
ALTER TABLE class_submissions ADD COLUMN progress TEXT;
