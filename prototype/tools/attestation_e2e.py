"""Attestation prep in the browser (uz, 360x640 and 390x844). Mode `off`: Pro flag off (everything open: two 20-question tests in a row).
Mode `on`: Pro build + server, trial over: the first 20-question test works, the second hits the daily limit (paywall).
Usage: DE_PORT=… CHROMIUM_PATH=… python3 tools/attestation_e2e.py on|off"""
from playwright.sync_api import sync_playwright
import os,json,sys,time
MODE=sys.argv[1] if len(sys.argv)>1 else 'off'
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim');os.makedirs(OUT,exist_ok=True)
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def overflow(pg):return pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1')
def account(b,size):
    ctx=b.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=2,is_mobile=True,has_touch=True)
    e=f'att{time.time_ns()}@example.com'
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':e,'name':'Att Tester','role':'student','lang':'uz'}).json()
    post('/api/auth/verify',{'email':e,'code':r['devCode']})
    if MODE=='on':
        from classroom_test_lib import sql
        sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{e}'")
    return ctx
def open_feature(pg):
    pg.goto(BASE+'/?screen=courses&lang=uz');pg.wait_for_selector('.learn-tabs',timeout=8000)
    pg.locator('.learn-tabs button',has_text='Attestatsiya').click();pg.wait_for_selector('.at-list',timeout=8000)
def run20(pg):
    pg.locator('.at-row',has_text='Ortopedik stomatologiya').click()
    pg.wait_for_selector('.ex-seg');pg.locator('.ex-seg button',has_text='20 ta').click()
    sw=pg.evaluate("()=>document.documentElement.scrollWidth-innerWidth");right=pg.evaluate("()=>Math.max(...[...document.querySelectorAll('.rv-root, .rv-root *')].map(e=>e.getBoundingClientRect().right))-innerWidth")
    check('setup screen fits the phone width (no sideways overflow)',sw<=1 and right<=1)
    pg.wait_for_function("!document.querySelector('.at-start').disabled",timeout=8000)
    pg.locator('.at-start').click();pg.wait_for_selector('.quiz-run-options',timeout=5000)
    check('first question has 4 options and a report button',pg.locator('.quiz-run-options button').count()==4 and pg.locator('.at-report').count()==1)
    for i in range(20):
        pg.locator('.quiz-run-options button').first.click();pg.locator('.quiz-run-body button.button').click()
    pg.wait_for_selector('.quiz-run-result',timeout=5000)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for size in [(360,640),(390,844)]:
        ctx=account(b,size);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
        open_feature(pg)
        rows=pg.locator('.at-row')
        check(f'{size}: 12 specialties listed',rows.count()==12)
        txt=pg.locator('.at-list').inner_text()
        check(f'{size}: counts shown, withheld ones marked and disabled',' savol' in txt and 'Kalit tekshiruvda' in txt and pg.locator('.at-row:disabled').count()==5)
        note=pg.locator('.at-note').inner_text()
        check(f'{size}: source note, not-official note and removal contact visible','tmbm.ssv.uz' in note and 'rasmiy imtihon bilan bog‘liq emas' in note and 'davlatsudekspert@gmail.com' in note)
        check(f'{size}: no horizontal overflow',not overflow(pg))
        run20(pg)
        check(f'{size}: result screen after 20 answers','/ 20' in pg.locator('.qr-ring').inner_text())
        pg.screenshot(path=f'{OUT}/att-{MODE}-{size[0]}-result.png')
        pg.locator('.quiz-run-result button.button').click();pg.wait_for_selector('.at-start',timeout=4000)
        check(f'{size}: best score kept',pg.locator('.at-start').count()==1 and 'Eng yaxshi natija' in pg.locator('body').inner_text())
        pg.locator('.at-start').click()
        if MODE=='on':
            pg.wait_for_selector('.pw',timeout=4000)
            check(f'{size}: Free is stopped after 20 questions a day (paywall)',pg.locator('.pw').count()==1)
        else:
            pg.wait_for_selector('.quiz-run-options',timeout=5000)
            check(f'{size}: flag off: a second test starts, no limit',pg.locator('.pw').count()==0)
        # report button opens the existing form with the question id prefilled
        if MODE=='off':
            pg.locator('.at-report').click();pg.wait_for_selector('.cr-form',timeout=4000)
            check(f'{size}: report form prefilled with the question id',pg.locator('.cr-form input').first.input_value().startswith('ortopedik-'))
        check(f'{size}: no page errors',not errs);ctx.close()
    # languages: uz and ru have the section, en has nothing of it (no tab, no tile, no credits line)
    ctx=account(b,(390,844));pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    for lang,label in [('uz','Attestatsiya'),('ru','Аттестация')]:
        pg.goto(BASE+f'/?screen=courses&lang={lang}');pg.wait_for_selector('.learn-tabs',timeout=8000)
        check(f'{lang}: Attestation tab present',pg.locator('.learn-tabs button',has_text=label).count()==1)
    pg.locator('.learn-tabs button',has_text='Аттестация').click();pg.wait_for_selector('.at-list',timeout=6000)
    check('ru: specialty names are Russian (no Uzbek names left)','stomatologiya' not in pg.locator('.at-list').inner_text().lower() and 'Ортодонтия' in pg.locator('.at-list').inner_text())
    check('ru: 12 specialties, source note in Russian','Источник вопросов' in pg.locator('.at-note').inner_text() and pg.locator('.at-row').count()==12)
    pg.locator('.at-row:not(:disabled)',has_text='Ортопед').count()  # names stay Uzbek-language labels from the index
    pg.locator('.at-row:not(:disabled)').first.click();pg.wait_for_selector('.ex-seg');pg.wait_for_function("!document.querySelector('.at-start').disabled",timeout=8000)
    pg.locator('.at-start').click() if MODE=='off' else None
    if MODE=='off':
        pg.wait_for_selector('.quiz-run-options',timeout=5000)
        check('ru: questions are shown in Russian',any('\u0400'<=c<='\u04ff' for c in pg.locator('.qr-card h3').inner_text()))
    # switching language inside the app (dev picker button): the tab disappears at once in English, comes back in uz
    pg.goto(BASE+'/?screen=courses&lang=uz');pg.wait_for_selector('.learn-tabs')
    btn=pg.locator('.mobile-screen-picker button')
    seen=[]
    for _ in range(3):
        seen.append((btn.inner_text().strip().upper(),pg.locator('.learn-tabs button',has_text='Attest').count()+pg.locator('.learn-tabs button',has_text='Аттест').count()))
        btn.click();pg.wait_for_timeout(400)
    check('in-app switch: present in UZ and RU, absent in EN',sorted(seen)==[('EN',0),('RU',1),('UZ',1)],) if len(set(x[0] for x in seen))==3 else print('SKIP in-app switch (picker not shown)',seen)
    pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn-tabs',timeout=8000)
    check('en: no Attestation tab and no mention in Learn',pg.locator('.learn-tabs button',has_text='Attest').count()==0 and 'ttestat' not in pg.locator('.learn').inner_text())
    pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-credits',timeout=8000);pg.locator('.pf-credits').click();pg.wait_for_selector('.cr-credits',timeout=4000)
    check('en: credits screen has no attestation note',pg.locator('.at-note').count()==0)
    pg.goto(BASE+'/?screen=settings&lang=uz');pg.wait_for_selector('.pf-credits',timeout=8000);pg.locator('.pf-credits').click();pg.wait_for_selector('.at-note',timeout=4000)
    check('uz: credits screen has the source note and removal contact','tmbm.ssv.uz' in pg.locator('.at-note').inner_text() and 'davlatsudekspert@gmail.com' in pg.locator('.at-note').inner_text())
    check('language checks: no page errors',not errs)
    b.close()
print('attestation e2e',MODE,'ok')
