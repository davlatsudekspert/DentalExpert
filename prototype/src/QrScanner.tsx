import {useEffect,useRef,useState} from 'react';
import {CameraOff,Keyboard,ScanLine,X} from 'lucide-react';
import {parseJoin} from './api';
import './quiz.css';
import type {Lang} from './discoveryData';

const words={
 uz:{title:'QR skanerlash',hint:'Ustoz ko‘rsatgan QR kodni ramka ichiga joylang',starting:'Kamera yoqilmoqda…',denied:'Kameraga ruxsat berilmagan. Telefon sozlamalarida Dental Expert uchun kamerani yoqing yoki kodni qo‘lda kiriting.',
  nocam:'Bu qurilmada kamera topilmadi.',notOurs:'Bu QR kod Dental Expert guruhiga tegishli emas.',manual:'Kodni qo‘lda kiriting',manualHint:'6 belgili kod (masalan, G5R MBA) yoki ustoz yuborgan havola/taklif matni',ph:'Kod yoki havola',go:'Davom etish',bad:'Kod topilmadi. 6 belgili kodni yoki havolani kiriting.',back:'Kameraga qaytish',close:'Yopish'},
 ru:{title:'Сканировать QR',hint:'Наведите камеру на QR-код преподавателя',starting:'Включаем камеру…',denied:'Нет доступа к камере. Разрешите камеру для Dental Expert в настройках телефона или введите код вручную.',
  nocam:'На этом устройстве не найдена камера.',notOurs:'Этот QR-код не относится к группе Dental Expert.',manual:'Ввести код вручную',manualHint:'6-значный код (например, G5R MBA) или ссылка/текст приглашения от преподавателя',ph:'Код или ссылка',go:'Продолжить',bad:'Код не найден. Введите 6-значный код или ссылку.',back:'Вернуться к камере',close:'Закрыть'},
 en:{title:'Scan QR',hint:'Fit your teacher’s QR code inside the frame',starting:'Starting the camera…',denied:'Camera access is off. Allow the camera for Dental Expert in your phone settings, or enter the code by hand.',
  nocam:'No camera was found on this device.',notOurs:'This QR code is not a Dental Expert group.',manual:'Enter the code by hand',manualHint:'The 6-character code (e.g. G5R MBA) or the link/invitation your teacher sent',ph:'Code or link',go:'Continue',bad:'No code found. Enter the 6-character code or the link.',back:'Back to the camera',close:'Close'}
};

type Phase='starting'|'live'|'denied'|'nocam'|'manual';
type Hit={code:string;testId?:string};

/** In-app QR scanner: rear camera into a <video>, frames decoded with jsQR ~6×/s; a Dental Expert join link (or a bare code) calls onResult once.
 *  Without a camera or permission it falls back to typing/pasting the code or link. The camera is stopped on close/unmount. */
export default function QrScanner({lang,onResult,onClose}:{lang:Lang;onResult:(r:Hit)=>void;onClose:()=>void}){
 const t=words[lang];
 const video=useRef<HTMLVideoElement>(null);
 const [phase,setPhase]=useState<Phase>('starting');
 const [warn,setWarn]=useState('');
 const [text,setText]=useState('');
 const [bad,setBad]=useState(false);
 const done=useRef(false);
 const cb=useRef(onResult);cb.current=onResult;
 const finish=(h:Hit)=>{if(done.current)return;done.current=true;try{navigator.vibrate?.(40)}catch{/* no vibration */}cb.current(h)};
 const live=phase==='starting'||phase==='live';
 useEffect(()=>{
  if(!live)return;
  let stream:MediaStream|null=null,timer=0,stopped=false,warnAt=0;
  const stop=()=>{stopped=true;clearInterval(timer);stream?.getTracks().forEach(k=>k.stop());stream=null;if(video.current)video.current.srcObject=null};
  if(!navigator.mediaDevices?.getUserMedia){setPhase('nocam');return}
  (async()=>{
   try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:false})}
   catch(e){if(!stopped)setPhase((e as Error).name==='NotAllowedError'||(e as Error).name==='SecurityError'?'denied':'nocam');return}
   if(stopped){stream.getTracks().forEach(k=>k.stop());return}
   const v=video.current;if(!v)return;
   v.srcObject=stream;await v.play().catch(()=>{});setPhase('live');
   const jsQR=(await import('jsqr')).default;
   const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d',{willReadFrequently:true});
   timer=window.setInterval(()=>{
    if(stopped||done.current||!ctx||v.readyState<2||!v.videoWidth)return;
    // Decode the centre square (where the frame is) at up to 480 px: fast enough for older phones.
    const side=Math.min(v.videoWidth,v.videoHeight),sx=(v.videoWidth-side)/2,sy=(v.videoHeight-side)/2,s=Math.min(480,side);
    canvas.width=canvas.height=s;ctx.drawImage(v,sx,sy,side,side,0,0,s,s);
    const hit=jsQR(ctx.getImageData(0,0,s,s).data,s,s,{inversionAttempts:'attemptBoth'});
    if(!hit?.data)return;
    const p=parseJoin(hit.data);
    if(p){stop();finish(p);return}
    if(Date.now()-warnAt>2500){warnAt=Date.now();setWarn(t.notOurs);setTimeout(()=>setWarn(''),2500)}
   },160);
  })();
  return stop;
 },[live]);
 const submit=()=>{const p=parseJoin(text);if(p)finish(p);else setBad(true)};
 return <div className="quiz-run qj qs" role="dialog" aria-modal="true" aria-label={t.title}>
  <div className="quiz-run-bar"><strong>{t.title}</strong><button data-close onClick={onClose} aria-label={t.close}><X size={20}/></button></div>
  <div className="quiz-run-body">
   {live?<>
    <div className="qs-view"><video ref={video} playsInline muted autoPlay aria-hidden/><span className="qs-frame" aria-hidden><i/><i/><i/><i/><b/></span>
     {phase==='starting'&&<p className="qs-status">{t.starting}</p>}{warn&&<p className="qs-status warn" role="status">{warn}</p>}</div>
    <p className="qs-hint"><ScanLine size={16}/>{t.hint}</p>
    <button className="button secondary" onClick={()=>setPhase('manual')}><Keyboard size={17}/>{t.manual}</button>
   </>:<>
    {phase!=='manual'&&<div className="qj-card qs-off"><span className="qj-badge warn"><CameraOff size={22}/></span><p>{phase==='denied'?t.denied:t.nocam}</p></div>}
    <div className="qj-card"><label className="qj-label" htmlFor="qs-text">{t.manual}</label>
     <input id="qs-text" className="qj-input" value={text} autoFocus autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder={t.ph} aria-describedby="qs-help" aria-invalid={bad||undefined}
      onChange={e=>{setText(e.target.value);setBad(false)}} onKeyDown={e=>{if(e.key==='Enter')submit()}}/>
     <small id="qs-help" className="qj-help">{t.manualHint}</small>
     {bad&&<p className="cr-error qj-err" role="alert">{t.bad}</p>}
     <button className="button" disabled={!text.trim()} onClick={submit}>{t.go}</button></div>
    {phase==='manual'&&<button className="button secondary" onClick={()=>setPhase('starting')}><ScanLine size={17}/>{t.back}</button>}
   </>}
  </div>
 </div>;
}
