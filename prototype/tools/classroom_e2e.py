"""Browser walk: a teacher creates a group + assignment, a student joins, answers, does the daily practice.
Needs `npm run build` served by `wrangler pages dev` (.dev.vars AUTH_DEV_ECHO=1) on :8788 and CHROMIUM_PATH."""
from playwright.sync_api import sync_playwright
import os,time,json,urllib.request
BASE='http://127.0.0.1:8788';OUT=os.environ.get('SIM_OUT','/tmp/sim')
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def api(ctx,path,body):
    return ctx.request.post(BASE+path,data=json.dumps(body),headers={'content-type':'application/json'}).json()
def login(b,role,name):
    ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2,is_mobile=True,has_touch=True)
    e=f'{role}+{time.time_ns()}@example.com'
    r=api(ctx,'/api/auth/request-code',{'email':e,'name':name,'role':role,'lang':'en'})
    api(ctx,'/api/auth/verify',{'email':e,'code':r['devCode']})
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    return ctx,pg,errs
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
    tc,tp,terr=login(b,'teacher','Dr Browser')
    tp.goto(BASE+'/?screen=teacher&lang=en');tp.wait_for_selector('.classroom');tp.wait_for_timeout(800)
    check('teacher screen has no fake 124 students',tp.get_by_text('124').count()==0)
    tp.get_by_placeholder('Group name',exact=False).fill('Browser Group');tp.get_by_role('button',name='Create').click();tp.wait_for_timeout(800)
    row=tp.locator('.lg-row',has_text='Browser Group');check('group appears',row.count()==1)
    code=row.locator('small').inner_text().split('Join code:')[1].strip();check('code shown',len(code)==6)
    row.click();tp.wait_for_timeout(500)
    tp.locator('.lg-tabs button',has_text='Assignments').click();tp.wait_for_timeout(300)
    tp.get_by_role('button',name='Give an assignment').click()
    tp.get_by_label('Title').fill('Describe enamel');tp.get_by_role('button',name='Create',exact=True).click();tp.wait_for_timeout(800)
    check('assignment listed',tp.locator('.lg-row',has_text='Describe enamel').count()==1)
    tp.get_by_role('button',name='Give an assignment').click()
    tp.locator('select').first.select_option('quiz');tp.get_by_label('Title').fill('Caries quiz');tp.get_by_role('button',name='Create',exact=True).click();tp.wait_for_timeout(800)
    check('quiz assignment listed',tp.locator('.lg-row',has_text='Caries quiz').count()==1)
    tp.screenshot(path=OUT+'/c1-teacher-group.png')
    sc,sp,serr=login(b,'student','Stud Browser')
    sp.goto(BASE+'/?screen=student&lang=en');sp.wait_for_selector('.classroom');sp.wait_for_timeout(800)
    sp.get_by_placeholder('6-character',exact=False).fill(code);sp.get_by_placeholder('e.g. Lola',exact=False).fill('Zebra');sp.get_by_role('button',name='Join',exact=True).click();sp.wait_for_timeout(800)
    sp.locator('.lg-row',has_text='Browser Group').click();sp.wait_for_timeout(600)
    sp.locator('.lg-tabs button',has_text='Assignments').click();sp.wait_for_timeout(300)
    sp.locator('.lg-row',has_text='Describe enamel').click();sp.wait_for_timeout(300)
    sp.locator('textarea').fill('Hardest tissue');sp.get_by_role('button',name='Submit',exact=True).click();sp.wait_for_timeout(600)
    check('student task submitted',sp.get_by_role('button',name='Submitted').count()==1)
    sp.screenshot(path=OUT+'/c2-student-task.png')
    sp.get_by_role('button',name='Browser Group').click();sp.wait_for_timeout(500)
    sp.locator('.lg-tabs button',has_text='Assignments').click();sp.wait_for_timeout(300)
    sp.locator('.lg-row',has_text='Caries quiz').click();sp.get_by_role('button',name='Start quiz').click();sp.wait_for_timeout(400)
    n=0
    while sp.locator('.quiz-run-options').count():
        sp.locator('.quiz-run-options button').first.click();sp.get_by_role('button',name='Next' if sp.get_by_role('button',name='Next').count() else 'Finish').click();sp.wait_for_timeout(200);n+=1
        if n>10:break
    check('quiz finished with result',sp.locator('.quiz-run-result').count()==1)
    sp.screenshot(path=OUT+'/c3-student-quiz-result.png')
    sp.get_by_role('button',name='Close').last.click();sp.wait_for_timeout(800)
    # teacher sees student
    tp.get_by_role('button',name='Browser Group').click() if tp.get_by_role('button',name='Browser Group').count() else None
    tp.reload();tp.wait_for_selector('.classroom');tp.locator('.lg-row',has_text='Browser Group').click();tp.wait_for_timeout(500)
    tp.locator('.lg-tabs button',has_text='Assignments').click();tp.wait_for_timeout(300)
    tp.locator('.lg-row',has_text='Describe enamel').click();tp.wait_for_timeout(800)
    check('teacher sees student answer',tp.get_by_text('Hardest tissue').count()==1)
    tp.screenshot(path=OUT+'/c4-teacher-roster.png')
    # daily practice
    sp.goto(BASE+'/?screen=courses&lang=ru');sp.locator('.learn > .chips button',has_text='Ежедневно').click();sp.wait_for_selector('.daily');sp.wait_for_timeout(500)
    sp.screenshot(path=OUT+'/c5-daily.png')
    sp.get_by_role('button',name='Тест дня',exact=False).click();sp.wait_for_timeout(300)
    for _ in range(5):
        sp.locator('.quiz-run-options button').first.click();sp.locator('.quiz-run-body .button').click();sp.wait_for_timeout(150)
    check('daily test finishes',sp.locator('.quiz-run-result').count()==1)
    sp.get_by_role('button',name='Закрыть').last.click()
    sp.get_by_role('button',name='Задание по картинке',exact=False).click();sp.wait_for_timeout(500)
    sp.screenshot(path=OUT+'/c6-picture-task.png')
    check('picture task shows plate images',sp.locator('.daily-plate img').count()>=1)
    sp.locator('.quiz-run-options button').first.click();sp.screenshot(path=OUT+'/c7-picture-answer.png')
    check('no page errors',not (terr or serr))
    b.close()
print('E2E OK')
