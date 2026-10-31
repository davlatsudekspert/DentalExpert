"""English voice-over with the open Kokoro model (free). Writes per-line wavs, lays them on the timeline and returns it."""
import json,os,subprocess,sys,wave
import numpy as np
sys.path.insert(0,os.path.dirname(__file__))
from storyboards import VIDEOS
HERE=os.path.dirname(os.path.abspath(__file__));K=os.environ.get('KOKORO_DIR','/tmp/kokoro')
SR=24000;LEAD=0.45;TAIL=1.1
def build(vid):
    from kokoro_onnx import Kokoro
    import soundfile as sf
    k=Kokoro(f'{K}/kokoro.onnx',f'{K}/voices.bin');v=VIDEOS[vid];out=f'{HERE}/build/{vid}';os.makedirs(out,exist_ok=True)
    t=0.0;tl=[];track=[]
    for s in v['scenes']:
        a,_=k.create(s['vo'],voice='af_heart',speed=0.94,lang='en-us');d=len(a)/SR
        dur=max(s['hold'],LEAD+d+TAIL,2.0*len(s['shots']) if len(s['shots'])>1 else 0)
        pre=np.zeros(int(LEAD*SR),dtype=np.float32);post=np.zeros(int((dur-LEAD-d)*SR),dtype=np.float32)
        track+= [pre,a.astype(np.float32),post]
        tl.append(dict(key=s['key'],start=round(t,3),dur=round(dur,3),voStart=round(t+LEAD,3),voDur=round(d,3)));t+=dur
    y=np.concatenate(track);sf.write(f'{out}/vo_raw.wav',y,SR)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{out}/vo_raw.wav','-af','loudnorm=I=-16:TP=-2.4:LRA=11,aresample=48000','-ac','2',f'{out}/vo.wav'],check=True)
    json.dump(dict(total=round(t,3),scenes=tl),open(f'{out}/timeline.json','w'),indent=1)
    return t
if __name__=='__main__':
    for vid in sys.argv[1:]:print(vid,'seconds',round(build(vid),1))
