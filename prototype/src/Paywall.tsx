import {compareTable} from './proCompare';
import {attestationOn} from './attestationConfig';
import {useEffect,useState} from 'react';
import {Check,Lock,RotateCcw,X} from 'lucide-react';
import {billing,hidePaywall,listPrice,PRO_ENABLED,proActive,productOf,refreshPro,usePaywall,usePro,yearlySavingPct,type Offer,type PlanKind} from './billing';
import {daysLeft,FEATURE_ROLES,FREE,isPremiumProduct,planForRole,TRIAL_DAYS,type Period,type PlanRole,type ProFeature} from './proConfig';
import type {Lang} from './discoveryData';
import {EDU} from './edition';
import './pro.css';

const W={
 uz:{title:'Dental Expert Pro',trial:(n:number)=>`Sinov muddati: ${n} kun qoldi`,trialEnded:'Sinov muddati tugadi: hozir bepul rejadasiz',paid:'Pro faol',grant:'Pro faol (sovg‘a)',until:(d:string)=>`${d} gacha`,
  free:(n:number,g:boolean)=>`Bepul reja: kuniga ${n} ta mashq savoli, har fan bo‘yicha dastlabki ${FREE.topicsPerSubject} ta mavzu${g?`, ${FREE.groups} ta guruh`:''}. Sinfingizdagi testlar har doim bepul.`,
  why:{topics:'Bu mavzu Pro tarkibida.',practice:`Bugungi ${FREE.practicePerDay} ta bepul savol tugadi.`,exam:'Imtihon rejimi Pro tarkibida.',review:'Takrorlash Pro tarkibida.',atlas3d:'To‘liq 3D atlas Pro tarkibida.',groups:`Bepul rejada ${FREE.groups} ta guruh.`,generalTests:'Umumiy testlar Pro tarkibida.',present:'Taqdimot rejimi Pro tarkibida.',listing:'Ommaviy ro‘yxat Pro tarkibida.'} as Record<ProFeature,string>,
  month:'Oylik',year:'Yillik',per:{monthly:'oyiga',yearly:'yiliga'},save:(p:number)=>`${p}% tejash`,buy:'Obuna bo‘lish',busy:'Kuting…',restore:'Xaridlarni tiklash',close:'Yopish',
  appOnly:'Obuna iOS yoki Android ilovasida rasmiylashtiriladi. Ilovada shu hisob bilan kiring: Pro bu yerda ham ishlaydi.',signin:'Sinov va obuna uchun hisobingizga kiring.',signinBtn:'Kirish',
  renew:'Obuna tanlangan davr oxirida avtomatik yangilanadi, agar uni kamida 24 soat oldin do‘kon sozlamalarida bekor qilmasangiz. To‘lov Apple ID yoki Google Play hisobingizdan yechiladi. Obunani App Store (Apple ID → Obunalar) yoki Google Play (Obunalar) orqali boshqarasiz va bekor qilasiz.',
  trialUsed:'Bu qurilmada yoki hisobda sinov muddati allaqachon ishlatilgan: bepul rejadasiz.',held:(h:string,c:string)=>`Sizda ${h} tarifi bor; ${c} paneli uchun ${c} tarifi kerak.`,roleNames:{student:'Talaba',teacher:'Ustoz',dentist:'Mutaxassis'} as Record<string,string>,terms:'Foydalanish shartlari',privacy:'Maxfiylik siyosati',ok:'Pro faollashtirildi',wait:'To‘lov qabul qilindi, Pro tez orada faollashadi.',err:'Xarid amalga oshmadi. Qayta urinib ko‘ring.',restored:'Tiklash tugadi.',list:'Narx (USD)',patient:'Bemorlar uchun ilova bepul.',premium:'Premium',premiumTag:'Hammasi ochiq: barcha rollar',premiumLine:'Premium = barcha rollar uchun Pro: talaba, ustoz va mutaxassis imkoniyatlari bitta tarifda.',upgrade:'Barcha rollaringiz uchun bitta tarif: Premium.',ownHead:(r:string)=>`${r} tarifi`},
 ru:{title:'Dental Expert Pro',trial:(n:number)=>`Пробный период: осталось ${n} дн.`,trialEnded:'Пробный период закончился: сейчас бесплатный план',paid:'Pro активен',grant:'Pro активен (подарок)',until:(d:string)=>`до ${d}`,
  free:(n:number,g:boolean)=>`Бесплатный план: ${n} вопросов практики в день, первые ${FREE.topicsPerSubject} темы каждого предмета${g?`, ${FREE.groups} группа`:''}. Тесты вашего класса всегда бесплатны.`,
  why:{topics:'Эта тема входит в Pro.',practice:`Бесплатные ${FREE.practicePerDay} вопросов на сегодня закончились.`,exam:'Режим экзамена входит в Pro.',review:'Повторение входит в Pro.',atlas3d:'Полный 3D-атлас входит в Pro.',groups:`В бесплатном плане ${FREE.groups} группа.`,generalTests:'Общие тесты входят в Pro.',present:'Режим презентации входит в Pro.',listing:'Публичный список входит в Pro.'} as Record<ProFeature,string>,
  month:'Месяц',year:'Год',per:{monthly:'в месяц',yearly:'в год'},save:(p:number)=>`выгода ${p}%`,buy:'Оформить подписку',busy:'Подождите…',restore:'Восстановить покупки',close:'Закрыть',
  appOnly:'Подписка оформляется в приложении для iOS или Android. Войдите в приложении с этим аккаунтом: Pro заработает и здесь.',signin:'Войдите в аккаунт, чтобы начать пробный период и подписку.',signinBtn:'Войти',
  renew:'Подписка продлевается автоматически в конце выбранного периода, если не отменить её в настройках магазина минимум за 24 часа. Оплата списывается с вашего Apple ID или аккаунта Google Play. Управлять подпиской и отменить её можно в App Store (Apple ID → Подписки) или Google Play (Подписки).',
  trialUsed:'Пробный период на этом устройстве или аккаунте уже использован: у вас бесплатный план.',held:(h:string,c:string)=>`У вас тариф «${h}»; для роли «${c}» нужен тариф «${c}».`,roleNames:{student:'Студент',teacher:'Преподаватель',dentist:'Специалист'} as Record<string,string>,terms:'Условия использования',privacy:'Политика конфиденциальности',ok:'Pro активирован',wait:'Платёж принят, Pro скоро заработает.',err:'Покупка не удалась. Попробуйте ещё раз.',restored:'Восстановление завершено.',list:'Цена (USD)',patient:'Для пациентов приложение бесплатно.',premium:'Premium',premiumTag:'Всё открыто: все роли',premiumLine:'Premium = Pro для всех ролей: возможности студента, преподавателя и специалиста в одном тарифе.',upgrade:'Один тариф для всех ваших ролей: Premium.',ownHead:(r:string)=>`Тариф «${r}»`},
 en:{title:'Dental Expert Pro',trial:(n:number)=>`Free trial: ${n} ${n===1?'day':'days'} left`,trialEnded:'Your free trial has ended: you are on the Free plan',paid:'Pro is active',grant:'Pro is active (gift)',until:(d:string)=>`until ${d}`,
  free:(n:number,g:boolean)=>`Free plan: ${n} practice questions a day, the first ${FREE.topicsPerSubject} topics of each subject${g?`, ${FREE.groups} group`:''}. Tests in your class are always free.`,
  why:{topics:'This topic is part of Pro.',practice:`You have used today’s ${FREE.practicePerDay} free questions.`,exam:'Exam mode is part of Pro.',review:'Review is part of Pro.',atlas3d:'The full 3D atlas is part of Pro.',groups:`The Free plan has ${FREE.groups} group.`,generalTests:'General tests are part of Pro.',present:'Presentation mode is part of Pro.',listing:'The public listing is part of Pro.'} as Record<ProFeature,string>,
  month:'Monthly',year:'Yearly',per:{monthly:'per month',yearly:'per year'},save:(p:number)=>`save ${p}%`,buy:'Subscribe',busy:'Please wait…',restore:'Restore purchases',close:'Close',
  appOnly:'Subscriptions are bought in the iOS or Android app. Sign in there with this account and Pro works here too.',signin:'Sign in to start your free trial or subscribe.',signinBtn:'Sign in',
  renew:'The subscription renews automatically at the end of the chosen period unless you cancel it in your store settings at least 24 hours before. Payment is charged to your Apple ID or Google Play account. You manage and cancel it in the App Store (Apple ID → Subscriptions) or Google Play (Subscriptions).',
  trialUsed:'The free trial has already been used on this device or account: you are on the Free plan.',held:(h:string,c:string)=>`You hold the ${h} plan; the ${c} role needs the ${c} plan.`,roleNames:{student:'Student',teacher:'Teacher',dentist:'Specialist'} as Record<string,string>,terms:'Terms of Use',privacy:'Privacy Policy',ok:'Pro is on',wait:'Payment received, Pro will switch on shortly.',err:'The purchase did not go through. Please try again.',restored:'Restore finished.',list:'Price (USD)',patient:'The app is free for patients.',premium:'Premium',premiumTag:'Everything unlocked: all roles',premiumLine:'Premium = Pro for every role: student, teacher and specialist features in one plan.',upgrade:'One plan for all your roles: Premium.',ownHead:(r:string)=>`${r} plan`}
};
const TERMS='https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY='https://dental-expert.pages.dev/privacy/';
const dateOf=(iso:string|null,lang:Lang)=>iso?new Date(iso).toLocaleDateString(lang==='uz'?'uz-UZ':lang==='ru'?'ru-RU':'en-GB'):'';

/** Plan status line for Profil and the paywall header. */
export function planStatus(lang:Lang,pro:ReturnType<typeof usePro>['pro']){
 const t=W[lang];
 if(!pro)return '';
 if(pro.reason==='trial')return t.trial(daysLeft(pro.trialEndsAt));
 if(pro.reason==='paid')return (pro.plan&&isPremiumProduct(pro.plan)?t.premium:t.paid)+(pro.expiresAt?' · '+t.until(dateOf(pro.expiresAt,lang)):'');
 if(pro.reason==='admin-grant')return t.grant+(pro.expiresAt?' · '+t.until(dateOf(pro.expiresAt,lang)):'');
 if(pro.active)return '';
 return pro.trialUsed?t.trialUsed:t.trialEnded;
}
/** Note when the account holds a plan of another role than its current one (empty otherwise). */
export function heldNote(lang:Lang,pro:ReturnType<typeof usePro>['pro'],role:string|null){
 if(!pro?.heldRole||!role||pro.heldRole===role)return '';
 const t=W[lang];return t.held(t.roleNames[pro.heldRole]||pro.heldRole,t.roleNames[role]||role);
}

/** The paywall sheet: opened by showPaywall(), from a 402 answer or a limit prompt. Dismissible; it never covers sign-out, privacy or delete account. */
export default function PaywallHost({lang,onSignIn}:{lang:Lang;onSignIn:()=>void}){
 const {open,feature}=usePaywall();
 const {userId,role,pro}=usePro();
 const t=W[lang];
 const plan=role?planForRole(role):null;
 const [offers,setOffers]=useState<Offer[]>([]);
 const [native,setNative]=useState(false);
 const [period,setPeriod]=useState<Period>('yearly');
 const [kind,setKind]=useState<PlanKind>('role');
 const [busy,setBusy]=useState(false);
 const [msg,setMsg]=useState('');
 useEffect(()=>{if(!open||!role||!plan)return;let live=true;setMsg('');setKind(pro?.heldRole&&pro.heldRole!==role?'premium':'role');
  void billing.available().then(a=>{if(!live)return;setNative(a);if(a){void billing.identify(userId!);void billing.offers(role as PlanRole).then(o=>live&&setOffers(o))}});
  return()=>{live=false}},[open,role,userId]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(!open)return;const k=(e:KeyboardEvent)=>{if(e.key==='Escape')hidePaywall()};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[open]);
 if(!PRO_ENABLED||!open)return null;
 const price=(p:Period,k:PlanKind)=>offers.find(o=>o.period===p&&isPremiumProduct(o.productId)===(k==='premium'))?.price||`$${listPrice((role||'student') as PlanRole,p,k).toFixed(2)}`;
 const buy=async()=>{if(!plan||busy)return;setBusy(true);setMsg('');
  const r=await billing.purchase(productOf(role as PlanRole,period,kind));
  if(r==='ok'){const p=await refreshPro(6,true);setMsg(p?.reason==='paid'?t.ok:t.wait);if(p?.reason==='paid')setTimeout(hidePaywall,900)}
  else if(r==='error')setMsg(t.err);
  setBusy(false)};
 const restore=async()=>{if(busy)return;setBusy(true);setMsg('');const r=await billing.restore();if(r==='ok'){await refreshPro(4,true);setMsg(t.restored)}else setMsg(t.err);setBusy(false)};
 // The Android education edition has no public dentist listing, so it is not offered there.
  const status=planStatus(lang,pro);
 return <div className="quiz-run pw" role="dialog" aria-modal="true" aria-label={t.title}>
  <div className="quiz-run-bar"><strong>{t.title}</strong><button data-close onClick={hidePaywall} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body pw-body">
   {role==='patient'?<p className="muted">{t.patient}</p>:<>
   {heldNote(lang,pro,role)&&<p className="pw-why" role="note">{heldNote(lang,pro,role)} {t.upgrade}</p>}
   {status&&<p className={'pw-status'+(pro?.reason==='trial'?' pw-trial':'')} role="status">{status}</p>}
   {feature&&!proActive()&&<p className="pw-why"><Lock size={15}/>{t.why[feature]}</p>}
   {!proActive()&&<p className="pw-free">{t.free(FREE.practicePerDay,FEATURE_ROLES.groups.includes(role as PlanRole))}</p>}
   {(()=>{const c=compareTable(lang,role||'',{attestation:attestationOn(lang),listing:!EDU});return <div className="pw-compare" role="table" aria-label={c.title}>
    <h3>{c.title}</h3>
    <div className="pw-row pw-head" role="row"><span role="columnheader"/><span role="columnheader">{c.free}</span><span role="columnheader">{c.pro}</span></div>
    {c.rows.map(r=><div key={r.id} className="pw-row" role="row"><span role="rowheader">{r.label}</span><span className={r.locked?'pw-no':''} role="cell">{r.free}</span><b role="cell">{r.pro}</b></div>)}
    <p className="muted pw-always">{c.always}</p>
    <p className="pw-premium-line">{t.premiumLine}</p></div>})()}
   {!userId?<><p className="muted">{t.signin}</p><button className="button" onClick={()=>{hidePaywall();onSignIn()}}>{t.signinBtn}</button></>
    :plan&&<>
     {(['role','premium'] as PlanKind[]).map(k=><section key={k} className={'pw-group'+(k==='premium'?' pw-premium':'')} aria-label={k==='premium'?t.premium:t.ownHead(t.roleNames[role as string]||'')}>
      <h3>{k==='premium'?<>{t.premium} <small>{t.premiumTag}</small></>:t.ownHead(t.roleNames[role as string]||'')}</h3>
      <div className="pw-plans" role="radiogroup" aria-label={k==='premium'?t.premium:t.title}>
       {(['monthly','yearly'] as Period[]).map(p=>{const on=kind===k&&period===p;return <button key={p} role="radio" aria-checked={on} className={'pw-plan'+(on?' on':'')} onClick={()=>{setKind(k);setPeriod(p)}}>
        <b>{p==='monthly'?t.month:t.year}</b><span className="pw-price">{price(p,k)}</span><small>{t.per[p]}</small>
        {p==='yearly'&&yearlySavingPct(role as PlanRole,k)>0&&<i className="pw-save">{t.save(yearlySavingPct(role as PlanRole,k))}</i>}
       </button>})}
      </div>
     </section>)}
     {!native&&<p className="muted pw-note">{t.appOnly}</p>}
     {native&&<button className="button" disabled={busy||proActive()&&pro?.reason==='paid'} onClick={buy}>{busy?t.busy:t.buy}</button>}
     {native&&<button className="pw-link" disabled={busy} onClick={restore}><RotateCcw size={14}/>{t.restore}</button>}
     {msg&&<p className="pw-msg" role="status">{msg}</p>}
     <p className="pw-legal">{t.renew}</p>
    </>}
   <p className="pw-legal pw-links"><a href={TERMS} target="_blank" rel="noopener noreferrer">{t.terms}</a> · <a href={PRIVACY} target="_blank" rel="noopener noreferrer">{t.privacy}</a></p>
   </>}
  </div>
 </div>;
}
export {TRIAL_DAYS};
