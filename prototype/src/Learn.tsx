import {useEffect,useState} from 'react';
import {ChevronRight,ClipboardCheck,Layers} from 'lucide-react';
import DeckLibrary,{loadProgress,saveProgress,type Progress} from './DeckLibrary';
import Daily from './Daily';
import QuizRun from './QuizRun';
import type {Lang} from './discoveryData';

type Deck={id:string;title:string;subtitle:string;slides:number;quiz:{q:string;options:string[];correct:number;explanation:string}[]};
const words={
 uz:{title:'O‘rganish',tabs:{lessons:'Darslar',tests:'Testlar',daily:'Kunlik'},atlas:'3D atlas',atlasSub:'Tish qatlamlarini ajratib ko‘ring',testsHint:'Har bir mavzu bo‘yicha qisqa test. Javoblar darhol tushuntiriladi, natija saqlanadi.',best:'Eng yaxshi',notTaken:'Hali topshirilmagan',note:'Dars va test matni hozircha o‘zbek tilida.',q:'savol'},
 ru:{title:'Обучение',tabs:{lessons:'Уроки',tests:'Тесты',daily:'Ежедневно'},atlas:'3D-атлас',atlasSub:'Разделите слои зуба и исследуйте',testsHint:'Короткий тест по каждой теме. Ответы объясняются сразу, результат сохраняется.',best:'Лучший',notTaken:'Ещё не пройден',note:'Тексты уроков и тестов пока на узбекском.',q:'вопросов'},
 en:{title:'Learn',tabs:{lessons:'Lessons',tests:'Quizzes',daily:'Daily'},atlas:'3D atlas',atlasSub:'Explode the tooth layers and explore',testsHint:'A short quiz for every topic. Answers are explained right away and your score is saved.',best:'Best',notTaken:'Not taken yet',note:'Lesson and quiz text is currently in Uzbek.',q:'questions'}
};

/** Real learning hub: slide lessons, topic quizzes with saved scores, and the daily practice. Replaces the old placeholder course screen. */
export default function Learn({lang,uid,initialTab,onOpenAtlas}:{lang:Lang;uid?:string|null;initialTab?:'lessons'|'tests'|'daily';onOpenAtlas:()=>void}){
 const t=words[lang];
 const [tab,setTab]=useState<'lessons'|'tests'|'daily'>(initialTab||'lessons');
 const [decks,setDecks]=useState<Deck[]|null>(null);
 const [progress,setProgress]=useState<Progress>(()=>loadProgress(uid));
 const [run,setRun]=useState<Deck|null>(null);
 useEffect(()=>{fetch('/decks/manifest.json').then(r=>r.ok?r.json():[]).then(setDecks).catch(()=>setDecks([]))},[]);
 useEffect(()=>setProgress(loadProgress(uid)),[uid,tab]);
 return <section className="learn">
  <h2 className="large-heading">{t.title}</h2>
  <button className="atlas3d-launch" onClick={onOpenAtlas}><span className="atlas3d-launch-glow"/><span className="atlas3d-launch-text"><b>{t.atlas}</b><span>{t.atlasSub}</span></span><Layers size={18}/></button>
  <div className="chips">{(['lessons','tests','daily'] as const).map(k=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{t.tabs[k]}</button>)}</div>
  {tab==='lessons'&&<DeckLibrary lang={lang} uid={uid}/>}
  {tab==='tests'&&<>
   <p className="muted">{t.testsHint}</p>
   <div className="cr-list">{(decks||[]).map(d=>{const p=progress[d.id];return <button key={d.id} className="cr-row" onClick={()=>setRun(d)}><ClipboardCheck size={18}/><span><strong>{d.title}</strong><small>{d.quiz.length} {t.q} · {p?.best!==undefined?`${t.best}: ${p.best}/${p.total}`:t.notTaken}</small></span><ChevronRight size={16}/></button>})}</div>
   <small className="muted">{t.note}</small>
  </>}
  {tab==='daily'&&<Daily lang={lang}/>}
  {run&&<QuizRun title={run.title} lang={lang} questions={run.quiz} onDone={(s,n)=>setProgress(saveProgress(uid,run.id,{score:s,total:n}))} onClose={()=>setRun(null)}/>}
 </section>;
}
