"""Language-consistency scan: visits every screen in en, ru and uz and flags visible text in the wrong language.

Runs against the production build:
  npm run build && python3 tools/i18n_scan.py            (starts `npx vite preview --port 4173` itself if needed)
  PROTOTYPE_HTML=demo.html python3 tools/i18n_scan.py    (offline single-file build, like tools/verify.py)
  I18N_URL=http://127.0.0.1:4173 python3 tools/i18n_scan.py   (an already running server)

What counts as a finding
  ru  any Latin word that is not on the allowlist below (brand and technical names only)
  en  any Cyrillic letter, Uzbek apostrophe letters (o‘ g‘, ta’lim) or common Uzbek words
  uz  any Cyrillic letter or a common English UI word; also ASCII/modifier apostrophes instead of ‘ ’
  all bad plural agreement after numbers (uz "8 Darslar", ru "5 урок", en "1 days") and English month names in uz/ru
Also checks that languages are listed in the order English, Russian, Uzbek on the first-run screen,
in Settings, in the intro/auth pills and on the contact and privacy pages.

Text inside an element with translate="no" (proper names such as doctor and clinic names) or with a lang
attribute naming another language (e.g. "Русский" in the language list) is intentionally skipped.
Prints a table and exits 1 when anything is found.
"""
from pathlib import Path
import os, re, socket, subprocess, sys, time, signal
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OFFLINE_HTML = os.environ.get('PROTOTYPE_HTML')
CHROMIUM = os.environ.get('CHROMIUM_PATH', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
LANGS = ['en', 'ru', 'uz']
ORDER = ['en', 'ru', 'uz']

def screens_from_source():
    src = (ROOT / 'src/main.tsx').read_text()
    extra = re.search(r"const extraScreens:ExtraScreenName\[\]=\[([^\]]*)\]", src).group(1)
    base = re.search(r"const screens=\[([^\]]*)\]", src).group(1)
    names = re.findall(r"'([A-Za-z]+)'", base) + re.findall(r"'([A-Za-z]+)'", extra)
    return list(dict.fromkeys(names))

# ---------------------------------------------------------------- allowlists
# Brand / product phrases removed before any check (case-sensitive).
BRAND_PHRASES = ['DENTAL EXPERT PLUS', 'Dental Expert Plus', 'DENTAL EXPERT', 'Dental Expert', 'DentalExpert', 'DENTALEXPERT']
# Latin words accepted inside Russian text (compared lower-case).
RU_LATIN_OK = {
    'dental', 'expert', 'fdi', '3d', 'uzs', 'aed', 'usd', 'email', 'e-mail', 'google', 'apple', 'testflight', 'app', 'store',
    'telegram', 'instagram', 'pptx', 'pdf', 'gps', 'sdk', 'gdpr', 'https', 'httponly', 'cookie', 'ip', 'cloudflare', 'resend',
    'id', 'ok', 'tsdi', 'sammu', 'adti', 'afu', 'ios', 'android', 'plus', 'ru',  # 'RU' = the current-language badge
}
# Common Uzbek words that must not appear in English text (compared lower-case, apostrophes normalised).
UZ_WORDS = {
    'bemor', 'bemorlar', 'shifokor', 'shifokorlar', 'stomatolog', 'stomatologlar', 'stomatologiya', 'tish', 'tishlar', 'tishning',
    'dars', 'darslar', 'kun', 'kunlik', 'uchun', 'va', 'bilan', 'yoki', 'ustoz', 'talaba', 'talabalar', 'namuna', 'namunaviy',
    'kirish', 'sozlamalar', 'qidiruv', 'qabul', 'reklama', 'bepul', 'tayyor', 'yopish', 'orqaga', 'davom', 'saqlash',
    'yuborish', 'bakalavriat', 'tumani', 'hududi', 'markaziy', 'davlat', 'instituti', 'universiteti', 'tibbiyot', 'daq',
    'daqiqa', 'emas', 'faqat', 'mavzu', 'savol', 'javob', 'izoh', 'guruh', 'guruhlar', 'topshiriq', 'mashq', 'bugun',
    'andijon', 'toshkent', "farg'ona", 'samarqand', 'dubay', 'emal', 'pulpa', 'ildiz', 'sement', 'milk', 'toj', 'jadval',
    'muassasa', 'manba', 'tekshirilgan', 'slayd', 'ilova', 'hisob', 'shikoyat', 'murojaat', 'xabar', 'yangi', 'barchasi',
}
# English UI words that must not appear in Uzbek text (compared lower-case).
EN_WORDS = {
    'the', 'and', 'with', 'for', 'your', 'you', 'all', 'set', 'care', 'learn', 'connect', 'one', 'community', 'journey',
    'academy', 'interactive', 'map', 'close', 'main', 'navigation', 'free', 'pro', 'sample', 'illustration', 'molar',
    'tooth', 'teeth', 'study', 'local', 'prototype', 'data', 'live', 'settings', 'home', 'search', 'back', 'next',
    'previous', 'view', 'open', 'cancel', 'save', 'submit', 'loading', 'error', 'quiz', 'quizzes', 'lesson', 'lessons',
    'slides', 'slide', 'page', 'select', 'choose', 'language', 'min', 'mins', 'day', 'days', 'minutes', 'hours', 'students',
    'student', 'teacher', 'teachers', 'group', 'groups', 'join', 'create', 'score', 'best', 'done', 'start', 'sign',
    'account', 'design', 'case', 'studio', 'bachelor', 'institute', 'university', 'state', 'medical', 'ad', 'ads',
    'sponsored', 'profile', 'doctor', 'patient', 'dentist', 'educator', 'of', 'to', 'is', 'are', 'not', 'no', 'yes',
    'by', 'on', 'at', 'from', 'or', 'an', 'what', 'which', 'how', 'new', 'more', 'today', 'week', 'month', 'year',
    'years', 'experience', 'reviews', 'rating', 'filter', 'top', 'rated', 'bug', 'floss', 'enamel', 'pulp',
    'root', 'roots', 'crown', 'gum', 'gums', 'canine', 'continue', 'demo map', 'presentation', 'presentations',
    'enter', 'name', 'phone', 'city', 'country', 'other', 'complaint', 'message', 'send', 'thank', 'please',
    'plan', 'plans', 'campaign', 'sponsor', 'paid', 'price', 'trial',
}
# User input typed by the scan, written in the language being checked.
SAMPLE = {
    'en': {'patient': 'Anna Smith', 'case': 'The enamel covers the crown and the pulp sits in the centre.', 'forum': 'How do you explain tooth enamel to first-year students?'},
    'ru': {'patient': 'Анна Иванова', 'case': 'Эмаль покрывает коронку, а пульпа находится в центре зуба.', 'forum': 'Как объяснить студентам строение эмали зуба?'},
    'uz': {'patient': 'Ali Valiyev', 'case': 'Emal tojni qoplaydi, pulpa esa tishning markazida joylashgan.', 'forum': 'Birinchi kurs talabalariga tish emalini qanday tushuntirasiz?'},
}
EN_MONTHS = r'\b(January|February|March|April|June|July|August|September|October|November|December|Oktober|Dezember|Februar)\b'
# Exact visible strings that are correct as they are (e.g. country names that contain an apostrophe).
EXACT_OK = {'Côte d’Ivoire'}

# ---------------------------------------------------------------- checks
CYR = re.compile(r'[Ѐ-ӿ]')
LATIN_WORD = re.compile(r"[A-Za-z][A-Za-z‘’'ʻʼ`-]*")
CHUNK = re.compile(r"[^\s·/|,;:()«»“”\"!?…—–\[\]{}<>+=%№#*•✓✧▮▰◒‹›]+")
EMAIL_OR_URL = re.compile(r"(@|https?:|www\.|\.[a-z]{2,4}(/|$)|^[a-z0-9-]+\.[a-z]{2,})", re.I)
EN_CONTRACTION = re.compile(r"’(s|t|re|ll|ve|d|m)\b", re.I)

def norm_ap(s):
    return re.sub(r"[‘’ʻʼ`]", "'", s)

def strip_brands(text):
    for p in BRAND_PHRASES:
        text = text.replace(p, ' ')
    return text

def ru_plural(n):
    n = abs(n) % 100
    if 10 < n < 20: return 2
    n %= 10
    return 0 if n == 1 else 1 if 2 <= n <= 4 else 2

RU_NOUNS = [  # one, few, many
    ('урок', 'урока', 'уроков'), ('студент', 'студента', 'студентов'), ('вопрос', 'вопроса', 'вопросов'),
    ('слайд', 'слайда', 'слайдов'), ('день', 'дня', 'дней'), ('год', 'года', 'лет'), ('минута', 'минуты', 'минут'),
    ('задание', 'задания', 'заданий'), ('изображение', 'изображения', 'изображений'), ('участник', 'участника', 'участников'),
    ('тест', 'теста', 'тестов'), ('балл', 'балла', 'баллов'), ('попытка', 'попытки', 'попыток'), ('язык', 'языка', 'языков'),
    ('группа', 'группы', 'групп'), ('презентация', 'презентации', 'презентаций'), ('ответ', 'ответа', 'ответов'),
    ('профиль', 'профиля', 'профилей'), ('место', 'места', 'мест'), ('спонсор', 'спонсора', 'спонсоров'),
]
RU_FORM = {}
for forms in RU_NOUNS:
    for i, f in enumerate(forms):
        RU_FORM.setdefault(f, (forms, i))

def check_text(lang, text):
    """Return a list of (reason, offending fragment)."""
    out = []
    if text.strip() in EXACT_OK:
        return out
    t = strip_brands(text)
    if lang == 'ru':
        for chunk in CHUNK.findall(t):
            if EMAIL_OR_URL.search(chunk):
                continue
            if re.search(r'\d', chunk) and not re.search(r'[A-Za-z]{3,}', chunk):
                continue
            for w in LATIN_WORD.findall(chunk):
                if len(w) == 1 and w in 'xX':
                    continue
                # Clinical abbreviations and single-letter labels stay Latin in Russian dental texts (ASA, CBCT, A-delta, C).
                if re.fullmatch(r"[A-Z][A-Z0-9]{0,6}-?", w):
                    continue
                if w.lower().strip("'‘’-") not in RU_LATIN_OK:
                    out.append(('Latin word in Russian', w))
        for m in re.finditer(r'(\d+)\+?\s+([а-яё]+)', t):
            n, word = int(m.group(1)), m.group(2)
            if word in RU_FORM:
                forms, _ = RU_FORM[word]
                want = forms[ru_plural(n)]
                if word != want and not (forms[0] == 'год' and word == 'лет' and ru_plural(n) == 2):
                    out.append(('Russian plural', f'{m.group(0)} (expected {n} {want})'))
    if lang == 'en':
        if CYR.search(t):
            out.append(('Cyrillic in English', ''.join(CYR.findall(t))[:20]))
        for m in re.finditer(r"[A-Za-z]*[oOgG][‘ʻ][a-z]+", t):
            out.append(('Uzbek letter in English', m.group(0)))
        for m in re.finditer(r"[A-Za-z]+’[A-Za-z]+", t):
            if not EN_CONTRACTION.search(m.group(0)):
                out.append(('Uzbek apostrophe in English', m.group(0)))
        for w in re.findall(r"[A-Za-z][A-Za-z‘’ʻ']*", t):
            if norm_ap(w).lower() in UZ_WORDS:
                out.append(('Uzbek word in English', w))
        for m in re.finditer(r"\b1\s+(days|lessons|questions|slides|students|minutes|years|groups|members|attempts|images|patients)\b", t):
            out.append(('English plural', m.group(0)))
    if lang == 'uz':
        if CYR.search(t):
            out.append(('Cyrillic in Uzbek', ''.join(CYR.findall(t))[:20]))
        for chunk in CHUNK.findall(t):
            if EMAIL_OR_URL.search(chunk):
                continue
            for w in re.findall(r"[A-Za-z][A-Za-z‘’ʻʼ'`]*", chunk):
                if w.lower() in EN_WORDS:
                    out.append(('English word in Uzbek', w))
        for m in re.finditer(r"[A-Za-z]*([oOgG]['`ʻʼ’]|[a-z]['`ʻʼ][a-z])[A-Za-z]*", t):
            out.append(('Uzbek apostrophe style (use ‘ for o‘/g‘, ’ for tutuq)', m.group(0)))
        for m in re.finditer(r"\b\d+\+?\s+([A-Za-z‘’]+lar)\b", t):
            out.append(('Uzbek plural after number', m.group(0)))
        if re.search(r'\bmin\b', t):
            out.append(('Unit not localized', 'min'))
    if lang in ('uz', 'ru'):
        for m in re.finditer(EN_MONTHS, t):
            out.append(('English month name', m.group(0)))
    return out

COLLECT_JS = r"""
(pageLang)=>{
 const items=[];
 const skip=(el)=>{
  for(let e=el;e&&e.nodeType===1;e=e.parentElement){
   if(e.getAttribute('translate')==='no')return true;
   if(e.getAttribute('aria-hidden')==='true')return true;
   const l=e.getAttribute('lang');
   if(l&&e!==document.documentElement&&l.slice(0,2)!==pageLang)return true;
   if(l)break;
  }
  return false;
 };
 const visible=(el)=>{
  if(!el.checkVisibility||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;
  const r=el.getBoundingClientRect();return r.width>0&&r.height>0;
 };
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let n;
 while((n=walker.nextNode())){
  const text=n.textContent.replace(/\s+/g,' ').trim();if(!text)continue;
  const el=n.parentElement;if(!el||['SCRIPT','STYLE','NOSCRIPT','OPTION','TITLE'].includes(el.tagName))continue;
  if(skip(el)||!visible(el))continue;
  items.push(['text',text]);
 }
 for(const el of document.querySelectorAll('[aria-label],[alt],[placeholder],[title]')){
  if(skip(el)||!visible(el))continue;
  for(const a of ['aria-label','alt','placeholder','title']){const v=el.getAttribute(a);if(v&&v.trim())items.push([a,v.trim()])}
 }
 for(const sel of document.querySelectorAll('select')){
  if(skip(sel)||!visible(sel))continue;
  for(const o of sel.options){if(!skip(o)&&o.textContent.trim())items.push(['option',o.textContent.trim()])}
 }
 return items;
}
"""

def port_open(port):
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(('127.0.0.1', port)) == 0

def main():
    server = None
    base = os.environ.get('I18N_URL')
    if OFFLINE_HTML:
        base = 'https://dental-demo.local'
    elif not base:
        base = 'http://127.0.0.1:4173'
        if not port_open(4173):
            if not (ROOT / 'dist/index.html').exists():
                sys.exit('dist/ is missing: run `npm run build` first')
            server = subprocess.Popen(['npx', 'vite', 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'],
                                      cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
            for _ in range(80):
                if port_open(4173): break
                time.sleep(0.25)
    findings = {}   # (lang, reason, fragment, text) -> set(screens)
    order_problems = []
    visited = 0
    def add(lang, where, kind, text):
        for reason, frag in check_text(lang, text):
            key = (lang, reason, frag, text[:90] + ('…' if len(text) > 90 else ''))
            findings.setdefault(key, set()).add(where)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROMIUM, headless=True, args=[
                '--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            html = Path(OFFLINE_HTML if Path(OFFLINE_HTML).is_absolute() else ROOT / OFFLINE_HTML).read_text() if OFFLINE_HTML else None
            page = None
            def fresh_page():
                # One clean browser context per language, so text typed in one language (patients) is not seen in another.
                nonlocal page
                if page: page.context.close()
                ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
                page = ctx.new_page()
                if html is not None:
                    page.route('https://dental-demo.local/**', lambda route: route.fulfill(status=200, content_type='text/html', body=html))
                # Keep the scan independent of a backend: API calls fail fast, the app falls back to bundled data.
                page.route('**/api/**', lambda route: route.abort())

            def collect(lang, where):
                nonlocal visited
                visited += 1
                page.wait_for_timeout(250)
                for kind, text in page.evaluate(COLLECT_JS, lang):
                    add(lang, where, kind, text)
                title = page.title()
                if title:
                    add(lang, where, 'title', title)

            def go(screen, lang):
                page.goto(f'{base}/?screen={screen}&lang={lang}')
                page.wait_for_selector('.screen', timeout=15000)
                page.wait_for_timeout(350)

            def try_(fn):
                try:
                    fn(); return True
                except Exception as e:  # an interaction that is not available on this screen state
                    print(f'  note: {e.__class__.__name__}: {str(e).splitlines()[0][:120]}')
                    return False

            screens = screens_from_source()
            for lang in LANGS:
                fresh_page()
                for s in screens:
                    go(s, lang)
                    if s == 'language':
                        opts = page.locator('.language-option').evaluate_all('(els)=>els.map(e=>e.getAttribute("lang"))')
                        if opts != ORDER:
                            order_problems.append((lang, 'first-run language screen', opts))
                        continue  # the first-run screen is deliberately trilingual
                    collect(lang, s)
                    if s in ('splash', 'onboard'):
                        got = page.locator('.intro-languages button').all_inner_texts()
                        if [x.lower() for x in got] != ORDER: order_problems.append((lang, 'intro pills', got))
                    if s == 'auth':
                        got = page.locator('.auth-entry-languages button').all_inner_texts()
                        if [x.lower() for x in got] != ORDER: order_problems.append((lang, 'auth pills', got))
                    if s == 'settings':
                        got = page.locator('.settings-list').first.locator('.lang-mark').all_inner_texts()
                        if [x.lower() for x in got] != ORDER: order_problems.append((lang, 'Settings language list', got))
                        if try_(lambda: page.locator('.account-session button').first.click()):
                            page.wait_for_selector('.quiz-run', timeout=3000); collect(lang, 'settings › report form')
                    if s == 'anatomy':
                        if try_(lambda: page.locator('.atlas3d-launch').first.click()):
                            page.wait_for_timeout(2500); collect(lang, 'anatomy › 3D atlas')
                            try_(lambda: page.locator('.atlas3d button').nth(2).click()); page.wait_for_timeout(500)
                            collect(lang, 'anatomy › 3D atlas (explode)')
                        go(s, lang)
                        if try_(lambda: page.locator('.anatomy-render').click()):
                            collect(lang, 'anatomy › 360°')
                    if s == 'booking':
                        if try_(lambda: page.locator('.booking-total ~ button.button').first.click()):
                            collect(lang, 'booking › confirmed')
                    if s == 'profile':
                        if try_(lambda: page.locator('.contact-action').first.click()):
                            collect(lang, 'profile › toast')
                    if s == 'courses':
                        for i in range(page.locator('.learn > .chips button').count()):
                            if try_(lambda: page.locator('.learn > .chips button').nth(i).click()):
                                page.wait_for_timeout(500); collect(lang, f'courses › tab {i+1}')
                        # Curriculum: every subject page, its first topic and all of that topic's slides.
                        go(s, lang)
                        try_(lambda: page.locator('.learn > .chips button').first.click())
                        n_subj = page.locator('.lg-section .lg-row').count()
                        for k in range(n_subj):
                            go(s, lang); try_(lambda: page.locator('.learn > .chips button').first.click())
                            if not try_(lambda: page.locator('.lg-section .lg-row').nth(k).click()): continue
                            collect(lang, f'curriculum › subject {k+1}')
                            if not try_(lambda: page.locator('.lg-section .lg-row').first.click()): continue
                            page.wait_for_timeout(300); collect(lang, f'curriculum › subject {k+1} › topic 1')
                            if try_(lambda: page.locator('.lg-section > .button').first.click()):
                                for j in range(14):
                                    collect(lang, f'curriculum › subject {k+1} › slide {j+1}')
                                    nxt = page.locator('.sl-nav .button').last
                                    if page.locator('.sl-nav .button:has(svg.lucide-chevron-right)').count() == 0: break
                                    try_(lambda: nxt.click()); page.wait_for_timeout(120)
                    if s == 'lessonPage':
                        if try_(lambda: [q.locator('button').first.click() for q in page.locator('.academy-question').all()]):
                            collect(lang, 'lessonPage › answered')
                    if s == 'caseStudy':
                        if try_(lambda: (page.locator('.academy-page textarea').fill(SAMPLE[lang]['case']), page.locator('.academy-page .button').first.click())):
                            collect(lang, 'caseStudy › feedback')
                    if s in ('record', 'chart'):
                        if try_(lambda: page.locator('.patients .button').first.click()):
                            collect(lang, f'{s} › add form')
                            if try_(lambda: (page.locator('.patients input').first.fill(SAMPLE[lang]['patient']), page.locator('.patients .button').first.click())):
                                page.wait_for_timeout(300)
                                if try_(lambda: page.locator('.pt-tooth').first.click()):
                                    collect(lang, f'{s} › patient chart')
                    if s in ('teacher', 'student'):
                        for i, name in enumerate(['daily test', 'picture task']):
                            if try_(lambda: page.locator('.daily-card').nth(i).click()):
                                page.wait_for_timeout(300); collect(lang, f'{s} › {name}')
                                try_(lambda: page.locator('.quiz-run-bar button').last.click())
                    if s == 'forum':
                        if try_(lambda: (page.locator('.forum-page textarea').fill(SAMPLE[lang]['forum']), page.locator('.forum-page form .button').first.click())):
                            collect(lang, 'forum › posted')
                    if s == 'search':
                        if try_(lambda: page.locator('.search-field .icon-button').click()):
                            collect(lang, 'search › filter')
            if not OFFLINE_HTML:
                fresh_page()
                for doc in ('contact', 'privacy'):  # static pages next to the app
                    for lang in LANGS:
                        page.goto(f'{base}/{doc}/#{lang}'); page.wait_for_timeout(300)
                        got = page.locator('nav a').evaluate_all('(els)=>els.map(e=>e.dataset.l)')
                        if got != ORDER: order_problems.append((lang, f'/{doc}/ language nav', got))
                        visited += 1
                        for kind, text in page.evaluate(COLLECT_JS, lang):
                            add(lang, f'/{doc}/', kind, text)
                        add(lang, f'/{doc}/', 'title', page.title())
            browser.close()
    finally:
        if server:
            try: os.killpg(server.pid, signal.SIGTERM)
            except ProcessLookupError: pass
    rows = sorted(findings.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][3]))
    print(f'\nScanned {visited} screen states in {", ".join(LANGS)}.')
    if rows:
        print(f'\n{"lang":4} | {"reason":34} | {"fragment":24} | {"text":60} | screens')
        print('-' * 160)
        for (lang, reason, frag, text), where in rows:
            w = sorted(where)
            print(f'{lang:4} | {reason[:34]:34} | {frag[:24]:24} | {text[:60]:60} | {", ".join(w[:4])}{" +"+str(len(w)-4) if len(w) > 4 else ""}')
    for lang, where, got in order_problems:
        print(f'ORDER {lang}: {where} is {got}, expected {ORDER}')
    total = len(rows) + len(order_problems)
    print(f'\n{"FAIL" if total else "PASS"}: {len(rows)} wrong-language findings, {len(order_problems)} language-order problems')
    sys.exit(1 if total else 0)

if __name__ == '__main__':
    main()
