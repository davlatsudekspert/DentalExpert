"""Guard for the education edition (the Android / Google Play build, src/edition.ts).
Google Play: the app declares only "Medical Reference and Education", so the Android build must not contain
healthcare-service features. `?edition=edu` forces that edition on the web; this test checks, for every role:
- the role picker has no patient role (dentist, teacher, student only);
- no doctor search, doctor cards or profiles, clinics, booking calendar, patient list, patient record or odontogram;
- blocked screens (?screen=, in-app links, history) land on the role's home; an old 'patient' account gets the student home;
- the bottom bar has four tabs and no find-a-dentist Search tab; the dentist profile editor has no public listing;
- no page errors.
Without the flag the full app (iOS, website) still has all of it.
Usage: python3 tools/edu_edition_test.py [dist_dir] [screenshot_dir]"""
import functools,http.server,json,os,re,sys,threading
from playwright.sync_api import sync_playwright
DIST=sys.argv[1] if len(sys.argv)>1 else 'dist'
OUT=sys.argv[2] if len(sys.argv)>2 else None
if OUT:os.makedirs(OUT,exist_ok=True)
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path.split('?')[0])):self.path='/index.html'
        return super().send_head()
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=DIST));port=srv.server_address[1]
srv.handle_error=lambda *a:None  # a page closed mid-download is not a failure
threading.Thread(target=srv.serve_forever,daemon=True).start()
B=f'http://app.test:{port}'  # a non-dev host: no design-study frame
fails=[];n=0
def check(name,ok,info=''):
    global n;n+=1
    if not ok:fails.append(f'{name} {info}'.strip())
BLOCKED=['home','search','profile','clinics','booking','record','chart']
HOME={'dentist':'dashboard','teacher':'teacher','student':'student','patient':'student'}
ROLES=['dentist','teacher','student','patient']
# Healthcare-service markers (the picture-practice DMFT exercise on a printed odontogram is education, so the patient
# chart is matched by its own heading). Elements and (English) texts that must never show in the education edition.
SEL=['.doctor-card','.calendar','.time-grid','.map-art','.chart-grid','.patients','.publish-card','.profile-hero','.search-field']
TXT=re.compile(r'Find a dentist|Book appointment|Sample booking|Handpicked specialists|My patients|Odontogram \(FDI\)|Patient record|Visit history|Show my profile to patients|Contact buttons for patients',re.I)
def user(role):return {'id':'u-'+role,'email':role+'@example.com','name':'Test '+role.title(),'role':role,'countryCode':'UZ','cityId':'UZ-TK','phone':'','workplace':'','bio':''}
def leaks(pg):
    found=[s for s in SEL if pg.locator(s).count()>0]
    m=TXT.search(pg.locator('body').inner_text());found+=[m.group(0)] if m else []
    return found
def nav(pg):return pg.evaluate("()=>[...document.querySelectorAll('.bottom-nav button')].map(b=>({l:b.getAttribute('aria-label'),cur:b.getAttribute('aria-current')==='page',feat:b.classList.contains('nav-featured')}))")
def on_home(pg,role):
    # The role's home: the first tab is the current page and the role's home chip is shown.
    tabs=nav(pg);return bool(tabs) and tabs[0]['cur'] and pg.locator('.role-chip').count()==1
with sync_playwright() as p:
    exe='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None
    b=p.chromium.launch(executable_path=exe,args=['--host-resolver-rules=MAP app.test 127.0.0.1'])
    errs=[]
    def page(signed=None):
        ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
        body={'enabled':bool(signed),'user':user(signed) if signed else None}
        pg.route('**/api/auth/me',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(body)))
        return pg
    def goto(pg,q,wait=900):pg.goto(f'{B}/?lang=en&{q}');pg.wait_for_timeout(wait)
    # ---- Education edition ----
    pg=page()
    goto(pg,'screen=roles&edition=edu')
    check('edu roles: three role cards',pg.locator('.role-card').count()==3,str(pg.locator('.role-card').count()))
    check('edu roles: no patient card',pg.locator('.role-icon.r0').count()==0)
    check('edu roles: dentist, teacher, student',[x.strip() for x in pg.locator('.role-card').all_inner_texts()]==['Dentist','Educator','Student'],str(pg.locator('.role-card').all_inner_texts()))
    if OUT:pg.screenshot(path=f'{OUT}/edu-roles.png')
    for role in ROLES:
        goto(pg,f'screen={HOME[role]}&role={role}&edition=edu')
        check(f'edu {role}: home is {HOME[role]}',on_home(pg,role))
        check(f'edu {role}: home has no healthcare-service items',not leaks(pg),str(leaks(pg)))
        tabs=nav(pg)
        check(f'edu {role}: four tabs',[t['l'] for t in tabs]==['Home','Atlas','Learn','Profile'],str(tabs))
        check(f'edu {role}: no raised centre tab',not any(t['feat'] for t in tabs))
        if OUT and role!='patient':pg.screenshot(path=f'{OUT}/edu-home-{role}.png',full_page=True)
        if OUT and role!='patient':pg.screenshot(path=f'{OUT}/edu-nav-{role}.png',clip={'x':0,'y':700,'width':390,'height':144})
        for s in BLOCKED:
            goto(pg,f'screen={s}&role={role}&edition=edu',600)
            check(f'edu {role}: ?screen={s} lands on the role home',on_home(pg,role))
            check(f'edu {role}: ?screen={s} shows nothing of it',not leaks(pg),str(leaks(pg)))
        # Every button on the home stays inside the education edition.
        goto(pg,f'screen={HOME[role]}&role={role}&edition=edu')
        count=pg.locator('main button').count()
        for i in range(count):
            goto(pg,f'screen={HOME[role]}&role={role}&edition=edu',500)
            btn=pg.locator('main button').nth(i)
            if not btn.is_visible() or not btn.is_enabled():continue
            label=(btn.get_attribute('aria-label') or btn.inner_text() or '').strip()[:40]
            try:btn.click(timeout=1500)
            except Exception:continue
            pg.wait_for_timeout(350)
            check(f'edu {role}: home button "{label}" opens no healthcare-service screen',not leaks(pg),str(leaks(pg)))
    for s in ['settings','privacy','courses','anatomy','auth','signup','login','onboard','splash']:
        goto(pg,f'screen={s}&role=dentist&edition=edu')
        check(f'edu: {s} has no healthcare-service text',not leaks(pg),str(leaks(pg)))
        if OUT and s in('settings','privacy'):pg.screenshot(path=f'{OUT}/edu-{s}.png',full_page=True)
    goto(pg,'screen=settings&role=dentist&edition=edu')
    check('edu settings: not-a-medical-device note',pg.get_by_text('not a medical device').count()>=1)
    goto(pg,'screen=privacy&role=dentist&edition=edu')
    check('edu privacy: no patient-list or published-profile claim',not re.search(r'Patient list|shown to patients',pg.locator('body').inner_text()))
    # History and in-app links: a blocked screen never opens, back stays inside the edition.
    goto(pg,'screen=courses&role=student&edition=edu')
    pg.locator('.bottom-nav button').first.click();pg.wait_for_timeout(400)
    pg.go_back();pg.wait_for_timeout(500)
    check('edu history: back stays out of blocked screens',not leaks(pg),str(leaks(pg)))
    # Signed-in accounts.
    for role in ['dentist','teacher','student','patient']:
        sp=page(role);goto(sp,'edition=edu',1400)
        check(f'edu signed-in {role}: opens {HOME[role]}',on_home(sp,role) and not leaks(sp),str(leaks(sp)))
        if role=='patient':check('edu signed-in patient: student learning home',sp.get_by_text('Learn today, heal smiles tomorrow.').count()==1)
        goto(sp,'screen=booking&edition=edu',1400)
        check(f'edu signed-in {role}: ?screen=booking lands on home',on_home(sp,role) and not leaks(sp),str(leaks(sp)))
        sp.context.close()
    sp=page('dentist');goto(sp,'screen=edit&edition=edu',1400)
    check('edu dentist editor: name field kept',sp.locator('.screen input, main input').count()>=1)
    check('edu dentist editor: photo kept',sp.get_by_text('Add photo').count()>=1)
    check('edu dentist editor: no public-listing option',sp.locator('.publish-card').count()==0 and sp.get_by_text('Show my profile to patients').count()==0)
    check('edu dentist editor: no patient contact fields',sp.get_by_text('Contact buttons for patients').count()==0 and sp.locator('input[placeholder="@username"]').count()==0)
    if OUT:sp.screenshot(path=f'{OUT}/edu-edit-dentist.png',full_page=True)
    sp.context.close()
    # ---- Full app (iOS, website): everything is still there ----
    goto(pg,'screen=roles')
    check('full roles: four role cards with patient',pg.locator('.role-card').count()==4 and pg.locator('.role-icon.r0').count()==1)
    goto(pg,'screen=home&role=patient')
    tabs=nav(pg)
    check('full nav: five tabs with Search',[t['l'] for t in tabs]==['Home','Search','Atlas','Learn','Profile'],str(tabs))
    check('full home: find a dentist',pg.get_by_text('Find a dentist').count()>=1)
    goto(pg,'screen=search&role=patient')
    check('full search: doctor cards',pg.locator('.doctor-card').count()>=1)
    goto(pg,'screen=booking&role=patient')
    check('full booking: calendar',pg.locator('.calendar').count()==1)
    goto(pg,'screen=profile&role=patient')
    check('full profile: doctor profile',pg.locator('.profile-hero').count()==1)
    goto(pg,'screen=record&role=dentist')
    check('full record: patient list',pg.locator('.patients').count()==1)
    goto(pg,'screen=dashboard&role=dentist')
    check('full dentist home: Patients tile',pg.get_by_text('Patients').count()>=1)
    sp=page('dentist');goto(sp,'screen=edit',1400)
    check('full dentist editor: public-listing option',sp.locator('.publish-card').count()==1)
    sp.context.close()
    check('no page errors',not errs,'; '.join(errs[:5]))
    b.close()
srv.shutdown()
print(f'edu_edition_test: {n-len(fails)}/{n} passed')
for f in fails:print('FAIL',f)
sys.exit(1 if fails else 0)
