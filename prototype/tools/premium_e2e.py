"""Premium on the paywall (flag ON build + server): `DE_PORT=… CHROMIUM_PATH=… python3 tools/premium_e2e.py on|off`.
on: student/teacher/dentist at 360x640 and 390x844 see the role plan AND a separate Premium group, prices and saving taken from
src/proConfig.ts, the one-line note under the table, no horizontal overflow, no buy button on the web; a held plan of another role
gets the upgrade offer; an active Premium shows 'Premium' in Profil; patients get no paywall. off: flag-off build has no paywall or Premium text."""
from playwright.sync_api import sync_playwright
import os,json,sys,time,re,pathlib,urllib.request
from classroom_test_lib import sql
MODE=sys.argv[1] if len(sys.argv)>1 else 'on'
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim');os.makedirs(OUT,exist_ok=True)
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
CFG=pathlib.Path(__file__).resolve().parent.parent.joinpath('src/proConfig.ts').read_text()
m=re.search(r"PREMIUM=\{[^\n]*monthly:\{product:'[a-z_]+',usd:([\d.]+)\},yearly:\{product:'[a-z_]+',usd:([\d.]+)\}",CFG)
PM,PY=m.group(1),m.group(2);SAV=round((1-float(PY)/(float(PM)*12))*100)
SIZES=[(360,640),(390,844)]
def account(b,role,trial_over=True,size=(390,844)):
    ctx=b.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=2,is_mobile=True,has_touch=True)
    e=f'prem{role}+{time.time_ns()}@example.com'
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':e,'name':'Prem Tester','role':role,'lang':'en'}).json()
    v=post('/api/auth/verify',{'email':e,'code':r['devCode']}).json()
    if trial_over:sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{e}'")
    return ctx,v['user']['id'],e
def hook(uid,product,txn):
    ev={'id':f'e2e-{time.time_ns()}','type':'INITIAL_PURCHASE','app_user_id':uid,'product_id':product,'store':'APP_STORE','original_transaction_id':txn,
        'event_timestamp_ms':int(time.time()*1000),'expiration_at_ms':int((time.time()+30*86400)*1000)}
    urllib.request.urlopen(urllib.request.Request(BASE+'/api/billing/webhook',data=json.dumps({'event':ev}).encode(),headers={'content-type':'application/json','authorization':'ci-webhook-secret'},method='POST'))
def overflow(pg):return pg.evaluate('document.documentElement.scrollWidth>innerWidth+1')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    if MODE=='off':
        ctx,_,_=account(b,'student',False);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
        pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf',timeout=8000)
        check('flag off: no plan row, no Premium text anywhere',pg.locator('.pf-plan').count()==0 and 'Premium' not in pg.locator('body').inner_text())
        check('flag off: no paywall element',pg.locator('.pw').count()==0 and not errs)
        print('off ok');b.close();sys.exit(0)
    for role in ('student','teacher','dentist'):
        for size in SIZES:
            ctx,_,_=account(b,role,True,size);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
            pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-plan',timeout=8000)
            pg.locator('.pf-plan').click();pg.wait_for_selector('.pw',timeout=4000)
            txt=pg.locator('.pw-premium').inner_text()
            check(f'{role} {size}: separate Premium group with the tagline','Everything unlocked: all roles' in txt)
            check(f'{role} {size}: Premium prices from the config',f'${PM}' in txt and f'${PY}' in txt)
            check(f'{role} {size}: yearly saving computed ({SAV}%)',f'save {SAV}%' in txt)
            check(f'{role} {size}: the role plan group is still there and separate',pg.locator('.pw-plans').count()==2 and pg.locator('.pw-premium .pw-plan').count()==2)
            check(f'{role} {size}: one line under the table: Premium = Pro for every role',pg.locator('.pw-compare .pw-premium-line').count()==1 and 'Premium' in pg.locator('.pw-compare .pw-premium-line').inner_text())
            check(f'{role} {size}: web has no buy button',pg.locator('.pw .button').count()==0 and 'Subscriptions are bought in the iOS or Android app' in pg.locator('.pw').inner_text())
            check(f'{role} {size}: no horizontal overflow',not overflow(pg))
            pg.screenshot(path=f'{OUT}/premium-{role}-{size[0]}.png');ctx.close()
    # other languages carry the tagline
    ctx,_,_=account(b,'teacher');pg=ctx.new_page()
    for lang,s in (('uz','Hammasi ochiq: barcha rollar'),('ru','Всё открыто: все роли')):
        pg.goto(BASE+f'/?screen=settings&lang={lang}');pg.wait_for_selector('.pf-plan');pg.locator('.pf-plan').click();pg.wait_for_selector('.pw-premium')
        check(f'{lang}: Premium tagline',s in pg.locator('.pw-premium').inner_text() and not overflow(pg))
    ctx.close()
    # a plan of another role is held: Premium is offered as the upgrade
    ctx,uid,e=account(b,'student');hook(uid,'de_student_monthly','e2e-held-'+str(time.time_ns()))
    post=lambda path,body:ctx.request.put(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    post('/api/auth/role',{'role':'teacher'});pg=ctx.new_page()
    pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-plan');pg.locator('.pf-plan').click();pg.wait_for_selector('.pw')
    check('held plan: note and Premium upgrade line','one plan for all your roles' in pg.locator('.pw').inner_text().lower() and pg.locator('.pw-premium').count()==1)
    ctx.close()
    # active Premium: Profil row says Premium, and it is unlocked for another role too
    ctx,uid,e=account(b,'student');hook(uid,'de_premium_yearly','e2e-prem-'+str(time.time_ns()))
    pg=ctx.new_page();pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-plan')
    check('Profil Tarif row shows Premium when active',pg.locator('.pf-plan').inner_text().startswith('Premium'))
    ctx.close()
    ctx,_,_=account(b,'patient',False);pg=ctx.new_page()
    pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf',timeout=8000)
    check('patient: no plan row, no paywall',pg.locator('.pf-plan').count()==0 and pg.locator('.pw').count()==0)
    print('on ok');b.close()
