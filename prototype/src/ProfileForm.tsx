import {useState} from 'react';
import {Check} from 'lucide-react';
import {saveProfile,type AuthUser} from './api';
import type {Lang} from './discoveryData';

const words={
 en:{name:'Full name',phone:'Phone',work:'Workplace',specialty:'Specialty',address:'Address',telegram:'Telegram username',instagram:'Instagram username',email:'Contact email (public)',map:'Map link (https://…)',bio:'About you',save:'Save',saved:'Saved',signIn:'Sign in to edit your profile.',
  publish:'Show my profile to patients',publishHint:'Patients will see your name, workplace, address and the contact buttons below after the app owner verifies you.',
  s0:'Not shown to patients',s1:'Waiting for verification',s2:'Verified and visible to patients',changed:'Changing your name or contact details requires a new verification.',
  contacts:'Contact buttons for patients',
  e:{bad_phone:'Invalid phone number',bad_telegram:'Telegram username: letters, digits, _ . (2–32)',bad_instagram:'Instagram username: letters, digits, _ . (2–32)',bad_email:'Invalid email address',bad_map:'The map link must start with https://',name_required:'Enter your name',other:'Not saved. Please try again'}},
 ru:{name:'Имя и фамилия',phone:'Телефон',work:'Место работы',specialty:'Специальность',address:'Адрес',telegram:'Имя в Telegram',instagram:'Имя в Instagram',email:'Контактный email (публичный)',map:'Ссылка на карту (https://…)',bio:'О себе',save:'Сохранить',saved:'Сохранено',signIn:'Войдите, чтобы редактировать профиль.',
  publish:'Показывать мой профиль пациентам',publishHint:'После проверки владельцем приложения пациенты увидят ваше имя, место работы, адрес и кнопки связи ниже.',
  s0:'Не показывается пациентам',s1:'Ожидает проверки',s2:'Проверен и виден пациентам',changed:'Изменение имени или контактов требует повторной проверки.',
  contacts:'Кнопки связи для пациентов',
  e:{bad_phone:'Неверный номер телефона',bad_telegram:'Telegram: буквы, цифры, _ . (2–32)',bad_instagram:'Instagram: буквы, цифры, _ . (2–32)',bad_email:'Неверный адрес email',bad_map:'Ссылка на карту должна начинаться с https://',name_required:'Введите имя',other:'Не сохранено. Попробуйте ещё раз'}},
 uz:{name:'Ism va familiya',phone:'Telefon',work:'Ish joyi',specialty:'Mutaxassislik',address:'Manzil',telegram:'Telegram foydalanuvchi nomi',instagram:'Instagram foydalanuvchi nomi',email:'Aloqa uchun email (ochiq)',map:'Xarita havolasi (https://…)',bio:'O‘zingiz haqingizda',save:'Saqlash',saved:'Saqlandi',signIn:'Profilni tahrirlash uchun hisobga kiring.',
  publish:'Profilimni bemorlarga ko‘rsatish',publishHint:'Ilova egasi tasdiqlagach, bemorlar ismingiz, ish joyingiz, manzilingiz va quyidagi aloqa tugmalarini ko‘radi.',
  s0:'Bemorlarga ko‘rsatilmaydi',s1:'Tasdiqlash kutilmoqda',s2:'Tasdiqlangan va bemorlarga ko‘rinadi',changed:'Ism yoki aloqa ma’lumotlarini o‘zgartirsangiz, qayta tasdiqlash kerak bo‘ladi.',
  contacts:'Bemorlar uchun aloqa tugmalari',
  e:{bad_phone:'Telefon raqami noto‘g‘ri',bad_telegram:'Telegram: harf, raqam, _ . (2–32)',bad_instagram:'Instagram: harf, raqam, _ . (2–32)',bad_email:'Email manzili noto‘g‘ri',bad_map:'Xarita havolasi https:// bilan boshlanishi kerak',name_required:'Ismingizni kiriting',other:'Saqlanmadi. Qayta urinib ko‘ring'}}
};

/** Profile editor. A dentist can enter the contact channels patients will see and ask to be listed; the owner verifies before anything is shown. */
export default function ProfileForm({lang,user,onSaved}:{lang:Lang;user:AuthUser|null;onSaved:(u:AuthUser)=>void}){
 const t=words[lang];
 const [f,setF]=useState(()=>({name:user?.name||'',phone:user?.phone||'',workplace:user?.workplace||'',specialty:user?.specialty||'',address:user?.address||'',telegram:user?.telegram||'',instagram:user?.instagram||'',publicEmail:user?.publicEmail||'',mapUrl:user?.mapUrl||'',bio:user?.bio||'',publishRequested:!!user?.publishRequested}));
 const [msg,setMsg]=useState('');
 const [ok,setOk]=useState(false);
 if(!user)return <p className="muted">{t.signIn}</p>;
 const dentist=user.role==='dentist',pro=dentist||user.role==='teacher';
 const set=(k:keyof typeof f)=>(e:{target:{value:string}})=>setF({...f,[k]:e.target.value});
 const status=!user.publishRequested?0:user.verified?2:1;
 const submit=async(e:{preventDefault:()=>void})=>{
  e.preventDefault();setMsg('');setOk(false);
  const r=await saveProfile(f);
  if(r.ok&&r.data.user){onSaved(r.data.user);setOk(true)}else setMsg((t.e as Record<string,string>)[r.data.error||'']||t.e.other);
 };
 return <form className="profile-form" onSubmit={submit}>
  <div className="edit-avatar"><div className="avatar mint-avatar big">{(f.name.replace(/^Dr\.?\s+/i,'').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2)||'?').toUpperCase()}</div></div>
  <label>{t.name}<input required maxLength={80} value={f.name} onChange={set('name')}/></label>
  <label>{t.phone}<input type="tel" inputMode="tel" maxLength={30} value={f.phone} onChange={set('phone')} placeholder="+998 90 000 00 00"/></label>
  {pro&&<label>{t.work}<input maxLength={100} value={f.workplace} onChange={set('workplace')}/></label>}
  {dentist&&<>
   <label>{t.specialty}<input maxLength={80} value={f.specialty} onChange={set('specialty')}/></label>
   <label>{t.address}<input maxLength={150} value={f.address} onChange={set('address')}/></label>
   <h3>{t.contacts}</h3>
   <label>{t.telegram}<input maxLength={33} autoCapitalize="none" value={f.telegram} onChange={set('telegram')} placeholder="@username"/></label>
   <label>{t.instagram}<input maxLength={33} autoCapitalize="none" value={f.instagram} onChange={set('instagram')} placeholder="@username"/></label>
   <label>{t.email}<input type="email" maxLength={120} autoCapitalize="none" value={f.publicEmail} onChange={set('publicEmail')} placeholder="name@example.com"/></label>
   <label>{t.map}<input type="url" maxLength={300} autoCapitalize="none" value={f.mapUrl} onChange={set('mapUrl')} placeholder="https://maps.google.com/…"/></label>
  </>}
  {pro&&<label>{t.bio}<textarea rows={4} maxLength={600} value={f.bio} onChange={set('bio')}/></label>}
  {dentist&&<div className="card publish-card">
   <label className="publish-row"><input type="checkbox" checked={f.publishRequested} onChange={e=>setF({...f,publishRequested:e.target.checked})}/><span><strong>{t.publish}</strong><small>{t.publishHint}</small></span></label>
   <p className={'publish-status s'+status} role="status">{[t.s0,t.s1,t.s2][status]}</p>
   <small className="muted">{t.changed}</small>
  </div>}
  {msg&&<p className="cr-error" role="alert">{msg}</p>}
  {ok&&<p className="cr-score" role="status">{t.saved}</p>}
  <button className="button" type="submit">{t.save}<Check size={18}/></button>
 </form>;
}
