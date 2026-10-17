import {MapPin} from 'lucide-react';
import Portrait from './Portrait';
import clinicianSheet from '../assets/clinician-contact-sheet.png?inline';
import {countryCodes} from './countryCodes';
import {demoCities,type DemoDoctor,type Lang} from './discoveryData';

const words={
 uz:{country:'Mamlakat',city:'Shahar',other:'Shahar nomini kiriting',demo:'Namuna profil'},
 ru:{country:'Страна',city:'Город',other:'Введите город',demo:'Пример профиля'},
 en:{country:'Country',city:'City',other:'Enter a city',demo:'Sample profile'}
};

// Fictional demo profiles use cells from one local photo sheet.
const photoIndex:Record<string,number>={
 umida:1,dilnoza:4,sardor:0,nodira:6,shahnoza:9,emma:11,
 'tashkent-1':12,'tashkent-2':7,'tashkent-3':3,'tashkent-4':10,
 'dubai-2':14,'dubai-3':15,'dubai-4':1
};

export function DemoAvatar({doctor,large=false}:{doctor:DemoDoctor;large?:boolean}){
 if(doctor.portrait!==undefined)return <Portrait person={doctor.portrait} large={large}/>;
 const index=photoIndex[doctor.id];
 if(index!==undefined)return <span className={'demo-avatar photo '+(large?'large':'')} role="img" aria-label={doctor.name} style={{backgroundImage:`url(${clinicianSheet})`,backgroundSize:'400% 400%',backgroundPosition:`${(index%4)*100/3}% ${Math.floor(index/4)*100/3}%`,backgroundRepeat:'no-repeat'}}/>;
 return <span className={'demo-avatar '+(large?'large':'')} aria-label={doctor.name}>{doctor.initials}</span>;
}

export function LocationPicker({lang,country,city,customCity,onCountry,onCity,onCustomCity}:{lang:Lang;country:string;city:string;customCity:string;onCountry:(v:string)=>void;onCity:(v:string)=>void;onCustomCity:(v:string)=>void}){
 const regionNames=new Intl.DisplayNames([lang],{type:'region'});
 const options=countryCodes.map(code=>({code,name:regionNames.of(code)||code})).sort((a,b)=>a.name.localeCompare(b.name,lang));
 const cities=demoCities.filter(x=>x.countryCode===country);
 const t=words[lang];
 return <div className="discovery-location" role="group" aria-label={lang==='uz'?'Joylashuv':lang==='ru'?'Местоположение':'Location'}>
  <MapPin size={17}/>
  <label>{t.country}<select aria-label={t.country} value={country} onChange={e=>onCountry(e.target.value)}>{options.map(x=><option key={x.code} value={x.code}>{x.name}</option>)}</select></label>
  <label>{t.city}{cities.length?<select aria-label={t.city} value={city} onChange={e=>onCity(e.target.value)}>{cities.map(x=><option key={x.id} value={x.id}>{x.label[lang]}</option>)}</select>:<input aria-label={t.city} value={customCity} placeholder={t.other} onChange={e=>onCustomCity(e.target.value)}/>}</label>
 </div>;
}

export const demoLabel=(lang:Lang)=>words[lang].demo;
