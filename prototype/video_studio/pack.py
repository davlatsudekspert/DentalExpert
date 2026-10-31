"""Thumbs/covers + ZIP parts. Usage: python3 pack.py <out_dir>"""
import hashlib,json,os,subprocess,sys,zipfile,glob
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));OUT=sys.argv[1];os.makedirs(OUT,exist_ok=True)
DOCS=f'{HERE}/../docs/video'
jobs=[]
for th in ('mono','color'):
    for l in ('uz','ru','en'):
        jobs+= [('overview',l,'wide',th,2.4),('overview',l,'tall',th,2.4)]
    jobs.append(('reel','uz','tall',th,2.0))
for vid,l,f,th,t in jobs:
    subprocess.run(['python3',f'{HERE}/render.py',vid,l,f,th,str(t)],check=True,cwd=HERE)
    src=f'{HERE}/build/{vid}/still_{vid}_{l}_{f}_{th}_{t:g}.png';im=Image.open(src).convert('RGB')
    if f=='wide':im.resize((1280,720),Image.LANCZOS).save(f'{HERE}/build/{vid}/final/thumb_1280x720_{vid}_{l}_{th}.jpg',quality=90)
    else:im.save(f'{HERE}/build/{vid}/final/cover_1080x1920_{vid}_{l}_{th}.jpg',quality=90)
    os.remove(src)
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as fh:
        for c in iter(lambda:fh.read(1<<20),b''):h.update(c)
    return h.hexdigest()
common=['README.md','YORDAMCHI_JOYLASH.md','QA_SUMMARY.md']
def build(name,pick):
    entries=[]
    for vid in ('overview','reel'):
        for p in sorted(glob.glob(f'{HERE}/build/{vid}/final/*')):
            if pick(vid,os.path.basename(p)):entries.append((f'{vid}/'+os.path.basename(p),p))
        for d in ('DESCRIPTION.md','CLAIMS_AND_EVIDENCE.md','SCRIPT.md'):
            if any(a.startswith(vid+'/') for a,_ in entries):entries.append((f'{vid}/{d}',f'{DOCS}/{vid}/{d}'))
    entries+= [(c,f'{DOCS}/{c}') for c in common]
    sums='\n'.join(f'{sha(p)}  {a}' for a,p in entries if not a.endswith('SHA256SUMS.txt'))+'\n'
    man=json.dumps(dict(package=name,files=[dict(path=a,bytes=os.path.getsize(p)) for a,p in entries]),indent=1)
    with zipfile.ZipFile(f'{OUT}/{name}','w',zipfile.ZIP_STORED) as z:
        for a,p in entries:z.write(p,a)
        z.writestr('SHA256SUMS.txt',sums);z.writestr('MANIFEST.json',man)
    print(name,round(os.path.getsize(f'{OUT}/{name}')/1e6,1),'MB',len(entries),'files')
build('DentalExpert_PROMO_YOUTUBE_16x9_FINAL.zip',lambda v,n:v=='overview' and ('_wide_' in n or n.startswith('thumb_')))
build('DentalExpert_PROMO_INSTAGRAM_9x16_FINAL.zip',lambda v,n:('_tall_' in n or n.startswith('cover_')))
build('DentalExpert_PROMO_QUICK_PREVIEW.zip',lambda v,n:n.startswith(('overview_uz_wide_color','reel_uz_tall_color','thumb_1280x720_overview_uz_color','cover_1080x1920_reel_uz_color')))
