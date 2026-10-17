import {useState} from 'react';
import {Award,BookOpenCheck,CalendarCheck,ChevronDown,Crown,Eye,Flame,GraduationCap,Medal,Repeat,Sparkles,Target,Trophy} from 'lucide-react';
import {SUBJECTS,loadSeen,topicsOf} from './curriculum';
import {localDay} from './dailyData';
import type {Lang} from './discoveryData';

/** Points, level and badges, computed only from progress already kept on this device (no server, nothing paid). */
const read=<T,>(k:string,d:T):T=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:d}catch{return d}};

/** Days in a row (ending today or yesterday) with daily practice or slide study. */
export function streakDays(){
 const days={...read<Record<string,unknown>>('de_daily',{}),...read<Record<string,unknown>>('de_study_days',{})};
 let n=0;const d=new Date();
 if(!days[localDay(d)])d.setDate(d.getDate()-1);
 while(days[localDay(d)]){n++;d.setDate(d.getDate()-1)}
 return n;
}

function stats(){
 const seen=loadSeen();
 const done=Object.keys(seen).filter(k=>seen[k].s>=seen[k].n);
 const slides=Object.values(seen).reduce((a,x)=>a+x.s,0);
 const days=Object.keys({...read<Record<string,unknown>>('de_daily',{}),...read<Record<string,unknown>>('de_study_days',{})}).length;
 const exams=read<{pct:number;correct:number}[]>('de_exam',[]);
 const practice=read<Record<string,number>>('de_practice',{});
 const review=read<{cards?:Record<string,{reps:number}>}>('de_review',{});
 const reps=Object.values(review.cards||{}).reduce((a,c)=>a+(c.reps||0),0);
 const subjectDone=SUBJECTS.some(s=>{const ts=topicsOf(s.id);return ts.length>0&&ts.every(t=>done.includes(t.id))});
 const xp=done.length*30+slides*2+days*10+exams.reduce((a,e)=>a+(e.correct||0)*2,0)+Object.values(practice).reduce((a,b)=>a+(Number(b)||0)*3,0)+reps;
 return {done:done.length,slides,days,streak:streakDays(),exams,practice,reps,subjectDone,xp};
}

type B={id:string;I:typeof Award;c:string;ok:(s:ReturnType<typeof stats>)=>boolean;t:Record<Lang,[string,string]>};
const BADGES:B[]=[
 {id:'first',I:Sparkles,c:'#168d8b',ok:s=>s.done>=1,t:{uz:['Birinchi qadam','Birinchi mavzuni oxirigacha ko‘ring'],ru:['Первый шаг','Изучите первую тему до конца'],en:['First step','Finish your first topic']}},
 {id:'ten',I:BookOpenCheck,c:'#2f5aa8',ok:s=>s.done>=10,t:{uz:['Bilim izlovchi','10 ta mavzuni tugating'],ru:['Искатель знаний','Изучите 10 тем'],en:['Knowledge seeker','Finish 10 topics']}},
 {id:'master',I:Crown,c:'#c48a10',ok:s=>s.subjectDone,t:{uz:['Fan ustasi','Bitta fanning barcha mavzularini tugating'],ru:['Мастер предмета','Изучите все темы одного предмета'],en:['Subject master','Finish every topic of a subject']}},
 {id:'s3',I:Flame,c:'#e0701e',ok:s=>s.streak>=3,t:{uz:['3 kun ketma-ket','Uch kun ketma-ket mashq qiling'],ru:['3 дня подряд','Занимайтесь три дня подряд'],en:['3-day streak','Study three days in a row']}},
 {id:'s7',I:CalendarCheck,c:'#c2416b',ok:s=>s.streak>=7,t:{uz:['Bir hafta','7 kun ketma-ket mashq qiling'],ru:['Неделя','7 дней подряд'],en:['One week','Study 7 days in a row']}},
 {id:'s30',I:Medal,c:'#6b54b0',ok:s=>s.streak>=30,t:{uz:['Bir oy','30 kun ketma-ket mashq qiling'],ru:['Месяц','30 дней подряд'],en:['One month','Study 30 days in a row']}},
 {id:'exam',I:GraduationCap,c:'#10254e',ok:s=>s.exams.some(e=>e.pct>=60),t:{uz:['Imtihondan o‘tdi','Imtihon rejimida 60% dan yuqori natija oling'],ru:['Экзамен сдан','Наберите больше 60% в режиме экзамена'],en:['Exam passed','Score 60% or more in exam mode']}},
 {id:'ace',I:Trophy,c:'#b7791f',ok:s=>s.exams.some(e=>e.pct>=90),t:{uz:['A’lochi','Imtihonda 90% dan yuqori natija oling'],ru:['Отличник','Наберите 90% и выше на экзамене'],en:['Top student','Score 90% or more in an exam']}},
 {id:'eye',I:Eye,c:'#1f6f9f',ok:s=>Object.values(s.practice).some(v=>Number(v)>=10),t:{uz:['O‘tkir ko‘z','Rasmli amaliyotda 10/10 natija oling'],ru:['Зоркий глаз','10 из 10 в заданиях по картинкам'],en:['Sharp eye','Get 10/10 in picture practice']}},
 {id:'all',I:Target,c:'#2f8f4e',ok:s=>Object.keys(s.practice).length>=5,t:{uz:['Har tomonlama','Rasmli amaliyotning barcha mashqlarini sinab ko‘ring'],ru:['Разносторонний','Попробуйте все задания по картинкам'],en:['All-rounder','Try every picture-practice drill']}},
 {id:'review',I:Repeat,c:'#3d4b63',ok:s=>s.reps>=50,t:{uz:['Takrorlash ustasi','50 ta kartani takrorlang'],ru:['Мастер повторения','Повторите 50 карточек'],en:['Review pro','Review 50 cards']}}
];

const words={
 uz:{level:'Daraja',xp:'XP',next:'keyingi darajagacha',badges:'Nishonlar',of:'dan',show:'Barcha nishonlar',hide:'Yopish',note:'Yutuqlar shu qurilmadagi o‘qish natijalaridan hisoblanadi.'},
 ru:{level:'Уровень',xp:'XP',next:'до следующего уровня',badges:'Награды',of:'из',show:'Все награды',hide:'Свернуть',note:'Достижения считаются по учёбе на этом устройстве.'},
 en:{level:'Level',xp:'XP',next:'to next level',badges:'Badges',of:'of',show:'All badges',hide:'Hide',note:'Achievements are counted from your study on this device.'}
};
const levelOf=(xp:number)=>Math.floor(Math.sqrt(xp/40))+1;
const xpFor=(level:number)=>(level-1)**2*40;

export default function Achievements({lang}:{lang:Lang}){
 const t=words[lang];
 const [open,setOpen]=useState(false);
 const s=stats();
 const level=levelOf(s.xp),lo=xpFor(level),hi=xpFor(level+1);
 const earned=BADGES.filter(b=>b.ok(s));
 return <section className="ac-card">
  <div className="ac-head">
   <div className="ac-ring" style={{['--p' as string]:Math.round((s.xp-lo)/(hi-lo)*100)}}><div><small>{t.level}</small><b>{level}</b></div></div>
   <div className="ac-info"><b>{s.xp} {t.xp}</b><small>{hi-s.xp} {t.xp} {t.next}</small>
    <span className="ac-mini">{earned.slice(-4).map(b=><i key={b.id} style={{color:b.c,background:b.c+'1f'}}><b.I size={14}/></i>)}<em>{earned.length}/{BADGES.length} {t.badges.toLowerCase()}</em></span></div>
   <button className="ac-toggle" aria-expanded={open} onClick={()=>setOpen(!open)} aria-label={open?t.hide:t.show}><ChevronDown size={18}/></button>
  </div>
  {open&&<><div className="ac-grid">{BADGES.map(b=>{const on=b.ok(s);return <div key={b.id} className={'ac-badge'+(on?' on':'')}>
   <i style={on?{color:b.c,background:b.c+'1f'}:undefined}><b.I size={20}/></i><b>{b.t[lang][0]}</b><small>{b.t[lang][1]}</small></div>})}</div>
   <small className="ac-note">{t.note}</small></>}
 </section>;
}
