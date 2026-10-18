import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,MessageSquareText,X} from 'lucide-react';
import cutaway from '../assets/tooth3d/premium-reference-cutaway-ivory.webp';
import front from '../assets/tooth3d/turntable-front.webp';
import occlusal from '../assets/tooth3d/archive-occlusal.webp';
import {tx,type Anchor,type L,type Slide} from './curriculumData';
import type {Lang} from './discoveryData';

const IMAGES={cutaway,front,occlusal};
// Marker positions (percent of the square picture) — the validator in tools/curriculum.py lists the same names.
const ANCHORS:Record<keyof typeof IMAGES,Partial<Record<Anchor,[number,number]>>>={
 cutaway:{crown:[30,22],enamel:[62,19],dentin:[72,32],pulp:[62,40],canal:[66,72],root:[30,72],cej:[25,48],apex:[64,92]},
 front:{crown:[45,28],cusp:[50,9],cej:[50,51],root:[40,75],furcation:[60,60],apex:[52,94]},
 occlusal:{cusp:[25,25],fissure:[38,51],fossa:[53,51],ridge:[50,88]}
};
const words={
 uz:{prev:'Oldingi',next:'Keyingi',close:'Yopish',notes:'Ustoz izohi',slide:'Slayd'},
 ru:{prev:'Назад',next:'Далее',close:'Закрыть',notes:'Заметка преподавателя',slide:'Слайд'},
 en:{prev:'Previous',next:'Next',close:'Close',notes:'Teacher note',slide:'Slide'}
};

/** Full-screen lecture player for curriculum topics. Diagrams are drawn natively so every language stays sharp. */
export default function Slides({title,eyebrow,slides,lang,teacher=false,accent,start=0,onProgress,onClose,onFinished}:{title:string;eyebrow?:string;slides:Slide[];lang:Lang;teacher?:boolean;accent?:string;start?:number;onProgress?:(i:number)=>void;onClose:()=>void;onFinished?:()=>void}){
 const t=words[lang];
 const [i,setI]=useState(()=>Math.max(0,Math.min(slides.length-1,start)));
 useEffect(()=>{onProgress?.(i)},[i]);// eslint-disable-line react-hooks/exhaustive-deps
 const [notes,setNotes]=useState(teacher);
 const touch=useRef<number|null>(null);
 const last=slides.length-1;
 const go=(d:number)=>setI(x=>{const n=Math.max(0,Math.min(last,x+d));if(n===last&&x!==last)onFinished?.();return n});
 useEffect(()=>{
  const k=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key===' ')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Escape')onClose()};
  window.addEventListener('keydown',k);return ()=>window.removeEventListener('keydown',k);
 });
 const s=slides[i];
 return <div className="sl-player" role="dialog" aria-modal="true" aria-label={title} style={accent?{['--lg-brand' as string]:accent,['--sl-brand' as string]:accent}:undefined}>
  <div className="sl-bar"><span><small>{eyebrow}</small><strong>{title}</strong></span><b>{i+1} / {slides.length}</b><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="sl-progress"><i style={{width:`${((i+1)/slides.length)*100}%`}}/></div>
  <div className="sl-stage" onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(dx)>50)go(dx<0?1:-1)}}>
   <article key={i} className={'sl-slide sl-'+s.layout} aria-roledescription={t.slide}><SlideBody s={s} lang={lang} eyebrow={eyebrow}/></article>
  </div>
  {notes&&s.note&&<p className="sl-note"><MessageSquareText size={15}/>{tx(s.note,lang)}</p>}
  <div className="sl-nav">
   <button className="button secondary" disabled={i===0} onClick={()=>go(-1)}><ChevronLeft size={17}/>{t.prev}</button>
   {teacher&&slides.some(x=>x.note)&&<button className={'sl-notes'+(notes?' on':'')} aria-pressed={notes} onClick={()=>setNotes(!notes)}><MessageSquareText size={16}/>{t.notes}</button>}
   {i<last?<button className="button" onClick={()=>go(1)}>{t.next}<ChevronRight size={17}/></button>:<button className="button" onClick={onClose}>{t.close}</button>}
  </div>
 </div>;
}

function SlideBody({s,lang,eyebrow}:{s:Slide;lang:Lang;eyebrow?:string}){
 const T=(v?:L)=>tx(v,lang);
 const head=<h2 className="sl-title">{T(s.title)}</h2>;
 switch(s.layout){
  case 'title':return <div className="sl-cover"><span className="sl-eyebrow">{eyebrow}</span><h1>{T(s.title)}</h1>{s.subtitle&&<p>{T(s.subtitle)}</p>}<i className="sl-cover-mark" style={{['--sl-cover' as string]:`url(${cutaway})`}} aria-hidden/></div>;
  case 'bullets':case 'summary':return <>{head}<ul className="sl-bullets">{s.bullets?.map((b,k)=><li key={k}>{T(b)}</li>)}</ul></>;
  case 'key':return <>{head}<div className="sl-key"><b>{T(s.term)}</b><p>{T(s.definition)}</p></div></>;
  case 'flow':return <>{head}<ol className="sl-flow">{s.steps?.map((x,k)=><li key={k}><span className="sl-num">{k+1}</span><div><b>{T(x.label)}</b>{x.detail&&<small>{T(x.detail)}</small>}</div></li>)}</ol></>;
  case 'cycle':return <>{head}<Cycle steps={(s.steps||[]).map(x=>T(x.label))} center={T(s.center)}/></>;
  case 'tree':return <>{head}<div className="sl-tree"><div className="sl-tree-root">{T(s.root)}</div><div className="sl-tree-kids" style={{['--n' as string]:s.children?.length||1}}>{s.children?.map((c,k)=><div key={k} className="sl-tree-kid"><b>{T(c.label)}</b>{c.items&&<ul>{c.items.map((x,j)=><li key={j}>{T(x)}</li>)}</ul>}</div>)}</div></div></>;
  case 'compare':return <>{head}<div className="sl-compare" style={{['--n' as string]:s.columns?.length||2}}>{s.columns?.map((c,k)=><div key={k} className={'sl-col c'+k}><b>{T(c.head)}</b><ul>{c.items.map((x,j)=><li key={j}>{T(x)}</li>)}</ul></div>)}</div></>;
  case 'table':return <>{head}<div className="sl-table-wrap"><table className="sl-table"><thead><tr>{s.head?.map((h,k)=><th key={k}>{T(h)}</th>)}</tr></thead><tbody>{s.rows?.map((r,k)=><tr key={k}>{r.map((c,j)=><td key={j}>{T(c)}</td>)}</tr>)}</tbody></table></div></>;
  case 'timeline':return <>{head}<ol className="sl-timeline">{s.events?.map((e,k)=><li key={k}><b>{T(e.when)}</b><span>{T(e.label)}</span></li>)}</ol></>;
  case 'figure':{
   const img=s.image||'cutaway';
   return <>{head}<div className="sl-figure"><div className="sl-figure-img"><img src={IMAGES[img]} alt=""/>{s.callouts?.map((c,k)=>{const p=ANCHORS[img][c.at];return p&&<span key={k} className="sl-pin" style={{left:p[0]+'%',top:p[1]+'%'}}>{k+1}</span>})}</div>
    <div className="sl-figure-side"><ol className="sl-legend">{s.callouts?.map((c,k)=><li key={k}><span>{k+1}</span>{T(c.label)}</li>)}</ol>{s.bullets&&<ul className="sl-bullets small">{s.bullets.map((b,k)=><li key={k}>{T(b)}</li>)}</ul>}</div></div></>;
  }
 }
}

/** Circular process: nodes evenly around a ring with arrowed arcs between them. */
function Cycle({steps,center}:{steps:string[];center:string}){
 const n=steps.length,R=38;
 const pos=(k:number)=>{const a=-Math.PI/2+k*2*Math.PI/n;return [50+R*Math.cos(a),50+R*Math.sin(a)]};
 const arcs=steps.map((_,k)=>{
  const a0=-Math.PI/2+k*2*Math.PI/n+0.32,a1=-Math.PI/2+(k+1)*2*Math.PI/n-0.32;
  return `M${50+R*Math.cos(a0)} ${50+R*Math.sin(a0)} A${R} ${R} 0 0 1 ${50+R*Math.cos(a1)} ${50+R*Math.sin(a1)}`;
 });
 return <div className="sl-cycle">
  <svg viewBox="0 0 100 100" aria-hidden><defs><marker id="sl-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--sl-brand)"/></marker></defs>
   {arcs.map((d,k)=><path key={k} d={d} fill="none" stroke="var(--sl-brand)" strokeWidth="1.1" markerEnd="url(#sl-arrow)"/>)}</svg>
  {center&&<div className="sl-cycle-center">{center}</div>}
  {steps.map((x,k)=>{const [l,tp]=pos(k);return <div key={k} className="sl-cycle-node" style={{left:l+'%',top:tp+'%'}}><span>{k+1}</span>{x}</div>})}
 </div>;
}
