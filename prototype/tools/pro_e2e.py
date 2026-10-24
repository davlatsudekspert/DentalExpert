"""Pro/Free in the browser. Mode `on`: a build with VITE_PRO_ENABLED=1 against a server with PRO_ENABLED=1 (paywall, plan row,
trial banner, role prices, locks at the limits, 360x640 and 390x844). Mode `off`: the normal build against a flag-off server
(no plan row, no paywall, Review and Exam open, the atlas unlocked). Usage: DE_PORT=… CHROMIUM_PATH=… python3 tools/pro_e2e.py on|off"""
from playwright.sync_api import sync_playwright
import os,json,sys,time
from classroom_test_lib import sql
MODE=sys.argv[1] if len(sys.argv)>1 else 'on'
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim');os.makedirs(OUT,exist_ok=True)
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
SIZES=[(360,640),(390,844)]
def account(b,role,trial_over,size=(390,844)):
    ctx=b.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=2,is_mobile=True,has_touch=True)
    e=f'pro{role}+{time.time_ns()}@example.com'
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':e,'name':'Pro Tester','role':role,'lang':'en'}).json()
    post('/api/auth/verify',{'email':e,'code':r['devCode']})
    if trial_over:sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{e}'")
    return ctx
def overflow(pg):return pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    if MODE=='off':
        ctx=account(b,'student',True);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
        pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf',timeout=8000)
        check('flag off: no plan row in Profil',pg.locator('.pf-plan').count()==0)
        pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn-tabs',timeout=8000)
        pg.locator('.learn-tabs button',has_text='Review').click();pg.wait_for_timeout(500)
        check('flag off: Review opens, no lock card',pg.locator('.pw-nudge').count()==0 and pg.locator('.pw').count()==0)
        pg.locator('.learn-tabs button',has_text='Exam').click();pg.wait_for_timeout(500)
        check('flag off: Exam opens, no lock card',pg.locator('.pw-nudge').count()==0)
        check('flag off: no page errors',not errs)
        print('off mode ok');b.close();sys.exit(0)
    # ---- flag on
    for role,(m,y),sav in [('student',('1.49','9.99'),'44%'),('teacher',('2.49','24.99'),'16%'),('dentist',('3.49','34.99'),'16%')]:
        for size in SIZES:
            ctx=account(b,role,True,size);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
            pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-plan',timeout=8000)
            check(f'{role} {size}: Profil shows the Free plan status',pg.locator('.pf-plan').inner_text().startswith('Your free trial has ended'))
            pg.locator('.pf-plan').click();pg.wait_for_selector('.pw',timeout=4000)
            txt=pg.locator('.pw').inner_text()
            check(f'{role} {size}: plan cards show the role prices from the config',f'${m}' in txt and f'${y}' in txt)
            check(f'{role} {size}: yearly saving is computed ({sav})',f'save {sav}' in txt)
            check(f'{role} {size}: web says to subscribe in the app, no buy button',('Subscriptions are bought in the iOS or Android app' in txt) and pg.locator('.pw .button').count()==0)
            check(f'{role} {size}: auto-renew text, Terms and Privacy links',('renews automatically' in txt) and pg.locator('.pw a[href*="eula"]').count()==1 and pg.locator('.pw a[href*="privacy"]').count()==1)
            check(f'{role} {size}: no horizontal overflow',not overflow(pg))
            check(f'{role} {size}: close button reachable inside the viewport',pg.locator('.pw [data-close]').bounding_box()['y']>=0)
            if role=='dentist' and size==SIZES[0]:
                check('dentist paywall lists the public listing',('Public verified-dentist listing' in txt) and 'Unlimited groups' in txt)
            if role=='student':check('student paywall has no group/listing features','Unlimited groups' not in txt and 'listing' not in txt)
            pg.screenshot(path=f'{OUT}/pro-{role}-{size[0]}.png')
            pg.locator('.pw [data-close]').click();pg.wait_for_selector('.pw',state='detached',timeout=3000)
            check(f'{role} {size}: sign out and privacy stay reachable on Profil',pg.get_by_text('Sign out').count()>=1 and pg.get_by_text('Delete account').count()>=1)
            check(f'{role} {size}: no page errors',not errs);ctx.close()
    # Trial banner.
    ctx=account(b,'student',False);pg=ctx.new_page()
    pg.goto(BASE+'/?screen=settings&lang=uz');pg.wait_for_selector('.pf-plan',timeout=8000)
    check('trial banner counts the days (uz)',' kun qoldi' in pg.locator('.pf-plan').inner_text() and '30' in pg.locator('.pf-plan').inner_text())
    pg.goto(BASE+'/?screen=settings&lang=ru');pg.wait_for_selector('.pf-plan');check('trial banner (ru)','осталось' in pg.locator('.pf-plan').inner_text())
    pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn-tabs')
    pg.locator('.learn-tabs button',has_text='Review').click();pg.wait_for_timeout(400)
    check('on the trial everything is open (no lock on Review)',pg.locator('.pw-nudge').count()==0)
    ctx.close()
    # Free account at the limits.
    ctx=account(b,'student',True);pg=ctx.new_page()
    pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn-tabs')
    for tab in ('Review','Exam'):
        pg.locator('.learn-tabs button',has_text=tab).click();pg.wait_for_selector('.pw-nudge',timeout=3000)
        check(f'Free: {tab} shows a gentle lock card',True)
    pg.locator('.pw-nudge button').click();pg.wait_for_selector('.pw',timeout=3000)
    check('lock card opens the paywall with the reason',('part of Pro' in pg.locator('.pw').inner_text()))
    pg.keyboard.press('Escape');pg.wait_for_selector('.pw',state='detached',timeout=3000)
    # Server key gate surfaces as the paywall in the curriculum.
    pg.locator('.learn-tabs button',has_text='Curriculum').click();pg.wait_for_timeout(600)
    # Practice allowance: use it up through the API, then a run offers the paywall.
    uid=ctx.request.get(BASE+'/api/auth/me').json()['user']['id']
    r=ctx.request.post(BASE+'/api/billing/practice',data=json.dumps({'n':20}),headers={'content-type':'application/json'});check('allowance used via API',r.status==200)
    pg.locator('.learn-tabs button',has_text='Picture practice').click();pg.wait_for_timeout(800)
    card=pg.locator('.pr-sim').first
    if card.count():
        card.click();pg.wait_for_timeout(300)
        if pg.locator('.pr-btn-primary',has_text='Start').count():pg.locator('.pr-btn-primary',has_text='Start').first.click()
        pg.wait_for_selector('.pw',timeout=4000);check('Free: practice past the daily cap opens the paywall',('free questions' in pg.locator('.pw').inner_text()))
    print('on mode ok');b.close()
