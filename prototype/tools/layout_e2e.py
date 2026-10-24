"""Layout walk on the web build: every bottom-tab screen (and its chip tabs) per role at 360x640 and 390x844, in uz/ru/en.
Fails on: a horizontal page scroll, a label that wraps after a hyphen ('ketma-' / 'ket'), a button, tab, chip or select
smaller than 44 x 44 px (the atlas pins get their hit area from a ::after; a text field counts through its field box)."""
import os,json,time
from playwright.sync_api import sync_playwright
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
PROBE=r"""()=>{const o={tap:[],hyphen:[],hs:document.documentElement.scrollWidth>innerWidth+1};
for(const e of document.querySelectorAll('main.phone button,main.phone a[href],main.phone select,main.phone [role=radio],main.phone [role=tab]')){
 const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||e.classList.contains('atlas-pin'))continue;const r=e.getBoundingClientRect();if(r.width===0||r.height===0)continue;
 if(r.width<44||r.height<44)o.tap.push((e.tagName+'.'+(typeof e.className==='string'?e.className:'')).slice(0,40)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' '+(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\n/g,' ').slice(0,18))}
const w=document.createTreeWalker(document.querySelector('main.phone'),NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){const t=n.textContent;if(t.trim().length>18||!/[-‐]\S/.test(t))continue;const pe=n.parentElement;if(!pe||getComputedStyle(pe).display==='none')continue;
 for(let i=0;i<t.length-1;i++){if(t[i]!=='-'&&t[i]!=='‐')continue;if(/\s/.test(t[i+1])||i===0||/\s/.test(t[i-1]))continue;
  const a=document.createRange();a.setStart(n,i);a.setEnd(n,i+1);const b=document.createRange();b.setStart(n,i+1);b.setEnd(n,i+2);
  const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();if(ra.width&&rb.width&&rb.top>ra.bottom-2)o.hyphen.push(t.trim().slice(0,30))}}
return o}"""
bad=[];n=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for role in ('student','teacher','dentist','patient'):
        ctx=b.new_context(viewport={'width':360,'height':640},is_mobile=True,has_touch=True)
        e=f'{role}+{time.time_ns()}@example.com';hd={'content-type':'application/json'}
        r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':role,'lang':'uz'}),headers=hd).json()
        ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=hd)
        pg=ctx.new_page()
        for lang in ('uz','ru','en'):
            for vw,vh in ((360,640),(390,844)):
                pg.set_viewport_size({'width':vw,'height':vh});pg.goto(f'{BASE}/?lang={lang}&theme=mono');pg.wait_for_selector('nav button',timeout=10000);pg.wait_for_timeout(800)
                for i in range(pg.locator('nav button').count()):
                    pg.locator('nav button').nth(i).click();pg.wait_for_timeout(500)
                    label=pg.locator('nav button').nth(i).inner_text().strip()
                    states=[('',None)]+[(f'/chip{c}',c) for c in range(min(pg.locator('main.phone .chips button').count(),6))]
                    for suffix,c in states:
                        if c is not None:
                            try:pg.locator('main.phone .chips button').nth(c).click(timeout=2000);pg.wait_for_timeout(300)
                            except Exception:break
                        r=pg.evaluate(PROBE);n+=1
                        tag=f'{role} {lang} {vw}x{vh} {label}{suffix}'
                        for k in r['tap']:bad.append(f'{tag}: tap target {k}')
                        for k in r['hyphen']:bad.append(f'{tag}: breaks after a hyphen: {k}')
                        if r['hs']:bad.append(f'{tag}: horizontal page scroll')
        ctx.close()
    b.close()
for x in sorted(set(bad)):print('FAIL',x)
print(f'{n} screen states checked, {len(set(bad))} problems')
assert not bad
print('LAYOUT OK')
