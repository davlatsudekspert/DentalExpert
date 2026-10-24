"""Photos: Profil > Image credits opens and lists every entry of public/credits.json (author, licence, Commons link), and the
photographs load (no broken <img>) on the main screens: credits, a subject card (hero) and the first slide of a topic,
at phone, small phone, short landscape and desktop sizes. Needs a server on DE_PORT serving dist (tools/ci_local_server.sh)."""
from playwright.sync_api import sync_playwright
import os,json,time
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim')
os.makedirs(OUT,exist_ok=True)
ROOT=os.path.join(os.path.dirname(__file__),'..')
credits=json.load(open(os.path.join(ROOT,'public','credits.json')))['images']
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
BROKEN="Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0||(!i.complete&&!i.loading)).map(i=>i.src.slice(-60))"
def loaded(pg,sel='img'):
    pg.wait_for_timeout(600)
    pg.evaluate("Array.from(document.images).forEach(i=>{i.loading='eager'})");pg.wait_for_timeout(700)
    return pg.evaluate(f"Array.from(document.querySelectorAll('{sel}')).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src.slice(-60))")
SIZES=[(360,640),(390,844),(1000,461),(1920,1080)]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    e=f'photos+{time.time_ns()}@example.com'
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':e,'name':'Rasm Test','role':'student','lang':'en'}).json()
    post('/api/auth/verify',{'email':e,'code':r['devCode']})
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    # Credits screen, in every language and theme-independent sizes.
    for lang,label in (('uz','Rasm manbalari'),('ru','Источники изображений'),('en','Image credits')):
        pg.goto(BASE+f'/?screen=settings&lang={lang}');pg.wait_for_selector('.pf-credits')
        check(f'[{lang}] Profil has the credits row',label in pg.locator('.pf-credits').inner_text())
        pg.locator('.pf-credits').click();pg.wait_for_selector('.cr-credits li')
        n=pg.locator('.cr-credits li').count()
        check(f'[{lang}] credits screen lists all {len(credits)} images',n==len(credits))
        txt=pg.inner_text('.cr-credits')
        check(f'[{lang}] every author and licence is shown',all(c['author'] in txt and c['license'] in txt for c in credits))
        check(f'[{lang}] links go to Commons file pages',pg.locator('.cr-credits a[href^="https://commons.wikimedia.org/wiki/File:"]').count()==len(credits))
        check(f'[{lang}] credits images have alt text',pg.evaluate("Array.from(document.querySelectorAll('.cr-credits img')).every(i=>i.alt.trim().length>3)"))
        check(f'[{lang}] credits images load',loaded(pg,'.cr-credits img')==[])
        pg.locator('.quiz-run-bar button').click();pg.wait_for_selector('.cr-credits',state='detached')
    pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.pf-credits');pg.locator('.pf-credits').click();pg.wait_for_selector('.cr-credits li');pg.screenshot(path=OUT+'/photos-credits.png')
    # A subject hero and a slide cover per size: Learn > curriculum > subject (with a photo) > topic > slides.
    TAB={'uz':'O‘quv reja','ru':'Учебный план','en':'Curriculum'}
    sid=sorted({c['subject'] for c in credits if c.get('subject')})
    titles={'radio':'Dental radiology','endo':'Endodontics','ped':'Paediatric dentistry'}
    for w,h in SIZES:
        pg.set_viewport_size({'width':w,'height':h})
        pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn');pg.locator('.learn-tabs button',has_text=TAB['en']).first.click();pg.wait_for_timeout(400)
        for sub in ('Dental radiology','Paediatric dentistry'):
            pg.locator('.lg-row',has_text=sub).first.click();pg.wait_for_selector('.lg-hero-photo')
            check(f'{w}x{h} {sub}: hero photo has alt, size and loads',pg.evaluate("(()=>{const i=document.querySelector('.lg-hero-photo');return i.alt.length>3&&i.width>0&&i.height>0})()") and loaded(pg,'.lg-hero-photo')==[])
            box=pg.locator('.lg-hero').bounding_box();check(f'{w}x{h} hero fits the width',box['x']>=0 and box['x']+box['width']<=w+1)
            pg.screenshot(path=OUT+f'/photos-hero-{w}x{h}.png')
            pg.locator('.lg-row').first.click();pg.wait_for_selector('button:has-text("View the slides")');pg.locator('button:has-text("View the slides")').click();pg.wait_for_selector('.sl-cover-photo')
            check(f'{w}x{h} {sub}: slide cover photo loads',loaded(pg,'.sl-cover-photo')==[])
            check(f'{w}x{h} slide cover has no horizontal overflow',pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
            pg.screenshot(path=OUT+f'/photos-cover-{w}x{h}.png')
            pg.locator('.sl-bar button[aria-label="Close"]').click();pg.wait_for_selector('.sl-player',state='detached')
            pg.go_back() if False else None
            pg.goto(BASE+'/?screen=courses&lang=en');pg.wait_for_selector('.learn');pg.locator('.learn-tabs button',has_text=TAB['en']).first.click();pg.wait_for_timeout(300)
    # Whole app: no broken images on the main screens.
    for sc in ('home','courses','settings','anatomy'):
        pg.goto(BASE+f'/?screen={sc}&lang=en');pg.wait_for_timeout(900)
        check(f'screen {sc}: no broken images',loaded(pg)==[])
    check('no page errors',errs==[])
    b.close()
