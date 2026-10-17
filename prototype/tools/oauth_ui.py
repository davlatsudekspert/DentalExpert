"""Sign in with Google / Apple UI checks (no real Google/Apple traffic).

Builds the app twice with `npm run build` and serves each build with `npx vite preview --port 4173`:
  1. with VITE_* client ids: buttons render in uz/ru/en on signup and login, 48px+, 16px text, no horizontal
     overflow at 390px, and the Apple / Google / error / cancel flows post the right body to /api/auth/oauth;
  2. without ids: no OAuth buttons and no provider scripts, while the email-code form still shows.
The Google Identity Services and Apple JS scripts and the /api/auth/* endpoints are stubbed with page.route.
Needs Python Playwright and Chromium (CHROMIUM_PATH, default /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
Usage: python3 tools/oauth_ui.py
"""
from pathlib import Path
import hashlib, json, os, re, signal, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 4173
BASE = f'http://127.0.0.1:{PORT}'
CHROMIUM = os.environ.get('CHROMIUM_PATH', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
IDS = {
    'VITE_GOOGLE_WEB_CLIENT_ID': 'test-web.apps.googleusercontent.com',
    'VITE_GOOGLE_IOS_CLIENT_ID': 'test-ios.apps.googleusercontent.com',
    'VITE_APPLE_CLIENT_ID': 'uz.dentalexpert.web',
    'VITE_APPLE_REDIRECT_URI': 'https://dental-expert.pages.dev',
}
LABELS = {
    'uz': ('Google bilan davom etish', 'Apple bilan davom etish', 'yoki', 'Kod yuborish'),
    'ru': ('Продолжить через Google', 'Продолжить через Apple', 'или', 'Отправить код'),
    'en': ('Continue with Google', 'Continue with Apple', 'or', 'Send code'),
}
FAKE_TOKEN = 'eyJhbGciOiJub25lIn0.eyJuYW1lIjoiR29vZ2xlIFVzZXIifQ.sig'  # {"name":"Google User"}, unsigned test value

GIS_STUB = """
window.__gis={inits:[],renders:[]};
window.google={accounts:{id:{
  initialize:function(o){window.__gis.inits.push(o)},
  renderButton:function(el,o){window.__gis.renders.push(o);var b=document.createElement('div');b.className='gis-stub';b.setAttribute('role','button');b.style.cssText='height:40px;background:#fff;width:'+(o.width||300)+'px';b.textContent='GIS';el.appendChild(b)},
  prompt:function(){},cancel:function(){}
}}};"""
APPLE_STUB = """
window.__apple={inits:[],mode:'ok'};
window.AppleID={auth:{
  init:function(o){window.__apple.inits.push(o)},
  signIn:function(){var o=window.__apple.inits[window.__apple.inits.length-1];
    if(window.__apple.mode==='cancel')return Promise.reject({error:'popup_closed_by_user'});
    return Promise.resolve({authorization:{id_token:'apple.'+'test.token',code:'c',state:o.state},user:{name:{firstName:'Ada',lastName:'Apple'}}})}
}};"""

checks = []
def check(name, cond):
    assert cond, name
    checks.append(name)

def build(env_extra):
    env = {k: v for k, v in os.environ.items() if not k.startswith('VITE_GOOGLE') and not k.startswith('VITE_APPLE')}
    env.update(env_extra)
    subprocess.run(['npm', 'run', 'build'], cwd=ROOT, env=env, check=True, stdout=subprocess.DEVNULL)

def serve():
    proc = subprocess.Popen(['npx', 'vite', 'preview', '--port', str(PORT), '--strictPort', '--host', '127.0.0.1'],
                            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    for _ in range(100):
        try:
            urllib.request.urlopen(BASE + '/', timeout=1); return proc
        except Exception:
            time.sleep(0.2)
    stop(proc); raise SystemExit('vite preview did not start')

def stop(proc):
    # Kill the preview server's own process group by PID (never by name pattern).
    try: os.killpg(proc.pid, signal.SIGTERM)
    except ProcessLookupError: pass
    try: proc.wait(timeout=10)
    except subprocess.TimeoutExpired: os.killpg(proc.pid, signal.SIGKILL)

def run_browser(fn):
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM, headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors, script_hits, oauth_posts = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        state = {'auth_enabled': True, 'oauth_status': 200, 'oauth_body': None}
        page.route('**/api/auth/me', lambda r: r.fulfill(status=200, content_type='application/json',
            body=json.dumps({'enabled': state['auth_enabled'], 'user': None})) if state['auth_enabled'] is not None else r.fulfill(status=404, body='nope'))
        def oauth(route):
            oauth_posts.append(json.loads(route.request.post_data or '{}'))
            body = state['oauth_body'] or {'user': {'id': 'u1', 'email': 'ada@example.com', 'name': 'Ada Apple', 'role': 'patient', 'countryCode': 'UZ', 'cityId': 'UZ-TK'}}
            route.fulfill(status=state['oauth_status'], content_type='application/json', body=json.dumps(body))
        page.route('**/api/auth/oauth', oauth)
        def script(route, body):
            script_hits.append(route.request.url); route.fulfill(status=200, content_type='text/javascript', body=body)
        page.route('https://accounts.google.com/gsi/client', lambda r: script(r, GIS_STUB))
        page.route(re.compile(r'https://appleid\.cdn-apple\.com/.*'), lambda r: script(r, APPLE_STUB))
        def go(screen, lang):
            page.goto(f'{BASE}/?screen={screen}&lang={lang}'); page.wait_for_selector('.screen'); page.wait_for_timeout(250)
        fn(page, go, state, errors, script_hits, oauth_posts)
        check('no browser exceptions', not errors)
        browser.close()

def with_ids(page, go, state, errors, script_hits, oauth_posts):
    for lang, (g, a, orr, send) in LABELS.items():
        for screen in ['signup', 'login']:
            go(screen, lang)
            page.wait_for_selector('.oauth-block')
            check(f'{lang}/{screen}: Google button label', page.locator('.oauth-google span').inner_text() == g)
            check(f'{lang}/{screen}: Apple button label', page.locator('.oauth-apple span').inner_text() == a)
            check(f'{lang}/{screen}: "or" divider', page.locator('.oauth-divider').inner_text().strip() == orr)
            check(f'{lang}/{screen}: email-code form still shown', page.locator('.screen form input[type=email]').count() == 1 and send in page.locator('.screen form button[type=submit]').inner_text())
            check(f'{lang}/{screen}: buttons above the form', page.evaluate("document.querySelector('.oauth-block').compareDocumentPosition(document.querySelector('.screen form'))&Node.DOCUMENT_POSITION_FOLLOWING")>0)
            dims = page.evaluate("[...document.querySelectorAll('.oauth-button')].map(b=>({h:b.getBoundingClientRect().height,f:getComputedStyle(b).fontSize}))")
            check(f'{lang}/{screen}: buttons >=48px tall with 16px text', len(dims) == 2 and all(d['h'] >= 48 and d['f'] == '16px' for d in dims))
            check(f'{lang}/{screen}: Apple button is black with white text', page.evaluate("(()=>{const s=getComputedStyle(document.querySelector('.oauth-apple'));return s.backgroundColor==='rgb(0, 0, 0)'&&s.color==='rgb(255, 255, 255)'})()"))
            check(f'{lang}/{screen}: Google button is white', page.evaluate("getComputedStyle(document.querySelector('.oauth-google')).backgroundColor==='rgb(255, 255, 255)'"))
            page.wait_for_function('window.__gis && window.__gis.renders.length>0')
            r = page.evaluate('window.__gis.renders[window.__gis.renders.length-1]')
            init = page.evaluate('window.__gis.inits[window.__gis.inits.length-1]')
            check(f'{lang}/{screen}: GIS button uses the page language', r['locale'] == lang and r['text'] == 'continue_with')
            check(f'{lang}/{screen}: GIS gets the web client id and a hashed nonce', init['client_id'] == IDS['VITE_GOOGLE_WEB_CLIENT_ID'] and re.fullmatch(r'[0-9a-f]{64}', init['nonce']))
            check(f'{lang}/{screen}: no horizontal overflow at 390px', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('provider scripts loaded on demand', any('accounts.google.com/gsi/client' in u for u in script_hits) and any('appleid.cdn-apple.com' in u for u in script_hits))

    # Apple (web, Apple JS popup): raw nonce to the backend, SHA-256 of it to Apple, signup fields included.
    go('signup', 'en'); page.wait_for_selector('.oauth-block')
    page.get_by_label('Full name').fill('Typed Name')
    page.wait_for_function('window.__apple!==undefined')
    page.get_by_role('button', name='Continue with Apple').click()
    page.wait_for_selector('.home-header', timeout=5000)
    body = oauth_posts[-1]; init = page.evaluate('window.__apple.inits[window.__apple.inits.length-1]')
    check('apple: posts provider and id token', body['provider'] == 'apple' and body['idToken'] == 'apple.test.token')
    check('apple: Apple got sha256(raw nonce)', re.fullmatch(r'[0-9a-f]{64}', body['nonce']) and hashlib.sha256(body['nonce'].encode()).hexdigest() == init['nonce'])
    check('apple: Apple JS configured from build ids', init['clientId'] == IDS['VITE_APPLE_CLIENT_ID'] and init['redirectURI'] == IDS['VITE_APPLE_REDIRECT_URI'] and init['usePopup'] is True)
    check('apple: typed name and signup fields sent', body.get('name') == 'Typed Name' and body.get('role') == 'patient' and body.get('countryCode') == 'UZ' and 'cityId' in body)
    check('apple: success opens the role home', page.locator('.home-header').count() == 1)

    # Google (web, GIS callback): same contract; the nonce is rotated after each attempt.
    go('login', 'en'); page.wait_for_function('window.__gis.inits.length>0')
    before = page.evaluate('window.__gis.inits.length')
    hashed = page.evaluate('window.__gis.inits[window.__gis.inits.length-1].nonce')
    page.evaluate(f"window.__gis.inits[window.__gis.inits.length-1].callback({{credential:'{FAKE_TOKEN}'}})")
    page.wait_for_selector('.home-header', timeout=5000)
    body = oauth_posts[-1]
    check('google: posts provider, id token and raw nonce', body['provider'] == 'google' and body['idToken'] == FAKE_TOKEN and hashlib.sha256(body['nonce'].encode()).hexdigest() == hashed)
    check('google: name from the ID token when none typed', body.get('name') == 'Google User')

    # Backend errors are shown in the page language; cancelling is silent.
    for lang, code, text in [('en', 'email_not_verified', 'not verified'), ('ru', 'oauth_disabled', 'пока не включён'), ('uz', 'bad_token', 'tasdiqlanmadi')]:
        state['oauth_status'], state['oauth_body'] = 400, {'error': code}
        go('signup', lang); page.wait_for_function('window.__apple!==undefined')
        page.locator('.oauth-apple').click()
        page.wait_for_selector('.oauth-error')
        check(f'{lang}: {code} error message', text in page.locator('.oauth-error').inner_text() and page.locator('.oauth-block').count() == 1)
    state['oauth_status'], state['oauth_body'] = 200, None
    n = len(oauth_posts)
    go('signup', 'en'); page.wait_for_function('window.__apple!==undefined')
    page.evaluate("window.__apple.mode='cancel'")
    page.get_by_role('button', name='Continue with Apple').click(); page.wait_for_timeout(400)
    check('cancel is silent', page.locator('.oauth-error').count() == 0 and len(oauth_posts) == n and page.locator('.oauth-block').count() == 1)

    # Backend auth off (static demo): no OAuth buttons even with ids.
    state['auth_enabled'] = False
    go('signup', 'en')
    check('demo mode (auth disabled) hides OAuth buttons', page.locator('.oauth-block').count() == 0)
    state['auth_enabled'] = True

def without_ids(page, go, state, errors, script_hits, oauth_posts):
    for lang, (g, a, orr, send) in LABELS.items():
        for screen in ['signup', 'login']:
            go(screen, lang)
            page.wait_for_selector('.screen form button[type=submit]')
            check(f'no ids {lang}/{screen}: no OAuth buttons', page.locator('.oauth-block, .oauth-button').count() == 0 and g not in page.locator('.screen').inner_text())
            check(f'no ids {lang}/{screen}: email-code flow shows', page.locator('.screen form input[type=email]').count() == 1 and send in page.locator('.screen form button[type=submit]').inner_text())
            check(f'no ids {lang}/{screen}: no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    state['auth_enabled'] = None  # API unreachable: the labelled demo flow
    go('signup', 'en')
    check('no ids, no API: demo signup unchanged', page.get_by_role('button', name='Create demo account').count() == 1 and page.locator('.oauth-block').count() == 0)
    check('no ids: provider scripts never requested', not script_hits)

for label, env, fn in [('with ids', IDS, with_ids), ('without ids', {}, without_ids)]:
    build(env)
    server = serve()
    try:
        run_browser(fn)
    finally:
        stop(server)
    print(f'{label}: ok')
print(f'PASS: {len(checks)} OAuth UI checks')
