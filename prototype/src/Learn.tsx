import {Suspense,lazy,useEffect,useState} from 'react';
import DeckLibrary from './DeckLibrary';
import Daily from './Daily';
import Curriculum from './Curriculum';
const Practice=lazy(()=>import('./Practice'));
const Review=lazy(()=>import('./Review'));
const Exam=lazy(()=>import('./Exam'));
const Tools=lazy(()=>import('./Tools'));
import type {Lang} from './discoveryData';
import {proAllowed,showPaywall,usePro} from './billing';
import {Lock} from 'lucide-react';

export type Tab='plan'|'practice'|'review'|'exam'|'tools'|'lessons'|'tests'|'daily';
// Each role sees only what it needs; deck quizzes live inside their lessons (Darslar), so there is no separate tests tab.
type Role='patient'|'dentist'|'teacher'|'student';
const TABS:Record<Role,Tab[]>={patient:['lessons','daily'],student:['plan','lessons','practice','review','exam','daily'],teacher:['plan','lessons','practice','review','tools'],dentist:['plan','lessons','practice','review','tools','daily']};
const words={
 uz:{title:'O‘rganish',tabs:{plan:'O‘quv reja',practice:'Rasmli amaliyot',review:'Takrorlash',exam:'Imtihon',tools:'Vositalar',lessons:'Darslar',tests:'Testlar',daily:'Kunlik mashq'},atlas:'3D atlas',atlasSub:'Tish qatlamlarini ajratib ko‘ring',testsHint:'Har bir mavzu bo‘yicha qisqa test. Javoblar darhol tushuntiriladi, natija saqlanadi.',best:'Eng yaxshi',notTaken:'Hali topshirilmagan',note:'',q:'savol'},
 ru:{title:'Обучение',tabs:{plan:'Учебный план',practice:'По картинкам',review:'Повторение',exam:'Экзамен',tools:'Инструменты',lessons:'Уроки',tests:'Тесты',daily:'Задания дня'},atlas:'3D-атлас',atlasSub:'Разделите слои зуба и исследуйте',testsHint:'Короткий тест по каждой теме. Ответы объясняются сразу, результат сохраняется.',best:'Лучший',notTaken:'Ещё не пройден',note:'',q:'вопросов'},
 en:{title:'Learn',tabs:{plan:'Curriculum',practice:'Picture practice',review:'Review',exam:'Exam',tools:'Tools',lessons:'Lessons',tests:'Quizzes',daily:'Daily practice'},atlas:'3D atlas',atlasSub:'Explode the tooth layers and explore',testsHint:'A short quiz for every topic. Answers are explained right away and your score is saved.',best:'Best',notTaken:'Not taken yet',note:'',q:'questions'}
};

const lockText={uz:['Bu bo‘lim Pro tarkibida.','Pro haqida'],ru:['Этот раздел входит в Pro.','О Pro'],en:['This section is part of Pro.','About Pro']};
/** Free tier: Review and Exam are Pro. A calm card, not a wall: the rest of Learn stays open. */
function ProLock({lang,feature}:{lang:Lang;feature:'review'|'exam'}){
 const x=lockText[lang];
 return <div className="pw-nudge" role="status"><Lock size={16}/><b className="pw-badge">Pro</b><span>{x[0]}</span><button onClick={()=>showPaywall(feature)}>{x[1]}</button></div>;
}
/** Real learning hub: slide lessons, topic quizzes with saved scores, and the daily practice. Replaces the old placeholder course screen. */
export default function Learn({lang,uid,role='student',initialTab}:{lang:Lang;uid?:string|null;role?:Role;initialTab?:Tab}){
 const t=words[lang];usePro();
 const tabs=TABS[role]||TABS.student;
 const pick=(x?:Tab)=>x==='tests'?'lessons':x&&tabs.includes(x)?x:tabs[0];
 const [tab,setTab]=useState<Tab>(()=>pick(initialTab));
 useEffect(()=>setTab(pick(initialTab)),[initialTab,role]);// eslint-disable-line react-hooks/exhaustive-deps
 return <section className="learn">
  <div className="chips learn-tabs">{tabs.map(k=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{t.tabs[k]}</button>)}</div>
  {tab==='plan'&&<Curriculum lang={lang} teacher={role==='teacher'||role==='dentist'}/>}
  <Suspense fallback={<p className="muted">…</p>}>{tab==='practice'&&<Practice lang={lang}/>}{tab==='review'&&(proAllowed('review')?<Review lang={lang}/>:<ProLock lang={lang} feature="review"/>)}{tab==='exam'&&(proAllowed('exam')?<Exam lang={lang}/>:<ProLock lang={lang} feature="exam"/>)}{tab==='tools'&&<Tools lang={lang}/>}</Suspense>
  {tab==='lessons'&&<DeckLibrary lang={lang} uid={uid}/>}
  {tab==='daily'&&<Daily lang={lang}/>}
 </section>;
}
