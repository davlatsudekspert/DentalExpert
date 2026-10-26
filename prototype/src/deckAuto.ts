import {Capacitor} from '@capacitor/core';

// Auto-advance preferences for the slide viewer, kept on the device.
export const AUTO_SECS=[15,30,60] as const;
export type AutoSecs=typeof AUTO_SECS[number];
const K_AUTO='de_deck_auto',K_SECS='de_deck_secs';
export const loadAuto=():boolean=>{try{return localStorage.getItem(K_AUTO)==='1'}catch{return false}};
export const loadSecs=():AutoSecs=>{try{const v=Number(localStorage.getItem(K_SECS));return v===15||v===60?v:30}catch{return 30}};
export const saveAuto=(on:boolean)=>{try{localStorage.setItem(K_AUTO,on?'1':'0')}catch{/* storage unavailable */}};
export const saveSecs=(s:AutoSecs)=>{try{localStorage.setItem(K_SECS,String(s))}catch{/* storage unavailable */}};

type Lock={release:()=>Promise<void>};
// Keeps the screen on (native keep-awake plugin, or the Screen Wake Lock API in a browser). Returns the function that lets it sleep again.
export function keepScreenOn():()=>void{
 let gone=false,lock:Lock|null=null;
 const native=Capacitor.isNativePlatform();
 (async()=>{try{
  if(native){const {KeepAwake}=await import('@capacitor-community/keep-awake');await KeepAwake.keepAwake();if(gone)await KeepAwake.allowSleep();return}
  const n=navigator as Navigator&{wakeLock?:{request:(k:'screen')=>Promise<Lock>}};
  if(!n.wakeLock)return;
  const l=await n.wakeLock.request('screen');
  if(gone)l.release().catch(()=>{});else lock=l;
 }catch{/* not supported or refused */}})();
 return()=>{
  if(gone)return;gone=true;
  if(native)import('@capacitor-community/keep-awake').then(m=>m.KeepAwake.allowSleep()).catch(()=>{});
  else if(lock){lock.release().catch(()=>{});lock=null}
 };
}
