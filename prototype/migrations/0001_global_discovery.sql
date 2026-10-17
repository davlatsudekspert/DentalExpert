-- Global discovery on Cloudflare D1 (SQLite). Translated text is stored as JSON {"uz","ru","en"}.
CREATE TABLE countries (
  code TEXT PRIMARY KEY CHECK (length(code) = 2),
  name TEXT NOT NULL
);

CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL REFERENCES countries(code),
  name TEXT NOT NULL,
  lat REAL, lng REAL
);

CREATE TABLE clinicians (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  initials TEXT,
  specialty TEXT NOT NULL,
  bio TEXT,
  languages TEXT NOT NULL DEFAULT '[]',
  services TEXT NOT NULL DEFAULT '[]',
  years INTEGER,
  photo_url TEXT,
  license_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (license_status IN ('unverified','pending','verified','rejected')),
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  city_id TEXT NOT NULL REFERENCES cities(id),
  address TEXT,
  lat REAL, lng REAL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE clinician_clinics (
  clinician_id TEXT NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  PRIMARY KEY (clinician_id, clinic_id)
);

CREATE TABLE contact_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinician_id TEXT NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('phone','telegram','instagram','email','map','payment')),
  value TEXT NOT NULL,
  verified_at TEXT
);

CREATE TABLE ad_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinician_id TEXT NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  city_id TEXT NOT NULL REFERENCES cities(id),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (1,3,6,10)),
  payment_state TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_state IN ('unpaid','paid','refunded','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_campaigns_city ON ad_campaigns (city_id, starts_at, ends_at);
CREATE INDEX idx_clinics_city ON clinics (city_id);
