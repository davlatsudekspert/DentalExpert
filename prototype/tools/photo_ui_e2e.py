"""Profile photo in the browser: a large transparent PNG is cropped to a 512 px square, saved, shown on Profil and kept
opaque (no black corners where the picture was transparent); a non-image is refused with a message; remove works."""
import os,io,json,time,base64
from playwright.sync_api import sync_playwright
from PIL import Image
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
OUT=os.environ.get('SIM_OUT','/tmp/sim');os.makedirs(OUT,exist_ok=True)
def check(n,c):print(('PASS ' if c else 'FAIL ')+n);assert c,n
im=Image.new('RGBA',(1800,1200),(0,0,0,0))   # fully transparent, with an opaque blue block in the middle
for x in range(700,1100):
    for y in range(400,800):im.putpixel((x,y),(30,90,200,255))
im.save(OUT+'/transparent.png')
open(OUT+'/notes.txt','w').write('not an image')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    e=f'dentist+{time.time_ns()}@example.com';hd={'content-type':'application/json'}
    r=ctx.request.post(BASE+'/api/auth/request-code',data=json.dumps({'email':e,'name':'Photo Test','role':'dentist','lang':'en'}),headers=hd).json()
    ctx.request.post(BASE+'/api/auth/verify',data=json.dumps({'email':e,'code':r['devCode']}),headers=hd)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda x:errs.append(str(x)))
    pg.goto(BASE+'/?lang=en');pg.wait_for_selector('nav button',timeout=10000)
    pg.locator('nav button').last.click();pg.get_by_role('button',name='Edit').first.click();pg.wait_for_selector('.photo-field')
    pg.set_input_files('.photo-input',OUT+'/notes.txt');pg.wait_for_timeout(800)
    check('a text file is refused with a message',pg.locator('.photo-field .cr-error').count()==1)
    pg.set_input_files('.photo-input',OUT+'/transparent.png');pg.wait_for_selector('.photo-field .cr-score',timeout=10000)
    check('upload says saved',pg.locator('.photo-field .cr-score').count()==1 and pg.locator('.photo-field .cr-error').count()==0)
    px=pg.evaluate("""async()=>{const i=document.querySelector('.uploaded-avatar');await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);
      const g=(a,b)=>[...x.getImageData(a,b,1,1).data];return {w:i.naturalWidth,h:i.naturalHeight,corner:g(2,2),centre:g(c.width>>1,c.height>>1)}}""")
    check('cropped to a 512 px square',px['w']==512 and px['h']==512)
    check('the transparent corner became opaque white',px['corner']==[255,255,255,255])
    check('the picture itself is kept',px['centre'][2]>150 and px['centre'][0]<80)
    me=ctx.request.get(BASE+'/api/auth/me').json()['user']
    check('the server holds the photo',bool(me.get('photoUrl')))
    pg.get_by_role('button',name='Remove').click();pg.wait_for_timeout(1000)
    check('remove works',ctx.request.get(BASE+'/api/auth/me').json()['user'].get('photoUrl') in (None,''))
    check('no page errors',not errs)
    b.close()
print('PHOTO UI OK')
