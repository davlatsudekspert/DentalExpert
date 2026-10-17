import {CreditCard, Instagram, Mail, MapPin, Phone, Send} from 'lucide-react';
import type {Lang} from './discoveryData';

const words={
 uz:{heading:'Bog‘lanish',phone:'Qo‘ng‘iroq',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Xarita',card:'Karta',note:'Demo profil: haqiqiy kontaktlar tasdiqlanmaguncha havolalar ochilmaydi.'},
 ru:{heading:'Контакты',phone:'Звонок',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Карта',card:'Реквизиты',note:'Демо-профиль: ссылки не откроются до проверки настоящих контактов.'},
 en:{heading:'Connect',phone:'Call',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Map',card:'Card',note:'Sample profile: links stay inactive until real contact details are verified.'}
};

type Channel={kind:string;value:string};
const handle=/^@?[A-Za-z0-9_.]{2,32}$/;
/** Only a verified, well-formed destination becomes a link; anything else is dropped. */
export function contactHref(c:Channel):string|null{
 const v=c.value.trim();
 switch(c.kind){
  case 'phone':return /^\+?[0-9 ()-]{7,20}$/.test(v)?'tel:'+v.replace(/[^\d+]/g,''):null;
  case 'telegram':return handle.test(v)?'https://t.me/'+v.replace(/^@/,''):null;
  case 'instagram':return handle.test(v)?'https://www.instagram.com/'+v.replace(/^@/,''):null;
  case 'email':return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)?'mailto:'+v:null;
  case 'map':return /^https:\/\/[^\s]+$/.test(v)?v:null;
  default:return null;
 }
}

export default function ContactPreview({lang,onNotice,contacts:real}:{lang:Lang;onNotice:(message:string)=>void;contacts?:Channel[]}){
 const t=words[lang];
 if(real){
  const live=real.map(c=>({c,href:contactHref(c)})).filter((x):x is {c:Channel;href:string}=>!!x.href);
  const icons:Record<string,typeof Phone>={phone:Phone,telegram:Send,instagram:Instagram,email:Mail,map:MapPin};
  const none={uz:'Tasdiqlangan aloqa vositalari hali qo‘shilmagan.',ru:'Проверенные контакты ещё не добавлены.',en:'No verified contact details have been added yet.'}[lang];
  return <section className="contact-preview" aria-label={t.heading}>
   <h2>{t.heading}</h2>
   {live.length?<div className="contact-actions">{live.map(({c,href})=>{const Icon=icons[c.kind]||Mail;return <a key={c.kind+c.value} className={'contact-action channel-'+c.kind} href={href} target={c.kind==='map'?'_blank':undefined} rel="noopener noreferrer" aria-label={(t as Record<string,string>)[c.kind]}><span><Icon size={21} strokeWidth={1.9}/></span><small>{(t as Record<string,string>)[c.kind]}</small></a>})}</div>:<p>{none}</p>}
  </section>;
 }
 const contacts=[['phone',Phone],['telegram',Send],['instagram',Instagram],['email',Mail],['map',MapPin],['card',CreditCard]] as const;
 return <section className="contact-preview" aria-label={t.heading}>
  <h2>{t.heading}</h2><div className="contact-actions">{contacts.map(([key,Icon])=><button key={key} className={'contact-action channel-'+key} onClick={()=>onNotice(t.note)} aria-label={t[key]}><span><Icon size={21} strokeWidth={1.9}/></span><small>{t[key]}</small></button>)}</div><p>{t.note}</p>
 </section>;
}
