"""A verified dentist's own contact channels appear to patients like on the demo profiles."""
from playwright.sync_api import sync_playwright
import os,json,time
UNIQ=str(time.time_ns())[-6:]
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim')
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    def ctx_for(email,role,name,city='UZ-AN',country='UZ'):
        c=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2,is_mobile=True,has_touch=True)
        post=lambda path,body:c.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'})
        r=post('/api/auth/request-code',{'email':email,'name':name,'role':role,'lang':'en','cityId':city,'countryCode':country}).json()
        u=post('/api/auth/verify',{'email':email,'code':r['devCode']}).json()['user'];return c,u,post
    dc,du,dpost=ctx_for(f'drui+{time.time_ns()}@example.com','dentist',f'Dr Visible {UNIQ}')
    r=dc.request.put(BASE+'/api/auth/profile',data=json.dumps({'name':f'Dr Visible {UNIQ}','phone':'+998 90 555 66 77','workplace':'Bright Smile','specialty':'Orthodontist','address':'Navoi 12','telegram':'@drvisible','instagram':'drvisible','publicEmail':'visible@example.com','mapUrl':'https://maps.google.com/?q=bright','bio':'Braces','publishRequested':True}),headers={'content-type':'application/json'})
    check('profile saved',r.status==200)
    ac,au,_=ctx_for('davlatsudekspert@gmail.com','patient','Owner')
    check('owner verifies the dentist',ac.request.put(BASE+'/api/admin/users',data=json.dumps({'id':du['id'],'verified':True}),headers={'content-type':'application/json'}).status==200)
    pc,pu,_=ctx_for(f'pat+{time.time_ns()}@example.com','patient','Patient')
    pg=pc.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    pg.goto(BASE+'/?lang=en');pg.wait_for_selector('.home-header');pg.wait_for_timeout(1200)
    pg.goto(BASE+'/?screen=search&lang=en');pg.wait_for_selector('.doctor-card');pg.wait_for_timeout(1500)
    card=pg.locator('.doctor-card',has_text=f'Dr Visible {UNIQ}');check('verified dentist is in the search list',card.count()==1)
    card.click();pg.wait_for_selector('.profile-hero');pg.wait_for_timeout(800)
    hrefs=pg.locator('.contact-actions a').evaluate_all('els=>els.map(e=>e.href)')
    check('real contact buttons with correct links',any('t.me/drvisible' in h for h in hrefs) and any('instagram.com/drvisible' in h for h in hrefs) and any(h.startswith('tel:+998905556677') for h in hrefs) and any(h.startswith('mailto:visible@example.com') for h in hrefs))
    check('not labelled as a sample profile',pg.get_by_text('Sample profile').count()==0)
    pg.screenshot(path=OUT+'/pp1-public-profile.png',full_page=True)
    check('no page errors',not errs)
    b.close()
print('PUBLIC PROFILE E2E OK')
