import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Check,ChevronLeft,Sparkles,X} from 'lucide-react';
import './quiz.css';
import type {Lang} from './discoveryData';

export type RunQ={q:string;options:string[];correct:number;explanation:string;media?:ReactNode};
const words={
 uz:{next:'Keyingi',back:'Orqaga',finish:'Yakunlash',score:'Natija',close:'Yopish',of:'savol',q:'Savol',right:'To‘g‘ri!',wrong:'Noto‘g‘ri',saved:'Javob qabul qilindi',change:'Xohlasangiz, boshqa variantni tanlang',great:'A’lo natija!',good:'Yaxshi natija',more:'Yana bir oz mashq qiling',correct:'to‘g‘ri javob',leaveQ:'Testdan chiqasizmi?',leaveT:'Javoblaringiz saqlanmaydi.',stay:'Qolish',leave:'Chiqish'},
 ru:{next:'Далее',back:'Назад',finish:'Завершить',score:'Результат',close:'Закрыть',of:'вопрос',q:'Вопрос',right:'Верно!',wrong:'Неверно',saved:'Ответ принят',change:'Можно выбрать другой вариант',great:'Отличный результат!',good:'Хороший результат',more:'Стоит ещё потренироваться',correct:'верных ответов',leaveQ:'Выйти из теста?',leaveT:'Ваши ответы не сохранятся.',stay:'Остаться',leave:'Выйти'},
 en:{next:'Next',back:'Back',finish:'Finish',score:'Score',close:'Close',of:'question',q:'Question',right:'Correct!',wrong:'Not quite',saved:'Answer saved',change:'You can still pick another option',great:'Excellent!',good:'Good result',more:'A little more practice',correct:'correct',leaveQ:'Leave the test?',leaveT:'Your answers won’t be saved.',stay:'Stay',leave:'Leave'}
};

/** One-question-at-a-time quiz sheet. Calls onDone(score,total) once, when the learner finishes the last question. */
/** `deadline` (epoch ms) adds a countdown and finishes the run automatically, unanswered questions as -1; `result` replaces the local score screen (server-scored tests).
 *  With `clockFrom` (seconds) the countdown only appears once that little time is left; until then `dueLabel` (e.g. "Muddat: 20-okt, 18:00") is shown. */
/** Resumable server tests: `initial` (saved answers, original option indices) starts at the first unanswered question, `onAnswer` gets every change,
 *  `canBack` adds Back and lets the student change an answer (only without `reveal`); `finishLabel`/`leaveText`/`doneLabel` reword the last button, the leave sheet and the result button. */
export default function QuizRun({title,questions,lang,reveal=true,deadline,clockFrom,dueLabel,result,note,initial,onAnswer,canBack=false,finishLabel,leaveText,doneLabel,onDone,onClose}:{title:string;questions:RunQ[];lang:Lang;reveal?:boolean;deadline?:number;clockFrom?:number;dueLabel?:string;result?:ReactNode;note?:ReactNode;
 initial?:(number|null)[];onAnswer?:(answers:(number|null)[])=>void;canBack?:boolean;finishLabel?:string;leaveText?:string;doneLabel?:string;onDone?:(score:number,total:number,answers:number[])=>void;onClose:()=>void}){
 const t=words[lang];
 const nav=canBack&&!reveal;
 const [given,setGiven]=useState<(number|null)[]>(()=>questions.map((_,k)=>{const v=initial?.[k];return typeof v==='number'&&v>=0?v:null}));
 const [i,setI]=useState(()=>{const k=given.findIndex(x=>x===null);return k<0?Math.max(0,questions.length-1):k});
 const [finished,setFinished]=useState(false);
 // Options are shown in a random order per attempt; answers are reported by their original index.
 const perms=useMemo(()=>questions.map(q=>{const a=q.options.map((_,k)=>k);for(let j=a.length-1;j>0;j--){const r=Math.floor(Math.random()*(j+1));[a[j],a[r]]=[a[r],a[j]]}return a}),[questions]);
 const [now,setNow]=useState(()=>Date.now());
 const doneRef=useRef(false);
 const [ask,setAsk]=useState(false);
 const nextRef=useRef<HTMLButtonElement>(null);
 const picked=given[i]??null;
 const score=given.filter((g,k)=>g!==null&&g===questions[k]?.correct).length;
 // The bar's X is also what the global swipe-back clicks: an unfinished run with answers asks first; a second press/swipe dismisses the sheet.
 const tryClose=()=>{if(ask){setAsk(false);return}if(!finished&&given.some(x=>x!==null))setAsk(true);else onClose()};
 useEffect(()=>{if(picked!==null&&!nav)nextRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[picked,nav]);
 const finish=(answers:number[])=>{if(doneRef.current)return;doneRef.current=true;setFinished(true);onDone?.(answers.filter((a,k)=>a===questions[k]?.correct).length,questions.length,answers)};
 const full=()=>given.map(x=>x??-1);
 useEffect(()=>{if(!deadline||finished)return;const id=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(id)},[deadline,finished]);
 useEffect(()=>{if(deadline&&!finished&&now>=deadline)finish(full())});
 const left=deadline?Math.max(0,Math.ceil((deadline-now)/1000)):0;
 const q=questions[i];
 const perm=perms[i];
 const answer=(pos:number)=>{if(picked!==null&&!nav)return;const o=perm[pos];if(o===picked)return;const g=given.map((x,k)=>k===i?o:x);setGiven(g);onAnswer?.(g)};
 const next=()=>{
  if(i+1<questions.length){setI(i+1);return}
  finish(full());
 };
 const pct=questions.length?Math.round(score/questions.length*100):0;
 const ok=picked!==null&&picked===q?.correct;
 const answered=given.filter(x=>x!==null).length;
 return <div className="quiz-run" role="dialog" aria-modal="true" aria-label={title}>
  <div className="quiz-run-bar"><strong>{title}</strong><span className="qr-count">{finished?t.score:`${i+1} / ${questions.length}`}{deadline&&!finished?(clockFrom===undefined||left<=clockFrom?<em className={'quiz-run-timer'+(left<60?' low':'')}> · {Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</em>:dueLabel?<em className="quiz-run-due"> · {dueLabel}</em>:null):null}</span><button data-close onClick={tryClose} aria-label={t.close}><X size={20}/></button></div>
  {note&&<p className="qr-note">{note}</p>}
  {finished?<div className="quiz-run-body quiz-run-result">{result??<>
    <div className="qr-ring" style={{['--p' as string]:pct}}><div><b>{score} / {questions.length}</b><small>{pct}%</small></div></div>
    <h3 className="qr-verdict"><Sparkles size={18}/>{pct>=80?t.great:pct>=60?t.good:t.more}</h3><p>{score} {t.correct}</p></>}
   <button className="button" onClick={onClose}>{doneLabel||t.close}</button></div>
  :<div className="quiz-run-body">
   <div className="quiz-run-progress qr-steps" {...(nav?{role:'progressbar','aria-valuemin':0,'aria-valuemax':questions.length,'aria-valuenow':answered}:{'aria-hidden':true})}>{questions.map((_,k)=><i key={k} className={(nav?given[k]!==null:k<i||(k===i&&picked!==null))?'done':k===i?'now':''}/>)}</div>
   <div className="qr-card">
    <span className="qr-eyebrow">{t.q} {i+1} / {questions.length}</span>
    {q.media}
    {q.q&&<h3>{q.q}</h3>}
   </div>
   <div className="quiz-run-options">{perm.map((oi,pos)=>{const o=q.options[oi];
    const done=picked!==null;
    const shown=done&&reveal;
    return <button key={oi} disabled={done&&!nav} aria-pressed={done&&oi===picked} className={shown?(oi===q.correct?'right':oi===picked?'wrong':''):(done&&oi===picked?'chosen':'')} onClick={()=>answer(pos)}><i className="qr-letter" aria-hidden>{String.fromCharCode(65+pos)}</i><span className="qr-text">{o}</span>{shown&&oi===q.correct&&<Check size={18} aria-label="✓"/>}{shown&&oi===picked&&oi!==q.correct&&<X size={18} aria-label="✗"/>}{!shown&&done&&oi===picked&&<Check size={18}/>}</button>;
   })}</div>
   {nav?<>{picked!==null&&<div className="quiz-run-why saved" role="status"><b>{t.saved}</b><span>{t.change}</span></div>}
    <div className="qr-nav">{i>0&&<button className="button secondary" onClick={()=>setI(i-1)}><ChevronLeft size={18}/>{t.back}</button>}<button ref={nextRef} className="button" disabled={picked===null} onClick={next}>{i+1<questions.length?t.next:finishLabel||t.finish}</button></div></>
   :picked!==null&&<>{reveal?<div className={'quiz-run-why '+(ok?'ok':'bad')} role="status"><b>{ok?t.right:t.wrong}</b>{q.explanation&&<span>{q.explanation}</span>}</div>:<div className="quiz-run-why saved" role="status"><b>{t.saved}</b></div>}<button ref={nextRef} className="button" onClick={next}>{i+1<questions.length?t.next:finishLabel||t.finish}</button></>}
  </div>}
  {ask&&!finished&&<div className="qr-confirm" onClick={()=>setAsk(false)}><div className="qr-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="qr-confirm-t" aria-describedby="qr-confirm-d" onClick={e=>e.stopPropagation()}>
   <h3 id="qr-confirm-t">{t.leaveQ}</h3><p id="qr-confirm-d">{leaveText||t.leaveT}</p>
   <div className="qr-confirm-actions"><button className="button" autoFocus onClick={()=>setAsk(false)}>{t.stay}</button><button className="qr-leave" onClick={()=>{setAsk(false);onClose()}}>{t.leave}</button></div>
  </div></div>}
 </div>;
}
