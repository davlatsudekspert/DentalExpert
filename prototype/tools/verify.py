"""Browser smoke tests and real frontend screenshots. Requires Python Playwright, Pillow, Chromium."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots'; OUT.mkdir(exist_ok=True)
OFFLINE_HTML=os.environ.get('PROTOTYPE_HTML')
BASE='https://dental-demo.local' if OFFLINE_HTML else os.environ.get('PROTOTYPE_URL','http://127.0.0.1:5173')
SCREENS=['splash','onboard','roles','auth','login','signup','verifyEmail','home','search','profile','clinics','booking','dashboard','edit','record','chart','anatomy','teacher','student','courses','lessonPage','caseStudy','settings','forgot','changePassword','privacy','forum','notifications']
checks=[]
import datetime
TODAY=datetime.date.today().day  # past days are disabled in the booking calendar, today never is
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
  # Let hero/lesson pictures finish loading before the image checks read them.
  try:page.wait_for_function("()=>[...document.querySelectorAll('.screen img')].every(i=>i.complete)",timeout=5000)
  except Exception:pass
 for lang in ['uz','ru','en']:
  for screen in SCREENS:
   go(screen,lang)
   check(f'{lang}/{screen}: content',bool(page.locator('.screen').inner_text().strip()))
   check(f'{lang}/{screen}: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   check(f'{lang}/{screen}: language',page.locator('html').get_attribute('lang')==lang)
   if screen=='anatomy':
    check(f'{lang}/{screen}: premium cutaway',page.locator('.anatomy-render img').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if screen in ['teacher','student']:
    check(f'{lang}/{screen}: quick tiles for lessons, quizzes, groups',page.locator('.role-tiles button').count()>=6)
   if screen=='courses':
    check(f'{lang}/{screen}: learn hub with lessons',page.locator('.learn > .chips button').count()>=2)
   if screen in ['lessonPage','caseStudy']:
    check(f'{lang}/{screen}: visual lesson image',page.locator('.academy-visual img').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if screen in ['splash','onboard','home']:
    check(f'{lang}/{screen}: premium tooth image',page.locator('.hero-render').count()==1 and page.locator('.hero-render').evaluate('(e)=>e.complete && e.naturalWidth>0'))
   if screen=='auth':
    check(f'{lang}/{screen}: premium tooth image',page.locator('.auth-stage img').evaluate('(e)=>e.complete && e.naturalWidth>0'))
    check(f'{lang}/{screen}: no social sign-in',page.get_by_role('button',name='Apple').count()==0 and page.get_by_role('button',name='Google').count()==0)
   if lang=='uz':
    page.wait_for_timeout(320)
    page.locator('.mobile-screen-picker').evaluate('(e)=>e.style.display="none"')
    page.screenshot(path=str(OUT/f'{screen}.png'),full_page=True)
 go('roles','en')
 for role,target in [('Dentist','Workspace'),('Educator','Educator'),('Student','Student'),('Patient','Home')]:
  go('roles','en');page.get_by_role('button',name=role,exact=True).click();page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Sign in').click();page.get_by_label('Email address').fill('demo@example.com');page.get_by_label('Password',exact=True).fill('demopassword');page.get_by_role('button',name='Explore the demo',exact=True).click()
  check('role navigation: '+role, page.locator('.home-header').count()==1 and (role=='Patient' or page.locator('.role-hero').count()==1))
 go('settings','en');page.get_by_role('button',name='RU Русский').click();check('language switch',page.locator('.topbar h1').inner_text()=='Профиль')
 page.get_by_role('button',name='UZ O‘zbekcha').click();check('Uzbek language switch',page.locator('.topbar h1').inner_text()=='Profil')
 go('home','en');page.locator('.doctor-card').first.click();check('doctor profile opens',page.locator('.profile-hero h2').inner_text()=='Dr. Kamila Karimova')
 page.get_by_role('button',name='Book appointment',exact=True).click();page.get_by_role('button',name=str(TODAY),exact=True).click();page.get_by_role('button',name='14:00',exact=True).click();page.get_by_role('button',name='Preview a sample booking').click()
 check('booking date and time', str(TODAY) in page.locator('.confirmation').inner_text() and '14:00' in page.locator('.confirmation').inner_text())
 check('booking is explicitly demo','no real appointment' in page.locator('.success').inner_text())
 go('chart','en');page.get_by_role('button',name='Add patient').click();page.get_by_label('Full name').fill('Verify Patient');page.get_by_role('button',name='Save',exact=True).click();page.locator('.pt-tooth').first.click();page.get_by_role('button',name='Caries',exact=True).click();check('odontogram tooth status saved','Caries' in page.locator('.pt-tooth').first.get_attribute('aria-label'))
 go('anatomy','en');page.locator('.atlas-chips button',has_text='Pulp').click();check('anatomy layer selection','Pulp' in page.locator('.atlas-about').inner_text() and page.locator('.atlas-pin.on').count()==1 and page.locator('.anatomy-render').count()==1);page.get_by_role('button',name='Rotate',exact=True).click();page.wait_for_timeout(1700);check('visual auto-rotation',page.locator('.premium-turntable').get_attribute('data-view-angle')!='0');page.get_by_role('button',name='Stop',exact=True).click();check('outer view pins',page.locator('.atlas-pin').count()==4 and 'Crown' in page.locator('.atlas-chips').inner_text());page.get_by_role('button',name='Zoom',exact=True).click();check('visual zoom',page.locator('.premium-turntable').get_attribute('data-zoom')=='true')
 go('anatomy','en');check('anatomy render visible',page.locator('.anatomy-render').count()==1 and page.locator('.anatomy-render img').evaluate('(e)=>e.complete && e.naturalWidth>0'));cut_src=page.locator('.anatomy-render img').get_attribute('src');page.get_by_role('button',name='Top view').click();check('archive top view switches',page.locator('.anatomy-render img').get_attribute('src')!=cut_src and page.get_by_role('button',name='Top view').get_attribute('aria-pressed')=='true');page.get_by_role('button',name='Cutaway').click();check('archive cutaway restores',page.locator('.anatomy-render img').get_attribute('src')==cut_src);page.get_by_role('button',name='360° views').click();check('premium orbit opens',page.locator('.premium-turntable img').evaluate('(e)=>e.complete && e.naturalWidth>0') and page.locator('.tooth-3d canvas').count()==0);page.locator('.mobile-screen-picker').evaluate('(e)=>e.style.display="none"');page.screenshot(path=str(OUT/'anatomy-360.png'),full_page=True);page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit keyboard rotation',page.locator('.premium-turntable').get_attribute('data-view-angle')=='90');page.screenshot(path=str(OUT/'anatomy-360-side.png'),full_page=True);page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit back view',page.locator('.premium-turntable').get_attribute('data-view-angle')=='180');page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit left view',page.locator('.premium-turntable').get_attribute('data-view-angle')=='270');page.get_by_role('slider',name='360° views').press('ArrowRight');check('premium orbit wraps',page.locator('.premium-turntable').get_attribute('data-view-angle')=='0')
 go('search','en');page.get_by_role('textbox',name='Find a dentist').fill('Aziz');check('doctor search',page.locator('.doctor-card').count()==1);page.get_by_role('textbox',name='Find a dentist').fill('');page.get_by_role('button',name='Filter',exact=True).click();check('rating filter',page.locator('.doctor-card').count()==2)
 go('edit','en');check('edit asks to sign in when offline',page.get_by_text('Sign in to edit your profile').count()==1)
 go('home','en');nav=page.get_by_role('navigation',name='Main navigation');check('five navigation destinations',nav.get_by_role('button').count()==5);nav.get_by_role('button',name='Atlas').click();check('featured atlas opens',page.locator('.anatomy-stage').count()==1)
 go('home','en');check('no sponsored or ad blocks on home',page.locator('.sponsored-demo, .sponsored-card').count()==0 and 'Sample ad' not in page.locator('.screen').inner_text());check('no paid-plan screens in picker',page.locator('.mobile-screen-picker option[value="plans"], .mobile-screen-picker option[value="adManager"]').count()==0);page.locator('.doctor-card').first.click();check('home specialist profile opens',page.locator('.profile-hero h2').inner_text()=='Dr. Kamila Karimova')
 go('home','en');page.get_by_label('City',exact=True).select_option('UZ-FA');check('Fergana shows local specialists',page.locator('.doctor-card').count()>=2 and all('Fergana' in x for x in page.locator('.doctor-card').all_inner_texts()));check('Fergana has different doctors','Dr. Kamila Karimova' not in ' '.join(page.locator('.doctor-card').all_inner_texts()));page.locator('.doctor-card').first.click();check('Fergana doctor opens local profile','Fergana' in page.locator('.profile-hero').inner_text());page.get_by_role('button',name='Save doctor').click();check('doctor saved',page.get_by_role('button',name='Saved',exact=True).count()==1);page.locator('.mobile-screen-picker select').select_option('search');page.get_by_role('button',name='Saved',exact=True).click();check('saved search filters locally',page.locator('.doctor-card').count()==1)
 go('home','en');page.get_by_label('City',exact=True).select_option('UZ-TK');check('Tashkent shows local sample specialists',page.locator('.doctor-card').count()==2 and all('Tashkent' in x for x in page.locator('.doctor-card').all_inner_texts()))
 go('home','en');page.get_by_label('Country',exact=True).select_option('AE');check('Dubai shows local sample specialists',page.locator('.doctor-card').count()==2 and all('Dubai' in x for x in page.locator('.doctor-card').all_inner_texts()))
 go('home','en');page.get_by_label('Country',exact=True).select_option('GB');check('unsupported region has no invented local doctors',page.locator('.doctor-card').count()==0)
 go('lessonPage','en');check('lesson offers no PPTX download',page.locator('.academy-download, a[download], a[href$=".pptx"]').count()==0);page.locator('.academy-question button').first.click();check('lesson answer gives feedback','Correct' in page.locator('.academy-question .right').inner_text());page.get_by_role('button',name='Open practice case').click();check('lesson opens practice case',page.locator('.academy-page h2').inner_text()=='Visual practice case');page.locator('.academy-page textarea').fill('The image shows the layers and the roots beneath the crown.');page.get_by_role('button',name='Submit demo work').click();check('practice case gives sample feedback',page.locator('.academy-feedback').count()==1);page.get_by_role('button',name='Revise work').click();check('practice case can be revised',page.locator('.academy-feedback').count()==0)
 go('home','en');page.evaluate('window.scrollTo(0,220)');page.wait_for_timeout(500);check('navigation compacts on scroll',page.locator('.five-tab-nav.compact').count()==1);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(500);check('navigation expands at top',page.locator('.five-tab-nav.compact').count()==0)
 go('auth','en');page.get_by_role('button',name='Create account').click();check('register action opens form',page.locator('.screen h2').inner_text()=='Create account')
 go('auth','en');page.get_by_role('button',name='Sign in').click();check('sign-in action opens form',page.locator('.screen h2').inner_text()=='Welcome back');page.get_by_role('button',name='Forgot password?').click();check('forgot password opens',page.locator('.extra-page h2').inner_text()=='Reset password')
 go('forgot','en');page.get_by_role('textbox',name='Email address').fill('test@example.com');page.get_by_role('button',name='Request reset').click();check('reset does not claim email sent','needs a real server' in page.get_by_role('status').inner_text())
 go('changePassword','en');page.get_by_label('Current password').fill('old-demo-password');page.get_by_label('New password',exact=True).fill('new-demo-password');page.get_by_label('Repeat new password').fill('different-password');page.get_by_role('button',name='Update password').click();check('password mismatch warning','must match' in page.get_by_role('status').inner_text())
 go('forum','en');page.get_by_role('textbox',name='Question or comment').fill('Political campaigning is here');page.get_by_role('button',name='Add post').click();check('off-topic content blocked','does not meet' in page.get_by_role('status').inner_text());page.get_by_role('textbox',name='Question or comment').fill('How does tooth enamel develop?');page.get_by_role('button',name='Add post').click();check('dental post appears',page.locator('.forum-post').count()==2);page.get_by_label('Reason for report').first.select_option('spam');page.get_by_role('button',name='Report').first.click();check('report hides post locally',page.locator('.forum-post').count()==1 and 'no moderator received' in page.get_by_role('status').inner_text())
 go('settings','en');page.get_by_role('button',name='Privacy').click();check('privacy page opens',page.locator('.extra-page h2').inner_text()=='Privacy');check('privacy screen describes real deletion',('removes your account' in page.locator('.extra-card').filter(has_text='Deleting your account').inner_text()) and page.locator('.extra-page a.button').count()==1)
 go('signup','en');check('signup offers country selection',page.locator('.discovery-location select').first.locator('option').count()>190)
 page.get_by_label('Full name').fill('Demo Person');page.get_by_label('Email address').fill('demo@example.com');page.get_by_label('Password',exact=True).fill('demo-password');page.get_by_role('button',name='Create demo account').click();check('signup opens email design',page.locator('.email-verification').count()==1)
 page.get_by_role('button',name='Resend code').click();check('email screen does not claim delivery','no live service' in page.get_by_role('status').inner_text());page.get_by_role('button',name='Continue to demo').click();check('email design continues to role home',page.locator('.home-header').count()==1)
 go('profile','en');check('profile shows six contact destinations',page.locator('.contact-action').count()==6);check('contact row stays compact',page.locator('.contact-actions').evaluate('(e)=>e.getBoundingClientRect().height<100'));page.get_by_role('button',name='Telegram').click();check('sample contact has no false link','inactive' in page.get_by_role('status').inner_text())
 for width in [360,430,1280]:
  page.set_viewport_size({'width':width,'height':900});go('home','en');check(f'responsive {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  for screen in ['verifyEmail','search','settings','profile']:
   go(screen,'en');check(f'{screen} responsive {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 check('no browser exceptions',not errors)
 browser.close()
(OUT/'validation.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'browser_errors':errors},indent=2))
print(f'PASS: {len(checks)} checks, {len(SCREENS)} real screenshots, no browser exceptions')
