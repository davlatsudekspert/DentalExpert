"""Teacher–student test v2, end to end on iPhone-size WebKit (390×844, touch, notch emulated) against the local
`wrangler pages dev` (DE_PORT, AUTH_DEV_ECHO=1, D1_PERSIST = its --persist-to directory):
 teacher sets up a variant topic test (5 of 10 per student, 10 minutes, deadline, answers after the deadline) → the big
 screen opens → one QR on the teacher screen → student A comes from the QR link signed out, signs up, types G’ayrat with
 an iPhone apostrophe and takes the test → students B and C (signed in) join with a nickname, C reopens the link twice
 mid-test and reloads → each student got a different question set, equal to the independent Python draw → the teacher
 screen and the big screen show all three results → the teacher opens their own QR: "you teach this group" + a student
 preview that sends nothing → clear errors (wrong code, 0/O/1/I, emoji nickname, expired session, offline) → scrolling a
 long page to the bottom and an iOS bounce do not move it back. Screenshots go to SIM_OUT.
Needs PLAYWRIGHT_BROWSERS_PATH with WebKit."""
import json,os,re,sys,time,urllib.request
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from classroom_test_lib import ROOT,call,login,sql  # noqa: E402
from variant_vectors import draw  # noqa: E402
PORT=os.environ.get('DE_PORT','8788');B=f'http://127.0.0.1:{PORT}'
OUT=os.environ.get('SIM_OUT','/tmp/sim-cv2');os.makedirs(OUT,exist_ok=True)
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name,flush=True);assert cond,name;n+=1
idx=json.load(open(os.path.join(ROOT,'src/curriculum/index.json')))
TID='perio-03';topic=[t for t in idx['topics'] if t['id']==TID][0];subj=[s for s in idx['subjects'] if s['id']==topic['subject']][0]
def qtext(ref):
    t,i=ref.rsplit(':',1);return json.load(open(os.path.join(ROOT,f'src/curriculum/topics/{t}.json')))['test'][int(i)]['q']['uz']
NOTCH={'top':'47px','bottom':'34px','left':'0px','right':'0px'}
def notch_css(route):
    """iPhone 15 safe areas: env(safe-area-inset-*) in our CSS becomes the notch / home-indicator sizes."""
    r=route.fetch();body=r.text()
    for k,v in NOTCH.items():body=re.sub(r'env\(safe-area-inset-'+k+r'(?:,[^)]*)?\)',v,body)
    route.fulfill(response=r,body=body,headers={**r.headers,'content-type':'text/css'})

T,_=login('teacher','Ustoz Karimova')
s,r=call('/classroom/groups','POST',{'name':'Periodontologiya 4-kurs'},T);G=r['group']
for t in ['perio-01',TID]:call('/classroom/topics','POST',{'groupId':G['id'],'topicId':t,'action':'open'},T)
S={k:login('student',f'Talaba {k}')[0] for k in 'BC'}

with sync_playwright() as p:
    wk=p.webkit.launch();dev=p.devices['iPhone 13']
    errs=[]
    def phone(token=None,notch=True,**kw):
        c=wk.new_context(**{**dev,**kw})
        if token:c.add_cookies([{'name':'de_session','value':token,'url':B}])
        if notch:
            c.route('**/*.css',notch_css)
            c.add_init_script("(function f(){if(document.documentElement)document.documentElement.classList.add('native');else setTimeout(f,0)})()")
        pg=c.new_page();pg.on('pageerror',lambda x:errs.append(str(x)));return c,pg
    def shot(pg,name):pg.screenshot(path=f'{OUT}/{name}.png')
    def answer_all(pg,stop=None,seen=None):
        k=0
        while True:
            pg.wait_for_selector('.quiz-run-options button',timeout=10000)
            if seen is not None:seen.append(pg.locator('.qr-card h3').inner_text().strip())
            pg.locator('.quiz-run-options button').nth(k%3).tap();pg.wait_for_timeout(200);k+=1
            if stop is not None and k>=stop:return
            last=pg.get_by_role('button',name='Topshirish')
            if last.count():last.first.tap();return
            pg.get_by_role('button',name='Keyingi').first.tap();pg.wait_for_timeout(200)

    # ── Teacher (iPhone): group → subject → topic → test settings.
    tc,tp=phone(T)
    tp.goto(B+'/?screen=teacher&lang=uz&shot=1');tp.wait_for_selector('.classroom');tp.wait_for_timeout(600)
    tp.locator('.lg-row',has_text=G['name']).tap();tp.wait_for_timeout(500)
    tp.locator('.lg-row',has_text=subj['title']['uz']).tap();tp.wait_for_timeout(300)
    tp.locator('.lg-row',has_text=topic['title']['uz']).tap();tp.wait_for_selector('.lg-setup',timeout=10000);tp.wait_for_timeout(600)
    vb=tp.locator('label.lg-check',has_text='Har bir talabaga boshqa savollar')
    check('variants off for 10 of 10, with the reason',vb.locator('input').is_disabled() and 'kamida 20' in vb.inner_text())
    vb.scroll_into_view_if_needed();shot(tp,'t01-setup-variant-reason')
    # Scrolling a long page to the very bottom stays there; an iOS bounce past the end does not expand the bar or move the page.
    tp.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');tp.wait_for_timeout(900)
    y0=tp.evaluate('window.scrollY');mx=tp.evaluate('document.documentElement.scrollHeight-innerHeight')
    tp.wait_for_timeout(1200);y1=tp.evaluate('window.scrollY')
    check('released at the bottom: no jump back',y0>=mx-2 and y1==y0)
    compact=tp.evaluate("!!document.querySelector('.bottom-nav.compact')")
    bounce=tp.evaluate("""async()=>{const max=document.documentElement.scrollHeight-innerHeight;const real=Object.getOwnPropertyDescriptor(window,'scrollY')||Object.getOwnPropertyDescriptor(Window.prototype,'scrollY');
      const ys=[max+40,max+80,max+55,max+25,max+8,max];const nav=()=>!!document.querySelector('.bottom-nav.compact');const before=nav();
      for(const y of ys){Object.defineProperty(window,'scrollY',{configurable:true,get:()=>y});dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,40))}
      Object.defineProperty(window,'scrollY',real);await new Promise(r=>setTimeout(r,300));return {before,after:nav(),h:document.documentElement.scrollHeight,max}}""")
    check('rubber-band bounce at the bottom is not read as scrolling up',bounce['before']==bounce['after']==compact)
    check('page height unchanged by the bounce',bounce['h']-tp.evaluate('innerHeight')==mx and tp.evaluate('window.scrollY')==y1)
    shot(tp,'t02-scrolled-bottom')
    tp.evaluate('window.scrollTo(0,0)');tp.wait_for_timeout(300)
    num=tp.locator('.lg-setup input[type=number]').first;num.fill('5');tp.wait_for_timeout(200)
    check('5 of 10 allows variants',not vb.locator('input').is_disabled())
    vb.locator('input').check();tp.wait_for_timeout(200)
    tp.locator('.lg-setup input[type=number]').nth(1).fill('10')
    due=time.localtime(time.time()+3*3600);tp.locator('input[type=datetime-local]').fill(time.strftime('%Y-%m-%dT%H:%M',due))
    sel=tp.locator('.lg-setup select');sel.select_option('deadline');tp.wait_for_timeout(200)
    fits=sel.evaluate("e=>{const c=document.createElement('canvas').getContext('2d');const cs=getComputedStyle(e);c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const pad=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+24;return [...e.options].every(o=>c.measureText(o.text).width+pad<=e.clientWidth)}")
    check('every reveal option fits the select at 390 px',fits)
    check('the reveal rule is explained under the select',tp.get_by_text('Muddat tugagach yoki siz testni').count()==1)
    tp.locator('.lg-setup .button',has_text='Testni boshlash').scroll_into_view_if_needed();shot(tp,'t03-setup-variant-deadline')
    tp.locator('.lg-setup .button',has_text='Testni boshlash').tap()
    tp.wait_for_selector('.bs',timeout=15000);tp.wait_for_timeout(600)
    check('starting the test opens the big screen (asks to rotate a portrait phone)',tp.locator('.bs-sheet').count()==1)
    shot(tp,'t04-bigscreen-rotate-ask');tp.locator('.bs-sheet-actions button').first.tap();tp.wait_for_timeout(500)
    bs_top=tp.locator('.bs-top').bounding_box()
    check('big screen header clears the notch',bs_top['y']>=47)
    shot(tp,'t05-bigscreen-portrait');tp.locator('.bs-close').tap();tp.wait_for_timeout(600)
    aid=[a for a in call(f'/classroom/assignments?groupId={G["id"]}',token=T)[1]['assignments'] if a.get('topicId')==TID][0]
    check('the test is a variant test with a deadline and the deadline reveal',aid['variant'] and aid['questionCount']==5 and aid['deadlineAt'] and aid['reveal']=='deadline' and aid['minutes']==10)
    items=aid['items'];aid=aid['id']
    check('teacher screen: one QR for everyone, with the code',tp.locator('.lg-invite img').count()==1 and G['code'][:3] in tp.locator('.lg-invite b').inner_text())
    check('teacher screen shows the deadline',tp.get_by_text('Muddat:').count()>=1)
    shot(tp,'t06-teacher-qr')

    # ── Student A: fresh device, QR link → /j/ page → continue in the browser → sign up → nickname → test → result.
    ac,ap=phone()
    ap.goto(B+f'/j/?c={G["code"]}&a={aid}&lang=uz&shot=1');ap.wait_for_selector('#code');shot(ap,'a01-landing')
    check('landing page says an account is needed',ap.get_by_text('hisobingiz bilan').count()>=1)
    web=ap.locator('#web').get_attribute('href');check('"continue in the browser" keeps the code and the test',web==f'/?join={G["code"]}&a={aid}&lang=uz')
    ap.goto(B+web+'&shot=1');ap.wait_for_selector('.qj-signin',timeout=15000);ap.wait_for_timeout(400)
    check('signed out: the sheet asks to sign in (no anonymous account)',ap.get_by_text('Avval hisobingizga kiring').count()==1 and ap.locator('#qj-nick').count()==0)
    bar=ap.locator('.quiz-run-bar').bounding_box();check('join sheet bar clears the notch',bar['y']>=47)
    shot(ap,'a02-signin-needed')
    ap.get_by_role('button',name='Ro‘yxatdan o‘tish').tap();ap.wait_for_selector('input[name=fullname]')
    ea=f'gayrat+{time.time_ns()}@example.com'
    ap.fill('input[name=fullname]','G‘ayrat Usmonov');ap.fill('input[name=email]',ea)
    with ap.expect_response('**/api/auth/request-code') as rr:ap.locator('form .button[type=submit]').tap()
    codeA=rr.value.json()['devCode'];ap.wait_for_selector('.completion-code input');shot(ap,'a03-verify-email')
    ap.fill('.completion-code input',codeA);ap.get_by_role('button',name='Tasdiqlash').tap()
    ap.wait_for_selector('#qj-nick',timeout=15000);ap.wait_for_timeout(400)
    check('after sign-up the invite reopens by itself, at the nickname step',ap.locator('.qj-code').inner_text().replace(' ','')==G['code'])
    ap.locator('#qj-nick').fill('');ap.locator('#qj-nick').type('G’ayrat')
    check('iPhone apostrophe becomes a plain one as typed',ap.locator('#qj-nick').input_value()=="G'ayrat")
    ap.wait_for_timeout(400)  # the button fades from disabled to enabled (0.2 s transition) while the name is typed
    go=ap.get_by_role('button',name='Testni boshlash')
    check('start button enabled and fully opaque once a valid nickname is typed',go.is_enabled() and go.evaluate('e=>getComputedStyle(e).opacity')=='1')
    shot(ap,'a04-nickname')
    ap.get_by_role('button',name='Testni boshlash').tap()
    seenA=[];answer_all(ap,seen=seenA)
    ap.wait_for_selector('.quiz-run-result',timeout=10000);ap.wait_for_timeout(500);shot(ap,'a05-result')
    check('student sees the score; right answers only after the deadline',ap.locator('.qr-ring').count()==1 and ap.get_by_text('muddat tugagach').count()>=1 and ap.locator('.lg-review').count()==0)
    btn=ap.locator('.quiz-run-result .button').last.bounding_box()
    check('result button above the home indicator',btn['y']+btn['height']<=844-34+1)
    tokA=[c for c in ac.cookies() if c['name']=='de_session'][0]['value']

    # ── Students B and C (signed in): nickname rules, double-opened link, reload mid-test.
    bc,bp=phone(S['B'])
    bp.goto(B+f'/?join={G["code"]}&a={aid}&lang=uz&shot=1');bp.wait_for_selector('#qj-nick',timeout=15000)
    bp.locator('#qj-nick').fill('😀😀');bp.get_by_role('button',name='Testni boshlash').tap();bp.wait_for_timeout(400)
    check('emoji nickname: clear message, nothing sent',bp.locator('.qj-err').count()==1 and 'Email, havola va emoji' in bp.locator('.qj-err').inner_text())
    shot(bp,'b01-bad-nickname')
    bp.locator('#qj-nick').fill('Bobur');bp.get_by_role('button',name='Testni boshlash').tap()
    seenB=[];answer_all(bp,seen=seenB);bp.wait_for_selector('.quiz-run-result',timeout=10000)
    cc,cp=phone(S['C'])
    cp.goto(B+f'/?join={G["code"]}&a={aid}&lang=uz&shot=1');cp.wait_for_selector('#qj-nick',timeout=15000)
    cp.locator('#qj-nick').fill('Lola');cp.get_by_role('button',name='Testni boshlash').tap()
    seenC=[];answer_all(cp,stop=2,seen=seenC);cp.wait_for_timeout(600)
    q_before=cp.locator('.qr-count').inner_text().split(' · ')[0]
    for _ in range(2):cp.evaluate(f"dispatchEvent(new CustomEvent('de:join',{{detail:{{code:'{G['code']}',testId:'{aid}'}}}}))");cp.wait_for_timeout(300)
    check('opening the same link twice mid-test: one sheet, same question',cp.locator('.quiz-run').count()==1 and cp.locator('.qr-count').inner_text().split(' · ')[0]==q_before)
    tp.wait_for_timeout(5500)
    check('teacher screen shows C answering and A, B submitted',tp.locator('.lg-live .lg-row.s1').count()==1 and tp.locator('.lg-live .lg-row.s2').count()==2)
    tp.locator('.lg-live').scroll_into_view_if_needed();shot(tp,'t07-teacher-live')
    cp.reload();cp.wait_for_selector('.quiz-run-options button',timeout=15000);cp.wait_for_timeout(500)
    check('reload mid-test resumes the attempt (pending test)',cp.locator('.qr-count').inner_text().startswith('3 /'))
    rest=[];k=2
    while True:
        rest.append(cp.locator('.qr-card h3').inner_text().strip());cp.locator('.quiz-run-options button').nth(k%3).tap();cp.wait_for_timeout(200);k+=1
        last=cp.get_by_role('button',name='Topshirish')
        if last.count():last.first.tap();break
        cp.get_by_role('button',name='Keyingi').first.tap();cp.wait_for_timeout(200)
    seenC=seenC[:2]+rest;cp.wait_for_selector('.quiz-run-result',timeout=10000)

    # ── Variants: three different sets, each the Python reference draw for that account.
    def uid(tok):return call('/auth/me',token=tok)[1]['user']['id']
    exp={k:[qtext(items[i]) for i in draw(aid,uid(tok),items,5,TID)] for k,tok in [('A',tokA),('B',S['B']),('C',S['C'])]}
    check('student A saw exactly their drawn questions',seenA==exp['A'])
    check('student B saw exactly their drawn questions',seenB==exp['B'])
    check('student C saw exactly their drawn questions (across the reload)',seenC==exp['C'])
    check('the three students got three different question sets',len({tuple(sorted(x)) for x in (seenA,seenB,seenC)})==3)

    # ── Teacher screen and big screen: all three results.
    tp.wait_for_timeout(5500)
    names=sorted(x.strip() for x in tp.locator('.lg-live .lg-row strong').all_inner_texts())
    check('teacher screen lists all three by nickname, all submitted',names==["Bobur","G'ayrat","Lola"] and tp.locator('.lg-live .lg-row.s2').count()==3)
    tp.locator('.lg-live').scroll_into_view_if_needed();shot(tp,'t08-teacher-results')
    tvc,tv=phone(T,notch=False,viewport={'width':1280,'height':720},is_mobile=False,has_touch=False,device_scale_factor=1)
    tv.goto(B+'/?screen=teacher&lang=uz&shot=1');tv.wait_for_selector('.classroom');tv.wait_for_timeout(500)
    tv.locator('.lg-row',has_text=G['name']).click();tv.wait_for_timeout(400)
    tv.locator('.lg-row',has_text=subj['title']['uz']).click();tv.locator('.lg-row',has_text=topic['title']['uz']).click();tv.wait_for_timeout(700)
    tv.get_by_role('button',name='Katta ekran · QR').click();tv.wait_for_selector('.bs-row',timeout=10000);tv.wait_for_timeout(900)
    check('big screen: three rows submitted, by nickname only',tv.locator('.bs-row.s2').count()==3 and sorted(x.strip() for x in tv.locator('.bs-name').all_inner_texts())==["Bobur","G'ayrat","Lola"])
    check('big screen shows the QR while the test runs',tv.locator('svg.bs-qr').count()==1)
    shot(tv,'t09-bigscreen-1280')

    # ── The teacher opens their own QR: a clear panel and a preview that sends nothing.
    sent=[];tp.on('request',lambda r:sent.append(r.url) if r.method=='POST' and re.search(r'/api/classroom/(start|progress|submit|quick)',r.url) else None)
    tp.goto(B+f'/?join={G["code"]}&a={aid}&lang=uz&shot=1');tp.wait_for_selector('.qj-owner',timeout=15000);tp.wait_for_timeout(400)
    check('own code: "you teach this group" panel',tp.get_by_text('Siz bu guruhning ustozisiz').count()==1)
    shot(tp,'t10-own-code-panel')
    sent.clear()
    tp.get_by_role('button',name='Talaba ko‘rinishida sinash').tap()
    seenT=[];answer_all(tp,seen=seenT);tp.wait_for_selector('text=Sinov tugadi',timeout=10000);tp.wait_for_timeout(300)
    check('preview: 5 questions = the teacher account\'s own draw',seenT==[qtext(items[i]) for i in draw(aid,uid(T),items,5,TID)])
    check('preview sent nothing to the classroom API',sent==[])
    check('preview is not in the results',len(call(f'/classroom/assignments?groupId={G["id"]}&assignmentId={aid}',token=T)[1]['members'])==3)
    shot(tp,'t11-preview-result')

    # ── Clear errors.
    dc,dp=phone(login('student','Talaba D')[0])
    dp.goto(B+'/?join=ZZZZZZ&lang=uz&shot=1');dp.wait_for_selector('.qj-done',timeout=15000)
    check('wrong code: clear message',dp.get_by_text('Bunday kodli guruh topilmadi').count()==1);shot(dp,'d01-wrong-code')
    dp.goto(B+'/?join=G0R1BA&lang=uz&shot=1');dp.wait_for_selector('.qj-done',timeout=15000)
    check('0/O/1/I in a code: explained',dp.get_by_text('0, O, 1 va I').count()==1);shot(dp,'d02-ambiguous-code')
    ec,ep=phone(login('student','Talaba E')[0])
    ep.goto(B+'/?screen=student&lang=uz&shot=1');ep.wait_for_selector('.classroom')
    # The app's own files are in the bundle on a phone; only the network to the API goes away.
    ep.route('**/api/**',lambda r:r.abort('internetdisconnected'))
    ep.evaluate(f"dispatchEvent(new CustomEvent('de:join',{{detail:{{code:'{G['code']}',testId:'{aid}'}}}}))");ep.wait_for_selector('.qj-done',timeout=15000)
    check('offline: clear message and a retry button',ep.get_by_text('Internet aloqasi yo‘q').count()>=1 and ep.get_by_role('button',name='Qayta urinish').count()==1)
    shot(ep,'e01-offline');ep.unroute('**/api/**')
    FC,fp=phone(login('student','Talaba F')[0])
    fp.goto(B+'/?screen=student&lang=uz&shot=1');fp.wait_for_selector('.classroom')
    sql("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE name='Talaba F')")
    fp.evaluate(f"dispatchEvent(new CustomEvent('de:join',{{detail:{{code:'{G['code']}',testId:'{aid}'}}}}))");fp.wait_for_selector('.qj-signin',timeout=15000)
    check('expired session: sign in again, the invite is kept',fp.get_by_text('Sessiya tugagan').count()>=1 and fp.evaluate("JSON.parse(localStorage.getItem('de_quick')).stage")=='signin')
    shot(fp,'f01-session-expired')
    print('page errors:',errs[:5]);check('no page errors',not errs)
    print(f'{n} checks passed')
