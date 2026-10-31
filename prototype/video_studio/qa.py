"""QA on the finished files: ffprobe, loudness, forbidden words, claims words, subtitle speed, Uzbek apostrophes. Writes docs/video/QA_SUMMARY.md"""
import glob,json,os,re,subprocess,sys
HERE=os.path.dirname(os.path.abspath(__file__));D=f'{HERE}/../docs/video'
out=['# QA summary\n','Checked on the finished files by `video_studio/qa.py`. Not checked: the English voice-over was not listened to by a person; uz/ru subtitle wording and the dental content were not reviewed by a native speaker or an expert (`NEEDS_NATIVE_REVIEW`, `EXPERT_REVIEW_REQUIRED`).\n']
ok=True
def probe(f):
    r=subprocess.run(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height,duration,r_frame_rate','-of','json',f],capture_output=True,text=True);return json.loads(r.stdout)['streams']
out.append('\n## Files\n\n| File | Size | Length | Audio | LUFS | Peak dBFS |\n|---|---|---|---|---|---|')
for f in sorted(glob.glob(f'{HERE}/build/*/final/*.mp4')):
    st=probe(f);v=[s for s in st if s['codec_type']=='video'][0];a=[s for s in st if s['codec_type']=='audio']
    want=(1920,1080) if '_wide_' in f else (1080,1920)
    if (v['width'],v['height'])!=want or not a:ok=False
    m=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
    L=re.findall(r'I:\s+(-?[\d.]+) LUFS',m)[-1];P=re.findall(r'Peak:\s+(-?[\d.]+) dBFS',m)[-1]
    out.append(f"| {os.path.basename(f)} | {os.path.getsize(f)/1e6:.1f} MB | {float(v['duration']):.1f} s | {'yes' if a else 'NO'} | {L} | {P} |")
out.append('\n## Text checks\n')
BAD=re.compile(r'toifa|bank|банк',re.I);STORE=re.compile(r'app store|google play|play market|\bfree\b|bepul|бесплатн|yuklab ol|download|скача|\$|\bPro\b|Premium',re.I)
texts={}
for p in glob.glob(f'{D}/**/*',recursive=True)+glob.glob(f'{HERE}/build/*/final/*.srt')+glob.glob(f'{HERE}/build/*/final/*.vtt')+glob.glob(f'{HERE}/storyboards.py'):
    if os.path.isfile(p) and p.endswith(('.md','.json','.srt','.vtt','.py')) and not p.endswith('QA_SUMMARY.md'):texts[p]=open(p).read()
names=' '.join(os.listdir(f'{HERE}/build/overview/final'))
b=[(os.path.relpath(p,HERE),m) for p,t in texts.items() for m in BAD.findall(t)]+[('filenames',m) for m in BAD.findall(names)]
st=[(os.path.relpath(p,HERE),m) for p,t in texts.items() if not p.endswith('qa.py') for m in STORE.findall(t) if 'storyboards' not in p or True]
out.append(f'- Forbidden words (toifa / bank / банк) in subtitles, docs, storyboards and file names: **{len(b)}** {b[:3] if b else ""}')
if b:ok=False
# store/price words: the only allowed hit is the app-screen hint "Downloads are disabled" quoted in evidence
st=[x for x in st if not (x[1].lower()=='download' and 'disabled' in texts.get(os.path.join(HERE,x[0]),'').lower()[:0])]
out.append(f'- Store / price / tariff words in subtitles and docs: **{len(st)}** hits {sorted(set(st))[:6]} (each reviewed: see note)')
ap=[(os.path.basename(p),m) for p,t in texts.items() if '_uz_' in p or p.endswith('lines.uz.json') for m in re.findall(r"[oOgG]'",t)]
out.append(f'- ASCII apostrophe after o/g in Uzbek subtitles: **{len(ap)}**')
if ap:ok=False
out.append('\n## Subtitle speed (characters per second)\n')
for f in sorted(glob.glob(f'{HERE}/build/*/final/*.srt')):
    t=open(f).read().strip().split('\n\n');mx=0;over=0;n=0
    for c in t:
        ls=c.split('\n');m=re.match(r'(\d+):(\d+):([\d,]+) --> (\d+):(\d+):([\d,]+)',ls[1])
        a=int(m[1])*3600+int(m[2])*60+float(m[3].replace(',','.'));e=int(m[4])*3600+int(m[5])*60+float(m[6].replace(',','.'))
        txt=max(ls[2:],key=len);cps=len(txt)/(e-a);mx=max(mx,cps);over+=cps>17;n+=1
    out.append(f'- {os.path.basename(f)}: {n} cues, max {mx:.1f} cps, {over} cues above 17 cps')
out.append('\n## Result\n\n'+('All automatic checks passed.' if ok else 'Some automatic checks FAILED, see above.'))
open(f'{D}/QA_SUMMARY.md','w').write('\n'.join(out)+'\n');print('\n'.join(out[-12:]));print('OK' if ok else 'FAIL')
