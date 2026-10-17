"""Package a completed production build and real screenshots; never generates UI images."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import re, zipfile, base64
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist/index.html').read_text()
html=re.sub(r'<script type="module" crossorigin src="([^"]+)"></script>',lambda m:'<script type="module">'+(ROOT/'dist'/m[1].lstrip('/')).read_text().replace('</script','<\\/script')+'</script>',html)
def inline_css(match):
 css=(ROOT/'dist'/match[1].lstrip('/')).read_text()
 portrait=base64.b64encode((ROOT/'public/clinicians.png').read_bytes()).decode('ascii')
 css=css.replace('/clinicians.png','data:image/png;base64,'+portrait)
 return '<style>'+css+'</style>'
html=re.sub(r'<link rel="stylesheet" crossorigin href="([^"]+)">',inline_css,html)
(ROOT/'demo.html').write_text(html)
selected=[('auth','01 / WELCOME'),('home','02 / PATIENT HOME'),('profile','03 / SPECIALIST'),('booking','04 / APPOINTMENT'),('dashboard','05 / DENTIST'),('record','06 / PATIENT RECORD'),('anatomy','07 / ANATOMY'),('student','08 / STUDENT')]
W,H=1600,2400
board=Image.new('RGB',(W,H),'#eaf5fa');draw=ImageDraw.Draw(board)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def f(size,strong=False):return ImageFont.truetype(bold if strong else font,size)
draw.text((60,42),'Dental Expert',font=f(44,True),fill='#10254e')
draw.text((62,108),'MOBILE DESIGN PROTOTYPE  /  UZ · RU · EN',font=f(16),fill='#098fa5')
draw.text((62,142),'Actual frontend captures · Reference-led first version · Local demo only',font=f(16),fill='#718da4')
for idx,(screen,label) in enumerate(selected):
 col,row=idx%4,idx//4
 x=48+col*384; y=210+row*1060
 draw.text((x+9,y),label,font=f(15,True),fill='#26476b')
 image=Image.open(ROOT/'screenshots'/f'{screen}.png').convert('RGB')
 # Keep the complete rendered screen, including content beyond one viewport.
 image.thumbnail((334,965),Image.Resampling.LANCZOS)
 left=x+(356-image.width)//2;top=y+43
 draw.rounded_rectangle((left-7,top-7,left+image.width+7,top+image.height+7),radius=29,fill='#fff',outline='#cbdfe8',width=2)
 mask=Image.new('L',image.size,0);ImageDraw.Draw(mask).rounded_rectangle((0,0,*image.size),radius=22,fill=255)
 board.paste(image,(left,top),mask)
draw.text((62,2340),'Premium tooth visuals · 360° image views · Local demo only',font=f(16),fill='#718da4')
board.save(ROOT/'screenshots/preview-board.png')
jpg_dir=ROOT/'screenshots/jpg';jpg_dir.mkdir(exist_ok=True)
for image_path in sorted((ROOT/'screenshots').glob('*.png')):
 Image.open(image_path).convert('RGB').save(jpg_dir/f'{image_path.stem}.jpg',quality=86,optimize=True)
archive=ROOT/'dental-expert-prototype.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted(ROOT.rglob('*')):
  rel=path.relative_to(ROOT)
  if not path.is_file() or path==archive or any(part in {'node_modules','.git','__pycache__'} for part in rel.parts) or path.suffix in {'.log','.tsbuildinfo'}:continue
  z.write(path,Path('dental-expert-prototype')/rel)
print('Created demo.html, screenshots/preview-board.png,',archive.name)
print('ZIP bytes:',archive.stat().st_size)
