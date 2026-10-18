import {useEffect,useMemo,useRef,useState} from 'react';
import {RotateCw,Sparkles,X} from 'lucide-react';
import {callApi} from './api';
import QuizRun,{type RunQ} from './QuizRun';
import {loadTopic,topicMeta,tx,type L,type Topic} from './curriculumData';
import type {Lang} from './discoveryData';

/** One server-scored class test (topic test or deck quiz) for a student: start or resume, save answers as they go, submit, score and review. */
export type TestReviewData={answers:number[]|null;correct:number[];explain:(L|null)[]|null};
export type TestMeta={id:string;title:string;status:'open'|'closed';topicId?:string;questions?:number[];deckId?:string|null;minutes?:number;reveal?:'instant'|'closed';
 mine:{answer:string|null;score:number|null;total:number|null;startedAt?:string|null;review?:TestReviewData}|null};
export type TestItem={q:string;options:string[];explanation?:string};
type DeckQ={q:string;options:string[];correct:number;explanation:string};
type StartRes={total:number;minutes:number|null;resumed?:boolean;startedAt?:string;progress?:(number|null)[]|null};

export const testWords={
 uz:{great:'A’lo natija!',good:'Yaxshi natija',more:'Mavzuni yana takrorlang',scoreLine:(s:number,n:number)=>`${n} ta savoldan ${s} tasiga to‘g‘ri javob berdingiz`,reviewLater:'To‘g‘ri javoblar ustoz testni yakunlagach ko‘rinadi.',review:'Javoblar tahlili',
  yourAns:'Sizning javobingiz',right:'To‘g‘ri javob',noAnswer:'Javob berilmagan',submit:'Topshirish',resume:'Davom ettirish',leave:'Javoblaringiz saqlanadi, keyin davom ettirasiz.',sending:'Javoblar yuborilmoqda…',retry:'Qayta yuborish',loading:'Test yuklanmoqda…',close:'Yopish',
  err:{closed:'Test yopilgan — ustoz uni yakunlagan.',already_submitted:'Siz bu testni allaqachon topshirgansiz.',already_submitted_or_not_started:'Siz bu testni allaqachon topshirgansiz.',time_up:'Bu test uchun ajratilgan vaqt tugagan.',past_due:'Topshirish muddati o‘tgan.',forbidden:'Bu test sizning guruhingizga tegishli emas.',load:'Test savollarini yuklab bo‘lmadi.',network:'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.',other:'Bajarilmadi. Qayta urinib ko‘ring.'}},
 ru:{great:'Отличный результат!',good:'Хороший результат',more:'Стоит повторить тему',scoreLine:(s:number,n:number)=>`Верных ответов: ${s} из ${n}`,reviewLater:'Верные ответы появятся после того, как преподаватель завершит тест.',review:'Разбор ответов',
  yourAns:'Ваш ответ',right:'Верный ответ',noAnswer:'Нет ответа',submit:'Сдать тест',resume:'Продолжить',leave:'Ваши ответы сохранятся — вы сможете продолжить.',sending:'Отправляем ответы…',retry:'Отправить снова',loading:'Загружаем тест…',close:'Закрыть',
  err:{closed:'Тест закрыт — преподаватель его завершил.',already_submitted:'Вы уже сдали этот тест.',already_submitted_or_not_started:'Вы уже сдали этот тест.',time_up:'Время на этот тест истекло.',past_due:'Срок сдачи истёк.',forbidden:'Этот тест не относится к вашей группе.',load:'Не удалось загрузить вопросы теста.',network:'Нет подключения к интернету. Проверьте связь и попробуйте снова.',other:'Не получилось. Попробуйте ещё раз.'}},
 en:{great:'Excellent!',good:'Good result',more:'Worth revising this topic',scoreLine:(s:number,n:number)=>`You answered ${s} of ${n} correctly`,reviewLater:'The right answers appear once your teacher finishes the test.',review:'Answer review',
  yourAns:'Your answer',right:'Right answer',noAnswer:'No answer',submit:'Submit',resume:'Continue',leave:'Your answers are saved — you can continue later.',sending:'Sending your answers…',retry:'Send again',loading:'Loading the test…',close:'Close',
  err:{closed:'The test is closed — your teacher has finished it.',already_submitted:'You have already submitted this test.',already_submitted_or_not_started:'You have already submitted this test.',time_up:'The time for this test is over.',past_due:'The due date has passed.',forbidden:'This test is not in your group.',load:'Could not load the test questions.',network:'No internet connection. Check it and try again.',other:'That did not work. Please try again.'}}
};
export const testError=(lang:Lang,code:string)=>{const e=testWords[lang].err;return code in e?e[code as keyof typeof e]:e.other};

const decks=new Map<string,Promise<{id:string;quiz:DeckQ[]}[]>>();
const loadDecks=(lang:Lang)=>{if(!decks.has(lang))decks.set(lang,fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).catch(()=>{decks.delete(lang);return []}));return decks.get(lang)!};
export const topicItems=(topic:Topic,idx:number[],lang:Lang):TestItem[]=>idx.map(i=>topic.test[i]).filter(Boolean).map(q=>({q:tx(q.q,lang),options:q.options.map(o=>tx(o,lang))}));
/** The questions of a class test, in the order the server scores them: a topic test's chosen questions, or a deck quiz's first `total`. */
export async function loadTestItems(a:Pick<TestMeta,'topicId'|'questions'|'deckId'>,lang:Lang):Promise<TestItem[]|null>{
 if(a.topicId){const t=await loadTopic(a.topicId);return t&&a.questions?topicItems(t,a.questions,lang):null}
 const d=(await loadDecks(lang)).find(x=>x.id===a.deckId);
 return d?d.quiz.map(q=>({q:q.q,options:q.options,explanation:q.explanation})):null;
}
/** SQLite datetime('now') is UTC without a zone. */
const utc=(s:string)=>Date.parse(s.replace(' ','T')+(/[zZ]|[+-]\d\d:?\d\d$/.test(s)?'':'Z'));
const local=(id:string)=>`de_prog:${id}`;
const readLocal=(id:string):(number|null)[]|null=>{try{const v=JSON.parse(localStorage.getItem(local(id))||'null');return Array.isArray(v)?v:null}catch{return null}};
const writeLocal=(id:string,v:(number|null)[]|null)=>{try{if(v)localStorage.setItem(local(id),JSON.stringify(v));else localStorage.removeItem(local(id))}catch{/* storage unavailable */}};

/** A topic test is named after its topic in the reader's language; a deck quiz keeps the teacher's title. */
export const testTitle=(a:Pick<TestMeta,'topicId'|'title'>,lang:Lang)=>(a.topicId&&tx(topicMeta(a.topicId)?.title,lang))||a.title;

/** Server-scored result: ring, verdict, one plain sentence (matches QuizRun's own result screen). */
export function ScoreCard({lang,score,total,note}:{lang:Lang;score:number;total:number;note?:string}){
 const t=testWords[lang];
 const pct=total?Math.round(score/total*100):0;
 return <><div className="qr-ring" style={{['--p' as string]:pct}}><div><b>{score} / {total}</b><small>{pct}%</small></div></div>
  <h3 className="qr-verdict"><Sparkles size={18}/>{pct>=80?t.great:pct>=60?t.good:t.more}</h3><p>{t.scoreLine(score,total)}</p>{note&&<p className="lg-small">{note}</p>}</>;
}

/** Per question: the student's answer (when wrong), the right one and the explanation. */
export function TestReview({lang,items,review}:{lang:Lang;items:TestItem[];review:TestReviewData}){
 const t=testWords[lang];
 return <ol className="lg-review">{items.map((q,k)=>{if(review.correct[k]===undefined)return null;const mine=review.answers?.[k];const ok=mine===review.correct[k];const why=review.explain?.[k]?tx(review.explain[k]!,lang):q.explanation;
  return <li key={k} className={ok?'ok':'bad'}><b>{q.q}</b>
   {!ok&&<small>{t.yourAns}: {mine!==undefined&&mine!==null&&mine>=0?q.options[mine]:t.noAnswer}</small>}
   <small className="right">{t.right}: {q.options[review.correct[k]]}</small>
   {why&&<p>{why}</p>}</li>})}</ol>;
}

/** Full-screen run of one class test. Starts (or resumes) it on mount; onError(code) when it cannot be taken (closed, already_submitted, time_up, forbidden, network, load).
 *  The X asks first (answers are kept on the server); after submitting, the result button calls onExit. */
export function TestRun({lang,a,exitLabel,onExit,onError,onSubmitted}:{lang:Lang;a:TestMeta;exitLabel?:string;onExit:()=>void;onError:(code:string)=>void;onSubmitted?:(score:number,total:number,review?:TestReviewData)=>void}){
 const t=testWords[lang];
 const [items,setItems]=useState<TestItem[]|null>(null);
 const [run,setRun]=useState<{deadline?:number;initial:(number|null)[]|null}|null>(null);
 const [res,setRes]=useState<{score:number;total:number;review?:TestReviewData}|null>(null);
 const [subErr,setSubErr]=useState('');
 const last=useRef<number[]|null>(null);
 const cb=useRef({a,onError,onSubmitted});cb.current={a,onError,onSubmitted};
 useEffect(()=>{let live=true;const a=cb.current.a;(async()=>{
  const [qs,r]=await Promise.all([loadTestItems(a,lang),callApi<StartRes>('/classroom/start','POST',{assignmentId:a.id})]);
  if(!live)return;
  if(!r.ok)return cb.current.onError(r.status===0?'network':r.data.error||'other');
  if(!qs)return cb.current.onError('load');
  const n=r.data.total||qs.length;
  const startedAt=r.data.startedAt?utc(r.data.startedAt):Date.now();
  // The server accepted the resume, so some time is left even if this device's clock disagrees.
  const deadline=r.data.minutes?Math.max(startedAt+r.data.minutes*60000,Date.now()+30000):undefined;
  const saved=r.data.progress||(r.data.resumed?readLocal(a.id):null);
  setItems(qs.slice(0,n));setRun({deadline,initial:saved});
 })();return ()=>{live=false}},[a.id,lang]);
 // Only the newest answers matter: each save sends the whole list, so a dropped request is repaired by the next one.
 const save=(g:(number|null)[])=>{writeLocal(a.id,g);void callApi('/classroom/progress','POST',{assignmentId:a.id,answers:g})};
 const submit=async(answers:number[])=>{
  last.current=answers;setSubErr('');setRes(null);
  const r=await callApi<{score:number;total:number;review?:TestReviewData}>('/classroom/submit','POST',{assignmentId:a.id,answers});
  if(r.ok){writeLocal(a.id,null);setRes(r.data);cb.current.onSubmitted?.(r.data.score,r.data.total,r.data.review);return}
  setSubErr(r.status===0?'network':r.data.error||'other');
 };
 const title=testTitle(a,lang);
 const qs=useMemo<RunQ[]>(()=>(items||[]).map(q=>({q:q.q,options:q.options,correct:-1,explanation:''})),[items]);
 if(!items||!run)return <div className="quiz-run" role="dialog" aria-modal="true" aria-label={title} aria-busy="true">
  <div className="quiz-run-bar"><strong>{title}</strong><button data-close onClick={onExit} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body qj-center"><span className="qj-spin" aria-hidden/><p className="muted">{t.loading}</p></div></div>;
 const result=res?<><ScoreCard lang={lang} score={res.score} total={res.total} note={res.review?undefined:t.reviewLater}/>{res.review&&<div className="qj-review"><h3>{t.review}</h3><TestReview lang={lang} items={items} review={res.review}/></div>}</>
  :subErr?<><p className="cr-error qj-err" role="alert">{testError(lang,subErr)}</p>{(subErr==='network'||subErr==='other')&&<button className="button secondary" onClick={()=>last.current&&submit(last.current)}><RotateCw size={16}/>{t.retry}</button>}</>
  :<div className="qj-center"><span className="qj-spin" aria-hidden/><p>{t.sending}</p></div>;
 return <QuizRun title={title} lang={lang} reveal={false} canBack deadline={run.deadline} initial={run.initial??undefined} questions={qs} onAnswer={save}
  finishLabel={t.submit} leaveText={t.leave} doneLabel={exitLabel} result={result} onDone={(_s,_n,answers)=>submit(answers)} onClose={onExit}/>;
}
