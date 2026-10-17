-- Dentist public profiles: contact channels the dentist enters themselves. A profile is shown to patients only when the dentist
-- asked for it (publish_requested) and the owner verified it (verified_at); any later change to identity or contact fields clears the verification.
ALTER TABLE users ADD COLUMN specialty TEXT;
ALTER TABLE users ADD COLUMN telegram TEXT;
ALTER TABLE users ADD COLUMN instagram TEXT;
ALTER TABLE users ADD COLUMN public_email TEXT;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN map_url TEXT;
ALTER TABLE users ADD COLUMN publish_requested INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN verified_at TEXT;
