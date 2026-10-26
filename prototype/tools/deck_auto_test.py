"""Auto page turning in the slide viewer (Auto / Manual), against a built dist folder, with a fake clock.
- Manual stays the default and behaves as before; Auto turns the page after the chosen 15/30/60 seconds.
- Tapping the slide (or turning a page by hand) pauses; tapping again resumes; the pause badge shows.
- It stops on the last slide (no wrap-round) and switches itself off.
- The screen stays awake only while auto really runs; closing the viewer / hiding the app clears the timer and the lock.
- The choice survives a reload; reduced motion removes transitions; 320 px wide, big text and the dark look do not overflow.
Usage: python3 tools/deck_auto_test.py [dist_dir]"""
import functools,http.server,os,sys,threading
from playwright.sync_api import sync_playwright
DIST=sys.argv[1] if len(sys.argv)>1 else 'dist'
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path.split('?')[0])):self.path='/index.html'
        return super().send_head()
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=DIST));port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{port}'
fails=[];n=0
def check(name,ok,info=''):
    global n;n+=1
    if not ok:fails.append(f'{name} {info}')
WAKE="""()=>{window.__wl={acq:0,rel:0};Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{window.__wl.acq++;return {release:async()=>{window.__wl.rel++}}}}})}"""
def cur(pg):return int(pg.locator('.deck-bar span').inner_text().split('/')[0])
def total(pg):return int(pg.locator('.deck-bar span').inner_text().split('/')[1])
def wl(pg):return pg.evaluate('window.__wl')
def open_viewer(b,lang='en',vw=390,vh=844,store=None,**kw):
    ctx=b.new_context(viewport={'width':vw,'height':vh},**kw)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script(f'({WAKE})()')
    if store:pg.add_init_script("(()=>{try{"+store+"}catch(e){}})()")
    pg.clock.install()
    pg.goto(f'{BASE}/?screen=lessonPage&lang={lang}');pg.wait_for_selector('.deck-card')
    pg.locator('.deck-card').first.click();pg.wait_for_selector('.deck-viewer')
    return ctx,pg,errs
def tick(pg,ms):pg.clock.run_for(ms);pg.wait_for_timeout(50)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None,args=['--no-sandbox'])
    # --- Manual is the default and works as before
    ctx,pg,errs=open_viewer(b)
    mode=pg.locator('.deck-auto-mode')
    check('default is Manual',mode.inner_text()=='Manual' and mode.get_attribute('aria-pressed')=='false')
    check('no speed or pause control in Manual',pg.locator('.deck-auto-secs').count()==0 and pg.locator('.deck-auto-pause').count()==0)
    tick(pg,120000);check('Manual: slide never changes by itself',cur(pg)==1)
    pg.get_by_role('button',name='Next').click();check('Manual: Next still works',cur(pg)==2)
    check('Manual: no wake lock taken',wl(pg)['acq']==0)
    pg.get_by_role('button',name='Previous').click()
    # --- Auto: 30 s by default, fake clock
    mode.click()
    check('button now reads Auto',mode.inner_text()=='Auto' and mode.get_attribute('aria-pressed')=='true')
    sel=pg.locator('.deck-auto-secs')
    check('default speed is 30 seconds',sel.input_value()=='30' and '30 seconds' in sel.locator('option:checked').inner_text())
    check('speeds are 15 / 30 / 60',sel.locator('option').all_inner_texts()==['15 seconds','30 seconds','60 seconds'])
    check('screen kept awake while auto runs',wl(pg)['acq']==1 and wl(pg)['rel']==0,str(wl(pg)))
    tick(pg,29000);check('29 s: still slide 1',cur(pg)==1)
    tick(pg,1500);check('30 s: slide 2',cur(pg)==2)
    sel.select_option('15');tick(pg,15500);check('15 s speed: slide 3',cur(pg)==3)
    # --- Pause by tapping the slide, resume by tapping again
    pg.locator('.deck-stage').click(position={'x':60,'y':60});pg.wait_for_timeout(50)
    check('tap pauses: badge shown',pg.locator('.deck-paused').count()==1 and pg.locator('.deck-paused').inner_text().strip()=='Pause')
    check('pause releases the wake lock',wl(pg)['rel']==wl(pg)['acq'],str(wl(pg)))
    tick(pg,60000);check('paused: slide does not move',cur(pg)==3)
    check('pause button reads Resume',pg.get_by_role('button',name='Resume').count()==1)
    pg.locator('.deck-stage').click(position={'x':60,'y':60});pg.wait_for_timeout(50)
    check('tap again resumes: badge gone',pg.locator('.deck-paused').count()==0)
    tick(pg,15500);check('resumed: slide 4',cur(pg)==4)
    # --- Turning a page by hand pauses
    pg.get_by_role('button',name='Next').click();check('hand turn goes to 5',cur(pg)==5)
    check('hand turn pauses auto',pg.locator('.deck-paused').count()==1)
    tick(pg,40000);check('stays on 5 while paused',cur(pg)==5)
    pg.get_by_role('button',name='Resume').click();pg.wait_for_timeout(50)
    check('Resume button continues',pg.locator('.deck-paused').count()==0)
    # --- Runs to the last slide, stops there, does not wrap, turns itself off
    last=total(pg)
    for _ in range(last+2):tick(pg,15500)
    check('stops on the last slide',cur(pg)==last,f'{cur(pg)}/{last}')
    check('auto switches itself off',pg.locator('.deck-auto-mode').inner_text()=='Manual')
    check('quiz button is offered on the last slide',pg.locator('.deck-quiz-btn').count()==1)
    tick(pg,200000);check('no wrap to slide 1',cur(pg)==last)
    w=wl(pg);check('wake lock released at the end',w['acq']==w['rel'],str(w))
    check('Auto cannot be switched on from the last slide',pg.locator('.deck-auto-mode').is_disabled())
    # --- Closing the viewer leaves no timer or lock behind
    pg.get_by_role('button',name='Previous').click();pg.locator('.deck-auto-mode').click()
    check('auto on again from slide before last',pg.locator('.deck-auto-mode').inner_text()=='Auto')
    pg.get_by_role('button',name='Close').click();tick(pg,300000)
    w=wl(pg);check('closing releases the lock',w['acq']==w['rel'],str(w))
    check('closing leaves no pending timer',pg.evaluate('document.querySelectorAll(".deck-viewer").length')==0)
    check('no browser exceptions',not errs,str(errs));ctx.close()
    # --- Hiding the app stops the timer and the lock, showing it again continues
    ctx,pg,errs=open_viewer(b,store="localStorage.setItem('de_deck_auto','1');localStorage.setItem('de_deck_secs','15')")
    check('remembered Auto + 15 s after reload',pg.locator('.deck-auto-mode').inner_text()=='Auto' and pg.locator('.deck-auto-secs').input_value()=='15')
    pg.evaluate("""()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'))}""")
    pg.wait_for_timeout(50);w=wl(pg)
    check('background: lock released',w['acq']==w['rel'] and w['acq']>=1,str(w))
    tick(pg,60000);check('background: timer cancelled',cur(pg)==1)
    pg.evaluate("""()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});document.dispatchEvent(new Event('visibilitychange'))}""")
    pg.wait_for_timeout(50);tick(pg,15500)
    check('foreground: auto continues',cur(pg)==2)
    check('no browser exceptions (background)',not errs,str(errs));ctx.close()
    # --- Choice is saved by the buttons
    ctx,pg,errs=open_viewer(b,lang='uz')
    check('uz: Qo‘lda label',pg.locator('.deck-auto-mode').inner_text()=='Qo‘lda')
    pg.locator('.deck-auto-mode').click();pg.locator('.deck-auto-secs').select_option('60')
    check('uz: Avto + 60 soniya',pg.locator('.deck-auto-mode').inner_text()=='Avto' and '60 soniya' in pg.locator('.deck-auto-secs option:checked').inner_text())
    check('uz: pause label',pg.get_by_role('button',name='Pauza').count()==1)
    pg.get_by_role('button',name='Pauza').click();check('uz: Davom etish after pause',pg.get_by_role('button',name='Davom etish').count()==1)
    pg.get_by_role('button',name='Yopish').click()
    saved=pg.evaluate("[localStorage.getItem('de_deck_auto'),localStorage.getItem('de_deck_secs')]")
    check('choice saved on the device',saved==['1','60'],str(saved))
    pg.reload();pg.wait_for_selector('.deck-card');pg.locator('.deck-card').first.click();pg.wait_for_selector('.deck-viewer')
    check('next time Auto + 60 s are remembered',pg.locator('.deck-auto-mode').inner_text()=='Avto' and pg.locator('.deck-auto-secs').input_value()=='60')
    ctx.close()
    ctx,pg,errs=open_viewer(b,lang='ru')
    check('ru: Вручную',pg.locator('.deck-auto-mode').inner_text()=='Вручную')
    pg.locator('.deck-auto-mode').click()
    check('ru: Авто + 30 секунд',pg.locator('.deck-auto-mode').inner_text()=='Авто' and '30 секунд' in pg.locator('.deck-auto-secs option:checked').inner_text())
    check('ru: Пауза',pg.get_by_role('button',name='Пауза').count()==1)
    ctx.close()
    # --- Reduced motion and small / large / dark layouts
    ctx,pg,errs=open_viewer(b,reduced_motion='reduce')
    pg.locator('.deck-auto-mode').click()
    tr=pg.evaluate("""()=>[...document.querySelectorAll('.deck-viewer *')].filter(e=>{const s=getComputedStyle(e);return parseFloat(s.transitionDuration)>0.001||(s.animationName!=='none'&&parseFloat(s.animationDuration)>0.001)}).length""")
    check('reduced motion: no transitions or animations in the viewer',tr==0,str(tr));ctx.close()
    for label,vw,vh,fs,theme in (('320 px',320,640,None,None),('320 px big text',320,640,'200%',None),('320 px dark',320,640,None,'dark'),('320 px mono',320,640,None,'mono'),('tablet',768,1024,None,None)):
        ctx,pg,errs=open_viewer(b,vw=vw,vh=vh)
        if fs:pg.evaluate(f"document.documentElement.style.fontSize='{fs}'")
        if theme:pg.evaluate(f"document.documentElement.dataset.theme='{theme}'")
        pg.locator('.deck-auto-mode').click();pg.locator('.deck-stage').click();pg.wait_for_timeout(100)
        ov=pg.evaluate("""()=>{const v=document.querySelector('.deck-viewer');const r=v.getBoundingClientRect();const bad=[...v.querySelectorAll('.deck-bar *,.deck-auto,.deck-auto *,.deck-controls,.deck-controls *,.deck-paused')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left<-1)}).map(e=>e.className||e.tagName);return {sw:document.documentElement.scrollWidth,vw:innerWidth,vsw:v.scrollWidth,bad}}""")
        check(f'{label}: no sideways overflow',ov['sw']<=ov['vw'] and ov['vsw']<=ov['vw'] and not ov['bad'],str(ov))
        small=pg.evaluate("""()=>[...document.querySelectorAll('.deck-auto button,.deck-auto select')].filter(e=>{const r=e.getBoundingClientRect();return r.width<47.5||r.height<47.5}).map(e=>e.className+' '+e.getBoundingClientRect().width+'x'+e.getBoundingClientRect().height)""")
        check(f'{label}: controls are at least 48 px',not small,str(small))
        unnamed=pg.evaluate("""()=>[...document.querySelectorAll('.deck-auto button,.deck-auto select')].filter(e=>!(e.getAttribute('aria-label')||e.textContent.trim())).length""")
        check(f'{label}: every control has a name',unnamed==0)
        check(f'{label}: no browser exceptions',not errs,str(errs))
        ctx.close()
    b.close()
if fails:
    print('FAIL',len(fails),'of',n);[print(' -',f) for f in fails];sys.exit(1)
print('PASS',n,'checks')
