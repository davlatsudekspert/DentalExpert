import sys,os,subprocess,time
from playwright.sync_api import sync_playwright
views=[a.split('=',1) for a in sys.argv[1:]]  # name=query
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],cwd=os.path.abspath('.'),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1.2)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':900,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    for name,qs in views:
        pg.goto(f'http://127.0.0.1:8765/tools/preview/molar_preview.html?{qs}');pg.wait_for_function('window.__ready===true',timeout=60000);pg.wait_for_timeout(300)
        pg.screenshot(path=f'/tmp/sim/m_{name}.png')
    print('errors:',errs[:3]);b.close()
finally: srv.terminate()
