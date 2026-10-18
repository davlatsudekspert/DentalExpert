"""The admin entry must survive sign-in and a profile save (those answers carry no isAdmin; only /auth/me does), and
a real save must say 'Saqlandi', never 'Demo saqlandi'. Signs in as the app owner's address (a default admin on the dev server)."""
from playwright.sync_api import sync_playwright
import os,json
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim')
ADMIN='davlatsudekspert@gmail.com'
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2,is_mobile=True,has_touch=True)
    post=lambda path,body:ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
    r=post('/api/auth/request-code',{'email':ADMIN,'name':'Ali Abduraxmonov','role':'dentist','lang':'uz'}).json()
    v=post('/api/auth/verify',{'email':ADMIN,'code':r['devCode']}).json()
    # Earlier suites on the same database may already have created this address with another role: the walk needs a dentist ("Ish joyi" is a professional field).
    ctx.request.put(BASE+'/api/auth/role',data=json.dumps({'role':'dentist'}),headers={'content-type':'application/json'})
    check('the sign-in answer itself has no isAdmin (why the client must ask /me)','isAdmin' not in v['user'])
    check('/auth/me says this address is an admin',ctx.request.get(BASE+'/api/auth/me').json()['user']['isAdmin'] is True)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    pg.goto(BASE+'/?screen=settings&lang=uz');pg.wait_for_selector('.admin-entry',timeout=8000)
    check('admin entry on Profil after a normal start',pg.locator('.admin-entry').count()==1)
    # Save the profile: the answer replaces the user object, the admin entry must come back without a restart.
    pg.get_by_role('button',name='Tahrirlash').first.click();pg.wait_for_selector('.profile-form')
    pg.locator('.profile-form').get_by_label('Ish joyi',exact=True).fill('NFC Store')
    pg.locator('.profile-form button[type=submit], .profile-form .button').last.click()
    pg.wait_for_selector('.toast',timeout=6000)
    toast=pg.locator('.toast').inner_text()
    check('real save says Saqlandi, not Demo',('Saqlandi' in toast) and ('Demo' not in toast))
    pg.get_by_role('button',name='Profil').last.click();pg.wait_for_timeout(1200)
    pg.wait_for_selector('.admin-entry',timeout=8000)
    check('admin entry still there after saving the profile',pg.locator('.admin-entry').count()==1)
    # Switching role (Profil → Rolim) answers without isAdmin too: the entry must survive it, both ways.
    for to,home in (('Ustoz','.classroom'),('Stomatolog','.home-header')):
        pg.locator('.pf-rolehead').click();pg.locator('.pf-roles button',has_text=to).click();pg.get_by_role('button',name='Rolni almashtirish').click();pg.wait_for_selector(home,timeout=10000)
        pg.get_by_role('button',name='Profil').last.click();pg.wait_for_selector('.admin-entry',timeout=8000)
        check(f'admin entry still there after switching to {to}',pg.locator('.admin-entry').count()==1)
    pg.screenshot(path=OUT+'/admin-flag.png')
    # A non-admin never gets the entry.
    ctx2=b.new_context(viewport={'width':430,'height':932},is_mobile=True,has_touch=True)
    e='plain+'+str(abs(hash(os.urandom(4))))+'@example.com'
    r=ctx2.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Plain User','role':'dentist','lang':'uz'}),headers={'content-type':'application/json'}).json()
    ctx2.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers={'content-type':'application/json'})
    pg2=ctx2.new_page();pg2.goto(BASE+'/?screen=settings&lang=uz');pg2.wait_for_timeout(1500)
    check('a normal user has no admin entry',pg2.locator('.admin-entry').count()==0)
    check('no page errors',not errs)
    b.close()
print('ADMIN FLAG E2E OK')
