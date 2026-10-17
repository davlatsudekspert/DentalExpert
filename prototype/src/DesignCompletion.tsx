import {useState} from 'react';
import {ArrowRight, CalendarDays, Check, Clock3, Mail, MapPin, Megaphone, ShieldCheck, Sparkles, Users} from 'lucide-react';
import type {Lang} from './discoveryData';

export type DesignScreen='verifyEmail'|'plans'|'adManager';

export const designTitles:Record<Lang,Record<DesignScreen,string>>={
 uz:{verifyEmail:'Emailni tasdiqlash',plans:'Tariflar',adManager:'Reklama kabineti'},
 ru:{verifyEmail:'Подтверждение email',plans:'Тарифы',adManager:'Рекламный кабинет'},
 en:{verifyEmail:'Verify email',plans:'Plans',adManager:'Ad workspace'}
};

const words={
 uz:{live:{sentTo:'Kod yuborildi:',verifyBtn:'Tasdiqlash',invalid:'Kod noto‘g‘ri yoki muddati o‘tgan.',left:'Qolgan urinish:',locked:'Juda ko‘p urinish. Yangi kod so‘rang.',resent:'Yangi kod yuborildi.',wait:'Qayta yuborishdan oldin kuting (soniya):',failed:'Xat yuborilmadi. Keyinroq urinib ko‘ring.',network:'Tarmoq xatosi. Qayta urinib ko‘ring.',noEmail:'Avval email kiriting.',back:'Ro‘yxatdan o‘tishga qaytish'},verify:'Elektron pochtangizni tasdiqlang',verifyHelp:'Haqiqiy ilovada 6 xonali kod emailga yuboriladi. Bu yerda yuborish xizmati ulanmagan.',code:'Tasdiqlash kodi',demo:'Dizayn namunasi · haqiqiy xizmat hali ulanmagan',continue:'Demo sahifaga o‘tish',resend:'Kodni qayta yuborish',step:'HISOB XAVFSIZLIGI / 02',plansEyebrow:'DENTAL EXPERT PLUS',plansTitle:'Kasbiy o‘sish uchun mos reja',plansLead:'Bemorlar uchun asosiy imkoniyatlar bepul. Kasbiy vositalar ehtiyojga qarab ochiladi.',free:'Free',pro:'Pro',trial:'3 oylik tanishuv taklifi',freeA:'Kasbiy profil va qidiruv',freeB:'5 tagacha onlayn qabul so‘rovi',freeC:'Asosiy darslar va hamjamiyat',proA:'Kengaytirilgan qabul boshqaruvi',proB:'Guruh, topshiriq va portfel',proC:'Kengaytirilgan kasbiy vositalar',price:'Sinov narxlari: talaba $3.99/oy · stomatolog/ustoz $9.99/oy. Yakuniy narx do‘konda ko‘rsatiladi.',compare:'Tariflarni solishtirish',adsEyebrow:'KASBIY KABINET / MARKETING',adsTitle:'Mahalliy auditoriyaga ko‘rining',adsLead:'Reklama shahar bo‘yicha ajratiladi va bemor ekranida aniq belgi bilan chiqadi.',location:'Tanlangan shahar',slots:'4 ko‘rinadigan joy',maximum:'5 faol homiy chegarasi',duration:'Davomiylik',preview:'Joylashuv namunasi',campaign:'Kampaniya yaratish',honest:'To‘lov va nashr hozir ishlamaydi. Reklama joylashuvi faqat dizayn namunasi.'},
 ru:{live:{sentTo:'Код отправлен на:',verifyBtn:'Подтвердить',invalid:'Код неверный или истёк.',left:'Осталось попыток:',locked:'Слишком много попыток. Запросите новый код.',resent:'Новый код отправлен.',wait:'Подождите перед повторной отправкой (сек):',failed:'Не удалось отправить письмо. Попробуйте позже.',network:'Ошибка сети. Повторите попытку.',noEmail:'Сначала укажите email.',back:'Вернуться к регистрации'},verify:'Подтвердите электронную почту',verifyHelp:'В рабочем приложении шестизначный код придёт по email. Сервис отправки ещё не подключён.',code:'Код подтверждения',demo:'Образец дизайна · реальный сервис пока не подключён',continue:'Перейти к демо',resend:'Отправить код снова',step:'БЕЗОПАСНОСТЬ АККАУНТА / 02',plansEyebrow:'DENTAL EXPERT PLUS',plansTitle:'План для профессионального роста',plansLead:'Основные функции для пациентов бесплатны. Профессиональные инструменты открываются по мере необходимости.',free:'Free',pro:'Pro',trial:'3 месяца знакомства',freeA:'Профиль и поиск',freeB:'До 5 онлайн-заявок на приём',freeC:'Базовые уроки и сообщество',proA:'Расширенное управление записью',proB:'Группы, задания и портфолио',proC:'Дополнительные профессиональные инструменты',price:'Тестовые цены: студент $3.99/мес · врач/преподаватель $9.99/мес. Итоговую цену покажет магазин.',compare:'Сравнить планы',adsEyebrow:'ПРОФЕССИОНАЛЬНЫЙ КАБИНЕТ / МАРКЕТИНГ',adsTitle:'Будьте заметны в своём городе',adsLead:'Реклама привязана к городу и явно обозначена для пациента.',location:'Выбранный город',slots:'4 видимых места',maximum:'Не более 5 активных спонсоров',duration:'Срок',preview:'Пример размещения',campaign:'Создать кампанию',honest:'Оплата и публикация пока не работают. Это только макет размещения.'},
 en:{live:{sentTo:'Code sent to:',verifyBtn:'Verify',invalid:'The code is wrong or has expired.',left:'Attempts left:',locked:'Too many attempts. Request a new code.',resent:'A new code was sent.',wait:'Wait before resending (seconds):',failed:'The email could not be sent. Try again later.',network:'Network error. Please try again.',noEmail:'Enter your email first.',back:'Back to sign up'},verify:'Confirm your email',verifyHelp:'The live app will send a six-digit email code. Delivery is not connected in this prototype.',code:'Verification code',demo:'Design preview · no live service connected',continue:'Continue to demo',resend:'Resend code',step:'ACCOUNT SECURITY / 02',plansEyebrow:'DENTAL EXPERT PLUS',plansTitle:'A plan for every stage of practice',plansLead:'Core patient access stays free. Professional tools grow with your needs.',free:'Free',pro:'Pro',trial:'Proposed three-month trial',freeA:'Professional profile and discovery',freeB:'Up to 5 online appointment requests',freeC:'Core lessons and community',proA:'Expanded appointment management',proB:'Groups, assignments and portfolio',proC:'Advanced professional tools',price:'Test prices: student $3.99/mo · dentist/educator $9.99/mo. The store will show the final local price.',compare:'Compare plans',adsEyebrow:'PROFESSIONAL WORKSPACE / MARKETING',adsTitle:'Reach people in your city',adsLead:'Sponsored placement is city based and clearly labelled for patients.',location:'Selected city',slots:'4 visible places',maximum:'5 active sponsors maximum',duration:'Duration',preview:'Placement preview',campaign:'Create campaign',honest:'Payment and publishing are not connected. This is a placement design preview.'}
};

export type EmailAuth={email:string;onVerify:(code:string)=>Promise<{ok:boolean;error?:string;attemptsLeft?:number}>;onResend:()=>Promise<{ok:boolean;error?:string;retryAfterSec?:number}>};

export default function DesignCompletion({screen,lang,onNavigate,city,roleHome,auth}:{screen:DesignScreen;lang:Lang;onNavigate:(s:string)=>void;city:string;roleHome:string;auth?:EmailAuth}){
 const t=words[lang];
 const [duration,setDuration]=useState(3);
 const [code,setCode]=useState('');
 const [notice,setNotice]=useState('');
 if(screen==='verifyEmail'&&auth){
  const L=t.live;
  const verify=async()=>{
   const r=await auth.onVerify(code);
   if(r.ok){onNavigate(roleHome);return}
   setNotice(r.error==='too_many_attempts'?L.locked:r.error==='network'?L.network:L.invalid+(r.attemptsLeft!==undefined?` ${L.left} ${r.attemptsLeft}`:''));
  };
  const resend=async()=>{
   const r=await auth.onResend();
   setNotice(r.ok?L.resent:r.error==='resend_too_soon'?`${L.wait} ${r.retryAfterSec??60}`:r.error==='email_send_failed'?L.failed:r.error==='network'?L.network:L.failed);
  };
  return <div className="completion-page email-verification">
   <span className="eyebrow">{t.step}</span><div className="completion-hero-icon"><Mail size={31}/></div>
   <h2>{t.verify}</h2>
   {auth.email?<p>{L.sentTo} <b>{auth.email}</b></p>:<p>{L.noEmail}</p>}
   {auth.email?<><label className="completion-code">{t.code}<input inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="• • • • • •" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
   <button className="completion-link" onClick={resend}>{t.resend}</button>
   <button className="button" disabled={code.length!==6} onClick={verify}>{L.verifyBtn}<ArrowRight size={18}/></button></>
   :<button className="button" onClick={()=>onNavigate('signup')}>{L.back}<ArrowRight size={18}/></button>}
   <p className="completion-note" role="status">{notice}</p>
  </div>;
 }
 if(screen==='verifyEmail')return <div className="completion-page email-verification">
  <span className="eyebrow">{t.step}</span><div className="completion-hero-icon"><Mail size={31}/></div>
  <h2>{t.verify}</h2><p>{t.verifyHelp}</p>
  <label className="completion-code">{t.code}<input inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="• • • • • •" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
  <button className="completion-link" onClick={()=>setNotice(t.demo)}>{t.resend}</button>
  <button className="button" onClick={()=>onNavigate(roleHome)}>{t.continue}<ArrowRight size={18}/></button>
  <p className="completion-note" role="status">{notice||t.demo}</p>
 </div>;
 if(screen==='plans')return <div className="completion-page plans-page">
  <span className="eyebrow">{t.plansEyebrow}</span><h2>{t.plansTitle}</h2><p>{t.plansLead}</p>
  <div className="plan-card"><div className="plan-title"><span>{t.free}</span><ShieldCheck size={19}/></div><strong>0</strong><small>{lang==='uz'?'Bemorlar uchun doim bepul':lang==='ru'?'Для пациентов всегда бесплатно':'Always free for patients'}</small><ul><li><Check size={15}/>{t.freeA}</li><li><Check size={15}/>{t.freeB}</li><li><Check size={15}/>{t.freeC}</li></ul></div>
  <div className="plan-card featured"><div className="plan-title"><span>{t.pro}</span><Sparkles size={19}/></div><span className="trial-pill">{t.trial}</span><ul><li><Check size={15}/>{t.proA}</li><li><Check size={15}/>{t.proB}</li><li><Check size={15}/>{t.proC}</li></ul><small>{t.price}</small></div>
  <p className="completion-note">{t.demo}</p>
 </div>;
 return <div className="completion-page ads-page">
  <span className="eyebrow">{t.adsEyebrow}</span><h2>{t.adsTitle}</h2><p>{t.adsLead}</p>
  <div className="ad-summary"><Megaphone size={24}/><div><b>{t.location}</b><strong>{city}</strong></div><Sparkles size={20}/></div>
  <div className="ad-stats"><div><Users size={19}/><b>4</b><span>{t.slots}</span></div><div><CalendarDays size={19}/><b>5</b><span>{t.maximum}</span></div></div>
  <h3>{t.duration}</h3><div className="ad-durations">{[1,3,6,10].map(days=><button aria-pressed={duration===days} className={duration===days?'active':''} key={days} onClick={()=>setDuration(days)}>{days} {lang==='uz'?'kun':lang==='ru'?'дн.':'days'}</button>)}</div>
  <div className="ad-preview"><span className="eyebrow">{t.preview}</span><div className="ad-preview-card"><span><MapPin size={19}/></span><div><b>Dental Expert</b><small>{city} · {lang==='uz'?'Namuna reklama':lang==='ru'?'Пример рекламы':'Sample ad'}</small></div><ArrowRight size={17}/></div><p><Clock3 size={14}/>{duration} {lang==='uz'?'kunlik tanlov':lang==='ru'?'дней выбрано':'days selected'}</p></div>
  <button className="button" onClick={()=>setNotice(t.honest)}>{t.campaign}<ArrowRight size={18}/></button><p className="completion-note" role="status">{notice||t.honest}</p>
 </div>;
}
