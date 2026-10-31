"""Renders one video: python3 render.py <video> <lang> <wide|tall> <mono|color> [still_seconds ...]
Frames come from studio.html (deterministic seek), piped to ffmpeg together with the English voice-over."""
import json,os,re,subprocess,sys
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from storyboards import VIDEOS
def chunks(text,lim=64):
    if len(text)<=lim:return [text]
    best=None
    for m in re.finditer(r'[,:;—–] |\. ',text):
        d=abs(m.end()-len(text)/2)
        if best is None or d<best[0]:best=(d,m.end())
    if best is None:
        i=text.rfind(' ',0,len(text)//2+8);i=i if i>0 else len(text)//2;return [text[:i].strip(),text[i:].strip()]
    return [text[:best[1]].strip(),text[best[1]:].strip()]
def subs(vid,tl,lang):
    """Subtitle cues. One language per file (overview): each language is timed by its own text. The reel shows uz/ru/en together, so its chunks share one window.
    A cue stays up from just before the voice starts until just before the scene ends, which keeps the reading speed low."""
    out=[];n=0;v=VIDEOS[vid];langs=('uz','ru','en') if vid=='reel' else (lang,)
    for s,t in zip(v['scenes'],tl['scenes']):
        parts={l:chunks(s['sub'][l]) for l in langs};k=max(len(p) for p in parts.values())
        for l in parts:
            if len(parts[l])<k:parts[l]=[' '.join(parts[l])]*k
        weights=[max(len(parts[l][i]) for l in parts)+4 for i in range(k)];tot=sum(weights);t0=t['voStart']-0.1;dur=t['start']+t['dur']-0.3-t0
        for i in range(k):
            t1=t0+dur*weights[i]/tot;out.append(dict(id=n,t0=round(t0,3),t1=round(t1,3),text={l:parts[l][i] for l in parts}));n+=1;t0=t1
    return out
def srt_time(x,vtt=False):
    h=int(x//3600);m=int(x%3600//60);s=x%60;return f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.',',' if not vtt else '.')
def write_subs(vid,lang,tl,outdir):
    cs=subs(vid,tl,lang);stack=vid=='reel'
    def body(c):return '\n'.join([c['text']['uz'],c['text']['ru'],c['text']['en']]) if stack else c['text'][lang]
    cues=[]
    for c in cs:   # identical neighbouring cues become one
        if cues and cues[-1][2]==body(c):cues[-1][1]=c['t1']
        else:cues.append([c['t0'],c['t1'],body(c)])
    with open(f'{outdir}.srt','w') as f:
        for i,(a,b,t) in enumerate(cues,1):f.write(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n\n")
    with open(f'{outdir}.vtt','w') as f:
        f.write('WEBVTT\n\n')
        for a,b,t in cues:f.write(f"{srt_time(a,True)} --> {srt_time(b,True)}\n{t}\n\n")
    return cs
def spec_for(vid,lang,fmt,theme):
    v=VIDEOS[vid];tl=json.load(open(f'{HERE}/build/{vid}/timeline.json'));W,H=(1920,1080) if fmt=='wide' else (1080,1920)
    scenes=[]
    for s,t in zip(v['scenes'],tl['scenes']):
        shots=[f'shots/{theme}/{lang if vid!="reel" else "uz"}/{x}.png' for x in s['shots']]
        scenes.append(dict(kind=s['kind'],start=t['start'],dur=t['dur'],shots=shots,focus=s['focus'],head=s['head']['uz' if vid=='reel' else lang] or s['head']['uz']))
    return tl,dict(W=W,H=H,theme=theme,lang=lang,mode='stack' if vid=='reel' else 'single',total=tl['total'],scenes=scenes)
def main():
    vid,lang,fmt,theme=sys.argv[1:5];stills=[float(x) for x in sys.argv[5:]]
    tl,spec=spec_for(vid,lang,fmt,theme);tmp=f'/tmp/_s_{vid}_{lang}_{fmt}_{theme}';spec['subs']=write_subs(vid,lang,tl,tmp)
    name=f'{vid}_{lang}_{fmt}_{theme}';out=f'{HERE}/build/{vid}';os.makedirs(f'{out}/final',exist_ok=True)
    stack=vid=='reel'
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
        pg=b.new_page(viewport={'width':spec['W'],'height':spec['H']});pg.on('pageerror',lambda e:print('PAGEERR',e))
        pg.goto('file://'+HERE+'/studio.html');pg.evaluate('spec=>window.init(spec)',spec) if False else None
        pg.evaluate('async spec=>{await window.init(spec)}',spec)
        if stills:
            for t in stills:
                pg.evaluate('t=>window.seek(t)',t);pg.screenshot(path=f'{out}/still_{name}_{t:g}.png')
            b.close();return
        os.replace(tmp+'.srt',f'{out}/final/{name}.srt');os.replace(tmp+'.vtt',f'{out}/final/{name}.vtt')
        fps=30;n=int(spec['total']*fps)
        ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(fps),'-c:v','mjpeg','-i','-','-i',f'{out}/vo.wav','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-r',str(fps),'-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',f'{out}/final/{name}.mp4'],stdin=subprocess.PIPE)
        for i in range(n):
            pg.evaluate('t=>window.seek(t)',i/fps);ff.stdin.write(pg.screenshot(type='jpeg',quality=90))
        ff.stdin.close();ff.wait();b.close()
        print('done',name,n,'frames')
main()
