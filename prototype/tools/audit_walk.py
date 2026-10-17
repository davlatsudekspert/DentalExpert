"""Signs in per role (API) and screenshots the main screens into /tmp/audit for a visual review. Needs wrangler dev on :8788."""
from playwright.sync_api import sync_playwright
import os,json,time,sys
BASE='http://127.0.0.1:8788';OUT='/tmp/audit';os.makedirs(OUT,exist_ok=True)
SCREENS={'patient':['home','search','profile','clinics','booking','anatomy','courses','settings'],
 'dentist':['dashboard','record','chart','edit','settings'],
 'teacher':['teacher','courses','settings'],'student':['student','courses','caseStudy','settings']}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    for role,scr in SCREENS.items():
        ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=1.5,is_mobile=True,has_touch=True)
        e=f'{role}+{time.time_ns()}@example.com'
        r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmon','role':role,'lang':'uz'}),headers={'content-type':'application/json'}).json()
        ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers={'content-type':'application/json'})
        pg=ctx.new_page()
        for s in scr:
            pg.goto(f'{BASE}/?screen={s}&lang=uz');pg.wait_for_timeout(1800)
            txt=pg.evaluate("document.querySelector('.phone').innerText")
            fake=[w for w in ['Kamila','Aziza','Jasur','Sardor','Karimova','Alimov','DEMO','08','124','72%'] if w in txt]
            print(role,s,'fake-ish:',fake)
            pg.screenshot(path=f'{OUT}/{role}-{s}.png',full_page=True)
        ctx.close()
    b.close()
