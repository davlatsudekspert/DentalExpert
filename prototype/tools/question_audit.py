"""Audit every test question bank the app scores answers against.

  python3 tools/question_audit.py            report; exit 1 on hard errors
  python3 tools/question_audit.py --quiet    print only hard errors and the summary line
  python3 tools/question_audit.py --dump F   also write every question (all languages, key marked) to F as JSON lines

Banks:
  topic   curriculum/src/<topic>.json test[]            self-study topic tests, exam, teacher group / QR quick tests
          + the generated copies: src/curriculum/topics/<topic>.json (questions, no answers) and
            functions/_lib/curriculumKeys.ts (answers + explanations served by /api/curriculum/key and the classroom API)
  deck    decks/drafts/<deck>[.ru|.en].json quiz[]      mini-lesson quizzes (exam "mix" and classroom deck quizzes)
          + the served copies public/decks/manifest.<lang>.json
  daily   src/dailyData.ts RAW                          the daily quiz (needs node to read the TS literal)

Hard errors (exit 1): missing stem/options/explanation, fewer than 2 options, key not a valid in-range index, empty or
duplicate options, the same question twice, languages that disagree on option count / key / "all-none of the above"
position, generated or served copies that differ from the source, script leaks (Cyrillic in uz/en, no Cyrillic in ru),
Uzbek o‘/g‘ written with a wrong apostrophe, more than GIVEAWAY_MAX_SHARE of a subject's questions whose key is the
conspicuously longest option (see giveaway()).
Warnings (reported, never fail): skewed key positions per subject,
Latin words inside Russian text, text left identical across languages, "all/none of the above" options.
"""
import json, re, subprocess, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ('uz', 'ru', 'en')
CYR = re.compile('[А-Яа-яЁё]')
LAT = re.compile('[A-Za-z]')
# "all / none of the above" — only when that is the whole option (a sentence that merely contains "hammasi" is fine)
ALL_ABOVE = re.compile(r"^(all|all of (the above|these|them)|both|все|всё|все (вышеперечисленные|вышеперечисленное|перечисленные|перечисленное|ответы верны)|"
                       r"всё (вышеперечисленное|перечисленное)|barchasi|hammasi|(yuqoridagi|yuqoridagilarning) (barchasi|hammasi)|barcha javoblar to‘g‘ri)$", re.I)
NONE_ABOVE = re.compile(r"^(none|none of (the above|these|them)|neither|никакие|никакой|ни одного|ни один|ничего|ничего из (вышеперечисленного|перечисленного)|"
                        r"ни одно из (вышеперечисленного|перечисленного)|hech biri|hech qaysi(si)?|bitta ham yo‘q|hech narsa)$", re.I)
# Latin tokens that are fine inside Russian text: abbreviations, units, taxonomy, chemistry, numbering systems.
RU_LATIN_OK = re.compile(r"^(?:[A-Z0-9]{1,6}(?:[-/][A-Z0-9]{1,6})*s?|[a-z]{1,3}|pH|mm|ml|mg|Gy|mSv|μSv|kVp|mA|Hz|MPa|ppm|Ca|Na|Ni|Ti|Zr|Cr|Co|Mo|"
                        r"Streptococcus|mutans|Lactobacillus|Actinomyces|Porphyromonas|gingivalis|Aggregatibacter|actinomycetemcomitans|"
                        r"Tannerella|forsythia|Treponema|denticola|Prevotella|intermedia|Candida|albicans|Enterococcus|faecalis|Fusobacterium|"
                        r"Staphylococcus|aureus|Herpes|simplex|zoster|HPV|HIV|Black|Angle|Miller|Glickman|Kennedy|Cvek|Ellis|Andreasen|Le|Fort|"
                        r"Hounsfield|Ni-Ti|NiTi|ProTaper|Reciproc|WaveOne|K-file|H-file|Hedström|Hedstrom|Mount|Hume|Hellman|Frankfort|Bolton|Tweed|Steiner|"
                        r"Ricketts|Downs|McNamara|Wits|Nance|Hawley|Essix|Herbst|Twin|Block|MTA|Biodentine|ICDAS|DMFT|DMFS|dmft|CPITN|BPE|PSR|OHI-S|"
                        r"PI|GI|BOP|CAL|PPD|Er|YAG|Nd|CO2|CAD|CAM|CBCT|OPG|TMJ|TMD|BRONJ|MRONJ|ASA|INR|BMI|ISO|FDI|WHO|ADA|AAP|EFP|AAE|ESE|"
                        r"Ante|Pell|Gregory|Winter|Vazirani|Akinosi|Gow-Gates|Spix|Bennett|Christensen|Bonwill|Spee|Wilson|Monson|Balkwill|"
                        r"Sharpey|Tomes|Retzius|Hunter|Schreger|Korff|Weil|Raschkow|Hertwig|Malassez|Serres|Nasmyth|Owen|von|Ebner|Fordyce|Koplik|"
                        r"Stafne|Gorlin|Goltz|Albright|Paget|Sjögren|Behçet|Stevens|Johnson|Crohn|Addison|Peutz|Jeghers|Ludwig|Vincent|Bell|"
                        r"Frey|Eagle|Kaposi|Burkitt|Hodgkin|Langerhans|Nikolsky|Wickham|Tzanck|Ziehl|Neelsen|Gram|Snyder|Fones|Bass|Stillman|Charters|"
                        r"Leonard|Modified|in|situ|vitro|vivo|et|al|per|se|Cl|F|OH|PO4|SnF2|NaF|APF|CPP-ACP|xylitol|Ca\(OH\)2)$")
CHEM = re.compile(r"^(?:[A-Z][a-z]?\d*){1,4}$")   # Ag3Sn, Cu6Sn5, HbA1c-like formulas and single capitals
# English/Latin terms that Russian dental texts normally keep in Latin script
RU_TERMS = {'bitewing', 'lamina', 'dura', 'step', 'back', 'crown', 'down', 'downpack', 'tug', 'stepwise', 'walking', 'bleach',
            'phase', 'out', 'cone', 'cut', 'bulk', 'fill', 'bis', 'gma', 'universal', 'linea', 'alba', 'hba1c', 'pka',
            'sanguinis', 'nucleatum', 'mitis', 'lactobacillus', 'mutans', 'gingivalis', 'faecalis', 'niti', 'dsd', 'isq', 'alara'}
UZ_BAD_OKINA = re.compile(r"[oOgG][’'`ʻʼ´]")      # o‘ / g‘ must use U+2018 ‘ (the repo's convention)
UZ_STRAY_OKINA = re.compile(r"(?<![oOgG])‘")       # ‘ only after o / g; the tutuq belgisi is U+2019 ’
UZ_ASCII_APOS = re.compile(r"[A-Za-z]['`ʻʼ´][A-Za-z]")

errors, warnings = [], []
def err(where, msg): errors.append(f'{where}: {msg}')
def warn(kind, where, msg): warnings.append((kind, f'{where}: {msg}'))
def bare(s): return re.sub(r'\s+', ' ', str(s).lower()).strip(' .!')
def norm(s): return re.sub(r'[\s\.\,\;\:\!\?\(\)«»"“”„‘’\'`-]+', ' ', str(s).lower()).strip()


# ---------- loading ----------
def topic_bank():
    """[(qid, subject, {lang: {q, options, correct, explain}})] from curriculum/src."""
    out = []
    for f in sorted((ROOT / 'curriculum/src').glob('*.json')):
        t = json.loads(f.read_text())
        for i, q in enumerate(t.get('test') or []):
            per = {}
            for lang in LANGS:
                g = lambda v: v.get(lang) if isinstance(v, dict) else None
                per[lang] = {'q': g(q.get('q') or {}), 'options': [g(o) for o in q.get('options') or []],
                             'correct': q.get('correct'), 'explain': g(q.get('explain') or {})}
            out.append((f'{t["id"]}#{i + 1}', t.get('subject', '?'), per))
    return out


def deck_bank():
    drafts = defaultdict(dict)
    for f in sorted((ROOT / 'decks/drafts').glob('*.json')):
        parts = f.name[:-5].split('.')
        drafts[parts[0]][parts[1] if len(parts) == 2 else 'uz'] = json.loads(f.read_text())
    out = []
    for deck, by in sorted(drafts.items()):
        for lang in LANGS:
            if lang not in by:
                err(f'deck {deck}', f'{lang} draft missing')
        n = max(len(d.get('quiz') or []) for d in by.values())
        for i in range(n):
            per = {}
            for lang in LANGS:
                qs = (by.get(lang) or {}).get('quiz') or []
                if i >= len(qs):
                    err(f'deck {deck}#{i + 1}', f'{lang} has no question {i + 1}')
                    continue
                q = qs[i]
                per[lang] = {'q': q.get('q'), 'options': list(q.get('options') or []), 'correct': q.get('correct'), 'explain': q.get('explanation')}
            out.append((f'{deck}#{i + 1}', 'deck', per))
    return out, drafts


def daily_bank():
    src = (ROOT / 'src/dailyData.ts').read_text()
    m = re.search(r'const RAW:Raw\[\]=(\[.*?\n\]);', src, re.S)
    if not m:
        err('daily', 'RAW array not found in src/dailyData.ts')
        return []
    try:
        raw = json.loads(subprocess.run(['node', '-e', f'process.stdout.write(JSON.stringify({m.group(1)}))'],
                                        capture_output=True, text=True, check=True).stdout)
    except (OSError, subprocess.CalledProcessError, ValueError) as e:
        warn('skipped', 'daily', f'could not evaluate RAW with node ({e}); daily bank not audited')
        return []
    out = []
    for i, r in enumerate(raw):
        per = {lang: {'q': (r.get('q') or {}).get(lang), 'options': list((r.get('o') or {}).get(lang) or []),
                      'correct': r.get('c'), 'explain': (r.get('e') or {}).get(lang)} for lang in LANGS}
        out.append((f'daily#{i + 1}', 'daily', per))
    return out


# ---------- per-question checks ----------
def check_text(where, lang, s):
    if not isinstance(s, str) or not s.strip():
        return err(where, f'{lang} empty')
    if lang == 'uz':
        if CYR.search(s):
            err(where, f'uz contains Cyrillic: {s!r}')
        for rx, what in ((UZ_BAD_OKINA, 'o‘/g‘ must be written with ‘ (U+2018)'), (UZ_STRAY_OKINA, '‘ (U+2018) outside o‘/g‘ — tutuq belgisi is ’ (U+2019)'),
                         (UZ_ASCII_APOS, 'ASCII/other apostrophe inside a word')):
            mm = rx.search(s)
            if mm:
                err(where, f'uz {what}: …{s[max(0, mm.start() - 12):mm.end() + 12]}…')
    elif lang == 'en':
        if CYR.search(s):
            err(where, f'en contains Cyrillic: {s!r}')
        if re.search(r"[oOgG]‘", s):
            err(where, f'en contains Uzbek o‘/g‘: {s!r}')
    elif lang == 'ru':
        if LAT.search(s) and not CYR.search(s) and len(s) > 12:
            err(where, f'ru has no Cyrillic: {s!r}')
        bad = [w for w in re.findall(r"[A-Za-z][A-Za-z0-9]*", s) if not RU_LATIN_OK.match(w) and not CHEM.match(w) and w.lower() not in RU_TERMS]
        if bad:
            warn('ru-latin', where, f'Latin words in ru: {bad} in {s!r}')


def check_question(qid, per):
    counts = {lang: len(per[lang]['options']) for lang in per}
    keys = {lang: per[lang]['correct'] for lang in per}
    if len(set(counts.values())) > 1:
        err(qid, f'option count differs across languages {counts}')
    if len(set(map(repr, keys.values()))) > 1:
        err(qid, f'correct index differs across languages {keys}')
    marks = {}
    for lang, d in per.items():
        w = f'{qid} [{lang}]'
        check_text(w + ' stem', lang, d['q'])
        check_text(w + ' explanation', lang, d['explain'])
        opts = d['options']
        if len(opts) < 2:
            err(w, f'only {len(opts)} options')
        for j, o in enumerate(opts):
            check_text(f'{w} option {j + 1}', lang, o)
        c = d['correct']
        if not isinstance(c, int) or isinstance(c, bool) or not 0 <= c < len(opts):
            err(w, f'correct={c!r} is not an index into {len(opts)} options')
        ns = [norm(o) for o in opts if isinstance(o, str)]
        dup = [o for o, k in Counter(ns).items() if k > 1 and o]
        if dup:
            err(w, f'duplicate options {dup}')
        if isinstance(d['q'], str) and any(n and n == norm(d['q']) for n in ns):
            err(w, 'an option repeats the stem')
        marks[lang] = tuple(j for j, o in enumerate(opts) if isinstance(o, str) and (ALL_ABOVE.match(bare(o)) or NONE_ABOVE.match(bare(o))))
        if marks[lang]:
            warn('all-none', w, f'"all/none of the above" option at {[j + 1 for j in marks[lang]]} (key {c + 1 if isinstance(c, int) else c}): {[opts[j] for j in marks[lang]]}')
            if any(j != len(opts) - 1 for j in marks[lang]):
                err(w, '"all/none of the above" is not the last option')
    if len(set(marks.values())) > 1:
        err(qid, f'"all/none of the above" position differs across languages {marks}')
    # untranslated text (identical in two languages, longer than a term/number)
    for field in ('q', 'explain'):
        vals = {lang: per[lang][field] for lang in per if isinstance(per[lang][field], str)}
        for a, b in (('uz', 'en'), ('ru', 'en'), ('uz', 'ru')):
            if a in vals and b in vals and vals[a] == vals[b] and len(vals[a]) > 15 and LAT.search(vals[a]):
                err(f'{qid} {field}', f'{a} and {b} are identical (untranslated): {vals[a]!r}')


GIVEAWAY_MAX_SHARE = 0.15   # hard error above this share per subject/bank (12 of 80 topic questions, 4 of 30 deck, 3 of 20 daily)


def giveaway(per):
    """The key is the longest option and ≥1.5× the longest distractor (en/uz/ru checked separately)."""
    hits = []
    for lang, d in per.items():
        opts, c = d['options'], d['correct']
        if not isinstance(c, int) or not 0 <= c < len(opts) or len(opts) < 2:
            continue
        ln = [len(o or '') for o in opts]
        other = max(x for j, x in enumerate(ln) if j != c)
        if ln[c] >= 1.5 * other and ln[c] - other >= 12:
            hits.append(lang)
    return hits


# ---------- cross-copy checks ----------
def check_generated_topics():
    src = {f.stem: json.loads(f.read_text()) for f in (ROOT / 'curriculum/src').glob('*.json')}
    keys_ts = (ROOT / 'functions/_lib/curriculumKeys.ts').read_text()
    m = re.search(r'CURRICULUM_KEYS:[^=]+=(\{.*\});\s*$', keys_ts, re.S)
    if not m:
        return err('curriculumKeys.ts', 'CURRICULUM_KEYS literal not found')
    keys = json.loads(m.group(1))
    pub_dir = ROOT / 'src/curriculum/topics'
    pubs = {f.stem: json.loads(f.read_text()) for f in pub_dir.glob('*.json')}
    for tid in sorted(set(src) | set(keys) | set(pubs)):
        if tid not in src:
            err(f'{tid}', 'generated key/topic file has no source (run tools/curriculum.py build)')
            continue
        t = src[tid]['test']
        k = keys.get(tid)
        if k is None:
            err(tid, 'no answer key in functions/_lib/curriculumKeys.ts (run tools/curriculum.py build)')
        else:
            if k.get('c') != [q['correct'] for q in t]:
                err(tid, f'answer key in curriculumKeys.ts {k.get("c")} differs from source {[q["correct"] for q in t]}')
            if k.get('e') != [q['explain'] for q in t]:
                err(tid, 'explanations in curriculumKeys.ts differ from source (run tools/curriculum.py build)')
        p = pubs.get(tid)
        if p is None:
            err(tid, 'no src/curriculum/topics file (run tools/curriculum.py build)')
        else:
            if [{'q': q['q'], 'options': q['options']} for q in t] != p.get('test'):
                err(tid, 'questions in src/curriculum/topics differ from source (run tools/curriculum.py build)')
            if any(set(q) - {'q', 'options'} for q in p.get('test') or []):
                err(tid, 'shipped topic file leaks answers')
    idx = json.loads((ROOT / 'src/curriculum/index.json').read_text())
    for tp in idx['topics']:
        if tp['id'] in src and tp['tests'] != len(src[tp['id']]['test']):
            err(tp['id'], 'index.json test count is stale')


def check_served_decks(drafts):
    for lang in LANGS:
        f = ROOT / f'public/decks/manifest.{lang}.json'
        if not f.exists():
            err('decks', f'{f.name} missing')
            continue
        served = {d['id']: d for d in json.loads(f.read_text())}
        for deck, by in drafts.items():
            dq, sq = (by.get(lang) or {}).get('quiz'), (served.get(deck) or {}).get('quiz')
            if sq is None:
                err(f'deck {deck}', f'not in {f.name}')
            elif dq != sq:
                err(f'deck {deck}', f'quiz in {f.name} differs from decks/drafts (run tools/decks.py build)')


# ---------- main ----------
def main():
    quiet = '--quiet' in sys.argv
    dump = sys.argv[sys.argv.index('--dump') + 1] if '--dump' in sys.argv else None
    topics = topic_bank()
    decks, drafts = deck_bank()
    daily = daily_bank()
    banks = {'topic': topics, 'deck': decks, 'daily': daily}
    for items in banks.values():
        for qid, _, per in items:
            check_question(qid, per)
    check_generated_topics()
    check_served_decks(drafts)

    # duplicates: the exam mixes topic + deck questions, so they share one namespace; daily is its own quiz
    for name, items in (('topic+deck', topics + decks), ('daily', daily)):
        for lang in LANGS:
            seen = {}
            for qid, _, per in items:
                d = per[lang]
                k = norm(d['q'])
                if not k:
                    continue
                full = (k, tuple(sorted(norm(o) for o in d['options'])))
                if full in seen:
                    err(qid, f'[{lang}] duplicate of {seen[full]} (same stem and options)')
                elif k in {s[0] for s in seen}:
                    other = next(v for s, v in seen.items() if s[0] == k)
                    warn('same-stem', qid, f'[{lang}] same stem as {other} with different options')
                seen.setdefault(full, qid)

    # key position distribution
    dist = defaultdict(Counter)
    give = Counter()
    give_total = Counter()
    for bank, items in banks.items():
        for qid, subj, per in items:
            c = per['uz']['correct']
            n = len(per['uz']['options'])
            dist[(subj, n)][c] += 1
            h = giveaway(per)
            give_total[subj] += 1
            if h:
                give[subj] += 1
    total = sum(len(v) for v in banks.values())
    print(f'Questions: {total}  (topic {len(topics)}, deck {len(decks)}, daily {len(daily)}) × {len(LANGS)} languages')
    print('\nKey position per subject (A B C D …), and questions whose key is the conspicuously longest option:')
    for (subj, n), cnt in sorted(dist.items()):
        tot = sum(cnt.values())
        row = ' '.join(f'{cnt[j]:3d}' for j in range(n))
        share = max(cnt.values()) / tot
        flag = '  SKEWED' if tot >= 20 and (share > 1.6 / n or min(cnt[j] for j in range(n)) < 0.4 * tot / n) else ''
        if flag:
            warn('skew', subj, f'key positions {dict(sorted(cnt.items()))} of {tot}')
        print(f'  {subj:8s} {n} opts  n={tot:4d}  {row}{flag}   longest-key giveaway: {give[subj]}/{give_total[subj]}')
    # regression guard: the "pick the conspicuously longest option" strategy must not pay off in any bank
    for subj in sorted(give_total):
        limit = int(GIVEAWAY_MAX_SHARE * give_total[subj])
        if give[subj] > limit:
            err(subj, f'{give[subj]}/{give_total[subj]} questions have the key as the conspicuously longest option '
                      f'(limit {limit}); lengthen the distractors or tighten the key (see giveaway())')

    kinds = Counter(k for k, _ in warnings)
    if not quiet:
        for kind in ('skipped', 'skew', 'all-none', 'same-stem', 'ru-latin'):
            items = [w for k, w in warnings if k == kind]
            if items:
                print(f'\nWarnings: {kind} ({len(items)})')
                for w in items[:40]:
                    print('  ' + w)
                if len(items) > 40:
                    print(f'  … {len(items) - 40} more')
    if errors:
        print(f'\nHARD ERRORS ({len(errors)}):')
        for e in errors:
            print('  ' + e)
    if dump:
        with open(dump, 'w') as fh:
            for bank, items in banks.items():
                for qid, subj, per in items:
                    fh.write(json.dumps({'id': qid, 'bank': bank, 'subject': subj, **per}, ensure_ascii=False) + '\n')
    print(f'\n{"FAIL" if errors else "ok"}: {total} questions, {len(errors)} hard errors, {len(warnings)} warnings {dict(kinds)}')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
