-- Editable profile fields saved from the app (the "Edit profile" screen used to be a demo that saved nothing).
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN workplace TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
