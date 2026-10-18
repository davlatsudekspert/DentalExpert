import {useState} from 'react';
import {Flame,Play,Sparkles} from 'lucide-react';
import Slides from './Slides';
import {useTopic} from './Curriculum';
import {SUBJECTS,TOPICS,loadLast,loadSeen,markSlide,topicMeta,tx,type TopicMeta} from './curriculumData';
import {SubjectIcon,subjectColor} from './subjectArt';
import {localDay} from './dailyData';
import {streakDays} from './Achievements';
import type {Lang} from './discoveryData';

const words={
 uz:{cont:'Davom ettirish',start:'Boshlash',today:'Bugungi dars',next:'Keyingi mavzu',slide:'slayd',streak:'kun ketma-ket',noStreak:'Bugun seriyani boshlang',learned:'mavzu o‘rganildi'},
 ru:{cont:'Продолжить',start:'Начать',today:'Урок на сегодня',next:'Следующая тема',slide:'слайд',streak:'дн. подряд',noStreak:'Начните серию сегодня',learned:'тем изучено'},
 en:{cont:'Continue',start:'Start',today:'Today’s lesson',next:'Next topic',slide:'slide',streak:'day streak',noStreak:'Start your streak today',learned:'topics learned'}
};

const markStudyDay=()=>{try{const k='de_study_days';const v=JSON.parse(localStorage.getItem(k)||'{}');v[localDay()]=1;localStorage.setItem(k,JSON.stringify(v))}catch{/* storage unavailable */}};

/** Home card: continue the last topic where it stopped, or start the next unseen one; streak and progress. */
export default function Today({lang}:{lang:Lang}){
 const t=words[lang];
 const [tick,setTick]=useState(0);
 const [open,setOpen]=useState(false);
 const seen=loadSeen();
 const last=loadLast();
 const lastMeta=last&&topicMeta(last.id);
 const unfinished=lastMeta&&seen[lastMeta.id]&&seen[lastMeta.id].s<seen[lastMeta.id].n?lastMeta:null;
 const order=[...TOPICS].sort((a,b)=>{const sa=SUBJECTS.findIndex(s=>s.id===a.subject),sb=SUBJECTS.findIndex(s=>s.id===b.subject);return sa-sb||a.n-b.n});
 const nextMeta:TopicMeta|undefined=unfinished||order.find(m=>!seen[m.id]||seen[m.id].s<seen[m.id].n);
 const topic=useTopic(nextMeta?.id||null);
 const learned=Object.values(seen).filter(x=>x.s>=x.n).length;
 const st=streakDays();
 void tick;
 if(!nextMeta)return null;
 const a=subjectColor(nextMeta.subject);
 const subject=SUBJECTS.find(s=>s.id===nextMeta.subject)!;
 const progress=seen[nextMeta.id];
 return <section className="td-card" style={{['--td' as string]:a.c,['--td-bg' as string]:a.bg}}>
  <div className="td-top"><span className="td-label"><Sparkles size={14}/>{unfinished?t.today:t.next}</span><span className="td-streak"><Flame size={14}/>{st?`${st} ${t.streak}`:t.noStreak}</span></div>
  <div className="td-main"><span className="td-ico"><SubjectIcon id={nextMeta.subject} size={30}/></span>
   <div><small>{tx(subject.title,lang)}</small><b>{tx(nextMeta.title,lang)}</b>
    {progress&&<span className="td-bar"><i style={{width:`${progress.s/progress.n*100}%`}}/></span>}
    <em>{progress?`${progress.s}/${progress.n} ${t.slide}`:''}{learned?`${progress?' · ':''}${learned} ${t.learned}`:''}</em></div></div>
  <button className="td-go" disabled={!topic} onClick={()=>{markStudyDay();setOpen(true)}}><Play size={16}/>{progress?t.cont:t.start}</button>
  {open&&topic&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} sources={topic.sources} lang={lang} accent={a.c}
   start={last?.id===topic.id?last.slide:0} onProgress={i=>markSlide(topic.id,i,topic.slides.length)} onClose={()=>{setOpen(false);setTick(x=>x+1)}}/>}
 </section>;
}
