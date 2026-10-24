#!/usr/bin/env python3
"""Attestation question data: structure, counts and the serving rules (run in CI; stdlib only).
Checks: every question has exactly 4 non-empty options, a key index in range, a unique id and non-empty text; manifest and
index counts match the files; no `review: true` question is in the served files; withheld specialties serve nothing; the
served files carry no flags; the 12 specialties are all present; audit stats are consistent."""
import json, os, re, sys
D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'attestation')
man = json.load(open(os.path.join(D, 'manifest.json')))
idx = {i['id']: i for i in json.load(open(os.path.join(D, 'index.json')))}
fails = []
NUM = re.compile(r'\d+(?:[.,]\d+)?|%|°')
UZ_PROT = {'emas','faqat','barcha','hamma','xamma','hammasi','xammasi','barchasi','bari','hech','xech','har','xar','yoq','tashqari','istisno','notogri','togri','bolmagan','bolmaydi','mm','sm','mkm','mka','ml','mg','kg','mvt','yosh','kun','oy','soat','daqiqa','sekund','hafta','yil','gradus','bir','ikki','uch'}
RU_PROT = {'не','нет','кроме','все','всё','только','любой','каждый','ни','без','мм','см','мкм','мг','мл','кг','лет','года','год','мес','месяцев','дней','часов','сут','всех','весь','нельзя','исключением'}
def tokens(t, lang):
    t = re.sub(r'(\d)\s*([.,])\s*(\d)', r'\1.\3', t)
    nums = [n.replace(',', '.') for n in NUM.findall(t)]
    words = [w.lower().replace('\u2018', '').replace('\u2019', '').replace("'", '') for w in re.findall(r"[A-Za-z\u0400-\u04FF\u2018\u2019']+", t)]
    return nums, [w for w in words if w in (UZ_PROT if lang == 'uz' else RU_PROT)]
def bad(m): fails.append(m); print('FAIL', m)
if len(man['specialties']) != 12: bad('expected 12 specialties')
seen = set(); total = served_total = 0
for sp in man['specialties']:
    sid = sp['id']
    qs = json.load(open(os.path.join(D, sid + '.json')))['questions']
    if len([q for q in qs if 'q' in q]) != sp['questions']: bad(f'{sid}: manifest uz count {sp["questions"]}')
    review = 0
    for q in qs:
        if q['id'] in seen: bad('duplicate id ' + q['id'])
        seen.add(q['id'])
        blocks = []
        if 'q' in q: blocks.append(('uz', q, q['src']))
        if 'ru' in q: blocks.append(('ru', q['ru'], q['ru']['src']))
        if not blocks: bad(q['id'] + ' has no text')
        for lang, b, src in blocks:
            if not b['q'].strip(): bad(q['id'] + ' empty text ' + lang)
            if len(b['o']) != 4 or any(not o.strip() for o in b['o']): bad(q['id'] + ' options ' + lang)
            if not isinstance(b['k'], int) or not 0 <= b['k'] < len(b['o']): bad(q['id'] + ' key index ' + lang)
            # cleaned text vs untouched source: same numbers, units and qualifiers (negations etc.), field by field
            if len(src['o']) != len(b['o']): bad(q['id'] + ' src options ' + lang)
            else:
                for x, y in zip([src['q']] + src['o'], [b['q']] + b['o']):
                    if tokens(x, lang) != tokens(y, lang): bad(f'{q["id"]} {lang}: numbers/units/qualifiers differ: {x[:50]!r} vs {y[:50]!r}')
        if q.get('review'):
            review += 1
            if not q.get('why'): bad(q['id'] + ' review without reason')
    if sp['review'] != review: bad(f'{sid}: manifest review count')
    uzq = [q for q in qs if 'q' in q]
    if sp['served'] != sum(1 for q in uzq if not q.get('review')): bad(f'{sid}: manifest served count')
    if sp['servedRu'] != sum(1 for q in qs if 'ru' in q and not q.get('review')): bad(f'{sid}: manifest servedRu count')
    if idx[sid]['served'] != sp['served'] or idx[sid]['servedRu'] != sp['servedRu'] or idx[sid]['total'] != len(uzq) or idx[sid]['status'] != sp['status']: bad(f'{sid}: index.json out of date')
    sf = os.path.join(D, 'served', sid + '.json')
    if sp['status'] == 'withheld':
        if os.path.exists(sf): bad(f'{sid}: withheld specialty has a served file')
        if sp['served'] or sp['servedRu']: bad(f'{sid}: withheld specialty serves questions')
    else:
        sq = json.load(open(sf))['questions']
        ids = {q['id'] for q in qs if not q.get('review')}
        if {q['id'] for q in sq} != ids: bad(f'{sid}: served file != non-review questions')
        for q in sq:
            if not set(q) <= {'id', 'q', 'o', 'k', 'r'} or not ('q' in q or 'r' in q): bad(q['id'] + ' served file fields')
            for blk in (q if 'q' in q else None, q.get('r')):
                if blk and len(blk['o']) != 4: bad(q['id'] + ' served options')
    total += len(uzq); served_total += sp['served']
if man['total'] != total: bad('manifest total')
if man['totalServed'] != served_total: bad('manifest totalServed')
for f in os.listdir(os.path.join(D, 'served')):
    if f[:-5] not in idx or idx[f[:-5]]['status'] == 'withheld': bad('stray served file ' + f)
print(f'{total} questions in 12 specialties, {served_total} served, {len(fails)} failures')
sys.exit(1 if fails else 0)
