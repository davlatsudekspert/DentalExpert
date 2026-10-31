"""Takes the real app screens (phone, 390x844 @3x) for the videos, in uz / ru / en and both looks (mono = cream, color = blue).
Nothing is drawn or edited; the app text is scanned for words the videos must not contain."""
import os,re,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(__file__));import serve
HERE=os.path.dirname(os.path.abspath(__file__))
port=serve.start(os.path.abspath(os.path.join(HERE,'..','dist')));B=f'http://tv.test:{port}'
BAD=re.compile(r'toifa|bank|банк',re.I)
bad=[]
def run(b,theme,lang):
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    def shot(name):
        pg.wait_for_timeout(700);d=f'{HERE}/shots/{theme}/{lang}';os.makedirs(d,exist_ok=True)
        pg.screenshot(path=f'{d}/{name}.png')
        if BAD.search(pg.evaluate('document.body.innerText')):bad.append((theme,lang,name))
    def go(screen,role='student'):
        pg.goto(f'{B}/?screen={screen}&lang={lang}&role={role}&theme={theme}');pg.wait_for_timeout(1500)
    def tab(i):pg.locator('button').nth(i).click();pg.wait_for_timeout(500)
    go('student');shot('student');go('teacher','teacher');shot('teacher');go('anatomy');shot('atlas');go('courses');shot('plan')
    pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(400);shot('subject')
    pg.locator('.lg-section .lg-row').first.click();pg.wait_for_timeout(500);shot('topic')
    pg.locator('.lg-section > .button').first.click();pg.wait_for_timeout(900);shot('slide1')
    for k in range(3):
        pg.locator('.sl-nav .button').last.click(timeout=3000);pg.wait_for_timeout(500)
        if k==0:shot('slide2')
    shot('slide4')
    for name,idx in (('lessons',3),('picture',4),('review',5),('exam',6),('daily',7 if lang=='en' else 8)):
        go('courses');tab(idx);shot(name)
    print(theme,lang,'errors',errs[:2],flush=True);ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--host-resolver-rules=MAP tv.test 127.0.0.1'])
    for theme in ('mono','color'):
        for lang in ('uz','ru','en'):run(b,theme,lang)
    b.close()
print('forbidden words in app text:',bad)
