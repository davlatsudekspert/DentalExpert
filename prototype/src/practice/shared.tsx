import {type ReactNode,type MouseEvent,type KeyboardEvent,useRef} from 'react';
import {Check,X,Minus,Plus} from 'lucide-react';

export type Lang='uz'|'ru'|'en';
export type Tr<T>={uz:T;ru:T;en:T};

/** Props every simulator receives. A simulator draws one case; Practice remounts it (new key) for the next case. */
export type SimProps={
 lang:Lang;
 mode:Record<string,string>;
 /** True once the learner has answered this case: inputs are frozen and the solution is shown. */
 locked:boolean;
 onAnswer:(ok:boolean,explanation:string)=>void;
};

/* ---------- randomness ---------- */
export const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
export const rint=(a:number,b:number)=>Math.floor(a+Math.random()*(b-a+1));
export const pick=<T,>(arr:readonly T[]):T=>arr[Math.floor(Math.random()*arr.length)];
export function shuffle<T>(src:readonly T[]):T[]{const a=[...src];for(let j=a.length-1;j>0;j--){const r=Math.floor(Math.random()*(j+1));[a[j],a[r]]=[a[r],a[j]]}return a}
/** n distinct random items from arr (without the excluded ones). */
export function sample<T>(arr:readonly T[],n:number,exclude:readonly T[]=[]):T[]{return shuffle(arr.filter(x=>!exclude.includes(x))).slice(0,n)}

/* ---------- path helpers ---------- */
export const r1=(n:number)=>Math.round(n*10)/10;
type P=[number,number];
/** Closed Catmull-Rom spline through the points, as an SVG path. */
export function smoothClosed(pts:P[],k=1):string{
 const n=pts.length;let d=`M${r1(pts[0][0])} ${r1(pts[0][1])}`;
 for(let i=0;i<n;i++){
  const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  const c1:P=[p1[0]+(p2[0]-p0[0])/6*k,p1[1]+(p2[1]-p0[1])/6*k],c2:P=[p2[0]-(p3[0]-p1[0])/6*k,p2[1]-(p3[1]-p1[1])/6*k];
  d+=`C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
 }
 return d+'Z';
}
/** Open Catmull-Rom spline through the points (no leading M when cont=true, to append to a path). */
export function smoothOpen(pts:P[],cont=false,k=1):string{
 const n=pts.length;let d=cont?`L${r1(pts[0][0])} ${r1(pts[0][1])}`:`M${r1(pts[0][0])} ${r1(pts[0][1])}`;
 for(let i=0;i<n-1;i++){
  const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)];
  const c1:P=[p1[0]+(p2[0]-p0[0])/6*k,p1[1]+(p2[1]-p0[1])/6*k],c2:P=[p2[0]-(p3[0]-p1[0])/6*k,p2[1]-(p3[1]-p1[1])/6*k];
  d+=`C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
 }
 return d;
}

/* ---------- shared UI ---------- */
const ui={
 uz:{check:'Tekshirish',minus:'Kamaytirish',plus:'Ko‘paytirish'},
 ru:{check:'Проверить',minus:'Уменьшить',plus:'Увеличить'},
 en:{check:'Check',minus:'Decrease',plus:'Increase'}
};
export const uiText=(lang:Lang)=>ui[lang];

export type Opt={id:string;label:ReactNode;aria?:string};
/** Answer buttons. After locking, the right one turns green and a wrong pick turns red. */
export function Options({options,correct,picked,locked,onPick,cols=2}:{options:Opt[];correct:string;picked:string|null;locked:boolean;onPick:(id:string)=>void;cols?:1|2|3}){
 return <div className={`pr-opts pr-opts-${cols}`}>
  {options.map((o,i)=>{
   const st=locked?(o.id===correct?' pr-opt-ok':o.id===picked?' pr-opt-bad':' pr-opt-dim'):'';
   return <button key={o.id} type="button" className={'pr-opt'+st} disabled={locked} aria-label={o.aria} aria-pressed={picked===o.id} onClick={()=>onPick(o.id)}>
    <span className="pr-opt-key" aria-hidden="true">{locked&&o.id===correct?<Check size={14} strokeWidth={3}/>:locked&&o.id===picked?<X size={14} strokeWidth={3}/>:String.fromCharCode(65+i)}</span>
    <span className="pr-opt-text">{o.label}</span>
   </button>})}
 </div>;
}

/** − value + counter with 44px buttons. `state` colours it after checking; `solution` shows the right value. */
export function Stepper({lang,label,sub,value,onChange,min=0,max=28,locked,state,solution,tone}:{lang:Lang;label:string;sub?:string;value:number;onChange:(v:number)=>void;min?:number;max?:number;locked:boolean;state?:'ok'|'bad';solution?:number;tone?:string}){
 const t=ui[lang];
 return <div className={'pr-step'+(state?' pr-step-'+state:'')}>
  <div className="pr-step-head">
   <span className="pr-step-label" style={tone?{color:tone}:undefined}>{label}</span>
   {sub&&<span className="pr-step-sub">{sub}</span>}
  </div>
  <div className="pr-step-row">
   <button type="button" className="pr-step-btn" aria-label={`${label}: ${t.minus}`} disabled={locked||value<=min} onClick={()=>onChange(value-1)}><Minus size={18}/></button>
   <output className="pr-step-val" aria-live="polite" aria-label={label}>{value}</output>
   <button type="button" className="pr-step-btn" aria-label={`${label}: ${t.plus}`} disabled={locked||value>=max} onClick={()=>onChange(value+1)}><Plus size={18}/></button>
  </div>
  {state==='bad'&&solution!==undefined&&<span className="pr-step-sol">→ {solution}</span>}
 </div>;
}

export function CheckButton({lang,onClick,disabled}:{lang:Lang;onClick:()=>void;disabled?:boolean}){
 return <button type="button" className="pr-btn pr-btn-primary pr-btn-wide" disabled={disabled} onClick={onClick}>{ui[lang].check}</button>;
}

/** Wraps the generated picture: rounded frame + optional caption badge. */
export function Figure({children,caption,dark,badge}:{children:ReactNode;caption?:ReactNode;dark?:boolean;badge?:ReactNode}){
 return <figure className={'pr-fig'+(dark?' pr-fig-dark':'')}>
  {badge&&<span className="pr-fig-badge">{badge}</span>}
  {children}
  {caption&&<figcaption className="pr-fig-cap">{caption}</figcaption>}
 </figure>;
}

/* ---------- dental arch (occlusal view) ---------- */
export type ToothKind='inc'|'can'|'pm'|'mol';
export type ArchTooth={num:number;q:number;p:number;upper:boolean;primary:boolean;x:number;y:number;rot:number;w:number;d:number;kind:ToothKind};
// Mesio-distal and bucco-lingual crown sizes, mm (index = position 1..8 from the midline).
const PW_U=[8.5,6.5,7.5,7,6.5,10,9,8.5],PW_L=[5.2,5.7,7,7,7.1,11,10.5,10];
const PD_U=[7,6.2,8,9,9,11,11,10.5],PD_L=[6,6.2,7.6,7.8,8.2,10.5,10.2,9.8];
const DW_U=[6.5,5.2,7,7.3,8.2],DW_L=[4.2,4.8,5.2,7.7,9.9];
const DD_U=[5.2,4.6,6.2,8,9.2],DD_L=[4.4,4.4,5.6,7.4,8.8];
const kindOf=(p:number,primary:boolean):ToothKind=>p<=2?'inc':p===3?'can':primary?'mol':p<=5?'pm':'mol';

export type ArchLayout={teeth:ArchTooth[];w:number;h:number;midY:number;upperCenter:number;lowerCenter:number};
/** Positions all teeth of both arches along elliptical curves. Patient's right is on the viewer's left (FDI quadrants 1 and 4). */
export function archLayout(primary:boolean,withThirds=true):ArchLayout{
 const W=360,a=primary?112:140,b=primary?100:138,phiMax=95*Math.PI/180,m=primary?30:26,gap=primary?64:72;
 const back=m+b*(1-Math.cos(phiMax));
 const topY=m,botY=back+gap+b*(1-Math.cos(phiMax)),H=botY+m;
 // arc-length table
 const N=400,len:number[]=[0];
 for(let i=1;i<=N;i++){const f0=(i-1)/N*phiMax,f1=i/N*phiMax;len.push(len[i-1]+Math.hypot(a*(Math.sin(f1)-Math.sin(f0)),b*(Math.cos(f0)-Math.cos(f1))))}
 const L=len[N];
 const at=(s:number)=>{let i=1;while(i<N&&len[i]<s)i++;const fr=(s-len[i-1])/((len[i]-len[i-1])||1);return ((i-1)+fr)/N*phiMax};
 const teeth:ArchTooth[]=[];
 const n=primary?5:8;
 for(const upper of [true,false]){
  const ws=primary?(upper?DW_U:DW_L):(upper?PW_U:PW_L),ds=primary?(upper?DD_U:DD_L):(upper?PD_U:PD_L);
  const used=!withThirds&&!primary?ws.slice(0,7):ws;
  const total=used.reduce((x,y)=>x+y,0)+0.35*used.length;
  const s=L/total;
  for(const side of [-1,1]){
   // side -1 = viewer's left = patient's right
   const q=primary?(upper?(side<0?5:6):(side<0?8:7)):(upper?(side<0?1:2):(side<0?4:3));
   let cum=0.2;
   for(let i=0;i<n;i++){
    const p=i+1;const wmm=ws[i];
    const sc=(cum+wmm/2)*s;cum+=wmm+0.35;
    if(!withThirds&&!primary&&p===8)continue;
    const phi=at(sc);
    const x=W/2+side*a*Math.sin(phi);
    const y=upper?topY+b*(1-Math.cos(phi)):botY-b*(1-Math.cos(phi));
    const dx=side*a*Math.cos(phi),dy=(upper?1:-1)*b*Math.sin(phi);
    const rot=Math.atan2(dy,dx)*180/Math.PI;
    teeth.push({num:q*10+p,q,p,upper,primary,x,y,rot,w:wmm*s*0.93,d:ds[i]*s,kind:kindOf(p,primary)});
   }
  }
 }
 const midY=(back+back+gap)/2;
 return {teeth,w:W,h:H,midY,upperCenter:topY+b*0.62,lowerCenter:botY-b*0.62};
}

/** Occlusal outline of one tooth in local coordinates (x along the arch, y bucco-lingual). */
export function occPath(kind:ToothKind,w:number,d:number):string{
 const hw=w/2,hd=d/2;
 if(kind==='inc'){ // thin, labially convex blade
  return smoothClosed([[-hw,-hd*0.15],[-hw*0.6,-hd*0.85],[0,-hd],[hw*0.6,-hd*0.85],[hw,-hd*0.15],[hw*0.55,hd*0.7],[0,hd*0.95],[-hw*0.55,hd*0.7]]);
 }
 if(kind==='can'){
  return smoothClosed([[-hw,0],[-hw*0.5,-hd*0.9],[0,-hd],[hw*0.5,-hd*0.9],[hw,0],[hw*0.45,hd*0.9],[0,hd],[-hw*0.45,hd*0.9]]);
 }
 if(kind==='pm'){
  return smoothClosed([[-hw,-hd*0.3],[-hw*0.75,-hd*0.92],[0,-hd],[hw*0.75,-hd*0.92],[hw,-hd*0.3],[hw,hd*0.35],[hw*0.65,hd*0.92],[0,hd],[-hw*0.65,hd*0.92],[-hw,hd*0.35]]);
 }
 return smoothClosed([[-hw,-hd*0.55],[-hw*0.82,-hd*0.95],[-hw*0.2,-hd],[hw*0.35,-hd*0.98],[hw*0.9,-hd*0.85],[hw,-hd*0.2],[hw*0.97,hd*0.55],[hw*0.8,hd*0.95],[0,hd],[-hw*0.75,hd*0.95],[-hw*0.98,hd*0.5]]);
}
/** Fissure / groove lines for the occlusal view. */
export function occDetail(kind:ToothKind,w:number,d:number):string{
 const hw=w/2,hd=d/2;
 if(kind==='pm')return `M${r1(-hw*0.45)} ${r1(hd*0.05)}Q0 ${r1(hd*0.18)} ${r1(hw*0.45)} ${r1(hd*0.05)}`;
 if(kind==='mol')return `M${r1(-hw*0.55)} ${r1(-hd*0.05)}Q${r1(-hw*0.1)} ${r1(hd*0.12)} ${r1(hw*0.55)} ${r1(-hd*0.02)}M${r1(-hw*0.08)} ${r1(hd*0.06)}L${r1(-hw*0.15)} ${r1(-hd*0.6)}M${r1(hw*0.2)} ${r1(hd*0.04)}L${r1(hw*0.3)} ${r1(hd*0.62)}`;
 if(kind==='can')return `M0 ${r1(-hd*0.55)}L0 ${r1(hd*0.15)}`;
 return '';
}

/** Both arches. Children are drawn per tooth by `render`; `onTap` turns the picture into a big-target tap surface (nearest tooth wins). */
export function Arches({layout,render,onTap,toothLabel,upperLabel,lowerLabel,title,activeTap=true,children}:{layout:ArchLayout;children?:ReactNode;render:(t:ArchTooth)=>ReactNode;onTap?:(num:number)=>void;toothLabel?:(t:ArchTooth)=>string;upperLabel:string;lowerLabel:string;title:string;activeTap?:boolean}){
 const ref=useRef<SVGSVGElement>(null);
 const tap=(e:MouseEvent<SVGSVGElement>)=>{
  if(!onTap||!activeTap||!ref.current)return;
  const ctm=ref.current.getScreenCTM();if(!ctm)return;
  const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());
  let best:ArchTooth|null=null,bd=1e9;
  for(const t of layout.teeth){const dd=Math.hypot(t.x-pt.x,t.y-pt.y);if(dd<bd){bd=dd;best=t}}
  if(best&&bd<34)onTap(best.num);
 };
 const key=(e:KeyboardEvent,num:number)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTap?.(num)}};
 const {w,h}=layout;
 return <svg ref={ref} className={'pr-svg pr-arch'+(onTap&&activeTap?' pr-arch-tap':'')} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title} onClick={tap}>
  <line x1={w/2} y1={6} x2={w/2} y2={h-6} stroke="#c5dadb" strokeWidth={1} strokeDasharray="4 5"/>
  <line x1={20} y1={layout.midY} x2={w-20} y2={layout.midY} stroke="#d6e5e6" strokeWidth={1} strokeDasharray="2 6"/>
  <text x={w/2} y={layout.upperCenter} className="pr-arch-jaw" textAnchor="middle">{upperLabel}</text>
  <text x={w/2} y={layout.lowerCenter} className="pr-arch-jaw" textAnchor="middle">{lowerLabel}</text>
  {layout.teeth.map(t=>{
   const interactive=!!onTap&&activeTap;
   return <g key={t.num} className={'pr-tooth'+(interactive?' pr-tooth-btn':'')} transform={`translate(${r1(t.x)} ${r1(t.y)}) rotate(${r1(t.rot)})`}
    {...(interactive?{role:'button',tabIndex:0,'aria-label':toothLabel?.(t),onKeyDown:(e:KeyboardEvent)=>key(e,t.num)}:{})}>
    {interactive&&<circle className="pr-tooth-hit" r={28}/>}{/* invisible ≥44 CSS px tap area (SVG groups have no pseudo-elements); the svg-level tap still picks the nearest tooth */}
    {render(t)}
   </g>})}
  {children}
 </svg>;
}
