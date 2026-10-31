"""Writes docs/video/<id>/* (storyboard, lines, script, claims, QA, description) and builds the ZIP parts.
Usage: python3 docs_pack.py docs   |   python3 docs_pack.py pack <out_dir>"""
import hashlib,json,os,re,subprocess,sys,zipfile,shutil
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from storyboards import VIDEOS
DOCS=os.path.join(HERE,'..','docs','video')
NAMES={'en':'Dental Expert','ru':'Dental Expert','uz':'Dental Expert'}
def mmss(x):return f'{int(x//60)}:{int(x%60):02d}'
TITLES={'overview':{'uz':'Dental Expert: stomatologiya darslari, testlar va 3D atlas bitta ilovada','ru':'Dental Expert: уроки стоматологии, тесты и 3D-атлас в одном приложении','en':'Dental Expert: dental lessons, quizzes and a 3D atlas in one app'},
        'reel':{'uz':'Stomatologiya darslari — cho‘ntagingizda','ru':'Уроки стоматологии — в кармане','en':'Dental lessons in your pocket'}}
TAGS={'uz':'stomatologiya, tish anatomiyasi, stomatolog talaba, tibbiy ta’lim, 3D atlas, o‘quv ilova','ru':'стоматология, анатомия зуба, студенты-стоматологи, медицинское образование, 3D атлас','en':'dentistry, tooth anatomy, dental students, medical education, 3D atlas, learning app'}
def docs():
    for vid,v in VIDEOS.items():
        tl=json.load(open(f'{HERE}/build/{vid}/timeline.json'));d=f'{DOCS}/{vid}';os.makedirs(d,exist_ok=True)
        json.dump(dict(id=vid,title=v['title'],total_seconds=tl['total'],scenes=[dict(key=s['key'],kind=s['kind'],shots=s['shots'],start=t['start'],dur=t['dur']) for s,t in zip(v['scenes'],tl['scenes'])]),open(f'{d}/storyboard.json','w'),indent=1,ensure_ascii=False)
        for l in ('en','ru','uz'):json.dump([dict(key=s['key'],text=s['sub'][l]) for s in v['scenes']],open(f'{d}/lines.{l}.json','w'),indent=1,ensure_ascii=False)
        with open(f'{d}/SCRIPT.md','w') as f:
            f.write(f"# {v['title']}\n\nVoice-over is English in every version (open Kokoro TTS voice af_heart, -16 LUFS). Subtitles: uz / ru / en"+(" (all three together)" if vid=='reel' else " (one language per file)")+". `NEEDS_NATIVE_REVIEW` (uz, ru) · `EXPERT_REVIEW_REQUIRED`\n\n")
            for s,t in zip(v['scenes'],tl['scenes']):
                f.write(f"## {mmss(t['start'])} · {s['key']} ({t['dur']:.1f} s)\n- Voice (en): {s['vo']}\n- Subtitle ru: {s['sub']['ru']}\n- Subtitle uz: {s['sub']['uz']}\n- Screens: {', '.join(s['shots']) or '—'}\n\n")
        with open(f'{d}/CLAIMS_AND_EVIDENCE.md','w') as f:
            f.write("# Claims and evidence\n\nEvery spoken or written statement is backed by text shown on the real app screen (screens are screenshots of the app; nothing is drawn). No superiority claims, no clinical advice, no store, price or date claims. `EXPERT_REVIEW_REQUIRED`: no expert has signed these videos off.\n\n| Line | What on the app screen backs it |\n|---|---|\n")
            for s in v['scenes']:f.write(f"| {s['vo']} | {s['evidence']} |\n")
        with open(f'{d}/DESCRIPTION.md','w') as f:
            f.write(f"# {v['title']}: publishing text\n\n`NEEDS_NATIVE_REVIEW` (uz, ru) · `EXPERT_REVIEW_REQUIRED`\n\nNo store link, price or date is stated anywhere: the app is shown as «Tez kunda / Скоро / Coming soon».\n\n")
            for l in ('uz','ru','en'):
                f.write(f"## YouTube ({l})\n**Title:** {TITLES[vid][l]}\n\n")
                f.write({'uz':'Dental Expert — stomatolog talabalar, ustozlar va shifokorlar uchun o‘quv ilova: darslar, rasmli mashq, takrorlash, imtihon rejimi va tishning 3D atlasi. Tez kunda.\n\nAudio inglizcha, subtitr o‘zbekcha.','ru':'Dental Expert — учебное приложение для студентов-стоматологов, преподавателей и врачей: уроки, практика на снимках, повторение, режим экзамена и 3D-атлас зуба. Скоро.\n\nОзвучка на английском, субтитры на русском.','en':'Dental Expert is a learning app for dental students, teachers and dentists: lessons, picture practice, review cards, an exam mode and a 3D tooth atlas. Coming soon.\n\nEnglish voice-over, English subtitles.'}[l]+"\n\n")
                if vid=='overview':
                    f.write('**Chapters**\n'+'\n'.join(f"{mmss(t['start'])} {s['head'][l]}" for s,t in zip(v['scenes'],tl['scenes']))+'\n\n')
                f.write(f"**Tags:** {TAGS[l]}\n\n")
            f.write("## Instagram caption\n\n**uz:** Stomatologiya darslari, testlar va tishning 3D atlasi — bitta ilovada. Dental Expert: tez kunda. Yangiliklar profilda.\n\n**ru:** Уроки стоматологии, тесты и 3D-атлас зуба — в одном приложении. Dental Expert: скоро. Новости в профиле.\n\n**en:** Dental lessons, quizzes and a 3D tooth atlas in one app. Dental Expert: coming soon. News in our profile.\n\n#stomatologiya #dentalexpert #tishanatomiyasi #stomatologtalaba #стоматология #dentalstudent #dentistry\n")
        with open(f'{d}/QA.md','w') as f:
            f.write(f"# QA ({vid})\n\nSee ../QA_SUMMARY.md for the checks run on the finished files.\n")
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for c in iter(lambda:f.read(1<<20),b''):h.update(c)
    return h.hexdigest()
def pack(out):
    os.makedirs(out,exist_ok=True);F={}
    for vid in VIDEOS:
        fd=f'{HERE}/build/{vid}/final'
        for n in sorted(os.listdir(fd)):F[n]=os.path.join(fd,n)
    wide=[n for n in F if '_wide_' in n];tall=[n for n in F if '_tall_' in n]
    def zipit(name,files,extra=()):
        p=f'{out}/{name}';
        with zipfile.ZipFile(p,'w',zipfile.ZIP_STORED) as z:
            for n in files:z.write(F[n],n.split('_')[0]+'/'+n)
            for arc,src in extra:z.write(src,arc)
        return p
    shutil.rmtree(f'{out}/_x',ignore_errors=True)
    return F,wide,tall,zipit
if __name__=='__main__':
    if sys.argv[1]=='docs':docs()
