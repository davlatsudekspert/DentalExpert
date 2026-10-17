import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {fetchSponsors} from './api';
import {DemoAvatar} from './DiscoveryUI';
import {cityName,type DemoDoctor,type Lang} from './discoveryData';

const copy={
 uz:{title:'Homiylik joylari',note:'Hozircha namuna',badge:'Namuna reklama',ad:'Reklama',profile:'Profilni ko‘rish'},
 ru:{title:'Рекламные места',note:'Пока пример',badge:'Пример рекламы',ad:'Реклама',profile:'Открыть профиль'},
 en:{title:'Sponsored places',note:'Preview only',badge:'Sample ad',ad:'Ad',profile:'View profile'}
};

export default function SponsoredDemo({lang,cityId,doctors,onOpen}:{lang:Lang,cityId:string,doctors:DemoDoctor[],onOpen:(id:string)=>void}){
 const t=copy[lang];
 const [order,setOrder]=useState<string[]|null>(null);
 useEffect(()=>{
  const ctrl=new AbortController();
  setOrder(null);
  fetchSponsors(cityId,ctrl.signal).then(r=>{if(r&&!ctrl.signal.aborted)setOrder(r.sponsors.map(x=>x.id))});
  return()=>ctrl.abort();
 },[cityId]);
 // Server order wins when reachable; ids without a local profile are skipped until profiles are API-backed.
 // Until the server answers, only fictional demo profiles may stand in; real profiles never appear as sponsors by default.
 const shown=order?order.map(id=>doctors.find(d=>d.id===id)).filter((d):d is DemoDoctor=>!!d):doctors.filter(d=>d.isDemo!==false);
 if(shown.length===0)return null;
 const anyDemo=shown.some(d=>d.isDemo!==false);
 return <section className="sponsored-demo" aria-label={t.title}>
  <div className="sponsored-heading"><div><span className="eyebrow">DENTAL EXPERT</span><h2>{t.title}</h2></div>{anyDemo&&<span>{t.note}</span>}</div>
  <div className="sponsored-track">
   {shown.slice(0,4).map(doctor=><button className="sponsored-card" key={doctor.id} onClick={()=>onOpen(doctor.id)}>
    <div className="sponsored-photo"><DemoAvatar doctor={doctor}/></div>
    <div className="sponsored-content"><span className="sponsored-badge">{doctor.isDemo===false?t.ad:t.badge}</span>
    <strong>{doctor.name}</strong>
    <small>{cityName(doctor.cityId,lang)} · {doctor.specialty[lang]}</small></div>
    <span className="sponsored-open" aria-label={t.profile}><ArrowUpRight size={14}/></span>
   </button>)}
  </div>
 </section>
}
