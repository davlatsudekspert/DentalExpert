import {CreditCard, Instagram, Mail, MapPin, Phone, Send} from 'lucide-react';
import type {Lang} from './discoveryData';

const words={
 uz:{heading:'Bog‘lanish',phone:'Qo‘ng‘iroq',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Xarita',card:'Karta',note:'Demo profil: haqiqiy kontaktlar tasdiqlanmaguncha havolalar ochilmaydi.'},
 ru:{heading:'Контакты',phone:'Звонок',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Карта',card:'Реквизиты',note:'Демо-профиль: ссылки не откроются до проверки настоящих контактов.'},
 en:{heading:'Connect',phone:'Call',telegram:'Telegram',instagram:'Instagram',email:'Email',map:'Map',card:'Card',note:'Sample profile: links stay inactive until real contact details are verified.'}
};

export default function ContactPreview({lang,onNotice}:{lang:Lang;onNotice:(message:string)=>void}){
 const t=words[lang];
 const contacts=[['phone',Phone],['telegram',Send],['instagram',Instagram],['email',Mail],['map',MapPin],['card',CreditCard]] as const;
 return <section className="contact-preview" aria-label={t.heading}>
  <h2>{t.heading}</h2><div className="contact-actions">{contacts.map(([key,Icon])=><button key={key} className={'contact-action channel-'+key} onClick={()=>onNotice(t.note)} aria-label={t[key]}><span><Icon size={21} strokeWidth={1.9}/></span><small>{t[key]}</small></button>)}</div><p>{t.note}</p>
 </section>;
}
