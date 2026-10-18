"""Store screenshots from the real app in native mode (no prototype chrome). Needs a build made with VITE_API_BASE=http://127.0.0.1:8788 served by wrangler pages dev on :8788 (.dev.vars AUTH_DEV_ECHO=1) and CHROMIUM_PATH.
Output: store-assets/shots/{play,ios69}/<lang>/NN-name.png (fictional sample data only)."""
from playwright.sync_api import sync_playwright
import os,json,time,pathlib
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';ROOT=pathlib.Path('store-assets/shots')
DEV={'play':(390,780),'ios69':(430,932)}
def api(rq,path,body=None,token=None,method='POST'):
    h={'content-type':'application/json','x-client':'native','origin':'https://localhost'}
    if token:h['authorization']='Bearer '+token
    r=getattr(rq,method.lower())(BASE+path,data=json.dumps(body) if body is not None else None,headers=h);return r.json() if r.body() else {}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    rq=p.request.new_context()
    def login(role,name,lang='en'):
        e=f'shot-{role}-{time.time_ns()}@example.com'
        r=api(rq,'/api/auth/request-code',{'email':e,'name':name,'role':role,'lang':lang});v=api(rq,'/api/auth/verify',{'email':e,'code':r['devCode']});return v['token'],v['user']
    # sample classroom (fictional), one per language so every screenshot is fully localised
    L={'en':('Therapeutic dentistry · Year 3','Describe the stages of caries','3–5 sentences','Sample patient A.','Check-up and cleaning'),
       'ru':('Терапевтическая стоматология · 3 курс','Опишите стадии кариеса','3–5 предложений','Пациент А. (пример)','Осмотр и чистка'),
       'uz':('Terapevtik stomatologiya · 3-kurs','Kariesning bosqichlarini tasvirlang','3–5 gap','Bemor A. (namuna)','Ko‘rik va tozalash')}
    teach={}
    for lg,(gname,tt_,tb_,_,_) in L.items():
        tt,tu=login('teacher','Dr. Sample Teacher',lg)
        g=api(rq,'/api/classroom/groups',{'name':gname},tt)['group']
        decks=json.load(open(f'public/decks/manifest.{lg}.json'))
        api(rq,'/api/classroom/assignments',{'groupId':g['id'],'kind':'quiz','title':decks[0]['title'],'deckId':decks[0]['id'],'key':[q['correct'] for q in decks[0]['quiz']],'dueDate':'2026-11-20'},tt)
        api(rq,'/api/classroom/assignments',{'groupId':g['id'],'kind':'task','title':tt_,'body':tb_,'dueDate':'2026-11-25'},tt)
        for i,nick in enumerate(['Zebra','Falcon',None]):
            st,su=login('student',f'Sample Student {i}',lg)
            api(rq,'/api/classroom/join',{'code':g['code'],'nickname':nick},st)
        teach[lg]=tt
    su_tok,su_user=login('student','Sample Student')
    dt,du=login('dentist','Dr. Sample Dentist')
    def patient(lg):return [{'id':'p1','name':L[lg][3],'phone':'+998 90 000 00 00','note':'','teeth':{'16':'filling','26':'crown','36':'rootcanal','46':'caries','18':'missing','11':'healthy','21':'implant','37':'caries'},'visits':[{'date':'2026-10-12','text':L[lg][4]}],'createdAt':'2026-10-12'}]
    for dev,(w,h) in DEV.items():
        for lang in ('en','ru','uz'):
            out=ROOT/dev/lang;out.mkdir(parents=True,exist_ok=True)
            def page(token=None,uid=None,seed=None):
                ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=3,is_mobile=True,has_touch=True)
                init="window.webkit={messageHandlers:{bridge:{postMessage(){}}}};"
                if token:init+=f"try{{localStorage.setItem('de_token','{token}')}}catch(e){{}};"
                init+=f"try{{localStorage.setItem('de_lang','{lang}')}}catch(e){{}};"
                if seed:init+=f"try{{localStorage.setItem('de_patients:{uid}',{json.dumps(json.dumps(seed))})}}catch(e){{}};"
                ctx.add_init_script(init);pg=ctx.new_page()
                try:
                    cdp=ctx.new_cdp_session(pg);cdp.send('Emulation.setSafeAreaInsetsOverride',{'insets':{'top':59,'bottom':34,'left':0,'right':0}})
                except Exception:pass
                return ctx,pg
            shot=lambda pg,n:pg.screenshot(path=str(out/f'{n}.png'))
            # 1 welcome
            c,pg=page();pg.goto(f'{BASE}/?screen=onboard&lang={lang}');pg.wait_for_selector('.intro');pg.wait_for_timeout(3500);shot(pg,'01-welcome');c.close()
            # 2 atlas exploded + pulp
            c,pg=page(su_tok);pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('.role-tiles');pg.wait_for_timeout(600)
            pg.locator('.role-tiles button').nth(5).click();pg.wait_for_selector('.atlas3d canvas',timeout=30000);pg.wait_for_selector('.atlas3d-loading',state='detached',timeout=30000);pg.wait_for_timeout(2500)
            chips=pg.locator('.atlas3d-chips button');chips.nth(0).click();pg.wait_for_timeout(2400);chips.nth(3).click();pg.wait_for_timeout(2200);shot(pg,'02-atlas');c.close()
            # 3 lessons
            c,pg=page(su_tok);pg.goto(f'{BASE}/?screen=courses&lang={lang}');pg.wait_for_selector('.deck-card');pg.wait_for_timeout(1200);shot(pg,'03-lessons');c.close()
            # 4 odontogram
            c,pg=page(dt,du['id'],patient(lang));pg.goto(f'{BASE}/?screen=record&lang={lang}');pg.wait_for_selector('.patients');pg.wait_for_timeout(500)
            pg.locator('.patients .cr-row').first.click();pg.wait_for_selector('.pt-teeth');pg.wait_for_timeout(600);shot(pg,'04-odontogram');c.close()
            # 5 classroom (teacher)
            c,pg=page(teach[lang]);pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('.role-tiles');pg.wait_for_timeout(600)
            pg.locator('.classroom .cr-row').first.click();pg.wait_for_timeout(900);pg.locator('.classroom').scroll_into_view_if_needed();pg.evaluate("document.getElementById('sec-groups').scrollIntoView()");pg.wait_for_timeout(500);shot(pg,'05-classroom');c.close()
            # 6 daily picture task
            c,pg=page(su_tok);pg.goto(f'{BASE}/?screen=courses&lang={lang}');pg.wait_for_selector('.learn .chips');pg.wait_for_timeout(500)
            pg.locator('.learn .chips button').nth(2).click();pg.wait_for_selector('.daily-card');pg.locator('.daily-card').nth(1).click();pg.wait_for_selector('.daily-plate');pg.wait_for_timeout(800)
            pg.locator('.quiz-run-options button').nth(0).click();pg.wait_for_timeout(500);shot(pg,'06-daily-picture');c.close()
            print(dev,lang,'done')
    b.close()
