import {ArrowUpRight} from 'lucide-react';
import {DemoAvatar} from './DiscoveryUI';
import {cityName,type DemoDoctor,type Lang} from './discoveryData';

const copy={
 uz:{title:'Homiylik joylari',note:'Hozircha namuna',badge:'Namuna reklama',profile:'Profilni ko‘rish'},
 ru:{title:'Рекламные места',note:'Пока пример',badge:'Пример рекламы',profile:'Открыть профиль'},
 en:{title:'Sponsored places',note:'Preview only',badge:'Sample ad',profile:'View profile'}
};

export default function SponsoredDemo({lang,doctors,onOpen}:{lang:Lang,doctors:DemoDoctor[],onOpen:(id:string)=>void}){
 const t=copy[lang];
 return <section className="sponsored-demo" aria-label={t.title}>
  <div className="sponsored-heading"><div><span className="eyebrow">DENTAL EXPERT</span><h2>{t.title}</h2></div><span>{t.note}</span></div>
  <div className="sponsored-track">
   {doctors.slice(0,3).map(doctor=><button className="sponsored-card" key={doctor.id} onClick={()=>onOpen(doctor.id)}>
    <div className="sponsored-photo"><DemoAvatar doctor={doctor}/></div>
    <span className="sponsored-badge">{t.badge}</span>
    <strong>{doctor.name}</strong>
    <small>{cityName(doctor.cityId,lang)} · {doctor.specialty[lang]}</small>
    <span className="sponsored-open">{t.profile}<ArrowUpRight size={15}/></span>
   </button>)}
  </div>
 </section>
}
