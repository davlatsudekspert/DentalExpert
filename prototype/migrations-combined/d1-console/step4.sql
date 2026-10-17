UPDATE clinicians SET rating=4.9 WHERE id='kamila';
UPDATE clinicians SET rating=4.8 WHERE id='aziz';
UPDATE clinicians SET rating=5 WHERE id='malika';
UPDATE clinicians SET rating=4.8 WHERE id='umid';
UPDATE clinicians SET rating=4.9 WHERE id='dilnoza';
UPDATE clinicians SET rating=4.9 WHERE id='sardor';
UPDATE clinicians SET rating=4.8 WHERE id='nodira';
UPDATE clinicians SET rating=4.9 WHERE id='shavkat';
UPDATE clinicians SET rating=4.9 WHERE id='emma';
UPDATE clinicians SET rating=4.8 WHERE id='tashkent-1';
UPDATE clinicians SET rating=4.8 WHERE id='tashkent-2';
UPDATE clinicians SET rating=4.8 WHERE id='tashkent-3';
UPDATE clinicians SET rating=4.8 WHERE id='tashkent-4';
UPDATE clinicians SET rating=4.8 WHERE id='dubai-2';
UPDATE clinicians SET rating=4.8 WHERE id='dubai-3';
UPDATE clinicians SET rating=4.8 WHERE id='dubai-4';
CREATE TABLE IF NOT EXISTS institutions (
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
INSERT OR IGNORE INTO institutions (id,name,city_id,website,schedule_url,schedule_label,attribution_required,checked_on) VALUES ('tsdi','Toshkent davlat stomatologiya instituti','UZ-TK','https://tsdi.uz','http://ouf.tsdi.uz/jadval','Bakalavriat',1,'2026-10-17');
INSERT OR IGNORE INTO institutions (id,name,city_id,website,schedule_url,schedule_label,attribution_required,checked_on) VALUES ('sammu','Samarqand davlat tibbiyot universiteti','UZ-SA','https://www.sammu.uz','https://www.sammu.uz/uz/pages/class_schedule','Bakalavriat',1,'2026-10-17');
INSERT OR IGNORE INTO institutions (id,name,city_id,website,schedule_url,schedule_label,attribution_required,checked_on) VALUES ('adti','Andijon davlat tibbiyot instituti','UZ-AN','https://adti.uz',NULL,NULL,0,'2026-10-17');
INSERT OR IGNORE INTO institutions (id,name,city_id,website,schedule_url,schedule_label,attribution_required,checked_on) VALUES ('alfraganus','Alfraganus universiteti','UZ-TK','https://afu.uz','https://storage.afu.uz/s/zte7Rwb94JecjjF',NULL,0,'2026-10-17');
