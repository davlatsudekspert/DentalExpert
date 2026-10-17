import {useEffect,useState,type ReactNode} from 'react';
import {BookOpen,ChevronDown,ChevronLeft,ChevronRight,Presentation,Target} from 'lucide-react';
import Slides from './Slides';
import './learn.css';
import {SUBJECTS,courseWord,loadTopic,metaLine,topicsOf,tx,type Subject,type Topic,type TopicMeta} from './curriculum';
import type {Lang} from './discoveryData';

export const cw={
 uz:{title:'Dars jadvali',sub:'Kurs → fan → mavzu. Har bir mavzuda taqdimot, og‘zaki savollar va test bor.',all:'Hammasi',topics:'mavzu',back:'Orqaga',goals:'Dars maqsadlari',
  slides:'Taqdimotni ko‘rish',slidesN:'slayd',oral:'Og‘zaki savollar',plan:'Javob rejasi',sources:'Manbalar',materials:'Ilovadagi materiallar',empty:'Bu fan bo‘yicha mavzular tayyorlanmoqda.',
  note:'Namuna o‘quv reja: mazmun Dental Expert tomonidan tayyorlangan, muassasaning rasmiy dasturi emas. Rasmiy jadval — o‘z institutingiz sahifasida.',
  testInGroup:'Mavzu testi ustoz guruhda ochganda topshiriladi.'},
 ru:{title:'Учебный план',sub:'Курс → предмет → тема. В каждой теме — презентация, устные вопросы и тест.',all:'Все',topics:'тем',back:'Назад',goals:'Цели занятия',
  slides:'Смотреть презентацию',slidesN:'слайдов',oral:'Устные вопросы',plan:'План ответа',sources:'Источники',materials:'Материалы в приложении',empty:'Темы по этому предмету готовятся.',
  note:'Примерный учебный план: содержание подготовлено Dental Expert, это не официальная программа вуза. Официальное расписание — на сайте вашего вуза.',
  testInGroup:'Тест по теме сдаётся, когда преподаватель откроет его в группе.'},
 en:{title:'Curriculum',sub:'Year → subject → topic. Every topic has slides, oral questions and a test.',all:'All',topics:'topics',back:'Back',goals:'Learning goals',
  slides:'View the slides',slidesN:'slides',oral:'Oral questions',plan:'Answer plan',sources:'Sources',materials:'Materials in the app',empty:'Topics for this subject are being prepared.',
  note:'Sample curriculum: content prepared by Dental Expert, not an institution’s official syllabus. Your official timetable is on your institution’s site.',
  testInGroup:'The topic test is taken when your teacher opens it in a group.'}
};

/** Course chips + subject rows. */
export function SubjectList({lang,onPick}:{lang:Lang;onPick:(s:Subject)=>void}){
 const t=cw[lang];
 const [course,setCourse]=useState(0);
 const courses=[...new Set(SUBJECTS.map(s=>s.course))].sort();
 const list=SUBJECTS.filter(s=>!course||s.course===course);
 return <>
  <div className="chips">{[0,...courses].map(c=><button key={c} className={course===c?'active':''} onClick={()=>setCourse(c)}>{c?courseWord(c,lang):t.all}</button>)}</div>
  <div className="lg-list">{list.map(s=>{const n=topicsOf(s.id).length;return <button key={s.id} className="lg-row" onClick={()=>onPick(s)}>
   <span className="lg-ico">{s.course}</span><span><strong>{tx(s.title,lang)}</strong><small>{courseWord(s.course,lang)} · {s.semester}-{lang==='en'?'sem.':lang==='ru'?'сем.':'semestr'} · {n} {t.topics}</small></span><ChevronRight size={16}/></button>})}</div>
 </>;
}

/** Topic rows of one subject; `tag` adds a status pill per topic (used in groups). */
export function TopicList({lang,subject,onPick,tag}:{lang:Lang;subject:Subject;onPick:(m:TopicMeta)=>void;tag?:(m:TopicMeta)=>ReactNode}){
 const t=cw[lang];
 const list=topicsOf(subject.id);
 if(!list.length)return <p className="muted">{t.empty}</p>;
 return <div className="lg-list">{list.map(m=><button key={m.id} className="lg-row" onClick={()=>onPick(m)}>
  <span className={'lg-ico '+m.type}>{m.n}</span><span><strong>{tx(m.title,lang)}</strong><small>{metaLine(m,lang)}</small></span>{tag?.(m)}<ChevronRight size={16}/></button>)}</div>;
}

export function useTopic(id:string|null){
 const [topic,setTopic]=useState<Topic|null>(null);
 useEffect(()=>{let live=true;setTopic(null);if(id)loadTopic(id).then(t=>{if(live)setTopic(t)});return ()=>{live=false}},[id]);
 return topic;
}

/** Collapsible oral questions with their answer plans. */
export function OralList({lang,topic,extra}:{lang:Lang;topic:Topic;extra?:(k:number)=>ReactNode}){
 const t=cw[lang];
 const [open,setOpen]=useState<number|null>(null);
 return <div className="lg-oral">{topic.oral.map((o,k)=><div key={k} className={'lg-oral-item'+(open===k?' open':'')}>
  <button onClick={()=>setOpen(open===k?null:k)} aria-expanded={open===k}><span>{k+1}</span><b>{tx(o.q,lang)}</b><ChevronDown size={16}/></button>
  {open===k&&<div className="lg-oral-plan"><small>{t.plan}</small><ul>{o.plan.map((p,j)=><li key={j}>{tx(p,lang)}</li>)}</ul></div>}
  {extra?.(k)}
 </div>)}</div>;
}

/** Self-study page of one topic: goals, slides, oral questions, sources. */
export function TopicOverview({lang,topic,subject}:{lang:Lang;topic:Topic;subject:Subject}){
 const t=cw[lang];
 const [show,setShow]=useState(false);
 return <>
  <span className="lg-eyebrow">{tx(subject.title,lang)}</span>
  <h2>{tx(topic.title,lang)}</h2>
  <p className="muted">{metaLine(topic,lang)}</p>
  <div className="lg-card"><h3><Target size={16}/>{t.goals}</h3><ul className="lg-goals">{topic.goals.map((g,k)=><li key={k}>{tx(g,lang)}</li>)}</ul></div>
  <button className="button" onClick={()=>setShow(true)}><Presentation size={17}/>{t.slides} · {topic.slides.length} {t.slidesN}</button>
  <h3 className="lg-h">{t.oral}</h3>
  <OralList lang={lang} topic={topic}/>
  <p className="muted lg-small">{t.testInGroup}</p>
  <div className="lg-card"><h3><BookOpen size={16}/>{t.sources}</h3><ul className="lg-sources">{topic.sources.map((s,k)=><li key={k}>{s}</li>)}</ul></div>
  {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} lang={lang} onClose={()=>setShow(false)}/>}
 </>;
}

/** Curriculum browser for everyone (Learn → Curriculum). */
export default function Curriculum({lang}:{lang:Lang}){
 const t=cw[lang];
 const [subject,setSubject]=useState<Subject|null>(null);
 const [meta,setMeta]=useState<TopicMeta|null>(null);
 const topic=useTopic(meta?.id||null);
 return <section className="lg-section">
  {subject&&<button className="cr-back" onClick={()=>meta?setMeta(null):setSubject(null)}><ChevronLeft size={16}/>{meta?tx(subject.title,lang):t.title}</button>}
  {!subject?<><p className="muted">{t.sub}</p><SubjectList lang={lang} onPick={setSubject}/><small className="muted lg-small">{t.note}</small></>
  :!meta?<><span className="lg-eyebrow">{courseWord(subject.course,lang)}</span><h2>{tx(subject.title,lang)}</h2><TopicList lang={lang} subject={subject} onPick={setMeta}/></>
  :topic?<TopicOverview lang={lang} topic={topic} subject={subject}/>:<p className="muted">…</p>}
 </section>;
}
