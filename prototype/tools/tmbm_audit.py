#!/usr/bin/env python3
"""Quality audit of the answer-key assumption for the imported TMBM question banks (see tools/tmbm_import.py).

    python3 tools/tmbm_audit.py          # recompute flags/`review`, manifest status, index.json and data/attestation/AUDIT.md

Inputs: data/attestation/<id>.json (from the importer) and data/attestation/audit_verdicts.json (the hand judgement of the
seeded sample of 60 questions per specialty). Run it AFTER the importer: the importer rewrites the question files.

What it does
  1. Re-derives the seeded sample (seed 'audit:<id>') and checks that every judged number belongs to it.
  2. Agreement per specialty: OK / total sampled, and OK / (OK + wrong) with a 95% Wilson interval.
  3. Scans ALL questions for red flags. A question gets `review: true` (and `why`) when it is damaged or its key cannot be
     trusted: judged wrong/ambiguous/corrupt in the sample, key text repeated among the options, spreadsheet-date or glued words,
     a Cyrillic remnant, an exact duplicate whose key differs, or the whole specialty is withheld.
     Keys are never changed; informational flags (negated stem, all/none-of-the-above) stay in `flags` only.
  4. Specialty status from the decidable agreement: >= 95% `ok`, >= 80% `beta`, otherwise `withheld` (all its questions are `review`).
  5. Writes manifest.json (status, audit numbers, served counts), index.json (tiny, what the app imports) and AUDIT.md.
"""
import collections, hashlib, json, math, os, random, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data', 'attestation')
T_M = 'янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек'
OK_AT, BETA_AT = 0.95, 0.80
SAMPLE = 60

EXCEL_RU = re.compile(r'(^|\s)(\d{1,2}-(%s)\b|(%s)-\d{1,2}\b)' % (T_M, T_M), re.I)
NEG = re.compile(r"\bemas\b|maydi\b|noto.?g.?ri javob|tashqari|istisno|kirmaydi|bo.?lmaydi|bo.?lmagan|qo.?llab bo.?lmaydi", re.I)
ALLNONE = re.compile(r"(hamma|xamma|barcha|hammasi|barchasi|bari)\b.{0,20}(to.?g.?ri|noto.?g.?ri)|to.?g.?ri javob yo.?q|hammasi to|barchasi to", re.I)


def wilson(k, n, z=1.96):
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    r = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - r) / d, (c + r) / d)


def sample_ns(qs, sid):
    r = random.Random(int.from_bytes(hashlib.sha256(('audit:' + sid).encode()).digest()[:4], 'big'))
    return [qs[i]['n'] for i in sorted(r.sample(range(len(qs)), SAMPLE))]


def main():
    man = json.load(open(os.path.join(D, 'manifest.json')))
    verd = json.load(open(os.path.join(D, 'audit_verdicts.json')))
    lines = []
    index = []
    for sp in man['specialties']:
        sid = sp['id']
        path = os.path.join(D, sid + '.json')
        doc = json.load(open(path))
        qs = doc['questions']
        uzqs = [q for q in qs if 'q' in q]   # the Uzbek-bearing questions, in file order (the sample is drawn from them)
        for q in qs:
            q.pop('review', None)
            q.pop('why', None)
        ns = sample_ns(uzqs, sid)
        v = verd[sid]
        judged = set(v['wrong']) | set(v['ambiguous']) | set(v['corrupt'])
        assert judged <= set(ns), (sid, sorted(judged - set(ns)))
        w, a, c = len(v['wrong']), len(v['ambiguous']), len(v['corrupt'])
        ok = SAMPLE - w - a - c
        dec = ok + w + c
        agree_all = ok / SAMPLE
        agree_dec = ok / dec if dec else 0.0
        lo, hi = wilson(ok, dec)
        status = 'ok' if agree_dec >= OK_AT else 'beta' if agree_dec >= BETA_AT else 'withheld'
        why = collections.defaultdict(list)
        for n in v['wrong']:
            why[n].append('audit-key-wrong')
        for n in v['ambiguous']:
            why[n].append('audit-key-ambiguous')
        for n in v['corrupt']:
            why[n].append('audit-text-corrupt')
        # automatic scan of every question
        first = {}
        neg = allnone = 0
        key_of = lambda q: q['o'][q['k']]
        for q in qs:
            n = q.get('n')
            if 'q' not in q:
                # Russian-only question: no Uzbek twin, so no sample verdict; it inherits the specialty status
                n = q['id']
                if len(q['ru']['o']) != 4 or any(not o for o in q['ru']['o']) or not q['ru']['q']:
                    why[n].append('malformed')
                if EXCEL_RU.search(' '.join([q['ru']['q']] + q['ru']['o'])):
                    why[n].append('excel-date')
                q.setdefault('flags', []).append('ru-only-unaudited')
                continue
            fl = q.get('flags', [])
            if 'ru' in q:
                rt = ' '.join([q['ru']['q']] + q['ru']['o'])
                if len(q['ru']['o']) != 4 or any(not o for o in q['ru']['o']):
                    why[n].append('malformed')
                if EXCEL_RU.search(rt):
                    why[n].append('excel-date')
            if len(q['o']) != 4 or any(not o for o in q['o']) or not q['q']:
                why[n].append('malformed')
            keyl = key_of(q).lower()
            if sum(1 for o in q['o'] if o.lower() == keyl) > 1:
                why[n].append('key-repeated-among-options')
            for f in fl:
                if f in ('excel-date', 'glued-words', 'cyrillic', 'short-stem', 'script-midword'):
                    why[n].append(f)
            if NEG.search(q['q']):
                neg += 1
                q.setdefault('flags', [])
                if 'negated-stem' not in q['flags']:
                    q['flags'].append('negated-stem')
            if any(ALLNONE.search(o) for o in q['o']):
                allnone += 1
                q.setdefault('flags', [])
                if 'all-none-option' not in q['flags']:
                    q['flags'].append('all-none-option')
            sig = (q['q'].lower(), tuple(sorted(o.lower() for o in q['o'])))
            if sig in first:
                p = first[sig]
                if key_of(p).lower() != keyl:
                    why[n].append('duplicate-with-different-key:' + p['id'])
                    why[p['n']].append('duplicate-with-different-key:' + q['id'])
                else:
                    why[n].append('duplicate-of:' + p['id'])
            else:
                first[sig] = q
        if status == 'withheld':
            for q in qs:
                why[q.get('n') or q['id']].append('specialty-withheld')
        flagged = 0
        for q in qs:
            r = why.get(q.get('n') or q['id'])
            if r:
                q['review'] = True
                q['why'] = sorted(set(r))
                flagged += 1
            if 'flags' in q:
                q['flags'] = sorted(set(q['flags']))
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
        served = len(uzqs) - sum(1 for q in uzqs if q.get('review'))
        served_ru = sum(1 for q in qs if 'ru' in q and not q.get('review'))
        # what the app ships: only non-review questions, no flags, one lazily loaded file per specialty
        os.makedirs(os.path.join(D, 'served'), exist_ok=True)
        sp_path = os.path.join(D, 'served', sid + '.json')
        if os.path.exists(sp_path):
            os.remove(sp_path)
        if status != 'withheld':
            slim = []
            for q in qs:
                if q.get('review'):
                    continue
                it = {'id': q['id']}
                if 'q' in q:
                    it.update({'q': q['q'], 'o': q['o'], 'k': q['k']})
                if 'ru' in q:
                    it['r'] = {'q': q['ru']['q'], 'o': q['ru']['o'], 'k': q['ru']['k']}
                slim.append(it)
            json.dump({'id': sid, 'questions': slim}, open(sp_path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        sp['status'] = status
        sp['audit'] = {'sampled': SAMPLE, 'ok': ok, 'ambiguous': a, 'wrong': w, 'corrupt': c,
                       'agreementAll': round(agree_all, 3), 'agreementDecidable': round(agree_dec, 3),
                       'wilson95': [round(lo, 3), round(hi, 3)], 'sampleSeed': 'audit:' + sid}
        sp['review'] = flagged
        sp['ruOnly'] = len(qs) - len(uzqs)
        sp['served'] = served
        sp['servedRu'] = served_ru
        sp['negatedStems'] = neg
        sp['allNoneOptions'] = allnone
        index.append({'id': sid, 'name': sp['name'], 'total': len(uzqs), 'served': served, 'servedRu': served_ru, 'status': status,
                      'agreement': round(agree_dec, 2)})
        reason_count = collections.Counter(x.split(':')[0] for r in why.values() for x in set(r))
        lines.append((sp, v, ns, reason_count, flagged))
    man['auditThresholds'] = {'ok': OK_AT, 'beta': BETA_AT}
    man['totalServed'] = sum(i['served'] for i in index)
    json.dump(man, open(os.path.join(D, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(index, open(os.path.join(D, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    out = ['# Attestation question banks: audit of the "first option is the key" assumption', '',
           'Generated by `tools/tmbm_audit.py` from `audit_verdicts.json`. Source: TMBM public test PDFs (see `manifest.json`).', '',
           '## Finding', '',
           'The PDFs carry no answer markup. The site\'s convention (first option = correct, shuffled at exam time) was checked on a seeded sample of %d questions per specialty, judged against general dental/medical knowledge.' % SAMPLE,
           '**The convention holds for most files but not all: it is close to random in `umumiy`, `terapevtik` and `parodontologiya`, and weak in `yuzjag`.** Do not ship those four with answer keys.', '',
           'Reviewer: one AI model, one pass, from general knowledge, no textbook lookup. "Ambiguous" = I could not confirm the key (ill-formed stem, several defensible options, or outside what I can verify). Read the rates as a screening audit; a specialist should confirm before any release.', '',
           '| Specialty | Questions | Sampled OK | Ambiguous | Wrong | Corrupt | Agreement (OK/%d) | Agreement among decidable (OK/(OK+wrong+corrupt)) | 95%% CI | Status | Served (not `review`) |' % SAMPLE,
           '|---|---|---|---|---|---|---|---|---|---|---|']
    for sp, v, ns, rc, fl in lines:
        a = sp['audit']
        out.append('| %s | %d | %d | %d | %d | %d | %.0f%% | %.0f%% | %.0f-%.0f%% | **%s** | %d |' % (
            sp['id'], sp['questions'], a['ok'], a['ambiguous'], a['wrong'], a['corrupt'], 100 * a['agreementAll'],
            100 * a['agreementDecidable'], 100 * a['wilson95'][0], 100 * a['wilson95'][1], sp['status'], sp['served']))
    out += ['', 'Status rule: decidable agreement >= %d%% `ok`, >= %d%% `beta` (served with a visible warning), below that `withheld` (every question is marked `review`, nothing is served). Chance level for 4 options is 25%%.' % (OK_AT * 100, BETA_AT * 100), '',
            '## Automatic scan of all questions', '',
            'Questions get `review: true` and a `why` list; the app never serves them. Counts of reasons per specialty (a question can have several):', '']
    for sp, v, ns, rc, fl in lines:
        out.append('- **%s**: %d of %d marked `review`. %s. Informational only (served): %d negated stems, %d with an all/none-of-the-above option.' % (
            sp['id'], fl, sp['questions'], ', '.join('%s %d' % (k, n) for k, n in sorted(rc.items())) or 'no reasons',
            sp['negatedStems'], sp['allNoneOptions']))
    out += ['', '## Flagged question ids from the sample', '', 'Ids are `<specialty>-<source number>`. These are `review: true` whatever the specialty status.', '']
    for sp, v, ns, rc, fl in lines:
        out.append('### %s (%s)' % (sp['id'], sp['status']))
        for k, label in (('wrong', 'key wrong'), ('ambiguous', 'ambiguous'), ('corrupt', 'text corrupt')):
            if v[k]:
                out.append('- %s: %s' % (label, ', '.join('%s-%04d' % (sp['id'], n) for n in v[k])))
        out.append('')
    out += ['## Parse notes', '',
            '- Word writes these PDFs tagged; the importer uses the per-paragraph marked-content ids to rejoin wrapped lines and, where a stem was typed in two runs, merges groups at full-width line ends (`layout-merge`, listed in `flags`). Bulleted files (`- option`) use the bullets.',
            '- Every parsed question has exactly 4 options. No numbering gaps. The numbers in the file names (e.g. `-453`) do not equal the real counts (see the Questions column).',
            '- Damaged in the source: spreadsheet-converted ranges such as `01-мар` (= "1-3") and `дек-16` (= "12-16") in several orthodontics/surgery options, Cyrillic look-alike letters inside Latin words (repaired and counted in `manifest.json`), words glued together without spaces, a few identical options, and duplicated questions. All are flagged, none rewritten.', '',
            '## Recommendation', '',
            '1. Legal: the TMBM site says all rights reserved and no permission was requested; the owner accepted the risk. The feature is ON by default with a kill switch (`VITE_ATTESTATION_ENABLED=0` at build time, `ATTESTATION_ENABLED=0` on the server) and a visible removal-request contact.',
            '2. Serve only `ok` specialties at first; treat `beta` ones as practice with a visible warning; leave `withheld` ones out until a specialist has produced real keys (the question texts are usable, the keys are not).',
            '3. Even in `ok` specialties about one question in five of the sample was ambiguous to me; the in-app "report an error" button and a specialist review of the flagged ids are the way to improve this. Never present results as an official score.']
    open(os.path.join(D, 'AUDIT.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    for sp, v, ns, rc, fl in lines:
        print('%-20s %-9s decidable %.0f%% all %.0f%% served %d/%d' % (sp['id'], sp['status'], 100 * sp['audit']['agreementDecidable'], 100 * sp['audit']['agreementAll'], sp['served'], sp['questions']))


if __name__ == '__main__':
    main()
