"""Dry run of the Maestro flows in tools/ios_sim/flows on Linux, without a Mac: it reads the same YAML files and runs
them command by command in Playwright WebKit (Chromium as a fallback) on an iPhone 16 sized screen. It is NOT the
simulator test, but it copies the parts of Maestro + iOS WebKit that made real runs fail while an older, hand-written
Chromium copy of the flows passed (run 39102430794):

 * The accessibility tree as iOS WebKit exposes it: a button, link or tab is ONE element named by its text; outside
   those, every DOM text node is its own static text (React renders `Savol {i} / {n}` as several nodes, so a bare "4"
   in the eyebrow matched the answer "4"); form fields are named by their label, placeholder and value; aria-hidden,
   inert and display:none content is not there, and an open aria-modal dialog hides everything outside it.
 * Maestro's text matching: the whole text must match the regex (or equal it); `index` picks among the matches in
   tree order; "visible" means inside the screen, even when the floating bottom bar or the keyboard covers it.
 * Taps go to screen coordinates (the centre of the element), with no scrolling into view. A tap whose point is
   covered by another element (the floating navigation bar) or by the on-screen keyboard fails here; on the simulator
   it silently hits whatever is on top (in run 39102430794 "Topshiriq berish" opened Qidiruv).
 * The software keyboard: while a text field has focus the bottom 336 pt (keyboard + WebKit's "Done" bar) are
   covered, a virtual "Done" element is visible and tapping it closes the keyboard (common/dismiss_keyboard.yaml).
   Focusing a field scrolls it above the keyboard, as WebKit does.
 * inputText types into the focused field only (the first character, 0.5 s pause, then the rest, as Maestro does)
   and fails when no field has focus instead of losing the text.
 * runScript runs the same scripts/*.js with Maestro's http/json/output globals (through curl).

Supported commands: launchApp, tapOn, inputText, assertVisible, assertNotVisible, extendedWaitUntil, scrollUntilVisible,
runFlow (file/env/when/commands), runScript, repeat (times), takeScreenshot, waitForAnimationToEnd, hideKeyboard,
openLink (dentalexpert://j?... links are handed to the app's join event, as the native appUrlOpen listener does).

Usage (from prototype/, after `npm ci`; ports are examples):
  VITE_API_BASE=http://127.0.0.1:18789 npx vite build --outDir /tmp/dist-sim --emptyOutDir
  npm run build   # start_local_api.sh serves prototype/dist
  API_PORT=18788 PROXY_PORT=18789 PERSIST_DIR=/tmp/d1 LOG_DIR=/tmp/d1/logs tools/ios_sim/start_local_api.sh
  E2E_PROXY=http://127.0.0.1:18789 python3 tools/ios_sim/chromium_dryrun.py /tmp/dist-sim /tmp/dry-shots [flow.yaml ...]
  LOG_DIR=/tmp/d1/logs tools/ios_sim/stop_local_api.sh
Env: E2E_PROXY (must match the VITE_API_BASE of the build), DRYRUN_BROWSER (webkit | chromium, default webkit),
CHROMIUM_PATH (for chromium), PLAYWRIGHT_BROWSERS_PATH (where `python3 -m playwright install webkit` put WebKit).
Without flow arguments it runs 01..04 in order, with the same -e values run_flows.sh passes."""
import json, os, re, subprocess, sys, time, urllib.parse
from pathlib import Path
import yaml
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
DIST = Path(sys.argv[1]); OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'dry-shots'); OUT.mkdir(parents=True, exist_ok=True)
FLOWS = [Path(f).resolve() for f in sys.argv[3:]] or [HERE / 'flows' / f for f in
         ('01_onboarding_uz.yaml', '02_dentist.yaml', '03_teacher.yaml', '04_student.yaml')]
PROXY = os.environ.get('E2E_PROXY', 'http://127.0.0.1:18789')
ENGINE = os.environ.get('DRYRUN_BROWSER', 'webkit')
RUN = str(int(time.time()))
ENV = {'DENTIST_EMAIL': f'maestro-dentist-{RUN}@example.test', 'TEACHER_EMAIL': f'maestro-teacher-{RUN}@example.test',
       'STUDENT_EMAIL': f'maestro-student-{RUN}@example.test', 'GROUP_NAME': f'Maestro Guruh {RUN}', 'E2E_PROXY': PROXY,
       'QUIZ_OPTION_RE': subprocess.check_output(['node', str(HERE / 'quiz_regex.mjs'), 'uz'], text=True),
       'TOPIC_OPTION_RE': subprocess.check_output(['node', str(HERE / 'quiz_regex.mjs'), 'uz', 'card-01'], text=True)}
MIME = {'.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png',
        '.json': 'application/json', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg',
        '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.pdf': 'application/pdf'}
W, H = 393, 852                      # iPhone 16 in points
INSETS = {'top': '59px', 'bottom': '34px', 'left': '0px', 'right': '0px'}
KEYBOARD = 336                       # software keyboard 291 pt + WebKit's form accessory ("Done") bar 45 pt
LOOKUP = 17.0                        # Maestro's default wait for tapOn / assertVisible, seconds


class FlowError(AssertionError):
    pass


# The accessibility tree, roughly as iOS WebKit hands it to XCUITest (see the docstring).
SNAPSHOT_JS = r"""(kb) => {
 const vw = innerWidth, vh = innerHeight, out = [];
 const norm = s => (s || '').replace(/\s+/g, ' ').trim();
 const shown = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
 const gone = e => e.getAttribute('aria-hidden') === 'true' || e.hasAttribute('inert') || !shown(e);
 const atomic = e => /^(BUTTON|SUMMARY)$/.test(e.tagName) || (e.tagName === 'A' && e.hasAttribute('href')) ||
   /^(button|link|tab|menuitem|checkbox|radio|switch|option)$/.test(e.getAttribute('role') || '');
 const field = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
 const textOf = e => { let s = ''; const w = n => { if (n.nodeType === 3) s += n.nodeValue; else if (n.nodeType === 1 && !gone(n)) {
   if (n.tagName === 'IMG' && n.alt) s += ' ' + n.alt + ' '; else if (n.getAttribute('aria-label') && n !== e) s += ' ' + n.getAttribute('aria-label') + ' ';
   else for (const c of n.childNodes) w(c); } }; for (const c of e.childNodes) w(c); return norm(s); };
 const labelOf = e => { if (e.getAttribute('aria-label')) return norm(e.getAttribute('aria-label'));
   const by = e.getAttribute('aria-labelledby'); if (by) return norm(by.split(/\s+/).map(i => document.getElementById(i)?.textContent || '').join(' '));
   const l = e.closest('label') || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`));
   if (!l) return ''; let s = ''; const w = n => { if (n === e) return; if (n.nodeType === 3) s += n.nodeValue; else if (n.nodeType === 1 && !field(n) && !gone(n)) for (const c of n.childNodes) w(c); };
   for (const c of l.childNodes) w(c); return norm(s); };
 const box = r => ({x: r.left, y: r.top, w: r.width, h: r.height});
 const push = (node, owner, texts, r, kind) => { texts = texts.filter(Boolean); if (!texts.length || r.width <= 0 || r.height <= 0) return;
   const on = r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
   out.push({i: out.length, kind, texts, rect: box(r), on, full: r.top >= -0.5 && r.left >= -0.5 && r.bottom <= vh + 0.5 && r.right <= vw + 0.5, owner}); };
 let tag = 0; const own = e => { if (!e.dataset.dr) e.dataset.dr = 'n' + (++tag) + '_' + Math.random().toString(36).slice(2, 6); return e.dataset.dr; };
 const modals = [...document.querySelectorAll('[aria-modal="true"]')].filter(e => !e.closest('[aria-hidden="true"]') && shown(e) && e.getClientRects().length);
 const root = modals.length ? modals[modals.length - 1] : document.body;
 const walk = e => { if (gone(e)) return;
   if (field(e)) { if (e.type === 'hidden') return; const v = e.tagName === 'SELECT' ? (e.selectedOptions[0]?.text || '') : (e.type === 'password' ? '' : e.value);
     push(e, own(e), [labelOf(e), norm(e.getAttribute('placeholder')), norm(v)], e.getBoundingClientRect(), 'field'); return; }
   if (atomic(e)) { push(e, own(e), [norm(e.getAttribute('aria-label')) || textOf(e)], e.getBoundingClientRect(), 'button'); return; }
   if (e.tagName === 'IMG') { if (e.alt) push(e, own(e), [norm(e.alt)], e.getBoundingClientRect(), 'image'); return; }
   if (e.getAttribute('role') && e.getAttribute('aria-label') && /^(img|progressbar|status|alert|heading)$/.test(e.getAttribute('role')))
     push(e, own(e), [norm(e.getAttribute('aria-label'))], e.getBoundingClientRect(), 'group');
   for (const c of e.childNodes) {
     if (c.nodeType === 3) { const t = norm(c.nodeValue); if (!t) continue; const rg = document.createRange(); rg.selectNodeContents(c);
       push(c, own(e), [t], rg.getBoundingClientRect(), 'text'); }
     else if (c.nodeType === 1) walk(c); } };
 walk(root);
 if (kb) out.push({i: out.length, kind: 'keyboard', texts: ['Done'], rect: {x: vw - 70, y: vh - kb, w: 60, h: 45}, on: true, full: true, owner: '__done'});
 return out; }"""


class Device:
    def __init__(self, browser):
        self.browser, self.ctx, self.pg, self.errors = browser, None, None, []

    # ── app lifecycle ────────────────────────────────────────────────────────────────────────────────────────────
    def launch(self, clear=True):
        if self.ctx is None or clear:
            if self.ctx: self.ctx.close()
            kw = dict(viewport={'width': W, 'height': H}, device_scale_factor=3, has_touch=True)
            if ENGINE != 'webkit': kw['is_mobile'] = True
            self.ctx = self.browser.new_context(**kw)
            # Capacitor's iOS bridge (so the app takes its native code paths) and the iPhone safe areas.
            self.ctx.add_init_script("window.webkit={messageHandlers:{bridge:{postMessage(){}}}};"
                                     "(function f(){if(document.documentElement)document.documentElement.classList.add('native');else setTimeout(f,0)})()")
            self.ctx.route('http://localhost/**', self._serve)
            self.pg = self.ctx.new_page()
            self.pg.on('pageerror', lambda e: self.errors.append(str(e)))
        self.pg.goto('http://localhost/index.html')
        self.pg.wait_for_timeout(800)

    def _serve(self, route):
        path = urllib.parse.urlparse(route.request.url).path.lstrip('/') or 'index.html'
        f = DIST / path
        if f.is_dir(): f = f / 'index.html'
        if not f.exists(): return route.fulfill(status=404, body='not found')
        body = f.read_bytes()
        if f.suffix == '.css':
            text = body.decode('utf-8')
            for k, v in INSETS.items(): text = re.sub(r'env\(safe-area-inset-' + k + r'(?:,[^)]*)?\)', v, text)
            body = text.encode('utf-8')
        route.fulfill(status=200, body=body, headers={'content-type': MIME.get(f.suffix, 'application/octet-stream')})

    # ── screen model ─────────────────────────────────────────────────────────────────────────────────────────────
    def keyboard_up(self):
        return self.pg.evaluate("""() => { const e = document.activeElement; if (!e) return false;
          if (e.isContentEditable) return true; if (e.tagName === 'TEXTAREA') return !e.readOnly && !e.disabled;
          return e.tagName === 'INPUT' && !e.readOnly && !e.disabled &&
            !/^(button|submit|reset|checkbox|radio|range|color|file|image|hidden)$/.test(e.type); }""")

    def snapshot(self):
        kb = self.keyboard_up()
        return self.pg.evaluate(SNAPSHOT_JS, KEYBOARD if kb else 0), kb

    @staticmethod
    def matches(pattern, el):
        rx = re.compile(pattern, re.S)
        return any(t == pattern or rx.fullmatch(t) for t in el['texts'])

    def find(self, pattern, full=False):
        els, _ = self.snapshot()
        return [e for e in els if (e['full'] if full else e['on']) and self.matches(pattern, e)]

    def wait_for(self, pattern, timeout=LOOKUP, gone=False):
        end = time.time() + timeout
        while True:
            found = self.find(pattern)
            if bool(found) != gone: return found
            if time.time() > end:
                raise FlowError(('still visible: ' if gone else 'element not found: ') + pattern)
            self.pg.wait_for_timeout(250)

    # ── gestures ─────────────────────────────────────────────────────────────────────────────────────────────────
    def tap(self, pattern, index=0):
        found = self.wait_for(pattern)
        if index >= len(found):
            raise FlowError(f'tapOn "{pattern}" index {index}: only {len(found)} match(es)')
        el = found[index]
        r = el['rect']
        x = min(max(r['x'] + r['w'] / 2, 1), W - 1); y = min(max(r['y'] + r['h'] / 2, 1), H - 1)
        if el['owner'] == '__done':
            self.pg.evaluate('document.activeElement && document.activeElement.blur()'); self.settle(); return
        kb = self.keyboard_up()
        if kb and y >= H - KEYBOARD:
            raise FlowError(f'tapOn "{pattern}" at y={y:.0f} would hit the on-screen keyboard (close it first: '
                            f'common/dismiss_keyboard.yaml, and scroll the element up)')
        hit = self.pg.evaluate("""([x, y, owner]) => { const h = document.elementFromPoint(x, y); const t = document.querySelector(`[data-dr="${owner}"]`);
          if (!h || !t) return 'nothing'; if (h === t || t.contains(h) || h.contains(t)) return '';
          const d = h.closest('button,a,[role],nav,label,input') || h;
          return (d.tagName.toLowerCase() + (d.className && typeof d.className === 'string' ? '.' + d.className.trim().split(/\s+/).join('.') : '') +
                  ' "' + (d.getAttribute('aria-label') || d.textContent || '').trim().slice(0, 40) + '"'); }""", [x, y, el['owner']])
        if hit:
            raise FlowError(f'tapOn "{pattern}" at ({x:.0f},{y:.0f}) is covered by {hit}; on the simulator the tap goes there. '
                            f'Scroll the element clear first (scrollUntilVisible with centerElement)')
        if ENGINE == 'webkit': self.pg.touchscreen.tap(x, y)
        else: self.pg.mouse.click(x, y)
        self.settle()
        self.reveal_focused()

    def reveal_focused(self):
        # WebKit scrolls a newly focused field above the keyboard.
        if self.keyboard_up():
            self.pg.evaluate("""(kb) => { const r = document.activeElement.getBoundingClientRect(); const room = innerHeight - kb - 8;
              if (r.bottom > room) scrollBy(0, r.bottom - room); else if (r.top < 60) scrollBy(0, r.top - 60); }""", KEYBOARD)
            self.pg.wait_for_timeout(150)

    def type(self, text):
        if not self.keyboard_up():
            raise FlowError(f'inputText "{text}": no text field has focus (the text would be lost)')
        self.pg.keyboard.type(text[:1]); self.pg.wait_for_timeout(500)
        if len(text) > 1: self.pg.keyboard.type(text[1:], delay=30)
        self.pg.wait_for_timeout(300)

    def swipe_up(self):
        # Maestro scrolls DOWN with a swipe from the lower to the upper middle; the scroller under the finger moves.
        self.pg.mouse.move(W / 2, H / 2)
        self.pg.mouse.wheel(0, H * 0.4)
        self.pg.wait_for_timeout(450)

    def scroll_until_visible(self, pattern, timeout, center):
        end = time.time() + timeout
        while True:
            found = self.find(pattern, full=True)
            if found:
                if center:
                    r = found[0]['rect']; dy = r['y'] + r['h'] / 2 - H / 2
                    if abs(dy) > H * 0.2:
                        self.pg.mouse.move(W / 2, H / 2); self.pg.mouse.wheel(0, dy); self.pg.wait_for_timeout(450)
                return
            if time.time() > end: raise FlowError(f'scrollUntilVisible: "{pattern}" not found')
            self.swipe_up()

    def settle(self, timeout=3.0):
        self.pg.wait_for_timeout(350)
        end = time.time() + timeout
        while time.time() < end and self.pg.evaluate(
                "document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity).length"):
            self.pg.wait_for_timeout(150)


class Runner:
    def __init__(self, dev):
        self.dev, self.output, self.shots = dev, {}, None

    def sub(self, v, env):
        if isinstance(v, str):
            def rep(m):
                k = m.group(1).strip()
                if k.startswith('output.'): return str(self.output.get(k[7:], m.group(0)))
                return str(env.get(k, m.group(0)))
            return re.sub(r'\$\{([^}]+)\}', rep, v)
        if isinstance(v, dict): return {k: self.sub(x, env) for k, x in v.items()}
        if isinstance(v, list): return [self.sub(x, env) for x in v]
        return v

    def run_file(self, path, env):
        docs = list(yaml.safe_load_all(path.read_text(encoding='utf-8')))
        head, cmds = (docs[0] or {}), (docs[1] if len(docs) > 1 else [])
        env = {**{k: str(v) for k, v in (head.get('env') or {}).items()}, **env}
        self.run(cmds, env, path.parent)

    def visible(self, cond, env):
        if 'visible' in cond: return bool(self.dev.find(self.sub(cond['visible'], env)))
        if 'notVisible' in cond: return not self.dev.find(self.sub(cond['notVisible'], env))
        raise FlowError(f'unsupported condition {cond}')

    def run(self, cmds, env, base):
        d = self.dev
        for raw in cmds or []:
            name, arg = (raw, None) if isinstance(raw, str) else next(iter(raw.items()))
            # runFlow / repeat: their commands are substituted when they run (outputs may change in between)
            a = arg if name in ('runFlow', 'repeat') else self.sub(arg, env)
            print('   ', f'{name}: {json.dumps(a, ensure_ascii=False)[:120]}' if a is not None else name, flush=True)
            if name == 'launchApp':
                d.launch(clear=bool((a or {}).get('clearState')))
            elif name == 'tapOn':
                sel = a if isinstance(a, dict) else {'text': a}
                d.tap(sel['text'], int(sel.get('index', 0)))
            elif name == 'inputText':
                d.type(str(a))
            elif name == 'assertVisible':
                d.wait_for(a if isinstance(a, str) else a['text'])
            elif name == 'assertNotVisible':
                d.wait_for(a if isinstance(a, str) else a['text'], timeout=5, gone=True)
            elif name == 'extendedWaitUntil':
                t = float(a.get('timeout', 10000)) / 1000
                if 'visible' in a: d.wait_for(a['visible'], t)
                else: d.wait_for(a['notVisible'], t, gone=True)
            elif name == 'scrollUntilVisible':
                el = a['element']; el = el if isinstance(el, str) else el['text']
                if a.get('direction', 'DOWN') != 'DOWN': raise FlowError('only direction DOWN is emulated')
                d.scroll_until_visible(el, float(a.get('timeout', 20000)) / 1000, bool(a.get('centerElement')))
            elif name == 'takeScreenshot':
                d.pg.screenshot(path=str(self.shots / f'{a}.png'))
            elif name == 'waitForAnimationToEnd':
                d.settle(float((a or {}).get('timeout', 3000)) / 1000)
            elif name == 'hideKeyboard':
                d.pg.evaluate('document.activeElement && document.activeElement.blur()')
            elif name == 'openLink':
                link = a if isinstance(a, str) else a['link']
                if not link.startswith('dentalexpert://j'): raise FlowError(f'openLink: only dentalexpert://j links are emulated ({link})')
                q = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
                d.pg.evaluate("d => dispatchEvent(new CustomEvent('de:join', {detail: d}))",
                              {'code': q.get('c', [''])[0], 'testId': q.get('a', [None])[0]})
                d.settle()
            elif name == 'runScript':
                spec = a if isinstance(a, dict) else {'file': a}
                self.script(base / spec['file'], {**env, **{k: str(v) for k, v in (spec.get('env') or {}).items()}})
            elif name == 'runFlow':
                spec = arg if isinstance(arg, dict) else {'file': arg}
                sub_env = {**env, **{k: self.sub(str(v), env) for k, v in (spec.get('env') or {}).items()}}
                if 'when' in spec and not self.visible(spec['when'], env):
                    continue
                if 'file' in spec: self.run_file(base / self.sub(spec['file'], env), sub_env)
                else: self.run(spec.get('commands'), sub_env, base)
            elif name == 'repeat':
                for _ in range(int(arg.get('times', 1))): self.run(arg['commands'], env, base)
            else:
                raise FlowError(f'command not emulated by the dry run: {name}')

    def script(self, path, env):
        # Maestro's GraalJS globals: env variables, http.get, json(), output, console.log.
        shim = ("const {execFileSync}=require('child_process');const env=JSON.parse(process.argv[2]);for(const k in env)globalThis[k]=env[k];"
                "globalThis.output={};globalThis.json=s=>JSON.parse(s);"
                "globalThis.http={get(u){const o=execFileSync('curl',['-s','--noproxy','*','-w','\\n%{http_code}',u],{encoding:'utf8'});"
                "const i=o.lastIndexOf('\\n');const st=+o.slice(i+1);return {status:st,ok:st>=200&&st<300,body:o.slice(0,i)}}};"
                "require(process.argv[1]);process.stdout.write('\\n__OUT__'+JSON.stringify(globalThis.output));")
        r = subprocess.run(['node', '-e', shim, str(path), json.dumps(env)], capture_output=True, text=True)
        if r.returncode: raise FlowError(f'runScript {path.name} failed: {(r.stderr or r.stdout).strip()[-400:]}')
        self.output.update(json.loads(r.stdout.rsplit('__OUT__', 1)[1]))


def main():
    failed = []
    with sync_playwright() as p:
        if ENGINE == 'webkit':
            browser = p.webkit.launch()
        else:
            browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None, args=['--no-sandbox', '--no-proxy-server',
                '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'])
        print(f'engine: {ENGINE} {browser.version} · screen {W}x{H} · accounts *-{RUN}@example.test', flush=True)
        dev = Device(browser)
        for flow in FLOWS:
            run = Runner(dev); run.shots = OUT / flow.stem; run.shots.mkdir(parents=True, exist_ok=True)
            t0 = time.time(); print(f'== {flow.stem}', flush=True)
            try:
                run.run_file(flow, dict(ENV))
                print(f'PASS {flow.stem} ({time.time() - t0:.0f}s)', flush=True)
            except Exception as e:  # noqa: BLE001 - report and go on with the next flow, as run_flows.sh does
                failed.append(flow.stem)
                if dev.pg: dev.pg.screenshot(path=str(run.shots / 'zz-after-failure.png'))
                print(f'FAIL {flow.stem} ({time.time() - t0:.0f}s): {str(e)[:500]}', flush=True)
        errs = [e for e in dev.errors if 'plugin is not implemented' not in e]
        if errs: print('page errors:', errs[:5])
        browser.close()
    print('DRY RUN ' + ('FAILED: ' + ', '.join(failed) if failed else 'OK'))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
