import {useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {Seg,Sources,type L,type Lang,type ToolProps} from './shared';

/* ------------------------------------------------------------------ data
 * Eruption ranges: American Dental Association eruption charts (primary and permanent).
 * Root completion: chronology table of Logan & Kronfeld (1933), slightly modified by McCall & Schour,
 * as reproduced in Wheeler’s Dental Anatomy, Physiology and Occlusion.
 * All ages in YEARS; [lo,hi]. Typical values, individual variation is normal.
 */
type Range=[number,number];
type Row={erupt:Range;root:Range;shed?:Range};
type Dent='perm'|'prim';

const m=(a:number,b:number):Range=>[a/12,b/12];
const DATA:Record<Dent,{upper:Row[];lower:Row[]}>={
 perm:{
  upper:[
   {erupt:[7,8],root:[10,10]},{erupt:[8,9],root:[11,11]},{erupt:[11,12],root:[13,15]},{erupt:[10,11],root:[12,13]},
   {erupt:[10,12],root:[12,14]},{erupt:[6,7],root:[9,10]},{erupt:[12,13],root:[14,16]},{erupt:[17,21],root:[18,25]}],
  lower:[
   {erupt:[6,7],root:[9,9]},{erupt:[7,8],root:[10,10]},{erupt:[9,10],root:[12,14]},{erupt:[10,12],root:[12,13]},
   {erupt:[11,12],root:[13,14]},{erupt:[6,7],root:[9,10]},{erupt:[11,13],root:[14,15]},{erupt:[17,21],root:[18,25]}],
 },
 prim:{
  upper:[
   {erupt:m(8,12),root:[1.5,1.5],shed:[6,7]},{erupt:m(9,13),root:[2,2],shed:[7,8]},{erupt:m(16,22),root:[3.25,3.25],shed:[10,12]},
   {erupt:m(13,19),root:[2.5,2.5],shed:[9,11]},{erupt:m(25,33),root:[3,3],shed:[10,12]}],
  lower:[
   {erupt:m(6,10),root:[1.5,1.5],shed:[6,7]},{erupt:m(10,16),root:[1.5,1.5],shed:[7,8]},{erupt:m(17,23),root:[3.25,3.25],shed:[9,12]},
   {erupt:m(14,18),root:[2.25,2.25],shed:[9,11]},{erupt:m(23,31),root:[3,3],shed:[10,12]}],
 },
};

/* approximate mesiodistal crown widths (mm) — only used to space the drawing */
const WIDTH:Record<Dent,{upper:number[];lower:number[]}>={
 perm:{upper:[8.5,6.5,7.5,7,6.5,10,9,8.5],lower:[5,5.5,7,7,7,11,10.5,10]},
 prim:{upper:[6.5,5.2,7,7.3,8.2],lower:[4.2,4.1,5,7.7,9.9]},
};

const NAMES:Record<Dent,L[]>={
 perm:[
  {uz:'Markaziy kurak tish',ru:'Центральный резец',en:'Central incisor'},
  {uz:'Yon kurak tish',ru:'Боковой резец',en:'Lateral incisor'},
  {uz:'Qoziq tish',ru:'Клык',en:'Canine'},
  {uz:'Birinchi kichik oziq tish',ru:'Первый премоляр',en:'First premolar'},
  {uz:'Ikkinchi kichik oziq tish',ru:'Второй премоляр',en:'Second premolar'},
  {uz:'Birinchi katta oziq tish',ru:'Первый моляр',en:'First molar'},
  {uz:'Ikkinchi katta oziq tish',ru:'Второй моляр',en:'Second molar'},
  {uz:'Uchinchi katta oziq tish (aql tishi)',ru:'Третий моляр (зуб мудрости)',en:'Third molar (wisdom tooth)'}],
 prim:[
  {uz:'Markaziy kurak tish',ru:'Центральный резец',en:'Central incisor'},
  {uz:'Yon kurak tish',ru:'Боковой резец',en:'Lateral incisor'},
  {uz:'Qoziq tish',ru:'Клык',en:'Canine'},
  {uz:'Birinchi oziq tish',ru:'Первый моляр',en:'First molar'},
  {uz:'Ikkinchi oziq tish',ru:'Второй моляр',en:'Second molar'}],
};

const QUAD:Record<number,L>={
 1:{uz:'Yuqori jag‘, o‘ng tomon',ru:'Верхняя челюсть, справа',en:'Upper right'},
 2:{uz:'Yuqori jag‘, chap tomon',ru:'Верхняя челюсть, слева',en:'Upper left'},
 3:{uz:'Pastki jag‘, chap tomon',ru:'Нижняя челюсть, слева',en:'Lower left'},
 4:{uz:'Pastki jag‘, o‘ng tomon',ru:'Нижняя челюсть, справа',en:'Lower right'},
};

const T={
 uz:{
  perm:'Doimiy tishlar',prim:'Sut tishlari',dent:'Tishlar to‘plami',
  hint:'Tishni bosing: chiqish va ildiz shakllanishi muddatlari ko‘rinadi.',
  upper:'Yuqori jag‘',lower:'Pastki jag‘',right:'O‘ng',left:'Chap',patient:'bemorning o‘ng va chap tomoni',
  erupt:'Chiqishi',root:'Ildiz shakllanib bo‘ladi',shed:'Tushishi (almashinuvi)',
  chart:(j:string)=>`Muddatlar jadvali: ${j}`,
  axis:'yosh',prev:'Oldingi tish',next:'Keyingi tish',
  typical:'Ko‘rsatilgan yoshlar odatiy oraliqlar; individual farqlar me’yor hisoblanadi. Qizlarda doimiy tishlar odatda biroz ertaroq chiqadi.',
  src:'Manbalar',
 },
 ru:{
  perm:'Постоянные зубы',prim:'Временные зубы',dent:'Прикус',
  hint:'Нажмите на зуб, чтобы увидеть сроки прорезывания и завершения формирования корня.',
  upper:'Верхняя челюсть',lower:'Нижняя челюсть',right:'Пр.',left:'Лев.',patient:'правая и левая сторона пациента',
  erupt:'Прорезывание',root:'Формирование корня завершено',shed:'Смена (выпадение)',
  chart:(j:string)=>`Хронология: ${j.toLowerCase()}`,
  axis:'лет',prev:'Предыдущий зуб',next:'Следующий зуб',
  typical:'Указаны типичные возрастные диапазоны; индивидуальные отклонения являются нормой. У девочек постоянные зубы обычно прорезываются несколько раньше.',
  src:'Источники',
 },
 en:{
  perm:'Permanent teeth',prim:'Primary teeth',dent:'Dentition',
  hint:'Tap a tooth to see its eruption and root completion ages.',
  upper:'Upper jaw',lower:'Lower jaw',right:'R',left:'L',patient:'patient’s right and left',
  erupt:'Eruption',root:'Root completed',shed:'Exfoliation',
  chart:(j:string)=>`Chronology: ${j.toLowerCase()}`,
  axis:'years',prev:'Previous tooth',next:'Next tooth',
  typical:'Ages are typical ranges; individual variation is normal. Permanent teeth usually erupt slightly earlier in girls.',
  src:'Sources',
 },
};

/* ------------------------------------------------------------------ formatting */
const FR:Record<string,string>={'0.25':'¼','0.5':'½','0.75':'¾'};
function num(x:number,lang:Lang){
 const w=Math.floor(x),f=Math.round((x-w)*100)/100;
 if(f===0)return String(w);
 const s=FR[String(f)];
 return s?(w?w+s:s):(lang==='en'?String(x):String(x).replace('.',','));
}
function years(r:Range,lang:Lang){
 const s=r[0]===r[1]?num(r[0],lang):`${num(r[0],lang)}–${num(r[1],lang)}`;
 if(lang==='uz')return `${s} yosh`;
 if(lang==='ru')return `${s} ${r[1]<5?'года':'лет'}`;
 return `${s} ${r[0]===r[1]&&r[0]===1?'year':'years'}`;
}
function months(r:Range,lang:Lang){
 const s=`${Math.round(r[0]*12)}–${Math.round(r[1]*12)}`;
 return lang==='uz'?`${s} oy`:lang==='ru'?`${s} мес.`:`${s} months`;
}
const eruptText=(d:Dent,r:Range,lang:Lang)=>d==='prim'?months(r,lang):years(r,lang);

/* ------------------------------------------------------------------ geometry */
type Pos={x:number;y:number;ang:number;w:number};
const VBW=340;
/** Lay teeth of one half-arch along an elliptical arc, spaced by arc length. */
function halfArch(widths:number[],cy:number,dir:1|-1,a:number,b:number):Pos[]{
 const PHI=Math.PI*0.56,N=400;
 const pts:{x:number;y:number;s:number}[]=[];let s=0;
 for(let i=0;i<=N;i++){
  const p=PHI*i/N,x=a*Math.sin(p),y=b*(1-Math.cos(p));
  if(i)s+=Math.hypot(x-pts[i-1].x,y-pts[i-1].y);
  pts.push({x,y,s});
 }
 const L=s,gap=1.2,total=widths.reduce((q,w)=>q+w+gap,0),k=L/total;
 let acc=0;
 return widths.map(w=>{
  const mid=(acc+(w+gap)/2)*k;acc+=w+gap;
  let j=pts.findIndex(p=>p.s>=mid);if(j<1)j=1;
  const p=pts[j],q=pts[j-1];
  const ang=Math.atan2(p.y-q.y,p.x-q.x);
  return {x:p.x,y:cy+dir*p.y,ang:dir===1?ang:-ang,w:w*k};
 });
}

type Sel={dent:Dent;q:number;n:number};

function ArchSvg({dent,sel,onSel,lang}:{dent:Dent;sel:Sel;onSel:(s:Sel)=>void;lang:Lang}){
 const t=T[lang];
 const geo=useMemo(()=>{
  const a=dent==='perm'?118:96,b=dent==='perm'?150:104;
  const up=halfArch(WIDTH[dent].upper,22,1,a,b),lo=halfArch(WIDTH[dent].lower,(dent==='perm'?410:322)-22,-1,a*0.93,b*0.95);
  return {up,lo,h:dent==='perm'?410:322};
 },[dent]);
 const cx=VBW/2;
 const items:{q:number;n:number;p:Pos;side:1|-1}[]=[];
 geo.up.forEach((p,i)=>{items.push({q:1,n:i+1,p,side:-1});items.push({q:2,n:i+1,p,side:1})});
 geo.lo.forEach((p,i)=>{items.push({q:4,n:i+1,p,side:-1});items.push({q:3,n:i+1,p,side:1})});
 const off=dent==='prim'?4:0;
 const depthFor=(n:number)=>dent==='perm'?(n<=3?13:n<=5?17:21):(n<=3?12:18);
 return <svg className="tl-arch" viewBox={`0 0 ${VBW} ${geo.h}`} role="group" aria-label={`${t.upper} / ${t.lower}`}>
  <line x1={cx} x2={cx} y1={8} y2={geo.h-8} stroke="#d5e6e7" strokeDasharray="3 5"/>
  <text x={cx} y={geo.h/2-6} textAnchor="middle" className="tl-arch-jaw">{t.upper}</text>
  <text x={cx} y={geo.h/2+14} textAnchor="middle" className="tl-arch-jaw">{t.lower}</text>
  <text x={14} y={geo.h/2+4} className="tl-arch-side" aria-label={t.patient}>{t.right}</text>
  <text x={VBW-14} y={geo.h/2+4} textAnchor="end" className="tl-arch-side">{t.left}</text>
  {items.map(({q,n,p,side})=>{
   const x=cx+side*p.x,y=p.y,ang=(side===1?p.ang:-p.ang)*180/Math.PI;
   const d=depthFor(n),fdi=`${q+off}${n}`;
   const on=sel.dent===dent&&sel.q===q&&sel.n===n;
   // label outward along the normal
   const upper=q<=2,nx=-Math.sin(side===1?p.ang:-p.ang)*(upper?1:1),ny=Math.cos(side===1?p.ang:-p.ang);
   const sgn=upper?-1:1,lx=x+nx*sgn*(d/2+12)*1,ly=y+ny*sgn*(d/2+12);
   const name=NAMES[dent][n-1][lang];
   return <g key={fdi} className={'tl-tooth'+(on?' tl-tooth-on':'')} role="button" tabIndex={0} aria-pressed={on} aria-label={`${fdi}, ${name}`}
     onClick={()=>onSel({dent,q,n})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSel({dent,q,n})}}}>
    <circle cx={(x+lx)/2} cy={(y+ly)/2} r={Math.max(23,p.w/2+6)} fill="transparent"/>
    <rect x={x-p.w/2+0.8} y={y-d/2} width={p.w-1.6} height={d} rx={Math.min(7,p.w/3)} transform={`rotate(${ang} ${x} ${y})`} className="tl-tooth-body"/>
    <text x={lx} y={ly+4} textAnchor="middle" className="tl-tooth-num">{fdi}</text>
   </g>;
  })}
 </svg>;
}

function Timeline({row,max}:{row:Row;max:number}){
 const pct=(v:number)=>`${Math.min(100,v/max*100)}%`;
 const bar=(r:Range,cls:string)=>r[0]===r[1]
  ?<span className={'tl-tbar tl-tbar-dot '+cls} style={{left:pct(r[0])}}/>
  :<span className={'tl-tbar '+cls} style={{left:pct(r[0]),width:pct(r[1]-r[0])}}/>;
 return <div className="tl-track" aria-hidden="true">
  {bar(row.erupt,'tl-tbar-erupt')}
  {bar(row.root,'tl-tbar-root')}
  {row.shed&&bar(row.shed,'tl-tbar-shed')}
 </div>;
}

export default function Eruption({lang}:ToolProps){
 const t=T[lang];
 const [dent,setDent]=useState<Dent>('perm');
 const [sel,setSel]=useState<Sel>({dent:'perm',q:1,n:6});
 const cur=sel.dent===dent?sel:{dent,q:1,n:dent==='perm'?6:1};
 const jaw=cur.q<=2?'upper':'lower';
 const row=DATA[dent][jaw][cur.n-1];
 const off=dent==='prim'?4:0;
 const fdi=`${cur.q+off}${cur.n}`;
 const count=dent==='perm'?8:5;
 const max=dent==='perm'?25:13;
 const ticks=dent==='perm'?[0,5,10,15,20,25]:[0,2,4,6,8,10,12];
 // FDI order around the mouth: 18→11, 21→28, 38→31, 41→48
 const order:Sel[]=[];
 for(let n=count;n>=1;n--)order.push({dent,q:1,n});for(let n=1;n<=count;n++)order.push({dent,q:2,n});
 for(let n=count;n>=1;n--)order.push({dent,q:3,n});for(let n=1;n<=count;n++)order.push({dent,q:4,n});
 const idx=order.findIndex(o=>o.q===cur.q&&o.n===cur.n);
 const go=(d:number)=>setSel(order[(idx+d+order.length)%order.length]);
 const legend=<div className="tl-legend">
  <span><i className="tl-sw tl-sw-erupt"/>{t.erupt}</span>
  <span><i className="tl-sw tl-sw-root"/>{t.root}</span>
  {dent==='prim'&&<span><i className="tl-sw tl-sw-shed"/>{t.shed}</span>}
 </div>;

 return <div className="tl-stack">
  <Seg label={t.dent} value={dent} options={[{id:'perm',label:t.perm},{id:'prim',label:t.prim}]} onChange={d=>{setDent(d);setSel({dent:d,q:1,n:d==='perm'?6:1})}}/>
  <section className="tl-card tl-arch-card">
   <p className="tl-muted tl-center">{t.hint}</p>
   <ArchSvg dent={dent} sel={cur} onSel={setSel} lang={lang}/>
  </section>

  <section className="tl-card tl-tooth-card" aria-live="polite">
   <div className="tl-tooth-head">
    <button type="button" className="tl-icon-btn" aria-label={t.prev} onClick={()=>go(-1)}><ChevronLeft size={20}/></button>
    <div className="tl-tooth-title">
     <span className="tl-fdi">{fdi}</span>
     <div><strong>{NAMES[dent][cur.n-1][lang]}</strong><small>{QUAD[cur.q][lang]}</small></div>
    </div>
    <button type="button" className="tl-icon-btn" aria-label={t.next} onClick={()=>go(1)}><ChevronRight size={20}/></button>
   </div>
   <dl className="tl-facts">
    <div className="tl-fact tl-fact-erupt"><dt>{t.erupt}</dt><dd>{eruptText(dent,row.erupt,lang)}</dd></div>
    <div className="tl-fact tl-fact-root"><dt>{t.root}</dt><dd>{years(row.root,lang)}</dd></div>
    {row.shed&&<div className="tl-fact tl-fact-shed"><dt>{t.shed}</dt><dd>{years(row.shed,lang)}</dd></div>}
   </dl>
  </section>

  <section className="tl-card">
   <h3 className="tl-h3">{t.chart(jaw==='upper'?t.upper:t.lower)}</h3>
   {legend}
   <div className="tl-chart">
    <div className="tl-chart-axis" aria-hidden="true"><span/>
     <div className="tl-axis">{ticks.map(v=><span key={v} style={{left:`${v/max*100}%`}}>{v}</span>)}</div>
    </div>
    {Array.from({length:count},(_,i)=>{
     const r=DATA[dent][jaw][i],n=i+1,on=cur.n===n;
     return <button key={n} type="button" className={'tl-chart-row'+(on?' tl-chart-on':'')} aria-pressed={on} onClick={()=>setSel({dent,q:cur.q,n})}
       aria-label={`${cur.q+off}${n} ${NAMES[dent][i][lang]}: ${t.erupt} ${eruptText(dent,r.erupt,lang)}, ${t.root} ${years(r.root,lang)}`}>
      <span className="tl-chart-num">{cur.q+off}{n}</span>
      <Timeline row={r} max={max}/>
     </button>;
    })}
    <p className="tl-axis-unit">{t.axis}</p>
   </div>
   <p className="tl-muted tl-small">{t.typical}</p>
  </section>

  <Sources label={t.src} items={[
   'American Dental Association. Eruption charts: primary and permanent teeth (eruption and exfoliation ranges).',
   'Logan WHG, Kronfeld R. Development of the human jaws and surrounding structures from birth to the age of fifteen years. J Am Dent Assoc. 1933;20:379–427; slightly modified by McCall JO, Schour I.',
   'Nelson SJ. Wheeler’s Dental Anatomy, Physiology and Occlusion. Elsevier. Chronology tables of the primary and permanent dentitions (root completion).',
  ]}/>
 </div>;
}
