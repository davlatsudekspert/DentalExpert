"""On-screen deck viewer checks against a served build (vite preview or wrangler pages dev). Not applicable to the offline demo.html."""
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('PROTOTYPE_URL','http://127.0.0.1:4173')
checks=[]
def check(n,c):
 assert c,n;checks.append(n)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 downloads=[];page.on('download',lambda d:downloads.append(d))
 for screen in ['lessonPage','student','teacher']:
  page.goto(f'{BASE}/?screen={screen}&lang=en');page.wait_for_selector('.deck-card')
  check(f'{screen}: deck library lists 6 decks',page.locator('.deck-card').count()==6)
  check(f'{screen}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check(f'{screen}: no pptx/download links',page.locator('a[download], a[href$=".pptx"]').count()==0)
 page.goto(f'{BASE}/?screen=lessonPage&lang=en');page.wait_for_selector('.deck-card')
 page.locator('.deck-card').first.click();page.wait_for_selector('.deck-viewer')
 check('viewer shows slide 1',page.locator('.deck-bar span').inner_text().startswith('1 /'))
 check('slide image loaded',page.locator('.deck-stage img').evaluate('(e)=>e.complete&&e.naturalWidth>=1000'))
 page.get_by_role('button',name='Next').click()
 check('next advances',page.locator('.deck-bar span').inner_text().startswith('2 /'))
 page.keyboard.press('ArrowLeft')
 check('keyboard back',page.locator('.deck-bar span').inner_text().startswith('1 /'))
 ev=page.evaluate("""()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('.deck-stage img').dispatchEvent(e);return e.defaultPrevented}""")
 check('context menu is blocked on slides',ev)
 check('image is not draggable',page.locator('.deck-stage img').get_attribute('draggable')=='false')
 check('viewer has no download or save control',page.locator('.deck-viewer a, .deck-viewer [download]').count()==0)
 total=int(page.locator('.deck-bar span').inner_text().split('/')[1])
 for _ in range(total-1):page.get_by_role('button',name='Next').click() if page.get_by_role('button',name='Next').count() else None
 page.get_by_role('button',name='Take the quiz').click();page.wait_for_selector('.deck-q')
 check('quiz shows questions',page.locator('.deck-q').count()>=3)
 for q in page.locator('.deck-q').all():q.locator('button').first.click()
 page.wait_for_selector('.deck-score')
 check('quiz shows a score',page.locator('.deck-score').inner_text().startswith('Score:'))
 page.get_by_role('button',name='Close').click()
 check('viewer closes',page.locator('.deck-viewer').count()==0)
 check('nothing was downloaded',not downloads)
 check('no browser exceptions',not errors)
 b.close()
print('PASS',len(checks),'checks')
