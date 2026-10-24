#!/usr/bin/env python3
"""Light spelling clean-up of the imported TMBM questions (run after tmbm_import.py, before tmbm_audit.py).

    python3 tools/tmbm_clean.py

Keeps the importer's text untouched in `src` ({q, o} with the options in the same order as `o`) and writes the cleaned text to
`q` / `o`. Only whole-token spelling fixes: curated typos and x->h words (tools/tmbm_typos.json), missing o'/g' marks restored when the
corpus itself spells the same word with the marks at least 5x as often, a few spacing fixes (space before , . : ; ? ), missing space after a comma
between letters). No rewording. Numbers, units, negations and qualifiers are never touched; tools/attestation_check.py fails if
any digit, unit or qualifier token differs between `src` and the cleaned text. Idempotent (always starts from `src`)."""
import collections, glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data', 'attestation')
TOK = re.compile(r"(?<![A-Za-z‘’])[A-Za-z‘’]+(?![A-Za-z‘’])")
strip = lambda w: w.replace('‘', '').replace('’', '')
fx = json.load(open(os.path.join(ROOT, 'tools', 'tmbm_typos.json'), encoding='utf-8'))
# qualifiers, negations and units: never rewritten (compared in the check as well)
PROTECTED = set(fx.get('protected', [])) | {
    'emas', 'faqat', 'barcha', 'hamma', 'xamma', 'hammasi', 'xammasi', 'barchasi', 'bari', 'hech', 'xech', 'har', 'xar', 'yoq', 'tashqari', 'istisno',
    'mm', 'sm', 'mkm', 'mka', 'ml', 'mg', 'kg', 'mvt', 'yosh', 'kun', 'oy', 'soat', 'daqiqa', 'sekund', 'hafta', 'yil', 'gradus', 'notogri', 'togri',
    'bolmagan', 'bolmaydi', 'yoqdir', 'barchasi', 'bir', 'ikki', 'uch', 'faqatgina'}


def case_like(src, new):
    if src[:1].isupper() and not src.isupper():
        return new[:1].upper() + new[1:]
    return new.upper() if src.isupper() and len(src) > 1 else new


def main():
    ids = [x['id'] for x in json.load(open(os.path.join(D, 'manifest.json')))['specialties']]
    files = [os.path.join(D, i + '.json') for i in ids]
    docs = {f: json.load(open(f, encoding='utf-8')) for f in files}
    # corpus vocabulary (from src when present) for the apostrophe restoration
    freq = collections.Counter()
    for d in docs.values():
        for q in d['questions']:
            if 'q' not in q:
                continue
            s = q.get('src') or {'q': q['q'], 'o': q['o']}
            for t in [s['q']] + s['o']:
                for w in TOK.findall(t):
                    freq[w.lower()] += 1
    by = collections.defaultdict(list)
    for w, c in freq.items():
        by[strip(w)].append((c, w))
    skip = set(fx['skipAuto'])
    auto = {}
    for s_, l in by.items():
        l.sort(reverse=True)
        if len(l) > 1:
            for c, w in l[1:]:
                if w == s_ and l[0][0] >= 5 * c and w not in skip and strip(l[0][1]) == w and w not in PROTECTED:
                    auto[w] = l[0][1]
    words = fx['words']
    stems = sorted(fx['stems'].items(), key=lambda kv: -len(kv[0]))
    kinds = collections.Counter()
    pairs = collections.Counter()

    def fix_token(m):
        t = m.group(0)
        lw = t.lower()
        new, kind = None, None
        if strip(lw) in PROTECTED:
            return t
        if lw in words:
            new, kind = words[lw], 'typo'
        elif lw in auto:
            new, kind = auto[lw], 'apostrophe'
        else:
            for st, rep in stems:
                if lw.startswith(st):
                    new, kind = rep + lw[len(st):], 'x-h'
                    break
        if new is None or new == lw:
            return t
        new = case_like(t, new)
        kinds[kind] += 1
        pairs[(t, new, kind)] += 1
        return new

    def spacing(s):
        n = re.sub(r'\s+([,.:;?)])', r'\1', s)
        n = re.sub(r'\(\s+', '(', n)
        n = re.sub(r'(?<=[A-Za-z‘’]),(?=[A-Za-z])', ', ', n)
        n = re.sub(r'\s{2,}', ' ', n).strip()
        if n != s:
            kinds['spacing'] += 1
        return n

    def clean(s):
        return spacing(TOK.sub(fix_token, s))

    RTOK = re.compile(r'[А-Яа-яЁё]+')
    ru_words, ru_stems = fx['ru_words'], sorted(fx['ru_stems'].items(), key=lambda kv: -len(kv[0]))

    def fix_ru(m):
        t = m.group(0)
        lw = t.lower()
        new = ru_words.get(lw)
        if new is None:
            for st, rep in ru_stems:
                if lw.startswith(st):
                    new = rep + lw[len(st):]
                    break
        if new is None:
            return t
        new = case_like(t, new)
        kinds['ru-typo'] += 1
        pairs[(t, new, 'ru-typo')] += 1
        return new

    def clean_ru(s):
        n = re.sub(r'\s+([,.:;?)])', r'\1', RTOK.sub(fix_ru, s))
        n = re.sub(r'\(\s+', '(', n)
        n = re.sub(r'\s{2,}', ' ', n).strip()
        if n != s:
            kinds['spacing-ru'] += 1
        return n

    report = []
    for f, d in docs.items():
        changed = 0
        before = sum(kinds.values())
        for q in d['questions']:
            ch = False
            if 'q' in q:
                s = q.get('src') or {'q': q['q'], 'o': list(q['o'])}
                q['src'] = s
                q['q'] = clean(s['q'])
                q['o'] = [clean(o) for o in s['o']]
                ch = q['q'] != s['q'] or q['o'] != s['o']
            if 'ru' in q:
                r = q['ru']
                s = r.get('src') or {'q': r['q'], 'o': list(r['o'])}
                r['src'] = s
                r['q'] = clean_ru(s['q'])
                r['o'] = [clean_ru(o) for o in s['o']]
                ch = ch or r['q'] != s['q'] or r['o'] != s['o']
            if ch:
                changed += 1
        d['cleaned'] = changed
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        report.append((d['id'], len(d['questions']), changed, sum(kinds.values()) - before))
    out = {'perSpecialty': [{'id': i, 'questions': n, 'changedQuestions': c, 'fixes': k} for i, n, c, k in report],
           'byKind': dict(kinds), 'distinctPairs': len(pairs), 'autoApostropheWords': len(auto)}
    json.dump(out, open(os.path.join(D, 'clean_report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump([[a, b, k, n] for (a, b, k), n in sorted(pairs.items(), key=lambda kv: (kv[0][2], kv[0][0].lower()))], open('/tmp/tm/pairs.json', 'w'), ensure_ascii=False)
    for r in report:
        print('%-20s %4d questions, %4d changed, %4d token fixes' % r)
    print(dict(kinds), 'distinct pairs', len(pairs))


if __name__ == '__main__':
    main()
