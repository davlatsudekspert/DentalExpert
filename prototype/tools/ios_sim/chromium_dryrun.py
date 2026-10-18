"""Linux/Chromium dry run of the Maestro flows in tools/ios_sim/flows (same Uzbek texts, same order), for checking
the selectors after UI text changes without a Mac. It is NOT the simulator test: it approximates Maestro's text
matching (full regex match on accessible name, text, label or placeholder) and fakes the native bridge.

Usage (from prototype/, after `npm ci`):
  VITE_API_BASE=http://127.0.0.1:18789 npx vite build --outDir /tmp/dist-sim --emptyOutDir
  API_PORT=18788 PROXY_PORT=18789 PERSIST_DIR=/tmp/d1 LOG_DIR=/tmp/d1/logs tools/ios_sim/start_local_api.sh
  CHROMIUM_PATH=/usr/bin/chromium python3 tools/ios_sim/chromium_dryrun.py /tmp/dist-sim /tmp/dry-shots
  LOG_DIR=/tmp/d1/logs tools/ios_sim/stop_local_api.sh
Env: E2E_PROXY (default http://127.0.0.1:18789, must match the VITE_API_BASE of the build)."""
import json, os, re, sys, time, urllib.request, urllib.parse, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(sys.argv[1]); OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'dry-shots'); OUT.mkdir(parents=True, exist_ok=True)
PROXY = os.environ.get('E2E_PROXY', 'http://127.0.0.1:18789')
RUN = str(int(time.time()))
DENTIST, TEACHER, STUDENT = (f'maestro-{r}-{RUN}@example.test' for r in ('dentist', 'teacher', 'student'))
GROUP = f'Maestro Guruh {RUN}'
QUIZ_RE = subprocess.check_output(['node', str(Path(__file__).with_name('quiz_regex.mjs')), 'uz'], text=True)
MIME = {'.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg'}

def full(p): return re.compile('^(?:' + p.replace('/', r'\/') + ')$', re.S)

def candidates(pg, pat):
    r = full(pat)
    locs = [pg.get_by_role('button', name=r), pg.get_by_role('link', name=r), pg.get_by_label(r), pg.get_by_placeholder(r), pg.get_by_text(r)]
    out = []
    for l in locs:
        for i in range(l.count()):
            e = l.nth(i)
            try:
                if e.is_visible(): out.append(e)
            except Exception: pass
    return out

def wait_visible(pg, pat, timeout=10):
    end = time.time() + timeout
    while time.time() < end:
        c = candidates(pg, pat)
        if c: return c
        pg.wait_for_timeout(200)
    raise AssertionError(f'not visible: {pat}')

def tap(pg, pat, index=0, timeout=10):
    c = wait_visible(pg, pat, timeout)
    c[min(index, len(c) - 1)].click(); pg.wait_for_timeout(300)

def not_visible(pg, pat): assert not candidates(pg, pat), f'unexpectedly visible: {pat}'
def typ(pg, text): pg.keyboard.type(text); pg.wait_for_timeout(150)
def shot(pg, n): pg.screenshot(path=str(OUT / f'{n}.png'))
def get(path):
    with urllib.request.urlopen(PROXY + path) as r: return json.load(r)

def signup(pg, role, name, email, prefix):
    pg.goto('http://localhost/index.html'); pg.wait_for_timeout(500)
    pg.evaluate('localStorage.clear()'); pg.goto('http://localhost/index.html')
    wait_visible(pg, 'Choose your language', 30)
    tap(pg, 'O.zbekcha.*'); wait_visible(pg, 'Davom etish.*')
    tap(pg, f'.*{role}.*'); tap(pg, 'Davom etish.*')
    wait_visible(pg, 'Kod yuborish.*', 30); shot(pg, prefix + '-01-signup')
    tap(pg, 'Ism va familiya'); typ(pg, name)
    tap(pg, 'aziza@example.com'); typ(pg, email)
    tap(pg, 'Kod yuborish.*')
    wait_visible(pg, 'Elektron pochtangizni tasdiqlang', 20)
    code = get('/__e2e/code?wait=8000&email=' + urllib.parse.quote(email))['code']
    tap(pg, 'Tasdiqlash kodi'); typ(pg, code)
    tap(pg, 'Tasdiqlash')

def sign_out(pg, email, prefix):
    tap(pg, 'Profil'); wait_visible(pg, 'Ilova tili')
    wait_visible(pg, 'Chiqish'); wait_visible(pg, email)
    shot(pg, prefix + '-91-settings'); tap(pg, 'Chiqish')
    wait_visible(pg, 'Hisobingiz bormi.*', 15); wait_visible(pg, 'Hisob yaratish.*'); shot(pg, prefix + '-92-signed-out')

def step(name, fn):
    try: fn(); print('PASS', name)
    except Exception as e: print('FAIL', name, '-', str(e)[:300]); raise

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None, args=['--no-sandbox', '--no-proxy-server',
        # the page is served by route() (no IP), so Chromium would treat calls to 127.0.0.1 as local-network access and stall
        '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'])
    def newpage():
        ctx = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
        ctx.add_init_script("window.webkit={messageHandlers:{bridge:{postMessage(){}}}};")
        def handle(route):
            path = urllib.parse.urlparse(route.request.url).path.lstrip('/') or 'index.html'
            f = DIST / path
            if f.is_dir(): f = f / 'index.html'
            if f.exists(): route.fulfill(status=200, body=f.read_bytes(), headers={'content-type': MIME.get(f.suffix, 'application/octet-stream')})
            else: route.fulfill(status=404, body='nf')
        ctx.route('http://localhost/**', handle)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        return pg, errs

    # (a) onboarding
    pg, errs = newpage()
    def a():
        pg.goto('http://localhost/index.html'); wait_visible(pg, 'Choose your language', 30)
        for t in ['English.*', 'Русский.*', 'O.zbekcha.*']: wait_visible(pg, t)
        tap(pg, 'O.zbekcha.*'); wait_visible(pg, 'Davom etish.*')
        for t in ['Dental Expert bilan o.z yo.lingizni tanlang.', '.*Bemor.*', '.*Stomatolog.*', '.*Ustoz.*', '.*Talaba.*']: wait_visible(pg, t)
        tap(pg, '.*Stomatolog.*'); tap(pg, 'Davom etish.*')
        wait_visible(pg, 'Hisob yaratish', 15); wait_visible(pg, 'Ism va familiya'); wait_visible(pg, 'Email manzilingiz')
        wait_visible(pg, '(Kod yuborish|Ro.yxatdan o.tish \\(demo\\)).*', 30); shot(pg, 'onboarding-04-signup')
    step('01_onboarding', a)

    # dentist
    pg, errs = newpage()
    def d():
        signup(pg, 'Stomatolog', 'Ali Abduraxmon', DENTIST, 'dentist')
        wait_visible(pg, '.*Ali Abduraxmon.*', 20); wait_visible(pg, 'Ish maydoni'); wait_visible(pg, 'AA'); not_visible(pg, '.*Aziza.*')
        shot(pg, 'dentist-04-dashboard')
        tap(pg, 'Bemor qo.shish.*'); wait_visible(pg, 'Bemorlarim'); tap(pg, 'Bemor qo.shish.*')
        tap(pg, 'Ism va familiya'); typ(pg, 'Test Bemor'); tap(pg, 'Telefon'); typ(pg, '+998 91 000 00 00')
        tap(pg, 'Saqlash'); wait_visible(pg, 'Odontogramma .FDI.'); wait_visible(pg, 'Test Bemor')
        tap(pg, '11 Sog.lom'); tap(pg, 'Karies', 0); wait_visible(pg, '11 Karies', 5)
        tap(pg, '16 Sog.lom'); tap(pg, 'Plomba', 0); wait_visible(pg, '16 Plomba', 5)
        tap(pg, 'Nima qilindi.'); typ(pg, 'Karies davolandi'); tap(pg, 'Qabul qaydini qo.shish'); wait_visible(pg, '.*Karies davolandi.*')
        shot(pg, 'dentist-07-visit')
        tap(pg, 'Atlas'); wait_visible(pg, 'Tish anatomiyasi'); tap(pg, '.*Qatlamlarni ajratib.*')
        wait_visible(pg, '3D tish atlasi', 20); pg.wait_for_timeout(1500); tap(pg, 'Ajratish'); wait_visible(pg, 'Yig.ish', 5)
        pg.wait_for_timeout(1500); shot(pg, 'dentist-10-exploded'); tap(pg, 'Yopish'); pg.wait_for_timeout(500); not_visible(pg, '3D tish atlasi')
        sign_out(pg, DENTIST, 'dentist')
    step('02_dentist', d)

    pg, errs = newpage()
    def t():
        signup(pg, 'Ustoz', 'Ustoz Maestro', TEACHER, 'teacher')
        wait_visible(pg, '.*Ustoz Maestro.*', 20)
        tap(pg, 'Guruh nomi.*'); typ(pg, GROUP); tap(pg, 'Yaratish')
        wait_visible(pg, '.*kodi: [A-Z0-9]{6}.*', 15); shot(pg, 'teacher-05-group')
        tap(pg, re.escape(GROUP) + '.*'); wait_visible(pg, 'Topshiriqlar'); tap(pg, 'Topshiriqlar'); wait_visible(pg, 'Topshiriq berish.*'); tap(pg, 'Topshiriq berish.*')
        tap(pg, 'Sarlavha'); typ(pg, 'Emalni tasvirlang'); tap(pg, 'Yaratish')
        wait_visible(pg, '.*Emalni tasvirlang.*'); pg.wait_for_timeout(300); not_visible(pg, 'Sarlavha'); shot(pg, 'teacher-07-assignment')
        sign_out(pg, TEACHER, 'teacher')
    step('03_teacher', t)

    pg, errs = newpage()
    def s():
        signup(pg, 'Talaba', 'Talaba Maestro', STUDENT, 'student')
        wait_visible(pg, '.*Talaba Maestro.*', 20)
        tap(pg, 'Kunlik mashq'); tap(pg, '.*Kunlik test.*'); wait_visible(pg, '1 / 5')
        for i in range(5):
            c = wait_visible(pg, QUIZ_RE, 5)
            print('   q%d option candidates: %s' % (i + 1, [x.inner_text()[:30] for x in c][:4]))
            c[0].click(); pg.wait_for_timeout(200)
            wait_visible(pg, '(Keyingi|Yakunlash)', 5)
            if candidates(pg, 'Keyingi'): tap(pg, 'Keyingi')
            if candidates(pg, 'Yakunlash'): tap(pg, 'Yakunlash')
        wait_visible(pg, 'Natija'); wait_visible(pg, '[0-5] / 5'); shot(pg, 'student-07-daily'); tap(pg, 'Yopish', 0)
        wait_visible(pg, '.*Bajarildi.*', 5)
        tap(pg, 'Asosiy')
        gc = get('/__e2e/group-code?wait=8000&name=' + urllib.parse.quote(GROUP))['code']
        tap(pg, '6 belgili kod'); typ(pg, gc); tap(pg, 'Masalan: Lola'); typ(pg, 'Zebra')
        tap(pg, 'Qo.shilish'); wait_visible(pg, re.escape(GROUP) + '.*', 15); shot(pg, 'student-09-joined')
        tap(pg, re.escape(GROUP) + '.*'); wait_visible(pg, 'Topshiriqlar'); tap(pg, 'Topshiriqlar'); wait_visible(pg, '.*Emalni tasvirlang.*'); tap(pg, '.*Emalni tasvirlang.*')
        tap(pg, 'Javobingiz'); typ(pg, "Eng qattiq to'qima, tojni qoplaydi"); tap(pg, 'Yuborish'); wait_visible(pg, 'Yuborildi', 10)
        shot(pg, 'student-10-sent')
        sign_out(pg, STUDENT, 'student')
    step('04_student', s)
    print('page errors:', errs[:3])
    b.close()
print('DRY RUN OK')
