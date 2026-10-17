-- Dental education institutions with links to their OFFICIAL schedule pages. Schedules themselves are never stored.
CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city_id TEXT NOT NULL,
  website TEXT NOT NULL CHECK (website LIKE 'https://%'),
  schedule_url TEXT CHECK (schedule_url IS NULL OR schedule_url LIKE 'http%://%'),
  schedule_label TEXT,
  attribution_required INTEGER NOT NULL DEFAULT 0,
  checked_on TEXT NOT NULL,
  verification TEXT NOT NULL DEFAULT 'machine_checked' CHECK (verification IN ('machine_checked','human_verified'))
);
