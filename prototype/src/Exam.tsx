import {useEffect,useMemo,useRef,useState} from 'react';
import {AlarmClock,Check,ChevronRight,CircleAlert,Database,History,RotateCcw,Trophy,X} from 'lucide-react';
import type {Lang} from './discoveryData';
import QuizRun,{type RunQ} from './QuizRun';
import {ruPl} from './Review';
import './review.css';

/** "Imtihon rejimi": timed mock exam drawn only from professional questions whose answers ship in the app (mini-lesson deck quizzes). The patient-level daily bank is deliberately left out. */

type Deck={id:string;title:string;quiz:{q:string;options:string[];correct:number;explanation:string}[]};
type ExamQ=RunQ&{source:string};
type Attempt={at:number;n:number;correct:number;pct:number;mins:number;used:number};
type Result={qs:ExamQ[];answers:number[];used:number;mins:number};

const KEY='de_exam';
const PASS=60;
const COUNTS=[20,30] as const;
type Count=typeof COUNTS[number];
const ruQ=(n:number)=>`${n} ${ruPl(n,['вопрос','вопроса','вопросов'])}`;

const dict={
 uz:{title:'Imtihon rejimi',sub:'Haqiqiy imtihondagidek: vaqt cheklangan, natija va xatolar oxirida ko‘rsatiladi',
  count:'Savollar soni',time:'Vaqt',q:(n:number)=>`${n} ta savol`,min:(n:number)=>`${n} daqiqa`,
  pool:'Savollar bazasi',poolText:(n:number)=>`Hozir bazada mini-dars testlaridan ${n} ta kasbiy savol bor. Har safar tasodifiy aralashtiriladi.`,
  poolNote:'Fan mavzulari bo‘yicha testlarning javoblari faqat serverda (guruh testlari uchun) saqlanadi, shuning uchun ular bu imtihonga kiritilmagan.',
  repeat:'Baza hali kichik — urinishlar orasida savollar takrorlanishi mumkin.',
  capped:(n:number)=>`Bazada atigi ${n} ta savol bor, shuning uchun imtihon ${n} ta savoldan iborat bo‘ladi.`,
  rules:['Javob tanlangandan so‘ng uning to‘g‘ri yoki noto‘g‘riligi ko‘rsatilmaydi.','Vaqt tugashi bilan imtihon avtomatik yakunlanadi; javobsiz savollar xato hisoblanadi.','O‘tish bali — 60%.'],
  start:'Imtihonni boshlash',loading:'Savollar yuklanmoqda…',empty:'Savollar topilmadi. Internet aloqasini tekshirib, qaytadan urinib ko‘ring.',
  passed:'Tabriklaymiz, imtihondan o‘tdingiz!',failed:'Bu safar o‘tish balliga yetmadi',passMark:'O‘tish bali 60%',
  correct:'To‘g‘ri',wrong:'Xato',skipped:'Javobsiz',used:'Sarflangan vaqt',
  mistakes:'Xatolar tahlili',your:'Sizning javobingiz',none:'Javob berilmagan',right:'To‘g‘ri javob',why:'Izoh',noMistakes:'Xato yo‘q — barcha javoblar to‘g‘ri. Zo‘r natija!',
  retry:'Qayta topshirish',home:'Yangi imtihon',history:'Oxirgi urinishlar',historyEmpty:'Hali urinishlar yo‘q. Birinchi imtihoningizni topshirib ko‘ring — natijalar shu yerda saqlanadi.',
  best:'Eng yaxshi natija',avg:'O‘rtacha',ok:'O‘tdi',fail:'O‘tmadi'},
 ru:{title:'Режим экзамена',sub:'Как на настоящем экзамене: время ограничено, результат и ошибки видны в конце',
  count:'Количество вопросов',time:'Время',q:ruQ,min:(n:number)=>`${n} мин`,
  pool:'База вопросов',poolText:(n:number)=>`Сейчас в базе ${ruQ(n)} из тестов мини-уроков. Каждый раз они перемешиваются случайно.`,
  poolNote:'Ответы к тестам по темам предметов хранятся только на сервере (для групповых тестов), поэтому они не входят в этот экзамен.',
  repeat:'База пока небольшая — вопросы могут повторяться между попытками.',
  capped:(n:number)=>`В базе всего ${ruQ(n)}, поэтому экзамен будет из ${ruQ(n)}.`,
  rules:['После выбора ответа правильность не показывается.','Когда время выйдет, экзамен завершится автоматически; вопросы без ответа считаются ошибками.','Проходной балл — 60%.'],
  start:'Начать экзамен',loading:'Загружаем вопросы…',empty:'Вопросы не найдены. Проверьте подключение и попробуйте снова.',
  passed:'Поздравляем, экзамен сдан!',failed:'В этот раз до проходного балла не хватило',passMark:'Проходной балл 60%',
  correct:'Верно',wrong:'Ошибки',skipped:'Без ответа',used:'Затрачено',
  mistakes:'Разбор ошибок',your:'Ваш ответ',none:'Нет ответа',right:'Правильный ответ',why:'Пояснение',noMistakes:'Ошибок нет — все ответы верные. Отличный результат!',
  retry:'Пройти ещё раз',home:'Новый экзамен',history:'Последние попытки',historyEmpty:'Попыток пока нет. Сдайте первый экзамен — результаты сохранятся здесь.',
  best:'Лучший результат',avg:'В среднем',ok:'Сдан',fail:'Не сдан'},
 en:{title:'Exam mode',sub:'Just like the real exam: timed, with your score and mistakes shown at the end',
  count:'Number of questions',time:'Time',q:(n:number)=>`${n} questions`,min:(n:number)=>`${n} min`,
  pool:'Question pool',poolText:(n:number)=>`The pool has ${n} professional questions from the mini-lesson quizzes. They are shuffled every time.`,
  poolNote:'Answers to the subject topic tests are kept only on the server (for group tests), so those are not part of this exam.',
  repeat:'The pool is still small, so questions may repeat between attempts.',
  capped:(n:number)=>`The pool has only ${n} questions, so this exam will have ${n}.`,
  rules:['After you pick an answer, it is not marked right or wrong.','When time runs out the exam ends automatically; unanswered questions count as wrong.','The pass mark is 60%.'],
  start:'Start the exam',loading:'Loading questions…',empty:'No questions found. Check your connection and try again.',
  passed:'Congratulations, you passed!',failed:'Not quite the pass mark this time',passMark:'Pass mark 60%',
  correct:'Correct',wrong:'Wrong',skipped:'Unanswered',used:'Time used',
  mistakes:'Mistake review',your:'Your answer',none:'No answer',right:'Correct answer',why:'Explanation',noMistakes:'No mistakes — every answer was right. Excellent!',
  retry:'Try again',home:'New exam',history:'Recent attempts',historyEmpty:'No attempts yet. Take your first exam and your results will be kept here.',
  best:'Best score',avg:'Average',ok:'Passed',fail:'Failed'}
};

function loadHistory():Attempt[]{try{const h=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(h)?h.slice(0,10):[]}catch{return []}}
function saveHistory(h:Attempt[]){try{localStorage.setItem(KEY,JSON.stringify(h.slice(0,10)))}catch{}}
function shuffle<T>(a:T[]){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
const two=(n:number)=>String(n).padStart(2,'0');
const fmtWhen=(ms:number)=>{const d=new Date(ms);return `${two(d.getDate())}.${two(d.getMonth()+1)}.${d.getFullYear()} · ${two(d.getHours())}:${two(d.getMinutes())}`};
const fmtDur=(s:number)=>`${Math.floor(s/60)}:${two(s%60)}`;

function Seg<T extends number>({label,value,options,render,onChange}:{label:string;value:T;options:T[];render:(v:T)=>string;onChange:(v:T)=>void}){
 return <div className="ex-field"><span className="ex-label">{label}</span>
  <div className="ex-seg" role="radiogroup" aria-label={label}>{options.map(o=><button key={o} role="radio" aria-checked={o===value} className={o===value?'on':''} onClick={()=>onChange(o)}>{render(o)}</button>)}</div>
 </div>;
}

function ScoreRing({pct,pass}:{pct:number;pass:boolean}){
 const size=148,stroke=12,r=(size-stroke)/2,c=2*Math.PI*r;
 const markAngle=PASS/100*360-90,mx=size/2+r*Math.cos(markAngle*Math.PI/180),my=size/2+r*Math.sin(markAngle*Math.PI/180);
 return <div className="ex-ring" style={{width:size,height:size}}>
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
   <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rv-soft)" strokeWidth={stroke}/>
   <circle className="ex-ring-arc" cx={size/2} cy={size/2} r={r} fill="none" stroke={pass?'#168d8b':'#c0573c'} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} transform={`rotate(-90 ${size/2} ${size/2})`}/>
   <circle cx={mx} cy={my} r={4} fill="#10254e" stroke="#fff" strokeWidth={2}/>
  </svg>
  <div className="ex-ring-in"><b>{pct}%</b></div>
 </div>;
}

export default function Exam({lang}:{lang:'uz'|'ru'|'en'}){
 const t=dict[lang];
 const l=lang as Lang;
 const [decks,setDecks]=useState<Deck[]|null>(null);
 const [count,setCount]=useState<Count>(20);
 const [mins,setMins]=useState<20|40>(20);
 const [run,setRun]=useState<{qs:ExamQ[];deadline:number;started:number;mins:number}|null>(null);
 const [result,setResult]=useState<Result|null>(null);
 const [history,setHistory]=useState<Attempt[]>(loadHistory);
 const resRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{let live=true;setDecks(null);fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(d=>{if(live)setDecks(Array.isArray(d)?d:[])}).catch(()=>{if(live)setDecks([])});return ()=>{live=false}},[lang]);

 const deckQs=useMemo<ExamQ[]>(()=>(decks||[]).flatMap(d=>d.quiz.map(q=>({q:q.q,options:q.options,correct:q.correct,explanation:q.explanation,source:d.title}))),[decks]);
 const pool=deckQs;
 const size=Math.min(count,pool.length);

 const start=()=>{
  if(!pool.length)return;
  const now=Date.now();
  setResult(null);
  setRun({qs:shuffle(pool).slice(0,size),deadline:now+mins*60000,started:now,mins});
 };
 const done=(answers:number[])=>{
  if(!run)return;
  const ans=run.qs.map((_,k)=>answers[k]??-1);
  const correct=ans.filter((a,k)=>a===run.qs[k].correct).length;
  const used=Math.min(run.mins*60,Math.round((Date.now()-run.started)/1000));
  const at:Attempt={at:Date.now(),n:run.qs.length,correct,pct:Math.round(correct/run.qs.length*100),mins:run.mins,used};
  const h=[at,...history].slice(0,10);
  setHistory(h);saveHistory(h);
  setResult({qs:run.qs,answers:ans,used,mins:run.mins});
  setRun(null);
 };

 // The result replaces the full-screen run; start it at the top rather than wherever the setup was scrolled to.
 useEffect(()=>{if(result)resRef.current?.scrollIntoView({block:'start'})},[result]);

 if(run)return <QuizRun title={t.title} lang={l} questions={run.qs} reveal={false} deadline={run.deadline} onDone={(_s,_n,a)=>done(a)} onClose={()=>setRun(null)}/>;

 if(result){
  const n=result.qs.length;
  const correct=result.answers.filter((a,k)=>a===result.qs[k].correct).length;
  const skipped=result.answers.filter(a=>a<0).length;
  const wrong=n-correct-skipped;
  const pct=Math.round(correct/n*100);
  const pass=pct>=PASS;
  const misses=result.qs.map((q,k)=>({q,a:result.answers[k],k})).filter(x=>x.a!==x.q.correct);
  return <div className="rv-root ex-root ex-done" ref={resRef}>
   <section className={'ex-result '+(pass?'pass':'fail')}>
    <ScoreRing pct={pct} pass={pass}/>
    <div className="ex-verdict">{pass?<Trophy size={18}/>:<CircleAlert size={18}/>}<strong>{pass?t.passed:t.failed}</strong></div>
    <p className="ex-score">{correct} / {n} · {t.passMark}</p>
    <div className="ex-tiles">
     <div className="ok"><b>{correct}</b><span>{t.correct}</span></div>
     <div className="bad"><b>{wrong}</b><span>{t.wrong}</span></div>
     <div className="skip"><b>{skipped}</b><span>{t.skipped}</span></div>
     <div><b>{fmtDur(result.used)}</b><span>{t.used}</span></div>
    </div>
    <div className="ex-buttons"><button className="rv-primary" onClick={start}><RotateCcw size={18}/>{t.retry}</button><button className="rv-secondary" onClick={()=>setResult(null)}>{t.home}</button></div>
   </section>
   <section className="ex-review">
    <h3>{t.mistakes}{misses.length?<span className="ex-count">{misses.length}</span>:null}</h3>
    {misses.length===0?<div className="rv-empty"><div className="rv-empty-art"><Check size={30}/></div><strong>{t.noMistakes}</strong></div>
    :<ol>{misses.map(({q,a,k})=><li key={k} className="ex-miss">
     <span className="ex-num">{k+1}</span>
     <div>
      <p className="ex-q">{q.q}</p>
      <p className={'ex-ans '+(a<0?'skip':'bad')}><X size={15}/><span><small>{t.your}</small>{a<0?t.none:q.options[a]}</span></p>
      <p className="ex-ans ok"><Check size={15}/><span><small>{t.right}</small>{q.options[q.correct]}</span></p>
      {q.explanation&&<p className="ex-why"><small>{t.why}</small>{q.explanation}</p>}
     </div>
    </li>)}</ol>}
   </section>
  </div>;
 }

 const best=history.length?Math.max(...history.map(h=>h.pct)):0;
 const avg=history.length?Math.round(history.reduce((a,h)=>a+h.pct,0)/history.length):0;
 return <div className="rv-root ex-root">
  <header className="rv-head"><h2>{t.title}</h2><p>{t.sub}</p></header>
  <section className="ex-setup">
   <Seg label={t.count} value={count} options={[...COUNTS]} render={t.q} onChange={setCount}/>
   <Seg label={t.time} value={mins} options={[20,40] as (20|40)[]} render={t.min} onChange={setMins}/>
   <ul className="ex-rules">{t.rules.map((r,k)=><li key={k}>{k===1?<AlarmClock size={16}/>:<Check size={16}/>}<span>{r}</span></li>)}</ul>
   {decks===null?<div className="rv-loading" role="status"><span className="rv-spin"/>{t.loading}</div>
   :pool.length===0?<p className="ex-warn">{t.empty}</p>
   :<>{size<count&&<p className="ex-warn">{t.capped(pool.length)}</p>}
    <button className="rv-primary rv-start" onClick={start}>{t.start} · {t.q(size)}<ChevronRight size={18}/></button></>}
  </section>
  <section className="ex-pool">
   <div className="ex-pool-head"><Database size={18}/><strong>{t.pool}</strong><span className="ex-pool-n">{decks===null?'…':pool.length}</span></div>
   {decks!==null&&<>
    <p>{t.poolText(pool.length)}</p>
    {pool.length<count*2&&<p className="ex-amber">{t.repeat}</p>}
   </>}
   <p className="rv-muted">{t.poolNote}</p>
  </section>
  <section className="ex-history">
   <div className="ex-history-head"><History size={18}/><h3>{t.history}</h3></div>
   {history.length===0?<p className="rv-muted ex-history-empty">{t.historyEmpty}</p>:<>
    <div className="ex-history-stats"><div><b>{best}%</b><span>{t.best}</span></div><div><b>{avg}%</b><span>{t.avg}</span></div></div>
    <ul>{history.map(h=><li key={h.at}>
     <div className="ex-h-main"><strong>{h.correct} / {h.n}</strong><small>{fmtWhen(h.at)} · {fmtDur(h.used)} / {h.mins}:00</small></div>
     <div className="ex-h-bar"><i className={h.pct>=PASS?'ok':'bad'} style={{width:`${h.pct}%`}}/><span style={{left:`${PASS}%`}}/></div>
     <span className={'ex-h-tag '+(h.pct>=PASS?'ok':'bad')}>{h.pct}%</span>
    </li>)}</ul>
   </>}
  </section>
 </div>;
}
