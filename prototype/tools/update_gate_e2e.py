"""The "update the app" screen in the browser, against a server with the build limits of tools/appver_test.py (DE_PORT, default 8804).
A browser has no native build number, so window.__DE_TEST_BUILD__ stands in for it (it is honoured on the web only)."""
import os
from playwright.sync_api import sync_playwright
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8804")}'
n=0
def check(name,cond,info=''):
    global n
    assert cond,name+' '+str(info);n+=1
def page(b,build,platform='android',lang='en',vw=390,vh=844,abort=False,init=True):
    ctx=b.new_context(viewport={'width':vw,'height':vh});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    if init:pg.add_init_script("window.__DE_TEST_BUILD__={platform:'%s',build:%d}"%(platform,build))
    if abort:pg.route('**/api/app/config',lambda r:r.abort())
    pg.goto(f'{BASE}/?lang={lang}&screen=student&role=student');pg.wait_for_timeout(2500);return ctx,pg,errs
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None,args=['--no-sandbox'])
    ctx,pg,errs=page(b,1049)
    g=pg.locator('.update-gate');check('old build: update screen shown',g.count()==1)
    check('it is a modal alert dialog',g.get_attribute('role')=='alertdialog' and g.get_attribute('aria-modal')=='true')
    check('title and body in English',pg.locator('#ug-t').inner_text()=='Update required' and 'no longer supported' in pg.locator('#ug-b').inner_text())
    a=g.locator('a.button');check('store link comes from the server',a.get_attribute('href')=='https://play.google.com/store/apps/details?id=test.app' and a.get_attribute('target')=='_blank')
    bx=a.bounding_box();check('button is at least 48 px high',bx and bx['height']>=47.5,bx)
    check('no sideways overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('no browser exceptions',not errs,errs);ctx.close()
    ctx,pg,errs=page(b,1050);check('minimum build: no update screen',pg.locator('.update-gate').count()==0);ctx.close()
    ctx,pg,errs=page(b,1200);check('newer build: no update screen',pg.locator('.update-gate').count()==0);ctx.close()
    ctx,pg,errs=page(b,29,'ios');g=pg.locator('.update-gate');check('old iOS build: shown, but no link (iOS link is invalid on the server)',g.count()==1 and g.locator('a').count()==0);ctx.close()
    ctx,pg,errs=page(b,1049,abort=True);check('config unreachable: the app carries on',pg.locator('.update-gate').count()==0);ctx.close()
    ctx,pg,errs=page(b,0,init=False);check('web without a build number: never blocked',pg.locator('.update-gate').count()==0);ctx.close()
    for lang,title in (('uz','Yangilash kerak'),('ru','Требуется обновление')):
        ctx,pg,errs=page(b,1049,lang=lang);check(f'{lang}: title',pg.locator('#ug-t').inner_text()==title);ctx.close()
    for vw,fs in ((320,None),(320,'200%')):
        ctx,pg,errs=page(b,1049,lang='ru',vw=vw,vh=640)
        if fs:pg.evaluate(f"document.documentElement.style.fontSize='{fs}'");pg.wait_for_timeout(300)
        r=pg.evaluate("(()=>{const d=document.querySelector('.update-gate>div').getBoundingClientRect();return {l:d.left,r:d.right,t:d.top,b:d.bottom,vw:innerWidth,vh:innerHeight,sw:document.documentElement.scrollWidth}})()")
        check(f'{vw}px {fs or ""}: card inside the screen',r['l']>=0 and r['r']<=r['vw'] and r['sw']<=r['vw'],r);ctx.close()
    b.close()
print('PASS',n,'checks')
