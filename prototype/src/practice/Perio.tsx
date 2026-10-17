import {useState} from 'react';
import {Check,X} from 'lucide-react';
import {type SimProps,Stepper,CheckButton,Figure,rint,pick,smoothOpen,smoothClosed,r1} from './shared';

type Stage=1|2|3;
const SITES=['MB','B','DB','ML','L','DL'] as const;
const INTER=[0,2,3,5];

const T={
 uz:{
  q:'Eng og‘ir interdental nuqtadagi klinik birikish yo‘qotilishini (CAL) hisoblang va parodontit bosqichini tanlang.',
  buccal:'Vestibulyar (lunj) tomoni',oral:'Oral (til) tomoni',
  pd:'PD',gm:'GM',pdFull:'Zondlash chuqurligi, mm',gmFull:'Milk qirg‘og‘i – CEJ, mm',
  sign:'GM: «+» — retsessiya (milk qirg‘og‘i CEJ dan apikalda), «−» — milk qirg‘og‘i CEJ dan koronalda. M — mezial, D — distal, B — vestibulyar, L — oral; • — interdental nuqta.',
  cal:'Interdental CAL',calSub:'mm',stage:'Bosqich',
  stShort:{1:'I',2:'II',3:'III / IV'} as Record<Stage,string>,st:{1:'I bosqich',2:'II bosqich',3:'III / IV bosqich'} as Record<Stage,string>,
  simple:'Soddalashtirilgan mashq: bosqich faqat interdental CAL bo‘yicha (AAP/EFP 2017); III va IV bosqichlar murakkablik omillari bilan farqlanadi.',
  title:'Parodont zondlash sxemasi',cej:'CEJ',
  explain:(site:string,pd:number,r:number,cal:number,st:string)=>`Eng og‘ir interdental nuqta ${site}: CAL = PD ${pd} ${r>=0?'+ retsessiya '+r:'− '+(-r)+' (milk CEJ dan koronalda)'} = ${cal} mm, demak ${st} (I: 1–2 mm, II: 3–4 mm, III/IV: ≥5 mm).`
 },
 ru:{
  q:'Рассчитайте потерю клинического прикрепления (CAL) в самой тяжёлой межзубной точке и выберите стадию пародонтита.',
  buccal:'Вестибулярная (щёчная) сторона',oral:'Оральная (язычная) сторона',
  pd:'PD',gm:'GM',pdFull:'Глубина зондирования, мм',gmFull:'Десневой край – CEJ, мм',
  sign:'GM: «+» — рецессия (край десны апикальнее CEJ), «−» — край десны коронарнее CEJ. M — мезиально, D — дистально, B — вестибулярно, L — орально; • — межзубная точка.',
  cal:'Межзубный CAL',calSub:'мм',stage:'Стадия',
  stShort:{1:'I',2:'II',3:'III / IV'} as Record<Stage,string>,st:{1:'Стадия I',2:'Стадия II',3:'Стадия III / IV'} as Record<Stage,string>,
  simple:'Упрощённое упражнение: стадия только по межзубному CAL (AAP/EFP 2017); стадии III и IV различаются по факторам сложности.',
  title:'Схема пародонтального зондирования',cej:'CEJ',
  explain:(site:string,pd:number,r:number,cal:number,st:string)=>`Самая тяжёлая межзубная точка ${site}: CAL = PD ${pd} ${r>=0?'+ рецессия '+r:'− '+(-r)+' (десна коронарнее CEJ)'} = ${cal} мм, значит ${st.toLowerCase()} (I: 1–2 мм, II: 3–4 мм, III/IV: ≥5 мм).`
 },
 en:{
  q:'Work out the clinical attachment loss (CAL) at the worst interdental site and choose the periodontitis stage.',
  buccal:'Buccal side',oral:'Lingual / palatal side',
  pd:'PD',gm:'GM',pdFull:'Probing depth, mm',gmFull:'Gingival margin – CEJ, mm',
  sign:'GM: “+” = recession (margin apical to the CEJ), “−” = margin coronal to the CEJ. M = mesial, D = distal, B = buccal, L = lingual; • = interdental site.',
  cal:'Interdental CAL',calSub:'mm',stage:'Stage',
  stShort:{1:'I',2:'II',3:'III / IV'} as Record<Stage,string>,st:{1:'Stage I',2:'Stage II',3:'Stage III / IV'} as Record<Stage,string>,
  simple:'Simplified exercise: stage from interdental CAL only (AAP/EFP 2017); stages III and IV differ by complexity factors.',
  title:'Periodontal probing diagram',cej:'CEJ',
  explain:(site:string,pd:number,r:number,cal:number,st:string)=>`Worst interdental site ${site}: CAL = PD ${pd} ${r>=0?'+ recession '+r:'− '+(-r)+' (margin coronal to the CEJ)'} = ${cal} mm, so ${st} (I: 1–2 mm, II: 3–4 mm, III/IV: ≥5 mm).`
 }
};

type Site={pd:number;r:number};
const calOf=(s:Site)=>s.pd+s.r;
const stageOf=(cal:number):Stage=>cal>=5?3:cal>=3?2:1;

function build(){
 const stage=pick([1,2,3] as Stage[]);
 const target=stage===1?rint(1,2):stage===2?rint(3,4):rint(5,8);
 const worst=pick(INTER);
 const sites:Site[]=[];
 for(let i=0;i<6;i++){
  if(i===worst){const r=rint(Math.max(-2,target-9),Math.min(3,target-1));sites.push({pd:target-r,r});continue}
  const cal=rint(Math.max(0,target-3),Math.max(0,target-1));
  // r ≤ cal−1 keeps PD = CAL − r at least 1 mm
  const r=rint(-2,Math.max(-2,Math.min(2,cal-1)));
  sites.push({pd:cal-r,r});
 }
 // trap: a deeper pocket elsewhere whose margin sits coronal to the CEJ (pseudo-pocket), so its CAL is still lower
 if(Math.random()<0.55&&target>=2){
  const others=INTER.filter(i=>i!==worst);const i=pick(others);
  const r=-rint(2,3);const cal=target-1;sites[i]={pd:cal-r,r};
 }
 const cals=sites.map(calOf);
 const maxInter=Math.max(...INTER.map(i=>cals[i]));
 const wi=INTER.find(i=>cals[i]===maxInter)!;
 return {sites,cal:maxInter,stage:stageOf(maxInter),wi};
}

const K=7,CEJ=92;
function Panel({x0,sites,mirror,label}:{x0:number;sites:Site[];mirror:boolean;label:string}){
 const cx=x0+85,cw=50,w=70;
 const xs=[cx-27,cx,cx+27];
 const order=mirror?[2,1,0]:[0,1,2]; // left-to-right site index within the panel
 const gm=order.map(k=>CEJ+sites[k].r*K),base=order.map((k,j)=>gm[j]+sites[k].pd*K);
 const crown=smoothClosed([[cx-cw/2,CEJ],[cx-w/2,CEJ-30],[cx-w/2+6,CEJ-58],[cx-12,CEJ-72],[cx,CEJ-68],[cx+12,CEJ-72],[cx+w/2-6,CEJ-58],[cx+w/2,CEJ-30],[cx+cw/2,CEJ]]);
 const root=smoothOpen([[cx-cw/2,CEJ-1],[cx-cw/2+3,CEJ+40],[cx-9,CEJ+92],[cx,CEJ+100],[cx+9,CEJ+92],[cx+cw/2-3,CEJ+40],[cx+cw/2,CEJ-1]])+'Z';
 const gmLine:[number,number][]=[[x0+4,gm[0]-6],[xs[0],gm[0]],[xs[1],gm[1]],[xs[2],gm[2]],[x0+166,gm[2]-6]];
 const crestY=base.map(b=>b+1.3*K);
 const bone=smoothOpen([[x0+2,crestY[0]-4],[xs[0],crestY[0]],[xs[1],crestY[1]],[xs[2],crestY[2]],[x0+168,crestY[2]-4]])+`L${x0+168} 250L${x0+2} 250Z`;
 const gum=smoothOpen(gmLine)+smoothOpen([[x0+168,crestY[2]+2],[xs[2],crestY[2]+6],[xs[1],crestY[1]+6],[xs[0],crestY[0]+6],[x0+2,crestY[0]+2]],true)+'Z';
 const names=order.map(k=>SITES[k+(mirror?3:0)]);
 return <g>
  <text x={cx} y={14} textAnchor="middle" className="pr-perio-head">{label}</text>
  <path d={bone} fill="#ead6ba"/>
  <path d={smoothOpen([[x0+2,crestY[0]-4],[xs[0],crestY[0]],[xs[1],crestY[1]],[xs[2],crestY[2]],[x0+168,crestY[2]-4]])} fill="none" stroke="#c9a978" strokeWidth={1.4}/>
  <path d={root} fill="#f7efdc" stroke="#d3c39c" strokeWidth={1.2}/>
  <path d={crown} fill="#ffffff" stroke="#b9c7c9" strokeWidth={1.3}/>
  <path d={gum} fill="#f19aa0" opacity={0.5}/>
  <path d={smoothOpen(gmLine)} fill="none" stroke="#d2646d" strokeWidth={2}/>
  <line x1={cx-cw/2-10} y1={CEJ} x2={cx+cw/2+10} y2={CEJ} stroke="#10254e" strokeWidth={1.2} strokeDasharray="4 3"/>
  {xs.map((x,j)=><g key={j}>
   <line x1={x} y1={gm[j]} x2={x} y2={base[j]} stroke="#9b1c26" strokeWidth={4} strokeLinecap="round"/>
   <circle cx={x} cy={base[j]} r={3.2} fill="#9b1c26"/>
   <text x={x} y={242} textAnchor="middle" className="pr-perio-site">{names[j]}{j!==1?'•':''}</text>
  </g>)}
 </g>;
}

export default function Perio({lang,locked,onAnswer}:SimProps){
 const t=T[lang];
 const [c]=useState(build);
 const [cal,setCal]=useState(0);
 const [stage,setStage]=useState<Stage|null>(null);
 const [checked,setChecked]=useState(false);
 const okCal=cal===c.cal,okStage=stage===c.stage;
 const check=()=>{if(locked||!stage)return;setChecked(true);const s=c.sites[c.wi];onAnswer(okCal&&okStage,t.explain(SITES[c.wi],s.pd,s.r,c.cal,t.st[c.stage]))};
 const fmt=(r:number)=>r>0?`+${r}`:r<0?`−${-r}`:'0';
 const table=(from:number,label:string)=><table className="pr-chart">
  <caption>{label}</caption>
  <thead><tr><th scope="col"><span className="pr-sr">mm</span></th>{[0,1,2].map(j=><th key={j} scope="col" className={INTER.includes(from+j)?'pr-inter':''}>{SITES[from+j]}{INTER.includes(from+j)?' •':''}</th>)}</tr></thead>
  <tbody>
   <tr><th scope="row" title={t.pdFull}>{t.pd}</th>{[0,1,2].map(j=><td key={j} className={checked&&from+j===c.wi?'pr-worst':''}>{c.sites[from+j].pd}</td>)}</tr>
   <tr><th scope="row" title={t.gmFull}>{t.gm}</th>{[0,1,2].map(j=><td key={j} className={checked&&from+j===c.wi?'pr-worst':''}>{fmt(c.sites[from+j].r)}</td>)}</tr>
  </tbody>
 </table>;
 return <div className="pr-case">
  <p className="pr-q">{t.q}</p>
  <Figure caption={t.simple}>
   <svg className="pr-svg" viewBox="0 0 340 250" role="img" aria-label={t.title}>
    <rect width={340} height={250} fill="#f8fbfb"/>
    <Panel x0={0} sites={c.sites.slice(0,3)} mirror={false} label={t.buccal}/>
    <Panel x0={170} sites={c.sites.slice(3,6)} mirror label={t.oral}/>
    <line x1={170} y1={22} x2={170} y2={232} stroke="#dbe8e9" strokeWidth={1}/>
    <text x={6} y={CEJ-4} className="pr-perio-cej">{t.cej}</text>
   </svg>
  </Figure>
  <div className="pr-charts">{table(0,t.buccal)}{table(3,t.oral)}</div>
  <p className="pr-note">{t.sign}</p>
  <div className="pr-perio-answer">
   <Stepper lang={lang} label={t.cal} sub={t.calSub} value={cal} onChange={setCal} max={15} locked={locked} state={checked?(okCal?'ok':'bad'):undefined} solution={c.cal}/>
   <div className="pr-seg-wrap">
    <span className="pr-step-label" id="pr-stage-label">{t.stage}</span>
    <div className="pr-seg" role="radiogroup" aria-labelledby="pr-stage-label">
     {([1,2,3] as Stage[]).map(s=>{
      const st=checked?(s===c.stage?' pr-seg-ok':s===stage?' pr-seg-bad':''):'';
      return <button key={s} type="button" role="radio" aria-checked={stage===s} className={'pr-seg-btn'+(stage===s?' pr-seg-on':'')+st} disabled={locked} onClick={()=>setStage(s)}>
       {checked&&s===c.stage&&<Check size={14} strokeWidth={3}/>}{checked&&s===stage&&s!==c.stage&&<X size={14} strokeWidth={3}/>}{t.stShort[s]}
      </button>})}
    </div>
   </div>
  </div>
  {!locked&&<CheckButton lang={lang} onClick={check} disabled={!stage}/>}
 </div>;
}
