import {X} from 'lucide-react';
import credits from '../public/credits.json';
import type {Lang} from './discoveryData';
import {photoUrl} from './photos';
import {attestationOn,AttestationNote} from './attestationConfig';
import './photos.css';

const words={
 uz:{title:'Rasm manbalari',hint:'Ilovadagi fotosuratlar ochiq litsenziyalar ostida Wikimedia Commons’dan olingan. Mualliflar, litsenziyalar va o‘zgartirishlar quyida.',by:'Muallif',lic:'Litsenziya',src:'Manba',mod:'O‘zgartirish',close:'Yopish',n:'ta rasm',ai:'Sun’iy intellekt yordamida yaratilgan illyustratsiya',aiHint:'Ba’zi tasvirlar sun’iy intellekt yordamida yaratilgan illyustratsiyalar, haqiqiy klinik suratlar emas.'},
 ru:{title:'Источники изображений',hint:'Фотографии в приложении взяты из Wikimedia Commons по открытым лицензиям. Авторы, лицензии и изменения указаны ниже.',by:'Автор',lic:'Лицензия',src:'Источник',mod:'Изменения',close:'Закрыть',n:'изобр.',ai:'Иллюстрация, созданная с помощью ИИ',aiHint:'Некоторые изображения — иллюстрации, созданные с помощью ИИ, а не реальные клинические снимки.'},
 en:{title:'Image credits',hint:'Photographs in the app come from Wikimedia Commons under open licences. Authors, licences and changes are listed below.',by:'Author',lic:'Licence',src:'Source',mod:'Changes',close:'Close',n:'images',ai:'Illustration created with AI',aiHint:'Some images are illustrations created with AI, not real clinical photographs.'}
};
type Entry={file:string;title:string;author:string;license:string;licenseUrl?:string;sourceUrl:string;fileUrl:string;modifications:string;alt:Record<Lang,string>;ai?:boolean};

/** Attribution screen for every bundled photograph (required by CC BY and CC BY-SA); lists public/credits.json. */
export default function Credits({lang,onClose}:{lang:Lang;onClose:()=>void}){
 const t=words[lang];const list=credits.images as unknown as Entry[];
 return <div className="quiz-run" role="dialog" aria-label={t.title}>
  <div className="quiz-run-bar"><strong>{t.title}</strong><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   <p className="muted">{t.hint} {list.some(e=>e.ai)&&t.aiHint} · {list.length} {t.n}</p>
   <ul className="cr-credits">{list.map(e=><li key={e.file} className="card">
    <img src={photoUrl(e.file)} alt={e.alt[lang]} width={96} height={72} loading="lazy" decoding="async"/>
    <div><b>{e.title}</b>
     <small>{t.by}: {e.author}</small>
     <small>{t.lic}: {e.licenseUrl?<a href={e.licenseUrl} target="_blank" rel="noopener noreferrer">{e.license}</a>:e.license}</small>
     <small>{t.src}: {e.ai?t.ai:<a href={e.fileUrl} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>}</small>
     <small>{t.mod}: {e.modifications}</small></div>
   </li>)}</ul>
   {attestationOn(lang)&&<AttestationNote lang={lang}/>}
  </div>
 </div>;
}
