import {X} from 'lucide-react';
import credits from '../public/credits.json';
import type {Lang} from './discoveryData';
import {photoUrl} from './photos';
import './photos.css';

const words={
 uz:{title:'Rasm manbalari',hint:'Ilovadagi fotosuratlar ochiq litsenziyalar ostida Wikimedia Commons’dan olingan. Mualliflar, litsenziyalar va o‘zgartirishlar quyida.',by:'Muallif',lic:'Litsenziya',src:'Manba',mod:'O‘zgartirish',close:'Yopish',n:'ta rasm'},
 ru:{title:'Источники изображений',hint:'Фотографии в приложении взяты из Wikimedia Commons по открытым лицензиям. Авторы, лицензии и изменения указаны ниже.',by:'Автор',lic:'Лицензия',src:'Источник',mod:'Изменения',close:'Закрыть',n:'изобр.'},
 en:{title:'Image credits',hint:'Photographs in the app come from Wikimedia Commons under open licences. Authors, licences and changes are listed below.',by:'Author',lic:'Licence',src:'Source',mod:'Changes',close:'Close',n:'images'}
};
type Entry={file:string;title:string;author:string;license:string;licenseUrl?:string;sourceUrl:string;fileUrl:string;modifications:string;alt:Record<Lang,string>};

/** Attribution screen for every bundled photograph (required by CC BY and CC BY-SA); lists public/credits.json. */
export default function Credits({lang,onClose}:{lang:Lang;onClose:()=>void}){
 const t=words[lang];const list=credits.images as unknown as Entry[];
 return <div className="quiz-run" role="dialog" aria-label={t.title}>
  <div className="quiz-run-bar"><strong>{t.title}</strong><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   <p className="muted">{t.hint} · {list.length} {t.n}</p>
   <ul className="cr-credits">{list.map(e=><li key={e.file} className="card">
    <img src={photoUrl(e.file)} alt={e.alt[lang]} width={96} height={72} loading="lazy" decoding="async"/>
    <div><b>{e.title}</b>
     <small>{t.by}: {e.author}</small>
     <small>{t.lic}: {e.licenseUrl?<a href={e.licenseUrl} target="_blank" rel="noopener noreferrer">{e.license}</a>:e.license}</small>
     <small>{t.src}: <a href={e.fileUrl} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></small>
     <small>{t.mod}: {e.modifications}</small></div>
   </li>)}</ul>
  </div>
 </div>;
}
