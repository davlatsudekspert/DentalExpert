-- QR quick tests: a student scans the teacher's code and joins with a nickname only. The server creates a class-only
-- "guest" account for that device (no email; the placeholder address is never shown or mailed). Guest sessions are
-- refused everywhere except the classroom endpoints (functions/_lib/auth.ts), and idle guests are deleted after 180 days.
ALTER TABLE users ADD COLUMN guest INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_seen_at TEXT;
CREATE INDEX idx_users_guest ON users (guest, last_seen_at);
-- When students see the right answers: 'closed' = after the teacher finishes the test, 'instant' = right after submitting.
ALTER TABLE class_assignments ADD COLUMN reveal TEXT NOT NULL DEFAULT 'closed';
-- Answers so far while a quiz is in progress, so a student who closes the app continues where they stopped.
ALTER TABLE class_submissions ADD COLUMN progress TEXT;
