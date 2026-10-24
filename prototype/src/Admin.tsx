import {useCallback,useEffect,useState} from 'react';
import {ExternalLink,X} from 'lucide-react';
import {callApi} from './api';
import {useOwnPhoto} from './ProfileForm';
/** The dentist's photo, checked before verifying (private until verified, so it is loaded with the admin's session). */
function AdminPhoto({url}:{url:string}){const src=useOwnPhoto(url);return src?<img className="uploaded-avatar small" src={src} alt="Rasm"/>:null}

type Stats={users:{total:number;byRole:Record<string,number>;last7:number;last30:number;activeSessions:number;suspended:number;daily:{day:string;n:number}[]};classroom:{groups:number;members:number;assignments:number;submissions:number};doctors:{verified:number;demo:number};reports:{open:number;total:number}};
type Report={id:string;category:string;subject:string|null;body:string;contact:string|null;lang:string|null;status:'open'|'resolved';note:string|null;createdAt:string;reporter:string|null};
type User={pro?:{active:boolean;reason:string};id:string;email:string;name:string|null;role:string;createdAt:string;suspended:boolean;admin:boolean;publishRequested?:boolean;verified?:boolean;profile?:{phone:string|null;workplace:string|null;specialty:string|null;telegram:string|null;instagram:string|null;email:string|null;address:string|null;map:string|null;city:string|null;photoUrl?:string|null}|null};
const ROLE:Record<string,string>={patient:'Bemor',dentist:'Stomatolog',teacher:'Ustoz',student:'Talaba'};
const CAT:Record<string,string>={complaint:'Shikoyat',content:'Nomaqbul kontent',bug:'Xato',advertising:'Reklama',other:'Boshqa'};

/** Owner-only panel. The server checks the admin e-mail on every request; this screen is only a front end. */
export default function Admin({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<'stats'|'reports'|'users'|'pro'>('stats');
 const [stats,setStats]=useState<Stats|null>(null);
 const [err,setErr]=useState('');
 const loadStats=useCallback(async()=>{const r=await callApi<Stats>('/admin/stats');if(r.ok)setStats(r.data);else setErr(r.status===403?'Ruxsat yo‘q':'Yuklanmadi')},[]);
 useEffect(()=>{loadStats()},[loadStats]);
 return <div className="quiz-run admin" role="dialog" aria-label="Admin panel">
  <div className="quiz-run-bar"><strong>Admin panel</strong><button onClick={onClose} aria-label="Yopish"><X size={20}/></button></div>
  <div className="admin-tabs">{([['stats','Statistika'],['reports',`Shikoyatlar${stats?.reports.open?` (${stats.reports.open})`:''}`],['users','Foydalanuvchilar'],['pro','Pro']] as const).map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
  <div className="quiz-run-body">
   {err&&<p className="cr-error" role="alert">{err}</p>}
   {tab==='stats'&&(stats?<StatsView s={stats}/>:!err&&<p className="muted">…</p>)}
   {tab==='reports'&&<Reports onChanged={loadStats}/>}
   {tab==='users'&&<Users/>}
   {tab==='pro'&&<ProGrants/>}
  </div>
 </div>;
}

function StatsView({s}:{s:Stats}){
 const max=Math.max(1,...s.users.daily.map(d=>d.n));
 // The server lists only days with sign-ups: lay out all 14 days so one busy day is one bar, not a block across the whole chart.
 const days=Array.from({length:14},(_,i)=>{const day=new Date(Date.now()-(13-i)*864e5).toISOString().slice(0,10);return {day,n:s.users.daily.find(d=>d.day===day)?.n||0}});
 const card=(n:number|string,l:string)=><div className="admin-card"><b>{n}</b><span>{l}</span></div>;
 return <>
  <div className="admin-grid">{card(s.users.total,'Jami foydalanuvchi')}{card(s.users.last7,'7 kunda yangi')}{card(s.users.last30,'30 kunda yangi')}{card(s.users.activeSessions,'Hozir tizimda (faol sessiya)')}</div>
  <h3>Rollar</h3>
  <div className="admin-grid">{Object.entries(ROLE).map(([k,l])=>card(s.users.byRole[k]||0,l))}</div>
  <h3>Oxirgi 14 kun ro‘yxatdan o‘tish</h3>
  <div className="admin-bars" aria-label="Kunlik ro‘yxatdan o‘tish">{days.map(d=><div key={d.day} title={`${d.day}: ${d.n}`}>{d.n>0&&<b>{d.n}</b>}<i style={{height:`${(d.n/max)*100}%`}}/><small>{d.day.slice(8)}</small></div>)}</div>
  <h3>Sinf xonasi</h3>
  <div className="admin-grid">{card(s.classroom.groups,'Guruhlar')}{card(s.classroom.members,'A’zolar')}{card(s.classroom.assignments,'Topshiriqlar')}{card(s.classroom.submissions,'Javoblar')}</div>
  <h3>Shifokorlar</h3>
  <div className="admin-grid">{card(s.doctors.verified,'Tasdiqlangan')}{card(s.doctors.demo,'Demo (namuna)')}{card(s.reports.open,'Ochiq shikoyat')}{card(s.users.suspended,'To‘xtatilgan hisob')}</div>
  <h3>Yuklab olishlar va sotuvlar</h3>
  <div className="card admin-note">
   <p><b>Yuklab olishlar</b> serverimizga ko‘rinmaydi. Ularni do‘konlarning o‘zida ko‘rasiz:</p>
   <a className="admin-link" href="https://appstoreconnect.apple.com/analytics" target="_blank" rel="noopener noreferrer">App Store Connect · Analytics <ExternalLink size={14}/></a>
   <a className="admin-link" href="https://play.google.com/console" target="_blank" rel="noopener noreferrer">Google Play Console · Statistika <ExternalLink size={14}/></a>
   <p><b>Sotuvlar:</b> ilovada hali to‘lov tizimi yo‘q, shuning uchun sotib olganlar soni 0. To‘lov (obuna yoki bir martalik xarid) qo‘shilganda shu yerda hisoblanadi.</p>
  </div>
 </>;
}

function Reports({onChanged}:{onChanged:()=>void}){
 const [status,setStatus]=useState<'open'|'resolved'>('open');
 const [list,setList]=useState<Report[]|null>(null);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{const r=await callApi<{reports:Report[]}>('/admin/reports?status='+status);if(r.ok)setList(r.data.reports)},[status]);
 useEffect(()=>{setList(null);load()},[load]);
 const set=async(id:string,to:'open'|'resolved')=>{await callApi('/admin/reports','PUT',{id,status:to,note:notes[id]});await load();onChanged()};
 return <>
  <div className="chips"><button className={status==='open'?'active':''} onClick={()=>setStatus('open')}>Ochiq</button><button className={status==='resolved'?'active':''} onClick={()=>setStatus('resolved')}>Hal qilingan</button></div>
  {list===null?<p className="muted">…</p>:list.length===0?<p className="muted">Murojaat yo‘q.</p>:list.map(r=><div key={r.id} className="card admin-report">
   <div className="admin-report-head"><span className="pill">{CAT[r.category]||r.category}</span><small>{r.createdAt}{r.lang?` · ${r.lang.toUpperCase()}`:''}</small></div>
   {r.subject&&<strong>{r.subject}</strong>}
   <p>{r.body}</p>
   <small className="muted">{r.reporter?`Yuboruvchi: ${r.reporter}`:'Anonim'}{r.contact?` · Aloqa: ${r.contact}`:''}</small>
   <textarea rows={2} placeholder="Izoh (ixtiyoriy)" defaultValue={r.note||''} onChange={e=>setNotes({...notes,[r.id]:e.target.value})}/>
   <button className="button secondary" onClick={()=>set(r.id,status==='open'?'resolved':'open')}>{status==='open'?'Hal qilindi deb belgilash':'Qayta ochish'}</button>
  </div>)}
 </>;
}

function Users(){
 const [q,setQ]=useState('');
 const [list,setList]=useState<User[]|null>(null);
 const load=useCallback(async(query:string)=>{const r=await callApi<{users:User[]}>('/admin/users?q='+encodeURIComponent(query));if(r.ok)setList(r.data.users)},[]);
 useEffect(()=>{const t=setTimeout(()=>load(q),250);return()=>clearTimeout(t)},[q,load]);
 const change=async(id:string,patch:{role?:string;suspended?:boolean;verified?:boolean})=>{await callApi('/admin/users','PUT',{id,...patch});load(q)};
 return <>
  <input className="admin-search" value={q} placeholder="Email yoki ism bo‘yicha qidirish" onChange={e=>setQ(e.target.value)}/>
  {list===null?<p className="muted">…</p>:list.length===0?<p className="muted">Topilmadi.</p>:list.map(u=><div key={u.id} className={'card admin-user'+(u.suspended?' off':'')}>
   <div><strong>{u.name||'—'}</strong>{u.admin&&<span className="pill">Admin</span>}{u.pro&&u.pro.reason!=='free'&&<span className="pill">{({trial:'Sinov','admin-grant':'Pro (sovg‘a)',paid:'Pro'} as Record<string,string>)[u.pro.reason]}</span>}{u.suspended&&<span className="pill warn">To‘xtatilgan</span>}<small>{u.email} · {u.createdAt.slice(0,10)}</small></div>
   {u.role==='dentist'&&u.publishRequested&&u.profile&&<div className="admin-profile">
    {u.profile.photoUrl&&<AdminPhoto url={u.profile.photoUrl}/>}
    <b>{u.verified?'✓ Tasdiqlangan (bemorlarga ko‘rinadi)':'Tasdiqlash kutilmoqda'}</b>
    <small>{[u.profile.specialty,u.profile.workplace,u.profile.address,u.profile.city].filter(Boolean).join(' · ')||'—'}</small>
    <small>{[u.profile.phone&&'☎ '+u.profile.phone,u.profile.telegram&&'TG '+u.profile.telegram,u.profile.instagram&&'IG '+u.profile.instagram,u.profile.email].filter(Boolean).join(' · ')||'—'}</small>
    {u.profile.map&&<small>{u.profile.map}</small>}
    <button className={'button'+(u.verified?' secondary':'')} onClick={()=>change(u.id,{verified:!u.verified})}>{u.verified?'Tasdiqni olib tashlash':'Litsenziya tekshirildi: tasdiqlash'}</button>
   </div>}
   <div className="admin-user-actions">
    <select aria-label="Rol" value={u.role} onChange={e=>change(u.id,{role:e.target.value})}>{Object.entries(ROLE).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    {!u.admin&&<button className="button secondary" onClick={()=>{if(!u.suspended||window.confirm('Hisobni qayta yoqasizmi?'))change(u.id,{suspended:!u.suspended})}}>{u.suspended?'Yoqish':'To‘xtatish'}</button>}
   </div>
  </div>)}
 </>;
}

type Grant={email:string;months:number|null;grantedBy:string;grantedAt:string;until:string|null;registered:boolean;pending:boolean};
const ERR:Record<string,string>={bad_email:'Email noto‘g‘ri.',bad_months:'Muddat noto‘g‘ri.',patient_is_free:'Bemorlar uchun ilova bepul: Pro kerak emas.',rate_limited:'Juda tez-tez. Biroz kuting.',not_found:'Topilmadi.',bad_device:'Qurilma ID noto‘g‘ri.'};
/** Admin → Pro: grant Pro to any e-mail for 1/3/6/12 months or until revoked; an address without an account waits and applies at sign-up. */
function ProGrants(){
 const [list,setList]=useState<Grant[]|null>(null);
 const [email,setEmail]=useState(''),[months,setMonths]=useState('1'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await callApi<{grants:Grant[]}>('/admin/grants');if(r.ok)setList(r.data.grants)},[]);
 useEffect(()=>{void load()},[load]);
 const grant=async()=>{setMsg('');setBusy(true);
  const r=await callApi<{applied?:boolean;pending?:boolean}>('/admin/grants','POST',{email:email.trim(),months:months==='all'?null:Number(months)});
  setBusy(false);
  if(r.ok){setMsg(r.data.pending?'Saqlandi: ro‘yxatdan o‘tganda faollashadi.':'Pro berildi.');setEmail('');void load()}else setMsg(ERR[r.data.error||'']||'Xatolik.')};
 const revoke=async(e:string)=>{if(!window.confirm(e+': Proni bekor qilasizmi?'))return;const r=await callApi('/admin/grants','DELETE',{email:e});setMsg(r.ok?'Bekor qilindi.':ERR[r.data.error||'']||'Xatolik.');void load()};
 const [rEmail,setREmail]=useState(''),[rDev,setRDev]=useState('');
 const resetTrial=async()=>{setMsg('');const r=await callApi('/admin/trial','POST',{email:rEmail.trim(),deviceId:rDev.trim()||undefined});setMsg(r.ok?'Sinov muddati tiklandi.':ERR[r.data.error||'']||'Xatolik.');if(r.ok){setREmail('');setRDev('')}};
 return <div className="admin-pro">
  <div className="card admin-user"><div className="cr-form">
   <label>Email<input type="email" inputMode="email" autoCapitalize="off" value={email} maxLength={254} placeholder="ism@example.com" onChange={e=>setEmail(e.target.value)}/></label>
   <label>Muddat<select value={months} onChange={e=>setMonths(e.target.value)}><option value="1">1 oy</option><option value="3">3 oy</option><option value="6">6 oy</option><option value="12">12 oy</option><option value="all">Cheksiz</option></select></label>
   <button className="button" disabled={busy||!email.trim()} onClick={grant}>Pro berish</button>
   {msg&&<p className="muted" role="status">{msg}</p>}
  </div></div>
  <div className="card admin-user"><div className="cr-form">
   <strong>Sinov muddatini tiklash</strong>
   <label>Email<input type="email" value={rEmail} maxLength={254} onChange={e=>setREmail(e.target.value)}/></label>
   <label>Qurilma ID (ixtiyoriy)<input value={rDev} maxLength={36} onChange={e=>setRDev(e.target.value)}/></label>
   <button className="button secondary" disabled={!rEmail.trim()} onClick={resetTrial}>Tiklash</button>
  </div></div>
  {list===null?<p className="muted">…</p>:list.length===0?<p className="muted">Faol sovg‘alar yo‘q.</p>:list.map(g=><div key={g.email} className="card admin-user">
   <div><strong>{g.email}</strong>{g.pending&&<span className="pill warn">Kutilmoqda</span>}<small>{g.until?'gacha: '+g.until.slice(0,10):'Cheksiz'}{g.pending?' (ro‘yxatdan o‘tganda boshlanadi · '+(g.months?g.months+' oy':'cheksiz')+')':''} · bergan: {g.grantedBy} · {g.grantedAt.slice(0,10)}</small></div>
   <div className="admin-actions"><button className="button secondary" onClick={()=>revoke(g.email)}>Bekor qilish</button></div>
  </div>)}
 </div>;
}
