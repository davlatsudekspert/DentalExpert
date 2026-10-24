-- Pro / Free: a 30-day trial for everybody, then paid (App Store / Google Play via RevenueCat) or admin-granted Pro.
-- Existing accounts get 30 days from the moment this migration runs; a new account has trial_ends_at NULL and its
-- trial is created_at + 30 days (functions/_lib/entitlement.ts), so the sign-up code needs no change.
-- Nothing here changes behaviour until the server flag PRO_ENABLED=1.
ALTER TABLE users ADD COLUMN trial_ends_at TEXT;
UPDATE users SET trial_ends_at=datetime('now','+30 days') WHERE guest=0;

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('apple','google','admin')),
  -- active: paid and renewing; cancelled: auto-renew off, Pro until expires_at; billing_issue: grace until expires_at;
  -- expired / revoked: no Pro.
  status TEXT NOT NULL CHECK (status IN ('active','cancelled','billing_issue','expired','revoked')),
  expires_at TEXT,
  original_txn TEXT NOT NULL UNIQUE,
  -- Time (ms) of the newest webhook event applied, so a late old event never undoes a newer one.
  last_event_ms INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_subscriptions_user ON subscriptions (user_id, status);

-- Webhook deliveries already applied (idempotent by event id) and the newest event time seen per subscription.
CREATE TABLE billing_events (
  event_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Practice questions answered per account and day (UTC): the Free daily cap is checked here, so it holds across devices.
CREATE TABLE practice_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Admin grants by e-mail (Admin panel → Pro). A grant for an address with no account yet waits here (user_id NULL) and is
-- applied when that e-mail signs up or signs in. expires_at is set when the grant is applied; months NULL = until revoked.
CREATE TABLE pro_grants (
  email TEXT PRIMARY KEY,
  months INTEGER CHECK (months IS NULL OR months IN (1,3,6,12)),
  granted_by TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TEXT,
  revoked_at TEXT
);
-- Who did what in the Pro admin tools.
CREATE TABLE admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  detail TEXT,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
