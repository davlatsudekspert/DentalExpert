import {useEffect,useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {fetchInstitutions} from './api';
import {institutions as bundled,type Institution} from './institutionsData';
import type {Lang} from './discoveryData';

const words={
 uz:{title:'Rasmiy dars jadvali',pick:'Muassasa',open:'Rasmiy jadvalni ochish',site:'Muassasa saytini ochish',noPage:'Jadval sahifasi hali aniqlanmadi; muassasa saytidan qidiring.',note:'Jadval muassasaning o‘z saytida ochiladi. Ilova uni nusxalamaydi va o‘zgartirmaydi.',credit:'Manba: muassasa rasmiy sayti',checked:'Tekshirilgan:',unverified:'Avtomatik o‘qilgan; inson tasdig‘i kutilmoqda.'},
 ru:{title:'Официальное расписание',pick:'Учреждение',open:'Открыть официальное расписание',site:'Открыть сайт учреждения',noPage:'Страница расписания пока не найдена; ищите на сайте учреждения.',note:'Расписание открывается на сайте самого учреждения. Приложение его не копирует и не изменяет.',credit:'Источник: официальный сайт учреждения',checked:'Проверено:',unverified:'Считано автоматически; ожидается проверка человеком.'},
 en:{title:'Official class schedule',pick:'Institution',open:'Open official schedule',site:'Open institution website',noPage:'No schedule page has been identified yet; look on the institution’s website.',note:'The schedule opens on the institution’s own website. The app does not copy or change it.',credit:'Source: institution’s official website',checked:'Checked:',unverified:'Machine-read; awaiting human confirmation.'}
};

const safe=(u:string|null)=>u&&/^https?:\/\//.test(u)?u:null;

export default function OfficialSchedule({lang}:{lang:Lang}){
 const t=words[lang];
 const [list,setList]=useState<Institution[]>(bundled);
 const [id,setId]=useState(bundled[0].id);
 useEffect(()=>{const c=new AbortController();fetchInstitutions(c.signal).then(r=>{if(r&&r.length&&!c.signal.aborted)setList(r)});return()=>c.abort()},[]);
 const inst=list.find(x=>x.id===id)||list[0];
 const schedule=safe(inst.scheduleUrl);
 return <section className="official-schedule card" aria-label={t.title}>
  <h2>{t.title}</h2>
  <label>{t.pick}<select value={inst.id} onChange={e=>setId(e.target.value)}>{list.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  {schedule?<a className="button" href={schedule} target="_blank" rel="noopener noreferrer">{t.open}{inst.scheduleLabel?` · ${inst.scheduleLabel}`:''}<ExternalLink size={17}/></a>
  :<><p className="muted">{t.noPage}</p><a className="button secondary" href={inst.website} target="_blank" rel="noopener noreferrer">{t.site}<ExternalLink size={17}/></a></>}
  <p className="muted">{t.note}</p>
  <small>{t.credit}: {new URL(inst.website).hostname} · {t.checked} {inst.checkedOn} · {t.unverified}</small>
 </section>;
}
