-- Sign in with Google / Apple: one row per provider account (the id_token `sub`), linked to a user.
-- Deleting the user (account deletion) removes its identities by cascade.
CREATE TABLE oauth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('google','apple')),
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, subject)
);
CREATE INDEX idx_oauth_identities_user ON oauth_identities (user_id);
