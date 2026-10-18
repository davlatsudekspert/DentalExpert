ALTER TABLE class_assignments ADD COLUMN pool TEXT;
ALTER TABLE class_assignments ADD COLUMN per_student INTEGER;
ALTER TABLE class_assignments ADD COLUMN deadline_at TEXT;
ALTER TABLE class_submissions ADD COLUMN questions TEXT;
