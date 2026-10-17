import {useId,useState,type ReactNode} from 'react';
import {type SimProps,Options,Figure,rnd,pick,shuffle,smoothOpen,smoothClosed,r1} from './shared';

type Depth='enamel'|'outer'|'deep'|'pulp';
type Cls='I'|'II'|'III'|'IV'|'V'|'VI';
const DEPTHS:Depth[]=['enamel','outer','deep','pulp'];

const T={
 uz:{
  qDepth:'Karies qaysi chuqurlikkacha yetgan?',
  qClass:'Ushbu karies Black tasnifi bo‘yicha qaysi sinfga kiradi?',
  d:{enamel:'Faqat emal',outer:'Dentinning tashqi qismi',deep:'Chuqur dentin (pulpaga yaqin)',pulp:'Pulpa ochilgan'},
  de:{
   enamel:'Shikastlanish emal-dentin chegarasiga yetmagan, ya’ni faqat emal ichida — bu boshlang‘ich (emal) kariesi.',
   outer:'Karies emal-dentin chegarasidan o‘tib, dentinning tashqi uchdan bir qismigacha tarqalgan — o‘rta chuqurlikdagi karies.',
   deep:'Karies dentinning ichki qismigacha yetgan, lekin pulpa ustida yupqa dentin qatlami saqlangan — chuqur karies.',
   pulp:'Karies o‘chog‘i pulpa kamerasiga tutashgan, ya’ni pulpa ochilgan — bu pulpani davolashni talab qiladi.'
  },
  cls:(c:Cls)=>`${c} sinf`,
  ce:{
   I:'I sinf — molyar va premolyarlarning chaynov yuzasidagi, shuningdek lunj/til yuzalaridagi chuqurcha va fissuralar kariesi.',
   II:'II sinf — premolyar va molyarlarning kontakt (proksimal) yuzasidagi karies.',
   III:'III sinf — kesuvchi va qoziq tishlarning kontakt yuzasidagi, kesuvchi burchakni qamramagan karies.',
   IV:'IV sinf — kesuvchi va qoziq tishlarning kontakt yuzasidagi, kesuvchi burchakni ham qamragan karies.',
   V:'V sinf — har qanday tishning lunj/lab yoki til yuzasining bo‘yin (cervikal) uchdan bir qismidagi karies.',
   VI:'VI sinf — kesuvchi qirra yoki do‘mboqcha uchidagi karies (Black tasnifiga keyinroq qo‘shilgan).'
  },
  cap:{molarSec:'Molyar, vertikal kesim (okklyuzion fissura)',incSec:'Kesuvchi tish, lab–til yo‘nalishidagi kesim',ant:'Yuqori old tishlar, lab (vestibulyar) yuzasi',post:'Yuqori chaynov tishlari, lunj yuzasi',occ:'Pastki molyar, chaynov (okklyuzion) yuzasi'},
  lg:{e:'Emal',d:'Dentin',p:'Pulpa',c:'Karies'},
  title:'Tishning sxematik tasviri',sides:['Lab','Til'] as [string,string]
 },
 ru:{
  qDepth:'До какой глубины распространился кариес?',
  qClass:'К какому классу по Блэку относится этот кариес?',
  d:{enamel:'Только эмаль',outer:'Наружный слой дентина',deep:'Глубокий дентин (вблизи пульпы)',pulp:'Вскрытие пульпы'},
  de:{
   enamel:'Поражение не достигает эмалево-дентинной границы, то есть ограничено эмалью — начальный (эмалевый) кариес.',
   outer:'Кариес прошёл эмалево-дентинную границу и занимает наружную треть дентина — средний кариес.',
   deep:'Кариес достигает внутренних слоёв дентина, но над пульпой сохранён тонкий слой дентина — глубокий кариес.',
   pulp:'Кариозный очаг сообщается с полостью пульпы, то есть пульпа вскрыта — требуется лечение пульпы.'
  },
  cls:(c:Cls)=>`${c} класс`,
  ce:{
   I:'I класс — кариес ямок и фиссур жевательной поверхности моляров и премоляров, а также ямок щёчной и язычной поверхностей.',
   II:'II класс — кариес контактных (проксимальных) поверхностей премоляров и моляров.',
   III:'III класс — кариес контактных поверхностей резцов и клыков без вовлечения режущего угла.',
   IV:'IV класс — кариес контактных поверхностей резцов и клыков с вовлечением режущего угла.',
   V:'V класс — кариес пришеечной трети вестибулярной или оральной поверхности любых зубов.',
   VI:'VI класс — кариес режущего края или вершины бугра (добавлен к классификации Блэка позже).'
  },
  cap:{molarSec:'Моляр, вертикальный срез (окклюзионная фиссура)',incSec:'Резец, вестибуло-оральный срез',ant:'Верхние фронтальные зубы, вестибулярная поверхность',post:'Верхние жевательные зубы, щёчная поверхность',occ:'Нижний моляр, жевательная (окклюзионная) поверхность'},
  lg:{e:'Эмаль',d:'Дентин',p:'Пульпа',c:'Кариес'},
  title:'Схематичное изображение зуба',sides:['Губа','Язык'] as [string,string]
 },
 en:{
  qDepth:'How deep has this carious lesion progressed?',
  qClass:'Which G.V. Black class is this lesion?',
  d:{enamel:'Enamel only',outer:'Outer dentin',deep:'Deep dentin (close to the pulp)',pulp:'Pulp exposure'},
  de:{
   enamel:'The lesion has not reached the dentino-enamel junction, so it is confined to enamel: an early enamel lesion.',
   outer:'The lesion has crossed the dentino-enamel junction into the outer third of dentin: a moderate (outer dentin) lesion.',
   deep:'The lesion reaches the inner dentin but a thin layer of dentin still covers the pulp: a deep lesion.',
   pulp:'The lesion communicates with the pulp chamber, i.e. the pulp is exposed and needs pulp therapy.'
  },
  cls:(c:Cls)=>`Class ${c}`,
  ce:{
   I:'Class I: pits and fissures, mainly on occlusal surfaces of premolars and molars, and buccal or lingual pits.',
   II:'Class II: proximal surfaces of premolars and molars.',
   III:'Class III: proximal surfaces of incisors and canines without the incisal angle.',
   IV:'Class IV: proximal surfaces of incisors and canines including the incisal angle.',
   V:'Class V: the cervical third of the facial or lingual surface of any tooth.',
   VI:'Class VI: incisal edges or cusp tips (a later addition to Black’s classification).'
  },
  cap:{molarSec:'Molar, vertical section (occlusal fissure)',incSec:'Incisor, labio-lingual section',ant:'Upper anterior teeth, labial surface',post:'Upper posterior teeth, buccal surface',occ:'Lower molar, occlusal surface'},
  lg:{e:'Enamel',d:'Dentin',p:'Pulp',c:'Caries'},
  title:'Schematic tooth drawing',sides:['Labial','Lingual'] as [string,string]
 }
};

const COL={en:'#fbf8ef',enS:'#cfc4a8',de:'#efd9a2',pu:'#ec9b9b',puS:'#cf6f72',halo:'#c9934f',core:'#5a3218',gum:'#f1b7b9',gumS:'#d98d92',bone:'#efe4d7'};
type Pt=[number,number];

/** Lesion outline from a depth profile [(u, half-width)], mapped to the picture by `map(u,v)`. */
function lesion(profile:[number,number][],map:(u:number,v:number)=>Pt):string{
 const left=profile.map(([u,h])=>map(u,-h)),right=[...profile].reverse().map(([u,h])=>map(u,h));
 const pts=[...left,...right.slice(1)];
 return smoothClosed(pts);
}
function profileFor(kind:'pit'|'smooth',d:Depth,uD:number,uP:number,sp:number):[number,number][]{
 const uE=d==='enamel'?uD*rnd(0.5,0.78):d==='outer'?uD+(uP-uD)*rnd(0.2,0.36):d==='deep'?uD+(uP-uD)*rnd(0.74,0.84):uP+6;
 if(d==='enamel')return kind==='pit'?[[-8,2],[0,4],[uE*0.65,5.5],[uE,0]]:[[-1,9],[uE*0.55,6],[uE,0]];
 return kind==='pit'
  ?[[-8,2],[0,4],[uD*0.7,6.5],[uD+1,sp],[uD+(uE-uD)*0.5,sp*0.8],[uE-3,sp*0.32],[uE,0]]
  :[[-1,10],[uD*0.75,6],[uD+0.5,5.5],[uD+(uE-uD)*0.38,sp*0.6],[uE-3,4.5],[uE,0]];
}
const halo=(p:[number,number][],d:Depth):[number,number][]=>p.map(([u,h],i)=>[i===p.length-1?u+(d==='pulp'?0:4):u,h*1.3+2.2]);

function Legend({lang}:{lang:keyof typeof T}){
 const t=T[lang].lg;
 return <ul className="pr-legend pr-legend-row" aria-hidden="true">
  {[[COL.en,t.e,COL.enS],[COL.de,t.d,'#c9ae6a'],[COL.pu,t.p,COL.puS],[COL.core,t.c,COL.core]].map(([c,l,s])=><li key={l}><i style={{background:c,borderColor:s}}/>{l}</li>)}
 </ul>;
}

/* ---------- sections for depth questions ---------- */
function MolarSection({depth,title}:{depth:Depth;title:string}){
 const id=useId().replace(/:/g,'');
 const outer:Pt[]=[[85,150],[71,118],[72,88],[82,62],[98,48],[116,52],[132,61],[141,66],[147,76],[150,82],[153,76],[159,66],[168,61],[184,52],[202,48],[218,62],[228,88],[229,118],[215,150]];
 const dejCrown:Pt[]=[[85,150],[83,118],[86,92],[94,78],[104,72],[118,78],[134,89],[150,96],[166,89],[182,78],[196,72],[206,78],[214,92],[217,118],[215,150]];
 const roots:Pt[]=[[211,194],[203,236],[193,247],[183,238],[175,196],[160,181],[150,178],[140,181],[125,196],[117,238],[107,247],[97,236],[89,194]];
 const pulp:Pt[]=[[113,150],[108,128],[110,110],[120,124],[136,133],[150,136],[164,133],[180,124],[190,110],[192,128],[187,150],[170,160],[150,163],[130,160]];
 const uD=14,uP=54,sp=rnd(13,19);
 const prof=profileFor('pit',depth,uD,uP,sp);
 const map=(u:number,v:number):Pt=>[150+v,82+u];
 const dentin=smoothOpen([...dejCrown,...roots])+'Z';
 const hard=smoothClosed([...outer.slice(0,-1),...roots]);
 return <svg className="pr-svg" viewBox="0 0 300 255" role="img" aria-label={title}>
  <defs><clipPath id={`${id}h`}><path d={hard}/>{depth==='pulp'&&<path d={smoothClosed(pulp)}/>}</clipPath></defs>
  <path d="M0 176 Q60 168 150 172 T300 176 V255 H0Z" fill={COL.bone}/>
  <path d="M0 150 Q40 138 74 142 L226 142 Q262 138 300 150 V180 Q240 172 150 176 T0 180Z" fill={COL.gum} opacity={0.75}/>
  <path d={smoothClosed(outer)} fill={COL.en} stroke={COL.enS} strokeWidth={1.4}/>
  <path d={dentin} fill={COL.de} stroke="#d4b672" strokeWidth={1}/>
  <path d={smoothClosed(pulp)} fill={COL.pu} stroke={COL.puS} strokeWidth={1}/>
  <path d="M118 158 Q112 200 107 240 M182 158 Q188 200 193 240" stroke={COL.pu} strokeWidth={5.5} strokeLinecap="round" fill="none"/>
  <g clipPath={`url(#${id}h)`}>
   <path d={lesion(halo(prof,depth),map)} fill={COL.halo} opacity={0.55}/>
   <path d={lesion(prof,map)} fill={COL.core}/>
  </g>
  {depth==='pulp'&&<circle cx={150} cy={82+uP+2} r={4} fill="#b5262b" stroke="#fff" strokeWidth={1}/>}
 </svg>;
}

function IncisorSection({depth,title,sides}:{depth:Depth;title:string;sides:[string,string]}){
 const id=useId().replace(/:/g,'');
 const tt=(y:number)=>Math.min(1,Math.max(0,(y-22)/128));
 const oL=(y:number)=>146-48*Math.sin(tt(y)*Math.PI/2);
 const oR=(y:number)=>154+44*Math.sin(tt(y)*Math.PI/2)+9*Math.exp(-(((tt(y)-0.8)/0.13)**2));
 const eL=(y:number)=>15*(1-tt(y)**5),eR=(y:number)=>11*(1-tt(y)**5);
 const pc=(y:number)=>150+2*tt(y);
 const phw=(y:number)=>y<150?1.5+11*Math.max(0,Math.min(1,(y-62)/88))**0.8:1.2+11.3*(1-(y-150)/96);
 const rs=(y:number)=>49*((y-150)/96)**1.6;
 const ys=(a:number,b:number,st=4)=>{const r:number[]=[];for(let y=a;y<=b;y+=st)r.push(y);if(r[r.length-1]!==b)r.push(b);return r};
 const outer:Pt[]=[...ys(28,150).reverse().map(y=>[oL(y),y] as Pt),[147,22],[153,22],...ys(28,150).map(y=>[oR(y),y] as Pt)];
 const root:Pt[]=[...ys(154,240,6).map(y=>[198-rs(y),y] as Pt),[150,247],...ys(154,240,6).reverse().map(y=>[98+rs(y),y] as Pt)];
 const dejL=ys(40,150).map(y=>[oL(y)+eL(y),y] as Pt),dejR=ys(40,150).map(y=>[oR(y)-eR(y),y] as Pt);
 const dentin=smoothOpen([...dejL.reverse(),[150,35],...dejR,...root])+'Z';
 const pulpPts:Pt[]=[...ys(64,238,6).map(y=>[pc(y)-phw(y),y] as Pt),[150,243],...ys(64,238,6).reverse().map(y=>[pc(y)+phw(y),y] as Pt),[151,58]];
 const yL=r1(rnd(112,124)),sx=oL(yL),uD=eL(yL),uP=(pc(yL)-phw(yL))-sx;
 const prof=profileFor('smooth',depth,uD,uP,rnd(15,20));
 const map=(u:number,v:number):Pt=>[sx+u,yL+v];
 const hard=smoothOpen([...outer,...root])+'Z';
 return <svg className="pr-svg" viewBox="0 0 300 255" role="img" aria-label={title}>
  <defs><clipPath id={`${id}h`}><path d={hard}/>{depth==='pulp'&&<path d={smoothClosed(pulpPts)}/>}</clipPath></defs>
  <path d="M0 178 Q80 170 150 174 T300 178 V255 H0Z" fill={COL.bone}/>
  <path d="M0 150 Q50 140 92 146 L204 146 Q250 140 300 150 V182 Q230 174 150 178 T0 182Z" fill={COL.gum} opacity={0.75}/>
  <path d={hard} fill={COL.en} stroke={COL.enS} strokeWidth={1.4}/>
  <path d={dentin} fill={COL.de} stroke="#d4b672" strokeWidth={1}/>
  <path d={smoothClosed(pulpPts)} fill={COL.pu} stroke={COL.puS} strokeWidth={1}/>
  <g clipPath={`url(#${id}h)`}>
   <path d={lesion(halo(prof,depth),map)} fill={COL.halo} opacity={0.55}/>
   <path d={lesion(prof,map)} fill={COL.core}/>
  </g>
  {depth==='pulp'&&<circle cx={sx+uP+3} cy={yL} r={4} fill="#b5262b" stroke="#fff" strokeWidth={1}/>}
  <text x={40} y={120} textAnchor="middle" className="pr-svg-note">{sides[0]}</text>
  <text x={262} y={120} textAnchor="middle" className="pr-svg-note">{sides[1]}</text>
 </svg>;
}

/* ---------- surface views for Black class ---------- */
type SKind='ci'|'li'|'ca'|'pm'|'mo';
type STooth={kind:SKind;cx:number;w:number;h:number};
const CERV=36;
function outline(t:STooth):Pt[]{
 const {cx,w,h,kind}=t,cw=w*(kind==='mo'?0.82:0.72),y0=CERV,y=(f:number)=>y0+h*f;
 let p:Pt[];
 if(kind==='ci'||kind==='li')p=[[-cw/2,y(0)],[-w/2+1,y(0.45)],[-w/2,y(0.8)],[-w/2+3,y(0.98)],[0,y(1)],[w/2-6,y(0.97)],[w/2-1,y(0.78)],[w/2,y(0.45)],[cw/2,y(0)]];
 else if(kind==='ca')p=[[-cw/2,y(0)],[-w/2,y(0.45)],[-w/2+2,y(0.72)],[-w*0.18,y(0.92)],[0,y(1)],[w*0.2,y(0.9)],[w/2-1,y(0.66)],[w/2,y(0.42)],[cw/2,y(0)]];
 else if(kind==='pm')p=[[-cw/2,y(0)],[-w/2,y(0.42)],[-w/2+1,y(0.66)],[-w*0.2,y(0.9)],[0,y(1)],[w*0.22,y(0.88)],[w/2-1,y(0.64)],[w/2,y(0.42)],[cw/2,y(0)]];
 else p=[[-cw/2,y(0)],[-w/2,y(0.4)],[-w/2+1,y(0.7)],[-w*0.38,y(0.92)],[-w*0.22,y(1)],[-w*0.06,y(0.9)],[0,y(0.86)],[w*0.06,y(0.9)],[w*0.24,y(0.99)],[w*0.4,y(0.9)],[w/2-1,y(0.68)],[w/2,y(0.4)],[cw/2,y(0)]];
 return p.map(([x,yy])=>[cx+x,yy]);
}
type Spot={kind:'ell';cx:number;cy:number;rx:number;ry:number}|{kind:'chip';t:number;side:number};
type ClassCase={view:'ant'|'post'|'occ';teeth:STooth[];target:number;cls:Cls;spot:Spot|null};

function buildClass():ClassCase{
 const cls=pick<Cls>(['I','II','III','IV','V','VI']);
 const ant=cls==='III'||cls==='IV'||((cls==='V'||cls==='VI')&&Math.random()<0.5);
 if(cls==='I'&&Math.random()<0.6)return {view:'occ',teeth:[],target:0,cls,spot:null};
 if(ant){
  const teeth:STooth[]=[];let x=rnd(14,26);
  for(const k of ['ca','li','ci','ci','li'] as SKind[]){const w=k==='ci'?rnd(52,56):k==='li'?rnd(42,45):rnd(46,49);const h=k==='ci'?rnd(80,86):k==='li'?rnd(70,75):rnd(82,88);teeth.push({kind:k,cx:x+w/2,w,h});x+=w+0.5}
  let ti=pick([1,2,3,4]);if(cls==='VI'&&Math.random()<0.35)ti=0;
  const t=teeth[ti],side=pick([-1,1]);
  let spot:Spot;
  if(cls==='III')spot={kind:'ell',cx:t.cx+side*(t.w/2-1),cy:CERV+t.h*rnd(0.42,0.52),rx:10,ry:12};
  else if(cls==='IV')spot={kind:'chip',t:ti,side};
  else if(cls==='V')spot={kind:'ell',cx:t.cx,cy:CERV+15,rx:t.w*0.3,ry:6};
  else spot={kind:'ell',cx:t.cx+(t.kind==='ca'?0:rnd(-5,5)),cy:CERV+t.h-2.5,rx:t.kind==='ca'?5:7,ry:4.5};
  return {view:'ant',teeth,target:ti,cls,spot};
 }
 const teeth:STooth[]=[];let x=rnd(8,20);
 for(const k of ['pm','pm','mo','mo'] as SKind[]){const w=k==='pm'?rnd(46,50):rnd(70,74);const h=k==='pm'?rnd(62,66):rnd(56,60);teeth.push({kind:k,cx:x+w/2,w,h});x+=w+0.5}
 const ti=cls==='I'?pick([2,3]):pick([1,2]);const t=teeth[ti],side=pick([-1,1]);
 let spot:Spot;
 if(cls==='I')spot={kind:'ell',cx:t.cx,cy:CERV+t.h*0.58,rx:4.5,ry:5};
 else if(cls==='II')spot={kind:'ell',cx:t.cx+side*(t.w/2-1),cy:CERV+t.h*rnd(0.6,0.7),rx:10,ry:11};
 else if(cls==='V')spot={kind:'ell',cx:t.cx,cy:CERV+14,rx:t.w*0.3,ry:6};
 else{const cusp=t.kind==='pm'?0:pick([-0.22,0.24]);spot={kind:'ell',cx:t.cx+t.w*cusp,cy:CERV+t.h-2.5,rx:6,ry:4.5}}
 return {view:'post',teeth,target:ti,cls,spot};
}

function SurfaceView({c,title}:{c:ClassCase;title:string}){
 const id=useId().replace(/:/g,'');
 const W=300,H=150;
 const gum=():string=>{
  let d=`M-5 0 L${W+5} 0 L${W+5} ${CERV+6}`;
  const ts=[...c.teeth].reverse();
  ts.forEach((t,i)=>{
   const r=t.cx+t.w/2,l=t.cx-t.w/2,pap=CERV+t.h*(t.kind==='mo'||t.kind==='pm'?0.22:0.26);
   if(i===0)d+=`L${r1(r+8)} ${CERV+6}`;
   d+=`Q${r1(r-2)} ${r1(pap*0.92)} ${r1(r-t.w*0.12)} ${r1(CERV+12)}Q${r1(t.cx)} ${CERV+3} ${r1(l+t.w*0.12)} ${r1(CERV+12)}`;
   const nx=ts[i+1];const pap2=nx?CERV+Math.min(t.h,nx.h)*0.24:CERV+8;
   d+=`Q${r1(l+2)} ${r1(pap2*0.95)} ${r1(l)} ${r1(nx?pap2:CERV+8)}`;
  });
  return d+`L-5 ${CERV+6}Z`;
 };
 const tgt=c.teeth[c.target];
 return <svg className="pr-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
  <defs>{c.teeth.map((t,i)=><clipPath key={i} id={`${id}c${i}`}><path d={smoothOpen(outline(t))+'Z'}/></clipPath>)}</defs>
  <rect width={W} height={H} fill="#f6fafa"/>
  {c.teeth.map((t,i)=>{
   const o=outline(t);
   return <g key={i}>
    <path d={smoothOpen(o)+'Z'} fill="#fffdf6" stroke="#c9bfa5" strokeWidth={1.4}/>
    <path d={smoothOpen(o.map(([x,y])=>[t.cx+(x-t.cx)*0.55,CERV+(y-CERV)*0.86] as Pt))} fill="none" stroke="#efe8d6" strokeWidth={5} strokeLinecap="round" opacity={0.9}/>
    {t.kind==='mo'&&<path d={`M${r1(t.cx)} ${r1(CERV+t.h*0.86)}L${r1(t.cx)} ${r1(CERV+t.h*0.58)}`} stroke="#d8ccae" strokeWidth={1.4}/>}
   </g>})}
  {c.spot&&c.spot.kind==='ell'&&<g clipPath={`url(#${id}c${c.target})`}>
   <ellipse cx={c.spot.cx} cy={c.spot.cy} rx={c.spot.rx*1.5} ry={c.spot.ry*1.45} fill="#d7b07c" opacity={0.75}/>
   <ellipse cx={c.spot.cx} cy={c.spot.cy} rx={c.spot.rx} ry={c.spot.ry} fill={COL.core}/>
  </g>}
  {c.spot&&c.spot.kind==='chip'&&(()=>{const t=tgt,sd=c.spot.side,cx=t.cx+sd*(t.w/2),cy=CERV+t.h;
   return <g>
    <g clipPath={`url(#${id}c${c.target})`}>
     <ellipse cx={cx-sd*6} cy={cy-11} rx={19} ry={20} fill="#d7b07c" opacity={0.75}/>
     <ellipse cx={cx-sd*4} cy={cy-8} rx={12.5} ry={13} fill={COL.core}/>
    </g>
    <path d={`M${r1(cx+sd*2)} ${r1(cy-9)}Q${r1(cx-sd*4)} ${r1(cy-4)} ${r1(cx-sd*9)} ${r1(cy+3)}L${r1(cx+sd*4)} ${r1(cy+4)}Z`} fill="#f6fafa"/>
   </g>})()}
  <path d={gum()} fill={COL.gum} stroke={COL.gumS} strokeWidth={1.2}/>
 </svg>;
}

function OcclusalMolar({title}:{title:string}){
 const cx=150,cy=100,w=rnd(150,160),h=rnd(124,132);
 const o=smoothClosed([[cx-w/2,cy-h*0.1],[cx-w*0.42,cy-h*0.45],[cx-w*0.2,cy-h/2],[cx+w*0.05,cy-h*0.47],[cx+w*0.3,cy-h*0.5],[cx+w*0.47,cy-h*0.36],[cx+w/2,cy+h*0.05],[cx+w*0.44,cy+h*0.42],[cx+w*0.2,cy+h/2],[cx-w*0.1,cy+h*0.47],[cx-w*0.36,cy+h*0.48],[cx-w*0.49,cy+h*0.25]]);
 const fiss=`M${r1(cx-w*0.36)} ${r1(cy+2)}C${r1(cx-w*0.2)} ${r1(cy-6)} ${r1(cx+w*0.05)} ${r1(cy+8)} ${r1(cx+w*0.36)} ${r1(cy-2)}M${r1(cx-w*0.1)} ${r1(cy)}L${r1(cx-w*0.16)} ${r1(cy-h*0.36)}M${r1(cx+w*0.14)} ${r1(cy+2)}L${r1(cx+w*0.2)} ${r1(cy+h*0.38)}M${r1(cx+w*0.24)} ${r1(cy)}L${r1(cx+w*0.32)} ${r1(cy-h*0.3)}`;
 const lesionAt=pick([[cx-w*0.1,cy+0.5],[cx+w*0.14,cy+3],[cx-w*0.28,cy-1]] as Pt[]);
 return <svg className="pr-svg" viewBox="0 0 300 200" role="img" aria-label={title}>
  <rect width={300} height={200} fill="#f6fafa"/>
  <path d={o} fill="#fffdf6" stroke="#c9bfa5" strokeWidth={1.6}/>
  <path d={smoothClosed([[cx-w*0.32,cy-4],[cx-w*0.2,cy-h*0.3],[cx+w*0.25,cy-h*0.3],[cx+w*0.34,cy],[cx+w*0.22,cy+h*0.3],[cx-w*0.25,cy+h*0.3]])} fill="#f4eedf"/>
  <path d={fiss} fill="none" stroke="#bfae84" strokeWidth={2.4} strokeLinecap="round"/>
  <path d={fiss} fill="none" stroke="#8a5a2c" strokeWidth={1.4} strokeLinecap="round" opacity={0.55}/>
  <ellipse cx={lesionAt[0]} cy={lesionAt[1]} rx={13} ry={10} fill="#d7b07c" opacity={0.8}/>
  <ellipse cx={lesionAt[0]} cy={lesionAt[1]} rx={7} ry={5.5} fill={COL.core}/>
 </svg>;
}

export default function Caries({lang,locked,onAnswer}:SimProps){
 const t=T[lang];
 const [c]=useState(()=>{
  if(Math.random()<0.5){
   const depth=pick(DEPTHS),tooth=pick(['molar','incisor'] as const);
   return {type:'depth' as const,depth,tooth,opts:DEPTHS as string[],correct:depth as string};
  }
  const cc=buildClass();
  const pool:Cls[]=cc.view==='ant'?['III','IV','V','VI']:['I','II','V','VI'];
  return {type:'class' as const,cc,opts:shuffle(pool) as string[],correct:cc.cls as string};
 });
 const [picked,setPicked]=useState<string|null>(null);
 const answer=(id:string)=>{if(locked)return;setPicked(id);onAnswer(id===c.correct,c.type==='depth'?t.de[c.depth]:t.ce[c.cc.cls])};
 let fig:ReactNode,cap:string;
 if(c.type==='depth'){fig=c.tooth==='molar'?<MolarSection depth={c.depth} title={t.title}/>:<IncisorSection depth={c.depth} title={t.title} sides={t.sides}/>;cap=c.tooth==='molar'?t.cap.molarSec:t.cap.incSec}
 else{fig=c.cc.view==='occ'?<OcclusalMolar title={t.title}/>:<SurfaceView c={c.cc} title={t.title}/>;cap=t.cap[c.cc.view]}
 return <div className="pr-case">
  <p className="pr-q">{c.type==='depth'?t.qDepth:t.qClass}</p>
  <Figure caption={cap}>{fig}{c.type==='depth'&&<Legend lang={lang}/>}</Figure>
  <Options cols={c.type==='depth'?1:2} options={c.opts.map(o=>({id:o,label:c.type==='depth'?t.d[o as Depth]:t.cls(o as Cls)}))} correct={c.correct} picked={picked} locked={locked} onPick={answer}/>
 </div>;
}
