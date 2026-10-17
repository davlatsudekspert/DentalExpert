import {useCallback,useEffect,useState} from 'react';
import {ExternalLink,X} from 'lucide-react';
import {callApi} from './api';

type Stats={users:{total:number;byRole:Record<string,number>;last7:number;last30:number;activeSessions:number;suspended:number;daily:{day:string;n:number}[]};classroom:{groups:number;members:number;assignments:number;submissions:number};doctors:{verified:number;demo:number};reports:{open:number;total:number}};
type Report={id:string;category:string;subject:string|null;body:string;contact:string|null;lang:string|null;status:'open'|'resolved';note:string|null;createdAt:string;reporter:string|null};
type User={id:string;email:string;name:string|null;role:string;createdAt:string;suspended:boolean;admin:boolean};
const ROLE:Record<string,string>={patient:'Bemor',dentist:'Stomatolog',teacher:'Ustoz',student:'Talaba'};
const CAT:Record<string,string>={complaint:'Shikoyat',content:'Nomaqbul kontent',bug:'Xato',advertising:'Reklama',other:'Boshqa'};

/** Owner-only panel. The server checks the admin e-mail on every request; this screen is only a front end. */
export default function Admin({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<'stats'|'reports'|'users'>('stats');
 const [stats,setStats]=useState<Stats|null>(null);
 const [err,setErr]=useState('');
 const loadStats=useCallback(async()=>{const r=await callApi<Stats>('/admin/stats');if(r.ok)setStats(r.data);else setErr(r.status===403?'Ruxsat yo‘q':'Yuklanmadi')},[]);
 useEffect(()=>{loadStats()},[loadStats]);
 return <div className="quiz-run admin" role="dialog" aria-label="Admin panel">
  <div className="quiz-run-bar"><strong>Admin panel</strong><button onClick={onClose} aria-label="Yopish"><X size={20}/></button></div>
  <div className="admin-tabs">{([['stats','Statistika'],['reports',`Shikoyatlar${stats?.reports.open?` (${stats.reports.open})`:''}`],['users','Foydalanuvchilar']] as const).map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
  <div className="quiz-run-body">
   {err&&<p className="cr-error" role="alert">{err}</p>}
   {tab==='stats'&&(stats?<StatsView s={stats}/>:!err&&<p className="muted">…</p>)}
   {tab==='reports'&&<Reports onChanged={loadStats}/>}
   {tab==='users'&&<Users/>}
  </div>
 </div>;
}

function StatsView({s}:{s:Stats}){
 const max=Math.max(1,...s.users.daily.map(d=>d.n));
 const card=(n:number|string,l:string)=><div className="admin-card"><b>{n}</b><span>{l}</span></div>;
 return <>
  <div className="admin-grid">{card(s.users.total,'Jami foydalanuvchi')}{card(s.users.last7,'7 kunda yangi')}{card(s.users.last30,'30 kunda yangi')}{card(s.users.activeSessions,'Hozir tizimda (faol sessiya)')}</div>
  <h3>Rollar</h3>
  <div className="admin-grid">{Object.entries(ROLE).map(([k,l])=>card(s.users.byRole[k]||0,l))}</div>
  <h3>Oxirgi 14 kun ro‘yxatdan o‘tish</h3>
  <div className="admin-bars" aria-label="Kunlik ro‘yxatdan o‘tish">{s.users.daily.map(d=><div key={d.day} title={`${d.day}: ${d.n}`}><i style={{height:`${(d.n/max)*100}%`}}/><small>{d.day.slice(8)}</small></div>)}{s.users.daily.length===0&&<p className="muted">Hali yo‘q</p>}</div>
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
 const change=async(id:string,patch:{role?:string;suspended?:boolean})=>{await callApi('/admin/users','PUT',{id,...patch});load(q)};
 return <>
  <input className="admin-search" value={q} placeholder="Email yoki ism bo‘yicha qidirish" onChange={e=>setQ(e.target.value)}/>
  {list===null?<p className="muted">…</p>:list.length===0?<p className="muted">Topilmadi.</p>:list.map(u=><div key={u.id} className={'card admin-user'+(u.suspended?' off':'')}>
   <div><strong>{u.name||'—'}</strong>{u.admin&&<span className="pill">Admin</span>}{u.suspended&&<span className="pill warn">To‘xtatilgan</span>}<small>{u.email} · {u.createdAt.slice(0,10)}</small></div>
   <div className="admin-user-actions">
    <select aria-label="Rol" value={u.role} onChange={e=>change(u.id,{role:e.target.value})}>{Object.entries(ROLE).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    {!u.admin&&<button className="button secondary" onClick={()=>{if(!u.suspended||window.confirm('Hisobni qayta yoqasizmi?'))change(u.id,{suspended:!u.suspended})}}>{u.suspended?'Yoqish':'To‘xtatish'}</button>}
   </div>
  </div>)}
 </>;
}
