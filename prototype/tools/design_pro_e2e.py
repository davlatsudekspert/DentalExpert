"""Design guard for the Pro / paywall screens (build with VITE_PRO_ENABLED=1 against a server with PRO_ENABLED=1):
the paywall, the Free-vs-Pro table, the plan cards, the lock card and the Profil plan row in the three looks (ivory, colour, dark)
at 360x640 and 390x844 for every paid role: no sideways scroll, text contrast AA, every tap target at least 44 px, the table rows
fit, the last line (Terms / Privacy) can be scrolled into view above the home indicator, and the hero/learn probes stay clean.
Usage: DE_PORT=… python3 tools/design_pro_e2e.py"""
import os,re,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(__file__))
from design_lib import *
from classroom_test_lib import sql

fails=[];n=0
def check(name,problems):
    global n;n+=1
    for p in sorted(set(problems)):fails.append(f'{name}: {p}')
SIZES=[(360,640),(390,844)]
PW_JS="""()=>{const o=[];const pw=document.querySelector('.pw');if(!pw)return ['no paywall'];
 if(document.documentElement.scrollWidth>innerWidth+1)o.push('page scrolls sideways');
 for(const e of pw.querySelectorAll('button,[role=radio]')){const r=e.getBoundingClientRect();if(r.width&&(r.height<44||r.width<44))o.push('tap target '+Math.round(r.width)+'x'+Math.round(r.height)+' '+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,18))}
 for(const e of pw.querySelectorAll('.pw-row')){if(e.scrollWidth>e.clientWidth+1)o.push('table row wider than the screen: '+e.innerText.slice(0,24).replace(/\\n/g,' '))}
 for(const e of pw.querySelectorAll('.pw-row *')){const r=e.getBoundingClientRect(),pr=pw.getBoundingClientRect();if(r.width&&(r.right>pr.right+1||r.left<pr.left-1))o.push('table cell outside the screen')}
 const sc=pw.querySelector('.pw-body');sc.scrollTo(0,1e6);const last=[...pw.querySelectorAll('.pw-links a,.pw-legal')].pop();
 if(last){const r=last.getBoundingClientRect();if(r.bottom>innerHeight+1)o.push('last line (Terms / Privacy) cannot be scrolled above the screen edge: '+Math.round(r.bottom)+'>'+innerHeight)}
 sc.scrollTo(0,0);return o}"""

with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROMIUM,args=['--no-sandbox'])
    for role,over in (('student',True),('teacher',False),('dentist',True)):
        ctx,email=signin(b,role,'en');pg=ctx.new_page()
        if over:sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{email}'")
        for vw,vh in SIZES:
            pg.set_viewport_size({'width':vw,'height':vh})
            for theme,lang in (('mono','en'),('mono','ru'),('color','uz'),('dark','uz'),('dark','en')):
                tag=f'{role} {theme} {lang} {vw}x{vh}'
                open_app(pg,theme,lang,'&screen=settings','.pf-plan')
                check(f'{tag} Profil plan row',[f'{k}: {m}' for k in ('clip','trunc','img') for m in probe(pg)[k]]+[f'contrast {t} {r}:1' for t,r in contrast(pg).items()])
                pg.locator('.pf-plan').click();pg.wait_for_selector('.pw');pg.wait_for_timeout(500);force(pg,theme)
                check(f'{tag} paywall',pg.evaluate(PW_JS)+[f'contrast {t} {r}:1' for t,r in contrast(pg,'.pw').items()])
                pg.evaluate("document.querySelector('.pw-body').scrollTo(0,1e6)");pg.wait_for_timeout(250)
                check(f'{tag} paywall (end of scroll)',[f'contrast {t} {r}:1' for t,r in contrast(pg,'.pw').items()])
                pg.keyboard.press('Escape');pg.wait_for_timeout(250)
        if over and role=='student':
            for theme in ('mono','color','dark'):
                open_app(pg,theme,'en','&screen=courses','.learn-tabs')
                pg.locator('.learn-tabs button',has_text=re.compile('Review|Exam')).first.click();pg.wait_for_selector('.pw-nudge',timeout=4000);force(pg,theme)
                nudge=pg.evaluate("()=>{const e=document.querySelector('.pw-nudge'),r=e.getBoundingClientRect(),bt=e.querySelector('button').getBoundingClientRect();return [r.right>innerWidth+1,bt.height<44]}")
                check(f'lock card {theme}',(['lock card is wider than the screen'] if nudge[0] else [])+(['lock card button under 44 px'] if nudge[1] else [])+[f'contrast {t} {r}:1' for t,r in contrast(pg).items()])
        ctx.close()
    b.close()
for x in fails:print('FAIL',x)
print(f'{n} Pro design checks, {len(fails)} problems')
assert not fails
print('DESIGN PRO OK')
