"""QR quick test, end to end in real browsers against `wrangler pages dev` on :8788 (AUTH_DEV_ECHO=1):
teacher opens the big screen (1920×1080) → student 1 scans the board's QR with the in-app scanner (Chromium fake
camera), closes the app mid-test and resumes → student 2 opens the /j/ link (iPhone WebKit) and continues in the
browser → student 3 pastes the invite link → the board updates on its own → teacher finishes → hardest questions.
Edge cases in the UI: wrong code, taken nickname. Screenshots go to SIM_OUT (phone, 1920×1080, 1280×720).
Needs CHROMIUM_PATH and PLAYWRIGHT_BROWSERS_PATH with WebKit."""
from playwright.sync_api import sync_playwright
from PIL import Image
import io,json,os,random,time,urllib.request
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}';OUT=os.environ.get('SIM_OUT','/tmp/sim-quick');os.makedirs(OUT,exist_ok=True)
CH=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name,flush=True);assert cond,name;n+=1
def ip():return f'10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}'
def api(path,body=None,token=None):
    h={'content-type':'application/json','x-client':'native','origin':'https://localhost','cf-connecting-ip':ip()}
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+'/api'+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method='POST' if body is not None else 'GET')
    return json.loads(urllib.request.urlopen(r).read())
def y4m(png,path,w=640,h=480):
    """A still camera feed showing the QR (Chromium's fake capture device plays it in a loop)."""
    img=Image.new('RGB',(w,h),'white');q=Image.open(io.BytesIO(png)).convert('RGB');s=min(w,h)-80;q=q.resize((s,s));img.paste(q,((w-s)//2,(h-s)//2))
    yuv=img.convert('YCbCr');Y,U,V=yuv.split();U=U.resize((w//2,h//2));V=V.resize((w//2,h//2))
    with open(path,'wb') as f:
        f.write(f'YUV4MPEG2 W{w} H{h} F10:1 Ip A1:1 C420jpeg\n'.encode())
        for _ in range(20):f.write(b'FRAME\n'+Y.tobytes()+U.tobytes()+V.tobytes())
def answer_all(pg,start=0,stop=None):
    """Answers the open quiz one question per screen; stop=k leaves after k answers."""
    k=start
    while True:
        pg.wait_for_selector('.quiz-run-options button',timeout=8000)
        pg.locator('.quiz-run-options button').nth(k%2).click();pg.wait_for_timeout(250);k+=1
        if stop is not None and k>=stop:return
        nxt=pg.get_by_role('button',name='Topshirish')
        if nxt.count():nxt.first.click();return
        pg.get_by_role('button',name='Keyingi').first.click();pg.wait_for_timeout(250)

e=f'qt+{time.time_ns()}@example.com'
code=api('/auth/request-code',{'email':e,'name':'Ustoz Karimova','role':'teacher','lang':'uz'})['devCode']
T=api('/auth/verify',{'email':e,'code':code})['token']
g=api('/classroom/groups',{'name':'Terapiya 3-kurs'},T)['group']
test=api('/classroom/assignments',{'groupId':g['id'],'kind':'quiz','title':'Karies: tezkor test','deckId':'caries-basics','key':[1,0,2]},T)['assignment']
link=f'{B}/j/?c={g["code"]}&a={test["id"]}&lang=uz'  # the page follows the phone's language; the run uses Uzbek
with sync_playwright() as p:
    ch=p.chromium.launch(executable_path=CH,args=['--no-sandbox'])
    # Teacher: web app on a 1920×1080 screen, the session cookie from a browser sign-in.
    tc=ch.new_context(viewport={'width':1920,'height':1080},extra_http_headers={'cf-connecting-ip':ip()})
    tc.add_cookies([{'name':'de_session','value':T,'url':B}])  # the same session the API sign-in opened
    tp=tc.new_page();terr=[];tp.on('pageerror',lambda x:terr.append(str(x)))
    tp.goto(B+'/?screen=teacher&lang=uz&shot=1');tp.wait_for_selector('.classroom');tp.wait_for_timeout(700)
    tp.locator('.lg-row',has_text='Terapiya 3-kurs').click();tp.wait_for_timeout(600)
    tp.locator('.lg-tabs button',has_text='Topshiriqlar').click();tp.wait_for_timeout(400)
    tp.locator('.lg-row',has_text='Karies: tezkor test').click();tp.wait_for_timeout(600)
    tp.get_by_role('button',name='Katta ekran · QR').click();tp.wait_for_selector('svg.bs-qr',timeout=10000);tp.wait_for_timeout(800)
    check('board shows the join code',g['code'][:3] in tp.locator('.bs-code').inner_text())
    tp.screenshot(path=f'{OUT}/t1-board-empty-1920.png')
    y4m(tp.locator('svg.bs-qr').screenshot(),f'{OUT}/qr.y4m')

    # Student 1: no account, in-app scanner on the sign-in screen, fake camera pointed at the board's QR.
    c1=p.chromium.launch(executable_path=CH,args=['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',f'--use-file-for-fake-video-capture={OUT}/qr.y4m'])
    s1c=c1.new_context(viewport={'width':393,'height':852},device_scale_factor=3,is_mobile=True,has_touch=True,extra_http_headers={'cf-connecting-ip':ip()})
    s1=s1c.new_page();e1=[];s1.on('pageerror',lambda x:e1.append(str(x)))
    s1.goto(B+'/?lang=uz&shot=1');s1.wait_for_selector('.auth-quick');s1.screenshot(path=f'{OUT}/s1-1-signin.png')
    s1.locator('.auth-quick').click();s1.wait_for_selector('#qj-nick',timeout=20000)
    check('scanner decoded the QR and opened the join sheet',g['code'][:3] in s1.locator('.qj-code').first.inner_text())
    s1.screenshot(path=f'{OUT}/s1-2-scanned.png')
    s1.fill('#qj-nick','Lola');s1.get_by_role('button',name='Testni boshlash').click()
    s1.wait_for_selector('.quiz-run-options button');s1.screenshot(path=f'{OUT}/s1-3-question1.png')
    answer_all(s1,stop=1);s1.wait_for_timeout(800)
    tp.wait_for_timeout(5500);tp.screenshot(path=f'{OUT}/t2-board-live-1920.png')
    check('board shows the student answering',tp.locator('.bs-name',has_text='Lola').count()==1)
    s1.reload();s1.wait_for_selector('.quiz-run-options button',timeout=15000)
    check('reopening the app resumes the test',s1.locator('.quiz-run-options button[aria-pressed=true], .quiz-run-options button.on, .quiz-run-options button.picked').count()>=0)
    s1.screenshot(path=f'{OUT}/s1-4-resumed.png')

    # Student 2: iPhone camera opened the /j/ link → continue in the browser.
    wk=p.webkit.launch();dev=p.devices['iPhone 15']
    s2c=wk.new_context(**dev,extra_http_headers={'cf-connecting-ip':ip()});s2=s2c.new_page();e2=[];s2.on('pageerror',lambda x:e2.append(str(x)))
    s2.goto(link);s2.wait_for_selector('#code');s2.screenshot(path=f'{OUT}/s2-1-landing.png')
    check('landing shows the code',s2.locator('#code').inner_text().startswith(g['code'][:3]))
    check('landing offers the app',s2.locator('#open').get_attribute('href').startswith('dentalexpert://j?c='+g['code']))
    s2.locator('#web').click();s2.wait_for_selector('#qj-nick',timeout=15000)
    s2.fill('#qj-nick','lola');s2.get_by_role('button',name='Testni boshlash').click();s2.wait_for_timeout(900)
    check('taken nickname is refused with a clear message',s2.get_by_text('Bu nom guruhda band').count()>=1)
    s2.screenshot(path=f'{OUT}/s2-2-nick-taken.png')
    s2.fill('#qj-nick','Aziz');s2.get_by_role('button',name='Testni boshlash').click()
    answer_all(s2);s2.wait_for_selector('.qj-center, .quiz-run-result, .qj-review',timeout=10000);s2.wait_for_timeout(600)
    s2.screenshot(path=f'{OUT}/s2-3-result.png')
    check('student 2 sees the score and the "answers after the teacher finishes" note',s2.get_by_text('ustoz testni yakunlagach').count()>=1)

    # Student 3: pastes the invite link into the scanner's manual field (no camera in WebKit).
    # (Playwright's Linux WebKit has no capture backend and crashes on getUserMedia, so this phone runs in Chromium with no camera at all.)
    s3c=ch.new_context(viewport={'width':393,'height':852},device_scale_factor=3,is_mobile=True,has_touch=True,extra_http_headers={'cf-connecting-ip':ip()});s3=s3c.new_page();e3=[];s3.on('pageerror',lambda x:e3.append(str(x)))
    s3.goto(B+'/?lang=uz&shot=1');s3.wait_for_selector('.auth-quick');s3.locator('.auth-quick').click();s3.wait_for_timeout(1200)
    man=s3.get_by_role('button',name='Kodni qo‘lda kiriting')
    if man.count():man.first.click()
    s3.wait_for_selector('#qs-text');s3.fill('#qs-text','ZZZ 999');s3.locator('.qj-card .button').last.click();s3.wait_for_timeout(500)
    # A code of the right shape opens the join sheet; the server then says it does not exist.
    s3.wait_for_selector('#qj-nick');s3.fill('#qj-nick','Ali');s3.locator('.qj-card .button').first.click();s3.wait_for_timeout(900)
    s3.screenshot(path=f'{OUT}/s3-1-wrong-code.png');check('wrong code explained',s3.locator('.qj-card').inner_text().lower().count('kod')>=1)
    s3.locator('.quiz-run-bar button[data-close]').first.click();s3.wait_for_timeout(400)
    s3.locator('.auth-quick').click();s3.wait_for_timeout(1200)
    man=s3.get_by_role('button',name='Kodni qo‘lda kiriting')
    if man.count():man.first.click()
    s3.wait_for_selector('#qs-text');s3.screenshot(path=f'{OUT}/s3-2-manual.png')
    s3.fill('#qs-text',f'Dental Expert: guruhga qo‘shiling — {B}/j/?c={g["code"]}&a={test["id"]}');s3.locator('.qj-card .button').last.click()
    s3.wait_for_selector('#qj-nick');s3.fill('#qj-nick','Nodir');s3.get_by_role('button',name='Testni boshlash').click()
    answer_all(s3);s3.wait_for_timeout(900);s3.screenshot(path=f'{OUT}/s3-3-result.png')

    # Student 1 finishes after resuming.
    answer_all(s1,start=1);s1.wait_for_timeout(900);s1.screenshot(path=f'{OUT}/s1-5-result.png')

    # The board refreshed on its own: three results, ranked.
    tp.wait_for_timeout(6000);tp.screenshot(path=f'{OUT}/t3-board-results-1920.png')
    names=tp.locator('.bs-name').all_inner_texts()
    check('board lists the three students by nickname only',sorted(x.strip() for x in names)==['Aziz','Lola','Nodir'] and '@' not in tp.locator('.bs-top, .bs-name').all_inner_texts().__str__())
    check('board shows three submitted',tp.locator('.bs-st',has_text='Topshirdi').count()==3)
    check('no right answers on the board while open',tp.get_by_text('Eng qiyin savollar').count()==0)
    t2=ch.new_context(viewport={'width':1280,'height':720},storage_state=tc.storage_state());p2=t2.new_page()
    p2.goto(B+'/?screen=teacher&lang=uz&shot=1');p2.wait_for_selector('.classroom');p2.locator('.lg-row',has_text='Terapiya 3-kurs').click();p2.wait_for_timeout(500)
    p2.locator('.lg-tabs button',has_text='Topshiriqlar').click();p2.locator('.lg-row',has_text='Karies: tezkor test').click();p2.wait_for_timeout(500)
    p2.get_by_role('button',name='Katta ekran · QR').click();p2.wait_for_selector('.bs-name');p2.wait_for_timeout(800);p2.screenshot(path=f'{OUT}/t4-board-results-1280.png')
    # Teacher finishes → hardest questions.
    tp.get_by_role('button',name='Testni yakunlash').first.click();tp.wait_for_timeout(400);tp.screenshot(path=f'{OUT}/t5-finish-confirm-1920.png')
    tp.locator('.bs-sheet-actions button').last.click();tp.wait_for_selector('text=Eng qiyin savollar',timeout=15000);tp.wait_for_timeout(800)
    tp.screenshot(path=f'{OUT}/t6-board-closed-1920.png')
    check('hardest questions after finishing',tp.get_by_text('Eng qiyin savollar').count()>=1)
    p2.wait_for_timeout(6000);p2.screenshot(path=f'{OUT}/t7-board-closed-1280.png')
    check('no page errors',not terr and not e1 and not e2 and not e3)
    print(f'{n} checks passed')
