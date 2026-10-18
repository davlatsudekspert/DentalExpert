-- Teacher–student tests v2. Topic tests may give every student their own questions ("variants"): `pool` holds the question
-- references ("<topicId>:<index>") the test draws from, `per_student` how many each student gets, and the answer key
-- (answer_key) is then aligned with the pool. The draw is deterministic (SHA-256 of "<assignmentId>:<userId>", see
-- src/classroomShared.ts) and is stored with the attempt in class_submissions.questions when the student starts.
-- `deadline_at` (UTC, 'YYYY-MM-DD HH:MM:SS') ends a test at a set time; reveal may now also be 'deadline'.
-- Registered accounts only: no new class-only guest accounts are created; existing guest rows stay until they expire.
ALTER TABLE class_assignments ADD COLUMN pool TEXT;
ALTER TABLE class_assignments ADD COLUMN per_student INTEGER;
ALTER TABLE class_assignments ADD COLUMN deadline_at TEXT;
ALTER TABLE class_submissions ADD COLUMN questions TEXT;
