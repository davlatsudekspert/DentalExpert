#!/usr/bin/env python3
"""Parse the OFFICIAL Russian PDFs of the same TMBM question banks (same file numbers, `-rus-` instead of `-uzb-`).
    python3 tools/tmbm_import_ru.py [--offline]
Writes data/attestation/ru/<id>.json (options in source order, first = key by the site's convention) and extends manifest.json
with the Russian source URL/sha256. Pairing with the Uzbek questions is done by tools/tmbm_pair_ru.py."""
import argparse, collections, datetime, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tmbm_import as T

RU = {
    'umumiy': '78-umumij-stom-test-sajt-rus-500.pdf', 'terapevtik': '79-terap-stom-test-sajt-rus-584.pdf',
    'ortopedik': '80-ortoped-stom-test-sajt-rus-520.pdf', 'xirurgik': '81-hirurg-stom-test-sajt-rus-492.pdf',
    'yuzjag': '82-uz-zag-hir-test-sajt-rus-473.pdf', 'bolalar': '83-bolalar-stom-test-sajt-rus-449.pdf',
    'bolalar-yuzjag': '84-bol-uz-zag-hir-test-baza-rus-451.pdf', 'bolalar-terapevtik': '85-bol-ter-stom-test-sajt-rus-486.pdf',
    'bolalar-xirurgik': '86-bol-hir-stom-test-sajt-rus-451.pdf', 'ortodontiya': '87-ortodontia-test-sajtga-rus-499.pdf',
    'implantologiya': '88-dental-impl-test-sajt-rus-421.pdf', 'parodontologiya': '89-paradontologia-test-sajt-rus-376.pdf'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--offline', action='store_true')
    a = ap.parse_args()
    T.LANG = 'ru'
    out = os.path.join(T.OUT, 'ru')
    os.makedirs(out, exist_ok=True)
    man = json.load(open(os.path.join(T.OUT, 'manifest.json')))
    today = datetime.date.today().isoformat()
    for sp in man['specialties']:
        sid = sp['id']
        path = '/uploads/category/files/' + RU[sid]
        pdf, sha = T.fetch(path, a.offline)
        stats = collections.Counter()
        qs, warns, _ = T.parse_file(pdf, sid, stats)
        items = [{'n': q['n'], 'q': q['stem'], 'o': q['opts']} for q in qs]
        hist = collections.Counter(len(i['o']) for i in items)
        json.dump({'id': sid, 'lang': 'ru', 'questions': items}, open(os.path.join(out, sid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        sp['ru'] = {'url': T.BASE + path, 'sha256': sha, 'retrieved': today, 'questions': len(items),
                    'optionCounts': {str(k): v for k, v in sorted(hist.items())}, 'warnings': warns[:20]}
        print('%-20s ru %4d questions (uz %d) opts=%s warn=%d' % (sid, len(items), sp['questions'], dict(hist), len(warns)))
    json.dump(man, open(os.path.join(T.OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
