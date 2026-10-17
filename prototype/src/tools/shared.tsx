import type {ReactNode} from 'react';
import {BookOpen,TriangleAlert} from 'lucide-react';

export type Lang='uz'|'ru'|'en';
export type L=Record<Lang,string>;
export type ToolProps={lang:Lang};

/** Prominent amber notice used for clinical disclaimers. */
export function Notice({title,children,tone='amber'}:{title?:string;children:ReactNode;tone?:'amber'|'red'}){
 return <div className={'tl-notice tl-notice-'+tone} role="note">
  <span className="tl-notice-icon" aria-hidden="true"><TriangleAlert size={18}/></span>
  <div className="tl-notice-body">{title&&<strong>{title}</strong>}{children}</div>
 </div>;
}

/** Source citation block. */
export function Sources({label,items}:{label:string;items:string[]}){
 return <div className="tl-sources">
  <span className="tl-sources-head"><BookOpen size={14} aria-hidden="true"/>{label}</span>
  <ul>{items.map(s=><li key={s}>{s}</li>)}</ul>
 </div>;
}

/** Segmented control with 44px touch targets. */
export function Seg<T extends string>({value,options,onChange,label}:{value:T;options:{id:T;label:string}[];onChange:(v:T)=>void;label:string}){
 return <div className="tl-seg" role="radiogroup" aria-label={label}>
  {options.map(o=><button key={o.id} type="button" role="radio" aria-checked={value===o.id} className={'tl-seg-btn'+(value===o.id?' tl-seg-on':'')} onClick={()=>onChange(o.id)}>{o.label}</button>)}
 </div>;
}
