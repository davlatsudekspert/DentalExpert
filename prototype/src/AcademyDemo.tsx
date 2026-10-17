import {useState} from 'react';
import {ArrowRight,BookOpen,Check,Download,Layers,RotateCw} from 'lucide-react';
import cutaway from '../assets/tooth3d/premium-reference-cutaway-ivory.webp';
import slides from '../assets/academy/tooth-layers-demo-uz.pptx';
import type {Lang} from './discoveryData';

const copy={
 uz:{lesson:'Tish qatlamlari',case:'Rasmli amaliy holat',demo:'O‘quv oqimi namunasi',lead:'Tasvirga qarab emal, dentin, pulpa va ildizni ajrating.',image:'Loyiha egasi taqdim etgan kesim tasviri',source:'Manba holati: tashqi darslikning nashri va aniq beti hali tasdiqlanmagan. Bu vizual demo, klinik ta’lim materiali emas.',presentation:'O‘zbekcha taqdimotni yuklash (PPTX)',quiz:'Qisqa test',quizHint:'Javoblar shu tasvirdagi yorliqlar asosida. Har bir savoldan so‘ng izoh chiqadi.',correct:'To‘g‘ri',wrong:'Boshqa javobni qayta ko‘rib chiqing',result:'To‘g‘ri javoblar',next:'Amaliy holatga o‘tish',caseLead:'Tish kesimiga qarab to‘rtta qismni o‘z so‘zingiz bilan izohlang. Bu haqiqiy bemor holati emas.',answer:'Kuzatuvingiz va sababingiz',submit:'Demo ishni yuborish',short:'Kamida 20 ta belgi bilan izoh yozing.',feedback:'Namuna ustoz izohi',feedbackText:'Qatlam nomlarini sanab o‘tdingiz. Endi har birini rasmning qaysi joyida ko‘rganingizni aniqroq yozing.',revise:'Qayta ishlash',portfolio:'Ko‘nikma portfeli · demo',portfolioText:'Bu topshiriq faqat joriy brauzer sessiyasida ko‘rinadi; ustozga yuborilmaydi.',enamel:'Emal',dentin:'Dentin',pulp:'Pulpa',root:'Ildiz'},
 ru:{lesson:'Слои зуба',case:'Визуальное практическое задание',demo:'Пример учебного процесса',lead:'Найдите эмаль, дентин, пульпу и корень на изображении.',image:'Изображение среза предоставлено владельцем проекта',source:'Статус источников: издание и точная страница учебника ещё не подтверждены. Это визуальное демо, не проверенный клинический материал.',presentation:'Скачать презентацию на узбекском (PPTX)',quiz:'Короткий тест',quizHint:'Ответы основаны на подписях к изображению. После ответа появится пояснение.',correct:'Верно',wrong:'Пересмотрите другой вариант',result:'Верных ответов',next:'К практическому заданию',caseLead:'Опишите своими словами четыре части на срезе. Это не реальный случай пациента.',answer:'Ваше наблюдение и обоснование',submit:'Отправить демо-работу',short:'Напишите не менее 20 символов.',feedback:'Пример комментария преподавателя',feedbackText:'Вы назвали слои. Уточните, в какой части изображения виден каждый из них.',revise:'Доработать',portfolio:'Портфолио навыков · демо',portfolioText:'Работа видна только в текущей сессии браузера и не отправляется преподавателю.',enamel:'Эмаль',dentin:'Дентин',pulp:'Пульпа',root:'Корень'},
 en:{lesson:'Tooth layers',case:'Visual practice case',demo:'Learning-flow sample',lead:'Locate enamel, dentin, pulp and root in the illustration.',image:'Cutaway illustration supplied by the project owner',source:'Source status: the external textbook edition and exact page have not been verified. This is a visual demo, not validated clinical teaching material.',presentation:'Download Uzbek presentation (PPTX)',quiz:'Short quiz',quizHint:'Answers follow labels in this illustration. An explanation appears after each answer.',correct:'Correct',wrong:'Review another option',result:'Correct answers',next:'Open practice case',caseLead:'Describe the four illustrated parts in your own words. This is not a real patient case.',answer:'Your observation and reasoning',submit:'Submit demo work',short:'Write at least 20 characters.',feedback:'Sample educator feedback',feedbackText:'You named the layers. Now explain where each one appears in the illustration.',revise:'Revise work',portfolio:'Skills portfolio · demo',portfolioText:'This work stays in the current browser session and is not sent to an educator.',enamel:'Enamel',dentin:'Dentin',pulp:'Pulp',root:'Root'}
};

const questions={
 uz:[['Rasmdagi tashqi oq toj qatlami qaysi?','Emal','Pulpa','Ildiz'],['Rasmdagi markaziy pushti qism qaysi?','Pulpa','Emal','Ildiz'],['Rasmdagi pastga davom etgan qismlar qaysi?','Ildiz','Pulpa','Emal']],
 ru:[['Как называется наружный белый слой коронки?','Эмаль','Пульпа','Корень'],['Как называется розовая центральная часть?','Пульпа','Эмаль','Корень'],['Как называются части, продолжающиеся вниз?','Корень','Пульпа','Эмаль']],
 en:[['What is the outer white crown layer in this image?','Enamel','Pulp','Root'],['What is the pink central part in this image?','Pulp','Enamel','Root'],['What are the parts extending downward in this image?','Roots','Pulp','Enamel']]
};

export default function AcademyDemo({screen,lang,onNavigate}:{screen:'lessonPage'|'caseStudy';lang:Lang;onNavigate:(screen:string)=>void}){
 const t=copy[lang];
 const [answers,setAnswers]=useState<(number|null)[]>([null,null,null]);
 const [response,setResponse]=useState('');
 const [submitted,setSubmitted]=useState(false);
 const [feedback,setFeedback]=useState('');
 const score=answers.filter(x=>x===0).length;
 if(screen==='caseStudy')return <div className="academy-page">
  <span className="eyebrow">CASE STUDIO · DEMO</span><h2>{t.case}</h2><p>{t.caseLead}</p>
  <div className="academy-visual compact"><img src={cutaway} alt={t.image}/></div>
  <p className="academy-source">{t.source}</p>
  <label>{t.answer}<textarea value={response} onChange={e=>setResponse(e.target.value)} placeholder={t.caseLead}/></label>
  <button className="button" onClick={()=>{if(response.trim().length<20){setFeedback(t.short);return}setSubmitted(true);setFeedback('')}}>{t.submit}<ArrowRight size={17}/></button>
  {feedback&&<p className="extra-feedback" role="status">{feedback}</p>}
  {submitted&&<div className="academy-feedback card"><span className="eyebrow"><Check size={13}/> {t.feedback}</span><p>{t.feedbackText}</p><button onClick={()=>{setSubmitted(false);setFeedback('')}}><RotateCw size={15}/>{t.revise}</button></div>}
  <div className="academy-portfolio card"><BookOpen size={21}/><div><strong>{t.portfolio}</strong><p>{t.portfolioText}</p></div></div>
 </div>;
 return <div className="academy-page">
  <span className="eyebrow">DENTAL ACADEMY / 01</span><h2>{t.lesson}</h2><p>{t.lead}</p>
  <div className="academy-visual"><img src={cutaway} alt={t.image}/></div>
  <div className="academy-layer-grid">{(['enamel','dentin','pulp','root'] as const).map((key,index)=><div key={key}><span className={'academy-dot layer-'+index}/><strong>{t[key]}</strong></div>)}</div>
  <p className="academy-source">{t.source}</p>
  <a className="academy-download" href={slides} download="DentalExpert_Tish_Qatlamlari_Demo_UZ.pptx"><Download size={17}/>{t.presentation}</a>
  <div className="academy-quiz-heading"><Layers size={22}/><div><h3>{t.quiz}</h3><p>{t.quizHint}</p></div></div>
  {questions[lang].map((question,index)=><div className="academy-question card" key={index}><strong>{String(index+1).padStart(2,'0')} · {question[0]}</strong><div>{question.slice(1).map((option,choice)=><button key={option} className={answers[index]===choice?'chosen':''} aria-pressed={answers[index]===choice} onClick={()=>setAnswers(prev=>prev.map((x,i)=>i===index?choice:x))}>{option}</button>)}</div>{answers[index]!==null&&<p className={answers[index]===0?'right':'try-again'}>{answers[index]===0?t.correct:t.wrong} · {t.image}</p>}</div>)}
  {answers.every(x=>x!==null)&&<p className="academy-score" role="status">{t.result}: {score} / 3</p>}
  <button className="button" onClick={()=>onNavigate('caseStudy')}>{t.next}<ArrowRight size={17}/></button>
 </div>;
}
