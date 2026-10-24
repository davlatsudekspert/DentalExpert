"""Error states: when the classroom API answers 500 the groups list must say so (with a retry), not hang on '…'; the retry
works once the server is back. Signs in as a teacher on the local dev server."""
import os,json,time,re
from playwright.sync_api import sync_playwright
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for lang,msg,retry in (('uz','mavjud emas','Qayta urinib ko‘rish'),('en','unavailable','Retry'),('ru','недоступны','Повторить')):
        ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        e=f'teacher+{time.time_ns()}@example.com';hd={'content-type':'application/json'}
        r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':'teacher','lang':lang}),headers=hd).json()
        ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=hd)
        down=[True]
        ctx.route(re.compile(r'/api/classroom/groups'),lambda rt:rt.fulfill(status=500,body='{"error":"boom"}',content_type='application/json') if down[0] else rt.continue_())
        pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav button',timeout=10000)
        pg.get_by_role('button',name=re.compile('Guruhlarim|Мои группы|My groups')).first.click()
        pg.wait_for_timeout(1500)
        txt=pg.locator('main.phone').inner_text()
        check(f'{lang}: a 500 shows the unavailable message',msg in txt)
        check(f'{lang}: no endless loading dots',not re.search(r'^…$',txt,re.M))
        down[0]=False
        pg.get_by_role('button',name=retry).click();pg.wait_for_timeout(1200)
        check(f'{lang}: retry brings the list back (new group form)',pg.locator('main.phone .classroom input').count()>0 and msg not in pg.locator('main.phone').inner_text())
        ctx.close()
    # One group whose assignments / topics fail: the group page says so with a retry and shows no endless dots.
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    e=f'teacher+{time.time_ns()}@example.com';hd={'content-type':'application/json'}
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':'teacher','lang':'en'}),headers=hd).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=hd)
    check('group created',ctx.request.post(BASE+'/api/classroom/groups',data=json.dumps({'name':'Err Group'}),headers=hd).ok)
    ctx.route(re.compile(r'/api/classroom/(assignments|topics)'),lambda rt:rt.fulfill(status=500,body='{"error":"boom"}',content_type='application/json'))
    pg=ctx.new_page();pg.goto(f'{BASE}/?lang=en');pg.wait_for_selector('nav button',timeout=10000)
    pg.get_by_role('button',name=re.compile('My groups')).first.click();pg.wait_for_timeout(1000)
    pg.locator('main.phone .lg-row, main.phone .lg-list button').first.click();pg.wait_for_timeout(1500)
    txt=pg.locator('main.phone').inner_text()
    check('group page: failure message',"unavailable" in txt)
    check('group page: no endless loading dots',not re.search(r'^…$',txt,re.M))
    check('group page: retry button',pg.get_by_role('button',name='Retry').count()==1)
    b.close()
print('STATES OK')
