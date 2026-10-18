import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {ArrowLeft,BookOpen,Check,ChevronRight,Flame,Layers,RotateCcw,Sparkles} from 'lucide-react';
import type {Lang} from './discoveryData';
import {SUBJECTS,TOPICS,loadTopic,tx,type Topic} from './curriculumData';
import {localDay} from './dailyData';
import './review.css';

/** "Takrorlash": Leitner spaced-repetition flashcards built from curriculum oral questions and deck quizzes (never from topic tests, which carry no answers in the bundle). */

type DeckQ={q:string;options:string[];correct:number;explanation:string};
type Deck={id:string;title:string;quiz:DeckQ[]};
type Card={id:string;group:string;kind:'oral'|'quiz';source:string;front:string;plan?:string[];answer?:string;why?:string};
type CardState={box:number;due:string;reps:number;lapses:number};
type Store={v:1;cards:Record<string,CardState>;excluded:string[];newDay:string;newCount:number;doneDay:string;doneCount:number;streakDay:string;streak:number};
type Grade='again'|'hard'|'easy';

const INTERVALS=[1,3,7,14,30];
const NEW_PER_DAY=20;
const KEY='de_review';
const DECK_GROUP='decks';

const dict={
 uz:{title:'Takrorlash',sub:'Har bir karta eslab qolish uchun eng qulay vaqtda qaytadi',due:'Bugun takrorlash',fresh:'Yangi kartalar',streak:'Ketma-ket',days:(n:number)=>`${n} kun`,
  today:'Bugungi reja',todayOf:(a:number,b:number)=>`${a} / ${b} karta`,subjects:'Fanlar',all:'Hammasini tanlash',none:'Tozalash',
  cards:(n:number)=>`${n} ta karta`,dueBadge:(n:number)=>`${n} ta navbatda`,newBadge:(n:number)=>`${n} yangi`,decks:'Mini-darslar testlari',
  start:(n:number)=>`Boshlash · ${n} ta karta`,pick:'Kamida bitta fanni tanlang',loading:'Kartalar tayyorlanmoqda…',
  limit:'Kuniga ko‘pi bilan 20 ta yangi karta',schedule:'Jadval: 1 → 3 → 7 → 14 → 30 kun. Kuniga ko‘pi bilan 20 ta yangi karta.',
  show:'Javobni ko‘rsatish',tap:'Kartani aylantirish uchun bosing',plan:'Javob rejasi',correct:'To‘g‘ri javob',why:'Izoh',oral:'Og‘zaki savol',quiz:'Test savoli',
  again:'Bilmadim',hard:'Qiyin',easy:'Oson',soon:'shu seansda',after:(n:number)=>`${n} kundan so‘ng`,grade:'O‘zingizni baholang',
  left:(n:number)=>`${n} ta qoldi`,back:'Orqaga',stop:'Seansni tugatish',
  emptyTitle:'Bugungi takrorlash yakunlandi',emptyNext:(d:string)=>`Keyingi kartalar ${d} kuni qaytadi.`,emptyNew:'Yangi kartalar ertaga qo‘shiladi.',emptyNone:'Tanlangan fanlarda hozircha kartalar yo‘q.',
  doneTitle:'Ajoyib! Seans tugadi',doneText:(n:number)=>`${n} ta karta takrorlandi. Ertaga yana qaytib keling — ketma-ketlik shunday saqlanadi.`,
  doneStats:{again:'Bilmadim',hard:'Qiyin',easy:'Oson'},home:'Bosh sahifaga'},
 ru:{title:'Повторение',sub:'Каждая карточка возвращается тогда, когда её проще всего закрепить',due:'К повторению',fresh:'Новые карточки',streak:'Серия',days:(n:number)=>`${n} дн.`,
  today:'План на сегодня',todayOf:(a:number,b:number)=>`${a} / ${b} карточек`,subjects:'Предметы',all:'Выбрать все',none:'Сбросить',
  cards:(n:number)=>`${n} карт.`,dueBadge:(n:number)=>`${n} к повторению`,newBadge:(n:number)=>`${n} новых`,decks:'Тесты мини-уроков',
  start:(n:number)=>`Начать · ${n} карт.`,pick:'Выберите хотя бы один предмет',loading:'Готовим карточки…',
  limit:'Не больше 20 новых карточек в день',schedule:'Интервалы: 1 → 3 → 7 → 14 → 30 дней. Не больше 20 новых карточек в день.',
  show:'Показать ответ',tap:'Нажмите, чтобы перевернуть',plan:'План ответа',correct:'Правильный ответ',why:'Пояснение',oral:'Устный вопрос',quiz:'Тестовый вопрос',
  again:'Не знаю',hard:'Трудно',easy:'Легко',soon:'в этой сессии',after:(n:number)=>`через ${n} дн.`,grade:'Оцените себя',
  left:(n:number)=>`осталось ${n}`,back:'Назад',stop:'Завершить сессию',
  emptyTitle:'На сегодня всё повторено',emptyNext:(d:string)=>`Следующие карточки вернутся ${d}.`,emptyNew:'Новые карточки добавятся завтра.',emptyNone:'В выбранных предметах пока нет карточек.',
  doneTitle:'Отлично! Сессия завершена',doneText:(n:number)=>`Повторено карточек: ${n}. Возвращайтесь завтра, чтобы сохранить серию.`,
  doneStats:{again:'Не знаю',hard:'Трудно',easy:'Легко'},home:'На главную'},
 en:{title:'Review',sub:'Each card comes back right when it is easiest to remember',due:'Due today',fresh:'New cards',streak:'Streak',days:(n:number)=>`${n} d`,
  today:'Today’s plan',todayOf:(a:number,b:number)=>`${a} / ${b} cards`,subjects:'Subjects',all:'Select all',none:'Clear',
  cards:(n:number)=>`${n} cards`,dueBadge:(n:number)=>`${n} due`,newBadge:(n:number)=>`${n} new`,decks:'Mini-lesson quizzes',
  start:(n:number)=>`Start · ${n} cards`,pick:'Pick at least one subject',loading:'Preparing cards…',
  limit:'Up to 20 new cards a day',schedule:'Schedule: 1 → 3 → 7 → 14 → 30 days. At most 20 new cards a day.',
  show:'Show answer',tap:'Tap the card to flip it',plan:'Answer plan',correct:'Correct answer',why:'Explanation',oral:'Oral question',quiz:'Quiz question',
  again:'Again',hard:'Hard',easy:'Easy',soon:'this session',after:(n:number)=>`in ${n} d`,grade:'Grade yourself',
  left:(n:number)=>`${n} left`,back:'Back',stop:'End session',
  emptyTitle:'Today’s review is done',emptyNext:(d:string)=>`The next cards come back on ${d}.`,emptyNew:'New cards are added tomorrow.',emptyNone:'The selected subjects have no cards yet.',
  doneTitle:'Great! Session complete',doneText:(n:number)=>`${n} cards reviewed. Come back tomorrow to keep your streak.`,
  doneStats:{again:'Again',hard:'Hard',easy:'Easy'},home:'Back to overview'}
};

const blank=():Store=>({v:1,cards:{},excluded:[],newDay:'',newCount:0,doneDay:'',doneCount:0,streakDay:'',streak:0});
function load():Store{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===1&&s.cards)return {...blank(),...s}}catch{}return blank()}
function save(s:Store){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}

const addDays=(day:string,n:number)=>{const [y,m,d]=day.split('-').map(Number);return localDay(new Date(y,m-1,d+n))};
const fmtDay=(day:string)=>{const [y,m,d]=day.split('-');return `${d}.${m}.${y}`};
/** Leitner step: Again resets to box 1 and repeats in this session; Hard keeps the box; Easy moves up one box (new cards start at box 2). */
function nextBox(prev:CardState|undefined,g:Grade){const b=prev?.box||0;return g==='again'?1:g==='hard'?Math.max(1,b):Math.min(5,Math.max(1,b)+1)}
const streakNow=(s:Store,today:string)=>s.streakDay===today||s.streakDay===addDays(today,-1)?s.streak:0;

function shuffle<T>(a:T[]){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}

function Ring({value,size=112,stroke=10,children}:{value:number;size?:number;stroke?:number;children?:ReactNode}){
 const r=(size-stroke)/2,c=2*Math.PI*r,v=Math.max(0,Math.min(1,value));
 return <div className="rv-ring" style={{width:size,height:size}}>
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
   <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rv-soft)" strokeWidth={stroke}/>
   <circle className="rv-ring-arc" cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rvGrad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-v)} transform={`rotate(-90 ${size/2} ${size/2})`}/>
   <defs><linearGradient id="rvGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1fb3ad"/><stop offset="1" stopColor="#168d8b"/></linearGradient></defs>
  </svg>
  <div className="rv-ring-in">{children}</div>
 </div>;
}

export default function Review({lang}:{lang:'uz'|'ru'|'en'}){
 const t=dict[lang];
 const l=lang as Lang;
 const [topics,setTopics]=useState<Topic[]|null>(null);
 const [decks,setDecks]=useState<Deck[]|null>(null);
 const [store,setStore]=useState<Store>(load);
 const [queue,setQueue]=useState<Card[]|null>(null);
 const [flipped,setFlipped]=useState(false);
 const [tally,setTally]=useState({again:0,hard:0,easy:0,done:0});
 const [finished,setFinished]=useState(false);
 const today=localDay();

 useEffect(()=>{let live=true;Promise.all(TOPICS.map(m=>loadTopic(m.id))).then(r=>{if(live)setTopics(r.filter((x):x is Topic=>!!x))});return ()=>{live=false}},[]);
 useEffect(()=>{let live=true;setDecks(null);fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(d=>{if(live)setDecks(Array.isArray(d)?d:[])}).catch(()=>{if(live)setDecks([])});return ()=>{live=false}},[lang]);
 useEffect(()=>save(store),[store]);

 const cards=useMemo<Card[]>(()=>{
  const out:Card[]=[];
  for(const tp of topics||[])tp.oral.forEach((o,k)=>out.push({id:`o:${tp.id}:${k}`,group:tp.subject,kind:'oral',source:tx(tp.title,l),front:tx(o.q,l),plan:o.plan.map(p=>tx(p,l))}));
  for(const d of decks||[])d.quiz.forEach((q,k)=>out.push({id:`d:${d.id}:${k}`,group:DECK_GROUP,kind:'quiz',source:d.title,front:q.q,answer:q.options[q.correct],why:q.explanation}));
  return out;
 },[topics,decks,l]);

 const groups=useMemo(()=>{
  const ids=[...SUBJECTS.map(s=>s.id),DECK_GROUP];
  return ids.map(id=>{
   const list=cards.filter(c=>c.group===id);
   const due=list.filter(c=>{const s=store.cards[c.id];return s&&s.due<=today}).length;
   const fresh=list.filter(c=>!store.cards[c.id]).length;
   const subj=SUBJECTS.find(s=>s.id===id);
   return {id,title:subj?tx(subj.title,l):t.decks,course:subj?.course,total:list.length,due,fresh};
  }).filter(g=>g.total>0);
 },[cards,store.cards,today,l,t.decks]);

 const newUsed=store.newDay===today?store.newCount:0;
 const newQuota=Math.max(0,NEW_PER_DAY-newUsed);
 const doneToday=store.doneDay===today?store.doneCount:0;
 const active=groups.filter(g=>!store.excluded.includes(g.id));
 const dueCount=active.reduce((a,g)=>a+g.due,0);
 const freshAvail=active.reduce((a,g)=>a+g.fresh,0);
 const freshToday=Math.min(newQuota,freshAvail);
 const planned=dueCount+freshToday;
 const streak=streakNow(store,today);
 const ready=topics!==null&&decks!==null;
 const nextDue=useMemo(()=>{const act=new Set(active.map(g=>g.id));let m='';for(const c of cards){const s=store.cards[c.id];if(s&&act.has(c.group)&&s.due>today&&(!m||s.due<m))m=s.due}return m},[cards,store.cards,active,today]);

 const toggle=(id:string)=>setStore(s=>({...s,excluded:s.excluded.includes(id)?s.excluded.filter(x=>x!==id):[...s.excluded,id]}));
 const setAll=(on:boolean)=>setStore(s=>({...s,excluded:on?[]:groups.map(g=>g.id)}));

 const start=()=>{
  const act=new Set(active.map(g=>g.id));
  const pool=cards.filter(c=>act.has(c.group));
  const due=pool.filter(c=>{const s=store.cards[c.id];return s&&s.due<=today}).sort((a,b)=>store.cards[a.id].due.localeCompare(store.cards[b.id].due));
  const fresh=shuffle(pool.filter(c=>!store.cards[c.id])).slice(0,newQuota);
  setQueue([...due,...fresh]);setFlipped(false);setTally({again:0,hard:0,easy:0,done:0});setFinished(false);
 };

 const grade=(g:Grade)=>{
  if(!queue||!queue.length)return;
  const card=queue[0];
  setStore(s=>{
   const prev=s.cards[card.id];
   const box=nextBox(prev,g);
   const next:Store={...s,cards:{...s.cards,[card.id]:{box,due:addDays(today,INTERVALS[box-1]),reps:(prev?.reps||0)+1,lapses:(prev?.lapses||0)+(g==='again'?1:0)}}};
   if(!prev){next.newCount=(s.newDay===today?s.newCount:0)+1;next.newDay=today}
   if(g!=='again'){next.doneCount=(s.doneDay===today?s.doneCount:0)+1;next.doneDay=today}
   if(s.streakDay!==today){next.streak=s.streakDay===addDays(today,-1)?s.streak+1:1;next.streakDay=today}
   return next;
  });
  setTally(x=>({...x,[g]:x[g]+1,done:x.done+(g==='again'?0:1)}));
  const rest=queue.slice(1);
  // "Again" puts the card back a few places later in this session until it is graded Hard or Easy.
  if(g==='again')rest.splice(Math.min(rest.length,3),0,card);
  setFlipped(false);
  if(rest.length)setQueue(rest);else{setQueue(null);setFinished(true)}
 };

 const hintFor=(g:Grade,card:Card)=>{if(g==='again')return t.soon;const b=nextBox(store.cards[card.id],g);return t.after(INTERVALS[b-1])};

 useEffect(()=>{
  if(!queue)return;
  const onKey=(e:KeyboardEvent)=>{
   if(e.key===' '||e.key==='Enter'){if(!flipped){e.preventDefault();setFlipped(true)}return}
   if(!flipped)return;
   if(e.key==='1')grade('again');else if(e.key==='2')grade('hard');else if(e.key==='3')grade('easy');
  };
  window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
 });

 if(queue&&queue.length){
  const card=queue[0];
  const total=tally.done+queue.length;
  const groupTitle=groups.find(g=>g.id===card.group)?.title||'';
  return <div className="rv-root rv-session">
   <div className="rv-topbar">
    <button className="rv-icon" data-back onClick={()=>{setQueue(null);setFinished(tally.done+tally.again>0)}} aria-label={t.stop}><ArrowLeft size={20}/></button>
    <div className="rv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={tally.done}><i style={{width:`${total?tally.done/total*100:0}%`}}/></div>
    <span className="rv-left">{t.left(queue.length)}</span>
   </div>
   <div className="rv-meta"><span className={'rv-chip '+card.kind}>{card.kind==='oral'?t.oral:t.quiz}</span><span className="rv-src">{groupTitle} · {card.source}</span></div>
   <div className={'rv-card'+(flipped?' flipped':'')} key={card.id+queue.length}>
    <div className="rv-card-inner" role="button" tabIndex={0} onClick={()=>setFlipped(f=>!f)} aria-label={flipped?undefined:t.show} aria-pressed={flipped}>
     <div className="rv-face rv-front" aria-hidden={flipped}>
      <BookOpen size={22} className="rv-face-icon"/>
      <p className="rv-q">{card.front}</p>
      <small className="rv-tap">{t.tap}</small>
     </div>
     <div className="rv-face rv-back" aria-hidden={!flipped}>
      <p className="rv-q small">{card.front}</p>
      {card.plan?<><h4>{t.plan}</h4><ol className="rv-plan">{card.plan.map((p,k)=><li key={k}>{p}</li>)}</ol></>
      :<><h4>{t.correct}</h4><p className="rv-answer"><Check size={18}/>{card.answer}</p>{card.why&&<><h4>{t.why}</h4><p className="rv-why">{card.why}</p></>}</>}
     </div>
    </div>
   </div>
   <div className="rv-actions">
    {!flipped?<button className="rv-primary" onClick={()=>setFlipped(true)}>{t.show}</button>
    :<><p className="rv-grade-label">{t.grade}</p><div className="rv-grades">
     {(['again','hard','easy'] as Grade[]).map(g=><button key={g} className={'rv-grade '+g} onClick={()=>grade(g)}><strong>{t[g]}</strong><small>{hintFor(g,card)}</small></button>)}
    </div></>}
   </div>
  </div>;
 }

 if(finished){
  const n=tally.done;
  return <div className="rv-root">
   <div className="rv-done">
    <div className="rv-done-badge"><Sparkles size={34}/></div>
    <h2>{t.doneTitle}</h2>
    <p>{t.doneText(n)}</p>
    <div className="rv-done-stats">
     <div className="again"><b>{tally.again}</b><span>{t.doneStats.again}</span></div>
     <div className="hard"><b>{tally.hard}</b><span>{t.doneStats.hard}</span></div>
     <div className="easy"><b>{tally.easy}</b><span>{t.doneStats.easy}</span></div>
    </div>
    <div className="rv-streak-big"><Flame size={20}/>{t.streak}: {t.days(streak)}</div>
    <button className="rv-primary" onClick={()=>setFinished(false)}>{t.home}</button>
   </div>
  </div>;
 }

 return <div className="rv-root">
  <header className="rv-head"><h2>{t.title}</h2><p>{t.sub}</p></header>
  {!ready?<div className="rv-loading" role="status"><span className="rv-spin"/>{t.loading}</div>:<>
   <section className="rv-hero">
    <Ring value={planned+doneToday?doneToday/(planned+doneToday):1} size={96} stroke={9}>
     <b>{doneToday}</b><small>/ {planned+doneToday}</small>
    </Ring>
    <div className="rv-hero-text">
     <span className="rv-eyebrow">{t.today}</span>
     <strong>{t.todayOf(doneToday,planned+doneToday)}</strong>
     <small className="rv-hero-sub">{t.limit}</small>
    </div>
     <div className="rv-stats">
      <div><RotateCcw size={16}/><b>{dueCount}</b><span>{t.due}</span></div>
      <div><Layers size={16}/><b>{freshToday}</b><span>{t.fresh}</span></div>
      <div className="rv-flame"><Flame size={16}/><b>{t.days(streak)}</b><span>{t.streak}</span></div>
     </div>
   </section>

   {planned>0&&active.length>0?<button className="rv-primary rv-start" onClick={start}>{t.start(planned)}<ChevronRight size={18}/></button>
   :<div className="rv-empty">
    <div className="rv-empty-art"><Check size={30}/></div>
    <strong>{active.length?(groups.length?t.emptyTitle:t.emptyNone):t.pick}</strong>
    {active.length>0&&<p>{nextDue?t.emptyNext(fmtDay(nextDue)):''} {freshAvail>0&&newQuota===0?t.emptyNew:''}</p>}
   </div>}

   <section className="rv-subjects">
    <div className="rv-subjects-head"><h3>{t.subjects}</h3>
     <button onClick={()=>setAll(active.length<groups.length)}>{active.length<groups.length?t.all:t.none}</button></div>
    {groups.length===0&&<p className="rv-muted">{t.emptyNone}</p>}
    <ul>{groups.map(g=>{const on=!store.excluded.includes(g.id);return <li key={g.id}>
     <button className={'rv-subject'+(on?' on':'')} role="checkbox" aria-checked={on} onClick={()=>toggle(g.id)}>
      <span className="rv-check">{on&&<Check size={14}/>}</span>
      <span className="rv-subject-text"><strong>{g.title}</strong><small>{t.cards(g.total)}{g.fresh?` · ${t.newBadge(g.fresh)}`:''}</small></span>
      <span className={'rv-count'+(g.due?' hot':'')} aria-label={t.dueBadge(g.due)}>{g.due}</span>
     </button></li>})}</ul>
    <p className="rv-note">{t.schedule}</p>
   </section>
  </>}
 </div>;
}
