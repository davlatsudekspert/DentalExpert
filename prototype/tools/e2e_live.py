"""Live browser e2e against `npm run api:dev` with .dev.vars (AUTH_SECRET, AUTH_DEV_ECHO=1) and tools/e2e_seed.sql applied."""
from playwright.sync_api import sync_playwright
import os,time
BASE=os.environ.get('PROTOTYPE_URL',f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}')
checks=[]
def check(n,c):
 assert c,n;checks.append(n)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844});page=ctx.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 # --- real profile from the API
 page.goto(f'{BASE}/?screen=search&lang=en');page.wait_for_selector('.doctor-card')
 page.get_by_text('Dr. E2E Verified').first.wait_for()
 card=page.locator('.doctor-card',has_text='Dr. E2E Verified')
 check('real doctor card has no demo label',card.locator('.sample-label').count()==0)
 check('demo doctor card keeps demo label',page.locator('.doctor-card',has_text='Kamila').locator('.sample-label').count()==1)
 card.click();page.wait_for_selector('.profile-hero')
 check('profile shows API name',page.locator('.profile-hero h2').inner_text()=='Dr. E2E Verified')
 check('profile shows API bio',page.get_by_text('E2E bio').count()==1)
 check('real profile pill has no demo wording',('sample' not in page.locator('.profile-hero .pill').inner_text().lower()))
 hrefs=page.locator('.contact-preview a').evaluate_all('(a)=>a.map(x=>x.getAttribute("href"))')
 check('only valid verified contacts are links',sorted(hrefs)==['https://t.me/e2e_doc','tel:+998901234567'])
 check('unsafe/unverified contacts not rendered',page.locator('.contact-preview a[href^="javascript"], .contact-preview a[href^="http:"], .contact-preview a[href^="mailto"]').count()==0)
 # --- demo profile still shows the labelled six-icon preview
 page.goto(f'{BASE}/?screen=profile&lang=en');page.wait_for_selector('.profile-hero')
 check('demo profile keeps six demo contact buttons',page.locator('button.contact-action').count()==6)
 # --- real email-code sign-up through the UI
 email=f'e2e+{time.time_ns()}@example.com'
 codes=[]
 page.on('response',lambda r:codes.append(r.json()) if r.url.endswith('/api/auth/request-code') and r.status==200 else None)
 page.goto(f'{BASE}/?screen=signup&lang=en');page.wait_for_selector('form')
 check('live signup has no password field',page.get_by_label('Password',exact=True).count()==0)
 page.get_by_label('Full name').fill('E2E Person');page.get_by_label('Email address').fill(email)
 page.get_by_role('button',name='Send code').click()
 page.wait_for_selector('.email-verification input')
 check('verify screen names the email',email in page.locator('.email-verification').inner_text())
 check('request returned a dev code',len(codes)==1 and len(codes[0].get('devCode',''))==6)
 page.locator('.email-verification input').fill('000000' if codes[0]['devCode']!='000000' else '111111')
 page.get_by_role('button',name='Verify').click()
 page.get_by_text('wrong or has expired').wait_for()
 check('wrong code shows error and attempts left','Attempts left: 4' in page.locator('.completion-note').inner_text())
 page.locator('.email-verification input').fill(codes[0]['devCode'])
 page.get_by_role('button',name='Verify').click()
 page.wait_for_selector('.home-header')
 check('verified sign-up lands on role home',page.locator('.home-header').count()==1)
 # session persists across reload
 page.goto(f'{BASE}/?screen=settings&lang=en');page.wait_for_selector('.account-session')
 check('session survives reload and shows email',email in page.locator('.account-session').inner_text())
 page.get_by_role('button',name='Sign out').click();page.wait_for_selector('.auth-entry')
 page.goto(f'{BASE}/?screen=settings&lang=en');page.wait_for_selector('.screen')
 check('signed out: no account actions',page.locator('.account-session').count()==0)
 # --- official schedule links (no copied schedules)
 page.goto(f'{BASE}/?screen=student&lang=en');page.wait_for_selector('.official-schedule')
 check('schedule section lists institutions',page.locator('.official-schedule option').count()>=4)
 link=page.locator('.official-schedule a.button').first
 check('official schedule is an external noopener link',link.get_attribute('rel')=='noopener noreferrer' and link.get_attribute('href').startswith('http'))
 page.locator('.official-schedule select').select_option('adti')
 check('institution without a schedule page links to its site instead',page.locator('.official-schedule a').first.get_attribute('href')=='https://adti.uz')
 check('no browser exceptions',not errors)
 b.close()
print('PASS',len(checks),'checks')
