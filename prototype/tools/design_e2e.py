"""Design guard (flag-off build). What a design review of the screens catches, as hard checks:
 - hero art stays fully inside its card and never runs into the headline (every role, uz and ru, 360x640 and 390x844)
 - no art, button, label or heading cut off by the box that holds it; no text truncated by an overflow box
 - no page that scrolls sideways; learn-tab content sits on the same gutter as the chips; the last content clears the floating tab bar
 - every image loads, has an alt attribute, is not stretched and has enough pixels for a 2x screen (photo subjects included)
 - the photo box of a subject keeps a fixed 16:7 ratio and a focal point (no layout shift, no cropped-away subject)
 - the three looks (ivory, colour, dark forced through data-theme) keep the same layout
 - native: the atlas title does not add the notch inset a second time, the tab bar stays above the home indicator
 - dark / ivory / colour contrast of the Credits and Admin screens and of the Attestation tab
Run against the local `wrangler pages dev` (DE_PORT) with the normal build; needs pillow. Usage: python3 tools/design_e2e.py"""
import os,re,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(__file__))
from design_lib import *

fails=[];n=0
def check(name,problems):
    global n;n+=1
    for p in sorted(set(problems)):fails.append(f'{name}: {p}')
# Photos that are too small for a 2x screen on purpose (credited, smallest clean image found); keep this list short.
LOW_RES=['endo']   # endo.webp: the only clean endodontic file photo found is 512 px wide (about 1.7x on the 298 px hero)
SIZES=[(360,640),(390,844)]
ROLES=('student','teacher','dentist','patient')

def walk(pg,tag,chips=True):
    """Every bottom tab of the signed-in role (and the learn sections) through the probe."""
    out=[]
    for i in range(pg.locator('nav button').count()):
        pg.locator('nav button').nth(i).click();pg.wait_for_timeout(500)
        label=pg.locator('nav button').nth(i).inner_text().strip()
        names=pg.locator('main.phone .learn-tabs button').all_inner_texts() if (chips and i==3) else []
        states=[('',None)]+[(f'/{names[c][:12]}',c) for c in range(len(names)) if not re.search(r'(kurs|курс|year)$',names[c],re.I)]
        for suffix,c in states:
            if c is not None:
                pg.locator('main.phone .learn-tabs button').nth(c).click();pg.wait_for_timeout(1500)
            r=probe(pg,lowRes=LOW_RES)
            where=f'{tag} {label}{suffix}'
            for k in ('clip','trunc','img','tail','hero','gutter'):
                for m in r[k]:out.append(f'{where}: {k}: {m}')
            if r['ovf']:out.append(f'{where}: page scrolls sideways')
    return out

with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROMIUM,args=['--no-sandbox'])
    # 1. every role, ru (longest words) at both sizes in the three looks; uz as well in the default look, learn sections included
    for role in ROLES:
        ctx,_=signin(b,role,'uz');pg=ctx.new_page()   # one sign-in per role (the code endpoint is rate limited); sizes and looks reload the page
        for vw,vh in SIZES:
            pg.set_viewport_size({'width':vw,'height':vh})
            for theme,lang in (('mono','ru'),('mono','uz'),('color','ru'),('dark','ru')):
                open_app(pg,theme,lang)
                check(f'{role} {theme} {lang} {vw}x{vh}',walk(pg,f'{role} {theme} {lang} {vw}x{vh}',chips=(theme=='mono' and (lang=='ru' or vw==390))))
        ctx.close()
    # 2. photo subjects: a fixed 16:7 box with a focal point, loaded, alt text, 2x resolution
    ctx,_=signin(b,'student','uz',(390,844));pg=ctx.new_page();open_app(pg,'mono','uz','&screen=courses','.lg-row')
    rows=pg.locator('.lg-section .lg-row').count();photos=0;probs=[]
    for i in range(rows):
        pg.locator('.lg-section .lg-row').nth(i).click();pg.wait_for_timeout(500)
        if pg.locator('.lg-hero-photo').count():
            photos+=1
            info=pg.evaluate("""()=>{const i=document.querySelector('.lg-hero-photo'),h=document.querySelector('.lg-hero');const r=i.getBoundingClientRect(),hr=h.getBoundingClientRect();
              return {w:r.width,h:r.height,loaded:i.complete&&i.naturalWidth>0,nw:i.naturalWidth,alt:(i.getAttribute('alt')||'').length,attrs:i.hasAttribute('width')&&i.hasAttribute('height'),pos:getComputedStyle(i).objectPosition,
                      inside:r.left>=hr.left-1&&r.right<=hr.right+1,src:i.currentSrc.split('/').pop()}}""")
            name=info['src']
            if not info['loaded']:probs.append(f'{name} not loaded')
            if info['alt']<8:probs.append(f'{name} has no alt text')
            if not info['attrs']:probs.append(f'{name} has no width/height (layout shift)')
            if abs(info['w']/info['h']-16/7)>0.06:probs.append(f'{name} box is {info["w"]:.0f}x{info["h"]:.0f}, not 16:7')
            if not info['inside']:probs.append(f'{name} sticks out of the subject card')
            if info['nw']<info['w']*2-2 and not any(f in name for f in LOW_RES):probs.append(f'{name} only {info["nw"]}px for {info["w"]:.0f} css px')
        # back to the list
        pg.goto(f'{BASE}/?lang=uz&theme=mono&shot=1&screen=courses');pg.wait_for_selector('.lg-row');pg.wait_for_timeout(500)
    check('subject photos',probs)
    if photos<9:fails.append(f'subject photos: expected at least 9 subject heroes with a photo, found {photos}')
    ctx.close()
    # 3. native: safe areas
    ctx,_=signin(b,'student','uz',(390,844));pg=ctx.new_page();go_native(ctx,pg);open_app(pg,'mono','uz')
    pg.locator('nav button').nth(2).click();pg.wait_for_selector('.anatomy-title');pg.wait_for_timeout(500)
    pad=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.anatomy-title')).paddingTop)")
    nav=pg.evaluate("(()=>{const r=document.querySelector('nav.bottom-nav').getBoundingClientRect();return [r.bottom,innerHeight]})()")
    check('native atlas',([f'atlas title adds {pad}px of notch padding a second time'] if pad>1 else [])+([f'tab bar bottom {nav[0]:.0f} is not above the home indicator ({nav[1]-34:.0f})'] if nav[0]>nav[1]-20 else []))
    pg.locator('nav button').nth(0).click();pg.wait_for_timeout(500)
    r=probe(pg);check('native home',[f'hero: {m}' for m in r['hero']]+[f'clip: {m}' for m in r['clip']])
    ctx.close()
    # 4. contrast: Credits, Admin, Attestation in the three looks (one student and one admin sign-in)
    sctx,_=signin(b,'student','uz');spg=sctx.new_page()
    actx,_=signin(b,'teacher','uz',email='davlatsudekspert@gmail.com');apg=actx.new_page()
    for theme in ('mono','color','dark'):
        open_app(spg,theme,'uz','&screen=settings','.pf')
        spg.locator('main.phone button',has_text=re.compile('Rasm manbalari')).first.click();spg.wait_for_timeout(1200);force(spg,theme)
        check(f'credits contrast {theme}',[f'{t} {r}:1' for t,r in contrast(spg,'.quiz-run').items()])
        open_app(apg,theme,'uz','&screen=settings','.pf')
        bt=apg.locator('main.phone button',has_text='Admin')
        if bt.count():
            bt.first.click();apg.wait_for_timeout(1500);force(apg,theme)
            check(f'admin contrast {theme}',[f'{t} {r}:1' for t,r in contrast(apg,'.quiz-run').items()])
        else:fails.append('admin contrast: the owner account has no Admin button')
        open_app(spg,theme,'uz')
        spg.locator('nav button').nth(3).click();spg.wait_for_timeout(600)
        names=spg.locator('main.phone .learn-tabs button').all_inner_texts()
        for c,nm in enumerate(names):   # every learn section (Review, Exam, Attestation, Daily, pictures...) must stay readable in every look
            if re.search(r'kurs$',nm):continue
            spg.locator('main.phone .learn-tabs button').nth(c).click();spg.wait_for_timeout(1500);force(spg,theme)
            check(f'learn "{nm}" contrast {theme}',[f'{t} {r}:1' for t,r in contrast(spg).items()])
    sctx.close();actx.close()
    b.close()
for x in fails:print('FAIL',x)
print(f'{n} design checks, {len(fails)} problems')
assert not fails
print('DESIGN OK')
