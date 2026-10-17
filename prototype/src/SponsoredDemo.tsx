import {ArrowUpRight} from 'lucide-react';
import Portrait from './Portrait';

type Lang='uz'|'ru'|'en';

const copy={
 uz:{title:'Homiylik joylari',note:'Hozircha namuna',badge:'Namuna reklama',profile:'Profilni ko‘rish'},
 ru:{title:'Рекламные места',note:'Пока пример',badge:'Пример рекламы',profile:'Открыть профиль'},
 en:{title:'Sponsored places',note:'Preview only',badge:'Sample ad',profile:'View profile'}
};

export default function SponsoredDemo({lang,names,onOpen}:{lang:Lang,names:string[],onOpen:(index:number)=>void}){
 const t=copy[lang];
 return <section className="sponsored-demo" aria-label={t.title}>
  <div className="sponsored-heading"><div><span className="eyebrow">DENTAL EXPERT</span><h2>{t.title}</h2></div><span>{t.note}</span></div>
  <div className="sponsored-track">
   {names.slice(0,3).map((name,index)=><button className="sponsored-card" key={name} onClick={()=>onOpen(index)}>
    <div className="sponsored-photo"><Portrait person={index as 0|1|2}/></div>
    <span className="sponsored-badge">{t.badge}</span>
    <strong>{name}</strong>
    <span className="sponsored-open">{t.profile}<ArrowUpRight size={15}/></span>
   </button>)}
  </div>
 </section>
}
