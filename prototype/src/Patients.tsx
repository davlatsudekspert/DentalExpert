import emptyArt from '../assets/tooth3d/turntable-front.webp';
import {useEffect,useState} from 'react';
import {ChevronLeft,Plus,Trash2,UserRound} from 'lucide-react';
import type {Lang} from './discoveryData';

export type Status='healthy'|'caries'|'filling'|'crown'|'rootcanal'|'implant'|'missing';
export type Patient={id:string;name:string;phone:string;note:string;teeth:Record<string,Status>;visits:{date:string;text:string}[];createdAt:string};
const keyFor=(uid?:string|null)=>'de_patients:'+(uid||'guest');
const STATUSES:Status[]=['healthy','caries','filling','crown','rootcanal','implant','missing'];
const COLOR:Record<Status,string>={healthy:'#dfeeee',caries:'#d9534f',filling:'#4f8fdc',crown:'#e0a928',rootcanal:'#8a5fd0',implant:'#2aa875',missing:'#9aa8ad'};
const UPPER=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

export const loadPatients=(uid?:string|null):Patient[]=>{try{const v=JSON.parse(localStorage.getItem(keyFor(uid))||'[]');return Array.isArray(v)?v:[]}catch{return []}};
export const clearLocalData=(uid?:string|null)=>{try{localStorage.removeItem(keyFor(uid));localStorage.removeItem('de_daily');localStorage.removeItem('de_practice');for(const k of ['de_seen','de_last_topic','de_study_days','de_exam','de_review','de_quick','de_nick'])localStorage.removeItem(k);for(const k of Object.keys(localStorage))if(k.startsWith('de_oral:')||k.startsWith('de_alias:'))localStorage.removeItem(k)}catch{/* storage unavailable */}};
const save=(uid:string|null|undefined,p:Patient[])=>{try{localStorage.setItem(keyFor(uid),JSON.stringify(p))}catch{/* storage unavailable */}};

const words={
 uz:{title:'Bemorlarim',empty:'Hali bemor qo‘shilmagan. Birinchi bemorni qo‘shing: ism, telefon va tishlar xaritasi shu yerda saqlanadi.',add:'Bemor qo‘shish',name:'Ism va familiya',phone:'Telefon',note:'Qayd (allergiya, shikoyatlar…)',save:'Saqlash',back:'Bemorlar',chart:'Odontogramma (FDI)',tap:'Tishni bosing va holatini tanlang',visits:'Qabullar tarixi',addVisit:'Qabul qaydini qo‘shish',visitHint:'Nima qilindi?',del:'Bemorni o‘chirish',confirm:'Bemor va uning yozuvlari o‘chirilsinmi?',privacy:'Ma’lumotlar faqat shu qurilmada saqlanadi va serverga yuborilmaydi. Telefon yo‘qolsa, ular ham yo‘qoladi.',upper:'Yuqori jag‘',lower:'Pastki jag‘',
  st:{healthy:'Sog‘lom',caries:'Karies',filling:'Plomba',crown:'Toj',rootcanal:'Kanal davolangan',implant:'Implant',missing:'Yo‘q (olingan)'},count:'Holatlar'},
 ru:{title:'Мои пациенты',empty:'Пациентов пока нет. Добавьте первого: имя, телефон и карта зубов хранятся здесь.',add:'Добавить пациента',name:'Имя и фамилия',phone:'Телефон',note:'Заметка (аллергия, жалобы…)',save:'Сохранить',back:'Пациенты',chart:'Одонтограмма (FDI)',tap:'Нажмите на зуб и выберите состояние',visits:'История приёмов',addVisit:'Добавить запись о приёме',visitHint:'Что сделано?',del:'Удалить пациента',confirm:'Удалить пациента и его записи?',privacy:'Данные хранятся только на этом устройстве и не отправляются на сервер. Если телефон потеряется, данные пропадут.',upper:'Верхняя челюсть',lower:'Нижняя челюсть',
  st:{healthy:'Здоровый',caries:'Кариес',filling:'Пломба',crown:'Коронка',rootcanal:'Каналы пролечены',implant:'Имплант',missing:'Отсутствует'},count:'Состояния'},
 en:{title:'My patients',empty:'No patients yet. Add the first one: their name, phone and tooth chart are kept here.',add:'Add patient',name:'Full name',phone:'Phone',note:'Notes (allergies, complaints…)',save:'Save',back:'Patients',chart:'Odontogram (FDI)',tap:'Tap a tooth and choose its status',visits:'Visit history',addVisit:'Add visit note',visitHint:'What was done?',del:'Delete patient',confirm:'Delete this patient and their records?',privacy:'Data stays on this device only and is never sent to a server. If you lose the phone, the data is lost too.',upper:'Upper jaw',lower:'Lower jaw',
  st:{healthy:'Healthy',caries:'Caries',filling:'Filling',crown:'Crown',rootcanal:'Root canal treated',implant:'Implant',missing:'Missing'},count:'Conditions'}
};

const TOOTH='M15 7C7 1 2 7 4 17L8 36Q11 41 13 25Q15 20 17 25Q20 41 23 34L27 15Q29 1 15 7Z';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

function Chart({lang,teeth,onSet}:{lang:Lang;teeth:Record<string,Status>;onSet:(n:number,s:Status)=>void}){
 const t=words[lang];
 const [sel,setSel]=useState<number|null>(null);
 const row=(list:number[],label:string)=><><small className="pt-jaw">{label}</small><div className="pt-teeth">{list.map(n=>{const st=teeth[n]||'healthy';return <button key={n} className={'pt-tooth'+(sel===n?' on':'')} aria-label={`${n} ${t.st[st]}`} onClick={()=>setSel(n)}>
  <span>{n}</span><svg viewBox="0 0 30 42" style={{opacity:st==='missing'?.35:1}}><path d={TOOTH} fill={COLOR[st]} stroke="#5f8a92" strokeWidth="1.2" strokeDasharray={st==='missing'?'3 2':undefined}/></svg></button>})}</div></>;
 return <div className="pt-chart">
  <p className="muted">{t.tap}</p>
  {row(UPPER,t.upper)}{row(LOWER,t.lower)}
  {sel!==null&&<div className="pt-picker" role="group" aria-label={String(sel)}><b>{sel}</b>{STATUSES.map(s=><button key={s} className={(teeth[sel]||'healthy')===s?'on':''} onClick={()=>{onSet(sel,s);setSel(null)}}><i style={{background:COLOR[s]}}/>{t.st[s]}</button>)}</div>}
  <div className="pt-legend">{STATUSES.map(s=><span key={s}><i style={{background:COLOR[s]}}/>{t.st[s]}</span>)}</div>
 </div>;
}

export default function Patients({lang,uid,onChange}:{lang:Lang;uid?:string|null;onChange?:(p:Patient[])=>void}){
 const t=words[lang];
 const [list,setList]=useState<Patient[]>(()=>loadPatients(uid));
 useEffect(()=>setList(loadPatients(uid)),[uid]);
 const [open,setOpen]=useState<string|null>(null);
 const [adding,setAdding]=useState(false);
 const [f,setF]=useState({name:'',phone:'',note:''});
 const [visit,setVisit]=useState('');
 const commit=(next:Patient[])=>{setList(next);save(uid,next);onChange?.(next)};
 const cur=list.find(p=>p.id===open)||null;
 const patch=(fn:(p:Patient)=>Patient)=>commit(list.map(p=>p.id===open?fn(p):p));
 if(cur)return <section className="patients">
  <button className="cr-back" onClick={()=>setOpen(null)}><ChevronLeft size={16}/>{t.back}</button>
  <div className="card pt-head"><span className="pt-avatar">{cur.name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</span><div><h2>{cur.name}</h2><p className="muted">{cur.phone||'—'}</p></div></div>
  {cur.note&&<div className="card"><p>{cur.note}</p></div>}
  <h3>{t.chart}</h3>
  <Chart lang={lang} teeth={cur.teeth} onSet={(n,s)=>patch(p=>({...p,teeth:{...p.teeth,[n]:s}}))}/>
  <h3>{t.visits}</h3>
  <div className="cr-form"><input value={visit} maxLength={300} aria-label={t.visitHint} placeholder={t.visitHint} onChange={e=>setVisit(e.target.value)}/><button className="button" disabled={!visit.trim()} onClick={()=>{patch(p=>({...p,visits:[{date:today(),text:visit.trim()},...p.visits]}));setVisit('')}}>{t.addVisit}</button></div>
  <div className="cr-list">{cur.visits.map((v,i)=><div key={i} className="cr-row static"><span><strong>{v.date}</strong><small>{v.text}</small></span></div>)}</div>
  <button className="button secondary" onClick={()=>{if(window.confirm(t.confirm)){commit(list.filter(p=>p.id!==cur.id));setOpen(null)}}}><Trash2 size={16}/>{t.del}</button>
  <small className="muted">{t.privacy}</small>
 </section>;
 return <section className="patients">
  <h2>{t.title}</h2>
  {list.length===0&&!adding&&<div className="pt-empty"><img src={emptyArt} alt=""/><p>{t.empty}</p></div>}
  <div className="cr-list">{list.map(p=>{const n=Object.values(p.teeth).filter(s=>s!=='healthy').length;return <button key={p.id} className="cr-row" onClick={()=>setOpen(p.id)}><UserRound size={18}/><span><strong>{p.name}</strong><small>{p.phone||'—'} · {t.count}: {n}</small></span></button>})}</div>
  {adding?<div className="cr-form">
   <label>{t.name}<input value={f.name} maxLength={80} onChange={e=>setF({...f,name:e.target.value})}/></label>
   <label>{t.phone}<input type="tel" inputMode="tel" pattern="[+0-9 ()\-]*" value={f.phone} maxLength={30} placeholder="+998 90 000 00 00" onChange={e=>setF({...f,phone:e.target.value})}/></label>
   <label>{t.note}<textarea rows={2} maxLength={300} value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label>
   <button className="button" disabled={f.name.trim().length<2||!/^[+0-9 ()-]*$/.test(f.phone)} onClick={()=>{const p:Patient={id:crypto.randomUUID(),name:f.name.trim(),phone:f.phone.trim(),note:f.note.trim(),teeth:{},visits:[],createdAt:today()};commit([p,...list]);setF({name:'',phone:'',note:''});setAdding(false);setOpen(p.id)}}>{t.save}</button>
  </div>:<button className="button" onClick={()=>setAdding(true)}><Plus size={17}/>{t.add}</button>}
  <small className="muted">{t.privacy}</small>
 </section>;
}
