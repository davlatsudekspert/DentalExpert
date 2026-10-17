import {useCallback,useEffect,useMemo,useState} from 'react';
import {BarChart3,BookOpen,Check,ChevronLeft,ClipboardList,Copy,Eye,EyeOff,LogIn,Plus,Presentation,QrCode,Timer,Trash2,Users} from 'lucide-react';
import qrcode from 'qrcode-generator';
import {callApi,type AuthUser} from './api';
import QuizRun from './QuizRun';
import Slides from './Slides';
import {OralList,SubjectHero,SubjectList,TopicList,useTopic} from './Curriculum';
import {subjectColor} from './subjectArt';
import {SUBJECTS,metaLine,topicMeta,tx,type Subject,type Topic,type TopicMeta} from './curriculum';
import type {Lang} from './discoveryData';

type Group={id:string;name:string;code?:string;members?:number;teacher?:string|null;myNo?:number;myNickname?:string|null};
type Review={answers:number[]|null;correct:number[];explain:({en:string;ru:string;uz:string}|null)[]};
type Assignment={id:string;kind:'task'|'quiz';title:string;body:string|null;deckId:string|null;status:'open'|'closed';dueDate:string|null;submitted?:number;
 topicId?:string;questions?:number[];minutes?:number;questionCount?:number;
 mine:{answer:string|null;score:number|null;total:number|null;startedAt?:string|null;review?:Review}|null};
type Member={no:number;nickname:string|null;answer:string|null;answers?:number[]|null;score:number|null;total:number|null;submittedAt:string|null};
type BookMember={no:number;nickname:string|null;scores:Record<string,number|null>};
type Book={quizzes:{id:string;title:string;topicId:string|null;total:number}[];members:BookMember[]};
type TopicRow={topicId:string;openedAt:string;closedAt:string|null;lectureDoneAt:string|null;oralDoneAt:string|null;testId:string|null};
type Deck={id:string;title:string;quiz:{q:string;options:string[];correct:number;explanation:string}[]};

const words={
 uz:{student:'Talaba',nick:'Taxallus (ixtiyoriy)',nickHint:'Ustoz sizni shu nom yoki raqam bilan ko‘radi',close:'Yopish',reopen:'Qayta ochish',closedLbl:'Yopilgan',errClosed:'Topshiriq yopilgan.',errDone:'Siz bu testni allaqachon topshirgansiz.',errStarted:'Bu test allaqachon boshlangan va qayta boshlab bo‘lmaydi.',errDue:'Topshirish muddati o‘tgan.',errRate:'Juda ko‘p urinish. Keyinroq qayta urinib ko‘ring.',errNick:'Taxallus 2–24 belgi: harf, raqam, bo‘sh joy.',title:'Guruhlar va darslar',signIn:'Guruhlar uchun email orqali kiring.',signInBtn:'Kirish',offline:'Guruhlar hozir mavjud emas (internet yoki server).',
  newGroup:'Yangi guruh',groupName:'Guruh nomi (masalan: Terapiya 3-kurs)',create:'Yaratish',code:'Qo‘shilish kodi',members:'talaba',copy:'Kodni nusxalash',copyInvite:'Taklif matnini nusxalash',copied:'Nusxalandi',noGroups:'Hali guruh yo‘q.',
  back:'Guruhlar',assignments:'Topshiriqlar',noAssign:'Hali topshiriq yo‘q.',add:'Topshiriq berish',kind:'Turi',task:'Matnli javob',quiz:'Test (taqdimot testi)',titleF:'Sarlavha',bodyF:'Izoh (ixtiyoriy)',due:'Muddat',deck:'Taqdimot',
  submitted:'topshirdi',delete:'O‘chirish',confirmDel:'Topshiriq o‘chirilsin?',roster:'Talabalar',notYet:'Topshirmagan',
  join:'Guruhga qo‘shilish',joinHint:'Ustoz bergan 6 belgili kod',joinBtn:'Qo‘shilish',leave:'Guruhdan chiqish',teacher:'Ustoz',
  answer:'Javobingiz',send:'Yuborish',resend:'Qayta yuborish',sent:'Yuborildi',start:'Testni boshlash',result:'Natija',dueLbl:'Muddat',
  errName:'Nom kamida 2 belgi.',errCode:'Kod noto‘g‘ri yoki guruh topilmadi.',errGeneric:'Bajarilmadi. Qayta urinib ko‘ring.',errTeacher:'Guruhni faqat ustoz yaratadi.',
  note:'Test natijasi serverda hisoblanadi; rasmiy baho emas. Ustoz sizni taxallus yoki raqam bilan ko‘radi, email yoki ismingizni emas.',
  tabs:{plan:'O‘quv reja',work:'Topshiriqlar',book:'Jurnal',people:'Talabalar'},invite:'Talabalarni taklif qiling',inviteHint:'Talaba ilovada «Guruhga qo‘shilish» bo‘limiga shu kodni yozadi yoki QR kodni telefon kamerasi bilan o‘qiydi.',
  inviteText:(n:string,c:string)=>`Dental Expert ilovasida «${n}» guruhiga qo‘shiling: Talaba → Guruhga qo‘shilish → kod ${c}`,
  st:{none:'Ochilmagan',hidden:'Yashirilgan',open:'Ochiq',lecture:'Ma’ruza o‘tildi',oral:'Savol-javob o‘tildi',testing:'Test ketmoqda',done:'Yakunlangan'},
  openTopic:'Talabalarga ochish',hideTopic:'Talabalardan yashirish',stage:'BOSQICH',lecture:'Ma’ruza',lectureHint:'Taqdimotni ekranga chiqarib, izohlar bilan o‘ting.',play:'Taqdimotni boshlash',markDone:'O‘tildi deb belgilash',doneLbl:'O‘tildi',undo:'Bekor qilish',
  oral:'Og‘zaki savol-javob',oralHint:'Savolni bering, javob rejasiga qarab talabalarni baholang. Belgilar faqat shu qurilmada saqlanadi.',asked:'So‘raldi',grade:'Baholash',knew:'Bildi',partly:'Qisman',didnt:'Bilmadi',
  test:'Mavzu testi',testHint:'Savollarni tanlang (to‘g‘ri javob yashil), vaqtni belgilang va testni boshlang.',minutes:'Vaqt (daqiqa)',startTest:'Testni boshlash',finishTest:'Testni yakunlash',confirmFinish:'Test yakunlansin? Boshlagan talabalarga 2 daqiqa beriladi.',results:'Natijalar',needOpen:'Avval mavzuni talabalarga oching.',
  of:'dan',avg:'O‘rtacha',err:'Xato',qShort:'S',noMembers:'Hali talaba yo‘q.',alias:'Shaxsiy belgi (faqat sizga ko‘rinadi)',
  myResults:'Mening natijalarim',quizzesDone:'test topshirildi',topics:'Mavzular',noTopics:'Ustoz hali mavzu ochmagan.',watch:'Taqdimotni ko‘rish',prepare:'Tayyorlanish uchun savollar',
  testOpen:'Test ochiq',timeLimit:'daqiqa',testWait:'Ustoz testni boshlaganda shu yerda paydo bo‘ladi.',reviewLater:'To‘g‘ri javoblar ustoz testni yakunlagach ko‘rinadi.',yourAns:'Sizning javobingiz',right:'To‘g‘ri javob',noAnswer:'Javob berilmagan',timeUp:'Vaqt tugadi.',goals:'Dars maqsadlari',pick:'Fan tanlang'},
 ru:{student:'Студент',nick:'Псевдоним (необязательно)',nickHint:'Преподаватель увидит вас под этим именем или номером',close:'Закрыть приём',reopen:'Открыть снова',closedLbl:'Закрыто',errClosed:'Задание закрыто.',errDone:'Вы уже сдали этот тест.',errStarted:'Этот тест уже начат, начать заново нельзя.',errDue:'Срок сдачи истёк.',errRate:'Слишком много попыток. Попробуйте позже.',errNick:'Псевдоним 2–24 символа: буквы, цифры, пробел.',title:'Группы и занятия',signIn:'Войдите по email, чтобы пользоваться группами.',signInBtn:'Войти',offline:'Группы сейчас недоступны (интернет или сервер).',
  newGroup:'Новая группа',groupName:'Название группы (например: Терапия, 3 курс)',create:'Создать',code:'Код для вступления',members:'студ.',copy:'Копировать код',copyInvite:'Копировать приглашение',copied:'Скопировано',noGroups:'Групп пока нет.',
  back:'Группы',assignments:'Задания',noAssign:'Заданий пока нет.',add:'Дать задание',kind:'Тип',task:'Текстовый ответ',quiz:'Тест (по презентации)',titleF:'Заголовок',bodyF:'Описание (необязательно)',due:'Срок',deck:'Презентация',
  submitted:'сдали',delete:'Удалить',confirmDel:'Удалить задание?',roster:'Студенты',notYet:'Не сдано',
  join:'Вступить в группу',joinHint:'6‑значный код от преподавателя',joinBtn:'Вступить',leave:'Выйти из группы',teacher:'Преподаватель',
  answer:'Ваш ответ',send:'Отправить',resend:'Отправить снова',sent:'Отправлено',start:'Начать тест',result:'Результат',dueLbl:'Срок',
  errName:'Название — минимум 2 символа.',errCode:'Неверный код или группа не найдена.',errGeneric:'Не получилось. Попробуйте ещё раз.',errTeacher:'Группы создаёт только преподаватель.',
  note:'Результат теста считается на сервере; это не официальная оценка. Преподаватель видит вас по псевдониму или номеру, а не по email или имени.',
  tabs:{plan:'Учебный план',work:'Задания',book:'Журнал',people:'Студенты'},invite:'Пригласите студентов',inviteHint:'Студент вводит этот код в разделе «Вступить в группу» или считывает QR-код камерой телефона.',
  inviteText:(n:string,c:string)=>`Вступите в группу «${n}» в приложении Dental Expert: Студент → Вступить в группу → код ${c}`,
  st:{none:'Не открыта',hidden:'Скрыта',open:'Открыта',lecture:'Лекция проведена',oral:'Опрос проведён',testing:'Идёт тест',done:'Завершена'},
  openTopic:'Открыть студентам',hideTopic:'Скрыть от студентов',stage:'ЭТАП',lecture:'Лекция',lectureHint:'Выведите презентацию на экран и проведите её с заметками.',play:'Начать презентацию',markDone:'Отметить как проведённую',doneLbl:'Проведено',undo:'Отменить',
  oral:'Устный опрос',oralHint:'Задайте вопрос и оцените студентов по плану ответа. Отметки хранятся только на этом устройстве.',asked:'Задан',grade:'Оценить',knew:'Знает',partly:'Частично',didnt:'Не знает',
  test:'Тест по теме',testHint:'Выберите вопросы (верный ответ — зелёным), задайте время и начните тест.',minutes:'Время (мин)',startTest:'Начать тест',finishTest:'Завершить тест',confirmFinish:'Завершить тест? Начавшим студентам даётся 2 минуты.',results:'Результаты',needOpen:'Сначала откройте тему студентам.',
  of:'из',avg:'Средний',err:'Ошибки',qShort:'В',noMembers:'Студентов пока нет.',alias:'Личная метка (видна только вам)',
  myResults:'Мои результаты',quizzesDone:'тестов сдано',topics:'Темы',noTopics:'Преподаватель ещё не открыл темы.',watch:'Смотреть презентацию',prepare:'Вопросы для подготовки',
  testOpen:'Тест открыт',timeLimit:'мин',testWait:'Появится здесь, когда преподаватель начнёт тест.',reviewLater:'Верные ответы появятся после завершения теста преподавателем.',yourAns:'Ваш ответ',right:'Верный ответ',noAnswer:'Нет ответа',timeUp:'Время вышло.',goals:'Цели занятия',pick:'Выберите предмет'},
 en:{student:'Student',nick:'Nickname (optional)',nickHint:'Your teacher sees you by this name or number',close:'Close submissions',reopen:'Reopen',closedLbl:'Closed',errClosed:'This assignment is closed.',errDone:'You have already submitted this quiz.',errStarted:'This quiz was already started and cannot be restarted.',errDue:'The due date has passed.',errRate:'Too many attempts. Try again later.',errNick:'Nickname: 2–24 letters, digits or spaces.',title:'Groups and classes',signIn:'Sign in with your email to use groups.',signInBtn:'Sign in',offline:'Groups are unavailable right now (network or server).',
  newGroup:'New group',groupName:'Group name (e.g. Therapy, year 3)',create:'Create',code:'Join code',members:'students',copy:'Copy code',copyInvite:'Copy invitation',copied:'Copied',noGroups:'No groups yet.',
  back:'Groups',assignments:'Assignments',noAssign:'No assignments yet.',add:'Give an assignment',kind:'Type',task:'Written answer',quiz:'Quiz (from a presentation)',titleF:'Title',bodyF:'Notes (optional)',due:'Due date',deck:'Presentation',
  submitted:'submitted',delete:'Delete',confirmDel:'Delete this assignment?',roster:'Students',notYet:'Not submitted',
  join:'Join a group',joinHint:'The 6-character code from your teacher',joinBtn:'Join',leave:'Leave group',teacher:'Teacher',
  answer:'Your answer',send:'Submit',resend:'Submit again',sent:'Submitted',start:'Start quiz',result:'Score',dueLbl:'Due',
  errName:'Name needs at least 2 characters.',errCode:'Wrong code or group not found.',errGeneric:'That did not work. Please try again.',errTeacher:'Only teachers can create groups.',
  note:'Quiz scores are calculated on the server; they are not official grades. The teacher sees you by nickname or number, not by email or name.',
  tabs:{plan:'Curriculum',work:'Assignments',book:'Gradebook',people:'Students'},invite:'Invite your students',inviteHint:'Students enter this code under “Join a group”, or read the QR code with the phone camera.',
  inviteText:(n:string,c:string)=>`Join the group “${n}” in the Dental Expert app: Student → Join a group → code ${c}`,
  st:{none:'Not opened',hidden:'Hidden',open:'Open',lecture:'Lecture done',oral:'Oral Q&A done',testing:'Test running',done:'Completed'},
  openTopic:'Open to students',hideTopic:'Hide from students',stage:'STAGE',lecture:'Lecture',lectureHint:'Put the slides on screen and teach with the notes.',play:'Start the slides',markDone:'Mark as done',doneLbl:'Done',undo:'Undo',
  oral:'Oral Q&A',oralHint:'Ask the question and grade students against the answer plan. Marks are kept on this device only.',asked:'Asked',grade:'Grade',knew:'Knew',partly:'Partly',didnt:'Did not know',
  test:'Topic test',testHint:'Choose the questions (the right answer is green), set the time and start the test.',minutes:'Time (min)',startTest:'Start the test',finishTest:'Finish the test',confirmFinish:'Finish the test? Students who started get 2 more minutes.',results:'Results',needOpen:'Open the topic to students first.',
  of:'of',avg:'Average',err:'Errors',qShort:'Q',noMembers:'No students yet.',alias:'Private label (only you see it)',
  myResults:'My results',quizzesDone:'quizzes done',topics:'Topics',noTopics:'Your teacher has not opened any topics yet.',watch:'View the slides',prepare:'Questions to prepare',
  testOpen:'Test open',timeLimit:'min',testWait:'It appears here when your teacher starts the test.',reviewLater:'The right answers appear once your teacher finishes the test.',yourAns:'Your answer',right:'Right answer',noAnswer:'No answer',timeUp:'Time is up.',goals:'Learning goals',pick:'Choose a subject'}
};
type W=typeof words.uz;

const lsGet=<T,>(k:string,d:T):T=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:d}catch{return d}};
const lsSet=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{/* storage unavailable */}};
const nn=(n:number)=>String(n).padStart(2,'0');
const subjectOf=(m:TopicMeta)=>SUBJECTS.find(s=>s.id===m.subject)!;

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
  {groups===null?<p className="muted">…</p>:groups.length===0?<p className="muted">{t.noGroups}</p>:<div className="lg-list">{groups.map(g=>
   <button key={g.id} className="lg-row" onClick={()=>setOpen(g)}><span className="lg-ico"><Users size={18}/></span><span><strong>{g.name}</strong><small>{teacher?`${g.members??0} ${t.members} · ${t.code}: ${g.code}`:(g.teacher?`${t.teacher}: ${g.teacher} · `:'')+(g.myNickname||`${t.student} ${nn(g.myNo??0)}`)}</small></span></button>)}</div>}
  {teacher?<div className="cr-form"><label>{t.newGroup}<input value={name} maxLength={60} placeholder={t.groupName} onChange={e=>setName(e.target.value)}/></label><button className="button" disabled={name.trim().length<2} onClick={create}><Plus size={17}/>{t.create}</button></div>
  :<div className="cr-form"><label>{t.join}<input value={code} maxLength={6} autoCapitalize="characters" placeholder={t.joinHint} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}/></label><label>{t.nick}<input value={nick} maxLength={24} placeholder={t.nickHint} onChange={e=>setNick(e.target.value)}/></label><button className="button" disabled={code.length!==6} onClick={join}><LogIn size={17}/>{t.joinBtn}</button></div>}
  {msg&&<p className="cr-error" role="alert">{msg}</p>}
  <small className="muted">{t.note}</small>
 </section>;
}

function GroupView({lang,group,teacher,onBack}:{lang:Lang;group:Group;teacher:boolean;onBack:()=>void}){
 const t=words[lang];
 const [tab,setTab]=useState<'plan'|'work'|'book'|'people'>('plan');
 const [items,setItems]=useState<Assignment[]|null>(null);
 const [topics,setTopics]=useState<TopicRow[]|null>(null);
 const [book,setBook]=useState<Book|null>(null);
 const [decks,setDecks]=useState<Deck[]>([]);
 const [sel,setSel]=useState<Assignment|null>(null);
 const [topicId,setTopicId]=useState<string|null>(null);
 const [roster,setRoster]=useState<Member[]|null>(null);
 const [adding,setAdding]=useState(false);
 const load=useCallback(async()=>{
  const [a,tp]=await Promise.all([callApi<{assignments:Assignment[]}>('/classroom/assignments?groupId='+group.id),callApi<{topics:TopicRow[]}>('/classroom/topics?groupId='+group.id)]);
  if(a.ok)setItems(a.data.assignments);
  if(tp.ok)setTopics(tp.data.topics);
  if(teacher){const b=await callApi<Book>('/classroom/gradebook?groupId='+group.id);if(b.ok)setBook(b.data)}
 },[group.id,teacher]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(setDecks).catch(()=>setDecks([]))},[lang]);
 const openAssignment=async(a:Assignment)=>{
  if(a.topicId){setTopicId(a.topicId);setTab('plan');return}
  setSel(a);setRoster(null);
  if(teacher){const r=await callApi<{members:Member[]}>(`/classroom/assignments?groupId=${group.id}&assignmentId=${a.id}`);if(r.ok)setRoster(r.data.members)}
 };
 const leave=async()=>{await callApi(`/classroom/join?groupId=${group.id}`,'DELETE');onBack()};
 const memberCount=book?.members.length??group.members??0;
 const backTo=sel?()=>{setSel(null);load()}:topicId?()=>{setTopicId(null);load()}:onBack;
 const backLabel=sel?group.name:topicId?group.name:t.back;
 const row=topics?.find(r=>r.topicId===topicId)||null;
 return <section className="classroom card lg-group">
  <button className="cr-back" onClick={backTo}><ChevronLeft size={16}/>{backLabel}</button>
  {sel?<AssignmentView lang={lang} a={sel} teacher={teacher} roster={roster} decks={decks} onChanged={load} onDeleted={()=>{setSel(null);load()}}/>
  :topicId?(teacher?<TeacherTopic lang={lang} groupId={group.id} topicId={topicId} row={row} test={items?.find(a=>a.id===row?.testId)||null} members={book?.members||[]} onChanged={load}/>
   :<StudentTopic lang={lang} topicId={topicId} test={items?.find(a=>a.id===row?.testId)||null} onChanged={load}/>)
  :<>
   <span className="lg-eyebrow">{teacher?`${memberCount} ${t.members}`:(group.teacher?`${t.teacher}: ${group.teacher}`:'')}</span>
   <h2>{group.name}</h2>
   {teacher&&memberCount===0&&<InviteCard lang={lang} group={group}/>}
   {!teacher&&<MyResults lang={lang} items={items}/>}
   <div className="chips lg-tabs">{(teacher?['plan','work','book','people'] as const:['plan','work'] as const).map(k=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{k==='plan'&&!teacher?t.topics:t.tabs[k]}</button>)}</div>
   {tab==='plan'&&(teacher?<TeacherPlan lang={lang} topics={topics} items={items} onPick={setTopicId}/>:<StudentPlan lang={lang} topics={topics} items={items} onPick={setTopicId}/>)}
   {tab==='work'&&<>
    {items===null?<p className="muted">…</p>:items.length===0?<p className="muted">{t.noAssign}</p>:<div className="lg-list">{items.map(a=>
     <button key={a.id} className="lg-row" onClick={()=>openAssignment(a)}><span className={'lg-ico '+(a.kind==='quiz'?'quiz':'task')}>{a.kind==='quiz'?<ClipboardList size={18}/>:'✎'}</span><span><strong>{a.title}</strong><small>{teacher?`${a.submitted??0}/${memberCount} ${t.submitted}`:a.mine?(a.kind==='quiz'&&a.mine.answer==='done'?`${t.result}: ${a.mine.score}/${a.mine.total}`:a.kind==='task'?t.sent:''):''}{a.dueDate?` · ${t.dueLbl} ${a.dueDate}`:''}</small></span>
      <AssignTag t={t} a={a} teacher={teacher}/></button>)}</div>}
    {teacher?(adding?<NewAssignment lang={lang} groupId={group.id} decks={decks} onDone={()=>{setAdding(false);load()}} onCancel={()=>setAdding(false)}/>:<button className="button" onClick={()=>setAdding(true)}><Plus size={17}/>{t.add}</button>)
    :<button className="button secondary" onClick={leave}>{t.leave}</button>}
   </>}
   {tab==='book'&&teacher&&<Gradebook lang={lang} groupId={group.id} book={book}/>}
   {tab==='people'&&teacher&&<><InviteCard lang={lang} group={group}/><People lang={lang} groupId={group.id} members={book?.members||null}/></>}
  </>}
 </section>;
}

function AssignTag({t,a,teacher}:{t:W;a:Assignment;teacher:boolean}){
 if(a.status==='closed')return <span className="lg-tag">{t.closedLbl}</span>;
 if(teacher)return null;
 if(!a.mine)return <span className="lg-tag brand">{t.st.open}</span>;
 if(a.kind==='quiz'&&a.mine.answer==='started')return <span className="lg-tag warn">{t.st.testing}</span>;
 return <span className="lg-tag brand"><Check size={12}/>{t.sent}</span>;
}

/** Join code (spaced), QR with the code only, and two copy buttons. */
function InviteCard({lang,group}:{lang:Lang;group:Group}){
 const t=words[lang];
 const [copied,setCopied]=useState('');
 const code=group.code||'';
 const qr=useMemo(()=>{if(!code)return '';const q=qrcode(0,'M');q.addData(code);q.make();return q.createDataURL(6,2)},[code]);
 const copy=(k:string,v:string)=>{try{navigator.clipboard?.writeText(v)}catch{/* clipboard unavailable */}setCopied(k);setTimeout(()=>setCopied(''),1500)};
 return <div className="lg-card lg-invite">
  <h3><QrCode size={16}/>{t.invite}</h3>
  <div className="lg-invite-body"><img src={qr} alt={`QR: ${code}`} width={128} height={128}/><div><small>{t.code}</small><b translate="no">{code.slice(0,3)} {code.slice(3)}</b><p className="muted">{t.inviteHint}</p></div></div>
  <div className="cr-actions"><button className="button secondary" onClick={()=>copy('c',code)}><Copy size={15}/>{copied==='c'?t.copied:t.copy}</button><button className="button secondary" onClick={()=>copy('i',t.inviteText(group.name,code))}><Copy size={15}/>{copied==='i'?t.copied:t.copyInvite}</button></div>
 </div>;
}

function topicStatus(t:W,row:TopicRow|undefined,test:Assignment|undefined):[string,string]{
 if(!row)return [t.st.none,''];
 if(row.closedAt)return [t.st.hidden,''];
 if(test)return test.status==='open'?[t.st.testing,'warn']:[t.st.done,'brand'];
 if(row.oralDoneAt)return [t.st.oral,'brand'];
 if(row.lectureDoneAt)return [t.st.lecture,'brand'];
 return [t.st.open,'brand'];
}

function TeacherPlan({lang,topics,items,onPick}:{lang:Lang;topics:TopicRow[]|null;items:Assignment[]|null;onPick:(id:string)=>void}){
 const t=words[lang];
 const [subject,setSubject]=useState<Subject|null>(()=>{const first=topics?.[0];const m=first&&topicMeta(first.topicId);return m?subjectOf(m):null});
 const tag=(m:TopicMeta)=>{const row=topics?.find(r=>r.topicId===m.id);const [txt,cls]=topicStatus(t,row,items?.find(a=>a.id===row?.testId));return <span className={'lg-tag '+cls}>{txt}</span>};
 if(!subject)return <><p className="muted">{t.pick}</p><SubjectList lang={lang} onPick={setSubject}/></>;
 return <><button className="lg-link" onClick={()=>setSubject(null)}><ChevronLeft size={14}/>{tx(subject.title,lang)}</button><SubjectHero lang={lang} subject={subject}/><TopicList lang={lang} subject={subject} onPick={m=>onPick(m.id)} tag={tag}/></>;
}

function StudentPlan({lang,topics,items,onPick}:{lang:Lang;topics:TopicRow[]|null;items:Assignment[]|null;onPick:(id:string)=>void}){
 const t=words[lang];
 if(topics===null)return <p className="muted">…</p>;
 const list=topics.map(r=>({r,m:topicMeta(r.topicId)})).filter((x):x is {r:TopicRow;m:TopicMeta}=>!!x.m).reverse();
 if(!list.length)return <p className="muted">{t.noTopics}</p>;
 return <div className="lg-list">{list.map(({r,m})=>{const test=items?.find(a=>a.id===r.testId);return <button key={m.id} className="lg-row" onClick={()=>onPick(m.id)}>
  <span className={'lg-ico '+m.type}>{m.n}</span><span><strong>{tx(m.title,lang)}</strong><small>{tx(subjectOf(m).title,lang)} · {metaLine(m,lang)}</small></span>
  {test&&(test.mine?.answer==='done'?<span className="lg-tag brand">{test.mine.score}/{test.mine.total}</span>:test.status==='open'?<span className="lg-tag warn">{t.testOpen}</span>:null)}</button>})}</div>;
}

function MyResults({lang,items}:{lang:Lang;items:Assignment[]|null}){
 const t=words[lang];
 const quizzes=(items||[]).filter(a=>a.kind==='quiz');
 const done=quizzes.filter(a=>a.mine?.answer==='done'&&a.mine.total);
 if(!quizzes.length)return null;
 const avg=done.length?Math.round(done.reduce((s,a)=>s+(a.mine!.score||0)/(a.mine!.total||1),0)/done.length*100):0;
 return <div className="lg-card lg-mine"><div><h3><BarChart3 size={16}/>{t.myResults}</h3><small>{done.length}/{quizzes.length} {t.quizzesDone}</small></div><b>{done.length?`${avg}%`:'—'}</b>
  <div className="lg-bar"><i style={{width:`${quizzes.length?done.length/quizzes.length*100:0}%`}}/></div></div>;
}

type Oral={asked:number[];marks:Record<string,Record<string,'y'|'p'|'n'>>};

function TeacherTopic({lang,groupId,topicId,row,test,members,onChanged}:{lang:Lang;groupId:string;topicId:string;row:TopicRow|null;test:Assignment|null;members:BookMember[];onChanged:()=>void}){
 const t=words[lang];
 const topic=useTopic(topicId);
 const meta=topicMeta(topicId);
 const [show,setShow]=useState(false);
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);
 const okey=`de_oral:${groupId}:${topicId}`;
 const [oral,setOral]=useState<Oral>(()=>lsGet(okey,{asked:[],marks:{}}));
 const [grading,setGrading]=useState<number|null>(null);
 const aliases=lsGet<Record<string,string>>(`de_alias:${groupId}`,{});
 const act=async(action:string,extra:Record<string,unknown>={})=>{
  setErr('');setBusy(true);
  const r=await callApi('/classroom/topics','POST',{groupId,topicId,action,...extra});
  setBusy(false);
  if(!r.ok)setErr(r.data.error==='not_open'?t.needOpen:t.errGeneric);
  onChanged();return r.ok;
 };
 const saveOral=(o:Oral)=>{setOral(o);lsSet(okey,o)};
 if(!meta)return null;
 const subject=subjectOf(meta);
 const isOpen=!!row&&!row.closedAt;
 const label=(m:BookMember)=>(aliases[m.no]?aliases[m.no]+' · ':'')+(m.nickname||`${t.student} ${nn(m.no)}`);
 return <>
  <span className="lg-eyebrow">{tx(subject.title,lang)}</span>
  <h2>{tx(meta.title,lang)}</h2>
  <p className="muted">{metaLine(meta,lang)}</p>
  <button className={'button'+(isOpen?' secondary':'')} disabled={busy} onClick={()=>act(isOpen?'close':'open')}>{isOpen?<EyeOff size={16}/>:<Eye size={16}/>}{isOpen?t.hideTopic:t.openTopic}</button>
  {err&&<p className="cr-error" role="alert">{err}</p>}
  {!topic?<p className="muted">…</p>:<>
   <Stage n={1} t={t} title={t.lecture} done={!!row?.lectureDoneAt} hint={t.lectureHint}>
    <div className="cr-actions"><button className="button" onClick={()=>setShow(true)}><Presentation size={16}/>{t.play} · {topic.slides.length}</button>
     <DoneToggle t={t} done={!!row?.lectureDoneAt} disabled={!isOpen||busy} onSet={d=>act('lecture',{done:d})}/></div>
   </Stage>
   <Stage n={2} t={t} title={t.oral} done={!!row?.oralDoneAt} hint={t.oralHint}>
    <OralList lang={lang} topic={topic} extra={k=><div className="lg-oral-tools">
     <label className="lg-check"><input type="checkbox" checked={oral.asked.includes(k)} onChange={e=>saveOral({...oral,asked:e.target.checked?[...oral.asked,k]:oral.asked.filter(x=>x!==k)})}/>{t.asked}</label>
     {members.length>0&&<button className="lg-link" onClick={()=>setGrading(grading===k?null:k)}>{t.grade}</button>}
     {grading===k&&<div className="lg-grade">{members.map(m=>{const v=oral.marks[k]?.[m.no];const set=(x:'y'|'p'|'n')=>saveOral({...oral,marks:{...oral.marks,[k]:{...oral.marks[k],[m.no]:x}}});
      return <div key={m.no}><span>{label(m)}</span><span className="lg-seg">{(['y','p','n'] as const).map(x=><button key={x} className={v===x?'on '+x:''} onClick={()=>set(x)}>{x==='y'?t.knew:x==='p'?t.partly:t.didnt}</button>)}</span></div>})}</div>}
    </div>}/>
    <DoneToggle t={t} done={!!row?.oralDoneAt} disabled={!isOpen||busy} onSet={d=>act('oral',{done:d})}/>
   </Stage>
   <Stage n={3} t={t} title={t.test} done={!!test&&test.status==='closed'} hint={test?'':t.testHint}>
    {test?<TestRunning lang={lang} groupId={groupId} topic={topic} test={test} members={members} label={label} onFinish={async()=>{if(window.confirm(t.confirmFinish))await act('finish')}}/>
    :<TestSetup lang={lang} groupId={groupId} topic={topic} disabled={!isOpen||busy} onStart={(questions,minutes)=>act('test',{questions,minutes,title:tx(topic.title,lang)})}/>}
   </Stage>
   {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} lang={lang} accent={subjectColor(subject.id).c} teacher onClose={()=>setShow(false)}/>}
  </>}
 </>;
}

function Stage({n,t,title,done,hint,children}:{n:number;t:W;title:string;done:boolean;hint?:string;children:React.ReactNode}){
 return <div className={'lg-stage'+(done?' done':'')}><span className="lg-eyebrow">{n}-{t.stage}</span><h3>{done&&<Check size={16}/>}{title}</h3>{hint&&<p className="muted">{hint}</p>}{children}</div>;
}

function DoneToggle({t,done,disabled,onSet}:{t:W;done:boolean;disabled:boolean;onSet:(d:boolean)=>void}){
 return done?<button className="button secondary" disabled={disabled} onClick={()=>onSet(false)}><Check size={16}/>{t.doneLbl} · {t.undo}</button>
  :<button className="button secondary" disabled={disabled} onClick={()=>onSet(true)}>{t.markDone}</button>;
}

function useKey(groupId:string,topicId:string){
 const [key,setKey]=useState<number[]|null>(null);
 useEffect(()=>{callApi<{correct:number[]}>(`/classroom/topics?groupId=${groupId}&key=${topicId}`).then(r=>{if(r.ok)setKey(r.data.correct)})},[groupId,topicId]);
 return key;
}

function TestSetup({lang,groupId,topic,disabled,onStart}:{lang:Lang;groupId:string;topic:Topic;disabled:boolean;onStart:(q:number[],m:number)=>void}){
 const t=words[lang];
 const key=useKey(groupId,topic.id);
 const [pick,setPick]=useState<number[]>(()=>topic.test.map((_,k)=>k));
 const [minutes,setMinutes]=useState(Math.max(5,topic.test.length*2));
 return <>
  <ol className="lg-qpick">{topic.test.map((q,k)=><li key={k}><label className="lg-check"><input type="checkbox" checked={pick.includes(k)} onChange={e=>setPick(e.target.checked?[...pick,k].sort((a,b)=>a-b):pick.filter(x=>x!==k))}/><b>{tx(q.q,lang)}</b></label>
   <ul>{q.options.map((o,j)=><li key={j} className={key?.[k]===j?'right':''}>{tx(o,lang)}</li>)}</ul></li>)}</ol>
  <div className="cr-form lg-inline"><label>{t.minutes}<input type="number" min={1} max={180} value={minutes} onChange={e=>setMinutes(Math.max(1,Math.min(180,Number(e.target.value)||1)))}/></label>
   <button className="button" disabled={disabled||!pick.length} onClick={()=>onStart(pick,minutes)}><Timer size={16}/>{t.startTest} · {pick.length}</button></div>
 </>;
}

function TestRunning({lang,groupId,topic,test,members,label,onFinish}:{lang:Lang;groupId:string;topic:Topic;test:Assignment;members:BookMember[];label:(m:BookMember)=>string;onFinish:()=>void}){
 const t=words[lang];
 const key=useKey(groupId,topic.id);
 const [res,setRes]=useState<Member[]|null>(null);
 const [showRes,setShowRes]=useState(false);
 useEffect(()=>{if(showRes)callApi<{members:Member[]}>(`/classroom/assignments?groupId=${groupId}&assignmentId=${test.id}`).then(r=>{if(r.ok)setRes(r.data.members)})},[showRes,groupId,test.id,test.submitted]);
 const qs=test.questions||[];
 const done=(res||[]).filter(m=>m.answer==='done');
 const byNo=new Map(members.map(m=>[m.no,m]));
 return <>
  <div className="lg-mine"><div><b>{test.submitted??0}/{members.length}</b> <small>{t.submitted}</small></div><span className={'lg-tag '+(test.status==='open'?'warn':'brand')}>{test.status==='open'?t.st.testing:t.st.done}</span>
   <div className="lg-bar"><i style={{width:`${members.length?(test.submitted??0)/members.length*100:0}%`}}/></div></div>
  <p className="muted">{qs.length} {t.qShort} · {test.minutes} {t.timeLimit}</p>
  <div className="cr-actions"><button className="button secondary" onClick={()=>setShowRes(!showRes)}><BarChart3 size={16}/>{t.results}</button>{test.status==='open'&&<button className="button" onClick={onFinish}>{t.finishTest}</button>}</div>
  {showRes&&(res===null?<p className="muted">…</p>:<>
   <div className="lg-list">{[...res].sort((a,b)=>(b.score??-1)-(a.score??-1)).map(m=>{const bm=byNo.get(m.no);return <div key={m.no} className="lg-row static"><span><strong>{bm?label(bm):m.nickname||`${t.student} ${nn(m.no)}`}</strong><small>{m.answer==='done'?`${m.score}/${m.total}`:m.answer==='started'?t.st.testing:t.notYet}</small></span>{m.answer==='done'&&m.total?<span className="lg-tag brand">{Math.round((m.score||0)/m.total*100)}%</span>:null}</div>})}</div>
   {done.length>0&&key&&<div className="lg-errs"><h3>{t.err}</h3>{qs.map((qi,k)=>{const wrong=done.filter(m=>m.answers?.[k]!==key[qi]).length;const pct=Math.round(wrong/done.length*100);
    return <div key={k} className="lg-err"><span>{t.qShort}{k+1}. {tx(topic.test[qi]?.q,lang)}</span><div className="lg-bar err"><i style={{width:pct+'%'}}/></div><b>{pct}%</b></div>})}</div>}
  </>)}
 </>;
}

function StudentTopic({lang,topicId,test,onChanged}:{lang:Lang;topicId:string;test:Assignment|null;onChanged:()=>void}){
 const t=words[lang];
 const topic=useTopic(topicId);
 const meta=topicMeta(topicId);
 const [show,setShow]=useState(false);
 const [run,setRun]=useState<number|null>(null);
 const [score,setScore]=useState<[number,number]|null>(null);
 const [err,setErr]=useState('');
 if(!meta)return null;
 const subject=subjectOf(meta);
 const mine=test?.mine;
 const finished=mine?.answer==='done'||!!score;
 const startTest=async()=>{
  if(!test)return;setErr('');
  const r=await callApi<{minutes:number|null}>('/classroom/start','POST',{assignmentId:test.id});
  if(r.ok){setRun(Date.now()+(r.data.minutes||test.minutes||20)*60000);onChanged()}
  else setErr(r.data.error==='already_started'?t.errStarted:r.data.error==='closed'?t.errClosed:t.errGeneric);
 };
 const submit=async(_s:number,_n:number,answers:number[])=>{
  const r=await callApi<{score:number;total:number}>('/classroom/submit','POST',{assignmentId:test!.id,answers});
  if(r.ok){setScore([r.data.score,r.data.total]);onChanged()}else setErr(r.data.error==='time_up'?t.timeUp:r.data.error==='already_submitted_or_not_started'?t.errDone:t.errGeneric);
 };
 const qs=topic&&test?.questions?test.questions.map(i=>topic.test[i]).filter(Boolean):[];
 return <>
  <span className="lg-eyebrow">{tx(subject.title,lang)}</span>
  <h2>{tx(meta.title,lang)}</h2>
  <p className="muted">{metaLine(meta,lang)}</p>
  {!topic?<p className="muted">…</p>:<>
   <div className="lg-card"><h3><BookOpen size={16}/>{t.goals}</h3><ul className="lg-goals">{topic.goals.map((g,k)=><li key={k}>{tx(g,lang)}</li>)}</ul></div>
   <button className="button" onClick={()=>setShow(true)}><Presentation size={16}/>{t.watch} · {topic.slides.length}</button>
   <div className={'lg-stage'+(finished?' done':'')}><span className="lg-eyebrow">{t.test}</span>
    {!test?<p className="muted">{t.testWait}</p>
    :finished?<><p className="cr-score">{t.result}: {score?score[0]:mine?.score} / {score?score[1]:mine?.total}</p>
     {mine?.review?<Review lang={lang} topic={topic} questions={test.questions||[]} review={mine.review}/>:<p className="muted">{t.reviewLater}</p>}</>
    :mine?.answer==='started'&&run===null?<p className="muted">{t.errStarted}</p>
    :test.status==='open'?<><p className="muted">{qs.length} {t.qShort} · {test.minutes} {t.timeLimit}</p><button className="button" onClick={startTest}><Timer size={16}/>{t.start}</button></>
    :<p className="muted">{t.errClosed}</p>}
    {err&&<p className="cr-error" role="alert">{err}</p>}
   </div>
   <h3 className="lg-h">{t.prepare}</h3>
   <OralList lang={lang} topic={topic}/>
   {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} lang={lang} accent={subjectColor(subject.id).c} onClose={()=>setShow(false)}/>}
   {run!==null&&test&&<QuizRun title={tx(topic.title,lang)} lang={lang} reveal={false} deadline={run}
    questions={qs.map(q=>({q:tx(q.q,lang),options:q.options.map(o=>tx(o,lang)),correct:-1,explanation:''}))}
    result={score?<><b>{score[0]} / {score[1]}</b><p>{t.result}</p></>:err?<p className="cr-error">{err}</p>:<p>…</p>}
    onDone={submit} onClose={()=>setRun(null)}/>}
  </>}
 </>;
}

function Review({lang,topic,questions,review}:{lang:Lang;topic:Topic;questions:number[];review:Review}){
 const t=words[lang];
 return <ol className="lg-review">{questions.map((qi,k)=>{const q=topic.test[qi];if(!q)return null;const mine=review.answers?.[k];const ok=mine===review.correct[k];
  return <li key={k} className={ok?'ok':'bad'}><b>{tx(q.q,lang)}</b>
   {!ok&&<small>{t.yourAns}: {mine!==undefined&&mine>=0?tx(q.options[mine],lang):t.noAnswer}</small>}
   <small className="right">{t.right}: {tx(q.options[review.correct[k]],lang)}</small>
   {review.explain[k]&&<p>{tx(review.explain[k]!,lang)}</p>}</li>})}</ol>;
}

function Gradebook({lang,groupId,book}:{lang:Lang;groupId:string;book:Book|null}){
 const t=words[lang];
 const aliases=lsGet<Record<string,string>>(`de_alias:${groupId}`,{});
 if(!book)return <p className="muted">…</p>;
 if(!book.members.length)return <p className="muted">{t.noMembers}</p>;
 const avg=(m:BookMember)=>{const xs=book.quizzes.filter(q=>typeof m.scores[q.id]==='number'&&q.total).map(q=>(m.scores[q.id] as number)/q.total);return xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*100):null};
 const rows=[...book.members].sort((a,b)=>(avg(b)??-1)-(avg(a)??-1));
 return <div className="lg-book"><table><thead><tr><th>{t.student}</th><th>{t.avg}</th>{book.quizzes.map((q,k)=><th key={q.id} title={q.title}>{k+1}</th>)}</tr></thead>
  <tbody>{rows.map(m=>{const a=avg(m);return <tr key={m.no}><td>{(aliases[m.no]?aliases[m.no]+' · ':'')+(m.nickname||`${t.student} ${nn(m.no)}`)}</td><td><b>{a===null?'—':a+'%'}</b></td>
   {book.quizzes.map(q=>{const s=m.scores[q.id];return <td key={q.id} className={typeof s==='number'&&q.total&&s/q.total<0.6?'low':''}>{typeof s==='number'?`${s}/${q.total}`:s===null?'…':'—'}</td>})}</tr>})}</tbody></table>
  <ol className="lg-book-key">{book.quizzes.map((q,k)=><li key={q.id}><b>{k+1}</b> {q.title}</li>)}</ol></div>;
}

function People({lang,groupId,members}:{lang:Lang;groupId:string;members:BookMember[]|null}){
 const t=words[lang];
 const k=`de_alias:${groupId}`;
 const [aliases,setAliases]=useState<Record<string,string>>(()=>lsGet(k,{}));
 if(members===null)return <p className="muted">…</p>;
 if(!members.length)return <p className="muted">{t.noMembers}</p>;
 return <div className="lg-list">{members.map(m=><div key={m.no} className="lg-row static"><span className="lg-ico">{nn(m.no)}</span><span><strong>{m.nickname||`${t.student} ${nn(m.no)}`}</strong>
  <input className="lg-alias" maxLength={40} placeholder={t.alias} value={aliases[m.no]||''} onChange={e=>{const v={...aliases,[m.no]:e.target.value};setAliases(v);lsSet(k,v)}}/></span></div>)}</div>;
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
  <div className="cr-actions"><button className="button" disabled={title.trim().length<2} onClick={save}>{t.create}</button><button className="button secondary cr-x" onClick={onCancel} aria-label="×">×</button></div>
 </div>;
}

function AssignmentView({lang,a,teacher,roster,decks,onChanged,onDeleted}:{lang:Lang;a:Assignment;teacher:boolean;roster:Member[]|null;decks:Deck[];onChanged:()=>void;onDeleted:()=>void}){
 const t=words[lang];
 const [answer,setAnswer]=useState(a.mine?.answer||'');
 const [done,setDone]=useState(!!a.mine);
 const [run,setRun]=useState(false);
 const [score,setScore]=useState<[number,number]|null>(a.mine&&a.mine.answer==='done'&&a.mine.score!==null?[a.mine.score,a.mine.total||0]:null);
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
   {roster===null?<p className="muted">…</p>:<div className="lg-list">{roster.map((m,i)=><div key={i} className="lg-row static"><span><strong>{m.nickname||`${t.student} ${nn(m.no)}`}</strong><small>{m.submittedAt&&m.answer!=='started'?(a.kind==='quiz'?`${t.result}: ${m.score}/${m.total}`:m.answer):m.answer==='started'?t.st.testing:t.notYet}</small></span></div>)}</div>}
   <div className="cr-actions"><button className="button secondary" onClick={toggle}>{a.status==='open'?t.close:t.reopen}</button>
   <button className="button secondary" onClick={del}><Trash2 size={16}/>{t.delete}</button></div>
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
