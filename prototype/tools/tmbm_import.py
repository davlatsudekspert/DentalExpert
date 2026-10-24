#!/usr/bin/env python3
"""Import the public test-question PDFs of the Uzbek Ministry of Health's Medical Personnel Qualification
Assessment Centre (tmbm.ssv.uz, "TEST SINOVI SAVOLLARI") for the 12 dental specialties.

    python3 tools/tmbm_import.py            # download (cached), parse, write data/attestation/*.json + manifest.json
    python3 tools/tmbm_import.py --offline  # only use the cache, never touch the network

Source convention (stated by the site's test base, not marked in the PDFs): the FIRST option of every question is the correct one.
This script keeps that option as the key, then shuffles the options per question with a PRNG seeded by the question id,
so the key is not always A. Wording is never rewritten. Only these mechanical clean-ups are applied: whitespace,
apostrophes (o' g' -> o‘ g‘; tutuq -> ’, the characters the app uses), list bullets, Cyrillic look-alike letters inside
Latin words (reported in the manifest) and joining of wrapped lines. Anything the script cannot repair is flagged, not fixed:
flags are written to each question (`flags`) and to the manifest, and AUDIT.md / tools/tmbm_audit.py decide `review`.

Needs: curl, pdfplumber (pip install pdfplumber). The generated JSON is committed; CI does not need pdfplumber.
"""
import argparse, collections, datetime, hashlib, json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'attestation')
BASE = 'https://tmbm.ssv.uz'
CACHE = os.environ.get('TMBM_CACHE', '/tmp/tmbm_cache')

# id, source path, Uzbek name (as on the site), file number prefix used for question ids
SPECS = [
    ('umumiy', '/uploads/category/files/78-umumij-stom-test-sajt-uzb-500.pdf', 'Umumiy stomatologiya'),
    ('terapevtik', '/uploads/category/files/79-terap-stom-test-sajt-uzb-584.pdf', 'Terapevtik stomatologiya'),
    ('ortopedik', '/uploads/category/files/80-ortoped-stom-test-sajt-uzb-520.pdf', 'Ortopedik stomatologiya'),
    ('xirurgik', '/uploads/category/files/81-hirurg-stom-test-sajt-uzb-492.pdf', 'Xirurgik stomatologiya (og‘iz bo‘shlig‘i)'),
    ('yuzjag', '/uploads/category/files/82-uz-zag-hir-test-sajt-uzb-473.pdf', 'Yuz-jag‘ xirurgiyasi'),
    ('bolalar', '/uploads/category/files/83-bolalar-stom-test-sajt-uzb-453.pdf', 'Bolalar stomatologiyasi'),
    ('bolalar-yuzjag', '/uploads/category/files/84-bol-uz-zag-hir-test-baza-uzb-463.pdf', 'Bolalar yuz-jag‘ xirurgiyasi'),
    ('bolalar-terapevtik', '/uploads/category/files/85-bol-ter-stom-test-sajt-uzb-486.pdf', 'Bolalar terapevtik stomatologiyasi'),
    ('bolalar-xirurgik', '/uploads/category/files/86-bol-hir-stom-test-sajt-uzb-462.pdf', 'Bolalar xirurgik stomatologiyasi'),
    ('ortodontiya', '/uploads/category/files/87-ortodontia-test-sajtga-uzb-499.pdf', 'Ortodontiya'),
    ('implantologiya', '/uploads/category/files/88-dental-impl-test-sajt-uzb-452.pdf', 'Dental implantologiya'),
    ('parodontologiya', '/uploads/category/files/89-paradontologia-test-sajt-uzb-386.pdf', 'Parodontologiya'),
]

# ---------------------------------------------------------------- download
def fetch(path, offline=False):
    os.makedirs(CACHE, exist_ok=True)
    dst = os.path.join(CACHE, os.path.basename(path))
    if not os.path.exists(dst) or os.path.getsize(dst) < 10000:
        if offline:
            sys.exit('not cached: ' + dst)
        for attempt in range(6):
            r = subprocess.run(['curl', '-sS', '-f', '-L', '-A', 'Mozilla/5.0', '-o', dst + '.part', BASE + path])
            if r.returncode == 0 and os.path.getsize(dst + '.part') > 10000:
                os.replace(dst + '.part', dst)
                break
            time.sleep(2 + attempt * 2)
        else:
            sys.exit('download failed: ' + path)
    h = hashlib.sha256(open(dst, 'rb').read()).hexdigest()
    return dst, h

# ---------------------------------------------------------------- text normalisation
APOS = "'’‘ʻʼ`´ʹˈ′"
LOOK = {  # Cyrillic letters that look like Latin ones -> the Latin letter
    'а': 'a', 'е': 'e', 'о': 'o', 'с': 'c', 'р': 'p', 'х': 'x', 'у': 'y', 'і': 'i', 'к': 'k',
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'І': 'I',
}
CYR = re.compile('[Ѐ-ӿ]')
LAT = re.compile('[A-Za-z]')
WORD = re.compile(r"[A-Za-zЀ-ӿ]+")
MONTHS = 'янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек'
EXCEL_DATE = re.compile(r'(^|\s)(\d{1,2}-(%s)\b|(%s)-\d{1,2}\b)' % (MONTHS, MONTHS), re.I)


def fix_homoglyphs(s, stats):
    def one(m):
        w = m.group(0)
        if CYR.search(w) and LAT.search(w):
            stats['homoglyph_words'] += 1
            return ''.join(LOOK.get(c, c) for c in w)
        return w
    s2 = WORD.sub(one, s)
    # a word of only look-alike Cyrillic letters sitting inside Latin text is rare enough to leave and flag
    return s2


def normalise(s, stats):
    s = s.replace('\u00a0', ' ').replace('\u200b', '').replace('\u00ad', '').replace('\ufeff', '')
    s = fix_homoglyphs(s, stats)
    # apostrophes: o'/g' (Uzbek o‘ g‘) -> U+2018 ; every other apostrophe (tutuq) -> U+2019
    s = re.sub("(?<=[oOgG])[%s]" % re.escape(APOS), chr(0), s)
    s = re.sub("[%s]" % re.escape(APOS), '\u2019', s).replace(chr(0), '\u2018')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# ---------------------------------------------------------------- PDF -> lines
def pdf_lines(path):
    import pdfplumber
    out = []
    with pdfplumber.open(path) as pdf:
        for pn, page in enumerate(pdf.pages):
            ls = page.extract_text_lines()
            main = []
            for l in ls:
                size = round(l['chars'][0]['size'])
                if size < 12 and main and l['top'] - main[-1]['top'] < 14 and main[-1].get('page') == pn:
                    # super/subscript (B1, B12, m2): merge into the line it belongs to, at its x position
                    prev = main[-1]
                    # position = after as many non-space characters as lie left of the small one
                    k = sum(1 for c in prev['chars'] if c['x0'] < l['x0'] - 0.5 and not c['text'].isspace())
                    txt, seen, idx = prev['text'], 0, 0
                    while idx < len(txt) and seen < k:
                        if not txt[idx].isspace():
                            seen += 1
                        idx += 1
                    if idx and txt[idx - 1:idx].isalnum() and txt[idx:idx + 1].isalnum():
                        prev['midword'] = True
                    prev['merged'] = True
                    prev['text'] = txt[:idx] + l['text'].strip() + txt[idx:]
                    continue
                txt = l['text']
                chs = l['chars']
                # width of the first word of the line (to decide whether the previous line could have held it)
                ns = [c for c in chs if not c['text'].isspace()]
                tok = txt.split()[0] if txt.split() else ''
                k = min(len(tok), len(ns))
                w = ns[k - 1]['x1'] - ns[0]['x0'] if k else 0.0
                main.append({'mcid': chs[0].get('mcid'), 'text': txt, 'x0': l['x0'], 'x1': l['x1'], 'top': l['top'], 'page': pn, 'chars': chs, 'w1': w})
            out.extend(main)
    return out

# ---------------------------------------------------------------- parse
QSTART = re.compile(r'^\s*(\d{1,4})\s*[.)](?:\s+|(?=[^\d\s]))(.*)$')
BULLET = re.compile(r'^[-–—•·]\s+')
TITLE = re.compile(r"mutaxassisligi|test savollari|ro.yxati", re.I)


def split_groups(lines, limit, warn):
    """lines: the lines of one question (stem + options). Returns (groups of text lines, method).
    1. Bulleted files ("- option"): the bullets mark the options; everything before the first bullet is the stem.
    2. Otherwise Word wrote the PDF tagged: lines with the same marked-content id on a page are one paragraph, which is
       certain evidence of a wrapped line. A different id is NOT proof of a new paragraph (a stem typed in two runs gets two
       ids), so when more than 5 groups (stem + 4 options) result, adjacent groups are merged at the joints where the previous
       line is full to the right margin (the next word could not have fitted), best-scoring joints first; page breaks are
       judged by the same fullness test. Such questions get the flag `layout-merge`."""
    texts = [l['text'].strip() for l in lines]
    if sum(1 for t in texts if BULLET.match(t)) >= 3:
        groups = [[]]
        for t in texts:
            if BULLET.match(t):
                groups.append([t])
            else:
                groups[-1].append(t)
        if not groups[0]:
            groups = groups[1:]
        return groups, 'bullets'
    groups = []   # each: list of line indices
    for i, l in enumerate(lines):
        if i:
            p = lines[i - 1]
            if l['page'] == p['page'] and l['mcid'] is not None and l['mcid'] == p['mcid']:
                groups[-1].append(i)
                continue
        groups.append([i])
    method = 'mcid'
    need = len(groups) - 5
    if need > 0:
        cands = []
        for gi in range(len(groups) - 1):
            a, b = lines[groups[gi][-1]], lines[groups[gi + 1][0]]
            slack = limit - (a['x1'] + b['w1'])
            if slack >= 3.0:
                continue  # the next word would have fitted: a real paragraph end
            ta, tb = a['text'].strip(), b['text'].strip()
            score = -slack
            if tb[:1].islower():
                score += 30
            if ta.endswith((':', '?')):
                score -= 15
            if gi == 0 and not ta.endswith((':', '?', '.')):
                score += 20
            cands.append((score, gi))
        cands.sort(reverse=True)
        merge = {gi for _, gi in cands[:need]}
        if merge:
            method = 'layout-merge'
            ng = []
            for gi, g in enumerate(groups):
                if gi - 1 in merge:
                    ng[-1].extend(g)
                else:
                    ng.append(list(g))
            groups = ng
    return [[texts[i] for i in g] for g in groups], method


def join_lines(parts):
    out = parts[0]
    for p in parts[1:]:
        out = out + ('' if out.endswith('-') and p[:1].islower() else ' ') + p
    return out


def parse_file(path, spec_id, stats):
    ls = pdf_lines(path)
    xs = sorted(l['x1'] for l in ls)
    limit = xs[int(len(xs) * 0.995)]
    blocks = []
    cur = None
    last = 0
    warns = []
    for l in ls:
        t = l['text']
        m = QSTART.match(t)
        if m:
            n = int(m.group(1))
            if n == last + 1 or (last < n <= last + 10 and cur is not None and len(cur['lines']) >= 5):
                if n != last + 1:
                    warns.append('numbering gap: %d -> %d' % (last, n))
                cur = {'n': n, 'lines': [dict(l, text=m.group(2))]}
                blocks.append(cur)
                last = n
                continue
            if cur is not None and n <= last and len(cur['lines']) >= 5:
                warns.append('number %d repeated after %d, kept as text of question %d' % (n, last, last))
        if cur is None:
            continue  # title lines before question 1
        if not t.strip():
            continue
        cur['lines'].append(l)
    qs = []
    for b in blocks:
        lines = [l for l in b['lines'] if l['text'].strip()]
        groups, how = split_groups(lines, limit, warns)
        texts = [normalise(join_lines(g), stats) for g in groups]
        nb = sum(1 for t in texts[1:] if BULLET.match(t))
        if nb and nb != len(texts) - 1:
            warns.append('q%d: only %d of %d options carry a bullet' % (b['n'], nb, len(texts) - 1))
        if nb:
            texts = [texts[0]] + [BULLET.sub('', t, count=1) for t in texts[1:]]
        stem, opts = texts[0], texts[1:]
        qs.append({'merged': any(l.get('merged') for l in lines), 'midword': any(l.get('midword') for l in lines), 'n': b['n'], 'stem': stem, 'opts': opts, 'how': how, 'lines': len(lines)})
    return qs, warns, limit

# ---------------------------------------------------------------- deterministic shuffle
def seed_of(s):
    return int.from_bytes(hashlib.sha256(s.encode()).digest()[:4], 'big')


def mulberry32(a):
    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return nxt


def shuffle_with_key(opts, qid):
    """Source order has the key first. Returns (shuffled options, index of the key)."""
    rnd = mulberry32(seed_of(qid))
    idx = list(range(len(opts)))
    for i in range(len(idx) - 1, 0, -1):
        j = int(rnd() * (i + 1))
        idx[i], idx[j] = idx[j], idx[i]
    return [opts[i] for i in idx], idx.index(0)

# ---------------------------------------------------------------- flags
ALLCORRECT = re.compile(r"(hamma|barcha|hammasi|bari)\b.*(javob|variant)?.*to.?g.?ri|to.?g.?ri javob yo.?q|^(hammasi|barchasi)\b", re.I)


def flags_for(stem, opts):
    f = []
    if len(opts) != 4:
        f.append('options=%d' % len(opts))
    if any(not o for o in opts):
        f.append('empty-option')
    if len(set(o.lower() for o in opts)) != len(opts):
        f.append('identical-options')
    txt = ' '.join([stem] + opts)
    if EXCEL_DATE.search(txt):
        f.append('excel-date')
    if CYR.search(txt):
        f.append('cyrillic')
    if any(len(w) > 34 for w in re.findall(r'\S+', txt)):
        f.append('glued-words')
    if len(stem) < 8:
        f.append('short-stem')
    return f

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--offline', action='store_true')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    today = datetime.date.today().isoformat()
    manifest = {'source': 'Tibbiyot va farmatsevtika xodimlarining malakasini baholash markazi (tmbm.ssv.uz), "TEST SINOVI SAVOLLARI"',
                'keyConvention': 'source option 1 is the key (not marked in the PDFs); options shuffled per question, seeded by question id',
                'generator': 'tools/tmbm_import.py', 'retrieved': today, 'specialties': []}
    total = 0
    for sid, path, name in SPECS:
        pdf, sha = fetch(path, a.offline)
        stats = collections.Counter()
        qs, warns, limit = parse_file(pdf, sid, stats)
        items = []
        seen = {}
        w = list(warns)
        for q in qs:
            qid = '%s-%04d' % (sid, q['n'])
            opts = q['opts']
            fl = flags_for(q['stem'], opts)
            if q['merged']:
                fl.append('script-merge')
            if q['midword']:
                fl.append('script-midword')
            if q['how'] == 'layout-merge':
                fl.append('layout-merge')
            key = (q['stem'].lower(), tuple(o.lower() for o in opts))
            if key in seen:
                fl.append('duplicate-of:' + seen[key])
            seen.setdefault(key, qid)
            if len(opts) < 2:
                w.append('%s: only %d options, dropped' % (qid, len(opts)))
                continue
            sh, k = shuffle_with_key(opts, qid)
            it = {'id': qid, 'n': q['n'], 'q': q['stem'], 'o': sh, 'k': k}
            if fl:
                it['flags'] = fl
            items.append(it)
        # same stem, different options is fine (the bank repeats stems); report only exact duplicates
        for it in items:
            if len(it['o']) != 4:
                w.append('%s: %d options' % (it['id'], len(it['o'])))
        doc = {'id': sid, 'name': name, 'count': len(items), 'questions': items}
        with open(os.path.join(a.out, sid + '.json'), 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
        opt_hist = collections.Counter(len(i['o']) for i in items)
        manifest['specialties'].append({
            'id': sid, 'name': name, 'url': BASE + path, 'sha256': sha, 'retrieved': today,
            'questions': len(items), 'optionCounts': {str(k): v for k, v in sorted(opt_hist.items())},
            'homoglyphWordsRepaired': stats['homoglyph_words'],
            'flagCounts': dict(collections.Counter(f.split(':')[0] for i in items for f in i.get('flags', []))),
            'warnings': w[:40] + (['… %d more' % (len(w) - 40)] if len(w) > 40 else [])})
        total += len(items)
        print('%-20s %4d questions  opts=%s  flags=%s  warn=%d' % (sid, len(items), dict(opt_hist),
              manifest['specialties'][-1]['flagCounts'], len(w)))
    manifest['total'] = total
    with open(os.path.join(a.out, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print('total', total)


if __name__ == '__main__':
    main()
