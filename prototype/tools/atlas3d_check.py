"""Open the 3D atlas in a WebGL browser, exercise it and save screenshots. Usage: python3 tools/atlas3d_check.py [outdir]"""
import os,sys
from playwright.sync_api import sync_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/sim'
BASE=os.environ.get('PROTOTYPE_URL','http://127.0.0.1:4173')
checks=[]
def check(n,c,d=''):
 checks.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n+(' '+str(d) if d and not c else ''))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
 ctx=b.new_context(viewport={'width':430,'height':932},device_scale_factor=2,is_mobile=True,has_touch=True)
 pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'favicon' not in m.text else None)
 pg.goto(f'{BASE}/?screen=anatomy&lang=en');pg.wait_for_selector('.atlas3d-launch');pg.screenshot(path=f'{OUT}/a0-launch.png')
 pg.click('.atlas3d-launch');pg.wait_for_selector('.atlas3d canvas',timeout=20000);pg.wait_for_selector('.atlas3d-loading',state='detached',timeout=30000);pg.wait_for_timeout(300)
 pg.screenshot(path=f'{OUT}/a1-intro.png');pg.wait_for_timeout(2200);pg.screenshot(path=f'{OUT}/a2-assembled.png')
 check('3D canvas is rendering',pg.evaluate("(()=>{const c=document.querySelector('.atlas3d canvas');return c.width>100&&c.height>100})()"))
 pg.get_by_role('button',name='Explode',exact=True).click();pg.wait_for_timeout(2200);pg.screenshot(path=f'{OUT}/a3-exploded.png')
 pg.get_by_role('button',name='Pulp',exact=True).click();pg.wait_for_timeout(1800);pg.screenshot(path=f'{OUT}/a4-pulp.png')
 check('info card shows for the selected layer',pg.locator('.atlas3d-card').count()==1 and 'Pulp' in pg.locator('.atlas3d-card').inner_text())
 pg.get_by_role('button',name='Vessels & nerves',exact=True).click();pg.wait_for_timeout(1500);pg.screenshot(path=f'{OUT}/a5-vessels.png')
 pg.get_by_role('button',name='Assemble',exact=True).click();pg.get_by_role('button',name='Enamel',exact=True).click();pg.wait_for_timeout(1800)
 # drag to rotate
 box=pg.locator('.atlas3d canvas').bounding_box();cx,cy=box['x']+box['width']/2,box['y']+box['height']/2
 pg.mouse.move(cx,cy);pg.mouse.down();pg.mouse.move(cx+110,cy+20,steps=8);pg.mouse.up();pg.wait_for_timeout(1200);pg.screenshot(path=f'{OUT}/a6-rotated-enamel.png')
 # tap directly on the pulp area of the canvas selects pulp
 pg.get_by_role('button',name='Assemble',exact=True).click() if pg.get_by_role('button',name='Assemble',exact=True).count() else None
 pg.get_by_role('button',name='Reset',exact=True).click();pg.wait_for_timeout(1800)
 pg.screenshot(path=f'{OUT}/a7-reset.png')
 check('no console/page errors',not errs,errs[:3])
 pg.get_by_role('button',name='Close',exact=True).click();pg.wait_for_timeout(300)
 check('closes cleanly',pg.locator('.atlas3d').count()==0)
 b.close()
print('RESULT',sum(1 for _,o in checks if o),'/',len(checks))
