import {useState,type ReactNode} from 'react';
import {Check,X} from 'lucide-react';
import type {Lang} from './discoveryData';

export type RunQ={q:string;options:string[];correct:number;explanation:string;media?:ReactNode};
const words={
 uz:{next:'Keyingi',finish:'Yakunlash',score:'Natija',close:'Yopish',of:'savol'},
 ru:{next:'Далее',finish:'Завершить',score:'Результат',close:'Закрыть',of:'вопрос'},
 en:{next:'Next',finish:'Finish',score:'Score',close:'Close',of:'question'}
};

/** One-question-at-a-time quiz sheet. Calls onDone(score,total) once, when the learner finishes the last question. */
export default function QuizRun({title,questions,lang,onDone,onClose}:{title:string;questions:RunQ[];lang:Lang;onDone?:(score:number,total:number,answers:number[])=>void;onClose:()=>void}){
 const t=words[lang];
 const [i,setI]=useState(0);
 const [picked,setPicked]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [finished,setFinished]=useState(false);
 const [given,setGiven]=useState<number[]>([]);
 const q=questions[i];
 const answer=(o:number)=>{if(picked!==null)return;setPicked(o);setGiven(g=>[...g,o]);if(o===q.correct)setScore(s=>s+1)};
 const next=()=>{
  if(i+1<questions.length){setI(i+1);setPicked(null);return}
  setFinished(true);onDone?.(score,questions.length,given);
 };
 return <div className="quiz-run" role="dialog" aria-label={title}>
  <div className="quiz-run-bar"><strong>{title}</strong><span>{finished?t.score:`${i+1} / ${questions.length}`}</span><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  {finished?<div className="quiz-run-body quiz-run-result"><b>{score} / {questions.length}</b><p>{t.score}</p><button className="button" onClick={onClose}>{t.close}</button></div>
  :<div className="quiz-run-body">
   <div className="quiz-run-progress"><i style={{width:`${((i+(picked!==null?1:0))/questions.length)*100}%`}}/></div>
   {q.media}
   {q.q&&<h3>{q.q}</h3>}
   <div className="quiz-run-options">{q.options.map((o,oi)=>{
    const done=picked!==null;
    return <button key={oi} disabled={done} className={done?(oi===q.correct?'right':oi===picked?'wrong':''):''} onClick={()=>answer(oi)}>{o}{done&&oi===q.correct&&<Check size={16}/>}</button>;
   })}</div>
   {picked!==null&&<><p className="quiz-run-why" role="status">{q.explanation}</p><button className="button" onClick={next}>{i+1<questions.length?t.next:t.finish}</button></>}
  </div>}
 </div>;
}
