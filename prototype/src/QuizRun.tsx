import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Check,Sparkles,X} from 'lucide-react';
import './quiz.css';
import type {Lang} from './discoveryData';

export type RunQ={q:string;options:string[];correct:number;explanation:string;media?:ReactNode};
const words={
 uz:{next:'Keyingi',finish:'Yakunlash',score:'Natija',close:'Yopish',of:'savol',q:'Savol',right:'To‘g‘ri!',wrong:'Noto‘g‘ri',saved:'Javob qabul qilindi',great:'A’lo natija!',good:'Yaxshi natija',more:'Yana bir oz mashq qiling',correct:'to‘g‘ri javob'},
 ru:{next:'Далее',finish:'Завершить',score:'Результат',close:'Закрыть',of:'вопрос',q:'Вопрос',right:'Верно!',wrong:'Неверно',saved:'Ответ принят',great:'Отличный результат!',good:'Хороший результат',more:'Стоит ещё потренироваться',correct:'верных ответов'},
 en:{next:'Next',finish:'Finish',score:'Score',close:'Close',of:'question',q:'Question',right:'Correct!',wrong:'Not quite',saved:'Answer saved',great:'Excellent!',good:'Good result',more:'A little more practice',correct:'correct'}
};

/** One-question-at-a-time quiz sheet. Calls onDone(score,total) once, when the learner finishes the last question. */
/** `deadline` (epoch ms) adds a countdown and finishes the run automatically, unanswered questions as -1; `result` replaces the local score screen (server-scored tests). */
export default function QuizRun({title,questions,lang,reveal=true,deadline,result,onDone,onClose}:{title:string;questions:RunQ[];lang:Lang;reveal?:boolean;deadline?:number;result?:ReactNode;onDone?:(score:number,total:number,answers:number[])=>void;onClose:()=>void}){
 const t=words[lang];
 const [i,setI]=useState(0);
 const [picked,setPicked]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [finished,setFinished]=useState(false);
 const [given,setGiven]=useState<number[]>([]);
 // Options are shown in a random order per attempt; answers are reported by their original index.
 const perms=useMemo(()=>questions.map(q=>{const a=q.options.map((_,k)=>k);for(let j=a.length-1;j>0;j--){const r=Math.floor(Math.random()*(j+1));[a[j],a[r]]=[a[r],a[j]]}return a}),[questions]);
 const [now,setNow]=useState(()=>Date.now());
 const doneRef=useRef(false);
 const finish=(answers:number[])=>{if(doneRef.current)return;doneRef.current=true;setFinished(true);onDone?.(score,questions.length,answers)};
 useEffect(()=>{if(!deadline||finished)return;const id=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(id)},[deadline,finished]);
 useEffect(()=>{if(deadline&&!finished&&now>=deadline)finish([...given,...Array(questions.length-given.length).fill(-1)])});
 const left=deadline?Math.max(0,Math.ceil((deadline-now)/1000)):0;
 const q=questions[i];
 const perm=perms[i];
 const answer=(pos:number)=>{if(picked!==null)return;const o=perm[pos];setPicked(o);setGiven(g=>[...g,o]);if(o===q.correct)setScore(s=>s+1)};
 const next=()=>{
  if(i+1<questions.length){setI(i+1);setPicked(null);return}
  finish(given);
 };
 const pct=questions.length?Math.round(score/questions.length*100):0;
 const ok=picked!==null&&picked===q?.correct;
 return <div className="quiz-run" role="dialog" aria-modal="true" aria-label={title}>
  <div className="quiz-run-bar"><strong>{title}</strong><span className="qr-count">{finished?t.score:`${i+1} / ${questions.length}`}{deadline&&!finished?<em className={'quiz-run-timer'+(left<60?' low':'')}> · {Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</em>:null}</span><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  {finished?<div className="quiz-run-body quiz-run-result">{result??<>
    <div className="qr-ring" style={{['--p' as string]:pct}}><div><b>{score} / {questions.length}</b><small>{pct}%</small></div></div>
    <h3 className="qr-verdict"><Sparkles size={18}/>{pct>=80?t.great:pct>=60?t.good:t.more}</h3><p>{score} {t.correct}</p></>}
   <button className="button" onClick={onClose}>{t.close}</button></div>
  :<div className="quiz-run-body">
   <div className="quiz-run-progress qr-steps" aria-hidden>{questions.map((_,k)=><i key={k} className={k<i||(k===i&&picked!==null)?'done':k===i?'now':''}/>)}</div>
   <div className="qr-card">
    <span className="qr-eyebrow">{t.q} {i+1} / {questions.length}</span>
    {q.media}
    {q.q&&<h3>{q.q}</h3>}
   </div>
   <div className="quiz-run-options">{perm.map((oi,pos)=>{const o=q.options[oi];
    const done=picked!==null;
    const shown=done&&reveal;
    return <button key={oi} disabled={done} aria-pressed={done&&oi===picked} className={shown?(oi===q.correct?'right':oi===picked?'wrong':''):(done&&oi===picked?'chosen':'')} onClick={()=>answer(pos)}><i className="qr-letter" aria-hidden>{String.fromCharCode(65+pos)}</i><span className="qr-text">{o}</span>{shown&&oi===q.correct&&<Check size={18} aria-label="✓"/>}{shown&&oi===picked&&oi!==q.correct&&<X size={18} aria-label="✗"/>}{!shown&&done&&oi===picked&&<Check size={18}/>}</button>;
   })}</div>
   {picked!==null&&<>{reveal?<div className={'quiz-run-why '+(ok?'ok':'bad')} role="status"><b>{ok?t.right:t.wrong}</b>{q.explanation&&<span>{q.explanation}</span>}</div>:<div className="quiz-run-why saved" role="status"><b>{t.saved}</b></div>}<button className="button" onClick={next}>{i+1<questions.length?t.next:t.finish}</button></>}
  </div>}
 </div>;
}
