import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,Search,Timer} from 'lucide-react';
import {callApi} from './api';
import {GENERAL_MAX,VARIANT_POOL_MAX,maxVariantCount,variantAllowed} from './classroomShared';
import {SUBJECTS,topicMeta,topicsOf,tx,type Topic} from './curriculumData';
import {deckSource} from './questionIndex';
import type {Reveal} from './classTest';
import type {Lang} from './discoveryData';

/** Assigning a test: the topic test settings and the separate "general test" page, with the shared sections for the
 * number of questions, the student's time limit, how long the test stays open, variants and when answers show. */
export type TopicRow={topicId:string;openedAt:string;closedAt:string|null};
export type Options={minutes:number|null;deadline?:string;reveal:Reveal};
export type TestPayload=Options&{questions?:number[];variant?:{count:number;extra:boolean}};

const w={
 uz:{count:'Savollar soni',all:(n:number)=>`Barcha ${n} ta`,custom:'Boshqa',customPh:'son',countHint:(max:number)=>`1 dan ${max} tagacha istalgan son.`,
  time:'Vaqt chegarasi',noTime:'Vaqtsiz',min:'daq.',timeHint:'Har bir talabaga test boshlagan paytidan beriladi; vaqt tugasa, javoblari o‘zi topshiriladi.',timeCustom:'1–180',
  open:'Test qancha vaqt ochiq turadi',day:(n:number)=>`${n} kun`,date:'Sana tanlash',openHint:'Shu vaqtgacha talabalar testni boshlay oladi, keyin test yopiladi. Bu talabaning yechish vaqti emas.',badDate:'Sana kelajakda bo‘lsin (bir yil ichida).',
  reveal:'To‘g‘ri javoblar',rClosed:'Ustoz yakunlaganda',rDeadline:'Muddat tugagach',rInstant:'Darhol',
  hClosed:'Talabalar to‘g‘ri javoblarni siz testni yakunlaganingizdan 2 daqiqa o‘tib ko‘radi.',hDeadline:'Muddat tugagach (test yopilganda) yoki siz testni yakunlaganingizda — qaysi biri oldin bo‘lsa — 2 daqiqa o‘tib ochiladi.',hInstant:'Diqqat: birinchi topshirgan talaba to‘g‘ri javoblarni ko‘radi va hali yechayotganlarga aytib qo‘yishi mumkin.',
  variant:'Har bir talabaga boshqa savollar',variantOn:(pool:number,n:number)=>`Har bir talaba ${pool} ta savollik hovuzdan o‘ziga xos ${n} ta savol oladi.`,
  variantNo:(need:number,pool:number,max:number)=>`Variantlar uchun hovuzda kamida ${need} ta savol kerak (savollar sonining 2 barobari), hozir ${pool} ta. Savollar sonini ${max} tagacha kamaytiring yoki mavzu qo‘shing.`,
  extra:(k:number,q:number)=>`O‘tilgan mavzular savollarini ham qo‘shish (${k} ta mavzu, +${q} savol)`,extraHint:'Har bir talabaning savollarining yarmi shu mavzudan, qolgani shu guruhda ochilgan boshqa mavzulardan.',
  picked:(n:number)=>`${n} ta savol tanlandi`,cancel:'Bekor qilish',start:'Testni boshlash',assign:'Guruhga topshirish',
  gTitle:'Umumiy test',gLead:'Bir nechta mavzu va taqdimot testlaridan savollar. Savollar tanlangan mavzulardan teng taqsimlanadi, takrorlanmaydi.',name:'Test nomi',search:'Mavzu qidirish',selectAll:'Hammasini tanlash',clearAll:'Tanlovni bekor qilish',decks:'Taqdimot testlari',
  chosen:(t:number,q:number)=>`${t} ta mavzu · ${q} ta savol tanlandi`,none:'Avval mavzu tanlang.',autoTitle:'Umumiy test',noMatch:'Hech narsa topilmadi.',
  err:{variant_pool_small:'Savollar hovuzi kichik — savollar sonini kamaytiring.',bad_deadline:'Sana kelajakda bo‘lsin (bir yil ichida).',reveal_needs_deadline:'«Muddat tugagach» uchun test yopiladigan vaqt kerak.',bad_minutes:'Vaqt 1–180 daqiqa bo‘lsin.',bad_questions:'Savollar sonini tekshiring.',bad_count:'Savollar sonini tekshiring (ko‘pi bilan 50 ta).',test_exists:'Bu mavzuda test allaqachon boshlangan.',title_required:'Test nomini yozing.',bad_sources:'Mavzu tanlang.',pool_too_big:'Juda ko‘p mavzu tanlandi.',too_many:'Guruhda topshiriqlar juda ko‘p.',other:'Bajarilmadi. Qayta urinib ko‘ring.'}},
 ru:{count:'Количество вопросов',all:(n:number)=>`Все ${n}`,custom:'Другое',customPh:'число',countHint:(max:number)=>`Любое число от 1 до ${max}.`,
  time:'Ограничение времени',noTime:'Без времени',min:'мин',timeHint:'Отсчитывается для каждого студента с момента начала; когда время выйдет, ответы сдаются сами.',timeCustom:'1–180',
  open:'Сколько тест будет открыт',day:(n:number)=>`${n} ${n===1?'день':n<5?'дня':'дней'}`,date:'Выбрать дату',openHint:'До этого времени студенты могут начать тест, потом он закрывается. Это не время на решение.',badDate:'Дата должна быть в будущем (в пределах года).',
  reveal:'Верные ответы',rClosed:'После завершения',rDeadline:'После срока',rInstant:'Сразу',
  hClosed:'Студенты увидят верные ответы через 2 минуты после того, как вы завершите тест.',hDeadline:'Откроются после срока (когда тест закроется) или когда вы его завершите — что раньше — через 2 минуты.',hInstant:'Внимание: первый сдавший увидит верные ответы и может подсказать тем, кто ещё решает.',
  variant:'Каждому студенту свои вопросы',variantOn:(pool:number,n:number)=>`Каждый студент получает свои ${n} вопросов из банка в ${pool}.`,
  variantNo:(need:number,pool:number,max:number)=>`Для вариантов в банке нужно не меньше ${need} вопросов (вдвое больше, чем в тесте), сейчас ${pool}. Уменьшите число вопросов до ${max} или добавьте темы.`,
  extra:(k:number,q:number)=>`Добавить вопросы пройденных тем (${k} тем, +${q} вопросов)`,extraHint:'Половина вопросов каждого студента — из этой темы, остальные — из других тем, открытых в группе.',
  picked:(n:number)=>`Выбрано вопросов: ${n}`,cancel:'Отмена',start:'Начать тест',assign:'Дать группе',
  gTitle:'Общий тест',gLead:'Вопросы из нескольких тем и тестов презентаций. Вопросы распределяются по выбранным темам поровну, без повторов.',name:'Название теста',search:'Поиск темы',selectAll:'Выбрать все',clearAll:'Снять выбор',decks:'Тесты презентаций',
  chosen:(t:number,q:number)=>`Выбрано: ${t} тем · ${q} вопросов`,none:'Сначала выберите темы.',autoTitle:'Общий тест',noMatch:'Ничего не найдено.',
  err:{variant_pool_small:'Банк вопросов мал — уменьшите число вопросов.',bad_deadline:'Дата должна быть в будущем (в пределах года).',reveal_needs_deadline:'Для «после срока» нужно время закрытия теста.',bad_minutes:'Время — от 1 до 180 минут.',bad_questions:'Проверьте число вопросов.',bad_count:'Проверьте число вопросов (не больше 50).',test_exists:'Тест по этой теме уже начат.',title_required:'Введите название теста.',bad_sources:'Выберите темы.',pool_too_big:'Выбрано слишком много тем.',too_many:'В группе слишком много заданий.',other:'Не получилось. Попробуйте ещё раз.'}},
 en:{count:'Number of questions',all:(n:number)=>`All ${n}`,custom:'Other',customPh:'number',countHint:(max:number)=>`Any number from 1 to ${max}.`,
  time:'Time limit',noTime:'No limit',min:'min',timeHint:'Counted for each student from the moment they start; when it runs out, their answers are submitted automatically.',timeCustom:'1–180',
  open:'How long the test stays open',day:(n:number)=>`${n} day${n===1?'':'s'}`,date:'Pick a date',openHint:'Until then students can start the test; afterwards it closes. This is not the time to answer.',badDate:'The date must be in the future (within a year).',
  reveal:'Right answers',rClosed:'When I finish it',rDeadline:'After the deadline',rInstant:'Right away',
  hClosed:'Students see the right answers 2 minutes after you finish the test.',hDeadline:'They open after the deadline (when the test closes) or when you finish it, whichever comes first, plus 2 minutes.',hInstant:'Note: the first student to submit sees the right answers and could pass them on.',
  variant:'Different questions for each student',variantOn:(pool:number,n:number)=>`Each student gets their own ${n} questions from a pool of ${pool}.`,
  variantNo:(need:number,pool:number,max:number)=>`Variants need a pool of at least ${need} questions (twice the test length); it has ${pool}. Lower the number to ${max} or add topics.`,
  extra:(k:number,q:number)=>`Add questions from topics already covered (${k} topics, +${q} questions)`,extraHint:'Half of each student’s questions come from this topic, the rest from the other topics opened in this group.',
  picked:(n:number)=>`${n} questions chosen`,cancel:'Cancel',start:'Start the test',assign:'Assign to the group',
  gTitle:'General test',gLead:'Questions from several topics and presentation quizzes, spread evenly over the chosen topics, with no repeats.',name:'Test name',search:'Search topics',selectAll:'Select all',clearAll:'Clear',decks:'Presentation quizzes',
  chosen:(t:number,q:number)=>`${t} topics · ${q} questions chosen`,none:'Choose topics first.',autoTitle:'General test',noMatch:'Nothing found.',
  err:{variant_pool_small:'The pool is too small — lower the number of questions.',bad_deadline:'The date must be in the future (within a year).',reveal_needs_deadline:'“After the deadline” needs a closing time.',bad_minutes:'Time must be 1–180 minutes.',bad_questions:'Check the number of questions.',bad_count:'Check the number of questions (at most 50).',test_exists:'A test for this topic has already started.',title_required:'Type a test name.',bad_sources:'Choose topics.',pool_too_big:'Too many topics chosen.',too_many:'The group has too many assignments.',other:'That did not work. Please try again.'}}
};
type W=typeof w.uz;
export const setupError=(lang:Lang,e:string)=>{const x=w[lang].err;return e in x?x[e as keyof typeof x]:x.other};
const pad=(n:number)=>String(n).padStart(2,'0');
const localInput=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const clampInt=(v:string,lo:number,hi:number)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):lo};

/** Preset chips plus a custom number. */
function Pick<T extends string|number>({label,hint,options,value,onChange,custom}:{label:string;hint?:string;options:{v:T;label:string}[];value:T;onChange:(v:T)=>void;
 custom?:{min:number;max:number;placeholder:string;label:string;value:number|null;onChange:(n:number)=>void;active:boolean}}){
 const id=useMemo(()=>'pk'+Math.random().toString(36).slice(2,8),[]);
 return <fieldset className="lg-pick" aria-describedby={hint?id:undefined}><legend>{label}</legend>
  <div className="lg-chips" role="group">{options.map(o=><button type="button" key={String(o.v)} aria-pressed={!custom?.active&&value===o.v} className={!custom?.active&&value===o.v?'on':''} onClick={()=>onChange(o.v)}>{o.label}</button>)}
   {custom&&<label className={'lg-custom'+(custom.active?' on':'')}><span>{custom.label}</span><input type="number" inputMode="numeric" min={custom.min} max={custom.max} placeholder={custom.placeholder} value={custom.active&&custom.value!==null?custom.value:''}
    onChange={e=>{if(e.target.value!=='')custom.onChange(clampInt(e.target.value,custom.min,custom.max))}}/></label>}</div>
  {hint&&<small id={id} className="cr-help">{hint}</small>}</fieldset>;
}

/** Number of questions: presets up to `max`, "All N" when the whole pool fits, and any number 1…max. */
export function CountPick({lang,presets,pool,max,value,onChange}:{lang:Lang;presets:number[];pool:number;max:number;value:number;onChange:(n:number)=>void}){
 const t=w[lang];
 const opts=presets.filter(n=>n<=max&&n<pool).map(n=>({v:n,label:String(n)}));
 if(pool<=max)opts.push({v:pool,label:t.all(pool)});
 const isPreset=opts.some(o=>o.v===value);
 return <Pick label={t.count} hint={t.countHint(max)} options={opts} value={value} onChange={onChange}
  custom={{min:1,max,placeholder:t.customPh,label:t.custom,value,onChange,active:!isPreset}}/>;
}

/** Time limit, how long the test stays open, when the right answers show — each with a one-line explanation. */
export function TestOptions({lang,onChange}:{lang:Lang;onChange:(o:Options,valid:boolean)=>void}){
 const t=w[lang];
 const [minutes,setMinutes]=useState<number|null>(10);
 const [days,setDays]=useState<number|null>(1);
 const [date,setDate]=useState('');
 const [reveal,setReveal]=useState<Reveal>('closed');
 const [opened]=useState(()=>Date.now());
 const due=days?new Date(opened+days*86400_000):date?new Date(date):null;
 const dueBad=!due||!(due.getTime()>Date.now()+60_000&&due.getTime()<Date.now()+365*86400_000);
 const cb=useMemo(()=>({onChange}),[onChange]);
 useEffect(()=>{cb.onChange({minutes,deadline:due&&!dueBad?due.toISOString():undefined,reveal},!dueBad)},[minutes,days,date,reveal,dueBad]);// eslint-disable-line react-hooks/exhaustive-deps
 const presets=[10,15,20,30,45,60];
 return <>
  <Pick<number> label={t.time} hint={t.timeHint} value={minutes??0} onChange={v=>setMinutes(v||null)} options={[...presets.map(m=>({v:m,label:`${m} ${t.min}`})),{v:0,label:t.noTime}]}
   custom={{min:1,max:180,placeholder:t.timeCustom,label:t.custom,value:minutes,onChange:setMinutes,active:minutes!==null&&!presets.includes(minutes)}}/>
  <fieldset className="lg-pick"><legend>{t.open}</legend>
   <div className="lg-chips" role="group">{[1,3,7].map(d=><button type="button" key={d} aria-pressed={days===d} className={days===d?'on':''} onClick={()=>setDays(d)}>{t.day(d)}</button>)}
    <button type="button" aria-pressed={days===null} className={days===null?'on':''} onClick={()=>{setDays(null);if(!date)setDate(localInput(new Date(Date.now()+2*86400_000)))}}>{t.date}</button></div>
   {days===null&&<input className="lg-date" type="datetime-local" value={date} min={localInput(new Date(Date.now()+120_000))} aria-invalid={dueBad||undefined} onChange={e=>setDate(e.target.value)}/>}
   <small className="cr-help">{days===null&&dueBad?t.badDate:t.openHint}</small></fieldset>
  <label className="lg-reveal">{t.reveal}<select value={reveal} onChange={e=>setReveal(e.target.value as Reveal)}><option value="closed">{t.rClosed}</option><option value="deadline">{t.rDeadline}</option><option value="instant">{t.rInstant}</option></select>
   <small className="muted lg-small" role="note">{reveal==='instant'?t.hInstant:reveal==='deadline'?t.hDeadline:t.hClosed}</small></label>
 </>;
}

function VariantBox({t,checked,allowed,pool,count,onChange}:{t:W;checked:boolean;allowed:boolean;pool:number;count:number;onChange:(v:boolean)=>void}){
 return <label className="lg-check"><input type="checkbox" checked={checked} disabled={!checked&&!allowed} onChange={e=>onChange(e.target.checked)}/><span><b>{t.variant}</b>
  <small className="lg-small muted">{checked||allowed?t.variantOn(pool,count):t.variantNo(count*2,pool,maxVariantCount(pool))}</small></span></label>;
}

/** Topic test settings: which / how many questions (custom number bounded by the pool), variants, time, open window, reveal. */
export function TopicTestSetup({lang,topic,topics,keyOf,disabled,error,onStart}:{lang:Lang;topic:Topic;topics:TopicRow[]|null;keyOf:number[]|null;disabled:boolean;error?:string;onStart:(p:TestPayload)=>void}){
 const t=w[lang];
 const total=topic.test.length;
 const [count,setCount]=useState(total);
 const [pick,setPick]=useState<number[]>(()=>topic.test.map((_,k)=>k));
 const [variant,setVariant]=useState(false);
 const [extra,setExtra]=useState(false);
 const [opts,setOpts]=useState<{o:Options;ok:boolean}>({o:{minutes:10,reveal:'closed'},ok:true});
 // Other topics of the same subject this group has opened, newest first — the server builds the pool the same way.
 const prefix=topic.id.slice(0,topic.id.lastIndexOf('-')+1);
 const others=(topics||[]).filter(r=>r.topicId!==topic.id&&r.topicId.startsWith(prefix)&&topicMeta(r.topicId)).sort((a,b)=>b.openedAt.localeCompare(a.openedAt)||a.topicId.localeCompare(b.topicId));
 const extraTopics:string[]=[];let extraQ=0;
 for(const r of others){const n=topicMeta(r.topicId)?.tests||10;if(total+extraQ+n>VARIANT_POOL_MAX)break;extraTopics.push(r.topicId);extraQ+=n}
 const pool=total+(extra?extraQ:0);
 const max=variant?Math.min(GENERAL_MAX,maxVariantCount(pool)):total;
 const allowed=variantAllowed(pool,count);
 const setN=(n:number)=>{const v=Math.max(1,Math.min(max,n));setCount(v);if(!variant)setPick(topic.test.map((_,k)=>k).slice(0,v))};
 const onOpts=useMemo(()=>(o:Options,ok:boolean)=>setOpts({o,ok}),[]);
 return <>
  <div className="cr-form lg-setup">
   <CountPick lang={lang} presets={[5,10,20,30]} pool={variant?Infinity:total} max={max} value={variant?count:pick.length} onChange={setN}/>
   <VariantBox t={t} checked={variant} allowed={allowed} pool={pool} count={count} onChange={v=>{setVariant(v);if(!v){const n=Math.min(count,total);setCount(n);setPick(topic.test.map((_,k)=>k).slice(0,n))}}}/>
   {extraTopics.length>0&&<label className="lg-check"><input type="checkbox" checked={extra} onChange={e=>{setExtra(e.target.checked);if(!e.target.checked&&variant&&count>maxVariantCount(total))setCount(maxVariantCount(total))}}/><span>{t.extra(extraTopics.length,extraQ)}<small className="lg-small muted">{t.extraHint} {extraTopics.map(id=>tx(topicMeta(id)?.title,lang)).join(' · ')}</small></span></label>}
  </div>
  {!variant&&<><p className="lg-small muted">{t.picked(pick.length)}</p><ol className="lg-qpick">{topic.test.map((q,k)=><li key={k}><label className="lg-check"><input type="checkbox" checked={pick.includes(k)} onChange={e=>{const p=e.target.checked?[...pick,k].sort((a,b)=>a-b):pick.filter(x=>x!==k);setPick(p);setCount(Math.max(1,p.length))}}/><b>{tx(q.q,lang)}</b></label>
   <ul>{q.options.map((o,j)=><li key={j} className={keyOf?.[k]===j?'right':''}>{tx(o,lang)}</li>)}</ul></li>)}</ol></>}
  <div className="cr-form lg-setup">
   <TestOptions lang={lang} onChange={onOpts}/>
   {error&&<p className="cr-error" role="alert">{setupError(lang,error)}</p>}
   <button className="button" disabled={disabled||!opts.ok||(variant?!allowed:!pick.length)} onClick={()=>onStart({...opts.o,...(variant?{variant:{count,extra}}:{questions:pick})})}><Timer size={16}/>{t.start} · {variant?count:pick.length}</button>
  </div>
 </>;
}

type DeckInfo={id:string;title:string;quiz:unknown[]};
/** The general test page: topics from every subject and the presentation quizzes, each source with "select all" and a
 * search; questions spread evenly over the chosen topics; the same time / open window / variants / reveal settings. */
export function GeneralSetup({lang,groupId,onDone,onCancel}:{lang:Lang;groupId:string;onDone:(testId:string)=>void;onCancel:()=>void}){
 const t=w[lang];
 const [decks,setDecks]=useState<DeckInfo[]>([]);
 useEffect(()=>{fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then(setDecks).catch(()=>setDecks([]))},[lang]);
 const [sel,setSel]=useState<Set<string>>(new Set());
 const [q,setQ]=useState('');
 const [open,setOpen]=useState<Set<string>>(new Set());
 const [count,setCount]=useState(20);
 const [variant,setVariant]=useState(false);
 const [title,setTitle]=useState('');const [edited,setEdited]=useState(false);
 const [opts,setOpts]=useState<{o:Options;ok:boolean}>({o:{minutes:10,reveal:'closed'},ok:true});
 const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
 const groups=useMemo(()=>[...SUBJECTS.map(s=>({id:s.id,title:tx(s.title,lang),items:topicsOf(s.id).map(m=>({id:m.id,title:`${m.n}. ${tx(m.title,lang)}`,n:m.tests||10}))})),
  {id:'decks',title:t.decks,items:decks.filter(d=>d.quiz?.length).map(d=>({id:deckSource(d.id),title:d.title,n:d.quiz.length}))}].filter(g=>g.items.length),[lang,decks,t.decks]);
 const size=new Map(groups.flatMap(g=>g.items.map(i=>[i.id,i.n] as const)));
 const pool=[...sel].reduce((s,id)=>s+(size.get(id)||0),0);
 const max=Math.max(1,Math.min(GENERAL_MAX,pool));
 const n=Math.min(count,max);
 const allowed=variantAllowed(pool,n);
 const needle=q.trim().toLocaleLowerCase();
 const shown=groups.map(g=>({...g,items:needle?g.items.filter(i=>(i.title+' '+g.title).toLocaleLowerCase().includes(needle)):g.items})).filter(g=>g.items.length);
 const auto=useMemo(()=>{const names=groups.filter(g=>g.items.some(i=>sel.has(i.id))).map(g=>g.title);return names.length?`${t.autoTitle}: ${names.join(' · ')}`.slice(0,100):t.autoTitle},[groups,sel,t.autoTitle]);
 useEffect(()=>{if(!edited)setTitle(auto)},[auto,edited]);
 useEffect(()=>{if(variant&&!allowed)setVariant(false)},[variant,allowed]);
 const toggle=(ids:string[],on:boolean)=>setSel(s=>{const x=new Set(s);ids.forEach(id=>on?x.add(id):x.delete(id));return x});
 const onOpts=useMemo(()=>(o:Options,ok:boolean)=>setOpts({o,ok}),[]);
 const assign=async()=>{setErr('');setBusy(true);
  const r=await callApi<{testId:string}>('/classroom/general','POST',{groupId,title:title.trim(),sources:[...sel],count:n,variant,...opts.o});
  setBusy(false);if(r.ok)onDone(r.data.testId);else setErr(r.status===0?'other':r.data.error||'other')};
 return <div className="lg-general">
  <h2>{t.gTitle}</h2><p className="muted">{t.gLead}</p>
  <label className="lg-search"><Search size={16} aria-hidden/><input type="search" value={q} placeholder={t.search} aria-label={t.search} onChange={e=>setQ(e.target.value)}/></label>
  {!shown.length&&<p className="muted">{t.noMatch}</p>}
  <div className="lg-sources">{shown.map(g=>{const ids=g.items.map(i=>i.id);const on=ids.filter(id=>sel.has(id)).length;const expanded=!!needle||open.has(g.id);
   return <div key={g.id} className={'lg-source'+(expanded?' open':'')}>
    <div className="lg-source-head"><button type="button" className="lg-source-title" aria-expanded={expanded} onClick={()=>setOpen(o=>{const x=new Set(o);if(x.has(g.id))x.delete(g.id);else x.add(g.id);return x})}><ChevronDown size={16} aria-hidden/><b>{g.title}</b>{on>0&&<span className="lg-tag brand">{on}/{g.items.length}</span>}</button>
     <button type="button" className="lg-link" onClick={()=>toggle(ids,on<ids.length)}>{on<ids.length?t.selectAll:t.clearAll}</button></div>
    {expanded&&<div className="lg-source-list">{g.items.map(i=><label key={i.id} className="lg-check"><input type="checkbox" checked={sel.has(i.id)} onChange={e=>toggle([i.id],e.target.checked)}/><span>{i.title} <small className="muted">· {i.n}</small></span></label>)}</div>}
   </div>})}</div>
  <p className="lg-chosen" role="status">{sel.size?t.chosen(sel.size,pool):t.none}</p>
  {sel.size>0&&<div className="cr-form lg-setup">
   <CountPick lang={lang} presets={[10,20,30,50]} pool={pool} max={max} value={n} onChange={setCount}/>
   <VariantBox t={t} checked={variant} allowed={allowed} pool={pool} count={n} onChange={setVariant}/>
   <TestOptions lang={lang} onChange={onOpts}/>
   <label>{t.name}<input value={title} maxLength={100} onChange={e=>{setTitle(e.target.value);setEdited(true)}}/></label>
   {err&&<p className="cr-error" role="alert">{setupError(lang,err)}</p>}
   <div className="cr-actions"><button className="button" disabled={busy||!opts.ok||title.trim().length<2||(variant&&!allowed)} onClick={assign}><Timer size={16}/>{t.assign} · {n}</button>
    <button className="button secondary" onClick={onCancel}>{t.cancel}</button></div>
  </div>}
 </div>;
}
