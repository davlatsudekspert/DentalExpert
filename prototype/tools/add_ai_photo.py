#!/usr/bin/env python3
"""Adds one AI-generated illustration as a subject cover: python3 tools/add_ai_photo.py <key> <source image>
Metadata (title, focus point, uz/ru/en alt text) comes from tools/ai_photos.json. Converts to a 1400 px WebP under 190 KB in
src/photos, writes the credits entry (marked "ai": true, so the Credits screen says it is an AI illustration), registers the subject
cover and focus in src/photos.ts and the row in CREDITS.md. Safe to run again for the same key."""
import json,os,re,sys
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
key,src=sys.argv[1],sys.argv[2]
meta=json.load(open(f'{ROOT}/tools/ai_photos.json'))[key]
im=Image.open(src).convert('RGB')
for x0,y0,x1,y1,dx in meta.get('cover',[]):   # paint a small area over with a neighbouring patch of the same row (a stray brand mark)
    W0,H0=im.size;b=(int(x0*W0),int(y0*H0),int(x1*W0),int(y1*H0));s=int(dx*W0);pw,ph=b[2]-b[0],b[3]-b[1];mk=Image.new('L',(pw,ph),0);mk.paste(255,(6,6,pw-6,ph-6));from PIL import ImageFilter;im.paste(im.crop((b[0]+s,b[1],b[2]+s,b[3])),b[:2],mk.filter(ImageFilter.GaussianBlur(4)))
w=1400;h=round(im.height*w/im.width);im=im.resize((w,h),Image.LANCZOS)
q=82;out=f'{ROOT}/src/photos/{key}.webp'
while True:
    im.save(out,'WEBP',quality=q,method=6)
    if os.path.getsize(out)<=190*1024 or q<50:break
    q-=6
cj=json.load(open(f'{ROOT}/public/credits.json'))
cj['images']=[e for e in cj['images'] if e['file']!=f'{key}.webp']+[dict(file=f'{key}.webp',title=meta['title'],author='Generated with OpenAI image generation for Dental Expert (owner’s own work)',license='AI-generated (own work)',sourceUrl='https://dental-expert.pages.dev',fileUrl='https://dental-expert.pages.dev',source='AI-generated illustration',modifications=f'resized to {w}px wide, converted to WebP'+('; '+meta['coverNote'] if meta.get('cover') else ''),width=w,height=h,alt=meta['alt'],subject=meta['subject'],ai=True)]
json.dump(cj,open(f'{ROOT}/public/credits.json','w'),ensure_ascii=False,indent=1)
p=open(f'{ROOT}/src/photos.ts').read()
if f"'{key}.webp'," not in p.split('PHOTO_FOCUS')[0] and f"{key}:'{key}.webp'" not in p:p=p.replace("SUBJECT_PHOTO:Record<string,string>={",f"SUBJECT_PHOTO:Record<string,string>={{{key}:'{key}.webp',",1)
if f"'{key}.webp':'" not in p:p=p.replace("PHOTO_FOCUS:Record<string,string>={",f"PHOTO_FOCUS:Record<string,string>={{'{key}.webp':'{meta['focus']}',",1)
open(f'{ROOT}/src/photos.ts','w').write(p)
m=open(f'{ROOT}/CREDITS.md').read().split('\n')
m=[l for l in m if not l.startswith(f'| `{key}.webp`')]
while m and m[-1]=='':m.pop()
m.append(f"| `{key}.webp` | {meta['title']} | Generated with OpenAI image generation for Dental Expert (owner's own work) | AI-generated (own work) | [Dental Expert](https://dental-expert.pages.dev) | resized to {w}px wide, converted to WebP"+('; '+meta['coverNote'] if meta.get('cover') else '')+" |")
open(f'{ROOT}/CREDITS.md','w').write('\n'.join(m)+'\n')
print(key,w,h,os.path.getsize(out)//1024,'KB')
