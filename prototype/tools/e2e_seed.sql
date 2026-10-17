-- Local-only fixtures for tools/e2e_live.py: one verified real clinician with good and bad contacts.
DELETE FROM contact_channels WHERE clinician_id='e2e-real';
DELETE FROM clinician_clinics WHERE clinician_id='e2e-real';
DELETE FROM clinicians WHERE id='e2e-real';
DELETE FROM clinics WHERE id='e2e-clinic';
INSERT INTO clinicians (id,full_name,initials,specialty,bio,languages,services,years,license_status,is_demo,rating)
 VALUES ('e2e-real','Dr. E2E Verified','EV','{"uz":"Ortodont","ru":"Ортодонт","en":"Orthodontist"}','{"uz":"b","ru":"b","en":"E2E bio"}','["UZ"]','[]',5,'verified',0,NULL);
INSERT INTO clinics (id,name,city_id,address,is_demo) VALUES ('e2e-clinic','E2E Clinic','UZ-AN','{"uz":"a","ru":"a","en":"E2E address"}',0);
INSERT INTO clinician_clinics VALUES ('e2e-real','e2e-clinic');
INSERT INTO contact_channels (clinician_id,kind,value,verified_at) VALUES
 ('e2e-real','phone','+998 90 123 45 67','2026-01-01'),
 ('e2e-real','telegram','@e2e_doc','2026-01-01'),
 ('e2e-real','instagram','javascript:alert(1)','2026-01-01'),
 ('e2e-real','map','http://insecure.example/map','2026-01-01'),
 ('e2e-real','email','unverified@example.com',NULL);
