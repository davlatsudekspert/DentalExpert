"""Regressions found by the end-to-end journey QA (QA_JOURNEY_REPORT.md), flag off, against the local dev server (DE_PORT).
Each block is one defect that was reproduced in the real app first."""
import os,json,time,re
from playwright.sync_api import sync_playwright
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
HD={'content-type':'application/json'}
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
def signin(b,role,lang):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    e=f'{role}+{time.time_ns()}@example.com'
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Ali Abduraxmonov','role':role,'lang':lang}),headers=HD).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=HD)
    return ctx
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])

    # D1: the system back (Android back button / browser back = popstate) left the whole Learn section from a topic or its
    # slides; it must close the open viewer / sub-view first, like the in-app back arrow and the edge swipe do.
    for lang,learn,subj,slides,test in (('en','Learn','Propaedeutics','View the slides','Topic test'),
                                          ('uz','O‘rganish','Propedevtik','Taqdimotni ko‘rish','Mavzu bo‘yicha test'),
                                          ('ru','Обучение','Пропедевтика','Смотреть презентацию','Тест по теме')):
        ctx=signin(b,'student',lang);pg=ctx.new_page();pg.goto(f'{BASE}/?lang={lang}');pg.wait_for_selector('nav.bottom-nav',timeout=10000)
        pg.locator('nav.bottom-nav button').filter(has_text=learn).click();pg.wait_for_timeout(700)
        pg.locator('main button').filter(has_text=subj).first.click();pg.wait_for_timeout(500)
        check(f'{lang}: subject shows its 8 topics',pg.locator('main .lg-row').count()==8);pg.locator('main .lg-row').first.click();pg.wait_for_timeout(500)
        pg.locator('main button').filter(has_text=slides).first.click();pg.wait_for_timeout(700)
        check(f'{lang}: slides open',pg.locator('.sl-bar').count()==1)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back closes the slides and stays on the topic',pg.locator('.sl-bar').count()==0 and pg.locator('main button').filter(has_text=test).count()>0)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back again shows the subject topic list, still in Learn',pg.locator('main button').filter(has_text=test).count()==0
              and pg.locator('main .lg-row').count()==8)
        pg.go_back();pg.wait_for_timeout(700)
        check(f'{lang}: back again shows the subject list',pg.locator('main .lg-row').count()>8 and pg.locator('nav.bottom-nav button.active').filter(has_text=learn).count()==1)
        ctx.close()
    b.close()
print('journey_e2e: all passed')
