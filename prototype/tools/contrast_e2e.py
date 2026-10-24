"""Text contrast (WCAG AA: 4.5:1, 3:1 for large text) of the main screens in the ivory and colour themes, per role.
Sampled from a real screenshot: for every visible text element the background is the median of the pixels in its box that
are not text. Run against the local `wrangler pages dev` (dev server answers on :8788 / DE_PORT); needs pillow."""
import os,io,json,re,time
from playwright.sync_api import sync_playwright
from PIL import Image
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
JS="""()=>{const out=[];
for(const e of document.querySelectorAll('main.phone *')){
 const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')continue;
 const own=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
 if(!own)continue;const r=e.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
 let op=1;for(let x=e;x;x=x.parentElement)op*=+getComputedStyle(x).opacity;if(op<.05)continue;
 out.push({t:own.slice(0,30)+' ['+(typeof e.className==='string'?e.className:'')+(e.parentElement?' < '+(typeof e.parentElement.className==='string'?e.parentElement.className:''):'')+']',c:s.color,fs:parseFloat(s.fontSize),fw:+s.fontWeight,op,x:r.left,y:r.top,w:r.width,h:r.height})}
return out}"""
def lum(c):
    f=lambda v:(v/255/12.92) if v/255<=0.03928 else (((v/255)+0.055)/1.055)**2.4
    return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])
def ratio(a,b):
    la,lb=lum(a),lum(b);return (max(la,lb)+0.05)/(min(la,lb)+0.05)
def scan(pg):
    pg.add_style_tag(content='*{animation:none!important;transition:none!important}');pg.wait_for_timeout(300)
    items=pg.evaluate(JS);img=Image.open(io.BytesIO(pg.screenshot())).convert('RGB');bad={}
    for it in items:
        m=re.match(r'rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)',it['c'])
        if not m:continue
        fg=tuple(int(m.group(i)) for i in (1,2,3));a=float(m.group(4) or 1)*it['op']
        x0,y0=max(0,int(it['x'])),max(0,int(it['y']));x1,y1=min(img.width,int(it['x']+it['w'])),min(img.height,int(it['y']+it['h']))
        if x1-x0<3 or y1-y0<3:continue
        px=list(img.crop((x0,y0,x1,y1)).get_flattened_data());rest=[q for q in px if sum(abs(q[i]-fg[i]) for i in range(3))>60] or px
        bg=tuple(sorted(c)[len(c)//2] for c in zip(*rest));eff=tuple(round(fg[i]*a+bg[i]*(1-a)) for i in range(3))
        r=ratio(eff,bg);need=3 if (it['fs']>=24 or (it['fs']>=18.66 and it['fw']>=700)) else 4.5
        if r<need:bad[it['t']]=round(r,2)
    return bad
fails=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for role,tabs in (('student',['Profil']),('teacher',['Profil']),('patient',['Profil'])):
        for theme in ('mono','color','dark'):  # dark is not offered in Settings yet: forced through the attribute
            ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            e=f'{role}+{time.time_ns()}@example.com';hd={'content-type':'application/json'}
            r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':role,'lang':'uz'}),headers=hd).json()
            ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=hd)
            pg=ctx.new_page();pg.goto(f'{BASE}/?lang=uz&theme={"mono" if theme=="dark" else theme}');pg.wait_for_timeout(1500)
            if theme=='dark':pg.evaluate("document.documentElement.dataset.theme='dark'")
            names=['home']+tabs
            for i,n in enumerate(names):
                if i:
                    pg.locator('nav button',has_text=n).first.click();pg.wait_for_timeout(900)
                    if theme=='dark':pg.evaluate("document.documentElement.dataset.theme='dark'")
                bad=scan(pg)
                print(('FAIL ' if bad else 'PASS ')+f'{role} {theme} {n} contrast',bad or '')
                fails+=bool(bad)
            ctx.close()
    b.close()
assert not fails,'low-contrast text'
print('CONTRAST OK')
