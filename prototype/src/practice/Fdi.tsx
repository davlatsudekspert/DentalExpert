import {useMemo,useState} from 'react';
import {type SimProps,type Lang,type ArchTooth,archLayout,Arches,occPath,occDetail,Options,Figure,pick,shuffle,r1} from './shared';

const T={
 uz:{
  qName:'Ajratilgan tishning FDI raqami qaysi?',
  qTap:(n:number)=>`${n}-tishni toping va ustiga bosing`,
  tapHint:'Tish ustiga bosing (yoki Tab va Enter)',
  right:'Bemorning o‘ngi',left:'Bemorning chapi',
  upper:'Yuqori jag‘',lower:'Pastki jag‘',
  title:'Tish qatorlari sxemasi',
  perm:['markaziy kesuvchi tish','lateral kesuvchi tish','qoziq tish','birinchi premolyar','ikkinchi premolyar','birinchi molyar','ikkinchi molyar','uchinchi molyar (aql tishi)'],
  prim:['markaziy kesuvchi sut tishi','lateral kesuvchi sut tishi','qoziq sut tishi','birinchi sut molyari','ikkinchi sut molyari'],
  quad:{1:'yuqori o‘ng',2:'yuqori chap',3:'pastki chap',4:'pastki o‘ng'} as Record<number,string>,
  explain:(n:number,q:number,qn:string,p:number,name:string,prim:boolean)=>`${n}: birinchi raqam ${q} — ${qn} kvadrant${prim?' (sut tishlari 5–8)':''}, ikkinchi raqam ${p} — o‘rta chiziqdan ${p}-tish, ya’ni ${name}.`,
  youTapped:(n:number)=>`Siz ${n}-tishni bosdingiz. `,
  toothAria:(qn:string,p:number)=>`${qn} kvadrant, o‘rta chiziqdan ${p}-tish`,
  permN:'Doimiy tishlar (32)',primN:'Sut tishlari (20)'
 },
 ru:{
  qName:'Какой номер FDI у выделенного зуба?',
  qTap:(n:number)=>`Найдите и нажмите зуб ${n}`,
  tapHint:'Нажмите на зуб (или Tab и Enter)',
  right:'Справа у пациента',left:'Слева у пациента',
  upper:'Верхняя челюсть',lower:'Нижняя челюсть',
  title:'Схема зубных рядов',
  perm:['центральный резец','латеральный резец','клык','первый премоляр','второй премоляр','первый моляр','второй моляр','третий моляр (зуб мудрости)'],
  prim:['временный центральный резец','временный латеральный резец','временный клык','первый временный моляр','второй временный моляр'],
  quad:{1:'верхний правый',2:'верхний левый',3:'нижний левый',4:'нижний правый'} as Record<number,string>,
  explain:(n:number,q:number,qn:string,p:number,name:string,prim:boolean)=>`${n}: первая цифра ${q} — ${qn} квадрант${prim?' (временные зубы 5–8)':''}, вторая цифра ${p} — ${p}-й зуб от средней линии, то есть ${name}.`,
  youTapped:(n:number)=>`Вы нажали зуб ${n}. `,
  toothAria:(qn:string,p:number)=>`${qn} квадрант, ${p}-й зуб от средней линии`,
  permN:'Постоянные зубы (32)',primN:'Временные зубы (20)'
 },
 en:{
  qName:'What is the FDI number of the highlighted tooth?',
  qTap:(n:number)=>`Find and tap tooth ${n}`,
  tapHint:'Tap a tooth (or use Tab and Enter)',
  right:'Patient’s right',left:'Patient’s left',
  upper:'Upper jaw',lower:'Lower jaw',
  title:'Dental arch diagram',
  perm:['central incisor','lateral incisor','canine','first premolar','second premolar','first molar','second molar','third molar (wisdom tooth)'],
  prim:['primary central incisor','primary lateral incisor','primary canine','primary first molar','primary second molar'],
  quad:{1:'upper right',2:'upper left',3:'lower left',4:'lower right'} as Record<number,string>,
  explain:(n:number,q:number,qn:string,p:number,name:string,prim:boolean)=>`${n}: the first digit ${q} is the ${qn} quadrant${prim?' (primary teeth use 5–8)':''} and the second digit ${p} means tooth ${p} counted from the midline, the ${name}.`,
  youTapped:(n:number)=>`You tapped tooth ${n}. `,
  toothAria:(qn:string,p:number)=>`${qn} quadrant, tooth ${p} from the midline`,
  permN:'Permanent teeth (32)',primN:'Primary teeth (20)'
 }
};

const baseQ=(q:number)=>q>4?q-4:q;
function describe(lang:Lang,num:number){
 const t=T[lang],q=Math.floor(num/10),p=num%10,prim=q>4;
 const name=prim?t.prim[p-1]:t.perm[p-1];
 return t.explain(num,q,t.quad[baseQ(q)],p,name,prim);
}
/** Typical confusions: mirror across the midline, the opposite jaw, the diagonal quadrant, a neighbouring tooth. */
function distractors(num:number,primary:boolean):number[]{
 const q=Math.floor(num/10),p=num%10,b=primary?4:0,bq=q-b,n=primary?5:8;
 const mirror={1:2,2:1,3:4,4:3}[bq]!,opp={1:4,4:1,2:3,3:2}[bq]!,diag={1:3,3:1,2:4,4:2}[bq]!;
 const cand=[(mirror+b)*10+p,(opp+b)*10+p,(diag+b)*10+p];
 if(p>1)cand.push(q*10+p-1);if(p<n)cand.push(q*10+p+1);
 const first=shuffle(cand.slice(0,2));
 const rest=shuffle(cand.slice(2));
 return [...new Set([first[0],...rest,first[1]])].slice(0,3);
}

export default function Fdi({lang,mode,locked,onAnswer}:SimProps){
 const t=T[lang];
 const primary=mode.dent==='prim';
 const layout=useMemo(()=>archLayout(primary),[primary]);
 const [c]=useState(()=>{
  const target=pick(layout.teeth).num;
  const task=mode.task==='mix'?pick(['name','tap'] as const):(mode.task==='tap'?'tap':'name');
  const opts=shuffle([target,...distractors(target,primary)]);
  return {target,task,opts};
 });
 const [picked,setPicked]=useState<string|null>(null);
 const [tapped,setTapped]=useState<number|null>(null);

 const answerName=(id:string)=>{if(locked)return;setPicked(id);onAnswer(id===String(c.target),describe(lang,c.target))};
 const answerTap=(num:number)=>{if(locked)return;setTapped(num);onAnswer(num===c.target,(num===c.target?'':t.youTapped(num))+describe(lang,c.target))};

 const highlight=(tt:ArchTooth)=>{
  if(c.task==='name')return tt.num===c.target?'target':'';
  if(!locked)return '';
  if(tt.num===c.target)return 'ok';
  if(tt.num===tapped)return 'bad';
  return '';
 };
 const label=(tt:ArchTooth)=>t.toothAria(t.quad[baseQ(tt.q)],tt.p);
 const shown=c.task==='name'?(locked?[c.target]:[]):(locked?[c.target,...(tapped&&tapped!==c.target?[tapped]:[])]:[]);

 return <div className="pr-case">
  <p className="pr-q">{c.task==='name'?t.qName:t.qTap(c.target)}</p>
  <Figure badge={primary?t.primN:t.permN} caption={c.task==='tap'&&!locked?t.tapHint:undefined}>
   <div className="pr-sides" aria-hidden="true"><span>← {t.right}</span><span>{t.left} →</span></div>
   <Arches layout={layout} title={t.title} upperLabel={t.upper} lowerLabel={t.lower}
    onTap={c.task==='tap'?answerTap:undefined} activeTap={!locked} toothLabel={label}
    render={tt=>{
     const h=highlight(tt);
     const fill=h==='target'?'#168d8b':h==='ok'?'#1f9e74':h==='bad'?'#c0392b':'#ffffff';
     const stroke=h?'#0f5f5d':'#9fb6bb';
     return <>
      {h==='target'&&<circle r={Math.max(tt.w,tt.d)*0.78} className="pr-pulse" fill="none" stroke="#168d8b" strokeWidth={2.5}/>}
      <path className="pr-tshape" d={occPath(tt.kind,tt.w,tt.d)} fill={fill} stroke={h==='bad'?'#8e2a1f':stroke} strokeWidth={1.3}/>
      <path d={occDetail(tt.kind,tt.w,tt.d)} fill="none" stroke={h?'rgba(255,255,255,.55)':'#c9d8da'} strokeWidth={1.1} strokeLinecap="round"/>
     </>;
    }}>
    {shown.map(n=>{const tt=layout.teeth.find(x=>x.num===n)!;
     // label just inside the arch (towards the palate / tongue)
     const cx=layout.w/2,cy=tt.upper?layout.upperCenter-40:layout.lowerCenter+40;
     const dx=cx-tt.x,dy=cy-tt.y,dl=Math.hypot(dx,dy)||1,off=Math.max(tt.d,tt.w)*0.5+15;
     const lx=tt.x+dx/dl*off,ly=tt.y+dy/dl*off;
     const ok=n===c.target;
     return <g key={'l'+n} className="pr-pop">
      <rect x={r1(lx-17)} y={r1(ly-11)} width={34} height={22} rx={11} fill={ok?'#10254e':'#c0392b'}/>
      <text x={r1(lx)} y={r1(ly+5)} textAnchor="middle" className="pr-arch-num">{n}</text>
     </g>})}
   </Arches>
  </Figure>
  {c.task==='name'&&<Options cols={2} options={c.opts.map(n=>({id:String(n),label:<span className="pr-num">{n}</span>}))} correct={String(c.target)} picked={picked} locked={locked} onPick={answerName}/>}
 </div>;
}
