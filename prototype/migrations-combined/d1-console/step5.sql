CREATE TABLE class_groups (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  next_member_no INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_class_groups_teacher ON class_groups (teacher_id);
CREATE TABLE class_members (
  group_id TEXT NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_no INTEGER NOT NULL,
  nickname TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_class_members_user ON class_members (user_id);
CREATE TABLE class_assignments (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('task','quiz')),
  title TEXT NOT NULL,
  body TEXT,
  deck_id TEXT,
  answer_key TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_class_assignments_group ON class_assignments (group_id, created_at);
CREATE TABLE class_submissions (
  assignment_id TEXT NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer TEXT,
  score INTEGER,
  total INTEGER,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (assignment_id, user_id)
);
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
