import {useEffect,useRef,useState,type ReactNode} from 'react';
import {BookOpen,CheckCircle2,ClipboardCheck,ChevronDown,ChevronLeft,ChevronRight,Presentation,Target,Users} from 'lucide-react';
import Slides from './Slides';
import QuizRun,{type RunQ} from './QuizRun';
import {callApi} from './api';
import {askAssignTopic} from './joinLink';
import './learn.css';
import {SubjectIcon,subjectColor} from './subjectArt';
import {SUBJECTS,courseWord,loadLast,loadSeen,loadTopic,markSlide,metaLine,topicsOf,tx,type Subject,type Topic,type TopicMeta} from './curriculumData';
import type {Lang} from './discoveryData';

export const cw={
 uz:{title:'O‘quv reja',sub:'Kurs → fan → mavzu. Har bir mavzuda taqdimot, og‘zaki savollar va test bor.',all:'Hammasi',topics:'mavzu',back:'Orqaga',goals:'Dars maqsadlari',
  slides:'Taqdimotni ko‘rish',doneT:'Taqdimot tugadi',doneS:'Endi og‘zaki savollar bilan o‘zingizni tekshiring — har birida javob rejasi bor.',slidesN:'slayd',oral:'Og‘zaki savollar',plan:'Javob rejasi',sources:'Manbalar',materials:'Ilovadagi materiallar',empty:'Bu fan bo‘yicha mavzular tayyorlanmoqda.',
  note:'Namuna o‘quv reja: mazmun Dental Expert tomonidan tayyorlangan, muassasaning rasmiy dasturi emas. Rasmiy jadval — o‘z institutingiz sahifasida.',
  testInGroup:'Mavzu testi ustoz guruhda ochganda topshiriladi.',selfTest:'Mavzu bo‘yicha test',q:'savol',best:'Eng yaxshi natija',testNote:'O‘zingizni sinang: javoblar va izohlar darhol ko‘rsatiladi. Guruhdagi baholanadigan testni ustoz ochadi.',testErr:'Test yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.'},
 ru:{title:'Учебный план',sub:'Курс → предмет → тема. В каждой теме — презентация, устные вопросы и тест.',all:'Все',topics:'тем',back:'Назад',goals:'Цели занятия',
  slides:'Смотреть презентацию',doneT:'Презентация пройдена',doneS:'Теперь проверьте себя устными вопросами — у каждого есть план ответа.',slidesN:'слайдов',oral:'Устные вопросы',plan:'План ответа',sources:'Источники',materials:'Материалы в приложении',empty:'Темы по этому предмету готовятся.',
  note:'Примерный учебный план: содержание подготовлено Dental Expert, это не официальная программа вуза. Официальное расписание — на сайте вашего вуза.',
  testInGroup:'Тест по теме сдаётся, когда преподаватель откроет его в группе.',selfTest:'Тест по теме',q:'вопросов',best:'Лучший результат',testNote:'Проверьте себя: ответы и пояснения показываются сразу. Оцениваемый тест в группе открывает преподаватель.',testErr:'Тест не загрузился. Проверьте интернет и попробуйте ещё раз.'},
 en:{title:'Curriculum',sub:'Year → subject → topic. Every topic has slides, oral questions and a test.',all:'All',topics:'topics',back:'Back',goals:'Learning goals',
  slides:'View the slides',doneT:'Slides finished',doneS:'Now test yourself with the oral questions — each has an answer plan.',slidesN:'slides',oral:'Oral questions',plan:'Answer plan',sources:'Sources',materials:'Materials in the app',empty:'Topics for this subject are being prepared.',
  note:'Sample curriculum: content prepared by Dental Expert, not an institution’s official syllabus. Your official timetable is on your institution’s site.',
  testInGroup:'The topic test is taken when your teacher opens it in a group.',selfTest:'Topic test',q:'questions',best:'Best score',testNote:'Test yourself: answers and explanations appear right away. The graded test in a group is opened by your teacher.',testErr:'The test did not load. Check your connection and try again.'}
};

/** Brings a lesson screen's top back into view after navigating inside it (when it has scrolled above the viewport). */
export const toTop=(el:HTMLElement|null)=>{if(el&&el.getBoundingClientRect().top<0)el.scrollIntoView?.({block:'start'})};

/** Course chips + subject rows. */
export function SubjectList({lang,onPick}:{lang:Lang;onPick:(s:Subject)=>void}){
 const t=cw[lang];
 const [course,setCourse]=useState(0);
 const courses=[...new Set(SUBJECTS.map(s=>s.course))].sort();
 const list=SUBJECTS.filter(s=>!course||s.course===course);
 const seen=loadSeen();
 const done=(id:string)=>topicsOf(id).filter(m=>seen[m.id]&&seen[m.id].s>=seen[m.id].n).length;
 return <>
  <div className="chips">{[0,...courses].map(c=><button key={c} className={course===c?'active':''} onClick={()=>setCourse(c)}>{c?courseWord(c,lang):t.all}</button>)}</div>
  <div className="lg-list">{list.map(s=>{const n=topicsOf(s.id).length;return <button key={s.id} className="lg-row" onClick={()=>onPick(s)}>
   <span className="lg-ico" style={{background:subjectColor(s.id).bg}}><SubjectIcon id={s.id}/></span><span className="lg-row-text"><strong>{tx(s.title,lang)}</strong><small>{courseWord(s.course,lang)} · {s.semester}-{lang==='en'?'sem.':lang==='ru'?'сем.':'semestr'} · {n} {t.topics}</small>{n>0&&<i className="lg-mini"><b style={{width:`${done(s.id)/n*100}%`,background:subjectColor(s.id).c}}/></i>}</span><ChevronRight size={16}/></button>})}</div>
 </>;
}

/** Topic rows of one subject; `tag` adds a status pill under each title (used in groups). */
export function TopicList({lang,subject,onPick,tag}:{lang:Lang;subject:Subject;onPick:(m:TopicMeta)=>void;tag?:(m:TopicMeta)=>ReactNode}){
 const t=cw[lang];
 const list=topicsOf(subject.id);
 const seen=loadSeen();
 if(!list.length)return <p className="muted">{t.empty}</p>;
 return <div className="lg-list">{list.map(m=><button key={m.id} className="lg-row" onClick={()=>onPick(m)}>
  <span className={'lg-ico num '+m.type} style={{background:subjectColor(m.subject).bg,color:subjectColor(m.subject).c}}>{m.n}</span><span className="lg-row-text"><strong>{tx(m.title,lang)}</strong><small>{metaLine(m,lang)}</small>{tag?.(m)}</span>{!tag&&seen[m.id]?<span className="lg-tag brand">{seen[m.id].s>=seen[m.id].n?'✓':`${seen[m.id].s}/${seen[m.id].n}`}</span>:null}<ChevronRight size={16}/></button>)}</div>;
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
export function TopicOverview({lang,topic,subject,teacher}:{lang:Lang;topic:Topic;subject:Subject;teacher?:boolean}){
 const t=cw[lang];
 const [show,setShow]=useState(false);
 const seen=loadSeen()[topic.id];const [done,setDone]=useState(!!seen&&seen.s>=seen.n);
 return <>
  <span className="lg-eyebrow">{tx(subject.title,lang)}</span>
  <h2>{tx(topic.title,lang)}</h2>
  <p className="muted">{metaLine(topic,lang)}</p>
  <div className="lg-card"><h3><Target size={16}/>{t.goals}</h3><ul className="lg-goals">{topic.goals.map((g,k)=><li key={k}>{tx(g,lang)}</li>)}</ul></div>
  <button className="button" onClick={()=>setShow(true)}><Presentation size={17}/>{t.slides} · {topic.slides.length} {t.slidesN}</button>
  {done&&<div className="lg-done" role="status"><CheckCircle2 size={20}/><div><b>{t.doneT}</b><small>{t.doneS}</small></div></div>}
  <h3 className="lg-h">{t.oral}</h3>
  <OralList lang={lang} topic={topic}/>
  <SelfTest lang={lang} topic={topic} teacher={teacher}/>
  <div className="lg-card"><h3><BookOpen size={16}/>{t.sources}</h3><ul className="lg-sources" lang="en" translate="no">{topic.sources.map((s,k)=><li key={k}>{s}</li>)}</ul></div>
  {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} sources={topic.sources} lang={lang} accent={subjectColor(subject.id).c}
   start={loadLast()?.id===topic.id?loadLast()!.slide:0} onProgress={i=>markSlide(topic.id,i,topic.slides.length)} onFinished={()=>setDone(true)} onClose={()=>setShow(false)}/>}
 </>;
}

export function SubjectHero({lang,subject}:{lang:Lang;subject:Subject}){
 const t=cw[lang];const a=subjectColor(subject.id);const n=topicsOf(subject.id).length;
 return <div className="lg-hero" style={{background:`linear-gradient(135deg,${a.bg},#ffffff)`,borderColor:a.bg}}>
  <span className="lg-hero-ico" style={{color:a.c}}><SubjectIcon id={subject.id} size={34}/></span>
  <div><span className="lg-eyebrow" style={{color:a.c}}>{courseWord(subject.course,lang)} · {subject.semester}-{lang==='en'?'sem.':lang==='ru'?'сем.':'semestr'}</span><h2>{tx(subject.title,lang)}</h2><small>{n} {t.topics}</small></div>
 </div>;
}

/** Curriculum browser for everyone (Learn → Curriculum). */
export default function Curriculum({lang,teacher}:{lang:Lang;teacher?:boolean}){
 const t=cw[lang];
 const [subject,setSubject]=useState<Subject|null>(null);
 const [meta,setMeta]=useState<TopicMeta|null>(null);
 const topic=useTopic(meta?.id||null);
 const top=useRef<HTMLElement>(null);
 const first=useRef(true);
 useEffect(()=>{if(first.current){first.current=false;return}toTop(top.current)},[subject,meta]);
 return <section className="lg-section" ref={top}>
  {subject&&<button className="cr-back" onClick={()=>meta?setMeta(null):setSubject(null)}><ChevronLeft size={16}/>{meta?tx(subject.title,lang):t.title}</button>}
  {!subject?<><p className="muted">{t.sub}</p><SubjectList lang={lang} onPick={setSubject}/><small className="muted lg-small">{t.note}</small></>
  :!meta?<><SubjectHero lang={lang} subject={subject}/><TopicList lang={lang} subject={subject} onPick={setMeta}/></>
  :topic?<TopicOverview lang={lang} topic={topic} subject={subject} teacher={teacher}/>:<p className="muted">…</p>}
 </section>;
}

const chooseWords={uz:{group:'Guruhga topshirish',groupHint:'Savollar soni, vaqt va muddatni belgilab, guruhingizga berasiz.',self:'O‘zim yechib ko‘rish',selfHint:'O‘zingiz uchun mashq: javoblar darhol ko‘rinadi, hech kimga yuborilmaydi.',cancel:'Bekor qilish'},
 ru:{group:'Дать группе',groupHint:'Выберите число вопросов, время и срок и дайте тест группе.',self:'Решить самому',selfHint:'Тренировка для себя: ответы видны сразу, никуда не отправляются.',cancel:'Отмена'},
 en:{group:'Assign to a group',groupHint:'Choose the number of questions, time and window and give it to your group.',self:'Try it myself',selfHint:'Practice for yourself: answers show right away and nothing is sent.',cancel:'Cancel'}};
const BEST='de_topic_tests';
const readBest=():Record<string,{best:number;total:number}>=>{try{return JSON.parse(localStorage.getItem(BEST)||'{}')}catch{return {}}};
/** Self-study topic test: the questions ship with the app, the key comes from the server when the test starts. */
function SelfTest({lang,topic,teacher}:{lang:Lang;topic:Topic;teacher?:boolean}){
 const [choose,setChoose]=useState(false);
 const ch=chooseWords[lang];
 const t=cw[lang];
 const [qs,setQs]=useState<RunQ[]|null>(null);
 const [busy,setBusy]=useState(false);const [err,setErr]=useState(false);
 const [best,setBest]=useState(()=>readBest()[topic.id]);
 if(!topic.test?.length)return <p className="muted lg-small">{t.testInGroup}</p>;
 const start=async()=>{setBusy(true);setErr(false);const r=await callApi<{correct:number[];explain:{en:string;ru:string;uz:string}[]}>('/curriculum/key?topicId='+topic.id);setBusy(false);
  if(!r.ok||!Array.isArray(r.data.correct)){setErr(true);return}
  setQs(topic.test.map((x,k)=>({q:tx(x.q,lang),options:x.options.map(o=>tx(o,lang)),correct:r.data.correct[k],explanation:tx(r.data.explain[k],lang)})))};
 const done=(score:number,total:number)=>{const all=readBest();const prev=all[topic.id];if(!prev||score>prev.best){all[topic.id]={best:score,total};try{localStorage.setItem(BEST,JSON.stringify(all))}catch{/* storage unavailable */}setBest(all[topic.id])}};
 return <div className="lg-card lg-selftest">
  <h3><ClipboardCheck size={16}/>{t.selfTest} · {topic.test.length} {t.q}</h3>
  <p className="muted lg-small">{t.testNote}</p>
  {best&&<p className="lg-best">{t.best}: <b>{best.best}/{best.total}</b></p>}
  {err&&<p className="error-text" role="alert">{t.testErr}</p>}
  {/* A teacher is asked first: give it to a group, or try it themself. A student starts right away. */}
  <button className="button secondary" disabled={busy} onClick={teacher?()=>setChoose(true):start}><ClipboardCheck size={17}/>{t.selfTest}</button>
  {choose&&<div className="lg-confirm" onClick={e=>{if(e.target===e.currentTarget)setChoose(false)}}><div className="lg-confirm-sheet lg-choose" role="dialog" aria-modal="true" aria-labelledby="lg-choose-t">
   <p id="lg-choose-t"><b>{t.selfTest}</b> · {tx(topic.title,lang)}</p>
   <button className="button" autoFocus onClick={()=>{setChoose(false);askAssignTopic(topic.id)}}><Users size={17}/>{ch.group}</button><small className="lg-small muted">{ch.groupHint}</small>
   <button className="button secondary" onClick={()=>{setChoose(false);start()}}><ClipboardCheck size={17}/>{ch.self}</button><small className="lg-small muted">{ch.selfHint}</small>
   <button className="lg-link" onClick={()=>setChoose(false)}>{ch.cancel}</button></div></div>}
  {qs&&<QuizRun title={tx(topic.title,lang)} lang={lang} questions={qs} onDone={done} onClose={()=>setQs(null)}/>}
 </div>;
}
