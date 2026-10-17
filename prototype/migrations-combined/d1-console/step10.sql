CREATE TABLE class_topics (
  group_id TEXT NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL CHECK (length(topic_id) BETWEEN 3 AND 20),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  lecture_done_at TEXT,
  oral_done_at TEXT,
  test_assignment_id TEXT REFERENCES class_assignments(id) ON DELETE SET NULL,
  PRIMARY KEY (group_id, topic_id)
);
ALTER TABLE class_assignments ADD COLUMN topic_id TEXT;
ALTER TABLE class_assignments ADD COLUMN questions TEXT;
ALTER TABLE class_assignments ADD COLUMN minutes INTEGER;
ALTER TABLE class_assignments ADD COLUMN closed_at TEXT;
ALTER TABLE class_submissions ADD COLUMN started_at TEXT;
ALTER TABLE class_submissions ADD COLUMN answers TEXT;
