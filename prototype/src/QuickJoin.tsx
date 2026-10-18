import {useEffect,useRef,useState} from 'react';
import {Check,ClipboardList,Eye,GraduationCap,LogIn,RotateCw,TriangleAlert,UserPlus,Users,X} from 'lucide-react';
import {callApi,quickJoin,type AuthUser,type QuickJoined} from './api';
import {PreviewRun,ScoreCard,TestReview,TestRun,fmtDue,loadTestItems,revealNote,testError,testTitle,testWords,type TestItem,type TestMeta} from './classTest';
import {clearPending,pendingQuickTest,savePending} from './joinLink';
import {APOSTROPHES,checkNick} from './classroomShared';
import './quiz.css';
import './learn.css';
import type {Lang} from './discoveryData';

const words={
 uz:{title:'Sinf testi',joinTitle:'Guruhga qo‘shilish',code:'Guruh kodi',test:'Test',nick:'Taxallusingiz',ph:'Masalan: Lola',note:'Ustoz va katta ekran sizni shu nom bilan ko‘radi — email yoki ismingiz ko‘rinmaydi.',
  joinBtn:'Qo‘shilish',startBtn:'Testni boshlash',joining:'Qo‘shilmoqda…',checking:'Tekshirilmoqda…',joined:'Guruhga qo‘shildingiz',joinedT:(g:string)=>`«${g}» guruhining mavzu va testlari endi sizda ko‘rinadi.`,toGroup:'Guruhga o‘tish',done:'Siz bu testni topshirgansiz',retry:'Qayta urinish',close:'Yopish',
  signTitle:'Avval hisobingizga kiring',signText:'Sinf testlari faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun: natijangiz sizning hisobingizda saqlanadi. Kirgach yoki ro‘yxatdan o‘tgach, bu test shu yerda o‘zi ochiladi.',signIn:'Kirish',signUp:'Ro‘yxatdan o‘tish',expired:'Sessiya tugagan — hisobingizga qayta kiring. Taklif saqlanadi.',
  ownTitle:'Siz bu guruhning ustozisiz',ownText:'Talabalar shu QR yoki kod bilan qo‘shiladi; ularning natijalari ustoz ekranida va katta ekranda ko‘rinadi. Ustoz hisobi bilan test topshirib bo‘lmaydi.',ownPreview:'Talaba ko‘rinishida sinash',ownPreviewHint:'Xuddi talaba kabi yechasiz — hech narsa serverga yuborilmaydi.',ownOpen:'Ustoz ekranini ochish',other:'Boshqa hisob bilan kirish',
  nickHint:'2–24 belgi: harf, raqam, bo‘sh joy, nuqta, apostrof (G‘ayrat ham bo‘ladi).',
  err:{bad_code:'Kod noto‘g‘ri: 6 belgili kodni tekshiring.',ambiguous_code:'Kodda 0, O, 1 va I belgilari bo‘lmaydi — ustoz ko‘rsatgan kodni qayta tekshiring (masalan, D yoki Q, L yoki J bo‘lishi mumkin).',not_found:'Bunday kodli guruh topilmadi. Kodni ustozdan qayta so‘rang.',test_not_found:'Bu test topilmadi yoki ustoz uni yashirgan.',
   bad_nickname:'Taxallus 2–24 belgi bo‘lsin: harf, raqam, bo‘sh joy, nuqta yoki apostrof. Email, havola va emoji bo‘lmaydi.',reserved_nickname:'«Talaba 5» kabi nomlar band — boshqa nom yozing.',nickname_rejected:'Bu nomni ishlatib bo‘lmaydi — boshqasini yozing.',nick_taken:'Bu nom guruhda band — boshqasini yozing.',
   group_full:'Guruh to‘lgan (200 talaba). Ustozingizga ayting.',teacher_cannot_join:'Ustoz hisobi bilan guruhga talaba sifatida qo‘shilib bo‘lmaydi. Talaba hisobi bilan kiring.',rate_limited:'Juda ko‘p urinish. Bir necha daqiqadan so‘ng qayta urinib ko‘ring.',network:'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.',unauthorized:'Sessiya tugagan — hisobingizga qayta kiring.',other:'Bajarilmadi. Qayta urinib ko‘ring.'}},
 ru:{title:'Тест в группе',joinTitle:'Вступить в группу',code:'Код группы',test:'Тест',nick:'Ваш псевдоним',ph:'Например: Лола',note:'Преподаватель и большой экран видят вас под этим именем — email и имя не показываются.',
  joinBtn:'Вступить',startBtn:'Начать тест',joining:'Вступаем…',checking:'Проверяем…',joined:'Вы в группе',joinedT:(g:string)=>`Темы и тесты группы «${g}» теперь видны вам.`,toGroup:'Перейти в группу',done:'Вы уже сдали этот тест',retry:'Повторить',close:'Закрыть',
  signTitle:'Сначала войдите в аккаунт',signText:'Тесты в группе — только для зарегистрированных: результат сохраняется в вашем аккаунте. После входа или регистрации этот тест откроется здесь сам.',signIn:'Войти',signUp:'Зарегистрироваться',expired:'Сессия истекла — войдите снова. Приглашение сохранится.',
  ownTitle:'Вы преподаватель этой группы',ownText:'Студенты вступают по этому QR или коду; их результаты видны на экране преподавателя и на большом экране. С аккаунта преподавателя тест сдать нельзя.',ownPreview:'Попробовать как студент',ownPreviewHint:'Проходите как студент — на сервер ничего не отправляется.',ownOpen:'Открыть экран преподавателя',other:'Войти с другим аккаунтом',
  nickHint:'2–24 символа: буквы, цифры, пробел, точка, апостроф.',
  err:{bad_code:'Неверный код: проверьте 6 символов.',ambiguous_code:'В кодах нет символов 0, O, 1 и I — проверьте код преподавателя ещё раз (возможно, это D или Q, L или J).',not_found:'Группа с таким кодом не найдена. Уточните код у преподавателя.',test_not_found:'Тест не найден или преподаватель его скрыл.',
   bad_nickname:'Псевдоним — 2–24 символа: буквы, цифры, пробел, точка или апостроф. Без email, ссылок и эмодзи.',reserved_nickname:'Имена вида «Студент 5» заняты — напишите другое.',nickname_rejected:'Это имя использовать нельзя — выберите другое.',nick_taken:'Это имя в группе уже занято — выберите другое.',
   group_full:'Группа заполнена (200 студентов). Сообщите преподавателю.',teacher_cannot_join:'С аккаунтом преподавателя нельзя вступить в группу как студент. Войдите аккаунтом студента.',rate_limited:'Слишком много попыток. Попробуйте через несколько минут.',network:'Нет подключения к интернету. Проверьте связь и попробуйте снова.',unauthorized:'Сессия истекла — войдите снова.',other:'Не получилось. Попробуйте ещё раз.'}},
 en:{title:'Class test',joinTitle:'Join a group',code:'Group code',test:'Test',nick:'Your nickname',ph:'e.g. Lola',note:'Your teacher and the big screen see you by this name — never your email or name.',
  joinBtn:'Join',startBtn:'Start the test',joining:'Joining…',checking:'Checking…',joined:'You joined the group',joinedT:(g:string)=>`The topics and tests of “${g}” now show up for you.`,toGroup:'Go to the group',done:'You have submitted this test',retry:'Try again',close:'Close',
  signTitle:'Sign in first',signText:'Class tests are for registered users: your result is kept in your account. Once you sign in or sign up, this test opens here by itself.',signIn:'Sign in',signUp:'Sign up',expired:'Your session has expired — sign in again. The invitation is kept.',
  ownTitle:'You teach this group',ownText:'Students join with this QR or code; their results show on your teacher screen and on the big screen. A teacher account cannot take the test.',ownPreview:'Try it as a student',ownPreviewHint:'You answer like a student — nothing is sent to the server.',ownOpen:'Open the teacher screen',other:'Sign in with another account',
  nickHint:'2–24 characters: letters, digits, space, dot, apostrophe.',
  err:{bad_code:'Wrong code: check the 6 characters.',ambiguous_code:'Codes never contain 0, O, 1 or I — check your teacher’s code again (it may be D or Q, L or J).',not_found:'No group has this code. Ask your teacher for it again.',test_not_found:'This test was not found, or your teacher hid it.',
   bad_nickname:'Nickname: 2–24 letters, digits, spaces, dots or apostrophes. No emails, links or emoji.',reserved_nickname:'Names like “Student 5” are reserved — choose another one.',nickname_rejected:'That name can’t be used — choose another one.',nick_taken:'That name is taken in this group — choose another one.',
   group_full:'The group is full (200 students). Tell your teacher.',teacher_cannot_join:'A teacher account can’t join a group as a student. Sign in with a student account.',rate_limited:'Too many attempts. Try again in a few minutes.',network:'No internet connection. Check it and try again.',unauthorized:'Your session has expired — sign in again.',other:'That did not work. Please try again.'}}
};

const NICK='de_nick';
const lsGet=(k:string)=>{try{return localStorage.getItem(k)}catch{return null}};
const lsSet=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{/* storage unavailable */}};
export {pendingQuickTest};
export const fmtCode=(c:string)=>c.length===6?`${c.slice(0,3)} ${c.slice(3)}`:c;

type Step={k:'signin';expired?:boolean}|{k:'check'}|{k:'nick'}|{k:'owner'}|{k:'joined'}|{k:'test';n:number}|{k:'preview'}|{k:'status';code:string};

/** The QR / invite-link sheet: a registered account only. Signed out → sign in or sign up first (the invite is kept and
 * this sheet reopens afterwards); the group's own teacher → "you teach this group" with a student preview; a first visit
 * → nickname; then straight into the test (or its result). One copy at the app root (main.tsx), keyed by the invite. */
export default function QuickJoin({lang,code,testId,user,onSignIn,onSignUp,onSwitchAccount,onJoined,onClose}:{lang:Lang;code:string;testId?:string;user:AuthUser|null;
 onSignIn:()=>void;onSignUp:()=>void;onSwitchAccount:()=>void;onJoined:()=>void;onClose:(to?:'teacher'|'student')=>void}){
 const t=words[lang];
 const tw=testWords[lang];
 const invite={code,testId};
 const [step,setStep]=useState<Step>(user?{k:'check'}:{k:'signin'});
 const [nick,setNick]=useState(()=>lsGet(NICK)||'');
 const [err,setErr]=useState('');
 const [nickErr,setNickErr]=useState(false);
 const [busy,setBusy]=useState(false);
 const [info,setInfo]=useState<QuickJoined|null>(null);
 const [meta,setMeta]=useState<TestMeta|null>(null);
 const [items,setItems]=useState<TestItem[]|null>(null);
 const input=useRef<HTMLInputElement>(null);
 const msg=(e:string)=>e in t.err?t.err[e as keyof typeof t.err]:testError(lang,e);
 const fail=(r:{status:number;data:{error?:string}})=>r.status===0?'network':r.status===401?'unauthorized':r.data.error||'other';
 // Signed out: remember the invite through sign-up, the email code or Google/Apple, and come back to it.
 useEffect(()=>{if(!user)savePending(invite,'signin')},[]);// eslint-disable-line react-hooks/exhaustive-deps
 // Fetches the test as this student sees it and decides: already done (score), over, or run it.
 const openTest=async(gid:string)=>{
  const r=await callApi<{assignments:TestMeta[]}>('/classroom/assignments?groupId='+gid);
  const m=r.ok?r.data.assignments.find(x=>x.id===testId):undefined;
  if(!m){setStep({k:'status',code:r.ok?'test_not_found':fail(r)});return}
  setMeta(m);
  if(m.mine?.answer==='done')return showDone(m);
  if(m.status!=='open'||m.ended&&m.mine?.answer!=='started'){clearPending(invite);setStep({k:'status',code:m.status!=='open'?'closed':'past_due'});return}
  savePending(invite,'test');setStep(s=>({k:'test',n:s.k==='test'?s.n+1:0}));
 };
 const showDone=(m:TestMeta)=>{clearPending(invite);setMeta(m);setStep({k:'status',code:'done'});if(m.mine?.review)loadTestItems(m,lang).then(setItems)};
 const after=async(r:QuickJoined)=>{
  setInfo(r);
  if(r.role==='owner'){clearPending(invite);if(testId&&r.group.id){const a=await callApi<{assignments:TestMeta[]}>('/classroom/assignments?groupId='+r.group.id);setMeta(a.ok?a.data.assignments.find(x=>x.id===testId)||null:null)}setStep({k:'owner'});return}
  if(r.role==='none'){setStep({k:'nick'});return}
  if(r.joined)onJoined();
  if(r.test&&r.group.id)await openTest(r.group.id);else{clearPending(invite);setStep({k:'joined'})}
 };
 // The first call only asks who we are in that group; a nickname is sent once the student typed one.
 const check=async()=>{
  setErr('');setStep({k:'check'});
  const r=await quickJoin(code,'',testId);
  if(!r.ok){const e=fail(r);if(e==='unauthorized'){savePending(invite,'signin');setStep({k:'signin',expired:true});return}if(e!=='network'&&e!=='rate_limited')clearPending(invite);setStep({k:'status',code:e});return}
  await after(r.data);
 };
 useEffect(()=>{if(user)void check()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const join=async()=>{
  if(busy)return;
  const c=checkNick(nick);
  if(!c.ok){setErr(t.err[c.error]);setNickErr(true);input.current?.focus();return}
  setNick(c.nick);setErr('');setNickErr(false);setBusy(true);
  const r=await quickJoin(code,c.nick,testId);
  setBusy(false);
  if(!r.ok){const e=fail(r);if(e==='unauthorized'){savePending(invite,'signin');setStep({k:'signin',expired:true});return}setErr(msg(e));if(/nick/.test(e)){setNickErr(true);input.current?.focus()}return}
  lsSet(NICK,c.nick);
  await after(r.data);
 };
 const testFailed=async(e:string)=>{
  if(e==='already_submitted'&&info?.group.id){const r=await callApi<{assignments:TestMeta[]}>('/classroom/assignments?groupId='+info.group.id);const m=r.ok?r.data.assignments.find(x=>x.id===testId):undefined;if(m?.mine?.answer==='done')return showDone(m)}
  if(e==='unauthorized'){savePending(invite,'signin');setStep({k:'signin',expired:true});return}
  if(e!=='network'&&e!=='rate_limited')clearPending(invite);
  setStep({k:'status',code:e});
 };
 // Another account (e.g. the teacher's student account): keep the invite so it opens after that sign-in.
 const switchAccount=()=>{savePending(invite,'signin');onSwitchAccount()};
 // Closing the sheet drops the invite (a test in progress is kept by TestRun's own exit, which does not come here).
 const close=(to?:'teacher'|'student')=>{if(!(step.k==='status'&&step.code==='network'))clearPending(invite);onClose(to)};
 if(step.k==='test'&&meta)return <TestRun key={step.n} lang={lang} a={meta} userId={user?.id} exitLabel={t.toGroup} onExit={()=>onClose('student')} onError={testFailed} onSubmitted={()=>clearPending(invite)}/>;
 if(step.k==='preview'&&meta&&user)return <PreviewRun lang={lang} a={meta} userId={user.id} onExit={()=>setStep({k:'owner'})}/>;
 const head=info?.group.name||(testId?t.title:t.joinTitle);
 const hero=<div className="qj-hero"><span className="qr-eyebrow">{t.code}</span><b className="qj-code" translate="no">{fmtCode(code)}</b>{testId&&<span className="lg-tag warn"><ClipboardList size={12}/>{info?.test?.title?testTitle({title:info.test.title,topicId:meta?.topicId},lang):t.test}</span>}</div>;
 return <div className="quiz-run qj" role="dialog" aria-modal="true" aria-label={head}>
  <div className="quiz-run-bar"><strong>{head}</strong><button data-close onClick={()=>close()} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   {step.k==='signin'?<>{hero}
    <div className="qj-card qj-signin"><span className="qj-badge ok"><LogIn size={26}/></span><h2 className="qj-h">{t.signTitle}</h2>
     {step.expired&&<p className="cr-error qj-err" role="alert">{t.expired}</p>}<p className="qj-help">{t.signText}</p>
     <button className="button" onClick={onSignIn}><LogIn size={17}/>{t.signIn}</button>
     <button className="button secondary" onClick={onSignUp}><UserPlus size={17}/>{t.signUp}</button></div>
   </>:step.k==='check'?<div className="qj-center"><span className="qj-spin" aria-hidden/><p className="muted">{t.checking}</p></div>
   :step.k==='nick'?<>{hero}
    <div className="qj-card">
     <label className="qj-label" htmlFor="qj-nick">{t.nick}</label>
     <input id="qj-nick" ref={input} className="qj-input" value={nick} maxLength={24} autoFocus autoComplete="nickname" autoCapitalize="words" enterKeyHint="go" placeholder={t.ph} aria-describedby="qj-note" aria-invalid={nickErr||undefined}
      onChange={e=>{setNick(e.target.value.replace(APOSTROPHES,"'"));setErr('');setNickErr(false)}} onKeyDown={e=>{if(e.key==='Enter')join()}}/>
     <small id="qj-note" className="qj-help">{t.note} {t.nickHint}</small>
     {err&&<p className="cr-error qj-err" role="alert">{err}</p>}
     <button className="button" disabled={busy||nick.trim().length<2} onClick={join}>{busy?t.joining:<>{testId?<ClipboardList size={17}/>:<LogIn size={17}/>}{testId?t.startBtn:t.joinBtn}</>}</button>
    </div>
   </>:step.k==='owner'?<div className="qj-center qj-done qj-owner">
    <span className="qj-badge ok"><GraduationCap size={28}/></span><h2>{t.ownTitle}</h2><p>{t.ownText}</p>
    {meta&&meta.topicId&&<><button className="button" onClick={()=>setStep({k:'preview'})}><Eye size={17}/>{t.ownPreview}</button><small className="qj-help">{t.ownPreviewHint}</small></>}
    <button className={'button'+(meta?' secondary':'')} onClick={()=>onClose('teacher')}><Users size={17}/>{t.ownOpen}</button>
    <button className="auth-link" onClick={switchAccount}>{t.other}</button>
   </div>:step.k==='joined'?<div className="qj-center qj-done">
    <span className="qj-badge ok"><Check size={28}/></span><h2>{t.joined}</h2>{info&&<p>{t.joinedT(info.group.name)}</p>}
    <button className="button" onClick={()=>onClose('student')}><Users size={17}/>{t.toGroup}</button>
   </div>:step.k==='status'&&step.code==='done'&&meta?.mine?<div className="quiz-run-result qj-result">
    <span className="qr-eyebrow">{testTitle(meta,lang)}</span><h2 className="qj-h">{t.done}</h2>
    <ScoreCard lang={lang} score={meta.mine.score??0} total={meta.mine.total??0} note={meta.mine.review?undefined:revealNote(meta,lang)}/>
    {meta.mine.review&&items&&<div className="qj-review"><h3>{tw.review}</h3><TestReview lang={lang} items={items} review={meta.mine.review}/></div>}
    <button className="button" onClick={()=>onClose('student')}><Users size={17}/>{t.toGroup}</button>
   </div>:step.k==='status'?<div className="qj-center qj-done">
    <span className="qj-badge warn"><TriangleAlert size={26}/></span>
    <h2>{msg(step.code)}</h2>{meta&&<p>{testTitle(meta,lang)}{meta.deadlineAt&&step.code==='past_due'?` · ${fmtDue(meta.deadlineAt,lang)}`:''}</p>}
    {(step.code==='network'||step.code==='other'||step.code==='rate_limited')&&<button className="button" onClick={()=>info?.group.id&&info.role==='member'?openTest(info.group.id):check()}><RotateCw size={17}/>{t.retry}</button>}
    {step.code==='teacher_cannot_join'&&<button className="button" onClick={switchAccount}><LogIn size={17}/>{t.other}</button>}
    <button className={'button secondary'} onClick={()=>close(user?.role==='teacher'||user?.role==='dentist'?'teacher':'student')}><Users size={17}/>{t.toGroup}</button>
   </div>:null}
  </div>
 </div>;
}
