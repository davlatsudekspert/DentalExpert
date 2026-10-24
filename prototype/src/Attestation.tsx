import {callApi} from './api';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ChevronRight,Flag,Lock,ShieldAlert,Trophy} from 'lucide-react';
import type {Lang} from './discoveryData';
import QuizRun,{type RunQ} from './QuizRun';
import ReportForm from './ReportForm';
import {ATT_SPECS,AttestationNote,guaranteeNote,attestationOn,loadAtt,type AttSpec} from './attestationConfig';
import {attestationLeft,showPaywall,takeAttestation,usePro} from './billing';
import {FREE} from './proConfig';
import './review.css';
const RU_NAMES:Record<string,string>={umumiy:'Общая стоматология',terapevtik:'Терапевтическая стоматология',ortopedik:'Ортопедическая стоматология',xirurgik:'Хирургическая стоматология (оральная)',yuzjag:'Челюстно-лицевая хирургия',bolalar:'Детская стоматология','bolalar-yuzjag':'Детская челюстно-лицевая хирургия','bolalar-terapevtik':'Детская терапевтическая стоматология','bolalar-xirurgik':'Детская хирургическая стоматология',ortodontiya:'Ортодонтия',implantologiya:'Дентальная имплантология',parodontologiya:'Пародонтология'};
const specName=(s:{id:string;name:string},lang:string)=>lang==='ru'?RU_NAMES[s.id]||s.name:s.name;

/** "Attestatsiya tayyorgarligi": unofficial exam prep from the public TMBM question banks. Option order is shuffled per question in
 * the data (the source key was first) and again per attempt by QuizRun. Keys come from data/attestation (audited, see AUDIT.md). */
const T_={
 uz:{title:'Attestatsiya tayyorgarligi',lead:'Mutaxassislikni tanlang va savollarni mashq qiling.',q:'savol',back:'Orqaga',start:'Boshlash',count:'Savollar soni',random:(n:number)=>`${n} ta tasodifiy`,all:'Hammasi, tartib bilan',best:'Eng yaxshi natija',none:'Hali urinilmagan',
  beta:'Sinov: kalit ~% aniq',betaNote:(p:number)=>`Diqqat: bu mutaxassislikda javoblar kaliti tekshiruvda, taxminan ${p}% savol to‘g‘ri belgilangan. Ehtiyot bo‘lib foydalaning.`,soon:'Kalit tekshiruvda',left:(n:number)=>`Bugun bepul: yana ${n} ta savol`,limited:(n:number)=>`Bugungi bepul limit tufayli test ${n} ta savoldan iborat bo‘ladi.`,used:'Bugungi bepul limit tugadi',report:'Xato haqida xabar berish',reportBody:'Savol/javobdagi xato: ',pro:'Pro',empty:'Savollar yuklanmadi.',unavailable:'Bu bo‘lim hozir mavjud emas.'},
 ru:{title:'Подготовка к аттестации',lead:'Выберите специальность и тренируйтесь на вопросах.',q:'вопросов',back:'Назад',start:'Начать',count:'Количество вопросов',random:(n:number)=>`${n} случайных`,all:'Все по порядку',best:'Лучший результат',none:'Ещё не пройдено',
  beta:'Тест: ключ ~% точен',betaNote:(p:number)=>`Внимание: в этой специальности ключ ответов проверяется, верно отмечено примерно ${p}% вопросов. Пользуйтесь осторожно.`,soon:'Ключ проверяется',left:(n:number)=>`Сегодня бесплатно: ещё ${n}`,limited:(n:number)=>`Из-за дневного бесплатного лимита в тесте будет ${n} вопросов.`,used:'Дневной бесплатный лимит исчерпан',report:'Сообщить об ошибке',reportBody:'Ошибка в вопросе/ответе: ',pro:'Pro',empty:'Вопросы не загрузились.',unavailable:'Раздел сейчас недоступен.'},
};
const STORE='de_attest';
type Best=Record<string,{pct:number;n:number;at:number}>;
const loadBest=():Best=>{try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
const saveBest=(b:Best)=>{try{localStorage.setItem(STORE,JSON.stringify(b))}catch{/* storage unavailable */}};
const COUNTS=[20,50,100] as const;
const shuffle=<T,>(a:T[])=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r};

export default function Attestation({lang}:{lang:Lang}){
 if(!attestationOn(lang))return null;
 const t=T_[lang as 'uz'|'ru'];usePro();
 const [sel,setSel]=useState<AttSpec|null>(null);
 const [count,setCount]=useState<number>(20);   // 0 = all in order
 type Q={id:string;q:string;o:string[];k:number};
 const [qs,setQs]=useState<Q[]|null>(null);
 const [run,setRun]=useState<Q[]|null>(null);
 const [best,setBest]=useState<Best>(loadBest);
 const [report,setReport]=useState<string|null>(null);
 const [off,setOff]=useState(false);
 useEffect(()=>{callApi<{enabled?:boolean}>('/attestation/status').then(r=>{if(r.ok&&r.data.enabled===false)setOff(true)}).catch(()=>{})},[]);
 useEffect(()=>{setQs(null);if(sel&&sel.status!=='withheld')loadAtt(sel.id,lang==='ru'?'ru':'uz').then(x=>setQs(x as Q[])).catch(()=>setQs([]))},[sel,lang]);
 const left=attestationLeft();
 const runQs:RunQ[]=useMemo(()=>(run||[]).map(q=>({q:q.q,options:q.o,correct:q.k,explanation:'',
  media:<button type="button" className="at-report" onClick={()=>setReport(q.id)}><Flag size={13}/>{t.report}</button>})),[run,lang]);// eslint-disable-line react-hooks/exhaustive-deps
 if(off)return <p className="muted">{t.unavailable}</p>;
 const start=()=>{
  if(!sel||!qs?.length)return;
  if(left<=0){showPaywall('practice');return}
  let pool=count===0?qs:shuffle(qs).slice(0,count);
  if(Number.isFinite(left)&&pool.length>left)pool=pool.slice(0,left);
  takeAttestation(pool.length);
  setRun(pool);
 };
 const done=(score:number,total:number)=>{
  if(!sel||!total)return;
  const pct=Math.round(score/total*100);const b={...best};const k=sel.id;
  if(!b[k]||pct>=b[k].pct){b[k]={pct,n:total,at:Date.now()};setBest(b);saveBest(b)}
 };
 const ShowReport=report?<ReportForm lang={lang} onClose={()=>setReport(null)} initial={{category:'content',subject:report,body:t.reportBody}}/>:null;
 if(run&&sel)return <>{<QuizRun title={specName(sel,lang)} note={lang==='ru'?guaranteeNote.ru:guaranteeNote.uz} questions={runQs} lang={lang} onDone={done} onClose={()=>setRun(null)}/>}{ShowReport}</>;
 if(!sel)return <div className="rv-root ex-root">
  <header className="rv-head"><h2>{t.title}</h2><p>{t.lead}</p></header>
  <p className="at-guarantee"><b>{guaranteeNote[lang==='ru'?'ru':'uz']}</b></p>
  {Number.isFinite(left)&&<p className="muted at-left">{left>0?t.left(left):t.used}</p>}
  <div className="at-list">{ATT_SPECS.map(s=>{const b=best[s.id];const locked=s.status==='withheld';
   return <button key={s.id} className="card at-row" disabled={locked} onClick={()=>setSel(s)}>
    <span className="at-main"><strong>{specName(s,lang)}</strong><small>{locked?t.soon:`${lang==='ru'?s.servedRu:s.served} ${t.q}`}{s.status==='beta'?' · '+t.beta.replace('%',String(Math.round(s.agreement*100))+'%'):''}</small>{b&&<small className="at-best"><Trophy size={12}/> {t.best}: {b.pct}%</small>}</span>
    {locked?<ShieldAlert size={16}/>:<ChevronRight size={16}/>}</button>})}</div>
  <AttestationNote lang={lang} noGuarantee/>
 </div>;
 return <div className="rv-root ex-root">
  <button className="button secondary at-back" onClick={()=>setSel(null)}><ArrowLeft size={16}/>{t.back}</button>
  <header className="rv-head"><h2>{specName(sel,lang)}</h2><p>{lang==='ru'?sel.servedRu:sel.served} {t.q}</p></header>
  {sel.status==='beta'&&<p className="at-warn" role="note"><ShieldAlert size={15}/>{t.betaNote(Math.round(sel.agreement*100))}</p>}
  <div className="ex-field"><span className="ex-label">{t.count}</span>
   <div className="ex-seg at-seg" role="radiogroup" aria-label={t.count}>{[...COUNTS,0].map(n=><button key={n} role="radio" aria-checked={n===count} className={n===count?'on':''} onClick={()=>setCount(n)}>{n===0?t.all:t.random(n)}</button>)}</div></div>
  {Number.isFinite(left)&&left>0&&(count===0||count>left)&&<p className="muted">{t.limited(left)}</p>}
  <button className="rv-primary at-start" disabled={!qs||!qs.length} onClick={start}>{left<=0?<Lock size={17}/>:null}{left<=0?t.used:t.start}</button>
  {qs&&!qs.length&&<p className="muted">{t.empty}</p>}
  {best[sel.id]&&<p className="muted"><Trophy size={13}/> {t.best}: {best[sel.id].pct}% ({best[sel.id].n})</p>}
  <AttestationNote lang={lang}/>
  {ShowReport}
 </div>;
}
