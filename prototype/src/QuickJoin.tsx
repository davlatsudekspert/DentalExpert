import {useEffect,useRef,useState} from 'react';
import {Check,ClipboardList,LogIn,RotateCw,TriangleAlert,Users,X} from 'lucide-react';
import {callApi,quickJoin,type AuthUser} from './api';
import {ScoreCard,TestReview,TestRun,loadTestItems,testError,testTitle,testWords,type TestItem,type TestMeta} from './classTest';
import {pendingQuickTest} from './joinLink';
import './quiz.css';
import './learn.css';
import type {Lang} from './discoveryData';

const words={
 uz:{title:'Tezkor test',joinTitle:'Guruhga qo‘shilish',code:'Guruh kodi',test:'Test',nick:'Taxallusingiz',nickOpt:'Taxallus (ixtiyoriy)',ph:'Masalan: Lola',note:'Ustoz sizni shu nom bilan ko‘radi. Email yoki parol kerak emas.',noteSigned:'Bo‘sh qoldirsangiz, ustoz sizni raqam bilan ko‘radi.',
  joinBtn:'Qo‘shilish',startBtn:'Testni boshlash',joining:'Qo‘shilmoqda…',joined:'Guruhga qo‘shildingiz',joinedT:(g:string)=>`«${g}» guruhining mavzu va testlari endi sizda ko‘rinadi.`,toGroup:'Guruhga o‘tish',done:'Siz bu testni topshirgansiz',retry:'Qayta urinish',close:'Yopish',nickLen:'Taxallus 2–24 belgidan iborat bo‘lsin.',
  err:{bad_code:'Kod noto‘g‘ri. Ustoz ko‘rsatgan 6 belgili kodni tekshiring.',not_found:'Bunday kodli guruh topilmadi. Kodni ustozdan qayta so‘rang.',test_not_found:'Bu test topilmadi yoki ustoz uni yopgan.',nickname_required:'Taxallusingizni yozing — ustoz sizni shu nom bilan ko‘radi.',bad_nickname:'Taxallus 2–24 belgi: harf, raqam, bo‘sh joy. “Talaba 5” kabi nomlar band.',nickname_rejected:'Bu nomni ishlatib bo‘lmaydi — boshqasini yozing.',nick_taken:'Bu nom guruhda band — boshqasini yozing.',group_full:'Guruh to‘lgan. Ustozingizga ayting.',teacher_cannot_join:'Ustoz hisobi bilan guruhga talaba sifatida qo‘shilib bo‘lmaydi.',rate_limited:'Juda ko‘p urinish. Bir necha daqiqadan so‘ng qayta urinib ko‘ring.',network:'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.',other:'Bajarilmadi. Qayta urinib ko‘ring.'}},
 ru:{title:'Быстрый тест',joinTitle:'Вступить в группу',code:'Код группы',test:'Тест',nick:'Ваш псевдоним',nickOpt:'Псевдоним (необязательно)',ph:'Например: Лола',note:'Преподаватель увидит вас под этим именем. Email и пароль не нужны.',noteSigned:'Если оставить пустым, преподаватель увидит ваш номер.',
  joinBtn:'Вступить',startBtn:'Начать тест',joining:'Вступаем…',joined:'Вы в группе',joinedT:(g:string)=>`Темы и тесты группы «${g}» теперь видны вам.`,toGroup:'Перейти в группу',done:'Вы уже сдали этот тест',retry:'Повторить',close:'Закрыть',nickLen:'Псевдоним — от 2 до 24 символов.',
  err:{bad_code:'Неверный код. Проверьте 6-значный код преподавателя.',not_found:'Группа с таким кодом не найдена. Уточните код у преподавателя.',test_not_found:'Тест не найден или преподаватель его закрыл.',nickname_required:'Введите псевдоним — под ним вас увидит преподаватель.',bad_nickname:'Псевдоним 2–24 символа: буквы, цифры, пробел. Имена вида «Студент 5» заняты.',nickname_rejected:'Это имя использовать нельзя — выберите другое.',nick_taken:'Это имя в группе уже занято — выберите другое.',group_full:'Группа заполнена. Сообщите преподавателю.',teacher_cannot_join:'С аккаунтом преподавателя нельзя вступить в группу как студент.',rate_limited:'Слишком много попыток. Попробуйте через несколько минут.',network:'Нет подключения к интернету. Проверьте связь и попробуйте снова.',other:'Не получилось. Попробуйте ещё раз.'}},
 en:{title:'Quick test',joinTitle:'Join a group',code:'Group code',test:'Test',nick:'Your nickname',nickOpt:'Nickname (optional)',ph:'e.g. Lola',note:'Your teacher sees you by this name. No email or password needed.',noteSigned:'Leave it empty and your teacher sees your number.',
  joinBtn:'Join',startBtn:'Start the test',joining:'Joining…',joined:'You joined the group',joinedT:(g:string)=>`The topics and tests of “${g}” now show up for you.`,toGroup:'Go to the group',done:'You have submitted this test',retry:'Try again',close:'Close',nickLen:'The nickname needs 2–24 characters.',
  err:{bad_code:'Wrong code. Check the 6-character code from your teacher.',not_found:'No group has this code. Ask your teacher for it again.',test_not_found:'This test was not found, or your teacher closed it.',nickname_required:'Type a nickname — your teacher sees you by it.',bad_nickname:'Nickname: 2–24 letters, digits or spaces. Names like “Student 5” are reserved.',nickname_rejected:'That name can’t be used — choose another one.',nick_taken:'That name is taken in this group — choose another one.',group_full:'The group is full. Tell your teacher.',teacher_cannot_join:'A teacher account can’t join a group as a student.',rate_limited:'Too many attempts. Try again in a few minutes.',network:'No internet connection. Check it and try again.',other:'That did not work. Please try again.'}}
};

const NICK='de_nick',PENDING='de_quick';
const lsGet=(k:string)=>{try{return localStorage.getItem(k)}catch{return null}};
const lsSet=(k:string,v:string|null)=>{try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch{/* storage unavailable */}};
/** A QR test this device started and has not submitted: reopen QuickJoin with it on launch to continue where the student stopped. */
export {pendingQuickTest};
export const fmtCode=(c:string)=>c.length===6?`${c.slice(0,3)} ${c.slice(3)}`:c;

type Step={k:'join'}|{k:'joined'}|{k:'test';n:number}|{k:'status';code:string};

/** QR quick test: nickname-only join (a class-only guest when not signed in), then straight into the test. onDone(user) fires once, right after joining. */
export default function QuickJoin({lang,code,testId,signedIn,resume,onDone,onClose}:{lang:Lang;code:string;testId?:string;signedIn:boolean;resume?:boolean;onDone:(user?:AuthUser)=>void;onClose:()=>void}){
 const t=words[lang];
 const tw=testWords[lang];
 const [step,setStep]=useState<Step>({k:'join'});
 const [nick,setNick]=useState(()=>lsGet(NICK)||'');
 const [err,setErr]=useState('');
 const [nickErr,setNickErr]=useState(false);
 const [busy,setBusy]=useState(false);
 const [group,setGroup]=useState<{id:string;name:string}|null>(null);
 const [meta,setMeta]=useState<TestMeta|null>(null);
 const [items,setItems]=useState<TestItem[]|null>(null);
 const joined=useRef(false);
 const input=useRef<HTMLInputElement>(null);
 const n=nick.trim().replace(/\s+/g,' ');
 const nickOk=signedIn?n.length===0||n.length>=2:n.length>=2;
 const pending=(on:boolean)=>lsSet(PENDING,on&&testId?JSON.stringify({code,testId}):null);
 // Fetches the test as this student sees it and decides: already done (score), closed, or run it.
 const openTest=async(gid:string)=>{
  const r=await callApi<{assignments:TestMeta[]}>('/classroom/assignments?groupId='+gid);
  const m=r.ok?r.data.assignments.find(x=>x.id===testId):undefined;
  if(!m){setStep({k:'status',code:r.status===0?'network':'test_not_found'});return}
  setMeta(m);
  if(m.mine?.answer==='done')return showDone(m);
  if(m.status!=='open'){pending(false);setStep({k:'status',code:'closed'});return}
  pending(true);setStep(s=>({k:'test',n:s.k==='test'?s.n+1:0}));
 };
 const showDone=(m:TestMeta)=>{pending(false);setMeta(m);setStep({k:'status',code:'done'});if(m.mine?.review)loadTestItems(m,lang).then(setItems)};
 const join=async()=>{
  if(busy)return;
  if(!nickOk){setErr(t.nickLen);setNickErr(true);input.current?.focus();return}
  setErr('');setNickErr(false);setBusy(true);
  const r=await quickJoin(code,n,testId);
  if(!r.ok){setBusy(false);const e=r.status===0?'network':r.data.error||'other';setErr(e in t.err?t.err[e as keyof typeof t.err]:t.err.other);if(/nick/.test(e)){setNickErr(true);input.current?.focus()}return}
  if(n)lsSet(NICK,n);
  setGroup(r.data.group);
  if(!joined.current){joined.current=true;onDone(r.data.user)}
  if(r.data.test)await openTest(r.data.group.id);else setStep({k:'joined'});
  setBusy(false);
 };
 // Reopened after the app was closed mid-test: go straight back into the test (the server resumes the attempt).
 useEffect(()=>{if(resume&&signedIn)void join()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const testFailed=async(e:string)=>{
  if(e==='already_submitted'&&group){const r=await callApi<{assignments:TestMeta[]}>('/classroom/assignments?groupId='+group.id);const m=r.ok?r.data.assignments.find(x=>x.id===testId):undefined;if(m?.mine?.answer==='done')return showDone(m)}
  if(e!=='network')pending(false);
  setStep({k:'status',code:e});
 };
 if(step.k==='test'&&meta)return <TestRun key={step.n} lang={lang} a={meta} exitLabel={t.toGroup} onExit={onClose} onError={testFailed} onSubmitted={()=>pending(false)}/>;
 const head=group?.name||(testId?t.title:t.joinTitle);
 return <div className="quiz-run qj" role="dialog" aria-modal="true" aria-label={head}>
  <div className="quiz-run-bar"><strong>{head}</strong><button data-close onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   {step.k==='join'?<>
    <div className="qj-hero"><span className="qr-eyebrow">{t.code}</span><b className="qj-code" translate="no">{fmtCode(code)}</b>{testId&&<span className="lg-tag warn"><ClipboardList size={12}/>{t.test}</span>}</div>
    <div className="qj-card">
     <label className="qj-label" htmlFor="qj-nick">{signedIn?t.nickOpt:t.nick}</label>
     <input id="qj-nick" ref={input} className="qj-input" value={nick} maxLength={24} autoFocus autoComplete="nickname" autoCapitalize="words" enterKeyHint="go" placeholder={t.ph} aria-describedby="qj-note" aria-invalid={nickErr||undefined}
      onChange={e=>{setNick(e.target.value);setErr('');setNickErr(false)}} onKeyDown={e=>{if(e.key==='Enter')join()}}/>
     <small id="qj-note" className="qj-help">{t.note}{signedIn?' '+t.noteSigned:''}</small>
     {err&&<p className="cr-error qj-err" role="alert">{err}</p>}
     <button className="button" disabled={busy||!nickOk} onClick={join}>{busy?t.joining:<>{testId?<ClipboardList size={17}/>:<LogIn size={17}/>}{testId?t.startBtn:t.joinBtn}</>}</button>
    </div>
   </>:step.k==='joined'?<div className="qj-center qj-done">
    <span className="qj-badge ok"><Check size={28}/></span><h2>{t.joined}</h2>{group&&<p>{t.joinedT(group.name)}</p>}
    <button className="button" onClick={onClose}><Users size={17}/>{t.toGroup}</button>
   </div>:step.k==='status'&&step.code==='done'&&meta?.mine?<div className="quiz-run-result qj-result">
    <span className="qr-eyebrow">{testTitle(meta,lang)}</span><h2 className="qj-h">{t.done}</h2>
    <ScoreCard lang={lang} score={meta.mine.score??0} total={meta.mine.total??0} note={meta.mine.review?undefined:tw.reviewLater}/>
    {meta.mine.review&&items&&<div className="qj-review"><h3>{tw.review}</h3><TestReview lang={lang} items={items} review={meta.mine.review}/></div>}
    <button className="button" onClick={onClose}><Users size={17}/>{t.toGroup}</button>
   </div>:step.k==='status'?<div className="qj-center qj-done">
    <span className="qj-badge warn"><TriangleAlert size={26}/></span>
    <h2>{step.code in t.err?t.err[step.code as keyof typeof t.err]:testError(lang,step.code)}</h2>{meta&&<p>{testTitle(meta,lang)}</p>}
    {(step.code==='network'||step.code==='other')&&group&&<button className="button" onClick={()=>openTest(group.id)}><RotateCw size={17}/>{t.retry}</button>}
    <button className={'button'+(step.code==='network'?' secondary':'')} onClick={onClose}><Users size={17}/>{t.toGroup}</button>
   </div>:null}
  </div>
 </div>;
}
