import {useState} from 'react';
import {ArrowRight, Mail} from 'lucide-react';
import type {Lang} from './discoveryData';

export type DesignScreen='verifyEmail';

export const designTitles:Record<Lang,Record<DesignScreen,string>>={
 en:{verifyEmail:'Verify email'},
 ru:{verifyEmail:'Подтверждение email'},
 uz:{verifyEmail:'Emailni tasdiqlash'}
};

const words={
 uz:{live:{sentTo:'Kod yuborildi:',verifyBtn:'Tasdiqlash',invalid:'Kod noto‘g‘ri yoki muddati o‘tgan.',left:'Qolgan urinish:',locked:'Juda ko‘p urinish. Yangi kod so‘rang.',resent:'Yangi kod yuborildi.',wait:'Qayta yuborishdan oldin kuting (soniya):',failed:'Xat yuborilmadi. Keyinroq urinib ko‘ring.',network:'Tarmoq xatosi. Qayta urinib ko‘ring.',noEmail:'Avval email kiriting.',back:'Ro‘yxatdan o‘tishga qaytish'},verify:'Elektron pochtangizni tasdiqlang',verifyHelp:'Haqiqiy ilovada 6 xonali kod emailga yuboriladi. Bu yerda yuborish xizmati ulanmagan.',code:'Tasdiqlash kodi',demo:'Dizayn namunasi · haqiqiy xizmat hali ulanmagan',continue:'Demo sahifaga o‘tish',resend:'Kodni qayta yuborish',step:'HISOB XAVFSIZLIGI / 02'},
 ru:{live:{sentTo:'Код отправлен на:',verifyBtn:'Подтвердить',invalid:'Код неверный или истёк.',left:'Осталось попыток:',locked:'Слишком много попыток. Запросите новый код.',resent:'Новый код отправлен.',wait:'Подождите перед повторной отправкой (сек):',failed:'Не удалось отправить письмо. Попробуйте позже.',network:'Ошибка сети. Повторите попытку.',noEmail:'Сначала укажите email.',back:'Вернуться к регистрации'},verify:'Подтвердите электронную почту',verifyHelp:'В рабочем приложении шестизначный код придёт по email. Сервис отправки ещё не подключён.',code:'Код подтверждения',demo:'Образец дизайна · реальный сервис пока не подключён',continue:'Перейти к демо',resend:'Отправить код снова',step:'БЕЗОПАСНОСТЬ АККАУНТА / 02'},
 en:{live:{sentTo:'Code sent to:',verifyBtn:'Verify',invalid:'The code is wrong or has expired.',left:'Attempts left:',locked:'Too many attempts. Request a new code.',resent:'A new code was sent.',wait:'Wait before resending (seconds):',failed:'The email could not be sent. Try again later.',network:'Network error. Please try again.',noEmail:'Enter your email first.',back:'Back to sign up'},verify:'Confirm your email',verifyHelp:'The live app will send a six-digit email code. Delivery is not connected in this prototype.',code:'Verification code',demo:'Design preview · no live service connected',continue:'Continue to demo',resend:'Resend code',step:'ACCOUNT SECURITY / 02'}
};

export type EmailAuth={email:string;onVerify:(code:string)=>Promise<{ok:boolean;error?:string;attemptsLeft?:number}>;onResend:()=>Promise<{ok:boolean;error?:string;retryAfterSec?:number}>};

export default function DesignCompletion({screen,lang,onNavigate,roleHome,auth}:{screen:DesignScreen;lang:Lang;onNavigate:(s:string)=>void;roleHome:string;auth?:EmailAuth}){
 const t=words[lang];
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
 return <div className="completion-page email-verification">
  <span className="eyebrow">{t.step}</span><div className="completion-hero-icon"><Mail size={31}/></div>
  <h2>{t.verify}</h2><p>{t.verifyHelp}</p>
  <label className="completion-code">{t.code}<input inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="• • • • • •" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
  <button className="completion-link" onClick={()=>setNotice(t.demo)}>{t.resend}</button>
  <button className="button" onClick={()=>onNavigate(roleHome)}>{t.continue}<ArrowRight size={18}/></button>
  <p className="completion-note" role="status">{notice||t.demo}</p>
 </div>;
}
