import {useCallback,useEffect,useState} from 'react';
import {ChevronLeft,Copy,LogIn,Plus,Trash2,Users} from 'lucide-react';
import {callApi,type AuthUser} from './api';
import QuizRun from './QuizRun';
import type {Lang} from './discoveryData';

type Group={id:string;name:string;code?:string;members?:number;teacher?:string|null;myNo?:number;myNickname?:string|null};
type Assignment={id:string;kind:'task'|'quiz';title:string;body:string|null;deckId:string|null;status:'open'|'closed';dueDate:string|null;submitted?:number;mine:{answer:string|null;score:number|null;total:number|null}|null};
type Member={no:number;nickname:string|null;answer:string|null;score:number|null;total:number|null;submittedAt:string|null};
type Deck={id:string;title:string;quiz:{q:string;options:string[];correct:number;explanation:string}[]};

const words={
 uz:{student:'Talaba',nick:'Taxallus (ixtiyoriy)',nickHint:'Ustoz sizni shu nom yoki raqam bilan ko‘radi',close:'Yopish',reopen:'Qayta ochish',closedLbl:'Yopilgan',errClosed:'Topshiriq yopilgan.',errDone:'Siz bu testni allaqachon topshirgansiz.',errStarted:'Bu test allaqachon boshlangan va qayta boshlab bo‘lmaydi.',errDue:'Topshirish muddati o‘tgan.',errRate:'Juda ko‘p urinish. Keyinroq qayta urinib ko‘ring.',errNick:'Taxallus 2–24 belgi: harf, raqam, bo‘sh joy.',title:'Guruhlar va topshiriqlar',signIn:'Guruhlar uchun email orqali kiring.',signInBtn:'Kirish',offline:'Guruhlar hozir mavjud emas (internet yoki server).',
  newGroup:'Yangi guruh',groupName:'Guruh nomi (masalan: Terapiya 3-kurs)',create:'Yaratish',code:'Qo‘shilish kodi',members:'talaba',copy:'Nusxa',copied:'Nusxalandi',noGroups:'Hali guruh yo‘q.',
  back:'Guruhlar',assignments:'Topshiriqlar',noAssign:'Hali topshiriq yo‘q.',add:'Topshiriq berish',kind:'Turi',task:'Matnli javob',quiz:'Test (taqdimot testi)',titleF:'Sarlavha',bodyF:'Izoh (ixtiyoriy)',due:'Muddat',deck:'Taqdimot',
  submitted:'topshirdi',delete:'O‘chirish',confirmDel:'Topshiriq o‘chirilsin?',roster:'Talabalar',notYet:'Topshirmagan',
  join:'Guruhga qo‘shilish',joinHint:'Ustoz bergan 6 belgili kod',joinBtn:'Qo‘shilish',leave:'Guruhdan chiqish',teacher:'Ustoz',
  answer:'Javobingiz',send:'Yuborish',resend:'Qayta yuborish',sent:'Yuborildi',start:'Testni boshlash',result:'Natija',dueLbl:'Muddat',
  errName:'Nom kamida 2 belgi.',errCode:'Kod noto‘g‘ri yoki guruh topilmadi.',errGeneric:'Bajarilmadi. Qayta urinib ko‘ring.',errTeacher:'Guruhni faqat ustoz yaratadi.',
  note:'Test natijasi serverda ustozning kaliti bo‘yicha hisoblanadi; rasmiy baho emas. Ustoz sizni taxallus yoki raqam bilan ko‘radi, email yoki ismingizni emas.'},
 ru:{student:'Студент',nick:'Псевдоним (необязательно)',nickHint:'Преподаватель увидит вас под этим именем или номером',close:'Закрыть приём',reopen:'Открыть снова',closedLbl:'Закрыто',errClosed:'Задание закрыто.',errDone:'Вы уже сдали этот тест.',errStarted:'Этот тест уже начат, начать заново нельзя.',errDue:'Срок сдачи истёк.',errRate:'Слишком много попыток. Попробуйте позже.',errNick:'Псевдоним 2–24 символа: буквы, цифры, пробел.',title:'Группы и задания',signIn:'Войдите по email, чтобы пользоваться группами.',signInBtn:'Войти',offline:'Группы сейчас недоступны (интернет или сервер).',
  newGroup:'Новая группа',groupName:'Название группы (например: Терапия, 3 курс)',create:'Создать',code:'Код для вступления',members:'студ.',copy:'Копировать',copied:'Скопировано',noGroups:'Групп пока нет.',
  back:'Группы',assignments:'Задания',noAssign:'Заданий пока нет.',add:'Дать задание',kind:'Тип',task:'Текстовый ответ',quiz:'Тест (по презентации)',titleF:'Заголовок',bodyF:'Описание (необязательно)',due:'Срок',deck:'Презентация',
  submitted:'сдали',delete:'Удалить',confirmDel:'Удалить задание?',roster:'Студенты',notYet:'Не сдано',
  join:'Вступить в группу',joinHint:'6‑значный код от преподавателя',joinBtn:'Вступить',leave:'Выйти из группы',teacher:'Преподаватель',
  answer:'Ваш ответ',send:'Отправить',resend:'Отправить снова',sent:'Отправлено',start:'Начать тест',result:'Результат',dueLbl:'Срок',
  errName:'Название — минимум 2 символа.',errCode:'Неверный код или группа не найдена.',errGeneric:'Не получилось. Попробуйте ещё раз.',errTeacher:'Группы создаёт только преподаватель.',
  note:'Результат теста считается на сервере по ключу преподавателя; это не официальная оценка. Преподаватель видит вас по псевдониму или номеру, а не по email или имени.'},
 en:{student:'Student',nick:'Nickname (optional)',nickHint:'Your teacher sees you by this name or number',close:'Close submissions',reopen:'Reopen',closedLbl:'Closed',errClosed:'This assignment is closed.',errDone:'You have already submitted this quiz.',errStarted:'This quiz was already started and cannot be restarted.',errDue:'The due date has passed.',errRate:'Too many attempts. Try again later.',errNick:'Nickname: 2–24 letters, digits or spaces.',title:'Groups and assignments',signIn:'Sign in with your email to use groups.',signInBtn:'Sign in',offline:'Groups are unavailable right now (network or server).',
  newGroup:'New group',groupName:'Group name (e.g. Therapy, year 3)',create:'Create',code:'Join code',members:'students',copy:'Copy',copied:'Copied',noGroups:'No groups yet.',
  back:'Groups',assignments:'Assignments',noAssign:'No assignments yet.',add:'Give an assignment',kind:'Type',task:'Written answer',quiz:'Quiz (from a presentation)',titleF:'Title',bodyF:'Notes (optional)',due:'Due date',deck:'Presentation',
  submitted:'submitted',delete:'Delete',confirmDel:'Delete this assignment?',roster:'Students',notYet:'Not submitted',
  join:'Join a group',joinHint:'The 6-character code from your teacher',joinBtn:'Join',leave:'Leave group',teacher:'Teacher',
  answer:'Your answer',send:'Submit',resend:'Submit again',sent:'Submitted',start:'Start quiz',result:'Score',dueLbl:'Due',
  errName:'Name needs at least 2 characters.',errCode:'Wrong code or group not found.',errGeneric:'That did not work. Please try again.',errTeacher:'Only teachers can create groups.',
  note:'The quiz score is calculated on the server from your teacher’s key; it is not an official grade. The teacher sees you by nickname or number, not by email or name.'}
};

export default function Classroom({lang,user,onSignIn}:{lang:Lang;user:AuthUser|null;onSignIn:()=>void}){
 const t=words[lang];
 const teacher=user?.role==='teacher'||user?.role==='dentist';
 const [groups,setGroups]=useState<Group[]|null>(null);
 const [offline,setOffline]=useState(false);
 const [open,setOpen]=useState<Group|null>(null);
 const [msg,setMsg]=useState('');
 const [name,setName]=useState('');
 const [code,setCode]=useState('');
 const [nick,setNick]=useState('');
 const errText=(e?:string)=>e==='rate_limited'?t.errRate:e==='bad_nickname'?t.errNick:e==='name_required'?t.errName:e==='not_found'||e==='bad_code'?t.errCode:e==='teacher_only'?t.errTeacher:t.errGeneric;
 const load=useCallback(async()=>{
  const r=await callApi<{groups:Group[]}>('/classroom/groups');
  if(r.status===0||r.status===404){setOffline(true);return}
  if(r.ok){setOffline(false);setGroups(r.data.groups)}
 },[]);
 useEffect(()=>{if(user)load();else setGroups(null)},[user,load]);
 if(!user)return <section className="classroom card"><h2>{t.title}</h2><p className="muted">{t.signIn}</p><button className="button" onClick={onSignIn}><LogIn size={17}/>{t.signInBtn}</button></section>;
 if(offline)return <section className="classroom card"><h2>{t.title}</h2><p className="muted">{t.offline}</p></section>;
 if(open)return <GroupView lang={lang} group={open} teacher={teacher} onBack={()=>{setOpen(null);load()}}/>;
 const create=async()=>{setMsg('');const r=await callApi('/classroom/groups','POST',{name});if(r.ok){setName('');load()}else setMsg(errText(r.data.error))};
 const join=async()=>{setMsg('');const r=await callApi('/classroom/join','POST',{code,nickname:nick});if(r.ok){setCode('');load()}else setMsg(errText(r.data.error))};
 return <section className="classroom card" aria-label={t.title}>
  <h2>{t.title}</h2>
  {groups===null?<p className="muted">…</p>:groups.length===0?<p className="muted">{t.noGroups}</p>:<div className="cr-list">{groups.map(g=>
   <button key={g.id} className="cr-row" onClick={()=>setOpen(g)}><Users size={18}/><span><strong>{g.name}</strong><small>{teacher?`${g.members??0} ${t.members} · ${t.code}: ${g.code}`:(g.teacher?`${t.teacher}: ${g.teacher} · `:'')+(g.myNickname||`${t.student} ${String(g.myNo??0).padStart(2,'0')}`)}</small></span></button>)}</div>}
  {teacher?<div className="cr-form"><label>{t.newGroup}<input value={name} maxLength={60} placeholder={t.groupName} onChange={e=>setName(e.target.value)}/></label><button className="button" disabled={name.trim().length<2} onClick={create}><Plus size={17}/>{t.create}</button></div>
  :<div className="cr-form"><label>{t.join}<input value={code} maxLength={6} autoCapitalize="characters" placeholder={t.joinHint} onChange={e=>setCode(e.target.value.toUpperCase())}/></label><label>{t.nick}<input value={nick} maxLength={24} placeholder={t.nickHint} onChange={e=>setNick(e.target.value)}/></label><button className="button" disabled={code.length!==6} onClick={join}><LogIn size={17}/>{t.joinBtn}</button></div>}
  {msg&&<p className="cr-error" role="alert">{msg}</p>}
  <small className="muted">{t.note}</small>
 </section>;
}

function GroupView({lang,group,teacher,onBack}:{lang:Lang;group:Group;teacher:boolean;onBack:()=>void}){
 const t=words[lang];
 const [items,setItems]=useState<Assignment[]|null>(null);
 const [decks,setDecks]=useState<Deck[]>([]);
 const [sel,setSel]=useState<Assignment|null>(null);
 const [roster,setRoster]=useState<Member[]|null>(null);
 const [adding,setAdding]=useState(false);
 const [copied,setCopied]=useState(false);
 const load=useCallback(async()=>{const r=await callApi<{assignments:Assignment[]}>('/classroom/assignments?groupId='+group.id);if(r.ok)setItems(r.data.assignments)},[group.id]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(setDecks).catch(()=>setDecks([]))},[lang]);
 const openAssignment=async(a:Assignment)=>{
  setSel(a);setRoster(null);
  if(teacher){const r=await callApi<{members:Member[]}>(`/classroom/assignments?groupId=${group.id}&assignmentId=${a.id}`);if(r.ok)setRoster(r.data.members)}
 };
 const copy=()=>{try{navigator.clipboard?.writeText(group.code||'')}catch{/* clipboard unavailable */}setCopied(true);setTimeout(()=>setCopied(false),1500)};
 const leave=async()=>{await callApi(`/classroom/join?groupId=${group.id}`,'DELETE');onBack()};
 return <section className="classroom card">
  <button className="cr-back" onClick={sel?()=>{setSel(null);load()}:onBack}><ChevronLeft size={16}/>{sel?group.name:t.back}</button>
  {!sel?<>
   <h2>{group.name}</h2>
   {teacher&&<div className="cr-code"><span>{t.code}</span><b>{group.code}</b><button onClick={copy}><Copy size={15}/>{copied?t.copied:t.copy}</button></div>}
   <h3>{t.assignments}</h3>
   {items===null?<p className="muted">…</p>:items.length===0?<p className="muted">{t.noAssign}</p>:<div className="cr-list">{items.map(a=>
    <button key={a.id} className="cr-row" onClick={()=>openAssignment(a)}><span className={'cr-kind '+a.kind}>{a.kind==='quiz'?'?':'✎'}</span><span><strong>{a.title}</strong><small>{teacher?`${a.submitted??0} ${t.submitted}`:a.mine?(a.kind==='quiz'?`${t.result}: ${a.mine.score}/${a.mine.total}`:t.sent):''}{a.status==='closed'?` · ${t.closedLbl}`:''}{a.dueDate?` · ${t.dueLbl} ${a.dueDate}`:''}</small></span></button>)}</div>}
   {teacher?(adding?<NewAssignment lang={lang} groupId={group.id} decks={decks} onDone={()=>{setAdding(false);load()}} onCancel={()=>setAdding(false)}/>:<button className="button" onClick={()=>setAdding(true)}><Plus size={17}/>{t.add}</button>)
   :<button className="button secondary" onClick={leave}>{t.leave}</button>}
  </>:<AssignmentView lang={lang} a={sel} teacher={teacher} roster={roster} decks={decks} onChanged={load} onDeleted={()=>{setSel(null);load()}}/>}
 </section>;
}

function NewAssignment({lang,groupId,decks,onDone,onCancel}:{lang:Lang;groupId:string;decks:Deck[];onDone:()=>void;onCancel:()=>void}){
 const t=words[lang];
 const [kind,setKind]=useState<'task'|'quiz'>('task');
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [due,setDue]=useState('');
 const [deck,setDeck]=useState(decks[0]?.id||'');
 const [err,setErr]=useState('');
 const save=async()=>{
  const chosen=decks.find(d=>d.id===(deck||decks[0]?.id));
  const r=await callApi('/classroom/assignments','POST',{groupId,kind,title,body,dueDate:due,deckId:kind==='quiz'?chosen?.id:undefined,key:kind==='quiz'?chosen?.quiz.map(q=>q.correct):undefined});
  if(r.ok)onDone();else setErr(t.errGeneric);
 };
 return <div className="cr-form">
  <label>{t.kind}<select value={kind} onChange={e=>setKind(e.target.value as 'task'|'quiz')}><option value="task">{t.task}</option><option value="quiz" disabled={decks.length===0}>{t.quiz}</option></select></label>
  {kind==='quiz'&&<label>{t.deck}<select value={deck||decks[0]?.id} onChange={e=>setDeck(e.target.value)}>{decks.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label>}
  <label>{t.titleF}<input value={title} maxLength={100} onChange={e=>setTitle(e.target.value)}/></label>
  <label>{t.bodyF}<textarea rows={3} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)}/></label>
  <label>{t.due}<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
  {err&&<p className="cr-error" role="alert">{err}</p>}
  <div className="cr-actions"><button className="button" disabled={title.trim().length<2} onClick={save}>{t.create}</button><button className="button secondary" onClick={onCancel}>×</button></div>
 </div>;
}

function AssignmentView({lang,a,teacher,roster,decks,onChanged,onDeleted}:{lang:Lang;a:Assignment;teacher:boolean;roster:Member[]|null;decks:Deck[];onChanged:()=>void;onDeleted:()=>void}){
 const t=words[lang];
 const [answer,setAnswer]=useState(a.mine?.answer||'');
 const [done,setDone]=useState(!!a.mine);
 const [run,setRun]=useState(false);
 const [score,setScore]=useState<[number,number]|null>(a.mine&&a.mine.score!==null?[a.mine.score,a.mine.total||0]:null);
 const deck=decks.find(d=>d.id===a.deckId);
 const [err,setErr]=useState('');
 const send=async()=>{setErr('');const r=await callApi('/classroom/submit','POST',{assignmentId:a.id,answer});if(r.ok){setDone(true);onChanged()}else setErr(r.data.error==='closed'?t.errClosed:t.errGeneric)};
 const finish=async(_s:number,_n:number,answers:number[])=>{setErr('');const r=await callApi<{score:number;total:number}>('/classroom/submit','POST',{assignmentId:a.id,answers});if(r.ok){setScore([r.data.score,r.data.total]);setDone(true);onChanged()}else setErr(r.data.error==='already_submitted_or_not_started'?t.errDone:r.data.error==='closed'?t.errClosed:t.errGeneric)};
 const toggle=async()=>{await callApi('/classroom/assignments','PUT',{assignmentId:a.id,status:a.status==='open'?'closed':'open'});onDeleted()};
 const del=async()=>{if(window.confirm(t.confirmDel)){await callApi('/classroom/assignments?assignmentId='+a.id,'DELETE');onDeleted()}};
 return <>
  <h2>{a.title}</h2>
  {a.dueDate&&<p className="muted">{t.dueLbl}: {a.dueDate}</p>}
  {a.body&&<p className="body-copy">{a.body}</p>}
  {teacher?<>
   <h3>{t.roster}</h3>
   {roster===null?<p className="muted">…</p>:<div className="cr-list">{roster.map((m,i)=><div key={i} className="cr-row static"><span><strong>{m.nickname||`${t.student} ${String(m.no).padStart(2,'0')}`}</strong><small>{m.submittedAt?(a.kind==='quiz'?`${t.result}: ${m.score}/${m.total}`:m.answer):t.notYet}</small></span></div>)}</div>}
   <button className="button secondary" onClick={toggle}>{a.status==='open'?t.close:t.reopen}</button>
   <button className="button secondary" onClick={del}><Trash2 size={16}/>{t.delete}</button>
  </>:a.kind==='task'?<>
   <label>{t.answer}<textarea rows={5} maxLength={2000} value={answer} onChange={e=>{setAnswer(e.target.value);setDone(false)}}/></label>
   {a.status==='closed'&&<p className="muted">{t.errClosed}</p>}
   {err&&<p className="cr-error" role="alert">{err}</p>}
   <button className="button" disabled={!answer.trim()||done||a.status==='closed'} onClick={send}>{done?t.sent:a.mine?t.resend:t.send}</button>
  </>:<>
   {score&&<p className="cr-score">{t.result}: {score[0]} / {score[1]}</p>}
   {a.status==='closed'&&!score&&<p className="muted">{t.errClosed}</p>}
   {!score&&<button className="button" disabled={!deck||a.status==='closed'} onClick={async()=>{setErr('');const r=await callApi('/classroom/start','POST',{assignmentId:a.id});if(r.ok)setRun(true);else setErr(r.data.error==='already_started'?t.errStarted:r.data.error==='closed'?t.errClosed:r.data.error==='past_due'?t.errDue:t.errGeneric)}}>{t.start}</button>}
   {err&&<p className="cr-error" role="alert">{err}</p>}
   {run&&deck&&<QuizRun title={a.title} lang={lang} reveal={false} questions={deck.quiz} onDone={finish} onClose={()=>setRun(false)}/>}
  </>}
 </>;
}
