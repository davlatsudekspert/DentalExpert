#!/usr/bin/env python3
"""Photo credits guard. Every bundled photo (src/photos/*.webp) needs an entry in public/credits.json with author, licence,
source and file-page URL; licences are limited to public domain / CC0 / CC BY / CC BY-SA; each file stays under a size cap;
images that carry meaning need alt text in uz, ru and en; CREDITS.md lists every entry; and code may not reference an
image under photos/ that has no entry. Exit code 1 on any problem."""
import json,re,sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
PHOTOS=ROOT/'src'/'photos'
ALLOWED=re.compile(r'^(Public domain|CC0 1\.0|CC BY (2\.0|2\.5|3\.0|4\.0)|CC BY-SA (2\.0|2\.5|3\.0|4\.0))$')
MAX_FILE=200*1024      # one image
MAX_TOTAL=6*1024*1024  # everything added
LANGS=('uz','ru','en')
bad=[]
def fail(m):bad.append(m)
data=json.loads((ROOT/'public'/'credits.json').read_text())
items=data.get('images',[])
seen=set()
for e in items:
    f=e.get('file','?')
    if f in seen:fail(f'{f}: duplicate entry')
    seen.add(f)
    for k in ('title','author','license','sourceUrl','fileUrl','modifications'):
        if not str(e.get(k,'')).strip():fail(f'{f}: missing {k}')
    if not ALLOWED.match(e.get('license','')):fail(f'{f}: licence not allowed: {e.get("license")!r}')
    for k in ('sourceUrl','fileUrl'):
        if e.get(k) and not str(e[k]).startswith('https://'):fail(f'{f}: {k} must be https')
    if e.get('license','').startswith('CC BY') and not e.get('licenseUrl'):fail(f'{f}: CC licence needs licenseUrl')
    if not e.get('decorative'):
        for l in LANGS:
            if not str((e.get('alt') or {}).get(l,'')).strip():fail(f'{f}: missing alt.{l}')
    p=PHOTOS/f
    if not p.exists():fail(f'{f}: file not found in src/photos')
    elif p.stat().st_size>MAX_FILE:fail(f'{f}: {p.stat().st_size} bytes exceeds cap {MAX_FILE}')
    if not (e.get('width') and e.get('height')):fail(f'{f}: width/height required')
    # Uzbek takes the singular after a number ("15–40 o‘lcham", not "o‘lchamlar"); tools/i18n_scan.py found one in a caption.
    for k,v in (e.get('alt') or {}).items():
        if k=='uz' and re.search(r'\d\s+[A-Za-zʻʼ‘’\']+lar\b',str(v)):fail(f'{f}: alt.uz has a plural after a number: {v!r}')
total=0
for p in sorted(PHOTOS.glob('*')):
    if p.suffix!='.webp':fail(f'{p.name}: only .webp allowed');continue
    total+=p.stat().st_size
    if p.name not in seen:fail(f'{p.name}: no credits entry')
if total>MAX_TOTAL:fail(f'photos total {total} bytes exceeds {MAX_TOTAL}')
# Code references.
refs=set()
for path in list((ROOT/'src').rglob('*'))+[ROOT/'index.html']:
    if path.suffix in ('.ts','.tsx','.css','.html') and path.is_file() and 'photos' not in path.parts[-2:-1]:
        for m in re.finditer(r'photos/([\w.\-]+\.(?:webp|jpe?g|png|gif|avif))',path.read_text(errors='ignore')):refs.add(m.group(1))
for r in sorted(refs):
    if r not in seen:fail(f'{r}: referenced in code but has no credits entry')
md=(ROOT/'CREDITS.md').read_text() if (ROOT/'CREDITS.md').exists() else ''
for f in seen:
    if f not in md:fail(f'{f}: missing from CREDITS.md')
print(f'{len(items)} credited photos, {total//1024} KB total, {len(refs)} referenced files')
if bad:
    print('\n'.join('FAIL '+b for b in bad));sys.exit(1)
print('PASS photo credits')
