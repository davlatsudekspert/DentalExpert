import {useEffect,useState} from 'react';
import {BadgeCheck,BookOpen,Check,ChevronRight,Clock,EyeOff,ExternalLink,GraduationCap,HeartPulse,Info,LifeBuoy,LogOut,MessageSquareWarning,ShieldCheck,Stethoscope,Trash2,UserCog,UserRound,Users} from 'lucide-react';
import {callApi,type AuthUser} from './api';
import {progressSummary} from './Achievements';
import {loadPatients} from './Patients';
import {EDU} from './edition';
import {LANG_LABEL,LANG_ORDER} from './i18n';
import type {Lang} from './discoveryData';
import LogoMark from './LogoMark';
import './profile.css';

type Role=AuthUser['role'];
const ROLES:Role[]=EDU?['dentist','teacher','student']:['dentist','teacher','student','patient'];
const RICON={dentist:Stethoscope,teacher:GraduationCap,student:BookOpen,patient:HeartPulse} as const;
const w={
 uz:{role:'Rolim',roleHint:'Rol bosh sahifa va imkoniyatlarni belgilaydi. Istalgan vaqtda qaytarish mumkin.',roles:{dentist:'Stomatolog',teacher:'Ustoz',student:'Talaba',patient:'Bemor'},change:'Rolni almashtirish',keep:'Bekor qilish',
  leave:'Ommaviy profilingiz yashiriladi: bemorlar sizni endi topa olmaydi. Yana Stomatolog bo‘lsangiz, profil qayta tasdiqlanishi kerak. Rolni almashtiramizmi?',leaveOk:'Ha, almashtirish',ask:(r:string)=>`Rolingiz «${r}» bo‘ladi va bosh sahifa almashadi.`,
  err:{rate_limited:'Bugun rol juda ko‘p almashtirildi. Ertaga urinib ko‘ring.',other:'Rol almashtirilmadi. Qayta urinib ko‘ring.'},
  edit:'Tahrirlash',filled:(n:number)=>`Profil ${n}% to‘ldirilgan`,fill:'To‘ldirish',st:['Ommaga ko‘rsatilmagan','Tasdiq kutilmoqda','Tasdiqlangan · ommaviy'],
  level:'Daraja',xp:'XP',streak:'Kun ketma-ket',topics:'Mavzu',patients:'Bemor',groups:'Guruh',students:'Talaba',
  admin:'Admin paneli',adminSub:'Foydalanuvchilar, shikoyatlar, tasdiqlash',language:'Ilova tili',look:'Ko‘rinish',ivory:'Oq',colour:'Rangli',help:'Yordam va maxfiylik',privacy:'Maxfiylik',contact:'Yordam va aloqa',contactSub:'Veb-sayt',report:'Shikoyat yoki murojaat yuborish',
  about:'Ilova haqida',account:'Hisob',out:'Chiqish',del:'Hisobni o‘chirish',delSub:'Hisob va ma’lumotlar butunlay o‘chiriladi',demoOut:'Chiqish (demo)',guest:'Tezkor hisob'},
 ru:{role:'Моя роль',roleHint:'Роль определяет главный экран и инструменты. Вернуть прежнюю можно в любой момент.',roles:{dentist:'Стоматолог',teacher:'Преподаватель',student:'Студент',patient:'Пациент'},change:'Сменить роль',keep:'Отмена',
  leave:'Ваш публичный профиль будет скрыт: пациенты больше не найдут вас. Если снова станете стоматологом, профиль нужно будет проверить заново. Сменить роль?',leaveOk:'Да, сменить',ask:(r:string)=>`Ваша роль станет «${r}», главный экран изменится.`,
  err:{rate_limited:'Сегодня роль менялась слишком часто. Попробуйте завтра.',other:'Роль не изменена. Попробуйте ещё раз.'},
  edit:'Изменить',filled:(n:number)=>`Профиль заполнен на ${n}%`,fill:'Заполнить',st:['Не опубликован','Ожидает проверки','Проверен · виден'],
  level:'Уровень',xp:'XP',streak:'Дней подряд',topics:'Тем',patients:'Пациентов',groups:'Групп',students:'Студентов',
  admin:'Панель администратора',adminSub:'Пользователи, жалобы, проверка',language:'Язык приложения',look:'Оформление',ivory:'Светлая',colour:'Цветная',help:'Помощь и конфиденциальность',privacy:'Конфиденциальность',contact:'Помощь и контакты',contactSub:'Сайт',report:'Отправить жалобу или обращение',
  about:'О приложении',account:'Аккаунт',out:'Выйти',del:'Удалить аккаунт',delSub:'Аккаунт и данные будут удалены навсегда',demoOut:'Выйти (демо)',guest:'Быстрый аккаунт'},
 en:{role:'My role',roleHint:'Your role sets your home screen and tools. You can switch back at any time.',roles:{dentist:'Dentist',teacher:'Educator',student:'Student',patient:'Patient'},change:'Switch role',keep:'Cancel',
  leave:'Your public profile will be hidden: patients will no longer find you. If you become a dentist again, the profile needs a new verification. Switch your role?',leaveOk:'Yes, switch',ask:(r:string)=>`Your role will become “${r}” and your home screen changes.`,
  err:{rate_limited:'You have switched roles too often today. Try again tomorrow.',other:'The role was not changed. Please try again.'},
  edit:'Edit',filled:(n:number)=>`Profile ${n}% complete`,fill:'Complete',st:['Not published','Pending verification','Verified · public'],
  level:'Level',xp:'XP',streak:'Day streak',topics:'Topics',patients:'Patients',groups:'Groups',students:'Students',
  admin:'Admin panel',adminSub:'Users, reports, verification',language:'App language',look:'Appearance',ivory:'Ivory',colour:'Colour',help:'Help and privacy',privacy:'Privacy',contact:'Help and contact',contactSub:'Website',report:'Send a complaint or message',
  about:'About',account:'Account',out:'Sign out',del:'Delete account',delSub:'Your account and data are removed for good',demoOut:'Sign out (demo)',guest:'Quick account'}
};
const filledPct=(u:AuthUser|null,name:string,photo:string)=>{const pro=u?.role==='dentist'||u?.role==='teacher';const f=pro?[name,u?.phone,u?.workplace,u?.bio]:[name,u?.phone,photo];return Math.round(f.filter(x=>x&&String(x).trim()).length/f.length*100)};

/** Profil: header card (photo, role, status, completeness, role-aware stats), the admin entry, role switch, language, appearance, help, about and the account area. */
export default function ProfilePanel({lang,user,role,name,initials,photo,theme,setTheme,setLang,authEnabled,demo,privacyLabel,onEdit,onAdmin,onPrivacy,onReport,onDemoOut,onSignOut,onDelete,onRole}:{lang:Lang;user:AuthUser|null;role:Role;name:string;initials:string;photo:string;theme:'mono'|'color';setTheme:(t:'mono'|'color')=>void;setLang:(l:Lang)=>void;authEnabled:boolean;demo:string;privacyLabel:string;
 onEdit:()=>void;onAdmin:()=>void;onPrivacy:()=>void;onReport:()=>void;onDemoOut:()=>void;onSignOut:()=>void;onDelete:()=>void;onRole:(r:Role)=>Promise<string>}){
 const t=w[lang],signed=!!user&&!user.guest;
 const [open,setOpen]=useState(false),[pick,setPick]=useState<Role|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [grp,setGrp]=useState<{n:number;s:number}|null>(null);
 const teaching=signed&&role==='teacher';
 // A teacher's groups and students come from the classroom API (the same list as the home screen); nothing is shown until it answers.
 useEffect(()=>{if(!teaching){setGrp(null);return}let live=true;void callApi<{groups:{members?:number}[]}>('/classroom/groups').then(r=>{if(live&&r.ok&&Array.isArray(r.data.groups))setGrp({n:r.data.groups.length,s:r.data.groups.reduce((a,g)=>a+(g.members||0),0)})});return()=>{live=false}},[teaching,user?.id]);
 const pct=signed?filledPct(user,name,photo):100;
 const sp=progressSummary();
 const stats:[string|number,string][]=!signed?[]:role==='student'?[[sp.level,t.level],[sp.xp,t.xp],[sp.streak,t.streak]]
  :role==='teacher'?(grp?[[grp.n,t.groups],[grp.s,t.students]]:[]):role==='dentist'?[EDU?[sp.level,t.level]:[loadPatients(user?.id).length,t.patients],[sp.topics,t.topics],[sp.streak,t.streak]]:[];
 const status=signed&&user!.role==='dentist'&&!EDU?(!user!.publishRequested?0:user!.verified?2:1):-1;
 const SI=[EyeOff,Clock,BadgeCheck][status]||EyeOff;
 const RI=RICON[role]||UserRound;
 const leaving=!!user&&user.role==='dentist'&&!!pick&&pick!==user.role&&(user.publishRequested||user.verified)&&!EDU;
 const confirm=async()=>{if(!pick||busy)return;setBusy(true);setErr('');const e=await onRole(pick);setBusy(false);if(e){setErr((t.err as Record<string,string>)[e]||t.err.other)}else{setPick(null);setOpen(false)}};
 const group=(title:string)=><div className="section-title"><h2>{title}</h2></div>;
 const row=(I:typeof Info,label:string,onClick:()=>void,opts?:{sub?:string;ext?:boolean;danger?:boolean;cls?:string})=><button className={'pf-row'+(opts?.danger?' danger':'')+(opts?.cls?' '+opts.cls:'')} onClick={onClick}><span className="pf-ico"><I size={18}/></span><span className="pf-label"><strong>{label}</strong>{opts?.sub&&<small>{opts.sub}</small>}</span>{opts?.ext?<ExternalLink size={16}/>:<ChevronRight size={18}/>}</button>;
 return <div className="pf">
  <section className="pf-card" aria-label={name}>
   <div className="pf-top">
    <div className={'pf-avatar'+(pct<100?' ring':'')} style={{['--p' as string]:pct}}>{photo?<img src={photo} alt=""/>:<span>{initials}</span>}{pct<100&&<i className="pf-pct" aria-hidden="true">{pct}%</i>}</div>
    <div className="pf-id"><h2 translate={name?'no':undefined}>{name||t.roles[role]}</h2>{signed&&user!.email?<p className="pf-mail" translate="no">{user!.email}</p>:<p className="pf-mail">Dental Expert</p>}
     <div className="pf-chips"><span className="pf-chip"><RI size={13}/>{t.roles[role]}</span>{status>=0&&<span className={'pf-chip st s'+status}><SI size={13}/>{t.st[status]}</span>}</div></div>
   </div>
   {signed&&<div className="pf-foot"><button className="pf-edit" onClick={onEdit}><UserRound size={15}/>{t.edit}</button>
    {pct<100&&<button className="pf-bar" onClick={onEdit} aria-label={t.filled(pct)+'. '+t.fill}><span className="pf-bar-t">{t.filled(pct)}<ChevronRight size={13}/></span><span className="pf-track"><i style={{width:pct+'%'}}/></span></button>}</div>}
   {stats.length>0&&<div className="pf-stats" style={{['--n' as string]:stats.length}}>{stats.map(([v,l])=><div key={l}><b>{v}</b><small>{l}</small></div>)}</div>}
  </section>
  {user?.isAdmin&&<button className="admin-entry pf-admin" onClick={onAdmin}><span className="pf-ico"><ShieldCheck size={20}/></span><span className="pf-label"><strong>{t.admin}</strong><small>{t.adminSub}</small></span><ChevronRight size={18}/></button>}
  {signed&&<div className={'pf-group pf-rolebox'+(open?' open':'')}>
   <button className="pf-row pf-rolehead" aria-expanded={open} aria-controls="pf-roles" onClick={()=>{setOpen(!open);setPick(null);setErr('')}}><span className="pf-ico"><UserCog size={18}/></span><span className="pf-label"><strong>{t.role}</strong><small>{t.roles[role]}</small></span><ChevronRight size={18} className="pf-chev"/></button>
   {open&&<div id="pf-roles" className="pf-rolepanel">
    <div className="pf-roles" role="radiogroup" aria-label={t.role}>{ROLES.map(r=>{const I=RICON[r];const on=(pick||role)===r;return <button key={r} role="radio" aria-checked={on} className={on?'on':''} onClick={()=>{setPick(r===role?null:r);setErr('')}}><I size={20}/><b>{t.roles[r]}</b>{r===role&&<Check size={13} className="pf-cur"/>}</button>})}</div>
    {pick&&<div className="pf-confirm" role="alertdialog" aria-labelledby="pf-confirm-t"><p id="pf-confirm-t">{leaving?t.leave:t.ask(t.roles[pick])}</p>
     <div className="pf-actions"><button className="button secondary" onClick={()=>{setPick(null);setErr('')}}>{t.keep}</button><button className="button" disabled={busy} onClick={()=>void confirm()}>{leaving?t.leaveOk:t.change}</button></div></div>}
    {err&&<p className="cr-error" role="alert">{err}</p>}
    {!pick&&<small className="pf-hint">{t.roleHint}</small>}
   </div>}
  </div>}
  {group(t.language)}
  <div className="card settings-list lang-grid">{LANG_ORDER.map(l=><button key={l} onClick={()=>{setLang(l);document.documentElement.lang=l}}><span className="lang-mark" lang={l}>{l.toUpperCase()}</span><strong lang={l}>{LANG_LABEL[l]}</strong><span className={'radio '+(lang===l?'checked':'')}>{lang===l&&<Check size={14}/>}</span></button>)}</div>
  {group(t.look)}
  <div className="card settings-list theme-grid">{(['mono','color'] as const).map(k=><button key={k} aria-pressed={theme===k} className={theme===k?'on':''} onClick={()=>setTheme(k)}><span className={'theme-swatch '+k}/><strong>{k==='mono'?t.ivory:t.colour}</strong></button>)}</div>
  {group(t.help)}
  <div className="pf-group">
   {row(ShieldCheck,privacyLabel,onPrivacy)}
   {row(LifeBuoy,t.contact,()=>window.open('https://dental-expert.pages.dev/contact/#'+lang,'_blank','noopener'),{ext:true,sub:t.contactSub,cls:'pf-contact'})}
   {row(MessageSquareWarning,t.report,onReport,{cls:'pf-report'})}
   {!authEnabled&&row(LogOut,t.demoOut,onDemoOut)}
  </div>
  {group(t.about)}
  <div className="pf-group pf-about"><span className="brand-symbol"><LogoMark/></span><div><b>DENTAL EXPERT</b><small>v1.0</small>{(EDU||!authEnabled)&&<p>{demo}</p>}</div></div>
  {user&&<><div className="pf-sep" role="separator"/>{group(t.account)}<div className="pf-group account-session">
   {row(LogOut,t.out,onSignOut,{cls:'pf-out'})}
   {row(Trash2,t.del,onDelete,{danger:true,sub:t.delSub,cls:'pf-del'})}
  </div></>}
 </div>;
}
