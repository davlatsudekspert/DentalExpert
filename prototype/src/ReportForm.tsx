import {useState} from 'react';
import {X} from 'lucide-react';
import {callApi} from './api';
import type {Lang} from './discoveryData';

const words={
 uz:{title:'Shikoyat yoki murojaat',cat:'Mavzu',cats:{complaint:'Shikoyat',content:'Nomaqbul kontent',bug:'Ilovadagi xato',other:'Boshqa'},subject:'Kim yoki nima haqida? (ixtiyoriy)',text:'Xabaringiz',contact:'Aloqa uchun telefon yoki email (ixtiyoriy)',send:'Yuborish',sent:'Rahmat! Murojaatingiz qabul qilindi. Ko‘rib chiqamiz.',err:'Yuborilmadi. Qayta urinib ko‘ring.',rate:'Juda ko‘p murojaat. Keyinroq urinib ko‘ring.',short:'Kamida 5 belgi yozing.',close:'Yopish',hint:'Shifokor, guruh yoki kontent haqida shikoyat qilish uchun nomini yozing.'},
 ru:{title:'Жалоба или обращение',cat:'Тема',cats:{complaint:'Жалоба',content:'Недопустимый контент',bug:'Ошибка в приложении',other:'Другое'},subject:'О ком или о чём? (необязательно)',text:'Ваше сообщение',contact:'Телефон или email для связи (необязательно)',send:'Отправить',sent:'Спасибо! Обращение принято. Мы его рассмотрим.',err:'Не отправлено. Попробуйте ещё раз.',rate:'Слишком много обращений. Попробуйте позже.',short:'Напишите не менее 5 символов.',close:'Закрыть',hint:'Чтобы пожаловаться на врача, группу или контент, укажите название.'},
 en:{title:'Complaint or message',cat:'Topic',cats:{complaint:'Complaint',content:'Inappropriate content',bug:'App bug',other:'Other'},subject:'About whom or what? (optional)',text:'Your message',contact:'Phone or email so we can reply (optional)',send:'Send',sent:'Thank you! Your message was received and we will review it.',err:'Not sent. Please try again.',rate:'Too many messages. Try again later.',short:'Please write at least 5 characters.',close:'Close',hint:'To report a doctor, group or content, include its name.'}
};

/** Complaints, content reports and bug reports. Works signed in or not; also satisfies App Store guideline 1.2 (a way to report content). */
export default function ReportForm({lang,onClose}:{lang:Lang;onClose:()=>void}){
 const t=words[lang];
 const [category,setCategory]=useState('complaint');
 const [subject,setSubject]=useState('');
 const [body,setBody]=useState('');
 const [contact,setContact]=useState('');
 const [msg,setMsg]=useState('');
 const [done,setDone]=useState(false);
 const [busy,setBusy]=useState(false);
 const send=async()=>{
  setMsg('');
  if(body.trim().length<5){setMsg(t.short);return}
  setBusy(true);
  const r=await callApi('/reports','POST',{category,subject,body,contact,lang});
  setBusy(false);
  if(r.ok)setDone(true);else setMsg(r.status===429?t.rate:t.err);
 };
 return <div className="quiz-run" role="dialog" aria-label={t.title}>
  <div className="quiz-run-bar"><strong>{t.title}</strong><button onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   {done?<><p className="cr-score" role="status">{t.sent}</p><button className="button" onClick={onClose}>{t.close}</button></>:<div className="cr-form">
    <p className="muted">{t.hint}</p>
    <label>{t.cat}<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.entries(t.cats).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <label>{t.subject}<input value={subject} maxLength={120} onChange={e=>setSubject(e.target.value)}/></label>
    <label>{t.text}<textarea rows={6} maxLength={2000} value={body} onChange={e=>setBody(e.target.value)}/></label>
    <label>{t.contact}<input value={contact} maxLength={120} onChange={e=>setContact(e.target.value)}/></label>
    {msg&&<p className="cr-error" role="alert">{msg}</p>}
    <button className="button" disabled={busy} onClick={send}>{t.send}</button>
   </div>}
  </div>
 </div>;
}
