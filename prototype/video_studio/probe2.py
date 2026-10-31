import os,sys,re
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(__file__));import serve
port=serve.start(os.path.abspath('../dist'));B=f'http://tv.test:{port}'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--host-resolver-rules=MAP tv.test 127.0.0.1'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True).new_page()
    pg.goto(f'{B}/?screen=courses&lang=uz&role=student');pg.wait_for_timeout(1500)
    print(pg.evaluate("[...document.querySelectorAll('button')].slice(0,12).map(b=>b.className+'|'+b.textContent.trim().slice(0,22))"))
    # count subjects / topics
    txt=pg.evaluate('document.body.innerText')
    n=[int(x) for x in re.findall(r'(\d+) mavzu',txt)];print('subjects listed',len(n),'topics',sum(n))
    print(pg.evaluate("[...document.querySelectorAll('.ex-seg,.lg-tabs,[role=tablist]')].map(e=>e.className).slice(0,5)"))
    b.close()
