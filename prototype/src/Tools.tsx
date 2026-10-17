import {useEffect,useRef,useState,type ComponentType} from 'react';
import {ArrowLeft,CalendarClock,ChevronRight,Library,ShieldCheck,Syringe,type LucideIcon} from 'lucide-react';
import Anaesthetic from './tools/Anaesthetic';
import Eruption from './tools/Eruption';
import Reference from './tools/Reference';
import Sterilisation from './tools/Sterilisation';
import type {L,Lang,ToolProps} from './tools/shared';
import './tools.css';

type ToolId='anaesthetic'|'eruption'|'reference'|'sterilisation';
type ToolDef={id:ToolId;icon:LucideIcon;tone:string;title:L;sub:L;C:ComponentType<ToolProps>};

const TOOLS:ToolDef[]=[
 {id:'anaesthetic',icon:Syringe,tone:'brand',C:Anaesthetic,
  title:{uz:'Anestetik dozasi',ru:'Доза анестетика',en:'Anaesthetic dose'},
  sub:{uz:'Vazn bo‘yicha maksimal mg va karpulalar soni',ru:'Максимальная доза в мг и число карпул по массе тела',en:'Maximum mg and cartridges by body weight'}},
 {id:'eruption',icon:CalendarClock,tone:'deep',C:Eruption,
  title:{uz:'Tish chiqish muddatlari',ru:'Сроки прорезывания',en:'Eruption chart'},
  sub:{uz:'Sut va doimiy tishlar, FDI tish qatorida',ru:'Временные и постоянные зубы на дуге FDI',en:'Primary and permanent teeth on an FDI arch'}},
 {id:'reference',icon:Library,tone:'amber',C:Reference,
  title:{uz:'Tezkor ma’lumotnoma',ru:'Быстрый справочник',en:'Quick reference'},
  sub:{uz:'FDI, Black, ICDAS, Kennedy, Angle, parodontit, AAE, ASA',ru:'FDI, Блэк, ICDAS, Кеннеди, Энгль, пародонтит, AAE, ASA',en:'FDI, Black, ICDAS, Kennedy, Angle, periodontitis, AAE, ASA'}},
 {id:'sterilisation',icon:ShieldCheck,tone:'soft',C:Sterilisation,
  title:{uz:'Sterilizatsiya',ru:'Стерилизация',en:'Sterilisation'},
  sub:{uz:'Spaulding tasnifi va avtoklav rejimlari',ru:'Классификация Сполдинга и режимы автоклава',en:'Spaulding classes and autoclave cycles'}},
];

const T={
 uz:{eyebrow:'Klinik yordamchi',title:'Stomatolog vositalari',sub:'Kundalik amaliyot uchun hisoblagich va ma’lumotnomalar.',back:'Vositalarga qaytish',open:'Ochish',foot:'Barcha vositalar o‘quv maqsadida. Ular klinik qaror va mutaxassis maslahati o‘rnini bosmaydi.'},
 ru:{eyebrow:'Клинический помощник',title:'Инструменты стоматолога',sub:'Калькуляторы и справочники для ежедневной практики.',back:'Назад к инструментам',open:'Открыть',foot:'Все инструменты носят учебный характер и не заменяют клиническое решение и консультацию специалиста.'},
 en:{eyebrow:'Clinical companion',title:'Dentist tools',sub:'Calculators and references for everyday practice.',back:'Back to tools',open:'Open',foot:'All tools are educational. They do not replace clinical judgement or specialist advice.'},
};

export default function Tools({lang}:{lang:Lang}){
 const t=T[lang];
 const [open,setOpen]=useState<ToolId|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const last=useRef<ToolId|null>(null);
 useEffect(()=>{
  const el=root.current;if(!el)return;
  if(open){el.scrollIntoView?.({block:'start'});el.querySelector<HTMLElement>('.tl-back')?.focus({preventScroll:true});}
  else if(last.current){el.querySelector<HTMLElement>(`[data-tool="${last.current}"]`)?.focus();}
 },[open]);
 const tool=TOOLS.find(x=>x.id===open);

 if(tool){
  const C=tool.C,Icon=tool.icon;
  return <div className="tl-root" ref={root}>
   <div className="tl-bar">
    <button type="button" className="tl-back" onClick={()=>setOpen(null)} aria-label={t.back}><ArrowLeft size={20}/></button>
    <span className={'tl-bar-icon tl-tone-'+tool.tone} aria-hidden="true"><Icon size={18}/></span>
    <div className="tl-bar-text"><small>{t.title}</small><h2>{tool.title[lang]}</h2></div>
   </div>
   <C lang={lang}/>
  </div>;
 }

 return <div className="tl-root" ref={root}>
  <header className="tl-hero">
   <span className="tl-eyebrow">{t.eyebrow}</span>
   <h2>{t.title}</h2>
   <p>{t.sub}</p>
  </header>
  <div className="tl-menu">
   {TOOLS.map(x=>{const Icon=x.icon;return <button key={x.id} type="button" data-tool={x.id} className="tl-menu-card" onClick={()=>{last.current=x.id;setOpen(x.id)}}>
    <span className={'tl-menu-icon tl-tone-'+x.tone} aria-hidden="true"><Icon size={22}/></span>
    <span className="tl-menu-text"><strong>{x.title[lang]}</strong><small>{x.sub[lang]}</small></span>
    <span className="tl-menu-go" aria-hidden="true"><ChevronRight size={18}/></span>
   </button>})}
  </div>
  <p className="tl-foot">{t.foot}</p>
 </div>;
}
