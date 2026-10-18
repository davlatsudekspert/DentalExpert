-- Optional profile photo of a signed-in user (mainly dentists), stored as a small data URL (≤200 KB decoded, 512×512 WebP/JPEG/PNG).
-- photo_at changes with every upload and is part of the photo URL, so the image can be cached as immutable.
-- It is served publicly only when the profile itself is public (dentist, publish_requested, verified_at); the owner always sees it.
ALTER TABLE users ADD COLUMN photo TEXT;
ALTER TABLE users ADD COLUMN photo_at TEXT;
