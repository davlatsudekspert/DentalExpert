"""Regressions found by the end-to-end journey QA (QA_JOURNEY_REPORT.md), flag off, against the local dev server (DE_PORT).
Each block is one defect that was reproduced in the real app first."""
import os,json,time,re
from playwright.sync_api import sync_playwright
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
HD={'content-type':'application/json'}
import random
def newctx(b,w=390,h=844):
    """A phone context with its own client address, so the per-address code limit (20 an hour) does not stop a long walk."""
    return b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,
                         extra_http_headers={'cf-connecting-ip':'10.%d.%d.%d'%(random.randrange(256),random.randrange(256),random.randrange(1,255))})
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
FRONT='http://de.test:'+os.environ.get("DE_PORT","8788")
def real_host(ctx):
    """Serves the app to this context as http://de.test (what a user of the live site gets: no design-study frame, which only
    localhost shows) by forwarding every request to the local server inside the browser driver (no DNS, no extra process)."""
    def fwd(route):
        req=route.request;h=dict(req.headers)
        for k in ('origin','referer'):
            if h.get(k,'').startswith(FRONT):h[k]=BASE+h[k][len(FRONT):]
        route.fulfill(response=route.fetch(url=BASE+req.url[len(FRONT):],headers=h))
    ctx.route(FRONT+'/**',fwd)
def real_signin(b,role,lang,w=390,h=844):
    ctx=newctx(b,w,h);real_host(ctx);pg=ctx.new_page();pg.goto(FRONT+'/api/auth/me')
    e=f'{role}+{time.time_ns()}@example.com'
    pg.evaluate("""async([e,role,lang])=>{const h={'content-type':'application/json'};const r=await (await fetch('/api/auth/request-code',{method:'POST',headers:h,body:JSON.stringify({email:e,name:'Ali Abduraxmonov',role,lang})})).json();
     await fetch('/api/auth/verify',{method:'POST',headers:h,body:JSON.stringify({email:e,code:r.devCode})})}""",[e,role,lang])
    return ctx,pg
def signin(b,role,lang):
    ctx=newctx(b)
    e=f'{role}+{time.time_ns()}@example.com'
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':role,'lang':lang}),headers=HD).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=HD)
    return ctx
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])

    # D1: the system back (Android back button / browser back = popstate) left the whole Learn section from a topic or its
    # slides; it must close the open viewer / sub-view first, like the in-app back arrow and the edge swipe do.
    for lang,learn,subj,slides,test in (('en','Learn','Propaedeutics','View the slides','Topic test'),
                                          ('uz','O‘rganish','Propedevtik','Taqdimotni ko‘rish','Mavzu bo‘yicha test'),
                                          ('ru','Обучение','Пропедевтика','Смотреть презентацию','Тест по теме')):
        ctx=signin(b,'student',lang);pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
        pg.locator('nav.bottom-nav button').filter(has_text=learn).click();pg.wait_for_timeout(700)
        pg.locator('main button').filter(has_text=subj).first.click();pg.wait_for_timeout(500)
        check(f'{lang}: subject shows its 8 topics',pg.locator('main .lg-row').count()==8);pg.locator('main .lg-row').first.click();pg.wait_for_timeout(500)
        pg.locator('main button').filter(has_text=slides).first.click();pg.wait_for_timeout(700)
        check(f'{lang}: slides open',pg.locator('.sl-bar').count()==1)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back closes the slides and stays on the topic',pg.locator('.sl-bar').count()==0 and pg.locator('main button').filter(has_text=test).count()>0)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back again shows the subject topic list, still in Learn',pg.locator('main button').filter(has_text=test).count()==0
              and pg.locator('main .lg-row').count()==8)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back again shows the subject list',pg.locator('main .lg-row').count()>8 and pg.locator('nav.bottom-nav button.active').filter(has_text=learn).count()==1)
        ctx.close()

    # D5: opening the app while offline (or while the API answers 5xx) showed a signed-in user the signed-out welcome screen, and
    # "Sign up" then offered the local DEMO form (password field, "Create demo account"). Now: a calm "cannot reach the server"
    # notice with Retry (also retried when the device comes back online); Retry signs the user straight back in.
    for lang,retry,fail in (('uz','Qayta urinib ko‘rish','abort'),('ru','Повторить','500'),('en','Retry','abort')):
        ctx=signin(b,'student',lang);pg=ctx.new_page()
        down=[True]
        def route(rt):
            if not down[0]:return rt.continue_()
            return rt.abort() if fail=='abort' else rt.fulfill(status=503,body='{"error":"down"}',content_type='application/json')
        ctx.route(re.compile(r'/api/'),route)
        pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_timeout(2500)
        check(f'{lang} ({fail}): no demo sign-up form, no password field',pg.locator('input[type=password]').count()==0 and 'demo' not in pg.locator('main').inner_text().lower())
        check(f'{lang} ({fail}): a cannot-reach-the-server notice with Retry',pg.get_by_role('button',name=retry).count()==1)
        for t in ('Hisob yaratish','Регистрация','Sign up','Create account'):
            if pg.locator('main button').filter(has_text=t).count():check(f'{lang}: no sign-up button while the server is unreachable',False)
        down[0]=False
        pg.get_by_role('button',name=retry).click();pg.wait_for_timeout(2000)
        check(f'{lang} ({fail}): Retry signs the user straight back in (home with the tab bar)',pg.locator('nav.bottom-nav').count()==1)
        ctx.close()
    # A first launch offline: language and role can still be chosen; the sign-up step shows the notice, not the demo form.
    ctx=newctx(b);pg=ctx.new_page()
    ctx.route(re.compile(r'/api/'),lambda rt:rt.abort())
    pg.goto(f'{BASE}/');pg.wait_for_timeout(1200);pg.locator('button').filter(has_text='English').first.click();pg.wait_for_timeout(400)
    pg.locator('.role-card').nth(3).click();pg.locator('button.button').last.click();pg.wait_for_timeout(600)
    check('first launch offline: the sign-up step shows the notice, not the demo form',pg.get_by_role('button',name='Retry').count()==1 and pg.locator('input[type=password]').count()==0)
    ctx.close()

    # D7: a double tap on "Create" made two identical groups (on Free the second one then opened the paywall), and a double tap on
    # "Send code" showed "please wait a moment" over the code screen although the code had been sent.
    ctx=newctx(b);pg=ctx.new_page();sent=[];pg.on('response',lambda r:'/api/auth/request-code' in r.url and sent.append(r.status))
    pg.goto(f'{BASE}/');pg.wait_for_timeout(1000);pg.locator('button').filter(has_text='English').first.click();pg.wait_for_timeout(400)
    pg.locator('.role-card').nth(2).click();pg.locator('button.button').last.click();pg.wait_for_timeout(500)
    pg.fill('input[name=fullname]','Double Tap');pg.fill('input[name=email]',f'dbl+{time.time_ns()}@example.com')
    pg.locator('form button[type=submit]').dblclick();pg.wait_for_timeout(1500)
    check('double tap on Send code: one request, no "wait" message on the code screen',sent==[200] and pg.locator('.toast').count()==0 and pg.locator('.completion-code input').count()==1)
    ctx.close()
    ctx=signin(b,'teacher','en');pg=ctx.new_page();pg.goto(f'{BASE}/?lang=en');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
    pg.get_by_role('button',name='My groups').first.click();pg.wait_for_timeout(1000)
    pg.locator('main.phone .classroom input').first.fill('Double');pg.locator('main.phone .classroom button.button').first.dblclick();pg.wait_for_timeout(2000)
    names=[g['name'] for g in ctx.request.get(BASE+'/api/classroom/groups').json().get('groups',[])]
    check(f'double tap on Create: one group ({names})',names==['Double'])
    # ...and on "Create" of a new assignment (two identical assignments), and on the topic test "Start" (must stay one test).
    gid=ctx.request.get(BASE+'/api/classroom/groups').json()['groups'][0]['id']
    pg.goto(f'{BASE}/?lang=en');pg.wait_for_selector('nav.bottom-nav',timeout=10000);pg.wait_for_timeout(600)
    pg.locator('main .lg-row, main .lg-list button').filter(has_text='Double').first.click();pg.wait_for_timeout(1200)
    pg.locator('main .lg-tabs button').nth(1).click();pg.wait_for_timeout(600)
    pg.locator('main .classroom button').filter(has_text='Give an assignment').first.click();pg.wait_for_timeout(600)
    f=pg.locator('.cr-form');f.locator('input:not([type=date])').first.fill('Essay one')
    if f.locator('textarea').count():f.locator('textarea').first.fill('Write about caries')
    f.locator('button.button').filter(has_text='Create').dblclick();pg.wait_for_timeout(2000)
    n=len(ctx.request.get(BASE+f'/api/classroom/assignments?groupId={gid}').json()['assignments'])
    check(f'double tap on Create assignment: one assignment ({n})',n==1)
    ctx.close()

    # D8: wider than 440 px (a phone turned sideways, an iPad, a desktop browser) the tab bar was not kept on screen: it is
    # position:sticky inside main.phone, whose overflow:hidden made it a scroll container, so the bar sat at the very end of
    # each page. It must stay at the bottom of the viewport while the page scrolls, without sideways page scroll.
    for w,h in ((844,390),(1024,768),(1280,720)):
        for role in ('student','teacher'):
            ctx,pg=real_signin(b,role,'ru',w,h);pg.goto(FRONT+'/?lang=ru');pg.wait_for_selector('nav.bottom-nav',timeout=10000);pg.wait_for_timeout(800)
            check(f'{w}x{h} {role}: the live-site layout (no design-study frame)',pg.locator('.studio.web-app').count()==1)
            for y in (0,500,100000):
                pg.evaluate(f'window.scrollTo(0,{y})');pg.wait_for_timeout(300)
                r=pg.evaluate("(()=>{const r=document.querySelector('nav.bottom-nav').getBoundingClientRect();return [r.top,r.bottom,innerHeight]})()")
                check(f'{w}x{h} {role}: tab bar on screen at scroll {y} ({[round(x) for x in r]})',r[0]>=0 and r[1]<=r[2]+1)
            check(f'{w}x{h} {role}: no sideways page scroll',not pg.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
            ctx.close()
    b.close()
print('journey_e2e: all passed')
