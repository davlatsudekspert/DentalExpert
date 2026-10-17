import {useMemo,useState} from 'react';
import {Flame,ImageIcon,ListChecks,Check} from 'lucide-react';
import QuizRun,{type RunQ} from './QuizRun';
import {dailyPictures,dailyTest,localDay} from './dailyData';
import type {Lang} from './discoveryData';
import {ruForm} from './i18n';

type Day={test?:[number,number];pic?:[number,number]};
const KEY='de_daily';
const read=():Record<string,Day>=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=(v:Record<string,Day>)=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{/* storage unavailable */}};

const words={
 uz:{title:'Bugungi mashqlar',test:'Kunlik test',testSub:'5 ta savol · har kuni yangi',pic:'Rasmli topshiriq',picSub:'Qatlamni rasmdan aniqlang · 3 ta rasm',done:'Bajarildi',start:'Boshlash',again:'Qayta',streak:'kun ketma-ket',streakNone:'Bugun birinchi kuningizni boshlang',which:'Rasmda qaysi qatlam ko‘rsatilgan?',note:'O‘quv mashqi; mutaxassis tasdig‘idan o‘tmagan. Natijalar shu qurilmada saqlanadi.'},
 ru:{title:'Задания на сегодня',test:'Тест дня',testSub:'5 вопросов · каждый день новые',pic:'Задание по картинке',picSub:'Определите слой по изображению · 3 изображения',done:'Выполнено',start:'Начать',again:'Ещё раз',streak:'',streakNone:'Начните серию сегодня',which:'Какой слой показан на изображении?',note:'Учебное упражнение; не проверено специалистом. Результаты хранятся на этом устройстве.'},
 en:{title:'Today’s practice',test:'Daily quiz',testSub:'5 questions · new every day',pic:'Picture task',picSub:'Identify the layer from the image · 3 images',done:'Done',start:'Start',again:'Again',streak:'',streakNone:'Start your streak today',which:'Which layer is shown in the image?',note:'Learning exercise; not reviewed by a specialist. Results are stored on this device.'}
};

function streakOf(days:Record<string,Day>,today:string){
 const d=new Date(today+'T12:00:00');
 if(!days[localDay(d)])d.setDate(d.getDate()-1);
 let n=0;
 while(days[localDay(d)]&&(days[localDay(d)].test||days[localDay(d)].pic)){n++;d.setDate(d.getDate()-1)}
 return n;
}

const plateUrl=(p:string)=>`/atlas3d/${p}.webp`;
const PlateMedia=({plates}:{plates:string[]})=><div className="daily-plate" role="img" aria-label={({uz:'Tish qatlami rasmi',ru:'Изображение слоя зуба',en:'Image of a tooth layer'} as Record<string,string>)[document.documentElement.lang]||'Image'}>{plates.map(p=><img key={p} src={plateUrl(p)} alt="" draggable={false}/>)}</div>;

export default function Daily({lang}:{lang:Lang}){
 const t=words[lang];
 const today=useMemo(()=>localDay(),[]);
 const [days,setDays]=useState(read);
 const [open,setOpen]=useState<'test'|'pic'|null>(null);
 const rec=days[today]||{};
 const streak=streakOf(days,today);
 const save=(kind:'test'|'pic',s:number,n:number)=>{setDays(prev=>{const next={...prev,[today]:{...prev[today],[kind]:[s,n] as [number,number]}};write(next);return next})};
 const testQs:RunQ[]=useMemo(()=>dailyTest(lang,today),[lang,today]);
 const picQs:RunQ[]=useMemo(()=>dailyPictures(lang,today).map(p=>({q:t.which,options:p.options,correct:p.correct,explanation:p.explanation,media:<PlateMedia plates={p.plates}/>})),[lang,today,t.which]);
 const card=(kind:'test'|'pic',Icon:typeof ListChecks,title:string,sub:string)=>{
  const r=rec[kind];
  return <button className={'daily-card'+(r?' done':'')} onClick={()=>setOpen(kind)}>
   <span className="daily-icon"><Icon size={20}/></span>
   <span className="daily-text"><strong>{title}</strong><small>{r?`${t.done} · ${r[0]} / ${r[1]}`:sub}</small></span>
   <span className="daily-go">{r?<Check size={16}/>:t.start}</span>
  </button>;
 };
 return <section className="daily card" aria-label={t.title}>
  <div className="daily-head"><h2>{t.title}</h2><span className={'daily-streak'+(streak?' on':'')}><Flame size={15}/>{streak?(lang==='ru'?`${streak} ${ruForm(streak,'день','дня','дней')} подряд`:lang==='en'?`${streak}-day streak`:`${streak} ${t.streak}`):t.streakNone}</span></div>
  {card('test',ListChecks,t.test,t.testSub)}
  {card('pic',ImageIcon,t.pic,t.picSub)}
  <small className="muted">{t.note}</small>
  {open==='test'&&<QuizRun title={t.test} questions={testQs} lang={lang} onDone={(s,n)=>save('test',s,n)} onClose={()=>setOpen(null)}/>}
  {open==='pic'&&<QuizRun title={t.pic} questions={picQs} lang={lang} onDone={(s,n)=>save('pic',s,n)} onClose={()=>setOpen(null)}/>}
 </section>;
}
