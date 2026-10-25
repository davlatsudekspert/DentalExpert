"""Regressions found by the end-to-end journey QA (QA_JOURNEY_REPORT.md) with Pro ON: a server with PRO_ENABLED=1 on DE_PORT
(D1_PERSIST = its --persist-to directory) serving the VITE_PRO_ENABLED=1 build. Each block is one defect reproduced in the app first."""
import os,json,time,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from classroom_test_lib import sql
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
HD={'content-type':'application/json'}
import random
def newctx(b,w=390,h=844):
    """A phone context with its own client address, so the per-address code limit (20 an hour) does not stop a long walk."""
    return b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,
                         extra_http_headers={'cf-connecting-ip':'10.%d.%d.%d'%(random.randrange(256),random.randrange(256),random.randrange(1,255))})
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def free_user(b,role,lang,size=(390,844)):
    """A signed-in account of `role` whose trial has ended (Free tier)."""
    ctx=newctx(b,size[0],size[1])
    e=f'{role}+{time.time_ns()}@example.com'
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':role,'lang':lang}),headers=HD).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=HD)
    sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{e}'")
    me=ctx.request.get(BASE+'/api/auth/me').json()['user']
    check(f'{role}: the account is on the Free tier',me['pro']['active'] is False and me['pro']['reason']=='free')
    return ctx
# The paywall must be the top layer wherever it opens: the element under the middle of its close button belongs to it.
ON_TOP="""()=>{const pw=[...document.querySelectorAll('.quiz-run.pw')].pop();if(!pw)return 'no paywall';const x=pw.querySelector('.quiz-run-bar button');
 const r=x.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return pw.contains(e)?'top':'covered by '+(e&&e.closest('[class]')?.className)}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])

    # D2: a Free student taps "Explode" / a Pro layer in the 3D atlas: the paywall opened BEHIND the full-screen atlas (z-index), so
    # nothing seemed to happen. Same for a Free teacher pressing "Present on a screen" inside the slide player.
    for lang,explode in (('uz','Ajratish'),('ru','Разделить'),('en','Explode')):
        ctx=free_user(b,'student',lang);pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
        pg.locator('nav.bottom-nav button').nth(2).click();pg.wait_for_timeout(800)
        pg.locator('main button').filter(has_text='3D').first.click();pg.wait_for_selector('.atlas3d',timeout=15000);pg.wait_for_timeout(1500)
        locks=pg.evaluate("()=>[...document.querySelectorAll('.atlas3d-chips button')].map(b=>!!b.querySelector('.lucide-lock'))")
        check(f'{lang}: Free atlas marks the exploded view and pulp/vessels/root with a lock, not enamel/dentin',locks==[True,False,False,True,True,True])
        pg.locator('.atlas3d button').filter(has_text=explode).first.click();pg.wait_for_timeout(800)
        check(f'{lang}: atlas explode on Free opens the paywall on top of the atlas',pg.evaluate(ON_TOP)=='top')
        pg.locator('.quiz-run.pw .quiz-run-bar button').click();pg.wait_for_timeout(400)
        check(f'{lang}: closing the paywall returns to the atlas',pg.locator('.quiz-run.pw').count()==0 and pg.locator('.atlas3d').count()==1)
        ctx.close()
    for lang,learn,subj,slides,present in (('en','Learn','Propaedeutics','View the slides','Present on a screen'),
                                           ('ru','Обучение','Пропедевтика','Смотреть презентацию','На большой экран')):
        ctx=free_user(b,'teacher',lang);pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
        pg.locator('nav.bottom-nav button').filter(has_text=learn).click();pg.wait_for_timeout(700)
        pg.locator('main button').filter(has_text=subj).first.click();pg.wait_for_timeout(500)
        pg.locator('main .lg-row').first.click();pg.wait_for_timeout(500)
        pg.locator('main button').filter(has_text=slides).first.click();pg.wait_for_selector('.sl-player',timeout=10000)
        pg.locator(f'.sl-player button[aria-label="{present}"]').click();pg.wait_for_timeout(800)
        check(f'{lang}: Free teacher "present" in the slide player opens the paywall on top',pg.evaluate(ON_TOP)=='top')
        ctx.close()

    # D3: a Free teacher could open the general-test builder (pick topics, counts, deadline) and was refused only at the very end.
    # The button carries the lock and opens the paywall at once; on the trial it opens the builder.
    for lang,general in (('uz','Umumiy test berish'),('ru','Дать общий тест'),('en','Give a general test')):
        for free in (True,False):
            ctx=free_user(b,'teacher',lang) if free else None
            if not free:
                ctx=newctx(b);e=f'teacher+{time.time_ns()}@example.com'
                r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali','role':'teacher','lang':lang}),headers=HD).json()
                ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=HD)
            check(f'{lang}: group created',ctx.request.post(BASE+'/api/classroom/groups',data=json.dumps({'name':'Gen Group'}),headers=HD).ok)
            pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000);pg.wait_for_timeout(600)
            pg.locator('main .lg-row, main .lg-list button').filter(has_text='Gen Group').first.click();pg.wait_for_timeout(1200)
            btn=pg.locator('main button').filter(has_text=general).first
            has_lock=btn.locator('.lucide-lock').count()==1
            btn.click();pg.wait_for_timeout(900)
            if free:check(f'{lang}: Free teacher: general test button has a lock and opens the paywall right away',has_lock and pg.evaluate(ON_TOP)=='top')
            else:check(f'{lang}: trial teacher: no lock, the general test builder opens',not has_lock and pg.locator('.quiz-run.pw').count()==0 and pg.locator('main input[type=search], main input').count()>0)
            ctx.close()

    # D4: Admin, Pro tab: a 3-month grant for an e-mail without an account was listed as "Cheksiz (… · 3 oy)" (unlimited AND 3 months).
    ctx=newctx(b)
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':'davlatsudekspert@gmail.com','name':'Owner','role':'dentist','lang':'uz'}),headers=HD).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':'davlatsudekspert@gmail.com','code':r['devCode']}),headers=HD)
    pg=ctx.new_page();pg.goto(f'{BASE}/?lang=uz');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
    pg.locator('nav.bottom-nav button').last.click();pg.wait_for_timeout(800)
    pg.locator('main button').filter(has_text='Admin').first.click();pg.wait_for_timeout(1000)
    pg.locator('.admin-tabs button').filter(has_text='Pro').click();pg.wait_for_timeout(900)
    for unit,amount,label,word in (('months','3','3 oy','3 oy'),('days','10','10 kun','10 kun'),('forever','','Cheksiz','Cheksiz')):
        target=f'pending{unit}+{time.time_ns()}@example.com'
        pg.locator('.admin-pro input').first.fill(target);pg.locator('.admin-pro select').first.select_option(unit)
        if amount:pg.locator('.admin-pro input[type=number]').first.fill(amount)
        pg.locator('.admin-pro button.button').first.click();pg.wait_for_timeout(1200)
        txt=pg.evaluate("t=>{const s=[...document.querySelectorAll('.quiz-run-body strong')].find(e=>e.textContent===t);return s?s.parentElement.querySelector('small').textContent:''}",target)
        head=txt.split(' · bergan')[0]
        others=[w for w in ('Cheksiz','3 oy','10 kun') if w!=word]
        check(f'pending {label} grant listed as {label} only: "{txt[:60]}"',word in head and not any(o in head for o in others) and 'boshlanadi' in txt)
    ctx.close()

    # D6: the Free-plan line on a student's paywall listed "1 group" (a teacher limit; students join any number of classes).
    for role,want in (('student',False),('teacher',True),('dentist',True)):
        for lang,word in (('uz','guruh'),('ru','групп'),('en','group')):
            ctx=free_user(b,role,lang);pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
            pg.evaluate("()=>{}");pg.locator('nav.bottom-nav button').last.click();pg.wait_for_timeout(700)
            pg.locator('main .pf-plan').first.click();pg.wait_for_timeout(700)
            line=pg.locator('.quiz-run.pw .pw-free').inner_text()
            check(f'{role} {lang}: Free line {"names" if want else "does not name"} the group limit: "{line[:70]}"',(word in line.lower())==want)
            ctx.close()
    b.close()
print('journey_pro_e2e: all passed')
