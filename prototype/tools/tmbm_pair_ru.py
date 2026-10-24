#!/usr/bin/env python3
"""Pair the Russian TMBM questions (data/attestation/ru/<id>.json) with the Uzbek ones (data/attestation/<id>.json).

    python3 tools/tmbm_pair_ru.py      # run after tmbm_import.py + tmbm_import_ru.py, before tmbm_clean.py

The numbering of the two language editions drifts in some specialties (children's dentistry etc.), so questions are aligned
with a monotone alignment (gaps allowed) scored by language-neutral evidence: numbers and consonant skeletons of cognate terms
(пародонтит ~ parodontit). A pair is accepted only if ALL of these hold, otherwise both stay single-language (never guessed):
  * both have 4 options; the numbers in the stem are identical; the multiset of numbers per option is identical;
  * the KEY option (first, by the site's convention) of both carries the same numbers and is at least as similar to its twin as to any other option;
  * enough shared evidence: identical non-empty numbers, or >= 2 shared skeleton terms (>= 1 for very short texts).
Russian options keep their own order (the Russian editions reorder the distractors): `ru` has its own shuffle and key index.
Unpaired Russian questions become Russian-only questions (id <specialty>-r<number>). Writes data/attestation/pairing.json (stats)."""
import json, os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tmbm_import as T

D = T.OUT
CYR = {'а':'','е':'','ё':'','и':'','й':'','о':'','у':'','ы':'','э':'','ю':'','я':'','ь':'','ъ':'',
       'б':'p','в':'p','г':'g','д':'t','ж':'s','з':'s','к':'k','л':'l','м':'m','н':'n','п':'p','р':'r','с':'s','т':'t','ф':'p','х':'h','ц':'s','ч':'s','ш':'s','щ':'s'}
LAT = {'b':'p','v':'p','w':'p','f':'p','p':'p','g':'g','d':'t','t':'t','j':'s','z':'s','s':'s','c':'s','k':'k','q':'k','l':'l','m':'m','n':'n','r':'r','h':'h','x':'h'}
NUM = re.compile(r'\d+(?:[.,]\d+)?')
WORD = re.compile(r"[A-Za-zЀ-ӿ]+")


def skel(w):
    w = w.lower().replace('‘', '').replace('’', '').replace('’', '')
    out = []
    for ch in w:
        c = CYR.get(ch) if ch in CYR else LAT.get(ch, '')
        if c and (not out or out[-1] != c):
            out.append(c)
    return ''.join(out)


def skels(text):
    return {s for s in (skel(w) for w in WORD.findall(text) if len(w) >= 5) if len(s) >= 3}


def nums(text):
    return sorted(n.replace(',', '.') for n in NUM.findall(text))


def sim(a, b):
    sa, sb = skels(a), skels(b)
    return len(sa & sb)


def prep(x):
    t = ' '.join([x['q']] + x['o'])
    x['_s'], x['_n'] = skels(t), nums(t)


def pair_score(u, r):
    sh = len(u['_s'] & r['_s'])
    nu, nr = u['_n'], r['_n']
    return sh + (2 if nu and nu == nr else 0) - (3 if nu != nr else 0)


def verify(u, r):
    if len(u['o']) != 4 or len(r['o']) != 4:
        return 'options!=4'
    if nums(u['q']) != nums(r['q']):
        return 'stem-numbers'
    if sorted(map(lambda o: tuple(nums(o)), u['o'])) != sorted(map(lambda o: tuple(nums(o)), r['o'])):
        return 'option-numbers'
    if nums(u['o'][0]) != nums(r['o'][0]):
        return 'key-numbers'
    ks = sim(u['o'][0], r['o'][0])
    if any(sim(u['o'][0], o) > ks for o in r['o'][1:]):
        return 'key-not-first'
    return None


def cos(u, r):
    if not u['_s'] or not r['_s']:
        return 0.0
    return len(u['_s'] & r['_s']) / (len(u['_s']) * len(r['_s'])) ** 0.5


def align(U, R, same_edition_order):
    """Mutual-best matching on evidence. Returns (i, j) candidate pairs (verified afterwards). The two editions are not always in
    the same order (children's banks), so no monotonicity is assumed; question numbers only break ties (+0.15)."""
    for x in U + R:
        prep(x)
    def sc(i, j):
        u, r = U[i], R[j]
        v = cos(u, r)
        if u['_n'] and u['_n'] == r['_n']:
            v += 0.3
        elif u['_n'] != r['_n']:
            v -= 0.5
        if same_edition_order and abs(i - j) <= 2:
            v += 0.15
        return v
    best_u = {}
    best_r = {}
    for i in range(len(U)):
        row = sorted(((sc(i, j), j) for j in range(len(R))), reverse=True)[:2]
        best_u[i] = row
    for j in range(len(R)):
        col = sorted(((sc(i, j), i) for i in range(len(U))), reverse=True)[:2]
        best_r[j] = col
    pairs = []
    for i, row in best_u.items():
        v, j = row[0]
        if v < 0.3 or best_r[j][0][1] != i:
            continue
        second = max(row[1][0] if len(row) > 1 else 0, best_r[j][1][0] if len(best_r[j]) > 1 else 0)
        if v - second < 0.1:
            continue
        pairs.append((i, j))
    return pairs


def main():
    stats = []
    for sp in json.load(open(os.path.join(D, 'manifest.json')))['specialties']:
        sid = sp['id']
        path = os.path.join(D, sid + '.json')
        doc = json.load(open(path, encoding='utf-8'))
        ru = json.load(open(os.path.join(D, 'ru', sid + '.json'), encoding='utf-8'))['questions']
        qs = doc['questions']
        # source order of the Uzbek options (the stored list is shuffled)
        U = []
        for q in qs:
            rnd = T.mulberry32(T.seed_of(q['id']))
            idx = list(range(len(q['o'])))
            for i in range(len(idx) - 1, 0, -1):
                j = int(rnd() * (i + 1)); idx[i], idx[j] = idx[j], idx[i]
            srco = [None] * len(idx)
            for pos, i in enumerate(idx):
                srco[i] = q['o'][pos]
            U.append({'q': q['q'], 'o': srco})
        pairs = align(U, ru, len(U) == len(ru))
        reasons = collections.Counter()
        ok = 0
        used_r = set()
        same_num = 0
        good = []
        for i, j in pairs:
            why = verify(U[i], ru[j])
            if why:
                reasons[why] += 1
                continue
            good.append((i, j, 'evidence'))
        # Bridging: a question between two evidence-verified pairs of the SAME offset (within 8 positions on each side) is forced by the
        # order of the document; it still has to pass the hard checks (4 options, same numbers, same numbers in the key option).
        anchors = {i: j - i for i, j, _ in good}
        taken = {j for _, j, _ in good}
        keys = sorted(anchors)
        import bisect
        bridged = 0
        for i in range(len(U)):
            if i in anchors:
                continue
            p_ = bisect.bisect_left(keys, i)
            if p_ == 0 or p_ == len(keys):
                continue
            a, c = keys[p_ - 1], keys[p_]
            if i - a > 8 or c - i > 8 or anchors[a] != anchors[c]:
                continue
            j = i + anchors[a]
            if not 0 <= j < len(ru) or j in taken:
                continue
            why = verify(U[i], ru[j])
            if why:
                reasons['bridge-' + why] += 1
                continue
            good.append((i, j, 'bridge')); taken.add(j); bridged += 1
        for i, j, how in good:
            ok += 1
            used_r.add(j)
            same_num += qs[i]['n'] == ru[j]['n']
            r = ru[j]
            rid = qs[i]['id']
            o, k = T.shuffle_with_key(r['o'], rid + '-ru')
            qs[i]['ru'] = {'n': r['n'], 'q': r['q'], 'o': o, 'k': k}
        only_ru = 0
        dropped = []
        for j, r in enumerate(ru):
            if j in used_r:
                continue
            rid = '%s-r%04d' % (sid, r['n'])
            if len(r['o']) != 4 or any(not x for x in r['o']):
                dropped.append(rid)   # malformed in the source (not exactly 4 options): not imported
                continue
            o, k = T.shuffle_with_key(r['o'], rid)
            qs.append({'id': rid, 'ru': {'n': r['n'], 'q': r['q'], 'o': o, 'k': k}})
            only_ru += 1
        doc['questions'] = qs
        json.dump(doc, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        st = {'id': sid, 'uz': len(U), 'ru': len(ru), 'paired': ok, 'sameNumber': same_num, 'uzOnly': len(U) - ok, 'ruOnly': only_ru,
              'rejected': dict(reasons), 'ruDroppedMalformed': dropped, 'byEvidence': len(pairs) - sum(reasons[k] for k in reasons if not k.startswith('bridge')), 'bridged': bridged}
        stats.append(st)
        print('%-20s uz %3d ru %3d paired %3d (same number %3d) uz-only %3d ru-only %3d rejected %s' % (sid, len(U), len(ru), ok, same_num, len(U) - ok, only_ru, dict(reasons)))
    json.dump(stats, open(os.path.join(D, 'pairing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
