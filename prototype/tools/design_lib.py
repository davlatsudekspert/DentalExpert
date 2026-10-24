"""Shared helpers for the design guards (design_e2e.py, design_pro_e2e.py): sign-in, theme forcing, the layout probe and the
pixel-sampled contrast scan. Everything runs against the local `wrangler pages dev` server (DE_PORT) in Chromium."""
import os,io,json,re,time
from PIL import Image
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
CHROMIUM=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
HD={'content-type':'application/json'}

def signin(b,role,lang='uz',size=(390,844),email=None,name='Ali Abduraxmonov',dpr=1):
    """A fresh context signed in with a throw-away email code (AUTH_DEV_ECHO) as `role`."""
    ctx=b.new_context(viewport={'width':size[0],'height':size[1]},is_mobile=True,has_touch=True,device_scale_factor=dpr)
    e=email or f'{role}+{time.time_ns()}@example.com'
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':name,'role':role,'lang':lang}),headers=HD).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=HD)
    return ctx,e

def open_app(pg,theme,lang,path='',wait='nav button'):
    """Open the app in `theme` (mono / color / dark; dark is not offered in Settings yet, so it is forced through the attribute)."""
    base='mono' if theme=='dark' else theme
    pg.goto(f'{BASE}/?lang={lang}&theme={base}&shot=1{path}');pg.wait_for_selector(wait,timeout=10000);pg.wait_for_timeout(900)
    pg.add_style_tag(content='*{animation:none!important;transition:none!important}')
    force(pg,theme)

def force(pg,theme):
    if theme=='dark':pg.evaluate("document.documentElement.dataset.theme='dark'")

# One probe for the layout problems a screenshot review finds: art cut by its card, text cut by its box, images that are not
# loaded / stretched / too small for a 2x screen / without alt, a page that scrolls sideways, content hidden behind the floating
# tab bar at the end of the scroll, hero art colliding with the headline, and learn-tab content off the common gutter.
PROBE=r"""(opts)=>{
const o={clip:[],trunc:[],img:[],tail:[],hero:[],gutter:[],ovf:false};
const ph=document.querySelector('main.phone');if(!ph)return o;
const vis=e=>{const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
const name=e=>e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'');
o.ovf=document.documentElement.scrollWidth>innerWidth+1;
const clipper=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(['hidden','clip'].includes(s.overflowX)||['hidden','clip'].includes(s.overflowY))return p;if(['auto','scroll'].includes(s.overflowX))return null}return null};
for(const e of ph.querySelectorAll('img,button,a,h1,h2,h3,p,b,strong,small,label,input,select')){
 if(!vis(e)||e.closest('nav.bottom-nav')||e.closest('[aria-hidden=true]'))continue;
 const c=clipper(e);if(!c)continue;const r=e.getBoundingClientRect(),cr=c.getBoundingClientRect();
 if(getComputedStyle(e).position==='absolute'&&e.tagName!=='IMG')continue;
 const dx=Math.max(cr.left-r.left,r.right-cr.right),dy=Math.max(cr.top-r.top,r.bottom-cr.bottom);
 if(dx>(e.tagName==='IMG'?4:2)||(dy>2&&c!==ph&&e.tagName!=='IMG'))o.clip.push(name(e)+' ('+(e.innerText||e.alt||'').trim().slice(0,18)+') cut by '+name(c)+' '+Math.round(Math.max(dx,dy))+'px')}
for(const e of ph.querySelectorAll('h1,h2,h3,p,span,b,strong,small,label,button,a,li')){
 if(!vis(e)||e.closest('nav.bottom-nav'))continue;const s=getComputedStyle(e);
 if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))continue;
 const hid=['hidden','clip'].includes(s.overflowX)||['hidden','clip'].includes(s.overflowY);
 if(hid&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+3)&&!e.matches('.sr-only'))o.trunc.push(name(e)+' "'+e.textContent.trim().slice(0,24)+'" '+e.scrollWidth+'/'+e.clientWidth+' '+e.scrollHeight+'/'+e.clientHeight)}
for(const i of ph.querySelectorAll('img')){
 if(!vis(i))continue;const r=i.getBoundingClientRect();const src=(i.currentSrc||i.src);const tail=src.split('/').pop().slice(0,28);
 if(!i.complete||i.naturalWidth===0){o.img.push('not loaded '+tail);continue}
 if(!i.hasAttribute('alt'))o.img.push('no alt attribute '+tail);
 if(!src.startsWith('data:')&&!/\.svg/.test(src)&&r.width>40&&i.naturalWidth<r.width*(opts&&opts.minScale||2)-2&&!(opts&&opts.lowRes||[]).some(f=>src.includes(f)))o.img.push('too small for 2x: '+i.naturalWidth+'px for '+Math.round(r.width)+' css px '+tail);
 const fit=getComputedStyle(i).objectFit;if(fit==='fill'&&Math.abs((i.naturalWidth/i.naturalHeight)/(r.width/r.height)-1)>.04)o.img.push('stretched '+tail)}
for(const h of ph.querySelectorAll('.hero')){
 const art=h.querySelector('.hero-tooth img,.hero-tooth');if(!art||!vis(art))continue;const hr=h.getBoundingClientRect(),ar=art.getBoundingClientRect();
 if(ar.left<hr.left-1||ar.right>hr.right+1||ar.top<hr.top-1||ar.bottom>hr.bottom+1)o.hero.push('art outside the card by '+Math.round(Math.max(hr.left-ar.left,ar.right-hr.right,hr.top-ar.top,ar.bottom-hr.bottom))+'px');
 for(const t of h.querySelectorAll('h1,p,button,.eyebrow')){if(!vis(t))continue;const tr=t.getBoundingClientRect();
  // text boxes are as wide as their column, so compare the real text lines
  const rg=document.createRange();rg.selectNodeContents(t);for(const l of rg.getClientRects()){if(l.width<2)continue;
   if(l.left<ar.right-6&&l.right>ar.left+6&&l.top<ar.bottom-6&&l.bottom>ar.top+6){o.hero.push('headline/text collides with the art: '+t.tagName+' "'+(t.innerText||'').slice(0,20)+'"');break}}}}
const tabs=ph.querySelector('.learn-tabs'),sec=ph.querySelector('.learn>*:not(.learn-tabs)');
if(tabs&&sec){const tr=tabs.getBoundingClientRect();const inner=sec.matches('.rv-root,.deck-library,.pr,.lg-section,.daily,.card,.official-schedule')?sec:sec;const sr=inner.getBoundingClientRect();
 if(Math.abs(sr.left-tr.left)>6||Math.abs(sr.right-tr.right)>6)o.gutter.push(name(sec)+' x'+Math.round(sr.left)+'-'+Math.round(sr.right)+' vs chips '+Math.round(tr.left)+'-'+Math.round(tr.right))}
const nav=document.querySelector('nav.bottom-nav');
if(nav){window.scrollTo(0,1e6);const nr=nav.getBoundingClientRect();
 const kids=[...ph.querySelectorAll('.screen > *')].filter(vis).filter(e=>getComputedStyle(e).position!=='fixed'&&!e.matches('nav'));
 const bottom=Math.max(0,...kids.map(e=>e.getBoundingClientRect().bottom));
 if(bottom>nr.top-2)o.tail.push('content ends at '+Math.round(bottom)+'px, tab bar starts at '+Math.round(nr.top)+'px');
 window.scrollTo(0,0)}
return o}"""

def probe(pg,**opts):return pg.evaluate(PROBE,opts)

CONTRAST_JS="""(root)=>{const out=[];
for(const e of document.querySelectorAll(root+' *')){
 const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')continue;
 const own=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
 if(!own)continue;const r=e.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
 let op=1;for(let x=e;x;x=x.parentElement)op*=+getComputedStyle(x).opacity;if(op<.05)continue;
 const nv=document.querySelector('nav.bottom-nav');if(nv&&!e.closest('nav')){const q=nv.getBoundingClientRect();if(r.bottom>q.top&&r.top<q.bottom&&r.right>q.left&&r.left<q.right)continue}
 out.push({t:own.slice(0,30)+' ['+(typeof e.className==='string'?e.className:'')+']',c:s.color,fs:parseFloat(s.fontSize),fw:+s.fontWeight,op,x:r.left,y:r.top,w:r.width,h:r.height,dis:!!e.closest('[disabled],[aria-disabled=true]')})}
return out}"""
def _lum(c):
    f=lambda v:(v/255/12.92) if v/255<=0.03928 else (((v/255)+0.055)/1.055)**2.4
    return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])
def _ratio(a,b):
    la,lb=_lum(a),_lum(b);return (max(la,lb)+0.05)/(min(la,lb)+0.05)
def contrast(pg,root='main.phone'):
    """WCAG AA (4.5:1, 3:1 for large text) of every visible text in `root`, sampled from a real screenshot. Returns {text: ratio} of failures."""
    items=pg.evaluate(CONTRAST_JS,root);img=Image.open(io.BytesIO(pg.screenshot())).convert('RGB');bad={}
    for it in items:
        if it['dis']:continue
        m=re.match(r'rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)',it['c'])
        if not m:continue
        fg=tuple(int(m.group(i)) for i in (1,2,3));a=float(m.group(4) or 1)*it['op']
        x0,y0=max(0,int(it['x'])),max(0,int(it['y']));x1,y1=min(img.width,int(it['x']+it['w'])),min(img.height,int(it['y']+it['h']))
        if x1-x0<3 or y1-y0<3:continue
        px=list(img.crop((x0,y0,x1,y1)).get_flattened_data());rest=[q for q in px if sum(abs(q[i]-fg[i]) for i in range(3))>60] or px
        bg=tuple(sorted(c)[len(c)//2] for c in zip(*rest));eff=tuple(round(fg[i]*a+bg[i]*(1-a)) for i in range(3))
        r=_ratio(eff,bg);need=3 if (it['fs']>=24 or (it['fs']>=18.66 and it['fw']>=700)) else 4.5
        if r<need:bad[it['t']]=round(r,2)
    return bad

NATIVE_INIT="document.addEventListener('DOMContentLoaded',()=>{document.documentElement.classList.add('native');new MutationObserver(()=>document.querySelectorAll('.statusbar').forEach(e=>e.remove())).observe(document,{childList:true,subtree:true})})"
def go_native(ctx,pg,top=59,bottom=34):
    """Run the page the way the iOS WebView does: the native class, no fake status bar, notch and home-indicator insets."""
    ctx.add_init_script(NATIVE_INIT)
    cdp=ctx.new_cdp_session(pg);cdp.send('Emulation.setSafeAreaInsetsOverride',{'insets':{'top':top,'bottom':bottom,'left':0,'right':0}})
