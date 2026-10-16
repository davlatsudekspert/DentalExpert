"""Browser smoke tests and real frontend screenshots. Requires Python Playwright, Pillow, Chromium."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots'; OUT.mkdir(exist_ok=True)
OFFLINE_HTML=os.environ.get('PROTOTYPE_HTML')
BASE='https://dental-demo.local' if OFFLINE_HTML else os.environ.get('PROTOTYPE_URL','http://127.0.0.1:5173')
SCREENS=['splash','onboard','roles','login','signup','home','search','profile','clinics','booking','dashboard','edit','record','chart','anatomy','teacher','student','courses','settings']
checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
 if OFFLINE_HTML:
  html=Path(OFFLINE_HTML).read_text()
  page.route('https://dental-demo.local/**',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
 errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
 def go(screen,lang='uz'):
  page.goto(f'{BASE}/?screen={screen}&lang={lang}')
  page.wait_for_selector('.screen')
 for lang in ['uz','ru','en']:
  for screen in SCREENS:
   go(screen,lang)
   check(f'{lang}/{screen}: content',bool(page.locator('.screen').inner_text().strip()))
   check(f'{lang}/{screen}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   check(f'{lang}/{screen}: language',page.locator('html').get_attribute('lang')==lang)
   if screen=='anatomy':
    check(f'{lang}/{screen}: premium cutaway',page.locator('.anatomy-render img').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if screen in ['teacher','student','courses']:
    check(f'{lang}/{screen}: premium course image',page.locator('.course-render').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if screen in ['splash','onboard','home']:
    check(f'{lang}/{screen}: premium tooth image',page.locator('.hero-render').count()==1 and page.locator('.hero-render').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if lang=='uz':
    page.wait_for_timeout(320)
    page.locator('.mobile-screen-picker').evaluate('(e)=>e.style.display="none"')
    page.screenshot(path=str(OUT/f'{screen}.png'),full_page=True)
 go('roles','en')
 for role,target in [('Dentist','Workspace'),('Educator','Educator'),('Student','Student'),('Patient','Home')]:
  go('roles','en');page.get_by_role('button',name=role,exact=True).click();page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Explore the demo',exact=True).click()
  check('role navigation: '+role, page.locator('.dash-welcome').count()==1 if role!='Patient' else page.locator('.home-header').count()==1)
 go('settings','en');page.get_by_role('button',name='RU Русский').click();check('language switch',page.locator('.topbar h1').inner_text()=='Настройки')
 page.get_by_role('button',name='UZ O‘zbekcha').click();check('Uzbek language switch',page.locator('.topbar h1').inner_text()=='Sozlamalar')
 go('home','en');page.locator('.doctor-card').first.click();check('doctor profile opens',page.locator('.profile-hero h2').inner_text()=='Dr. Kamila Karimova')
 page.get_by_role('button',name='Book appointment',exact=True).click();page.get_by_role('button',name='22',exact=True).click();page.get_by_role('button',name='14:00',exact=True).click();page.get_by_role('button',name='Confirm demo appointment').click()
 check('booking date and time', '22' in page.locator('.confirmation').inner_text() and '14:00' in page.locator('.confirmation').inner_text())
 check('booking is explicitly demo','No real appointment' in page.locator('.success').inner_text())
 go('chart','en');page.get_by_role('button',name='Select a tooth 26',exact=True).click();check('tooth 26 selected','26' in page.locator('.selected-tooth').inner_text())
 page.get_by_role('button',name='Tooth anatomy',exact=True).first.click();page.get_by_role('button',name='Pulp 03').click();check('anatomy layer selection','Pulp' in page.locator('.anatomy-tag').inner_text() and page.locator('.anatomy-render').count()==1);page.get_by_role('button',name='Rotate',exact=True).click();check('visual rotation',page.locator('.premium-turntable').get_attribute('data-view-angle')=='90');page.get_by_role('button',name='Zoom',exact=True).click();check('visual zoom',page.locator('.premium-turntable').get_attribute('data-zoom')=='true')
 go('anatomy','en');check('anatomy render visible',page.locator('.anatomy-render').count()==1 and page.locator('.anatomy-render img').evaluate('(e)=>e.complete && e.naturalWidth>0'));cut_src=page.locator('.anatomy-render img').get_attribute('src');page.get_by_role('button',name='Top view').click();check('archive top view switches',page.locator('.anatomy-render img').get_attribute('src')!=cut_src and page.get_by_role('button',name='Top view').get_attribute('aria-pressed')=='true');page.get_by_role('button',name='Cutaway').click();check('archive cutaway restores',page.locator('.anatomy-render img').get_attribute('src')==cut_src);page.get_by_role('button',name='360° views').click();check('premium orbit opens',page.locator('.premium-turntable img').evaluate('(e)=>e.complete && e.naturalWidth>0') and page.locator('.tooth-3d canvas').count()==0);page.locator('.mobile-screen-picker').evaluate('(e)=>e.style.display="none"');page.screenshot(path=str(OUT/'anatomy-360.png'),full_page=True);page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit keyboard rotation',page.locator('.premium-turntable').get_attribute('data-view-angle')=='90');page.screenshot(path=str(OUT/'anatomy-360-side.png'),full_page=True);page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit back view',page.locator('.premium-turntable').get_attribute('data-view-angle')=='180');page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit left view',page.locator('.premium-turntable').get_attribute('data-view-angle')=='270');page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit wraps',page.locator('.premium-turntable').get_attribute('data-view-angle')=='0')
 go('search','en');page.get_by_role('textbox',name='Find a dentist').fill('Aziz');check('doctor search',page.locator('.doctor-card').count()==1);page.get_by_role('textbox',name='Find a dentist').fill('');page.get_by_role('button',name='Filter',exact=True).click();check('rating filter',page.locator('.doctor-card').count()==2)
 go('edit','en');page.locator('input').first.fill('Dr. Demo');page.get_by_role('button',name='Save demo changes').click();check('edit confirmation',page.get_by_role('status').inner_text().startswith('Demo saved'));page.locator('.mobile-screen-picker select').select_option('profile');check('edit reflected in profile',page.locator('.profile-hero h2').inner_text()=='Dr. Demo')
 for width in [360,430,1280]:
  page.set_viewport_size({'width':width,'height':900});go('home','en');check(f'responsive {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 check('no browser exceptions',not errors)
 browser.close()
(OUT/'validation.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'browser_errors':errors},indent=2))
print(f'PASS: {len(checks)} checks, {len(SCREENS)} real screenshots, no browser exceptions')
