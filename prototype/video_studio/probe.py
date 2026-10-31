import os,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(__file__));import serve
port=serve.start(os.path.abspath('../dist'))
B=f'http://tv.test:{port}'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--host-resolver-rules=MAP tv.test 127.0.0.1'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    for name,url in [('home','?screen=home&lang=uz&role=student'),('courses','?screen=courses&lang=uz&role=student'),('anatomy','?screen=anatomy&lang=uz&role=student'),('student','?screen=student&lang=uz&role=student'),('teacher','?screen=teacher&lang=uz&role=teacher')]:
        pg.goto(f'{B}/{url}');pg.wait_for_timeout(1800)
        pg.screenshot(path=f'shots/probe_{name}.png')
        t=pg.evaluate('document.body.innerText').replace('\n',' | ')[:400]
        print(name,'::',t)
    b.close()
