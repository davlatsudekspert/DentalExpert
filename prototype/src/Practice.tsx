import {useEffect,useRef,useState,type ComponentType} from 'react';
import {ArrowLeft,Calculator,Check,ChevronRight,Hash,Layers,RotateCcw,Ruler,ScanLine,Trophy,X,type LucideIcon} from 'lucide-react';
import './practice.css';
import type {SimProps} from './practice/shared';
import Radiograph from './practice/Radiograph';
import Dmft from './practice/Dmft';
import Fdi from './practice/Fdi';
import Caries from './practice/Caries';
import Perio from './practice/Perio';

type Lang='uz'|'ru'|'en';
type SimId='xray'|'dmft'|'fdi'|'caries'|'perio';
type ModeDef={id:string;label:Record<Lang,string>;options:{id:string;label:Record<Lang,string>}[]};
type SimDef={id:SimId;icon:LucideIcon;comp:ComponentType<SimProps>;title:Record<Lang,string>;desc:Record<Lang,string>;modes?:ModeDef[]};

const CASES=10;
const STORE='de_practice';

const T={
 uz:{
  eyebrow:'Amaliyot',title:'Rasmli amaliyot',lead:'Rasmga qarang va javob bering. Har bir urinishda yangi holat yaratiladi.',
  best:'Eng yaxshi natija',none:'Hali urinilmagan',cases:`${CASES} ta holat`,
  back:'Orqaga',menu:'Barcha mashqlar',start:'Boshlash',caseOf:(i:number)=>`Holat ${i} / ${CASES}`,score:'Ball',
  next:'Keyingi',finish:'Natijani ko‘rish',right:'To‘g‘ri!',wrong:'Noto‘g‘ri',
  result:'Natija',again:'Qayta boshlash',newBest:'Yangi rekord!',
  msg:(s:number)=>s>=9?'A’lo natija! Bilimingiz mustahkam.':s>=7?'Yaxshi natija. Yana bir oz mashq qiling.':s>=5?'Yomon emas. Izohlarni o‘qib, qayta urinib ko‘ring.':'Qayta urinib ko‘ring: muntazam mashq mahoratni oshiradi.',
  footer:'O‘quv mashqi, klinik tashxis emas',settings:'Sozlamalar',progress:'Mashq jarayoni'
 },
 ru:{
  eyebrow:'Практика',title:'Практика по изображениям',lead:'Посмотрите на изображение и ответьте. Каждый раз создаётся новый случай.',
  best:'Лучший результат',none:'Ещё не пройдено',cases:`${CASES} случаев`,
  back:'Назад',menu:'Все тренажёры',start:'Начать',caseOf:(i:number)=>`Случай ${i} / ${CASES}`,score:'Баллы',
  next:'Далее',finish:'Показать результат',right:'Верно!',wrong:'Неверно',
  result:'Результат',again:'Пройти ещё раз',newBest:'Новый рекорд!',
  msg:(s:number)=>s>=9?'Отличный результат! Знания уверенные.':s>=7?'Хороший результат. Ещё немного практики.':s>=5?'Неплохо. Прочитайте пояснения и попробуйте снова.':'Попробуйте ещё раз: регулярная практика укрепляет навык.',
  footer:'Учебное упражнение, не клинический диагноз',settings:'Настройки',progress:'Прогресс тренировки'
 },
 en:{
  eyebrow:'Practice',title:'Picture practice',lead:'Look at the picture and answer. Every run generates new cases.',
  best:'Best score',none:'Not tried yet',cases:`${CASES} cases`,
  back:'Back',menu:'All simulators',start:'Start',caseOf:(i:number)=>`Case ${i} of ${CASES}`,score:'Score',
  next:'Next',finish:'See result',right:'Correct!',wrong:'Not quite',
  result:'Result',again:'Play again',newBest:'New best!',
  msg:(s:number)=>s>=9?'Excellent! Your knowledge is solid.':s>=7?'Good result. A little more practice will do it.':s>=5?'Not bad. Read the explanations and try again.':'Try again: regular practice builds the skill.',
  footer:'Practice exercise, not a clinical diagnosis',settings:'Settings',progress:'Practice progress'
 }
};

const SIMS:SimDef[]=[
 {id:'xray',icon:ScanLine,comp:Radiograph,
  title:{uz:'Rentgen o‘qish',ru:'Чтение рентгенограмм',en:'Radiograph reading'},
  desc:{uz:'Sxematik rentgenogrammada karies, periapikal o‘choq, implant va boshqa topilmalarni aniqlang.',ru:'Найдите кариес, периапикальный очаг, имплантат и другие находки на схематичном снимке.',en:'Spot caries, periapical lesions, implants and more on a schematic radiograph.'}},
 {id:'dmft',icon:Calculator,comp:Dmft,
  title:{uz:'KPU / DMFT hisoblash',ru:'Расчёт индекса КПУ',en:'DMFT counting'},
  desc:{uz:'Odontogrammadagi karies, plomba va olib tashlangan tishlarni sanab, KPU indeksini toping.',ru:'Посчитайте кариозные, пломбированные и удалённые зубы на одонтограмме и найдите КПУ.',en:'Count decayed, missing and filled teeth on an odontogram and work out DMFT.'}},
 {id:'fdi',icon:Hash,comp:Fdi,
  title:{uz:'FDI raqamlash',ru:'Нумерация FDI',en:'FDI numbering'},
  desc:{uz:'Ajratilgan tish raqamini toping yoki berilgan raqamdagi tishni bosing.',ru:'Назовите номер выделенного зуба или найдите зуб по номеру.',en:'Name the highlighted tooth or tap the tooth with a given number.'},
  modes:[
   {id:'dent',label:{uz:'Tishlar',ru:'Зубы',en:'Dentition'},options:[
    {id:'perm',label:{uz:'Doimiy (32)',ru:'Постоянные (32)',en:'Permanent (32)'}},
    {id:'prim',label:{uz:'Sut tishlari (20)',ru:'Временные (20)',en:'Primary (20)'}}]},
   {id:'task',label:{uz:'Vazifa',ru:'Задание',en:'Task'},options:[
    {id:'name',label:{uz:'Raqamni tanlash',ru:'Выбрать номер',en:'Pick the number'}},
    {id:'tap',label:{uz:'Tishni bosish',ru:'Нажать на зуб',en:'Tap the tooth'}},
    {id:'mix',label:{uz:'Aralash',ru:'Смешанный',en:'Mixed'}}]}
  ]},
 {id:'caries',icon:Layers,comp:Caries,
  title:{uz:'Karies chuqurligi va Black sinfi',ru:'Глубина кариеса и класс по Блэку',en:'Caries depth and Black class'},
  desc:{uz:'Kesimda kariesning chuqurligini, tish yuzasida esa Black bo‘yicha sinfini aniqlang.',ru:'Определите глубину кариеса на срезе и класс по Блэку на поверхности зуба.',en:'Judge lesion depth on a section and the Black class from its location.'}},
 {id:'perio',icon:Ruler,comp:Perio,
  title:{uz:'Parodont zondlash',ru:'Пародонтальное зондирование',en:'Periodontal probing'},
  desc:{uz:'6 nuqtadagi PD va milk qirg‘og‘idan CAL ni hisoblab, parodontit bosqichini tanlang.',ru:'Рассчитайте CAL по PD и положению края десны в 6 точках и выберите стадию.',en:'Compute CAL from 6-site PD and gingival margin data and pick the stage.'}}
];

function loadBest():Record<string,number>{try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}}
function saveBest(b:Record<string,number>){try{localStorage.setItem(STORE,JSON.stringify(b))}catch{/* storage unavailable */}}

function ScoreRing({score}:{score:number}){
 const r=52,c=2*Math.PI*r,f=score/CASES;
 const col=f>=0.7?'#168d8b':f>=0.5?'#b7791f':'#c0392b';
 return <svg className="pr-ring" viewBox="0 0 128 128" aria-hidden="true">
  <circle cx={64} cy={64} r={r} fill="none" stroke="#e3f1f1" strokeWidth={11}/>
  <circle cx={64} cy={64} r={r} fill="none" stroke={col} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${c*f} ${c}`} transform="rotate(-90 64 64)" className="pr-ring-arc"/>
  <text x={64} y={70} textAnchor="middle" className="pr-ring-num">{score}<tspan className="pr-ring-of">/{CASES}</tspan></text>
 </svg>;
}

type Run={sim:SimDef;mode:Record<string,string>;i:number;score:number;fb:{ok:boolean;text:string}|null;id:number;done:boolean;newBest:boolean};

export default function Practice({lang}:{lang:'uz'|'ru'|'en'}){
 const t=T[lang];
 const [best,setBest]=useState<Record<string,number>>(loadBest);
 const [setup,setSetup]=useState<{sim:SimDef;mode:Record<string,string>}|null>(null);
 const [run,setRun]=useState<Run|null>(null);
 const topRef=useRef<HTMLDivElement>(null);
 const fbRef=useRef<HTMLDivElement>(null);
 const nextRef=useRef<HTMLButtonElement>(null);

 const start=(sim:SimDef,mode:Record<string,string>={})=>{setSetup(null);setRun({sim,mode,i:0,score:0,fb:null,id:Date.now(),done:false,newBest:false})};
 const open=(sim:SimDef)=>{
  if(sim.modes)setSetup({sim,mode:Object.fromEntries(sim.modes.map(m=>[m.id,m.options[0].id]))});
  else start(sim);
 };
 const answer=(ok:boolean,text:string)=>setRun(r=>r&&!r.fb?{...r,fb:{ok,text},score:r.score+(ok?1:0)}:r);
 const next=()=>{
  if(!run)return;
  if(run.i+1<CASES){setRun({...run,i:run.i+1,fb:null});return}
  const prev=best[run.sim.id]??-1,nb=run.score>prev;
  if(nb){const b={...best,[run.sim.id]:run.score};setBest(b);saveBest(b)}
  setRun({...run,done:true,newBest:nb&&prev>=0});
 };
 useEffect(()=>{if(run?.fb){fbRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'});nextRef.current?.focus({preventScroll:true})}},[run?.fb]);
 useEffect(()=>{if(run&&!run.fb){const el=topRef.current;if(el&&el.getBoundingClientRect().top<0)el.scrollIntoView({block:'start'})}},[run?.i,run?.done]);// eslint-disable-line react-hooks/exhaustive-deps

 const footer=<p className="pr-footer">{t.footer}</p>;

 if(setup){
  const s=setup.sim,Icon=s.icon;
  return <div className="pr" ref={topRef}>
   <div className="pr-bar"><button type="button" className="pr-icon-btn" aria-label={t.back} onClick={()=>setSetup(null)}><ArrowLeft size={20}/></button><span className="pr-bar-title">{s.title[lang]}</span></div>
   <section className="pr-card pr-setup">
    <span className="pr-sim-icon pr-sim-icon-lg" aria-hidden="true"><Icon size={26}/></span>
    <h2>{s.title[lang]}</h2>
    <p className="pr-muted">{s.desc[lang]}</p>
    {s.modes!.map(m=><fieldset key={m.id} className="pr-modes">
     <legend>{m.label[lang]}</legend>
     <div className="pr-seg">{m.options.map(o=><button key={o.id} type="button" className={'pr-seg-btn'+(setup.mode[m.id]===o.id?' pr-seg-on':'')} aria-pressed={setup.mode[m.id]===o.id} onClick={()=>setSetup({...setup,mode:{...setup.mode,[m.id]:o.id}})}>{o.label[lang]}</button>)}</div>
    </fieldset>)}
    <button type="button" className="pr-btn pr-btn-primary pr-btn-wide" onClick={()=>start(s,setup.mode)}>{t.start}<ChevronRight size={18}/></button>
   </section>
   {footer}
  </div>;
 }

 if(run){
  const Sim=run.sim.comp;
  if(run.done)return <div className="pr" ref={topRef}>
   <div className="pr-bar"><button type="button" className="pr-icon-btn" aria-label={t.menu} onClick={()=>setRun(null)}><ArrowLeft size={20}/></button><span className="pr-bar-title">{run.sim.title[lang]}</span></div>
   <section className="pr-card pr-result" aria-live="polite">
    <span className="pr-eyebrow">{t.result}</span>
    <ScoreRing score={run.score}/>
    {run.newBest&&<span className="pr-chip pr-chip-gold"><Trophy size={14}/>{t.newBest}</span>}
    <p className="pr-result-msg">{t.msg(run.score)}</p>
    <p className="pr-muted">{t.best}: {Math.max(best[run.sim.id]??0,run.score)}/{CASES}</p>
    <div className="pr-result-actions">
     <button type="button" className="pr-btn pr-btn-primary" onClick={()=>start(run.sim,run.mode)}><RotateCcw size={18}/>{t.again}</button>
     <button type="button" className="pr-btn pr-btn-ghost" onClick={()=>setRun(null)}>{t.menu}</button>
    </div>
   </section>
   {footer}
  </div>;
  const answered=run.i+(run.fb?1:0);
  return <div className="pr" ref={topRef}>
   <div className="pr-bar">
    <button type="button" className="pr-icon-btn" aria-label={t.back} onClick={()=>setRun(null)}><ArrowLeft size={20}/></button>
    <span className="pr-bar-title">{run.sim.title[lang]}</span>
    <span className="pr-chip" aria-label={`${t.score}: ${run.score}`}><Check size={14}/>{run.score}</span>
   </div>
   <div className="pr-progress-wrap">
    <span className="pr-progress-label">{t.caseOf(run.i+1)}</span>
    <div className="pr-progress" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={CASES} aria-valuenow={answered}>
     {Array.from({length:CASES},(_,k)=><span key={k} className={'pr-progress-seg'+(k<answered?' pr-progress-done':'')+(k===run.i?' pr-progress-cur':'')}/>)}
    </div>
   </div>
   <section className="pr-card pr-run" key={run.id+'-'+run.i}>
    <Sim lang={lang} mode={run.mode} locked={!!run.fb} onAnswer={answer}/>
   </section>
   <div ref={fbRef} role="status" aria-live="polite" className="pr-fb-slot">
    {run.fb&&<div className={'pr-fb '+(run.fb.ok?'pr-fb-ok':'pr-fb-bad')}>
     <span className="pr-fb-icon" aria-hidden="true">{run.fb.ok?<Check size={20} strokeWidth={3}/>:<X size={20} strokeWidth={3}/>}</span>
     <div className="pr-fb-body">
      <strong>{run.fb.ok?t.right:t.wrong}</strong>
      <p>{run.fb.text}</p>
     </div>
    </div>}
   </div>
   {run.fb&&<button ref={nextRef} type="button" className="pr-btn pr-btn-primary pr-btn-wide pr-next" onClick={next}>{run.i+1<CASES?t.next:t.finish}<ChevronRight size={18}/></button>}
   {footer}
  </div>;
 }

 return <div className="pr" ref={topRef}>
  <header className="pr-head">
   <span className="pr-eyebrow">{t.eyebrow}</span>
   <h2 className="pr-title">{t.title}</h2>
   <p className="pr-muted">{t.lead}</p>
  </header>
  <ul className="pr-menu">
   {SIMS.map(s=>{const Icon=s.icon,b=best[s.id];
    return <li key={s.id}><button type="button" className="pr-card pr-sim" onClick={()=>open(s)}>
     <span className="pr-sim-icon" aria-hidden="true"><Icon size={22}/></span>
     <span className="pr-sim-body">
      <span className="pr-sim-title">{s.title[lang]}</span>
      <span className="pr-sim-desc">{s.desc[lang]}</span>
      <span className="pr-sim-meta">
       <span>{t.cases}</span>
       <span className={'pr-sim-best'+(b!==undefined?' pr-sim-best-on':'')}>{b!==undefined?<><Trophy size={13}/>{t.best}: {b}/{CASES}</>:t.none}</span>
      </span>
     </span>
     <ChevronRight className="pr-sim-chev" size={20} aria-hidden="true"/>
    </button></li>})}
  </ul>
  {footer}
 </div>;
}
