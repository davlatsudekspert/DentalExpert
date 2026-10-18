import {useEffect,useRef,useState} from 'react';
import {Camera,Check,Trash2} from 'lucide-react';
import {deletePhoto,ownPhotoSrc,saveProfile,uploadPhoto,type AuthUser} from './api';
import type {Lang} from './discoveryData';
import {EDU} from './edition';

const words={
 en:{name:'Full name',phone:'Phone',work:'Workplace',specialty:'Specialty',address:'Address',telegram:'Telegram username',instagram:'Instagram username',email:'Contact email (public)',map:'Map link (https://…)',bio:'About you',save:'Save',saved:'Saved',signIn:'Sign in to edit your profile.',
  publish:'Show my profile to patients',publishHint:'Patients will see your name, workplace, address and the contact buttons below after the app owner verifies you.',
  s0:'Not shown to patients',s1:'Waiting for verification',s2:'Verified and visible to patients',changed:'Changing your name or contact details requires a new verification.',
  contacts:'Contact buttons for patients',
  photoAdd:'Add photo',photoChange:'Change',photoRemove:'Remove',photoAlt:'Profile photo',photoBusy:'Uploading…',photoSaved:'Photo saved',photoRemoved:'Photo removed',
  photoHintEdu:'Optional. A square photo of your face for your account.',photoHint:'Optional. A square photo of your face; patients see it only on your published profile. A new photo needs a new verification.',
  pe:{too_large:'The photo is too large. Please choose another one.',bad_file:'This file could not be read as an image.',bad_image:'This image format is not supported.',type_mismatch:'This image format is not supported.',rate_limited:'Too many changes. Try again in an hour.',network:'No connection. The photo was not saved.',other:'The photo was not saved. Please try again.'},
  e:{bad_phone:'Invalid phone number',bad_telegram:'Telegram username: letters, digits, _ . (2–32)',bad_instagram:'Instagram username: letters, digits, _ . (2–32)',bad_email:'Invalid email address',bad_map:'The map link must start with https://',name_required:'Enter your name',other:'Not saved. Please try again'}},
 ru:{name:'Имя и фамилия',phone:'Телефон',work:'Место работы',specialty:'Специальность',address:'Адрес',telegram:'Имя в Telegram',instagram:'Имя в Instagram',email:'Контактный email (публичный)',map:'Ссылка на карту (https://…)',bio:'О себе',save:'Сохранить',saved:'Сохранено',signIn:'Войдите, чтобы редактировать профиль.',
  publish:'Показывать мой профиль пациентам',publishHint:'После проверки владельцем приложения пациенты увидят ваше имя, место работы, адрес и кнопки связи ниже.',
  s0:'Не показывается пациентам',s1:'Ожидает проверки',s2:'Проверен и виден пациентам',changed:'Изменение имени или контактов требует повторной проверки.',
  contacts:'Кнопки связи для пациентов',
  photoAdd:'Добавить фото',photoChange:'Изменить',photoRemove:'Удалить',photoAlt:'Фото профиля',photoBusy:'Загрузка…',photoSaved:'Фото сохранено',photoRemoved:'Фото удалено',
  photoHintEdu:'Необязательно. Квадратное фото вашего лица для вашего аккаунта.',photoHint:'Необязательно. Квадратное фото вашего лица; пациенты видят его только в опубликованном профиле. Новое фото требует повторной проверки.',
  pe:{too_large:'Фото слишком большое. Выберите другое.',bad_file:'Не удалось прочитать файл как изображение.',bad_image:'Этот формат изображения не поддерживается.',type_mismatch:'Этот формат изображения не поддерживается.',rate_limited:'Слишком много изменений. Попробуйте через час.',network:'Нет соединения. Фото не сохранено.',other:'Фото не сохранено. Попробуйте ещё раз.'},
  e:{bad_phone:'Неверный номер телефона',bad_telegram:'Telegram: буквы, цифры, _ . (2–32)',bad_instagram:'Instagram: буквы, цифры, _ . (2–32)',bad_email:'Неверный адрес email',bad_map:'Ссылка на карту должна начинаться с https://',name_required:'Введите имя',other:'Не сохранено. Попробуйте ещё раз'}},
 uz:{name:'Ism va familiya',phone:'Telefon',work:'Ish joyi',specialty:'Mutaxassislik',address:'Manzil',telegram:'Telegram foydalanuvchi nomi',instagram:'Instagram foydalanuvchi nomi',email:'Aloqa uchun email (ochiq)',map:'Xarita havolasi (https://…)',bio:'O‘zingiz haqingizda',save:'Saqlash',saved:'Saqlandi',signIn:'Profilni tahrirlash uchun hisobga kiring.',
  publish:'Profilimni bemorlarga ko‘rsatish',publishHint:'Ilova egasi tasdiqlagach, bemorlar ismingiz, ish joyingiz, manzilingiz va quyidagi aloqa tugmalarini ko‘radi.',
  s0:'Bemorlarga ko‘rsatilmaydi',s1:'Tasdiqlash kutilmoqda',s2:'Tasdiqlangan va bemorlarga ko‘rinadi',changed:'Ism yoki aloqa ma’lumotlarini o‘zgartirsangiz, qayta tasdiqlash kerak bo‘ladi.',
  contacts:'Bemorlar uchun aloqa tugmalari',
  photoAdd:'Rasm qo‘yish',photoChange:'O‘zgartirish',photoRemove:'O‘chirish',photoAlt:'Profil rasmi',photoBusy:'Yuklanmoqda…',photoSaved:'Rasm saqlandi',photoRemoved:'Rasm o‘chirildi',
  photoHintEdu:'Ixtiyoriy. Yuzingiz tushgan kvadrat rasm — hisobingiz uchun.',photoHint:'Ixtiyoriy. Yuzingiz tushgan kvadrat rasm; bemorlar uni faqat e’lon qilingan profilingizda ko‘radi. Yangi rasm qayta tasdiqlashni talab qiladi.',
  pe:{too_large:'Rasm juda katta. Boshqasini tanlang.',bad_file:'Bu faylni rasm sifatida o‘qib bo‘lmadi.',bad_image:'Bu rasm formati qo‘llab-quvvatlanmaydi.',type_mismatch:'Bu rasm formati qo‘llab-quvvatlanmaydi.',rate_limited:'O‘zgarishlar juda ko‘p. Bir soatdan keyin urinib ko‘ring.',network:'Internet aloqasi yo‘q. Rasm saqlanmadi.',other:'Rasm saqlanmadi. Qayta urinib ko‘ring.'},
  e:{bad_phone:'Telefon raqami noto‘g‘ri',bad_telegram:'Telegram: harf, raqam, _ . (2–32)',bad_instagram:'Instagram: harf, raqam, _ . (2–32)',bad_email:'Email manzili noto‘g‘ri',bad_map:'Xarita havolasi https:// bilan boshlanishi kerak',name_required:'Ismingizni kiriting',other:'Saqlanmadi. Qayta urinib ko‘ring'}}
};

const PHOTO_SIZE=512,PHOTO_MAX=200*1024,FILE_MAX=30*1024*1024;
const decodedBytes=(dataUrl:string)=>{const b=dataUrl.slice(dataUrl.indexOf(',')+1);return Math.floor(b.length*3/4)-(b.endsWith('==')?2:b.endsWith('=')?1:0)};
/** Loads the picked file, crops a centred square and scales it to 512×512; WebP where the browser can encode it, else JPEG. */
async function squarePhoto(file:Blob):Promise<string>{
 const src=URL.createObjectURL(file);
 try{
  const img=await new Promise<HTMLImageElement>((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>fail(new Error('bad_file'));i.src=src});
  const w=img.naturalWidth,h=img.naturalHeight,side=Math.min(w,h);
  if(!side)throw new Error('bad_file');
  const c=document.createElement('canvas');c.width=c.height=PHOTO_SIZE;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('bad_file');
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,(w-side)/2,(h-side)/2,side,side,0,0,PHOTO_SIZE,PHOTO_SIZE);
  for(const q of [0.82,0.7,0.55]){
   let d=c.toDataURL('image/webp',q);
   // Safari cannot encode WebP and silently returns PNG instead.
   if(!d.startsWith('data:image/webp;'))d=c.toDataURL('image/jpeg',q);
   if(decodedBytes(d)<=PHOTO_MAX)return d;
  }
  throw new Error('too_large');
 }finally{URL.revokeObjectURL(src)}
}

/** The signed-in user's saved photo as an <img> source (see ownPhotoSrc), or '' when there is none. */
export function useOwnPhoto(photoUrl?:string|null){
 const [src,setSrc]=useState('');
 useEffect(()=>{
  if(!photoUrl){setSrc('');return}
  let off=false,revoke:(()=>void)|undefined;
  void ownPhotoSrc(photoUrl).then(r=>{if(off){r?.revoke?.();return}revoke=r?.revoke;setSrc(r?.src||'')});
  return ()=>{off=true;revoke?.()};
 },[photoUrl]);
 return src;
}

/** Add / change / remove the profile photo. A plain file input, so iOS and Android WebViews offer the photo library and camera. */
function PhotoField({lang,user,initials,onSaved}:{lang:Lang;user:AuthUser;initials:string;onSaved:(u:AuthUser)=>void}){
 const t=words[lang];
 const saved=useOwnPhoto(user.photoUrl);
 const [preview,setPreview]=useState('');
 const [busy,setBusy]=useState(false);
 const [err,setErr]=useState('');
 const [done,setDone]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const shown=preview||saved;
 const fail=(code:string)=>setErr((t.pe as Record<string,string>)[code]||t.pe.other);
 const pick=async(e:{target:HTMLInputElement})=>{
  const file=e.target.files?.[0];e.target.value='';
  if(!file)return;
  setErr('');setDone('');
  if(file.size>FILE_MAX)return fail('too_large');
  let data:string;
  try{data=await squarePhoto(file)}catch(x){return fail((x as Error).message)}
  setPreview(data);setBusy(true);
  const r=await uploadPhoto(data);
  setBusy(false);
  if(r.ok&&r.data.user){onSaved(r.data.user);setDone(t.photoSaved);return}
  setPreview('');fail(r.status===0?'network':r.data.error||'other');
 };
 const remove=async()=>{
  setErr('');setDone('');setBusy(true);
  const r=await deletePhoto();
  setBusy(false);
  if(r.ok&&r.data.user){setPreview('');onSaved(r.data.user);setDone(t.photoRemoved)}else fail(r.status===0?'network':r.data.error||'other');
 };
 return <div className="edit-avatar photo-field">
  {shown?<img className="uploaded-avatar" src={shown} alt={t.photoAlt}/>:<div className="avatar mint-avatar big" aria-hidden="true">{initials}</div>}
  <div className="photo-actions">
   <input ref={input} className="photo-input" type="file" accept="image/*" tabIndex={-1} aria-hidden="true" onChange={pick}/>
   <button type="button" className="button secondary" disabled={busy} onClick={()=>input.current?.click()}><Camera size={16}/>{busy?t.photoBusy:shown?t.photoChange:t.photoAdd}</button>
   {shown&&!busy&&<button type="button" className="text-button photo-remove" onClick={remove}><Trash2 size={14}/>{t.photoRemove}</button>}
  </div>
  <small className="muted">{EDU?t.photoHintEdu:t.photoHint}</small>
  {err&&<p className="cr-error" role="alert">{err}</p>}
  {done&&!err&&<p className="cr-score" role="status">{done}</p>}
 </div>;
}

/** Profile editor. In the full edition a dentist can enter the contact channels patients will see and ask to be listed; the owner verifies before anything is shown. */
export default function ProfileForm({lang,user,onSaved,onPhoto=onSaved}:{lang:Lang;user:AuthUser|null;onSaved:(u:AuthUser)=>void;onPhoto?:(u:AuthUser)=>void}){
 const t=words[lang];
 const [f,setF]=useState(()=>({name:user?.name||'',phone:user?.phone||'',workplace:user?.workplace||'',specialty:user?.specialty||'',address:user?.address||'',telegram:user?.telegram||'',instagram:user?.instagram||'',publicEmail:user?.publicEmail||'',mapUrl:user?.mapUrl||'',bio:user?.bio||'',publishRequested:!!user?.publishRequested}));
 const [msg,setMsg]=useState('');
 const [ok,setOk]=useState(false);
 if(!user)return <p className="muted">{t.signIn}</p>;
 const dentist=user.role==='dentist',pro=dentist||user.role==='teacher';
 const set=(k:keyof typeof f)=>(e:{target:{value:string}})=>setF({...f,[k]:e.target.value});
 const status=!user.publishRequested?0:user.verified?2:1;
 const initials=(f.name.replace(/^Dr\.?\s+/i,'').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2)||'?').toUpperCase();
 const submit=async(e:{preventDefault:()=>void})=>{
  e.preventDefault();setMsg('');setOk(false);
  const r=await saveProfile(f);
  if(r.ok&&r.data.user){onSaved(r.data.user);setOk(true)}else setMsg((t.e as Record<string,string>)[r.data.error||'']||t.e.other);
 };
 return <form className="profile-form" onSubmit={submit}>
  {user.guest?<div className="edit-avatar"><div className="avatar mint-avatar big">{initials}</div></div>:<PhotoField lang={lang} user={user} initials={initials} onSaved={onPhoto}/>}
  <label>{t.name}<input required maxLength={80} value={f.name} onChange={set('name')}/></label>
  <label>{t.phone}<input type="tel" inputMode="tel" maxLength={30} value={f.phone} onChange={set('phone')} placeholder="+998 90 000 00 00"/></label>
  {pro&&<label>{t.work}<input maxLength={100} value={f.workplace} onChange={set('workplace')}/></label>}
  {dentist&&<>
   <label>{t.specialty}<input maxLength={80} value={f.specialty} onChange={set('specialty')}/></label>
  </>}
  {/* Patient-facing contacts and the public dentist listing are a healthcare service: not in the education edition (Android). Saved values are kept as they are. */}
  {dentist&&!EDU&&<>
   <label>{t.address}<input maxLength={150} value={f.address} onChange={set('address')}/></label>
   <h3>{t.contacts}</h3>
   <label>{t.telegram}<input maxLength={33} autoCapitalize="none" value={f.telegram} onChange={set('telegram')} placeholder="@username"/></label>
   <label>{t.instagram}<input maxLength={33} autoCapitalize="none" value={f.instagram} onChange={set('instagram')} placeholder="@username"/></label>
   <label>{t.email}<input type="email" maxLength={120} autoCapitalize="none" value={f.publicEmail} onChange={set('publicEmail')} placeholder="name@example.com"/></label>
   <label>{t.map}<input type="url" maxLength={300} autoCapitalize="none" value={f.mapUrl} onChange={set('mapUrl')} placeholder="https://maps.google.com/…"/></label>
  </>}
  {pro&&<label>{t.bio}<textarea rows={4} maxLength={600} value={f.bio} onChange={set('bio')}/></label>}
  {dentist&&!EDU&&<div className="card publish-card">
   <label className="publish-row"><input type="checkbox" checked={f.publishRequested} onChange={e=>setF({...f,publishRequested:e.target.checked})}/><span><strong>{t.publish}</strong><small>{t.publishHint}</small></span></label>
   <p className={'publish-status s'+status} role="status">{[t.s0,t.s1,t.s2][status]}</p>
   <small className="muted">{t.changed}</small>
  </div>}
  {msg&&<p className="cr-error" role="alert">{msg}</p>}
  {ok&&<p className="cr-score" role="status">{t.saved}</p>}
  <button className="button" type="submit">{t.save}<Check size={18}/></button>
 </form>;
}
