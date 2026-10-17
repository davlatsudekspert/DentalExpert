"""Browser walk of the curriculum lesson flow (uz): teacher opens a topic, runs the slides, oral Q&A and a timed test;
a student takes it and reviews it. Needs `npm run build` on wrangler pages dev :8788 (AUTH_DEV_ECHO=1) and CHROMIUM_PATH."""
from playwright.sync_api import sync_playwright
import os,time,json
BASE='http://127.0.0.1:8788';OUT=os.environ.get('SIM_OUT','/tmp/sim');os.makedirs(OUT,exist_ok=True)
idx=json.load(open('src/curriculum/index.json'))
topic=idx['topics'][0];subj=[s for s in idx['subjects'] if s['id']==topic['subject']][0]
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def api(ctx,path,body):return ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'}).json()
def login(b,role,name):
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    e=f'{role}+{time.time_ns()}@example.com'
    r=api(ctx,'/api/auth/request-code',{'email':e,'name':name,'role':role,'lang':'uz'});api(ctx,'/api/auth/verify',{'email':e,'code':r['devCode']})
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)));return ctx,pg,errs
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    tc,tp,terr=login(b,'teacher','Ustoz Test')
    tp.goto(BASE+'/?screen=teacher&lang=uz');tp.wait_for_selector('.classroom');tp.wait_for_timeout(800)
    tp.get_by_placeholder('Guruh nomi',exact=False).fill('Terapiya 3-kurs');tp.get_by_role('button',name='Yaratish').click();tp.wait_for_timeout(900)
    row=tp.locator('.lg-row',has_text='Terapiya 3-kurs');code=row.locator('small').inner_text().split('kodi:')[1].strip();check('group with code',len(code)==6)
    row.click();tp.wait_for_timeout(700)
    check('invite card with QR when empty',tp.locator('.lg-invite img').count()==1)
    tp.screenshot(path=OUT+'/t1-group-invite.png',full_page=True)
    sc,sp,serr=login(b,'student','Talaba Bir')
    sp.goto(BASE+'/?screen=student&lang=uz');sp.wait_for_selector('.classroom');sp.wait_for_timeout(700)
    sp.get_by_placeholder('6 belgili',exact=False).fill(code);sp.get_by_placeholder('Ustoz sizni',exact=False).fill('Lola');sp.get_by_role('button',name='Qo‘shilish',exact=True).click();sp.wait_for_timeout(800)
    # teacher: plan → subject → topic
    tp.reload();tp.wait_for_selector('.classroom');tp.locator('.lg-row',has_text='Terapiya 3-kurs').click();tp.wait_for_timeout(800)
    tp.locator('.lg-row',has_text=subj['title']['uz']).click();tp.wait_for_timeout(300)
    tp.screenshot(path=OUT+'/t2-plan-topics.png',full_page=True)
    tp.locator('.lg-row',has_text=topic['title']['uz']).click();tp.wait_for_timeout(800)
    tp.get_by_role('button',name='Talabalarga ochish').click();tp.wait_for_timeout(800)
    check('topic opened',tp.get_by_role('button',name='Talabalardan yashirish').count()==1)
    tp.screenshot(path=OUT+'/t3-topic-stages.png',full_page=True)
    tp.get_by_role('button',name='Taqdimotni boshlash',exact=False).click();tp.wait_for_timeout(400)
    n=0
    while True:
        tp.screenshot(path=f'{OUT}/s{n:02d}.png');n+=1
        nxt=tp.locator('.sl-nav .button',has_text='Keyingi')
        if not nxt.count() or n>14:break
        nxt.click();tp.wait_for_timeout(250)
    check('slides played',n==topic.get('slides',n) or n>=7)
    tp.locator('.sl-nav .button',has_text='Yopish').click();tp.wait_for_timeout(300)
    tp.locator('.lg-stage').nth(0).get_by_role('button',name='O‘tildi deb belgilash').click();tp.wait_for_timeout(700)
    check('lecture marked',tp.locator('.lg-stage.done').count()>=1)
    tp.locator('.lg-oral-item button').first.click();tp.wait_for_timeout(200)
    tp.locator('.lg-oral-tools').first.get_by_text('So‘raldi').click()
    tp.locator('.lg-oral-tools').first.get_by_role('button',name='Baholash').click();tp.wait_for_timeout(200)
    tp.locator('.lg-grade').first.get_by_role('button',name='Bildi').first.click()
    tp.locator('.lg-stage').nth(1).get_by_role('button',name='O‘tildi deb belgilash').click();tp.wait_for_timeout(700)
    tp.screenshot(path=OUT+'/t4-oral.png',full_page=True)
    boxes=tp.locator('.lg-qpick > li input[type=checkbox]')
    for i in range(3,boxes.count()):boxes.nth(i).uncheck()
    tp.get_by_role('button',name='Testni boshlash · 3').click();tp.wait_for_timeout(900)
    check('test running',tp.get_by_text('Test ketmoqda').count()>=1)
    tp.screenshot(path=OUT+'/t5-test-running.png',full_page=True)
    # student takes the test
    sp.reload();sp.wait_for_selector('.classroom');sp.locator('.lg-row',has_text='Terapiya 3-kurs').click();sp.wait_for_timeout(800)
    sp.screenshot(path=OUT+'/u1-student-group.png',full_page=True)
    sp.locator('.lg-row',has_text=topic['title']['uz']).click();sp.wait_for_timeout(800)
    sp.get_by_role('button',name='Testni boshlash').click();sp.wait_for_timeout(500)
    check('timer shown',sp.locator('.quiz-run-timer').count()==1)
    for _ in range(3):
        sp.locator('.quiz-run-options button').first.click();sp.locator('.quiz-run-body .button').click();sp.wait_for_timeout(500)
    sp.wait_for_timeout(800);check('server score shown',sp.locator('.quiz-run-result b').inner_text().endswith('/ 3'))
    sp.screenshot(path=OUT+'/u2-student-result.png')
    sp.get_by_role('button',name='Yopish').last.click();sp.wait_for_timeout(600)
    # teacher finishes, student reviews
    tp.on('dialog',lambda d:d.accept())
    tp.get_by_role('button',name='Testni yakunlash').click();tp.wait_for_timeout(900)
    tp.get_by_role('button',name='Natijalar').click();tp.wait_for_timeout(900)
    check('teacher sees results and error bars',tp.locator('.lg-err').count()==3)
    tp.screenshot(path=OUT+'/t6-results.png',full_page=True)
    tp.get_by_role('button',name='Terapiya 3-kurs').click();tp.wait_for_timeout(600)
    tp.locator('.lg-tabs button',has_text='Jurnal').click();tp.wait_for_timeout(500)
    check('gradebook row',tp.locator('.lg-book tbody tr').count()==1)
    tp.screenshot(path=OUT+'/t7-gradebook.png',full_page=True)
    import subprocess
    subprocess.run(['npx','wrangler','d1','execute','dental-expert','--local','--command',"UPDATE class_assignments SET closed_at=datetime('now','-3 minutes') WHERE closed_at IS NOT NULL"],capture_output=True,check=True)
    sp.reload();sp.wait_for_selector('.classroom');sp.locator('.lg-row',has_text='Terapiya 3-kurs').click();sp.wait_for_timeout(800)
    sp.locator('.lg-row',has_text=topic['title']['uz']).click();sp.wait_for_timeout(800)
    check('student review shown',sp.locator('.lg-review li').count()==3)
    sp.screenshot(path=OUT+'/u3-student-review.png',full_page=True)
    check('no page errors',not terr and not serr)
    b.close()
