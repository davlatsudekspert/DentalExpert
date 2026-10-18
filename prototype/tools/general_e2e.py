"""General test and the new assign settings, end to end on WebKit phones against the local `wrangler pages dev`
(DE_PORT, AUTH_DEV_ECHO=1, D1_PERSIST): an iPhone (390×844) and a small phone (360×640) with text 1.3× larger (every
CSS font size scaled, as with the system's larger text). On each: the teacher opens "Umumiy test berish", picks two
subjects with "Hammasini tanlash" and a search, chooses 50 questions, 20 minutes, variants on (the open window stays
1 day), assigns; a student solves it; the teacher's live page shows the result. Nothing may be cut off: no sideways
scrolling, no chip, button or select whose text is clipped. On both: a teacher's "Mavzu bo‘yicha test" asks
"Guruhga topshirish" / "O‘zim yechib ko‘rish" and the first opens that topic's settings in the group, where the
disabled "Testni boshlash" says why (the topic is not open yet) and, with variants on, the lone count chip stays a pill.
On the iPhone also: "O‘zim yechib ko‘rish" starts a practice run, a student's starts the test at once. Screenshots go to SIM_OUT. Needs PLAYWRIGHT_BROWSERS_PATH with WebKit."""
import json,os,re,sys,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from classroom_test_lib import ROOT,call,login  # noqa: E402
PORT=os.environ.get('DE_PORT','8788');B=f'http://127.0.0.1:{PORT}'
OUT=os.environ.get('SIM_OUT','/tmp/sim-general');os.makedirs(OUT,exist_ok=True)
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name,flush=True);assert cond,name;n+=1
idx=json.load(open(os.path.join(ROOT,'src/curriculum/index.json')))
subj={s['id']:s['title']['uz'] for s in idx['subjects']}
def scaled(k):
    """Routes CSS through a font-size multiplier (k=1.3 emulates the phone's larger text setting)."""
    def h(route):
        r=route.fetch();body=r.text()
        if k!=1:
            body=re.sub(r'font-size:\s*([\d.]+)px',lambda m:f'font-size:{float(m.group(1))*k:.2f}px',body)
            body=re.sub(r'(font:\s*(?:[\w-]+\s+)*?)([\d.]+)px',lambda m:f'{m.group(1)}{float(m.group(2))*k:.2f}px',body)
        route.fulfill(response=r,body=body,headers={**r.headers,'content-type':'text/css'})
    return h
CLIPPED="""()=>{const out=[];const ow=document.documentElement.scrollWidth-innerWidth;if(ow>1)out.push('page scrolls sideways by '+ow+'px');
 const scope=':is(.lg-group,.lg-section,.quiz-run,.lg-confirm) ';for(const e of document.querySelectorAll(['.lg-chips>button','.lg-custom','.button','select','.lg-source-title','.lg-link','.lg-tag'].map(x=>scope+x).join(','))){const r=e.getBoundingClientRect();if(!r.width)continue;
  if(e.scrollWidth>e.clientWidth+1)out.push((e.textContent||e.value||e.tagName).trim().slice(0,40)+' clipped');
  if(r.right>innerWidth+1||r.left<-1)out.push((e.textContent||'').trim().slice(0,40)+' off screen')}
 for(const s of document.querySelectorAll(scope+'select')){const c=document.createElement('canvas').getContext('2d');const cs=getComputedStyle(s);c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
  const room=s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-20;for(const o of s.options)if(c.measureText(o.text).width>room)out.push('option "'+o.text+'" does not fit')}
 return out}"""

with sync_playwright() as p:
    wk=p.webkit.launch();errs=[]  # WebKit reports an in-flight API poll cut off by a closing page or a deliberate offline route as 'due to access control checks': not an app error
    for vp,k,tag in [((390,844),1.0,'iphone'),((360,640),1.3,'small13')]:
        T,_=login('teacher','Ustoz Umumiy');S,_=login('student','Talaba Umumiy')
        g=call('/classroom/groups','POST',{'name':f'Umumiy {tag}'},T)[1]['group']
        call('/classroom/join','POST',{'code':g['code'],'nickname':'Madina'},S)
        def phone(tok):
            c=wk.new_context(viewport={'width':vp[0],'height':vp[1]},device_scale_factor=3 if tag=='iphone' else 2,is_mobile=True,has_touch=True,
                             user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
            c.add_cookies([{'name':'de_session','value':tok,'url':B}]);c.route('**/*.css',scaled(k))
            pg=c.new_page();pg.on('pageerror',lambda x:None if 'due to access control checks' in str(x) else errs.append(str(x)));return pg
        def shot(pg,name):pg.screenshot(path=f'{OUT}/{tag}-{name}.png')
        def nocut(pg,where):
            bad=pg.evaluate(CLIPPED)
            if bad:print('   ',bad[:8],flush=True);shot(pg,'cut-'+re.sub(r'\W+','-',where))
            check(f'{tag}: nothing cut off — {where}',not bad)
        tp=phone(T)
        tp.goto(B+'/?screen=teacher&lang=uz&shot=1');tp.wait_for_selector('.classroom');tp.wait_for_timeout(500)
        tp.locator('.lg-row',has_text=g['name']).tap();tp.wait_for_timeout(500)
        check(f'{tag}: group page offers both tests',tp.get_by_role('button',name='Mavzu testi berish').count()==1 and tp.get_by_role('button',name='Umumiy test berish').count()==1)
        shot(tp,'g01-group');nocut(tp,'group page')
        tp.get_by_role('button',name='Umumiy test berish').tap();tp.wait_for_selector('.lg-general');tp.wait_for_timeout(400)
        shot(tp,'g02-general-empty');nocut(tp,'general test, nothing chosen')
        # Two sources with "Hammasini tanlash", one more topic through the search.
        for sid in ('perio','endo'):
            head=tp.locator('.lg-source',has_text=subj[sid]).first
            head.locator('.lg-link',has_text='Hammasini tanlash').tap();tp.wait_for_timeout(150)
        tp.locator('.lg-search input').fill('karies');tp.wait_for_timeout(300)
        shot(tp,'g03-search');nocut(tp,'search results')
        check(f'{tag}: search shows matching topics expanded',tp.locator('.lg-source.open .lg-check').count()>=1)
        tp.locator('.lg-source.open .lg-check input').first.check();tp.locator('.lg-search input').fill('');tp.wait_for_timeout(300)
        chosen=tp.locator('.lg-chosen').inner_text()
        check(f'{tag}: 17 topics · 170 questions chosen',chosen.startswith('17 ta mavzu') and '170 ta savol' in chosen)
        check(f'{tag}: auto title names the subjects',tp.locator('.lg-general label',has_text='Test nomi').locator('input').input_value().startswith('Umumiy test: '))
        cnt=tp.locator('.lg-pick',has_text='Savollar soni')
        check(f'{tag}: count presets 10/20/30/50 and no "Barcha" above 50',[x.strip() for x in cnt.locator('.lg-chips>button').all_inner_texts()]==['10','20','30','50'])
        cnt.locator('button',has_text='50').tap()
        tp.locator('.lg-pick',has_text='Vaqt chegarasi').locator('button',has_text='20 daq.').tap()
        vb=tp.locator('label.lg-check',has_text='Har bir talabaga boshqa savollar');vb.locator('input').check()
        op=tp.locator('.lg-pick',has_text='Test qancha vaqt ochiq turadi')
        check(f'{tag}: open window defaults to 1 day, explained apart from the time limit',op.locator('button.on').inner_text().strip()=='1 kun' and 'yechish vaqti emas' in op.inner_text())
        tp.locator('.lg-general .lg-setup').scroll_into_view_if_needed();shot(tp,'g04-settings')
        tp.get_by_role('button',name=re.compile('Guruhga topshirish')).scroll_into_view_if_needed();shot(tp,'g05-settings-bottom');nocut(tp,'settings')
        tp.get_by_role('button',name=re.compile('Guruhga topshirish')).tap()
        tp.wait_for_selector('.bs',timeout=15000);tp.wait_for_timeout(500)
        if tp.locator('.bs-sheet').count():tp.locator('.bs-sheet-actions button').first.tap()
        tp.locator('.bs-close').tap();tp.wait_for_selector('.lg-qrcard',timeout=10000);tp.wait_for_timeout(300)
        a=[x for x in call(f'/classroom/assignments?groupId={g["id"]}',token=T)[1]['assignments'] if x.get('general')][0]
        check(f'{tag}: assigned: 50 per student, 20 min, variants over 170, 1-day window',a['questionCount']==50 and a['minutes']==20 and a['variant'] and len(a['items'])==170 and a['deadlineAt'])
        shot(tp,'g06-live');nocut(tp,'live page')
        # The student solves it.
        sp=phone(S)
        sp.goto(B+f'/?join={g["code"]}&a={a["id"]}&lang=uz&shot=1');sp.wait_for_selector('.quiz-run-options button',timeout=20000)
        check(f'{tag}: student (already in the group) goes straight into the 50-question test',sp.locator('.qr-count').inner_text().startswith('1 / 50'))
        shot(sp,'s01-question');nocut(sp,'question')
        for i in range(50):
            sp.locator('.quiz-run-options button').nth(i%3).tap()
            nxt=sp.get_by_role('button',name='Topshirish') if i==49 else sp.get_by_role('button',name='Keyingi')
            nxt.first.tap()
        sp.wait_for_selector('.quiz-run-result',timeout=15000);sp.wait_for_timeout(400);shot(sp,'s02-result');nocut(sp,'result')
        check(f'{tag}: student sees the score out of 50',sp.locator('.qr-ring b').inner_text().strip().endswith('/ 50'))
        tp.wait_for_timeout(5500);tp.locator('.lg-live').scroll_into_view_if_needed()
        check(f'{tag}: the teacher sees the result live',tp.locator('.lg-live .lg-row.s2').count()==1 and '/50' in tp.locator('.lg-live .lg-row.s2').inner_text())
        shot(tp,'g07-teacher-result')
        # Topic page: a teacher chooses; "Guruhga topshirish" opens the topic's settings in the (only) group.
        tp.goto(B+'/?screen=courses&lang=uz&shot=1');tp.wait_for_selector('.learn');tp.locator('.learn-tabs button',has_text='O‘quv reja').tap();tp.wait_for_timeout(400)
        tp.locator('.lg-section .lg-row',has_text=subj['perio']).tap();tp.wait_for_timeout(300);tp.locator('.lg-section .lg-row').first.tap();tp.wait_for_timeout(600)
        tp.locator('.lg-selftest .button').tap();tp.wait_for_selector('.lg-choose')
        check(f'{tag}: teacher: the topic test asks first (group or myself), no test opened yet',tp.locator('.quiz-run').count()==0 and tp.get_by_role('button',name='Guruhga topshirish').count()==1 and tp.get_by_role('button',name='O‘zim yechib ko‘rish').count()==1)
        tp.wait_for_timeout(500);shot(tp,'t01-topic-choice');nocut(tp,'choice')
        tp.get_by_role('button',name='Guruhga topshirish').tap();tp.wait_for_selector('.lg-setup',timeout=15000);tp.wait_for_timeout(400)
        check(f'{tag}: "Guruhga topshirish" opens that topic\'s test settings in the group',tp.get_by_role('button',name=re.compile('Talabalarga ochish|Talabalardan yashirish')).count()==1)
        tp.locator('.lg-setup').first.scroll_into_view_if_needed();shot(tp,'t02-topic-settings');nocut(tp,'topic settings')
        # The topic is not open to students yet: "Testni boshlash" is off and a line under it says why.
        start=tp.locator('.lg-setup .button',has_text='Testni boshlash')
        check(f'{tag}: closed topic: start is off and explained',start.is_disabled() and 'Talabalarga ochish' in tp.locator('.lg-why').inner_text())
        start.scroll_into_view_if_needed();shot(tp,'t03-start-why');nocut(tp,'start reason')
        # Variants on: the count row keeps one preset chip next to "Boshqa"; it stays a pill, not a tall stretched one.
        cnt=tp.locator('.lg-setup .lg-pick',has_text='Savollar soni').first
        cnt.locator('.lg-chips>button',has_text='5').first.tap();tp.wait_for_timeout(150)
        tp.locator('.lg-setup label.lg-check',has_text='Har bir talabaga boshqa savollar').locator('input').check();tp.wait_for_timeout(200)
        cnt.scroll_into_view_if_needed();shot(tp,'t04-variant-count');nocut(tp,'variant count')
        dims=cnt.evaluate("e=>{const b=[...e.querySelectorAll('.lg-chips>button')].map(x=>x.getBoundingClientRect());const c=e.querySelector('.lg-custom').getBoundingClientRect();return {b:b.map(r=>[r.width,r.height]),c:c.height}}")
        check(f'{tag}: with variants the preset chip keeps its pill shape beside "Boshqa"',len(dims['b'])==1 and all(h<=dims['c']+1 and h<=w*1.4+12 for w,h in dims['b']) and all(abs(h-dims['c'])<=8 for _,h in dims['b']))
        if tag=='iphone':
            tp.goto(B+'/?screen=courses&lang=uz&shot=1');tp.wait_for_selector('.learn');tp.locator('.learn-tabs button',has_text='O‘quv reja').tap();tp.wait_for_timeout(400)
            tp.locator('.lg-section .lg-row',has_text=subj['perio']).tap();tp.wait_for_timeout(300);tp.locator('.lg-section .lg-row').first.tap();tp.wait_for_timeout(600)
            tp.locator('.lg-selftest .button').tap();tp.get_by_role('button',name='O‘zim yechib ko‘rish').tap();tp.wait_for_selector('.quiz-run-options button',timeout=10000)
            check('"O‘zim yechib ko‘rish" starts the teacher\'s own practice run',tp.locator('.quiz-run').count()==1)
            sp.goto(B+'/?screen=courses&lang=uz&shot=1');sp.wait_for_selector('.learn');sp.locator('.learn-tabs button',has_text='O‘quv reja').tap();sp.wait_for_timeout(400)
            sp.locator('.lg-section .lg-row',has_text=subj['perio']).tap();sp.wait_for_timeout(300);sp.locator('.lg-section .lg-row').first.tap();sp.wait_for_timeout(600)
            sp.locator('.lg-selftest .button').tap();sp.wait_for_selector('.quiz-run-options button',timeout=10000)
            check('a student\'s topic test opens at once (no choice)',sp.locator('.lg-choose').count()==0)
    check('no page errors',not errs)
    print(f'{n} checks passed')
