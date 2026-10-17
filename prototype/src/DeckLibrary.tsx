import {useCallback,useEffect,useRef,useState} from 'react';
import {Check,ChevronLeft,ChevronRight,ClipboardCheck,Maximize,Presentation,X} from 'lucide-react';
import type {Lang} from './discoveryData';

type Quiz={q:string;options:string[];correct:number;explanation:string};
type Deck={id:string;title:string;subtitle:string;audience:string;slides:number;quiz:Quiz[]};

const words={
 uz:{title:'Taqdimotlar',hint:'Faqat ekranda ko‘rish va ulashish uchun. Yuklab olish yo‘q.',slides:'slayd',present:'Butun ekran',close:'Yopish',prev:'Oldingi',next:'Keyingi',quiz:'Testga o‘tish',back:'Slaydlarga qaytish',result:'Natija',again:'Qayta urinish',note:'Matn faqat o‘zbek tilida. O‘quv namuna: mutaxassis tasdig‘idan o‘tmagan, klinik ko‘rsatma emas.',loading:'Yuklanmoqda…',none:'Taqdimotlar hozir mavjud emas.'},
 ru:{title:'Презентации',hint:'Только для показа на экране. Скачивание отключено.',slides:'слайдов',present:'Во весь экран',close:'Закрыть',prev:'Назад',next:'Далее',quiz:'К тесту',back:'Назад к слайдам',result:'Результат',again:'Ещё раз',note:'Текст только на узбекском. Учебный образец: не проверен специалистом, не клиническое руководство.',loading:'Загрузка…',none:'Презентации пока недоступны.'},
 en:{title:'Presentations',hint:'View and share on screen only. Downloads are disabled.',slides:'slides',present:'Full screen',close:'Close',prev:'Previous',next:'Next',quiz:'Take the quiz',back:'Back to slides',result:'Score',again:'Try again',note:'Text is in Uzbek only. Learning sample: not reviewed by a specialist and not clinical guidance.',loading:'Loading…',none:'Presentations are not available right now.'}
};

const slideUrl=(deck:string,n:number)=>`/decks/${deck}/${String(n).padStart(2,'0')}.webp`;

function Viewer({deck,lang,onClose}:{deck:Deck;lang:Lang;onClose:()=>void}){
 const t=words[lang];
 const [n,setN]=useState(1);
 const [mode,setMode]=useState<'slides'|'quiz'>('slides');
 const [answers,setAnswers]=useState<(number|null)[]>(()=>deck.quiz.map(()=>null));
 const root=useRef<HTMLDivElement>(null);
 const touch=useRef<number|null>(null);
 const go=useCallback((d:number)=>setN(x=>Math.min(deck.slides,Math.max(1,x+d))),[deck.slides]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key===' ')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Escape')onClose()};
  window.addEventListener('keydown',key);
  const prevOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=prevOverflow};
 },[go,onClose]);
 const present=()=>{const el=root.current as (HTMLElement&{webkitRequestFullscreen?:()=>void})|null;if(!el)return;try{(el.requestFullscreen?.()||el.webkitRequestFullscreen?.())}catch{/* fullscreen unavailable */}};
 // Copy/save affordances are removed; screenshots of a displayed screen cannot be prevented.
 const block=(e:{preventDefault:()=>void})=>e.preventDefault();
 const score=answers.filter((a,i)=>a===deck.quiz[i].correct).length;
 return <div className="deck-viewer" ref={root} role="dialog" aria-label={deck.title} onContextMenu={block} onCopy={block} onCut={block} onDragStart={block}>
  <div className="deck-bar">
   <strong>{deck.title}</strong>
   <span>{mode==='slides'?`${n} / ${deck.slides}`:t.result}</span>
   <button onClick={present} aria-label={t.present}><Maximize size={18}/></button>
   <button onClick={onClose} aria-label={t.close}><X size={20}/></button>
  </div>
  {mode==='slides'?<>
   <div className="deck-stage" onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(dx)>40)go(dx<0?1:-1)}}>
    <img src={slideUrl(deck.id,n)} alt={`${deck.title} ${n}`} draggable={false}/>
    <div className="deck-shield"/>
   </div>
   <div className="deck-controls">
    <button onClick={()=>go(-1)} disabled={n===1} aria-label={t.prev}><ChevronLeft size={22}/></button>
    <div className="deck-dots" aria-hidden="true">{Array.from({length:deck.slides},(_,i)=><i key={i} className={i+1===n?'on':''}/>)}</div>
    {n<deck.slides?<button onClick={()=>go(1)} aria-label={t.next}><ChevronRight size={22}/></button>
    :<button className="deck-quiz-btn" onClick={()=>setMode('quiz')}><ClipboardCheck size={18}/>{t.quiz}</button>}
   </div>
  </>:<div className="deck-quiz">
   {deck.quiz.map((q,qi)=><div className="deck-q" key={qi}>
    <strong>{qi+1}. {q.q}</strong>
    <div>{q.options.map((o,oi)=>{const picked=answers[qi]===oi;const done=answers[qi]!==null;return <button key={oi} disabled={done} className={done?(oi===q.correct?'right':picked?'wrong':''):''} onClick={()=>setAnswers(a=>a.map((x,i)=>i===qi?oi:x))}>{o}{done&&oi===q.correct&&<Check size={15}/>}</button>})}</div>
    {answers[qi]!==null&&<small>{q.explanation}</small>}
   </div>)}
   {answers.every(a=>a!==null)&&<p className="deck-score" role="status">{t.result}: {score} / {deck.quiz.length}</p>}
   <div className="deck-quiz-actions">
    <button onClick={()=>{setMode('slides');setN(1)}}>{t.back}</button>
    <button onClick={()=>setAnswers(deck.quiz.map(()=>null))}>{t.again}</button>
   </div>
  </div>}
 </div>;
}

export default function DeckLibrary({lang}:{lang:Lang}){
 const t=words[lang];
 const [decks,setDecks]=useState<Deck[]|null>(null);
 const [failed,setFailed]=useState(false);
 const [open,setOpen]=useState<Deck|null>(null);
 useEffect(()=>{
  const c=new AbortController();
  fetch('/decks/manifest.json',{signal:c.signal}).then(r=>r.ok&&(r.headers.get('content-type')||'').includes('json')?r.json():Promise.reject()).then(d=>{if(!c.signal.aborted)setDecks(d)}).catch(()=>{if(!c.signal.aborted)setFailed(true)});
  return()=>c.abort();
 },[]);
 if(failed)return null;
 return <section className="deck-library" aria-label={t.title}>
  <div className="deck-heading"><Presentation size={20}/><div><h2>{t.title}</h2><p>{t.hint}</p></div></div>
  {!decks?<p className="muted">{t.loading}</p>:decks.length===0?<p className="muted">{t.none}</p>:<div className="deck-grid">
   {decks.map(d=><button key={d.id} className="deck-card" onClick={()=>setOpen(d)}>
    <img src={slideUrl(d.id,1)} alt="" draggable={false} loading="lazy"/>
    <span><strong>{d.title}</strong><small>{d.slides} {t.slides} · {d.audience}</small></span>
   </button>)}
  </div>}
  <p className="muted deck-note">{t.note}</p>
  {open&&<Viewer deck={open} lang={lang} onClose={()=>setOpen(null)}/>}
 </section>;
}
