"""Curriculum: validate topic sources and build the app/server files.

  python3 tools/curriculum.py check [ids...]   validate curriculum/src/*.json (or the given topic ids)
  python3 tools/curriculum.py build            validate everything, then write
      src/curriculum/index.json         subjects + topic list (what the plan screens need)
      src/curriculum/topics/<id>.json   one topic: slides, goals, oral questions, test questions WITHOUT answers
      functions/_lib/curriculumKeys.ts  test answers and explanations (server only; sent to a student after they submit)

Source format (curriculum/src/<subject>-NN.json). Every text is {"en": "...", "ru": "...", "uz": "..."} ("L" below).
  id, subject, n (1..), week (1..), type: lecture|practical, hours (1..6), title L, goals [L] (2-4),
  links [deck ids or "atlas" | "odontogram"], sources [plain strings, real textbooks/guidelines],
  slides [slide] (7-12; first is "title", last is "summary"; at least 3 diagram slides),
  oral [{q: L, plan: [L] (2-5)}] (3-6),
  test [{q: L, options: [L] x4, correct: 0-3, explain: L}] (8-12)
Slide layouts (each may also carry note: L, a teacher's speaking note):
  title    {title L, subtitle L}
  bullets  {title L, bullets [L] 2-5}
  key      {title L, term L, definition L}
  flow     {title L, steps [{label L, detail? L}] 3-6}          process chain with arrows
  cycle    {title L, center? L, steps [{label L}] 3-6}         circular process
  tree     {title L, root L, children [{label L, items? [L] <=4}] 2-5}   classification
  compare  {title L, columns [{head L, items [L] 2-5}] 2-3}
  table    {title L, head [L] 2-4, rows [[L]] 2-6}             every row as long as head
  timeline {title L, events [{when L, label L}] 3-7}
  figure   {title L, image IMG, callouts [{at ANCHOR, label L}] 1-6, bullets? [L] <=3}
  summary  {title L, bullets [L] 2-5}
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'curriculum' / 'src'
LANGS = ('en', 'ru', 'uz')
DIAGRAMS = {'flow', 'cycle', 'tree', 'compare', 'table', 'timeline', 'figure'}
LAYOUTS = DIAGRAMS | {'title', 'bullets', 'key', 'summary'}
# Picture anchors (percent of the square image) — mirrored in src/Slides.tsx.
ANCHORS = {
    'cutaway': {'crown', 'enamel', 'dentin', 'pulp', 'canal', 'root', 'cej', 'apex'},
    'front': {'crown', 'cusp', 'cej', 'root', 'furcation', 'apex'},
    'occlusal': {'cusp', 'fissure', 'fossa', 'ridge'},
}
LINKS = {'atlas', 'odontogram', 'caries-basics', 'oral-hygiene', 'periodontium', 'tooth-layers', 'tooth-surfaces', 'tooth-types-fdi'}
MAX = {'title': 80, 'label': 60, 'bullet': 150, 'text': 400}


def subjects():
    return json.loads((ROOT / 'curriculum' / 'subjects.json').read_text())['subjects']


class Check:
    def __init__(self, name):
        self.name, self.errs = name, []

    def err(self, where, msg):
        self.errs.append(f'{self.name}: {where}: {msg}')

    def L(self, v, where, limit='text'):
        if not isinstance(v, dict) or set(v) != set(LANGS):
            return self.err(where, f'needs exactly {LANGS}')
        for k in LANGS:
            s = v[k]
            if not isinstance(s, str) or not s.strip():
                self.err(where, f'{k} empty')
            elif len(s) > MAX[limit]:
                self.err(where, f'{k} longer than {MAX[limit]} ({len(s)})')
            elif s != s.strip() or '  ' in s:
                self.err(where, f'{k} has extra spaces')
        uz = v.get('uz', '')
        if isinstance(uz, str) and re.search(r"['`ʻ]", uz):
            self.err(where, 'uz: write o‘ g‘ with U+2018 (‘) and the tutuq belgisi with U+2019 (’)')
        if isinstance(v.get('ru'), str) and not re.search('[а-яА-ЯёЁ]', v['ru']) and len(v['ru']) > 12:
            self.err(where, 'ru has no Cyrillic')

    def Ls(self, v, where, lo, hi, limit='bullet'):
        if not isinstance(v, list) or not lo <= len(v) <= hi:
            return self.err(where, f'needs {lo}-{hi} items')
        for i, x in enumerate(v):
            self.L(x, f'{where}[{i}]', limit)


def check_slide(c, s, w):
    lay = s.get('layout')
    if lay not in LAYOUTS:
        return c.err(w, f'unknown layout {lay}')
    c.L(s.get('title'), w + '.title', 'title')
    if 'note' in s:
        c.L(s['note'], w + '.note')
    if lay == 'title':
        c.L(s.get('subtitle'), w + '.subtitle', 'bullet')
    elif lay in ('bullets', 'summary'):
        c.Ls(s.get('bullets'), w + '.bullets', 2, 5)
    elif lay == 'key':
        c.L(s.get('term'), w + '.term', 'label')
        c.L(s.get('definition'), w + '.definition')
    elif lay in ('flow', 'cycle'):
        st = s.get('steps')
        if not isinstance(st, list) or not 3 <= len(st) <= 6:
            return c.err(w, 'steps 3-6')
        for i, x in enumerate(st):
            c.L(x.get('label'), f'{w}.steps[{i}].label', 'label')
            if 'detail' in x:
                if lay == 'cycle':
                    c.err(w, 'cycle steps have no detail')
                c.L(x['detail'], f'{w}.steps[{i}].detail', 'bullet')
        if lay == 'cycle' and 'center' in s:
            c.L(s['center'], w + '.center', 'label')
    elif lay == 'tree':
        c.L(s.get('root'), w + '.root', 'label')
        ch = s.get('children')
        if not isinstance(ch, list) or not 2 <= len(ch) <= 5:
            return c.err(w, 'children 2-5')
        for i, x in enumerate(ch):
            c.L(x.get('label'), f'{w}.children[{i}].label', 'label')
            if 'items' in x:
                c.Ls(x['items'], f'{w}.children[{i}].items', 1, 4, 'label')
    elif lay == 'compare':
        co = s.get('columns')
        if not isinstance(co, list) or not 2 <= len(co) <= 3:
            return c.err(w, 'columns 2-3')
        for i, x in enumerate(co):
            c.L(x.get('head'), f'{w}.columns[{i}].head', 'label')
            c.Ls(x.get('items'), f'{w}.columns[{i}].items', 2, 5)
    elif lay == 'table':
        head = s.get('head')
        c.Ls(head, w + '.head', 2, 4, 'label')
        rows = s.get('rows')
        if not isinstance(rows, list) or not 2 <= len(rows) <= 6:
            return c.err(w, 'rows 2-6')
        for i, r in enumerate(rows):
            if not isinstance(r, list) or not isinstance(head, list) or len(r) != len(head):
                c.err(f'{w}.rows[{i}]', 'row length must equal head')
                continue
            for j, x in enumerate(r):
                c.L(x, f'{w}.rows[{i}][{j}]', 'bullet')
    elif lay == 'timeline':
        ev = s.get('events')
        if not isinstance(ev, list) or not 3 <= len(ev) <= 7:
            return c.err(w, 'events 3-7')
        for i, x in enumerate(ev):
            c.L(x.get('when'), f'{w}.events[{i}].when', 'label')
            c.L(x.get('label'), f'{w}.events[{i}].label', 'bullet')
    elif lay == 'figure':
        img = s.get('image')
        if img not in ANCHORS:
            return c.err(w, f'image must be one of {sorted(ANCHORS)}')
        cl = s.get('callouts')
        if not isinstance(cl, list) or not 1 <= len(cl) <= 6:
            return c.err(w, 'callouts 1-6')
        for i, x in enumerate(cl):
            if x.get('at') not in ANCHORS[img]:
                c.err(f'{w}.callouts[{i}]', f'anchor must be one of {sorted(ANCHORS[img])}')
            c.L(x.get('label'), f'{w}.callouts[{i}].label', 'label')
        if 'bullets' in s:
            c.Ls(s['bullets'], w + '.bullets', 1, 3)
    extra = set(s) - {'layout', 'title', 'note', 'subtitle', 'bullets', 'term', 'definition', 'steps', 'center', 'root',
                      'children', 'columns', 'head', 'rows', 'events', 'image', 'callouts'}
    if extra:
        c.err(w, f'unknown keys {sorted(extra)}')


def check_topic(path, subj_ids):
    c = Check(path.name)
    try:
        t = json.loads(path.read_text())
    except Exception as e:  # noqa: BLE001
        c.err('file', f'bad JSON: {e}')
        return c.errs, None
    if t.get('id') != path.stem:
        c.err('id', 'must equal file name')
    if t.get('subject') not in subj_ids or not str(t.get('id', '')).startswith(f"{t.get('subject')}-"):
        c.err('subject', 'unknown subject or id prefix mismatch')
    for k, lo, hi in (('n', 1, 40), ('week', 1, 20), ('hours', 1, 6)):
        if not isinstance(t.get(k), int) or not lo <= t[k] <= hi:
            c.err(k, f'int {lo}-{hi}')
    if t.get('type') not in ('lecture', 'practical'):
        c.err('type', 'lecture|practical')
    c.L(t.get('title'), 'title', 'title')
    c.Ls(t.get('goals'), 'goals', 2, 4)
    if not isinstance(t.get('links'), list) or any(x not in LINKS for x in t['links']):
        c.err('links', f'only {sorted(LINKS)}')
    if not isinstance(t.get('sources'), list) or not 1 <= len(t['sources']) <= 5 or not all(isinstance(x, str) and 10 < len(x) < 200 for x in t['sources']):
        c.err('sources', '1-5 strings')
    sl = t.get('slides')
    if not isinstance(sl, list) or not 7 <= len(sl) <= 12:
        c.err('slides', '7-12 slides')
    else:
        for i, s in enumerate(sl):
            check_slide(c, s, f'slides[{i}]')
        if sl[0].get('layout') != 'title' or sl[-1].get('layout') != 'summary':
            c.err('slides', 'first must be title, last summary')
        if sum(s.get('layout') in DIAGRAMS for s in sl) < 3:
            c.err('slides', 'at least 3 diagram slides')
    oral = t.get('oral')
    if not isinstance(oral, list) or not 3 <= len(oral) <= 6:
        c.err('oral', '3-6 questions')
    else:
        for i, q in enumerate(oral):
            c.L(q.get('q'), f'oral[{i}].q', 'bullet')
            c.Ls(q.get('plan'), f'oral[{i}].plan', 2, 5)
    test = t.get('test')
    if not isinstance(test, list) or not 8 <= len(test) <= 12:
        c.err('test', '8-12 questions')
    else:
        for i, q in enumerate(test):
            c.L(q.get('q'), f'test[{i}].q', 'text')
            c.Ls(q.get('options'), f'test[{i}].options', 4, 4)
            if q.get('correct') not in (0, 1, 2, 3):
                c.err(f'test[{i}].correct', '0-3')
            c.L(q.get('explain'), f'test[{i}].explain')
            if isinstance(q.get('options'), list) and len(q['options']) == 4:
                for lang in LANGS:
                    opts = [o.get(lang) for o in q['options'] if isinstance(o, dict)]
                    if len(set(opts)) != len(opts):
                        c.err(f'test[{i}].options', f'{lang} duplicates')
        cs = [q.get('correct') for q in test]
        if len(set(cs)) < 3:
            c.err('test', 'correct answers should be spread over at least 3 positions')
    return c.errs, t


def load(ids=None):
    subj_ids = {s['id'] for s in subjects()}
    files = sorted(SRC.glob('*.json'))
    if ids:
        files = [SRC / f'{i}.json' for i in ids]
    errs, topics = [], []
    for f in files:
        e, t = check_topic(f, subj_ids)
        errs += e
        if t and not e:
            topics.append(t)
    seen = {}
    for t in topics:
        k = (t['subject'], t['n'])
        if k in seen:
            errs.append(f"{t['id']}: n duplicates {seen[k]}")
        seen[k] = t['id']
    return errs, topics


def build():
    errs, topics = load()
    if errs:
        print('\n'.join(errs))
        sys.exit(1)
    out = ROOT / 'src' / 'curriculum'
    (out / 'topics').mkdir(parents=True, exist_ok=True)
    for old in (out / 'topics').glob('*.json'):
        old.unlink()
    keys = {}
    for t in topics:
        pub = dict(t)
        pub['test'] = [{'q': q['q'], 'options': q['options']} for q in t['test']]
        (out / 'topics' / f"{t['id']}.json").write_text(json.dumps(pub, ensure_ascii=False, separators=(',', ':')))
        keys[t['id']] = {'c': [q['correct'] for q in t['test']], 'e': [q['explain'] for q in t['test']]}
    index = {
        'subjects': subjects(),
        'topics': [{'id': t['id'], 'subject': t['subject'], 'n': t['n'], 'week': t['week'], 'type': t['type'], 'hours': t['hours'],
                    'title': t['title'], 'tests': len(t['test'])}
                   for t in sorted(topics, key=lambda t: (t['subject'], t['n']))],
    }
    (out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')))
    ts = ('// Generated by tools/curriculum.py build — do not edit. Topic test answers stay on the server.\n'
          'type L={en:string;ru:string;uz:string};\n'
          f'export const CURRICULUM_KEYS:Record<string,{{c:number[];e:L[]}}>={json.dumps(keys, ensure_ascii=False, separators=(",", ":"))};\n')
    (ROOT / 'functions' / '_lib' / 'curriculumKeys.ts').write_text(ts)
    print(f'built {len(topics)} topics')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'build':
        build()
    else:
        errs, topics = load(sys.argv[2:] or None)
        print('\n'.join(errs) if errs else f'ok: {len(topics)} topics')
        sys.exit(1 if errs else 0)
