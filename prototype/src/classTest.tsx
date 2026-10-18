import {useEffect,useMemo,useRef,useState} from 'react';
import {Eye,RotateCw,Sparkles,X} from 'lucide-react';
import {callApi} from './api';
import QuizRun,{type RunQ} from './QuizRun';
import {loadTopic,topicMeta,tx,type L,type Topic} from './curriculumData';
import {drawVariant,qref,refIndex,refTopic} from './classroomShared';
import type {Lang} from './discoveryData';

/** One server-scored class test (topic test or deck quiz) for a student: start or resume, save answers as they go, submit, score and review. */
export type TestReviewData={answers:number[]|null;correct:number[];explain:(L|null)[]|null;questions?:string[]};
export type Reveal='closed'|'deadline'|'instant';
export type TestMeta={id:string;title:string;status:'open'|'closed';topicId?:string;questions?:number[];deckId?:string|null;minutes?:number;reveal?:Reveal;
 /** Topic tests: question refs ("topic:index") of the fixed test or of the variant pool. */
 items?:string[];variant?:boolean;perStudent?:number;questionCount?:number;deadlineAt?:string;ended?:boolean;
 mine:{answer:string|null;score:number|null;total:number|null;startedAt?:string|null;questions?:string[];review?:TestReviewData}|null};
export type TestItem={q:string;options:string[];explanation?:string};
type DeckQ={q:string;options:string[];correct:number;explanation:string};
type StartRes={total:number;minutes:number|null;resumed?:boolean;now?:string;startedAt?:string;endsAt?:string|null;deadlineAt?:string|null;questions?:string[];progress?:(number|null)[]|null};

const MON={uz:['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'],ru:['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'],en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
/** A deadline in the reader's time zone: "20-okt, 18:00" · "20 окт, 18:00" · "20 Oct, 18:00". */
export function fmtWhen(iso:string,lang:Lang){
 const d=new Date(iso);if(!Number.isFinite(d.getTime()))return '';
 const hm=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
 return `${d.getDate()}${lang==='uz'?'-':' '}${MON[lang][d.getMonth()]}, ${hm}`;
}
export const dueWord={uz:'Muddat',ru:'Срок',en:'Due'};
export const fmtDue=(iso:string,lang:Lang)=>`${dueWord[lang]}: ${fmtWhen(iso,lang)}`;

export const testWords={
 uz:{great:'A’lo natija!',good:'Yaxshi natija',more:'Mavzuni yana takrorlang',scoreLine:(s:number,n:number)=>`${n} ta savoldan ${s} tasiga to‘g‘ri javob berdingiz`,reviewLater:'To‘g‘ri javoblar ustoz testni yakunlagach ko‘rinadi.',reviewDeadline:(d:string)=>`To‘g‘ri javoblar muddat tugagach (${d}) yoki ustoz testni yakunlagach ko‘rinadi.`,review:'Javoblar tahlili',
  yourAns:'Sizning javobingiz',right:'To‘g‘ri javob',noAnswer:'Javob berilmagan',submit:'Topshirish',resume:'Davom ettirish',leave:'Javoblaringiz saqlanadi, keyin davom ettirasiz.',sending:'Javoblar yuborilmoqda…',retry:'Qayta yuborish',loading:'Test yuklanmoqda…',close:'Yopish',
  preview:'Sinov',previewNote:'Sinov rejimi: javoblar hech qayerga yuborilmadi va natijalarda ko‘rinmaydi.',previewDone:(s:number,n:number)=>`Sinov tugadi: ${s} / ${n}`,previewBack:'Ustoz ekraniga qaytish',
  err:{closed:'Test yopilgan — ustoz uni yakunlagan.',already_submitted:'Siz bu testni allaqachon topshirgansiz.',already_submitted_or_not_started:'Siz bu testni allaqachon topshirgansiz.',time_up:'Bu test uchun ajratilgan vaqt tugagan.',past_due:'Test muddati tugagan.',forbidden:'Bu test sizning guruhingizga tegishli emas.',load:'Test savollarini yuklab bo‘lmadi.',network:'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.',unauthorized:'Sessiya tugagan — hisobingizga qayta kiring.',rate_limited:'Juda ko‘p urinish. Bir necha daqiqadan so‘ng qayta urinib ko‘ring.',other:'Bajarilmadi. Qayta urinib ko‘ring.'}},
 ru:{great:'Отличный результат!',good:'Хороший результат',more:'Стоит повторить тему',scoreLine:(s:number,n:number)=>`Верных ответов: ${s} из ${n}`,reviewLater:'Верные ответы появятся после того, как преподаватель завершит тест.',reviewDeadline:(d:string)=>`Верные ответы появятся после срока (${d}) или когда преподаватель завершит тест.`,review:'Разбор ответов',
  yourAns:'Ваш ответ',right:'Верный ответ',noAnswer:'Нет ответа',submit:'Сдать тест',resume:'Продолжить',leave:'Ваши ответы сохранятся — вы сможете продолжить.',sending:'Отправляем ответы…',retry:'Отправить снова',loading:'Загружаем тест…',close:'Закрыть',
  preview:'Проба',previewNote:'Пробный режим: ответы никуда не отправлены и не попадают в результаты.',previewDone:(s:number,n:number)=>`Проба завершена: ${s} / ${n}`,previewBack:'Вернуться к экрану преподавателя',
  err:{closed:'Тест закрыт — преподаватель его завершил.',already_submitted:'Вы уже сдали этот тест.',already_submitted_or_not_started:'Вы уже сдали этот тест.',time_up:'Время на этот тест истекло.',past_due:'Срок теста истёк.',forbidden:'Этот тест не относится к вашей группе.',load:'Не удалось загрузить вопросы теста.',network:'Нет подключения к интернету. Проверьте связь и попробуйте снова.',unauthorized:'Сессия истекла — войдите в аккаунт снова.',rate_limited:'Слишком много попыток. Попробуйте через несколько минут.',other:'Не получилось. Попробуйте ещё раз.'}},
 en:{great:'Excellent!',good:'Good result',more:'Worth revising this topic',scoreLine:(s:number,n:number)=>`You answered ${s} of ${n} correctly`,reviewLater:'The right answers appear once your teacher finishes the test.',reviewDeadline:(d:string)=>`The right answers appear after the deadline (${d}) or once your teacher finishes the test.`,review:'Answer review',
  yourAns:'Your answer',right:'Right answer',noAnswer:'No answer',submit:'Submit',resume:'Continue',leave:'Your answers are saved — you can continue later.',sending:'Sending your answers…',retry:'Send again',loading:'Loading the test…',close:'Close',
  preview:'Preview',previewNote:'Preview: nothing was sent anywhere and it does not appear in the results.',previewDone:(s:number,n:number)=>`Preview finished: ${s} / ${n}`,previewBack:'Back to the teacher screen',
  err:{closed:'The test is closed — your teacher has finished it.',already_submitted:'You have already submitted this test.',already_submitted_or_not_started:'You have already submitted this test.',time_up:'The time for this test is over.',past_due:'The test’s deadline has passed.',forbidden:'This test is not in your group.',load:'Could not load the test questions.',network:'No internet connection. Check it and try again.',unauthorized:'Your session has expired — sign in again.',rate_limited:'Too many attempts. Try again in a few minutes.',other:'That did not work. Please try again.'}}
};
export const testError=(lang:Lang,code:string)=>{const e=testWords[lang].err;return code in e?e[code as keyof typeof e]:e.other};
/** The note under a score while the right answers are still hidden. */
export const revealNote=(a:Pick<TestMeta,'reveal'|'deadlineAt'>,lang:Lang)=>a.reveal==='deadline'&&a.deadlineAt?testWords[lang].reviewDeadline(fmtWhen(a.deadlineAt,lang)):testWords[lang].reviewLater;

const decks=new Map<string,Promise<{id:string;quiz:DeckQ[]}[]>>();
const loadDecks=(lang:Lang)=>{if(!decks.has(lang))decks.set(lang,fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).catch(()=>{decks.delete(lang);return []}));return decks.get(lang)!};
export const topicItems=(topic:Topic,idx:number[],lang:Lang):TestItem[]=>idx.map(i=>topic.test[i]).filter(Boolean).map(q=>({q:tx(q.q,lang),options:q.options.map(o=>tx(o,lang))}));
/** Questions by ref ("topic:index"), loading each topic once; null when one cannot be loaded. */
export async function refItems(refs:string[],lang:Lang):Promise<TestItem[]|null>{
 const ids=[...new Set(refs.map(refTopic))];
 const topics=new Map((await Promise.all(ids.map(async id=>[id,await loadTopic(id)] as const))));
 const out:TestItem[]=[];
 for(const r of refs){const q=topics.get(refTopic(r))?.test[refIndex(r)];if(!q)return null;out.push({q:tx(q.q,lang),options:q.options.map(o=>tx(o,lang))})}
 return out;
}
/** The refs a topic test shows: the student's own draw (variant), else the fixed list. */
export const testRefs=(a:Pick<TestMeta,'topicId'|'questions'|'items'|'variant'|'mine'>,own?:string[]|null)=>
 a.variant?own||a.mine?.questions||a.mine?.review?.questions||null:a.items||(a.topicId&&a.questions?a.questions.map(i=>qref(a.topicId!,i)):null);
/** The questions of a class test, in the order the server scores them: a topic test's refs, or a deck quiz. */
export async function loadTestItems(a:Pick<TestMeta,'topicId'|'questions'|'deckId'|'items'|'variant'|'mine'>,lang:Lang,own?:string[]|null):Promise<TestItem[]|null>{
 if(a.topicId){const refs=testRefs(a,own);return refs?refItems(refs,lang):null}
 const d=(await loadDecks(lang)).find(x=>x.id===a.deckId);
 return d?d.quiz.map(q=>({q:q.q,options:q.options,explanation:q.explanation})):null;
}
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

/** The clock of an attempt on this device: the server's end time, moved by the difference between the two clocks. Without
 * a time limit but with a deadline the bar shows the date and switches to a countdown in the last hour. */
function clockOf(r:StartRes,lang:Lang){
 if(!r.endsAt)return {};
 const skew=r.now?Date.now()-Date.parse(r.now):0;
 const deadline=Date.parse(r.endsAt)+(Number.isFinite(skew)?skew:0);
 return r.minutes?{deadline}:{deadline,clockFrom:3600,dueLabel:r.deadlineAt?fmtDue(r.deadlineAt,lang):undefined};
}

/** Full-screen run of one class test. Starts (or resumes) it on mount; onError(code) when it cannot be taken (closed, already_submitted, time_up, past_due, forbidden, network, unauthorized, load).
 *  The X asks first (answers are kept on the server); after submitting, the result button calls onExit. */
export function TestRun({lang,a,userId,exitLabel,onExit,onError,onSubmitted}:{lang:Lang;a:TestMeta;userId?:string;exitLabel?:string;onExit:()=>void;onError:(code:string)=>void;onSubmitted?:(score:number,total:number,review?:TestReviewData)=>void}){
 const t=testWords[lang];
 const [items,setItems]=useState<TestItem[]|null>(null);
 const [run,setRun]=useState<{deadline?:number;clockFrom?:number;dueLabel?:string;initial:(number|null)[]|null}|null>(null);
 const [res,setRes]=useState<{score:number;total:number;review?:TestReviewData}|null>(null);
 const [subErr,setSubErr]=useState('');
 const last=useRef<number[]|null>(null);
 const cb=useRef({a,onError,onSubmitted,userId});cb.current={a,onError,onSubmitted,userId};
 useEffect(()=>{let live=true;const a=cb.current.a;(async()=>{
  const r=await callApi<StartRes>('/classroom/start','POST',{assignmentId:a.id});
  if(!live)return;
  if(!r.ok)return cb.current.onError(r.status===0?'network':r.data.error||'other');
  // A variant test: the server drew this student's questions; the app's copy of the same draw must agree.
  const own=a.variant?r.data.questions||null:null;
  if(own&&a.items&&cb.current.userId)void drawVariant(a.id,cb.current.userId,a.items,own.length,a.topicId).then(ix=>{if(ix.map(i=>a.items![i]).join()!==own.join())console.warn('variant draw differs from the server; using the server list')});
  const qs=await loadTestItems(a,lang,own);
  if(!live)return;
  if(!qs)return cb.current.onError('load');
  const n=r.data.total||qs.length;
  const saved=r.data.progress||(r.data.resumed?readLocal(a.id):null);
  setItems(qs.slice(0,n));setRun({...clockOf(r.data,lang),initial:saved});
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
 const result=res?<><ScoreCard lang={lang} score={res.score} total={res.total} note={res.review?undefined:revealNote(a,lang)}/>{res.review&&<div className="qj-review"><h3>{t.review}</h3><TestReview lang={lang} items={items} review={res.review}/></div>}</>
  :subErr?<><p className="cr-error qj-err" role="alert">{testError(lang,subErr)}</p>{(subErr==='network'||subErr==='other'||subErr==='rate_limited')&&<button className="button secondary" onClick={()=>last.current&&submit(last.current)}><RotateCw size={16}/>{t.retry}</button>}</>
  :<div className="qj-center"><span className="qj-spin" aria-hidden/><p>{t.sending}</p></div>;
 return <QuizRun title={title} lang={lang} reveal={false} canBack deadline={run.deadline} clockFrom={run.clockFrom} dueLabel={run.dueLabel} initial={run.initial??undefined} questions={qs} onAnswer={save}
  finishLabel={t.submit} leaveText={t.leave} doneLabel={exitLabel} result={result} onDone={(_s,_n,answers)=>submit(answers)} onClose={onExit}/>;
}

/** The teacher tries their own test as a student would see it: the same questions (in a variant test, the draw the
 * teacher's own account would get, from the same shared module the server uses), the same time limit, scored on this
 * device. Nothing is sent to the classroom API: it only reads the public self-study keys of the topics. */
export function PreviewRun({lang,a,userId,onExit}:{lang:Lang;a:TestMeta;userId:string;onExit:()=>void}){
 const t=testWords[lang];
 const [qs,setQs]=useState<RunQ[]|null>(null);
 const [err,setErr]=useState('');
 const [deadline]=useState(()=>a.minutes?Date.now()+a.minutes*60000:a.deadlineAt?Date.parse(a.deadlineAt):undefined);
 const [score,setScore]=useState<[number,number]|null>(null);
 useEffect(()=>{let live=true;(async()=>{
  if(!a.topicId||!a.items){setErr('load');return}
  const refs=a.variant?(await drawVariant(a.id,userId,a.items,a.perStudent||a.questionCount||0,a.topicId)).map(i=>a.items![i]):a.items;
  const ids=[...new Set(refs.map(refTopic))];
  const keys=new Map(await Promise.all(ids.map(async id=>{const r=await callApi<{correct:number[]}>(`/curriculum/key?topicId=${encodeURIComponent(id)}`);return [id,r.ok?r.data.correct:null] as const})));
  const items=await refItems(refs,lang);
  if(!live)return;
  if(!items||[...keys.values()].some(k=>!k)){setErr(items?'network':'load');return}
  setQs(items.map((q,k)=>({q:q.q,options:q.options,correct:keys.get(refTopic(refs[k]))![refIndex(refs[k])],explanation:''})));
 })();return ()=>{live=false}},[a.id,a.items,a.variant,a.perStudent,a.questionCount,a.topicId,userId,lang]);
 const title=`${t.preview} · ${testTitle(a,lang)}`;
 if(!qs)return <div className="quiz-run" role="dialog" aria-modal="true" aria-label={title} aria-busy={!err}>
  <div className="quiz-run-bar"><strong>{title}</strong><button data-close onClick={onExit} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body qj-center">{err?<p className="cr-error" role="alert">{testError(lang,err)}</p>:<><span className="qj-spin" aria-hidden/><p className="muted">{t.loading}</p></>}</div></div>;
 const result=score?<><div className="qr-ring" style={{['--p' as string]:score[1]?Math.round(score[0]/score[1]*100):0}}><div><b>{score[0]} / {score[1]}</b></div></div>
  <h3 className="qr-verdict"><Eye size={18}/>{t.previewDone(score[0],score[1])}</h3><p className="lg-small">{t.previewNote}</p></>:undefined;
 return <QuizRun title={title} lang={lang} reveal={false} canBack deadline={deadline} dueLabel={a.deadlineAt&&!a.minutes?fmtDue(a.deadlineAt,lang):undefined} clockFrom={a.minutes?undefined:3600} questions={qs} finishLabel={t.submit} doneLabel={t.previewBack}
  result={result} onDone={(s,n)=>setScore([s,n])} onClose={onExit}/>;
}
