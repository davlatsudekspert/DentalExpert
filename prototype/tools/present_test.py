"""Guard for showing the app on a TV or monitor.
- The live site (any non-dev host) has no design-study frame: no screen index, no fake status bar.
- Localhost keeps the design studio.
- Present mode fills a 1920x1080 screen, and on an upright phone the player is turned so the slide is landscape.
Usage: python3 tools/present_test.py [dist_dir] [out_dir]"""
import functools,http.server,os,sys,threading
from playwright.sync_api import sync_playwright
DIST=sys.argv[1] if len(sys.argv)>1 else 'dist'
OUT=sys.argv[2] if len(sys.argv)>2 else None
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path.split('?')[0])):self.path='/index.html'
        return super().send_head()
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=DIST));port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
fails=[];n=0
def check(name,ok,info=''):
    global n;n+=1
    if not ok:fails.append(f'{name} {info}')
LIVE=f'http://tv.test:{port}';DEV=f'http://127.0.0.1:{port}'
def open_slides(pg,base):
    pg.goto(f'{base}/?screen=courses&lang=uz&role=student');pg.wait_for_timeout(900)
    pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(300);pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(500)
    btn=pg.locator('.lg-section > .button').first.inner_text()
    pg.locator('.lg-section > .button').first.click();pg.wait_for_timeout(600)
    return btn
box="s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight}}"
with sync_playwright() as p:
    exe='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None
    b=p.chromium.launch(executable_path=exe,args=[f'--host-resolver-rules=MAP tv.test 127.0.0.1'])
    errs=[]
    tv=b.new_page(viewport={'width':1920,'height':1080});tv.on('pageerror',lambda e:errs.append(str(e)))
    tv.goto(f'{LIVE}/?screen=home&lang=uz');tv.wait_for_timeout(900)
    check('live: no design index',tv.locator('.studio-aside').count()==0)
    check('live: no fake status bar',tv.locator('.statusbar').count()==0)
    ph=tv.evaluate(box,'.phone')
    check('live: app is a centred column',ph and ph['w']<=560 and abs(ph['l']-(1920-ph['w'])/2)<2,str(ph))
    if OUT:tv.screenshot(path=f'{OUT}/live-1920.png')
    btn=open_slides(tv,LIVE)
    # The button counts the closing references slide too, so it matches the player's "1 / N".
    total=tv.locator('.sl-bar b').inner_text().split('/')[-1].strip()
    check('slide count on the button matches the player',f'· {total} ' in btn+' ',f'{btn!r} vs {total}')
    sl=tv.evaluate(box,'.sl-player')
    check('live 1920: slides fill the screen',sl and sl['w']>=1919 and sl['h']>=1079,str(sl))
    tv.locator('.sl-present').click();tv.wait_for_timeout(600)
    check('live 1920: present toggles on',tv.locator('.sl-player.presenting').count()==1)
    sl=tv.evaluate(box,'.sl-slide');check('live 1920: slide is landscape',sl and sl['w']>sl['h'],str(sl))
    if OUT:tv.screenshot(path=f'{OUT}/present-1920.png')
    # A short monitor/laptop window (about 1000x460 CSS px): the cover picture must sit inside its card, not be cut off at the top.
    for vw,vh in ((1000,461),(900,420),(844,390)):
        sm=b.new_page(viewport={'width':vw,'height':vh});open_slides(sm,LIVE);sm.locator('.sl-present').click();sm.wait_for_timeout(500)
        cv=sm.evaluate(box,'.sl-cover');mk=sm.evaluate(box,'.sl-cover-mark')
        check(f'short {vw}x{vh}: cover picture is inside its card',cv and mk and mk['t']>=cv['t']-1 and mk['t']+mk['h']<=cv['t']+cv['h']+1,f'{cv} {mk}')
        check(f'short {vw}x{vh}: cover is not squashed',cv and cv['h']>=140,str(cv))
        sm.close()
    dev=b.new_page(viewport={'width':1280,'height':900})
    dev.goto(f'{DEV}/?screen=home&lang=uz');dev.wait_for_timeout(700)
    check('localhost: design studio kept',dev.locator('.studio-aside').count()==1)
    m=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);m.on('pageerror',lambda e:errs.append(str(e)))
    # iPhone Safari has no element fullscreen or rotation lock: take them away so the CSS turn is what is tested.
    m.add_init_script("Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;try{screen.orientation.lock=undefined}catch(e){}")
    open_slides(m,LIVE)
    m.locator('.sl-present').click();m.wait_for_timeout(600)
    pl=m.evaluate(box,'.sl-player')
    check('phone upright: player covers the screen',pl and abs(pl['l'])<2 and abs(pl['t'])<2 and abs(pl['w']-390)<2 and abs(pl['h']-844)<2,str(pl))
    bar=m.evaluate(box,'.sl-bar')
    check('phone upright: player turned a quarter (top bar runs down the right edge)',bar and bar['h']>bar['w'] and bar['l']>300,str(bar))
    fit=m.evaluate("()=>{const e=document.querySelector('.sl-slide');return e.scrollHeight-e.clientHeight}")
    check('phone upright: slide 1 fits without scrolling',fit<=2,f'{fit}px over')
    before=m.locator('.sl-bar b').inner_text()
    m.locator('.sl-nav button').last.click();m.wait_for_timeout(300)
    check('phone upright: next works while turned',m.locator('.sl-bar b').inner_text()!=before)
    fit=m.evaluate("()=>{const e=document.querySelector('.sl-slide');return e.scrollHeight-e.clientHeight}")
    check('phone upright: slide 2 fits without scrolling',fit<=2,f'{fit}px over')
    if OUT:m.screenshot(path=f'{OUT}/present-phone.png')
    m.locator('.sl-present').click();m.wait_for_timeout(400)
    pl=m.evaluate(box,'.sl-player');check('phone: leaving present restores upright',pl and abs(pl['w']-390)<2,str(pl))
    check('no page errors',not errs,str(errs[:2]))
    b.close()
srv.shutdown()
if fails:print('FAIL',*fails,sep='\n  ');sys.exit(1)
print(f'PASS {n} checks')
