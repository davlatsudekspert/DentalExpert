"""Regression tests for the issues found by the audit: patient records stay private, back navigation, data cleared on delete."""
from playwright.sync_api import sync_playwright
import os,json,time
BASE='http://127.0.0.1:8788'
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def signin(ctx,role,name):
    e=f'{role}+{time.time_ns()}@example.com'
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':e,'name':name,'role':role,'lang':'en'}).json();post('/api/auth/verify',{'email':e,'code':r['devCode']});return e
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=1,is_mobile=True,has_touch=True)
    signin(ctx,'dentist','Dr Privacy');pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    pg.goto(BASE+'/?screen=record&lang=en');pg.wait_for_selector('.patients');pg.get_by_role('button',name='Add patient').click()
    pg.get_by_label('Full name').fill('Secret Patient');pg.get_by_label('Notes',exact=False).fill('HIV+ allergy');pg.get_by_role('button',name='Save',exact=True).click();pg.wait_for_timeout(400)
    pg.goto(BASE+'/?screen=anatomy&lang=en');pg.wait_for_selector('.anatomy-title');pg.wait_for_timeout(600)
    check('dentist sees the odontogram button on the atlas page',pg.get_by_role('button',name='Odontogram',exact=False).count()>=1)
    # another person signs in on the same device as a patient
    ctx.clear_cookies();signin(ctx,'patient','Just A Patient')
    pg.goto(BASE+'/?screen=anatomy&lang=en');pg.wait_for_selector('.anatomy-title');pg.wait_for_timeout(800)
    check('patient has no odontogram button',pg.get_by_role('button',name='Odontogram',exact=False).count()==0)
    pg.goto(BASE+'/?screen=record&lang=en');pg.wait_for_selector('.screen');pg.wait_for_timeout(800)
    check('patient cannot open patient records',pg.get_by_text('Secret Patient').count()==0 and pg.get_by_text('HIV+').count()==0 and pg.locator('.patients').count()==0)
    # back navigation stays inside the app
    pg.goto(BASE+'/?lang=en');pg.wait_for_selector('.home-header');pg.wait_for_timeout(500)
    url0=pg.url;pg.locator('.bottom-nav button',has_text='Discover').first.click();pg.wait_for_timeout(400)
    check('moved to search',pg.locator('.topbar h1').count()==1)
    pg.go_back();pg.wait_for_timeout(500)
    check('browser/Android back returns to home inside the app',pg.locator('.home-header').count()==1 and pg.url.split('#')[0]==url0.split('#')[0])
    # dentist deletes the account: local data goes too
    ctx.clear_cookies();signin(ctx,'dentist','Dr Delete')
    pg.goto(BASE+'/?screen=record&lang=en');pg.wait_for_selector('.patients');pg.get_by_role('button',name='Add patient').click();pg.get_by_label('Full name').fill('To Be Erased');pg.get_by_role('button',name='Save',exact=True).click();pg.wait_for_timeout(300)
    pg.goto(BASE+'/?screen=settings&lang=en');pg.wait_for_selector('.account-session');pg.wait_for_timeout(500)
    pg.on('dialog',lambda d:d.accept());pg.get_by_role('button',name='Delete account').click();pg.wait_for_timeout(1200)
    keys=pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('de_patients:')&&localStorage.getItem(k).includes('To Be Erased'))")
    check('local patient data cleared on account deletion',keys==[])
    # real-device feedback: signed-in users never land on the sign-up page, role homes have no back arrow
    ctx.clear_cookies();signin(ctx,'student','Ali Talaba')
    pg.goto(BASE+'/?lang=en');pg.wait_for_selector('.role-tiles');pg.wait_for_timeout(400)
    check('role home has no back arrow',pg.locator('.topbar [aria-label="Back"]').count()==0)
    pg.goto(BASE+'/?screen=auth&lang=en');pg.wait_for_selector('.screen');pg.wait_for_timeout(1200)
    check('signed-in user is redirected away from the sign-up page',pg.locator('.role-tiles').count()==1)
    pg.get_by_role('button',name='Quizzes').first.click();pg.wait_for_timeout(700)
    check('quizzes tab lists the real deck quizzes',pg.locator('.learn .cr-row').count()>=6)
    check('no page errors',not errs)
    b.close()
print('AUDIT FIXES OK')
