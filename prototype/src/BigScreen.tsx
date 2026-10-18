import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {BarChart3,Flag,QrCode,Users,X} from 'lucide-react';
import qrcode from 'qrcode-generator';
import {Capacitor} from '@capacitor/core';
import {callApi,joinLink} from './api';
import {fmtDue,refItems} from './classTest';
import type {Lang} from './discoveryData';
import './bigscreen.css';

/** Teacher's "big screen": live leaderboard of a running test for a projector or TV, with a join QR, and the hardest questions once finished. */
type M={no:number;nickname:string|null;answer:string|null;score:number|null;total:number|null;startedAt:string|null;submittedAt:string|null;answered?:number};
type A={id:string;kind:string;title:string;status:'open'|'closed';questionCount?:number;topicId?:string;questions?:number[];items?:string[];variant?:boolean;minutes?:number;deadlineAt?:string;ended?:boolean;deckId:string|null;submitted?:number};
type Stat={right:number;answered:number};
export type BigTest={id:string;title:string;topicId?:string;deckId?:string|null};

const ruPlural=(n:number,one:string,few:string,many:string)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many};
const words={
 uz:{eyebrow:'Jonli natijalar',qCount:(n:number)=>`${n} ta savol`,joined:'Qo‘shildi',submitted:'Topshirdi',live:'Davom etmoqda',ended:'Yakunlandi',close:'Yopish',finish:'Testni yakunlash',
  confirm:'Test yakunlansin? Boshlagan talabalarga 2 daqiqa beriladi, so‘ng eng qiyin savollar ko‘rinadi.',cancel:'Bekor qilish',waiting:'Qo‘shildi',solving:'Yechmoqda',done:'Topshirdi',student:'Talaba',
  scan:'Skanerlang yoki kodni kiriting',code:'Guruh kodi',hardest:'Eng qiyin savollar',avg:'O‘rtacha natija',noOne:'Hali hech kim qo‘shilmadi',noOneHint:'QR kodni telefon kamerasi bilan skanerlang',
  noStats:'Hali hech kim topshirmagan',offline:'Aloqa yo‘q — oxirgi ma’lumot ko‘rsatilmoqda',showQr:'QR kodni ko‘rsatish',showStats:'Eng qiyin savollar',qN:(n:number)=>`${n}-savol`,rightN:(r:number,n:number)=>`${r}/${n} to‘g‘ri`,
  rotate:'Gorizontal holatga o‘tamizmi?',rotateHint:'Natijalar jadvali yotiq ekranda yaxshiroq ko‘rinadi.',yes:'Ha',no:'Yo‘q',err:'Bajarilmadi. Qayta urinib ko‘ring.'},
 ru:{eyebrow:'Результаты в реальном времени',qCount:(n:number)=>`${n} ${ruPlural(n,'вопрос','вопроса','вопросов')}`,joined:'Подключились',submitted:'Сдали',live:'Идёт',ended:'Завершён',close:'Закрыть',finish:'Завершить тест',
  confirm:'Завершить тест? Начавшим студентам даётся 2 минуты, затем появятся самые трудные вопросы.',cancel:'Отмена',waiting:'Подключился',solving:'Решает',done:'Сдано',student:'Студент',
  scan:'Отсканируйте или введите код',code:'Код группы',hardest:'Самые трудные вопросы',avg:'Средний результат',noOne:'Пока никто не подключился',noOneHint:'Наведите камеру телефона на QR-код',
  noStats:'Пока никто не сдал',offline:'Нет связи — показаны последние данные',showQr:'Показать QR-код',showStats:'Самые трудные вопросы',qN:(n:number)=>`Вопрос ${n}`,rightN:(r:number,n:number)=>`${r}/${n} верно`,
  rotate:'Перейти в горизонтальный режим?',rotateHint:'Таблица результатов лучше видна на горизонтальном экране.',yes:'Да',no:'Нет',err:'Не получилось. Попробуйте ещё раз.'},
 en:{eyebrow:'Live results',qCount:(n:number)=>`${n} question${n===1?'':'s'}`,joined:'Joined',submitted:'Submitted',live:'In progress',ended:'Finished',close:'Close',finish:'Finish the test',
  confirm:'Finish the test? Students who started get 2 more minutes, then the hardest questions appear.',cancel:'Cancel',waiting:'Joined',solving:'Answering',done:'Submitted',student:'Student',
  scan:'Scan or enter the code',code:'Group code',hardest:'Hardest questions',avg:'Average score',noOne:'Nobody has joined yet',noOneHint:'Point a phone camera at the QR code',
  noStats:'Nobody has submitted yet',offline:'Offline — showing the last data',showQr:'Show the QR code',showStats:'Hardest questions',qN:(n:number)=>`Question ${n}`,rightN:(r:number,n:number)=>`${r}/${n} correct`,
  rotate:'Switch to landscape?',rotateHint:'The results board reads better on a landscape screen.',yes:'Yes',no:'No',err:'That did not work. Please try again.'}
};

const nn=(n:number)=>String(n).padStart(2,'0');
/** D1 returns "YYYY-MM-DD HH:MM:SS" in UTC. */
const ts=(s:string|null)=>s?Date.parse(s.includes('T')?s:s.replace(' ','T')+'Z'):NaN;
const clock=(ms:number)=>{if(!(ms>=0))return '';const s=Math.floor(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const phase=(m:M)=>m.answer==='done'?2:m.answer==='started'?1:0;
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};

/** Done first (score, then shorter time), then those answering (most answered first), then the ones still waiting. */
function rank(ms:M[]){
 const dur=(m:M)=>ts(m.submittedAt)-ts(m.startedAt);
 return [...ms].sort((a,b)=>phase(b)-phase(a)||(phase(a)===2?(b.score??0)-(a.score??0)||(dur(a)||0)-(dur(b)||0):phase(a)===1?(b.answered??0)-(a.answered??0)||ts(a.startedAt)-ts(b.startedAt):0)||a.no-b.no);
}

function useQr(text:string){
 return useMemo(()=>{const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;return {n,d}},[text]);
}

export default function BigScreen({lang,groupId,groupCode,test,onClose}:{lang:Lang;groupId:string;groupCode:string;test:BigTest;onClose:(finished:boolean)=>void}){
 const t=words[lang];
 const [a,setA]=useState<A|null>(null);
 const [members,setMembers]=useState<M[]|null>(null);
 const [stats,setStats]=useState<Stat[]|null>(null);
 const [offline,setOffline]=useState(false);
 const [asking,setAsking]=useState(false);
 const [err,setErr]=useState('');
 const [closedAt,setClosedAt]=useState(0);
 const wide=()=>innerWidth>=1000&&innerHeight>=560;
 const [side,setSide]=useState<boolean|null>(null);
 const [askRotate,setAskRotate]=useState(()=>innerHeight>innerWidth);
 const [rot,setRot]=useState(false);
 const [fresh,setFresh]=useState<Set<number>>(new Set());
 const [now,setNow]=useState(Date.now());
 const prev=useRef<Map<number,string|null>|null>(null);
 // Over when the teacher finished it or its deadline passed.
 const closed=a?.status==='closed'||!!a?.ended;
 // The join QR shows by default on big screens; with a full class on a smaller screen the board gets the room instead.
 const showSide=side??(closed||wide()&&((members?.length??0)<=24||innerWidth>=1600));

 const load=useCallback(async()=>{
  const r=await callApi<{assignments:A[];members:M[];stats?:Stat[]}>(`/classroom/assignments?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(test.id)}`);
  if(!r.ok||!r.data.members){setOffline(true);return}
  setOffline(false);
  const me=r.data.assignments.find(x=>x.id===test.id);if(me)setA(me);
  const ms=r.data.members;
  // A result that just came in glows for a few seconds (not on the first load).
  if(prev.current){const p=prev.current;const add=ms.filter(m=>m.answer==='done'&&p.get(m.no)!=='done').map(m=>m.no);
   if(add.length){setFresh(f=>new Set([...f,...add]));setTimeout(()=>setFresh(f=>{const n=new Set(f);add.forEach(x=>n.delete(x));return n}),6000)}}
  prev.current=new Map(ms.map(m=>[m.no,m.answer]));
  setMembers(ms);setStats(r.data.stats||null);
 },[groupId,test.id]);
 useEffect(()=>{load()},[load]);
 // Every 5 s while the test is open and the page is in front; after finishing, a slow refresh for the 2-minute grace only.
 useEffect(()=>{
  const ms=!closed?5000:closedAt&&Date.now()-closedAt<170000?30000:0;if(!ms||!a)return;
  const id=setInterval(()=>{if(document.visibilityState==='visible')load();if(closed&&Date.now()-closedAt>=170000)clearInterval(id)},ms);
  const vis=()=>{if(document.visibilityState==='visible'&&!closed)load()};document.addEventListener('visibilitychange',vis);
  return ()=>{clearInterval(id);document.removeEventListener('visibilitychange',vis)};
 },[closed,closedAt,load,a]);
 const running=!!members?.some(m=>m.answer==='started');
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(id)},[running]);

 // Fullscreen, screen kept awake, body scroll locked; all undone on close. Failures are ignored (iPhone Safari has no fullscreen API).
 const finished=useRef(false);finished.current=closedAt>0;
 const close=()=>onClose(finished.current);
 const esc=useRef(close);esc.current=close;
 const sheetOpen=useRef(false);sheetOpen.current=asking||askRotate;
 useEffect(()=>{
  const de=document.documentElement as HTMLElement&{webkitRequestFullscreen?:()=>void};
  let entered=false;
  try{if(!document.fullscreenElement){const p=de.requestFullscreen?de.requestFullscreen():(de.webkitRequestFullscreen?.(),undefined);entered=true;p?.catch(()=>{entered=false})}}catch{/* not allowed */}
  const native=Capacitor.isNativePlatform();
  type WL={release:()=>Promise<void>};let lock:WL|null=null,gone=false;
  const wake=async()=>{try{if(native){(await import('@capacitor-community/keep-awake')).KeepAwake.keepAwake();return}
   const n=navigator as Navigator&{wakeLock?:{request:(k:'screen')=>Promise<WL>}};if(n.wakeLock&&!gone){lock=await n.wakeLock.request('screen');if(gone)lock.release().catch(()=>{})}}catch{/* not supported */}};
  wake();
  const vis=()=>{if(document.visibilityState==='visible'&&!native)wake()};document.addEventListener('visibilitychange',vis);
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!sheetOpen.current)esc.current()};addEventListener('keydown',k);
  const ov=document.body.style.overflow;document.body.style.overflow='hidden';
  return ()=>{gone=true;document.removeEventListener('visibilitychange',vis);removeEventListener('keydown',k);document.body.style.overflow=ov;
   lock?.release().catch(()=>{});
   if(native){import('@capacitor-community/keep-awake').then(m=>m.KeepAwake.allowSleep()).catch(()=>{});import('@capacitor/screen-orientation').then(m=>m.ScreenOrientation.unlock()).catch(()=>{})}
   else{try{(screen.orientation as unknown as {unlock?:()=>void}).unlock?.()}catch{/* not locked */}}
   try{if(entered&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch{/* ignore */}};
 },[]);
 // A board rotated by CSS goes back to normal once the device itself is turned to landscape.
 useEffect(()=>{if(!rot)return;const r=()=>{if(innerWidth>innerHeight)setRot(false)};addEventListener('resize',r);return ()=>removeEventListener('resize',r)},[rot]);
 const landscape=async()=>{
  setAskRotate(false);
  try{if(Capacitor.isNativePlatform()){await (await import('@capacitor/screen-orientation')).ScreenOrientation.lock({orientation:'landscape'});return}
   const o=screen.orientation as unknown as {lock?:(x:string)=>Promise<void>};if(!o?.lock)throw new Error('no lock');await o.lock('landscape')}catch{setRot(true)}
 };

 const finish=async()=>{setErr('');const r=await callApi('/classroom/assignments','PUT',{assignmentId:test.id,status:'closed'});if(!r.ok){setErr(t.err);return}setAsking(false);setClosedAt(Date.now());setSide(null);load()};

 // Question texts for the "hardest questions" panel (topic test: the topic JSON; deck quiz: the bundled deck manifest).
 const [qText,setQText]=useState<string[]|null>(null);
 // Topic tests: the stats follow `items` (the fixed questions, or every question of a variant pool).
 const deckId=a?.deckId||test.deckId,items=a?.items;
 useEffect(()=>{if(!closed)return;let live=true;
  if(items)refItems(items,lang).then(it=>{if(live&&it)setQText(it.map(q=>q.q))});
  else if(deckId)fetch(`/decks/manifest.${lang}.json`).then(r=>r.ok?r.json():[]).then((ds:{id:string;quiz:{q:string}[]}[])=>{const d=ds.find(x=>x.id===deckId);if(live&&d)setQText(d.quiz.map(q=>q.q))}).catch(()=>{});
  return ()=>{live=false}},[closed,deckId,items?.join(','),lang]);

 const list=useMemo(()=>rank(members||[]),[members]);
 const total=a?.questionCount??a?.questions?.length??0;
 const done=list.filter(m=>m.answer==='done');
 const qr=useQr(joinLink(groupCode,test.id));
 const title=a?.title||test.title;
 return <div className={'bs'+(rot?' rot':'')} role="dialog" aria-modal="true" aria-label={title}>
  <header className="bs-top">
   <div className="bs-title"><span className="bs-eyebrow">{t.eyebrow}</span><h1>{title}</h1></div>
   <div className="bs-meta">
    {total>0&&<span className="bs-qc">{t.qCount(total)}</span>}{a?.deadlineAt&&!closed&&<span className="bs-qc">{fmtDue(a.deadlineAt,lang)}</span>}
    <span>{t.joined} <b>{members?.length??'…'}</b> · {t.submitted} <b>{members?done.length:'…'}</b></span>
    <span className={'bs-pill '+(closed?'ended':'live')}><i/>{closed?t.ended:t.live}</span>
    {offline&&<span className="bs-off" role="status" title={t.offline} aria-label={t.offline}/>}
   </div>
   <div className="bs-tools">
    <button className="bs-icon" aria-pressed={showSide} aria-label={closed?t.showStats:t.showQr} title={closed?t.showStats:t.showQr} onClick={()=>setSide(!showSide)}>{closed?<BarChart3 size={22}/>:<QrCode size={22}/>}</button>
    {a&&!closed&&<button className="bs-btn" onClick={()=>{setErr('');setAsking(true)}}><Flag size={18}/>{t.finish}</button>}
    <button className="bs-icon bs-close admin-close" data-close aria-label={t.close} title={t.close} onClick={close}><X size={24}/></button>
   </div>
  </header>
  <main className={'bs-main'+(showSide?' with-side':'')}>
   <Board t={t} list={list} total={total} fresh={fresh} now={now}/>
   {showSide&&(closed?<Hardest t={t} stats={stats} qText={qText} done={done}/>
    :<aside className="bs-side bs-join" aria-label={t.scan}>
     <svg className="bs-qr" viewBox={`-3 -3 ${qr.n+6} ${qr.n+6}`} shapeRendering="crispEdges" role="img" aria-label={`QR: ${groupCode}`}><rect x={-3} y={-3} width={qr.n+6} height={qr.n+6} fill="#fff"/><path d={qr.d} fill="#000"/></svg>
     <small>{t.code}</small><b className="bs-code" translate="no">{groupCode.slice(0,3)} {groupCode.slice(3)}</b><p>{t.scan}</p>
    </aside>)}
  </main>
  {asking&&<Sheet text={t.confirm} ok={t.finish} cancel={t.cancel} err={err} onOk={finish} onCancel={()=>setAsking(false)}/>}
  {askRotate&&<Sheet text={t.rotate} hint={t.rotateHint} ok={t.yes} cancel={t.no} onOk={landscape} onCancel={()=>setAskRotate(false)}/>}
 </div>;
}

type W=typeof words.uz;
/** Rows are absolutely placed and move by transform, so a re-rank slides them to their new place (no transition with reduced motion). */
function Board({t,list,total,fresh,now}:{t:W;list:M[];total:number;fresh:Set<number>;now:number}){
 const ref=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState<{w:number;h:number}|null>(null);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;const set=()=>setSize({w:el.clientWidth,h:el.clientHeight});set();const ro=new ResizeObserver(set);ro.observe(el);return ()=>ro.disconnect()},[]);
 const n=list.length;
 const g=size?(()=>{
  const {w,h}=size;const gap=h>700?10:h>420?8:6;const minW=w>=1200?380:w>=760?360:w>=600?290:w;
  const maxCols=Math.max(1,Math.min(3,Math.floor((w+gap)/(minW+gap))));
  const comfy=h>700?78:h>420?60:50;let cols=1;
  for(cols=1;cols<maxCols;cols++){const rows=Math.ceil(n/cols);if((h-gap*(rows-1))/rows>=comfy)break}
  const rows=Math.max(1,Math.ceil(n/cols));const min=cols>1?36:h>700?44:38;
  let rh=Math.min(h>700?118:h>420?96:80,(h-gap*(rows-1))/rows);const scroll=rh<min;if(scroll)rh=min;
  const cw=(w-gap*(cols-1))/cols;const fs=Math.max(13,Math.min(rh*.36,cw/19,38));
  return {gap,cols,rows,rh,cw,fs,scroll,narrow:cw<fs*24}})():null;
 // Too many rows to fit: page through the list slowly.
 useEffect(()=>{if(!g?.scroll)return;const el=ref.current!;const id=setInterval(()=>{const end=el.scrollTop+el.clientHeight>=el.scrollHeight-4;el.scrollTo({top:end?0:el.scrollTop+el.clientHeight*.8,behavior:reduced()?'auto':'smooth'})},6000);return ()=>clearInterval(id)},[g?.scroll]);
 return <section className={'bs-board'+(g?.scroll?' scroll':'')} ref={ref} aria-live="off">
  {n===0?<div className="bs-empty"><Users size={56} strokeWidth={1.4}/><b>{t.noOne}</b><p>{t.noOneHint}</p></div>
  :g&&<ol className={'bs-rows'+(g.narrow?' narrow':'')} style={{height:g.scroll?g.rows*(g.rh+g.gap)-g.gap:'100%',fontSize:g.fs}}>
   {list.map((m,i)=>{// Columns read top to bottom; a scrolling board reads across instead, so each page holds the next ranks.
    const col=g.scroll?i%g.cols:Math.floor(i/g.rows),row=g.scroll?Math.floor(i/g.cols):i%g.rows;const p=phase(m);const name=m.nickname||`${t.student} ${nn(m.no)}`;
    const tot=m.total||total;const pct=p===2&&tot?Math.round((m.score||0)/tot*100):0;const r=p===2?i+1:0;
    const time=p===2?clock(ts(m.submittedAt)-ts(m.startedAt)):p===1?clock(now-ts(m.startedAt)):'';
    const bar=p===2?pct:p===1&&total?Math.min(100,(m.answered??0)/total*100):0;
    return <li key={m.no} className={'bs-row s'+p+(fresh.has(m.no)?' fresh':'')+(r&&r<=3?' bs-r'+r:'')} style={{width:g.cw,height:g.rh,transform:`translate(${col*(g.cw+g.gap)}px,${row*(g.rh+g.gap)}px)`}}>
     <span className="bs-rank">{r||'·'}</span>
     <span className="bs-name" translate="no">{name}</span>
     <span className="bs-st">{p===2?t.done:p===1?<>{g.narrow?'':t.solving+' · '}<b>{m.answered??0}/{total||'?'}</b></>:t.waiting}</span>
     <span className="bs-score">{p===2?<><b>{m.score}/{tot}</b><small>{pct}%</small></>:'—'}</span>
     <span className="bs-time">{time}</span>
     {bar>0&&<i className="bs-rowbar" style={{width:bar+'%'}}/>}
    </li>})}
  </ol>}
 </section>;
}

function Hardest({t,stats,qText,done}:{t:W;stats:Stat[]|null;qText:string[]|null;done:M[]}){
 const avg=done.length?Math.round(done.reduce((s,m)=>s+(m.total?(m.score||0)/m.total:0),0)/done.length*100):null;
 const top=(stats||[]).map((s,k)=>({k,...s,pct:s.answered?Math.round(s.right/s.answered*100):0})).filter(s=>s.answered>0).sort((x,y)=>x.pct-y.pct||x.k-y.k).slice(0,5);
 return <aside className="bs-side bs-hard" aria-label={t.hardest}>
  <h2>{t.hardest}</h2>
  {avg!==null&&<p className="bs-avg">{t.avg} <b>{avg}%</b></p>}
  {stats===null?<p className="bs-muted">…</p>:!top.length?<p className="bs-muted">{t.noStats}</p>
  :<ol>{top.map(s=><li key={s.k} className={s.pct<50?'bad':s.pct<75?'mid':'ok'}><span className="bs-qn">{t.qN(s.k+1)}</span><p>{qText?.[s.k]||''}</p>
   <div className="bs-qbar" role="img" aria-label={`${t.rightN(s.right,s.answered)} · ${s.pct}%`}><i style={{width:Math.max(s.pct,2)+'%'}}/></div><b>{s.pct}%</b><small>{t.rightN(s.right,s.answered)}</small></li>)}</ol>}
 </aside>;
}

/** In-overlay confirmation: focus starts on Cancel, Escape or the backdrop cancels, focus returns afterwards. */
function Sheet({text,hint,ok,cancel,err,onOk,onCancel}:{text:string;hint?:string;ok:string;cancel:string;err?:string;onOk:()=>void;onCancel:()=>void}){
 const ref=useRef<HTMLButtonElement>(null);
 const esc=useRef(onCancel);esc.current=onCancel;
 useEffect(()=>{const back=document.activeElement as HTMLElement|null;ref.current?.focus();const k=(e:KeyboardEvent)=>{if(e.key==='Escape')esc.current()};addEventListener('keydown',k);return ()=>{removeEventListener('keydown',k);back?.focus?.()}},[]);
 return <div className="bs-sheet-back" onClick={e=>{if(e.target===e.currentTarget)onCancel()}}>
  <div className="bs-sheet" role="alertdialog" aria-modal="true" aria-labelledby="bs-sheet-text"><p id="bs-sheet-text">{text}</p>{hint&&<small>{hint}</small>}{err&&<small className="bs-err" role="alert">{err}</small>}
   <div className="bs-sheet-actions"><button ref={ref} className="bs-btn ghost" onClick={onCancel}>{cancel}</button><button className="bs-btn" onClick={onOk}>{ok}</button></div></div>
 </div>;
}
