-- Pro / Free: a 30-day trial for everybody, then paid (App Store / Google Play via RevenueCat) or admin-granted Pro.
-- Existing accounts get 30 days from the moment this migration runs; a new account has trial_ends_at NULL and its
-- trial is created_at + 30 days (functions/_lib/entitlement.ts), so the sign-up code needs no change.
-- Nothing here changes behaviour until the server flag PRO_ENABLED=1.
ALTER TABLE users ADD COLUMN trial_ends_at TEXT;
-- 1 when the person/device had already used a trial, so this account started on the Free tier.
ALTER TABLE users ADD COLUMN trial_denied INTEGER NOT NULL DEFAULT 0;
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
  months INTEGER CHECK (months IS NULL OR (months BETWEEN 1 AND 60)),
  days INTEGER CHECK (days IS NULL OR (days BETWEEN 1 AND 3650)),
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

-- One trial per person: salted SHA-256 hashes (never the raw values) of the things a person re-uses when farming accounts.
-- kind: email (normalized: lower-case, +tag removed, Gmail dots removed, googlemail = gmail), device (random id kept in the
-- phone's Keychain/Keystore), cookie (web), ip (coarse network, counted, not blocked on its own).
-- A claim outlives the account (deleting an account does not bring the trial back).
CREATE TABLE trial_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('email','device','cookie','ip')),
  hash TEXT NOT NULL,
  user_id TEXT,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_trial_claims ON trial_claims (kind, hash);
CREATE INDEX idx_trial_claims_user ON trial_claims (user_id);
