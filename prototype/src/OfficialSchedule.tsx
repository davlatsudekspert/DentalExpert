import {useEffect,useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {fetchInstitutions} from './api';
import {institutions as bundled,type Institution} from './institutionsData';
import type {Lang} from './discoveryData';
import {isoDate} from './i18n';

const LEVELS:Record<string,Record<Lang,string>>={Bakalavriat:{uz:'Bakalavriat',ru:'Бакалавриат',en:'Bachelor’s'},Magistratura:{uz:'Magistratura',ru:'Магистратура',en:'Master’s'}};

const words={
 uz:{title:'Rasmiy dars jadvali',pick:'Muassasa',open:'Rasmiy jadvalni ochish',site:'Muassasa saytini ochish',noPage:'Jadval sahifasi hali aniqlanmadi; muassasa saytidan qidiring.',note:'Jadval muassasaning o‘z saytida ochiladi. Ilova uni nusxalamaydi va o‘zgartirmaydi.',credit:'Manba: muassasaning rasmiy sayti',checked:'Tekshirilgan:',unverified:'Avtomatik yig‘ilgan; muharrir tekshiruvi kutilmoqda.'},
 ru:{title:'Официальное расписание',pick:'Учреждение',open:'Открыть официальное расписание',site:'Открыть сайт учреждения',noPage:'Страница расписания пока не найдена; ищите на сайте учреждения.',note:'Расписание открывается на сайте самого учреждения. Приложение его не копирует и не изменяет.',credit:'Источник: официальный сайт учреждения',checked:'Проверено:',unverified:'Собрано автоматически; ждёт проверки редактором.'},
 en:{title:'Official class schedule',pick:'Institution',open:'Open official schedule',site:'Open institution website',noPage:'No schedule page has been found yet; look for it on the institution’s website.',note:'The schedule opens on the institution’s own website. The app does not copy or change it.',credit:'Source: the institution’s official website',checked:'Checked:',unverified:'Collected automatically; awaiting editor review.'}
};

const safe=(u:string|null)=>u&&/^https?:\/\//.test(u)?u:null;

export default function OfficialSchedule({lang}:{lang:Lang}){
 const t=words[lang];
 const [list,setList]=useState<Institution[]>(bundled);
 const [id,setId]=useState(bundled[0].id);
 useEffect(()=>{const c=new AbortController();fetchInstitutions(c.signal).then(r=>{if(r&&r.length&&!c.signal.aborted)setList(r)});return()=>c.abort()},[]);
 const inst=list.find(x=>x.id===id)||list[0];
 // Server rows carry only the official Uzbek name; the bundled list adds the localized one.
 const nameOf=(x:Institution)=>(x.names||bundled.find(b=>b.id===x.id)?.names)?.[lang]||x.name;
 const level=inst.scheduleLabel?LEVELS[inst.scheduleLabel]?.[lang]||inst.scheduleLabel:'';
 const schedule=safe(inst.scheduleUrl);
 return <section className="official-schedule card" aria-label={t.title}>
  <h2>{t.title}</h2>
  <label>{t.pick}<select value={inst.id} onChange={e=>setId(e.target.value)}>{list.map(x=><option key={x.id} value={x.id}>{nameOf(x)}</option>)}</select></label>
  {schedule?<a className="button" href={schedule} target="_blank" rel="noopener noreferrer">{t.open}{level?` · ${level}`:''}<ExternalLink size={17}/></a>
  :<><p className="muted">{t.noPage}</p><a className="button secondary" href={inst.website} target="_blank" rel="noopener noreferrer">{t.site}<ExternalLink size={17}/></a></>}
  <p className="muted">{t.note}</p>
  <small>{t.credit}: {new URL(inst.website).hostname} · {t.checked} {isoDate(lang,inst.checkedOn)} · {t.unverified}</small>
 </section>;
}
