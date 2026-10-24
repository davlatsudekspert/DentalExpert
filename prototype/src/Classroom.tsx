import {Suspense,lazy,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {BarChart3,BookOpen,Check,ChevronLeft,ClipboardList,Copy,Eye,EyeOff,Layers,LogIn,Plus,Presentation,QrCode,Timer,Trash2,UserMinus,Users,Tv} from 'lucide-react';
import qrcode from 'qrcode-generator';
import {callApi,joinLink,parseJoin,type AuthUser} from './api';
import {CLASSROOM_CHANGED,openJoin,openScan,takeAssignTopic} from './joinLink';
import {APOSTROPHES,VARIANT_POOL_MAX,checkNick,maxVariantCount,variantAllowed} from './classroomShared';
import {GeneralSetup,TopicTestSetup,type TestPayload} from './testSetup';
import {PreviewRun,TestRun,TestReview,fmtDue,loadTestItems,refItems,revealNote,testError,testWords,type Reveal,type TestItem,type TestMeta} from './classTest';
import Slides from './Slides';
import type {BigTest} from './BigScreen';
const BigScreen=lazy(()=>import('./BigScreen'));
import {OralList,SubjectHero,SubjectList,TopicList,toTop,useTopic} from './Curriculum';
import {subjectColor} from './subjectArt';
import {SUBJECTS,metaLine,slideCount,topicMeta,tx,type Subject,type Topic,type TopicMeta} from './curriculumData';
import type {Lang} from './discoveryData';

type Group={id:string;name:string;code?:string;members?:number;teacher?:string|null;myNo?:number;myNickname?:string|null};
type Review={answers:number[]|null;correct:number[];explain:({en:string;ru:string;uz:string}|null)[]};
type Assignment={id:string;kind:'task'|'quiz';general?:boolean;title:string;body:string|null;deckId:string|null;status:'open'|'closed';dueDate:string|null;submitted?:number;
 topicId?:string;questions?:number[];minutes?:number;questionCount?:number;items?:string[];variant?:boolean;perStudent?:number;deadlineAt?:string;ended?:boolean;reveal?:Reveal;
 mine:{answer:string|null;score:number|null;total:number|null;startedAt?:string|null;questions?:string[];review?:Review&{questions?:string[]}}|null};
type Member={no:number;nickname:string|null;answer:string|null;answers?:number[]|null;score:number|null;total:number|null;submittedAt:string|null};
type BookMember={no:number;nickname:string|null;scores:Record<string,number|null>};
type Book={quizzes:{id:string;title:string;topicId:string|null;total:number}[];members:BookMember[]};
type TopicRow={topicId:string;openedAt:string;closedAt:string|null;lectureDoneAt:string|null;oralDoneAt:string|null;testId:string|null};
type Deck={id:string;title:string;quiz:{q:string;options:string[];correct:number;explanation:string}[]};

const ruPlural=(n:number,one:string,few:string,many:string)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many};
const joinErr={
 uz:{taken:'Bu nom guruhda band — boshqasini yozing.',rude:'Bu nomni ishlatib bo‘lmaydi — boshqa nom tanlang.',full:'Guruh to‘lgan (200 talaba). Ustozingizga ayting.',ambiguous:'Kodda 0, O, 1 va I bo‘lmaydi — ustoz ko‘rsatgan kodni qayta tekshiring.',own:'Bu sizning guruhingiz — siz uning ustozisiz.',signin:'Sessiya tugagan — qayta kiring.',network:'Internet aloqasi yo‘q. Ulanishni tekshiring.'},
 ru:{taken:'Это имя в группе уже занято — напишите другое.',rude:'Это имя использовать нельзя — выберите другое.',full:'Группа заполнена (200 студентов). Сообщите преподавателю.',ambiguous:'В кодах нет 0, O, 1 и I — проверьте код преподавателя ещё раз.',own:'Это ваша группа — вы её преподаватель.',signin:'Сессия истекла — войдите снова.',network:'Нет подключения к интернету. Проверьте связь.'},
 en:{taken:'That name is taken in this group — try another.',rude:'That name can’t be used — choose another one.',full:'The group is full (200 students). Tell your teacher.',ambiguous:'Codes never contain 0, O, 1 or I — check your teacher’s code again.',own:'This is your own group — you teach it.',signin:'Your session has expired — sign in again.',network:'No internet connection. Check it and try again.'}
};
const words={
 uz:{student:'Talaba',nick:'Taxallus (ixtiyoriy)',nickPh:'Masalan: Lola',nickHint:'Ustoz sizni shu nom yoki raqam bilan ko‘radi',close:'Yopish',reopen:'Qayta ochish',closedLbl:'Yopilgan',errClosed:'Topshiriq yopilgan.',errDone:'Siz bu testni allaqachon topshirgansiz.',errStarted:'Bu test allaqachon boshlangan va qayta boshlab bo‘lmaydi.',errDue:'Topshirish muddati o‘tgan.',errRate:'Juda ko‘p urinish. Keyinroq qayta urinib ko‘ring.',errNick:'Taxallus 2–24 belgi: harf, raqam, bo‘sh joy.',errNickTaken:'“Talaba N” ko‘rinishidagi nom band — boshqa nom tanlang.',title:'Guruhlar va darslar',signIn:'Guruhlar uchun email orqali kiring.',signInBtn:'Kirish',offline:'Guruhlar hozir mavjud emas (internet yoki server).',retry:'Qayta urinib ko‘rish',
  newGroup:'Yangi guruh',groupName:'Guruh nomi',groupHint:'Masalan: Terapiya 3-kurs',create:'Yaratish',code:'Qo‘shilish kodi',members:'talaba',copy:'Kodni nusxalash',copyInvite:'Taklif matnini nusxalash',copied:'Nusxalandi',noGroups:'Hali guruh yo‘q.',
  back:'Guruhlar',assignments:'Topshiriqlar',noAssign:'Hali topshiriq yo‘q.',add:'Topshiriq berish',kind:'Turi',task:'Matnli javob',quiz:'Test (taqdimot testi)',titleF:'Sarlavha',bodyF:'Izoh (ixtiyoriy)',due:'Muddat',deck:'Taqdimot',
  submitted:'topshirdi',delete:'O‘chirish',confirmDel:'Topshiriq o‘chirilsin?',roster:'Talabalar',notYet:'Topshirmagan',
  join:'Guruhga qo‘shilish',joinPh:'6 belgili kod',joinHint:'Ustoz bergan kod — bo‘sh joy bilan yozilsa ham bo‘ladi',joinBtn:'Qo‘shilish',leave:'Guruhdan chiqish',teacher:'Ustoz',
  answer:'Javobingiz',send:'Yuborish',resend:'Qayta yuborish',sent:'Yuborildi',start:'Testni boshlash',result:'Natija',dueLbl:'Muddat',
  errName:'Nom kamida 2 belgi.',errCode:'Kod noto‘g‘ri yoki guruh topilmadi.',errGeneric:'Bajarilmadi. Qayta urinib ko‘ring.',errTeacher:'Guruhni faqat ustoz yaratadi.',
  note:'Test natijasi serverda hisoblanadi; rasmiy baho emas. Ustoz sizni taxallus yoki raqam bilan ko‘radi, email yoki ismingizni emas.',
  tabs:{plan:'O‘quv reja',work:'Topshiriqlar',book:'Jurnal',people:'Talabalar'},invite:'Talabalarni taklif qiling',inviteHint:'Talaba ilovada «Guruhga qo‘shilish» bo‘limiga shu kodni yozadi yoki QR kodni telefon kamerasi bilan o‘qiydi.',
  inviteText:(n:string,c:string)=>`Dental Expert ilovasida «${n}» guruhiga qo‘shiling: Talaba → Guruhga qo‘shilish → kod ${c}`,
  st:{none:'Ochilmagan',hidden:'Yashirilgan',open:'Ochiq',lecture:'Ma’ruza o‘tildi',oral:'Savol-javob o‘tildi',testing:'Test ketmoqda',done:'Yakunlangan'},
  openTopic:'Talabalarga ochish',hideTopic:'Talabalardan yashirish',stage:'BOSQICH',lecture:'Ma’ruza',lectureHint:'Taqdimotni ekranga chiqarib, izohlar bilan o‘ting.',play:'Taqdimotni boshlash',markDone:'O‘tildi deb belgilash',doneLbl:'O‘tildi',undo:'Bekor qilish',
  oral:'Og‘zaki savol-javob',oralHint:'Savolni bering, javob rejasiga qarab talabalarni baholang. Belgilar faqat shu qurilmada saqlanadi.',asked:'So‘raldi',grade:'Baholash',knew:'Bildi',partly:'Qisman',didnt:'Bilmadi',
  test:'Mavzu testi',testHint:'Savollarni tanlang (to‘g‘ri javob yashil), vaqtni belgilang va testni boshlang.',minutes:'Vaqt (daqiqa)',startTest:'Testni boshlash',finishTest:'Testni yakunlash',confirmFinish:'Test yakunlansin? Boshlagan talabalarga 2 daqiqa beriladi.',results:'Natijalar',needOpen:'Avval mavzuni talabalarga oching.',needOpenTest:'Testni boshlash uchun avval mavzuni yuqoridagi «Talabalarga ochish» tugmasi bilan oching.',
  of:'dan',avg:'O‘rtacha',perQ:'Savollar bo‘yicha',qN:(n:number)=>`${n}-savol`,qCount:(n:number)=>`${n} ta savol`,rightN:(r:number,n:number)=>`${r}/${n} to‘g‘ri`,inviteToGrade:'Baholash uchun talabalarni guruhga taklif qiling.',cancel:'Bekor qilish',great:'A’lo natija!',good:'Yaxshi natija',more:'Mavzuni yana takrorlang',scoreLine:(s:number,n:number)=>`${n} ta savoldan ${s} tasiga to‘g‘ri javob berdingiz`,noMembers:'Hali talaba yo‘q.',alias:'Shaxsiy belgi (faqat sizga ko‘rinadi)',
  myResults:'Mening natijalarim',quizzesDone:'test topshirildi',topics:'Mavzular',noTopics:'Ustoz hali mavzu ochmagan.',watch:'Taqdimotni ko‘rish',prepare:'Tayyorlanish uchun savollar',
  testOpen:'Test ochiq',timeLimit:'daqiqa',testWait:'Ustoz testni boshlaganda shu yerda paydo bo‘ladi.',reviewLater:'To‘g‘ri javoblar ustoz testni yakunlagach ko‘rinadi.',yourAns:'Sizning javobingiz',right:'To‘g‘ri javob',noAnswer:'Javob berilmagan',timeUp:'Vaqt tugadi.',goals:'Dars maqsadlari',pick:'Fan tanlang'},
 ru:{student:'Студент',nick:'Псевдоним (необязательно)',nickPh:'Например: Лола',nickHint:'Преподаватель увидит вас под этим именем или номером',close:'Закрыть приём',reopen:'Открыть снова',closedLbl:'Закрыто',errClosed:'Задание закрыто.',errDone:'Вы уже сдали этот тест.',errStarted:'Этот тест уже начат, начать заново нельзя.',errDue:'Срок сдачи истёк.',errRate:'Слишком много попыток. Попробуйте позже.',errNick:'Псевдоним 2–24 символа: буквы, цифры, пробел.',errNickTaken:'Имя вида «Студент N» занято — выберите другое.',title:'Группы и занятия',signIn:'Войдите по email, чтобы пользоваться группами.',signInBtn:'Войти',offline:'Группы сейчас недоступны (интернет или сервер).',retry:'Повторить',
  newGroup:'Новая группа',groupName:'Название группы',groupHint:'Например: Терапия, 3 курс',create:'Создать',code:'Код для вступления',members:'студ.',copy:'Копировать код',copyInvite:'Копировать приглашение',copied:'Скопировано',noGroups:'Групп пока нет.',
  back:'Группы',assignments:'Задания',noAssign:'Заданий пока нет.',add:'Дать задание',kind:'Тип',task:'Текстовый ответ',quiz:'Тест (по презентации)',titleF:'Заголовок',bodyF:'Описание (необязательно)',due:'Срок',deck:'Презентация',
  submitted:'сдали',delete:'Удалить',confirmDel:'Удалить задание?',roster:'Студенты',notYet:'Не сдано',
  join:'Вступить в группу',joinPh:'6-значный код',joinHint:'Код от преподавателя — можно вводить с пробелом',joinBtn:'Вступить',leave:'Выйти из группы',teacher:'Преподаватель',
  answer:'Ваш ответ',send:'Отправить',resend:'Отправить снова',sent:'Отправлено',start:'Начать тест',result:'Результат',dueLbl:'Срок',
  errName:'Название — минимум 2 символа.',errCode:'Неверный код или группа не найдена.',errGeneric:'Не получилось. Попробуйте ещё раз.',errTeacher:'Группы создаёт только преподаватель.',
  note:'Результат теста считается на сервере; это не официальная оценка. Преподаватель видит вас по псевдониму или номеру, а не по email или имени.',
  tabs:{plan:'Учебный план',work:'Задания',book:'Журнал',people:'Студенты'},invite:'Пригласите студентов',inviteHint:'Студент вводит этот код в разделе «Вступить в группу» или считывает QR-код камерой телефона.',
  inviteText:(n:string,c:string)=>`Вступите в группу «${n}» в приложении Dental Expert: Студент → Вступить в группу → код ${c}`,
  st:{none:'Не открыта',hidden:'Скрыта',open:'Открыта',lecture:'Лекция проведена',oral:'Опрос проведён',testing:'Идёт тест',done:'Завершена'},
  openTopic:'Открыть студентам',hideTopic:'Скрыть от студентов',stage:'ЭТАП',lecture:'Лекция',lectureHint:'Выведите презентацию на экран и проведите её с заметками.',play:'Начать презентацию',markDone:'Отметить как проведённую',doneLbl:'Проведено',undo:'Отменить',
  oral:'Устный опрос',oralHint:'Задайте вопрос и оцените студентов по плану ответа. Отметки хранятся только на этом устройстве.',asked:'Задан',grade:'Оценить',knew:'Знает',partly:'Частично',didnt:'Не знает',
  test:'Тест по теме',testHint:'Выберите вопросы (верный ответ — зелёным), задайте время и начните тест.',minutes:'Время (мин)',startTest:'Начать тест',finishTest:'Завершить тест',confirmFinish:'Завершить тест? Начавшим студентам даётся 2 минуты.',results:'Результаты',needOpen:'Сначала откройте тему студентам.',needOpenTest:'Чтобы начать тест, сначала откройте тему кнопкой «Открыть студентам» выше.',
  of:'из',avg:'Средний',perQ:'По вопросам',qN:(n:number)=>`Вопрос ${n}`,qCount:(n:number)=>`${n} ${ruPlural(n,'вопрос','вопроса','вопросов')}`,rightN:(r:number,n:number)=>`${r}/${n} верно`,inviteToGrade:'Чтобы оценивать, пригласите студентов в группу.',cancel:'Отмена',great:'Отличный результат!',good:'Хороший результат',more:'Стоит повторить тему',scoreLine:(s:number,n:number)=>`Верных ответов: ${s} из ${n}`,noMembers:'Студентов пока нет.',alias:'Личная метка (видна только вам)',
  myResults:'Мои результаты',quizzesDone:'тестов сдано',topics:'Темы',noTopics:'Преподаватель ещё не открыл темы.',watch:'Смотреть презентацию',prepare:'Вопросы для подготовки',
  testOpen:'Тест открыт',timeLimit:'мин',testWait:'Появится здесь, когда преподаватель начнёт тест.',reviewLater:'Верные ответы появятся после завершения теста преподавателем.',yourAns:'Ваш ответ',right:'Верный ответ',noAnswer:'Нет ответа',timeUp:'Время вышло.',goals:'Цели занятия',pick:'Выберите предмет'},
 en:{student:'Student',nick:'Nickname (optional)',nickPh:'e.g. Lola',nickHint:'Your teacher sees you by this name or number',close:'Close submissions',reopen:'Reopen',closedLbl:'Closed',errClosed:'This assignment is closed.',errDone:'You have already submitted this quiz.',errStarted:'This quiz was already started and cannot be restarted.',errDue:'The due date has passed.',errRate:'Too many attempts. Try again later.',errNick:'Nickname: 2–24 letters, digits or spaces.',errNickTaken:'Names like “Student N” are reserved — choose another one.',title:'Groups and classes',signIn:'Sign in with your email to use groups.',signInBtn:'Sign in',offline:'Groups are unavailable right now (network or server).',retry:'Retry',
  newGroup:'New group',groupName:'Group name',groupHint:'For example: Therapy, year 3',create:'Create',code:'Join code',members:'students',copy:'Copy code',copyInvite:'Copy invitation',copied:'Copied',noGroups:'No groups yet.',
  back:'Groups',assignments:'Assignments',noAssign:'No assignments yet.',add:'Give an assignment',kind:'Type',task:'Written answer',quiz:'Quiz (from a presentation)',titleF:'Title',bodyF:'Notes (optional)',due:'Due date',deck:'Presentation',
  submitted:'submitted',delete:'Delete',confirmDel:'Delete this assignment?',roster:'Students',notYet:'Not submitted',
  join:'Join a group',joinPh:'6-character code',joinHint:'The code from your teacher — spaces are fine',joinBtn:'Join',leave:'Leave group',teacher:'Teacher',
  answer:'Your answer',send:'Submit',resend:'Submit again',sent:'Submitted',start:'Start quiz',result:'Score',dueLbl:'Due',
  errName:'Name needs at least 2 characters.',errCode:'Wrong code or group not found.',errGeneric:'That did not work. Please try again.',errTeacher:'Only teachers can create groups.',
  note:'Quiz scores are calculated on the server; they are not official grades. The teacher sees you by nickname or number, not by email or name.',
  tabs:{plan:'Curriculum',work:'Assignments',book:'Gradebook',people:'Students'},invite:'Invite your students',inviteHint:'Students enter this code under “Join a group”, or read the QR code with the phone camera.',
  inviteText:(n:string,c:string)=>`Join the group “${n}” in the Dental Expert app: Student → Join a group → code ${c}`,
  st:{none:'Not opened',hidden:'Hidden',open:'Open',lecture:'Lecture done',oral:'Oral Q&A done',testing:'Test running',done:'Completed'},
  openTopic:'Open to students',hideTopic:'Hide from students',stage:'STAGE',lecture:'Lecture',lectureHint:'Put the slides on screen and teach with the notes.',play:'Start the slides',markDone:'Mark as done',doneLbl:'Done',undo:'Undo',
  oral:'Oral Q&A',oralHint:'Ask the question and grade students against the answer plan. Marks are kept on this device only.',asked:'Asked',grade:'Grade',knew:'Knew',partly:'Partly',didnt:'Did not know',
  test:'Topic test',testHint:'Choose the questions (the right answer is green), set the time and start the test.',minutes:'Time (min)',startTest:'Start the test',finishTest:'Finish the test',confirmFinish:'Finish the test? Students who started get 2 more minutes.',results:'Results',needOpen:'Open the topic to students first.',needOpenTest:'To start the test, first open the topic with “Open to students” above.',
  of:'of',avg:'Average',perQ:'By question',qN:(n:number)=>`Question ${n}`,qCount:(n:number)=>`${n} question${n===1?'':'s'}`,rightN:(r:number,n:number)=>`${r}/${n} correct`,inviteToGrade:'Invite students to the group to grade them.',cancel:'Cancel',great:'Excellent!',good:'Good result',more:'Worth revising this topic',scoreLine:(s:number,n:number)=>`You answered ${s} of ${n} correctly`,noMembers:'No students yet.',alias:'Private label (only you see it)',
  myResults:'My results',quizzesDone:'quizzes done',topics:'Topics',noTopics:'Your teacher has not opened any topics yet.',watch:'View the slides',prepare:'Questions to prepare',
  testOpen:'Test open',timeLimit:'min',testWait:'It appears here when your teacher starts the test.',reviewLater:'The right answers appear once your teacher finishes the test.',yourAns:'Your answer',right:'Right answer',noAnswer:'No answer',timeUp:'Time is up.',goals:'Learning goals',pick:'Choose a subject'}
};
type W=typeof words.uz;
const scanWords={uz:'QR skanerlash',ru:'Сканировать QR',en:'Scan QR'};
const more={
 uz:{big:'Katta ekran · QR',reveal:'To‘g‘ri javoblar',revealClosed:'Ustoz yakunlaganda',revealDeadline:'Muddat tugagach',revealInstant:'Darhol',hintClosed:'Talabalar to‘g‘ri javoblarni siz testni yakunlaganingizdan 2 daqiqa o‘tib ko‘radi.',hintDeadline:'Muddat tugagach yoki siz testni yakunlaganingizda (qaysi biri oldin bo‘lsa), 2 daqiqa o‘tib ochiladi.',revealWarn:'Diqqat: birinchi topshirgan talaba to‘g‘ri javoblarni ko‘radi va hali yechayotganlarga aytib qo‘yishi mumkin. Nazorat testlari uchun «Ustoz yakunlaganda»ni tanlang.',remove:'Chiqarish',confirmRemove:(n:string)=>`${n} guruhdan chiqarilsinmi? Uning shu guruhdagi javoblari o‘chiriladi.`},
 ru:{big:'Большой экран · QR',reveal:'Верные ответы',revealClosed:'После завершения',revealDeadline:'После срока',revealInstant:'Сразу',hintClosed:'Студенты увидят верные ответы через 2 минуты после того, как вы завершите тест.',hintDeadline:'Откроются после срока или когда вы завершите тест (что наступит раньше), через 2 минуты.',revealWarn:'Внимание: первый сдавший увидит верные ответы и может подсказать тем, кто ещё решает. Для контрольных выберите «После завершения».',remove:'Исключить',confirmRemove:(n:string)=>`Исключить ${n} из группы? Ответы в этой группе будут удалены.`},
 en:{big:'Big screen · QR',reveal:'Right answers',revealClosed:'When I finish it',revealDeadline:'After the deadline',revealInstant:'Right away',hintClosed:'Students see the right answers 2 minutes after you finish the test.',hintDeadline:'They open after the deadline or when you finish the test, whichever comes first, plus 2 minutes.',revealWarn:'Note: the first student to submit sees the right answers and could pass them to classmates still answering. For graded tests choose “When I finish it”.',remove:'Remove',confirmRemove:(n:string)=>`Remove ${n} from the group? Their answers in this group are deleted.`}
};
/** Lazy-loaded teacher big screen (live results + join QR). */
const Big=({lang,groupId,code,test,onClose}:{lang:Lang;groupId:string;code:string;test:BigTest;onClose:(finished:boolean)=>void})=><Suspense fallback={null}><BigScreen lang={lang} groupId={groupId} groupCode={code} test={test} onClose={onClose}/></Suspense>;

const lsGet=<T,>(k:string,d:T):T=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:d}catch{return d}};
const lsSet=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{/* storage unavailable */}};
const nn=(n:number)=>String(n).padStart(2,'0');
const subjectOf=(m:TopicMeta)=>SUBJECTS.find(s=>s.id===m.subject)!;

export default function Classroom({lang,user,onSignIn}:{lang:Lang;user:AuthUser|null;onSignIn:()=>void}){
 const j=joinErr[lang];
 const t=words[lang];
 const teacher=user?.role==='teacher'||user?.role==='dentist';
 const [groups,setGroups]=useState<Group[]|null>(null);
 const [offline,setOffline]=useState(false);
 const [open,setOpen]=useState<Group|null>(null);
 // "Guruhga topshirish" from a topic page (Learn → curriculum): open that topic's test settings in a group.
 const [assign,setAssign]=useState<string|null>(()=>takeAssignTopic());
 const [msg,setMsg]=useState('');
 const [name,setName]=useState('');
 const [code,setCode]=useState('');
 const [nick,setNick]=useState('');
 const errText=(e?:string)=>e==='rate_limited'?t.errRate:e==='bad_nickname'?t.errNick:e==='reserved_nickname'?t.errNickTaken:e==='name_required'?t.errName:e==='not_found'||e==='bad_code'?t.errCode:e==='ambiguous_code'?j.ambiguous:e==='own_group'?j.own:e==='unauthorized'?j.signin:e==='network'?j.network:e==='teacher_only'?t.errTeacher:e==='nick_taken'?j.taken:e==='nickname_rejected'?j.rude:e==='group_full'?j.full:t.errGeneric;
 const load=useCallback(async()=>{
  const r=await callApi<{groups:Group[]}>('/classroom/groups');
  if(r.ok){setOffline(false);setGroups(r.data.groups);return}
  if(r.status!==401)setOffline(true);// a 5xx or 429 must not leave the list on '…'
 },[]);
 useEffect(()=>{if(user)load();else setGroups(null)},[user,load]);
 // A join through the QR sheet (an overlay at the app root) reloads the list.
 useEffect(()=>{const f=()=>{if(user)load()};addEventListener(CLASSROOM_CHANGED,f);return ()=>removeEventListener(CLASSROOM_CHANGED,f)},[user,load]);
 // A teacher with one group goes straight to the topic; with several the list asks which group.
 useEffect(()=>{if(assign&&groups?.length===1)setOpen(groups[0])},[assign,groups]);
 if(!user)return <section className="classroom card"><h2>{t.title}</h2><p className="muted">{t.signIn}</p><button className="button" onClick={onSignIn}><LogIn size={17}/>{t.signInBtn}</button></section>;
 if(offline)return <section className="classroom card"><h2>{t.title}</h2><p className="muted">{t.offline}</p><button className="button secondary" onClick={()=>void load()}>{t.retry}</button></section>;
 if(open)return <GroupView lang={lang} group={open} teacher={teacher} user={user} initialTopic={assign} onBack={()=>{setOpen(null);setAssign(null);load()}}/>;
 const create=async()=>{setMsg('');const r=await callApi('/classroom/groups','POST',{name});if(r.ok){setName('');load()}else setMsg(errText(r.data.error))};
 const join=async()=>{setMsg('');const c=nick.trim()?checkNick(nick):null;if(c&&!c.ok){setMsg(errText(c.error));return}const r=await callApi('/classroom/join','POST',{code,nickname:c?.nick||''});if(r.ok){setCode('');load()}else setMsg(errText(r.status===0?'network':r.data.error))};
 return <section className="classroom card" aria-label={t.title}>
  <h2>{t.title}</h2>
  {teacher&&assign&&groups&&<p className="lg-note" role="status">{(groups.length?assignWords[lang].pickGroup:assignWords[lang].noGroup)(tx(topicMeta(assign)?.title,lang))}</p>}
  {groups===null?<p className="muted">…</p>:groups.length===0?<p className="muted">{t.noGroups}</p>:<div className="lg-list">{groups.map(g=>
   <button key={g.id} className="lg-row" onClick={()=>setOpen(g)}><span className="lg-ico"><Users size={18}/></span><span className="lg-row-text"><strong>{g.name}</strong><small>{teacher?`${g.members??0} ${t.members} · ${t.code}: ${g.code}`:(g.teacher?`${t.teacher}: ${g.teacher} · `:'')+(g.myNickname||`${t.student} ${nn(g.myNo??0)}`)}</small></span></button>)}</div>}
  {teacher?<div className="cr-form"><label>{t.newGroup}<input value={name} maxLength={60} placeholder={t.groupName} aria-describedby="cr-group-hint" onChange={e=>setName(e.target.value)}/><small id="cr-group-hint" className="cr-help">{t.groupHint}</small></label><button className="button" disabled={name.trim().length<2} onClick={create}><Plus size={17}/>{t.create}</button></div>
  :<div className="cr-form"><button className="button secondary cr-scan" onClick={openScan}><QrCode size={18}/>{scanWords[lang]}</button>
   {/* A pasted QR link or invite text fills the code; one that names a test opens the quick test straight away. */}
   <label>{t.join}<input value={code} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder={t.joinPh} aria-describedby="cr-code-hint" onChange={e=>{const v=e.target.value;const p=v.length>7?parseJoin(v):null;if(p?.testId){setCode(p.code);openJoin(p);return}setCode(p?p.code:v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))}}/><small id="cr-code-hint" className="cr-help">{t.joinHint}</small></label>
   <label>{t.nick}<input value={nick} maxLength={24} placeholder={t.nickPh} aria-describedby="cr-nick-hint" onChange={e=>setNick(e.target.value.replace(APOSTROPHES,"'"))}/><small id="cr-nick-hint" className="cr-help">{t.nickHint}</small></label><button className="button" disabled={code.length!==6} onClick={join}><LogIn size={17}/>{t.joinBtn}</button></div>}
  {msg&&<p className="cr-error" role="alert">{msg}</p>}
  {!teacher&&<small className="muted">{t.note}</small>}
 </section>;
}

function GroupView({lang,group,teacher,user,initialTopic,onBack}:{lang:Lang;group:Group;teacher:boolean;user:AuthUser;initialTopic?:string|null;onBack:()=>void}){
 const t=words[lang];
 const [tab,setTab]=useState<'plan'|'work'|'book'|'people'>('plan');
 const [items,setItems]=useState<Assignment[]|null>(null);
 const [failed,setFailed]=useState(false);
 const [topics,setTopics]=useState<TopicRow[]|null>(null);
 const [book,setBook]=useState<Book|null>(null);
 const [decks,setDecks]=useState<Deck[]>([]);
 const [sel,setSel]=useState<Assignment|null>(null);
 const [topicId,setTopicId]=useState<string|null>(initialTopic&&teacher?initialTopic:null);
 const [roster,setRoster]=useState<Member[]|null>(null);
 const [adding,setAdding]=useState(false);
 const [general,setGeneral]=useState(false);
 const load=useCallback(async()=>{
  const [a,tp]=await Promise.all([callApi<{assignments:Assignment[]}>('/classroom/assignments?groupId='+group.id),callApi<{topics:TopicRow[]}>('/classroom/topics?groupId='+group.id)]);
  setFailed(!a.ok||!tp.ok);
  if(a.ok)setItems(a.data.assignments);else setItems(prev=>prev??[]);
  if(tp.ok)setTopics(tp.data.topics);else setTopics(prev=>prev??[]);
  if(teacher){const b=await callApi<Book>('/classroom/gradebook?groupId='+group.id);if(b.ok)setBook(b.data)}
 },[group.id,teacher]);
 useEffect(()=>{load()},[load]);
 // While a test is running the teacher's "N/M submitted" refreshes on its own (only when the app is in front).
 const live=teacher&&!!items?.some(a=>a.kind==='quiz'&&a.status==='open');
 useEffect(()=>{if(!live)return;const id=setInterval(()=>{if(document.visibilityState==='visible')load()},15000);return ()=>clearInterval(id)},[live,load]);
 useEffect(()=>{fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(setDecks).catch(()=>setDecks([]))},[lang]);
 const openAssignment=async(a:Assignment)=>{
  if(a.topicId){setTopicId(a.topicId);setTab('plan');return}
  setSel(a);setRoster(null);
  if(teacher){const r=await callApi<{members:Member[]}>(`/classroom/assignments?groupId=${group.id}&assignmentId=${a.id}`);if(r.ok)setRoster(r.data.members)}
 };
 const leave=async()=>{await callApi(`/classroom/join?groupId=${group.id}`,'DELETE');onBack()};
 const memberCount=book?.members.length??group.members??0;
 const backTo=sel?()=>{setSel(null);load()}:topicId?()=>{setTopicId(null);load()}:general?()=>setGeneral(false):onBack;
 const backLabel=sel||topicId||general?group.name:t.back;
 // A new general test opens on its live page.
 const opened=async(id:string)=>{setGeneral(false);const a=await callApi<{assignments:Assignment[]}>('/classroom/assignments?groupId='+group.id);if(a.ok){setItems(a.data.assignments);const x=a.data.assignments.find(y=>y.id===id);if(x){bigFor={id:x.id,until:Date.now()+20000};setSel(x)}}load()};
 const row=topics?.find(r=>r.topicId===topicId)||null;
 const top=useRef<HTMLElement>(null);
 const first=useRef(true);
 useEffect(()=>{if(first.current){first.current=false;return}toTop(top.current)},[sel,topicId,general]);
 return <section className="classroom card lg-group" ref={top}>
  <button className="cr-back" onClick={backTo}><ChevronLeft size={16}/>{backLabel}</button>
  {failed&&<p className="cr-error" role="alert">{t.offline} <button className="cr-retry" onClick={()=>void load()}>{t.retry}</button></p>}
  {sel?<AssignmentView lang={lang} groupId={group.id} code={group.code||''} user={user} a={items?.find(x=>x.id===sel.id)||sel} teacher={teacher} roster={roster} decks={decks} members={book?.members||[]} onChanged={load} onDeleted={()=>{setSel(null);load()}}/>
  :topicId?(teacher?<TeacherTopic lang={lang} groupId={group.id} code={group.code||''} user={user} topicId={topicId} row={row} topics={topics} test={items?.find(a=>a.id===row?.testId)||null} members={book?.members||[]} onChanged={load}/>
   :<StudentTopic lang={lang} user={user} topicId={topicId} test={items?.find(a=>a.id===row?.testId)||null} onChanged={load}/>)
  :general&&teacher?<GeneralSetup lang={lang} groupId={group.id} onDone={opened} onCancel={()=>setGeneral(false)}/>
  :<>
   <span className="lg-eyebrow">{teacher?`${memberCount} ${t.members}`:(group.teacher?`${t.teacher}: ${group.teacher}`:'')}</span>
   <h2>{group.name}</h2>
   {teacher&&memberCount===0&&<InviteCard lang={lang} group={group}/>}
   {!teacher&&<MyResults lang={lang} items={items}/>}
   {teacher&&<div className="cr-actions lg-assign"><button className="button" onClick={()=>{setTab('plan');setTimeout(()=>document.querySelector('.lg-group .lg-tabs')?.scrollIntoView({block:'start',behavior:'smooth'}),50)}}><ClipboardList size={17}/>{assignWords[lang].topic}</button><button className="button secondary" onClick={()=>setGeneral(true)}><Layers size={17}/>{assignWords[lang].general}</button></div>}
   <div className="chips lg-tabs" role="tablist">{(teacher?['plan','work','book','people'] as const:['plan','work'] as const).map(k=><button key={k} role="tab" aria-selected={tab===k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{k==='plan'&&!teacher?t.topics:t.tabs[k]}</button>)}</div>
   {tab==='plan'&&(teacher?<TeacherPlan lang={lang} topics={topics} items={items} onPick={setTopicId} onNav={()=>toTop(top.current)}/>:<StudentPlan lang={lang} topics={topics} items={items} onPick={setTopicId}/>)}
   {tab==='work'&&<>
    {items===null?<p className="muted">…</p>:items.length===0?<p className="muted">{t.noAssign}</p>:<div className="lg-list">{items.map(a=>
     <button key={a.id} className="lg-row" onClick={()=>openAssignment(a)}><span className={'lg-ico '+(a.kind==='quiz'?'quiz':'task')}>{a.kind==='quiz'?<ClipboardList size={18}/>:'✎'}</span><span className="lg-row-text"><strong>{a.title}</strong><small>{teacher?`${a.submitted??0}/${memberCount} ${t.submitted}`:a.mine?(a.kind==='quiz'&&a.mine.answer==='done'?`${t.result}: ${a.mine.score}/${a.mine.total}`:a.kind==='task'?t.sent:''):''}{a.dueDate?` · ${t.dueLbl} ${a.dueDate}`:''}</small></span>
      <AssignTag t={t} a={a} teacher={teacher}/></button>)}</div>}
    {teacher?(adding?<NewAssignment lang={lang} groupId={group.id} decks={decks} onDone={()=>{setAdding(false);load()}} onCancel={()=>setAdding(false)}/>:<button className="button" onClick={()=>setAdding(true)}><Plus size={17}/>{t.add}</button>)
    :<button className="button secondary" onClick={leave}>{t.leave}</button>}
   </>}
   {tab==='book'&&teacher&&<Gradebook lang={lang} groupId={group.id} book={book}/>}
   {tab==='people'&&teacher&&<><InviteCard lang={lang} group={group}/><People lang={lang} groupId={group.id} members={book?.members||null} onChanged={load}/></>}
  </>}
 </section>;
}

const assignWords={uz:{topic:'Mavzu testi berish',general:'Umumiy test berish',label:'Umumiy test',pickGroup:(t:string)=>`«${t}» testini qaysi guruhga berasiz? Guruhni tanlang.`,noGroup:(t:string)=>`«${t}» testini berish uchun avval guruh yarating.`},
 ru:{topic:'Дать тест по теме',general:'Дать общий тест',label:'Общий тест',pickGroup:(t:string)=>`Какой группе дать тест «${t}»? Выберите группу.`,noGroup:(t:string)=>`Чтобы дать тест «${t}», сначала создайте группу.`},
 en:{topic:'Give a topic test',general:'Give a general test',label:'General test',pickGroup:(t:string)=>`Which group gets the “${t}” test? Choose a group.`,noGroup:(t:string)=>`Create a group first to give the “${t}” test.`}};

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
 // The QR holds the join link: a phone camera opens the /j/ page, the in-app scanner reads the code from it.
 const qr=useMemo(()=>{if(!code)return '';const q=qrcode(0,'M');q.addData(joinLink(code));q.make();return q.createDataURL(5,2)},[code]);
 const copy=(k:string,v:string)=>{try{navigator.clipboard?.writeText(v)}catch{/* clipboard unavailable */}setCopied(k);setTimeout(()=>setCopied(''),1500)};
 return <div className="lg-card lg-invite">
  <h3><QrCode size={16}/>{t.invite}</h3>
  <div className="lg-invite-body"><img src={qr} alt={`QR: ${code}`} width={128} height={128}/><div><small>{t.code}</small><b translate="no">{code.slice(0,3)} {code.slice(3)}</b><p className="muted">{t.inviteHint}</p></div></div>
  <div className="cr-actions"><button className="button secondary" onClick={()=>copy('c',code)}><Copy size={15}/>{copied==='c'?t.copied:t.copy}</button><button className="button secondary" onClick={()=>copy('i',t.inviteText(group.name,code)+'\n'+joinLink(code))}><Copy size={15}/>{copied==='i'?t.copied:t.copyInvite}</button></div>
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

function TeacherPlan({lang,topics,items,onPick,onNav}:{lang:Lang;topics:TopicRow[]|null;items:Assignment[]|null;onPick:(id:string)=>void;onNav:()=>void}){
 const t=words[lang];
 const [subject,setSubject]=useState<Subject|null>(()=>{const first=topics?.[0];const m=first&&topicMeta(first.topicId);return m?subjectOf(m):null});
 const nav=useRef(onNav);nav.current=onNav;
 const first=useRef(true);
 useEffect(()=>{if(first.current){first.current=false;return}nav.current()},[subject]);
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
  <span className={'lg-ico '+m.type}>{m.n}</span><span className="lg-row-text"><strong>{tx(m.title,lang)}</strong><small>{tx(subjectOf(m).title,lang)} · {metaLine(m,lang)}</small>
  {test&&(test.mine?.answer==='done'?<span className="lg-tag brand">{t.result}: {test.mine.score}/{test.mine.total}</span>:test.status==='open'?<span className="lg-tag warn">{t.testOpen}</span>:null)}</span></button>})}</div>;
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

function TeacherTopic({lang,groupId,code,user,topicId,row,topics,test,members,onChanged}:{lang:Lang;groupId:string;code:string;user:AuthUser;topicId:string;row:TopicRow|null;topics:TopicRow[]|null;test:Assignment|null;members:BookMember[];onChanged:()=>void}){
 const t=words[lang];
 const topic=useTopic(topicId);
 const meta=topicMeta(topicId);
 const [show,setShow]=useState(false);
 const [err,setErr]=useState('');
 const [testErr,setTestErr]=useState('');
 const [busy,setBusy]=useState(false);
 const okey=`de_oral:${groupId}:${topicId}`;
 const [oral,setOral]=useState<Oral>(()=>lsGet(okey,{asked:[],marks:{}}));
 const [grading,setGrading]=useState<number|null>(null);
 const [asking,setAsking]=useState(false);
 const aliases=lsGet<Record<string,string>>(`de_alias:${groupId}`,{});
 const act=async(action:string,extra:Record<string,unknown>={})=>{
  setErr('');setBusy(true);
  const r=await callApi('/classroom/topics','POST',{groupId,topicId,action,...extra});
  setBusy(false);
  if(!r.ok){if(action==='test')setTestErr(r.data.error||'other');else setErr(r.data.error==='not_open'?t.needOpen:t.errGeneric)}else setTestErr('');
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
    <div className="cr-actions"><button className="button" onClick={()=>setShow(true)}><Presentation size={16}/>{t.play} · {slideCount(topic)}</button>
     <DoneToggle t={t} done={!!row?.lectureDoneAt} disabled={!isOpen||busy} onSet={d=>act('lecture',{done:d})}/></div>
   </Stage>
   <Stage n={2} t={t} title={t.oral} done={!!row?.oralDoneAt} hint={t.oralHint}>
    <OralList lang={lang} topic={topic} extra={k=><div className="lg-oral-tools">
     <label className="lg-check"><input type="checkbox" checked={oral.asked.includes(k)} onChange={e=>saveOral({...oral,asked:e.target.checked?[...oral.asked,k]:oral.asked.filter(x=>x!==k)})}/>{t.asked}</label>
     {members.length>0?<button className="lg-link" aria-expanded={grading===k} onClick={()=>setGrading(grading===k?null:k)}>{t.grade}</button>:<small className="lg-hint">{t.inviteToGrade}</small>}
     {grading===k&&<div className="lg-grade">{members.map(m=>{const v=oral.marks[k]?.[m.no];const set=(x:'y'|'p'|'n')=>saveOral({...oral,marks:{...oral.marks,[k]:{...oral.marks[k],[m.no]:x}}});
      return <div key={m.no}><span>{label(m)}</span><span className="lg-seg">{(['y','p','n'] as const).map(x=><button key={x} className={v===x?'on '+x:''} onClick={()=>set(x)}>{x==='y'?t.knew:x==='p'?t.partly:t.didnt}</button>)}</span></div>})}</div>}
    </div>}/>
    <DoneToggle t={t} done={!!row?.oralDoneAt} disabled={!isOpen||busy} onSet={d=>act('oral',{done:d})}/>
   </Stage>
   <Stage n={3} t={t} title={t.test} done={!!test&&test.status==='closed'} hint={test?'':t.testHint}>
    {test?<TestRunning lang={lang} groupId={groupId} code={code} user={user} topicId={topic.id} test={test} members={members} label={label} onFinish={()=>setAsking(true)} onChanged={onChanged}/>
    :<TestSetup lang={lang} groupId={groupId} topic={topic} topics={topics} disabled={!isOpen||busy} reason={isOpen?undefined:t.needOpenTest} error={testErr} onStart={p=>{bigFor={id:topic.id,until:Date.now()+20000};act('test',{...p,title:tx(topic.title,lang)})}}/>}
   </Stage>
   {asking&&<ConfirmSheet text={t.confirmFinish} ok={t.finishTest} cancel={t.cancel} onOk={async()=>{setAsking(false);await act('finish')}} onCancel={()=>setAsking(false)}/>}
   {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} sources={topic.sources} lang={lang} accent={subjectColor(subject.id).c} teacher onClose={()=>setShow(false)}/>}
  </>}
 </>;
}

function Stage({n,t,title,done,hint,children}:{n:number;t:W;title:string;done:boolean;hint?:string;children:React.ReactNode}){
 return <div className={'lg-stage'+(done?' done':'')}><span className="lg-eyebrow">{n}-{t.stage}</span><h3>{done&&<Check size={16}/>}{title}</h3>{hint&&<p className="muted">{hint}</p>}{children}</div>;
}

/** In-app confirmation (replaces window.confirm): focus starts on Cancel, Escape or the backdrop cancels, focus returns afterwards. */
function ConfirmSheet({text,ok,cancel,danger,onOk,onCancel}:{text:string;ok:string;cancel:string;danger?:boolean;onOk:()=>void;onCancel:()=>void}){
 const ref=useRef<HTMLButtonElement>(null);
 const esc=useRef(onCancel);esc.current=onCancel;
 useEffect(()=>{const back=document.activeElement as HTMLElement|null;ref.current?.focus();const k=(e:KeyboardEvent)=>{if(e.key==='Escape')esc.current()};addEventListener('keydown',k);return ()=>{removeEventListener('keydown',k);back?.focus?.()}},[]);
 return <div className="lg-confirm" onClick={e=>{if(e.target===e.currentTarget)onCancel()}}>
  <div className="lg-confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="lg-confirm-text"><p id="lg-confirm-text">{text}</p>
   <div className="lg-confirm-actions"><button ref={ref} className="button secondary" onClick={onCancel}>{cancel}</button><button className={'button'+(danger?' secondary danger':'')} onClick={onOk}>{ok}</button></div></div>
 </div>;
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

let bigFor:{id:string;until:number}|null=null;

/** Topic test settings (src/testSetup.tsx) with the teacher's key for marking the right options. */
function TestSetup({lang,groupId,topic,topics,disabled,reason,error,onStart}:{lang:Lang;groupId:string;topic:Topic;topics:TopicRow[]|null;disabled:boolean;reason?:string;error?:string;onStart:(p:TestPayload)=>void}){
 const key=useKey(groupId,topic.id);
 return <TopicTestSetup lang={lang} topic={topic} topics={topics} keyOf={key} disabled={disabled} reason={reason} error={error} onStart={onStart}/>;
}

type Live=Member&{startedAt?:string|null;answered?:number;questions?:string[]};
const liveState=(m:Live)=>m.answer==='done'?2:m.answer==='started'?1:0;

/** The running (or finished) topic test on the teacher's phone: one QR for everyone, every student as a live row
 * (joined → answering → submitted with the score), the big screen, a student preview and the per-question results. */
function TestRunning({lang,groupId,code,user,topicId,test,members,label,onFinish,onChanged}:{lang:Lang;groupId:string;code:string;user:AuthUser|null;topicId?:string;test:Assignment;members:BookMember[];label:(m:BookMember)=>string;onFinish:()=>void;onChanged:()=>void}){
 const t=words[lang],r=runWords[lang];
 const [res,setRes]=useState<Live[]|null>(null);
 const [stats,setStats]=useState<{right:number;answered:number}[]|null>(null);
 const [qText,setQText]=useState<string[]|null>(null);
 const [preview,setPreview]=useState(false);
 // Starting a topic test goes straight to the big screen (QR + live results); reopening the topic later does not.
 const [big,setBig]=useState(()=>!!bigFor&&bigFor.id===(topicId||test.id)&&Date.now()<bigFor.until);
 useEffect(()=>{if(big)bigFor=null},[big]);
 const over=test.status==='closed'||!!test.ended;
 const load=useCallback(async()=>{const x=await callApi<{members:Live[];stats?:{right:number;answered:number}[]}>(`/classroom/assignments?groupId=${groupId}&assignmentId=${test.id}`);if(x.ok){setRes(x.data.members);setStats(x.data.stats||null)}},[groupId,test.id]);
 useEffect(()=>{load()},[load,test.status,test.submitted]);
 // Live rows every 5 s while the test runs and the app is in front.
 useEffect(()=>{if(over||big||preview)return;const id=setInterval(()=>{if(document.visibilityState==='visible')load()},5000);return ()=>clearInterval(id)},[over,big,preview,load]);
 useEffect(()=>{if(!stats||!test.items)return;let live=true;refItems(test.items,lang).then(it=>{if(live&&it)setQText(it.map(q=>q.q))});return ()=>{live=false}},[stats,test.items,lang]);
 const byNo=new Map(members.map(m=>[m.no,m]));
 const rows=[...(res||[])].sort((a,b)=>liveState(b)-liveState(a)||(b.score??-1)-(a.score??-1)||a.no-b.no);
 const done=rows.filter(m=>m.answer==='done').length;
 const n=test.questionCount??test.questions?.length??0;
 const info=[t.qCount(n),test.minutes?`${test.minutes} ${t.timeLimit}`:r.noLimit,test.deadlineAt?fmtDue(test.deadlineAt,lang):'',test.variant?r.variant(test.items?.length||0):''].filter(Boolean).join(' · ');
 return <>
  <div className="lg-mine"><div><b>{done}/{rows.length||members.length}</b> <small>{t.submitted}</small></div><span className={'lg-tag '+(over?'brand':'warn')}>{over?t.st.done:t.st.testing}</span>
   <div className="lg-bar"><i style={{width:`${rows.length?done/rows.length*100:0}%`}}/></div></div>
  <p className="muted">{info}</p>
  {!over&&code&&<QrCard lang={lang} code={code} testId={test.id}/>}
  <div className="cr-actions">{code&&<button className="button lg-big" onClick={()=>setBig(true)}><Tv size={18}/>{more[lang].big}</button>}</div>
  <div className="cr-actions"><button className="button secondary" onClick={()=>setPreview(true)}><Eye size={16}/>{r.preview}</button>{test.status==='open'&&<button className="button" onClick={onFinish}>{t.finishTest}</button>}</div>
  {big&&<Big lang={lang} groupId={groupId} code={code} test={{id:test.id,title:test.title,topicId}} onClose={()=>{setBig(false);onChanged();load()}}/>}
  {preview&&user&&<PreviewRun lang={lang} a={test as TestMeta} userId={user.id} onExit={()=>setPreview(false)}/>}
  <h3 className="lg-h">{t.results}</h3>
  {res===null?<p className="muted">…</p>:!rows.length?<p className="muted">{r.nobody}</p>
  :<div className="lg-list lg-live" aria-live="polite">{rows.map(m=>{const bm=byNo.get(m.no);const st=liveState(m);const pct=st===2&&m.total?Math.round((m.score||0)/m.total*100):null;
   return <div key={m.no} className={'lg-row static s'+st}><span className="lg-ico">{nn(m.no)}</span><span className="lg-row-text"><strong>{bm?label(bm):m.nickname||`${t.student} ${nn(m.no)}`}</strong>
    <small>{st===2?`${r.done} · ${m.score}/${m.total}`:st===1?`${r.solving} · ${m.answered??0}/${m.total||n}`:r.joined}</small></span>
    {pct!==null?<span className={'lg-tag '+(pct>=60?'brand':'warn')}>{pct}%</span>:st===1?<span className="lg-tag warn">{r.solving}</span>:null}</div>})}</div>}
  {over&&stats&&stats.some(s=>s.answered)&&<div className="lg-errs"><h3>{t.perQ}</h3>{stats.map((s,k)=>{if(!s.answered)return null;const pct=Math.round(s.right/s.answered*100);
   return <div key={k} className={'lg-err '+(pct>=60?'good':'bad')}><span className="lg-err-q"><b>{t.qN(k+1)}</b> {qText?.[k]||''}</span><div className="lg-bar" role="img" aria-label={`${t.rightN(s.right,s.answered)} · ${pct}%`}><i style={{width:Math.max(pct,2)+'%'}}/></div><small>{t.rightN(s.right,s.answered)}</small></div>})}</div>}
 </>;
}

/** One QR for the whole class: the test link (the same for everyone), with the code for typing. */
function QrCard({lang,code,testId}:{lang:Lang;code:string;testId:string}){
 const r=runWords[lang];
 const qr=useMemo(()=>{const q=qrcode(0,'M');q.addData(joinLink(code,testId));q.make();return q.createDataURL(5,2)},[code,testId]);
 return <div className="lg-card lg-invite lg-qrcard"><h3><QrCode size={16}/>{r.qrTitle}</h3>
  <div className="lg-invite-body"><img src={qr} alt={`QR: ${code}`} width={200} height={200}/><div><small>{words[lang].code}</small><b translate="no">{code.slice(0,3)} {code.slice(3)}</b><p className="muted">{r.qrHint}</p></div></div></div>;
}

const runWords={
 uz:{noLimit:'vaqt cheklanmagan',variant:(p:number)=>`variantli (hovuz ${p})`,preview:'Talaba ko‘rinishida sinash',nobody:'Hali hech kim qo‘shilmadi — talabalar QR’ni skanerlasin.',joined:'Qo‘shildi',solving:'Yechmoqda',done:'Topshirdi',
  qrTitle:'Talabalar uchun QR',qrHint:'Hamma uchun bitta QR: ilovadagi skaner yoki telefon kamerasi bilan o‘qiladi. Kirmagan talaba avval hisobiga kiradi.'},
 ru:{noLimit:'без ограничения времени',variant:(p:number)=>`с вариантами (банк ${p})`,preview:'Попробовать как студент',nobody:'Пока никто не подключился — пусть студенты отсканируют QR.',joined:'Подключился',solving:'Решает',done:'Сдал',
  qrTitle:'QR для студентов',qrHint:'Один QR для всех: сканер в приложении или камера телефона. Студент без входа сначала входит в аккаунт.'},
 en:{noLimit:'no time limit',variant:(p:number)=>`variants (pool of ${p})`,preview:'Try it as a student',nobody:'Nobody has joined yet — let the students scan the QR.',joined:'Joined',solving:'Answering',done:'Submitted',
  qrTitle:'QR for students',qrHint:'One QR for everyone: the in-app scanner or the phone camera. A student who is not signed in signs in first.'}
};

function StudentTopic({lang,user,topicId,test,onChanged}:{lang:Lang;user:AuthUser;topicId:string;test:Assignment|null;onChanged:()=>void}){
 const t=words[lang],r=runWords[lang];
 const topic=useTopic(topicId);
 const meta=topicMeta(topicId);
 const [show,setShow]=useState(false);
 const [run,setRun]=useState(false);
 const [score,setScore]=useState<[number,number]|null>(null);
 const [err,setErr]=useState('');
 const [items,setItems]=useState<TestItem[]|null>(null);
 const mine=test?.mine;
 const review=mine?.review;
 useEffect(()=>{if(!review||!test)return;let live=true;loadTestItems(test as TestMeta,lang).then(x=>{if(live)setItems(x)});return ()=>{live=false}},[review,test,lang]);
 if(!meta)return null;
 const subject=subjectOf(meta);
 const finished=mine?.answer==='done'||!!score;
 const n=test?.questionCount??test?.questions?.length??0;
 const canStart=!!test&&test.status==='open'&&(!test.ended||mine?.answer==='started');
 return <>
  <span className="lg-eyebrow">{tx(subject.title,lang)}</span>
  <h2>{tx(meta.title,lang)}</h2>
  <p className="muted">{metaLine(meta,lang)}</p>
  {!topic?<p className="muted">…</p>:<>
   <div className="lg-card"><h3><BookOpen size={16}/>{t.goals}</h3><ul className="lg-goals">{topic.goals.map((g,k)=><li key={k}>{tx(g,lang)}</li>)}</ul></div>
   <button className="button" onClick={()=>setShow(true)}><Presentation size={16}/>{t.watch} · {slideCount(topic)}</button>
   <div className={'lg-stage'+(finished?' done':'')}><span className="lg-eyebrow">{t.test}</span>
    {!test?<p className="muted">{t.testWait}</p>
    :finished?<><p className="cr-score">{t.result}: {score?score[0]:mine?.score} / {score?score[1]:mine?.total}</p>
     {review?(items?<TestReview lang={lang} items={items} review={review}/>:<p className="muted">…</p>):<p className="muted">{revealNote(test,lang)}</p>}</>
    :canStart?<><p className="muted">{[t.qCount(n),test.minutes?`${test.minutes} ${t.timeLimit}`:r.noLimit,test.deadlineAt?fmtDue(test.deadlineAt,lang):''].filter(Boolean).join(' · ')}</p>
     {test.variant&&<p className="lg-small muted">{studentWords[lang].own}</p>}
     <button className="button" onClick={()=>{setErr('');setRun(true)}}><Timer size={16}/>{mine?.answer==='started'?testWords[lang].resume:t.start}</button></>
    :<p className="muted">{test.status==='open'&&test.ended?testError(lang,'past_due'):t.errClosed}</p>}
    {err&&<p className="cr-error" role="alert">{err}</p>}
   </div>
   <h3 className="lg-h">{t.prepare}</h3>
   <OralList lang={lang} topic={topic}/>
   {show&&<Slides title={tx(topic.title,lang)} eyebrow={tx(subject.title,lang)} slides={topic.slides} sources={topic.sources} lang={lang} accent={subjectColor(subject.id).c} onClose={()=>setShow(false)}/>}
   {run&&test&&<TestRun lang={lang} a={test as TestMeta} userId={user.id} onExit={()=>{setRun(false);onChanged()}} onError={e=>{setRun(false);setErr(testError(lang,e));onChanged()}} onSubmitted={(s,n)=>setScore([s,n])}/>}
  </>}
 </>;
}
const studentWords={uz:{own:'Har bir talabaga o‘z savollari tushadi.'},ru:{own:'У каждого студента свой набор вопросов.'},en:{own:'Every student gets their own set of questions.'}};

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

function People({lang,groupId,members,onChanged}:{lang:Lang;groupId:string;members:BookMember[]|null;onChanged:()=>void}){
 const t=words[lang],x=more[lang];
 const k=`de_alias:${groupId}`;
 const [aliases,setAliases]=useState<Record<string,string>>(()=>lsGet(k,{}));
 const [removing,setRemoving]=useState<BookMember|null>(null);
 const [err,setErr]=useState('');
 if(members===null)return <p className="muted">…</p>;
 if(!members.length)return <p className="muted">{t.noMembers}</p>;
 const name=(m:BookMember)=>m.nickname||`${t.student} ${nn(m.no)}`;
 const remove=async(m:BookMember)=>{setRemoving(null);setErr('');const r=await callApi(`/classroom/members?groupId=${encodeURIComponent(groupId)}&no=${m.no}`,'DELETE');if(r.ok)onChanged();else setErr(t.errGeneric)};
 return <><div className="lg-list">{members.map(m=><div key={m.no} className="lg-row static"><span className="lg-ico">{nn(m.no)}</span><span className="lg-row-text"><strong>{name(m)}</strong>
  <input className="lg-alias" maxLength={40} placeholder={t.alias} value={aliases[m.no]||''} onChange={e=>{const v={...aliases,[m.no]:e.target.value};setAliases(v);lsSet(k,v)}}/></span>
  <button className="lg-remove" aria-label={`${x.remove}: ${name(m)}`} title={x.remove} onClick={()=>setRemoving(m)}><UserMinus size={18}/></button></div>)}</div>
  {err&&<p className="cr-error" role="alert">{err}</p>}
  {removing&&<ConfirmSheet text={x.confirmRemove(name(removing))} ok={x.remove} cancel={t.cancel} danger onOk={()=>remove(removing)} onCancel={()=>setRemoving(null)}/>}</>;
}

/** Whether students see the right answers straight after submitting or only once the teacher finishes the test. */
function RevealPick({x,value,deadline,onChange}:{x:typeof more.uz;value:Reveal;deadline?:boolean;onChange:(r:Reveal)=>void}){
 return <><label>{x.reveal}<select value={value} onChange={e=>onChange(e.target.value as Reveal)}><option value="closed">{x.revealClosed}</option>{deadline&&<option value="deadline">{x.revealDeadline}</option>}<option value="instant">{x.revealInstant}</option></select></label><small className="muted lg-small" role="note">{value==='instant'?x.revealWarn:value==='deadline'?x.hintDeadline:x.hintClosed}</small></>;
}

function NewAssignment({lang,groupId,decks,onDone,onCancel}:{lang:Lang;groupId:string;decks:Deck[];onDone:()=>void;onCancel:()=>void}){
 const t=words[lang];
 const [kind,setKind]=useState<'task'|'quiz'>('task');
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [due,setDue]=useState('');
 const [deck,setDeck]=useState(decks[0]?.id||'');
 const [reveal,setReveal]=useState<Reveal>('closed');
 const [err,setErr]=useState('');
 const save=async()=>{
  const chosen=decks.find(d=>d.id===(deck||decks[0]?.id));
  const r=await callApi('/classroom/assignments','POST',{groupId,kind,title,body,dueDate:due,deckId:kind==='quiz'?chosen?.id:undefined,key:kind==='quiz'?chosen?.quiz.map(q=>q.correct):undefined,reveal:kind==='quiz'?reveal:undefined});
  if(r.ok)onDone();else setErr(t.errGeneric);
 };
 return <div className="cr-form">
  <label>{t.kind}<select value={kind} onChange={e=>setKind(e.target.value as 'task'|'quiz')}><option value="task">{t.task}</option><option value="quiz" disabled={decks.length===0}>{t.quiz}</option></select></label>
  {kind==='quiz'&&<label>{t.deck}<select value={deck||decks[0]?.id} onChange={e=>setDeck(e.target.value)}>{decks.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label>}
  {kind==='quiz'&&<RevealPick x={more[lang]} value={reveal} onChange={setReveal}/>}
  <label>{t.titleF}<input value={title} maxLength={100} onChange={e=>setTitle(e.target.value)}/></label>
  <label>{t.bodyF}<textarea rows={3} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)}/></label>
  <label>{t.due}<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
  {err&&<p className="cr-error" role="alert">{err}</p>}
  <div className="cr-actions"><button className="button" disabled={title.trim().length<2} onClick={save}>{t.create}</button><button className="button secondary cr-x" onClick={onCancel} aria-label="×">×</button></div>
 </div>;
}

function AssignmentView({lang,groupId,code,user,a,teacher,roster,decks,members,onChanged,onDeleted}:{lang:Lang;groupId:string;code:string;user:AuthUser;a:Assignment;teacher:boolean;roster:Member[]|null;decks:Deck[];members:BookMember[];onChanged:()=>void;onDeleted:()=>void}){
 const t=words[lang];
 const [answer,setAnswer]=useState(a.mine?.answer||'');
 const [done,setDone]=useState(!!a.mine);
 const [run,setRun]=useState(false);
 const [score,setScore]=useState<[number,number]|null>(a.mine&&a.mine.answer==='done'&&a.mine.score!==null?[a.mine.score,a.mine.total||0]:null);
 const deck=decks.find(d=>d.id===a.deckId);
 const [err,setErr]=useState('');
 const send=async()=>{setErr('');const r=await callApi('/classroom/submit','POST',{assignmentId:a.id,answer});if(r.ok){setDone(true);onChanged()}else setErr(r.data.error==='closed'?t.errClosed:t.errGeneric)};
 const toggle=async()=>{await callApi('/classroom/assignments','PUT',{assignmentId:a.id,status:a.status==='open'?'closed':'open'});onDeleted()};
 const [asking,setAsking]=useState(false);
 const [big,setBig]=useState(false);
 const del=async()=>{setAsking(false);await callApi('/classroom/assignments?assignmentId='+a.id,'DELETE');onDeleted()};
 const [finishing,setFinishing]=useState(false);
 const [items,setItems]=useState<TestItem[]|null>(null);
 const review=a.mine?.review;
 useEffect(()=>{if(!review)return;let live=true;loadTestItems(a as TestMeta,lang).then(x=>{if(live)setItems(x)});return ()=>{live=false}},[review,a,lang]);
 const aliases=lsGet<Record<string,string>>(`de_alias:${groupId}`,{});
 const label=(m:BookMember)=>(aliases[m.no]?aliases[m.no]+' · ':'')+(m.nickname||`${t.student} ${nn(m.no)}`);
 // A general test: the same live page as a topic test (one QR, live rows, big screen, student preview, results).
 if(teacher&&a.general)return <>
  <span className="lg-eyebrow">{assignWords[lang].label}</span><h2>{a.title}</h2>
  <TestRunning lang={lang} groupId={groupId} code={code} user={user} test={a} members={members} label={label} onFinish={()=>setFinishing(true)} onChanged={onChanged}/>
  <div className="cr-actions"><button className="button secondary" onClick={()=>setAsking(true)}><Trash2 size={16}/>{t.delete}</button></div>
  {finishing&&<ConfirmSheet text={t.confirmFinish} ok={t.finishTest} cancel={t.cancel} onOk={async()=>{setFinishing(false);await callApi('/classroom/assignments','PUT',{assignmentId:a.id,status:'closed'});onChanged()}} onCancel={()=>setFinishing(false)}/>}
  {asking&&<ConfirmSheet text={t.confirmDel} ok={t.delete} cancel={t.cancel} danger onOk={del} onCancel={()=>setAsking(false)}/>}
 </>;
 const canRun=!!deck||!!a.items;
 return <>
  <h2>{a.title}</h2>
  {a.dueDate&&<p className="muted">{t.dueLbl}: {a.dueDate}</p>}
  {a.body&&<p className="body-copy">{a.body}</p>}
  {teacher?<>
   {a.kind==='quiz'&&code&&<button className="button lg-big" onClick={()=>setBig(true)}><Tv size={18}/>{more[lang].big}</button>}
   {big&&<Big lang={lang} groupId={groupId} code={code} test={{id:a.id,title:a.title,deckId:a.deckId}} onClose={f=>{setBig(false);if(f)onDeleted()}}/>}
   <h3>{t.roster}</h3>
   {roster===null?<p className="muted">…</p>:<div className="lg-list">{roster.map((m,i)=><div key={i} className="lg-row static"><span className="lg-row-text"><strong>{m.nickname||`${t.student} ${nn(m.no)}`}</strong><small>{m.submittedAt&&m.answer!=='started'?(a.kind==='quiz'?`${t.result}: ${m.score}/${m.total}`:m.answer):m.answer==='started'?t.st.testing:t.notYet}</small></span></div>)}</div>}
   <div className="cr-actions"><button className="button secondary" onClick={toggle}>{a.status==='open'?t.close:t.reopen}</button>
   <button className="button secondary" onClick={()=>setAsking(true)}><Trash2 size={16}/>{t.delete}</button></div>
   {asking&&<ConfirmSheet text={t.confirmDel} ok={t.delete} cancel={t.cancel} danger onOk={del} onCancel={()=>setAsking(false)}/>}
  </>:a.kind==='task'?<>
   <label>{t.answer}<textarea rows={5} maxLength={2000} value={answer} onChange={e=>{setAnswer(e.target.value);setDone(false)}}/></label>
   {a.status==='closed'&&<p className="muted">{t.errClosed}</p>}
   {err&&<p className="cr-error" role="alert">{err}</p>}
   <button className="button" disabled={!answer.trim()||done||a.status==='closed'} onClick={send}>{done?t.sent:a.mine?t.resend:t.send}</button>
  </>:<>
   {a.general&&!score&&<p className="muted">{[t.qCount(a.questionCount??0),a.minutes?`${a.minutes} ${t.timeLimit}`:runWords[lang].noLimit,a.deadlineAt?fmtDue(a.deadlineAt,lang):''].filter(Boolean).join(' · ')}</p>}
   {score&&<p className="cr-score">{t.result}: {score[0]} / {score[1]}</p>}
   {score&&(review?(items?<TestReview lang={lang} items={items} review={review}/>:null):a.general&&<p className="muted">{revealNote(a as TestMeta,lang)}</p>)}
   {(a.status==='closed'||a.ended&&a.mine?.answer!=='started')&&!score&&<p className="muted">{a.status==='open'?testError(lang,'past_due'):t.errClosed}</p>}
   {!score&&<button className="button" disabled={!canRun||a.status==='closed'||!!a.ended&&a.mine?.answer!=='started'} onClick={()=>{setErr('');setRun(true)}}>{a.mine?.answer==='started'?testWords[lang].resume:t.start}</button>}
   {err&&<p className="cr-error" role="alert">{err}</p>}
   {run&&<TestRun lang={lang} a={a as TestMeta} userId={user.id} onExit={()=>{setRun(false);onChanged()}} onError={e=>{setRun(false);setErr(testError(lang,e));onChanged()}} onSubmitted={(s,n)=>{setScore([s,n]);setDone(true)}}/>}
  </>}
 </>;
}
