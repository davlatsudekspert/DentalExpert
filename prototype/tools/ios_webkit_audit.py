"""iPhone (WebKit) layout audit: the checks the Chromium suites missed. Run against `wrangler pages dev` on :8788.
  PLAYWRIGHT_BROWSERS_PATH=<dir with webkit> python3 tools/ios_webkit_audit.py [lang]
Checks on every screen: bottom nav on screen, no horizontal overflow; and that full-screen sheets (3D atlas, slides,
quiz) cover the viewport with their header and controls visible."""
from playwright.sync_api import sync_playwright
import json,os,sys,time
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';lang=sys.argv[1] if len(sys.argv)>1 else 'uz';OUT=os.environ.get('SIM_OUT','/tmp/sim-ios');os.makedirs(OUT,exist_ok=True)
SCREENS=['home','search','profile','clinics','booking','dashboard','edit','record','chart','anatomy','teacher','student','courses','settings','privacy','forum','notifications']
bad=[];TH=('&theme='+os.environ['THEME']) if os.environ.get('THEME') else ''
def check(name,ok,info=''):
    print(('PASS ' if ok else 'FAIL ')+name+(f' ({info})' if info and not ok else ''))
    if not ok:bad.append(name)
def inview(pg,sel):
    return pg.evaluate("""s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,h:innerHeight,w:innerWidth,left:r.left,right:r.right}}""",sel)
with sync_playwright() as p:
    b=p.webkit.launch()
    dev=p.devices['iPhone 15']
    for role in ('dentist','teacher'):
        c=b.new_context(**dev)
        e=f'{role}+{time.time_ns()}@example.com'
        r=c.request.post(B+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Lola Karimova','role':role,'lang':lang}),headers={'content-type':'application/json'}).json()
        c.request.post(B+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers={'content-type':'application/json'})
        pg=c.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
        for s in SCREENS:
            pg.goto(f'{B}/?screen={s}&lang={lang}&shot=1'+TH);pg.wait_for_timeout(900)
            pg.evaluate('window.scrollTo(0,document.body.scrollHeight)');pg.wait_for_timeout(300)
            n=inview(pg,'.bottom-nav')
            if n:check(f'{role}/{s}: bottom nav on screen',0<=n['top']<n['h'] and n['bottom']<=n['h']+1,str(n))
            ov=pg.evaluate('document.documentElement.scrollWidth-innerWidth')
            check(f'{role}/{s}: no horizontal overflow',ov<=1,f'{ov}px')
        # 3D atlas sheet
        pg.goto(f'{B}/?screen=anatomy&lang={lang}&shot=1'+TH);pg.wait_for_timeout(800)
        pg.evaluate('window.scrollTo(0,400)');pg.locator('.atlas3d-launch').click();pg.wait_for_timeout(2500)
        a=inview(pg,'.atlas3d');t=inview(pg,'.atlas3d-top');ch=inview(pg,'.atlas3d-chips')
        check(f'{role}: 3D atlas covers screen',a and abs(a['top'])<2 and abs(a['bottom']-a['h'])<2,str(a))
        check(f'{role}: 3D atlas header visible',t and t['top']>=0 and t['bottom']<=t['h'],str(t))
        check(f'{role}: 3D atlas layer buttons visible',ch and ch['bottom']<=ch['h'] and ch['right']<=ch['w']+1,str(ch))
        ov3=pg.evaluate("""()=>{const r=[...document.querySelectorAll('.atlas3d-chips button')].map(b=>b.getBoundingClientRect());let n=0;for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],c=r[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)n++}return n}""")
        check(f'{role}: 3D atlas chips do not overlap',ov3==0,f'{ov3} overlapping pairs')
        pg.screenshot(path=f'{OUT}/{role}-atlas3d.png')
        pg.locator('.atlas3d-top button').last.click();pg.wait_for_timeout(400)
        # slides from the curriculum
        pg.goto(f'{B}/?screen=courses&lang={lang}&shot=1'+TH);pg.wait_for_timeout(800)
        pg.evaluate('window.scrollTo(0,300)')
        pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(300);pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(600)
        pg.locator('.lg-section > .button').first.click();pg.wait_for_timeout(600)
        sl=inview(pg,'.sl-player');nv=inview(pg,'.sl-nav')
        check(f'{role}: slides cover screen',sl and abs(sl['top'])<2 and abs(sl['bottom']-sl['h'])<2,str(sl))
        check(f'{role}: slide buttons visible',nv and nv['bottom']<=nv['h']+1,str(nv))
        pg.screenshot(path=f'{OUT}/{role}-slides.png')
        pg.locator('.sl-bar button').last.click();pg.wait_for_timeout(300)
        # quiz sheet
        pg.goto(f'{B}/?screen=courses&lang={lang}&shot=1'+TH);pg.wait_for_timeout(800)
        # quiz sheet via the daily test (roles without the daily tab have no quiz sheet in Learn)
        daily=pg.locator('.learn > .chips button').filter(has_text={'uz':'Kunlik','ru':'Задания','en':'Daily'}[lang])
        if daily.count():
            daily.first.click();pg.wait_for_timeout(500)
            pg.get_by_role('button',name={'uz':'Kunlik test','ru':'Тест дня','en':'Daily quiz'}[lang],exact=False).first.click();pg.wait_for_timeout(500)
            q=inview(pg,'.quiz-run')
            check(f'{role}: quiz covers screen',q and abs(q['top'])<2 and abs(q['bottom']-q['h'])<2,str(q))
            pg.screenshot(path=f'{OUT}/{role}-quiz.png')
        check(f'{role}: no page errors',not errs,'; '.join(errs[:2]))
        c.close()
    b.close()
print(f'\n{"FAIL" if bad else "PASS"}: {len(bad)} problems')
sys.exit(1 if bad else 0)
