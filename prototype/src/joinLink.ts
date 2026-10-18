import {normalizeCode} from './classroomShared';
/** Public site the QR codes point to (the /j/ landing page opens the app or continues in the browser). */
export const SITE='https://dental-expert.pages.dev';
export const joinLink=(code:string,testId?:string)=>`${SITE}/j/?c=${code}${testId?`&a=${encodeURIComponent(testId)}`:''}`;
export type Invite={code:string;testId?:string};
/** Reads a join code (and test id) from a scanned QR link, a pasted invite text or a bare code like "G5R MBA". */
export function parseJoin(text:string):Invite|null{
 const t=text.trim().slice(0,600);
 const c=t.match(/[?&]c=([A-Za-z0-9]{6})(?![A-Za-z0-9])/)?.[1];
 const a=t.match(/[?&]a=([A-Za-z0-9-]{8,60})/)?.[1];
 if(c)return {code:c.toUpperCase(),testId:a};
 const bare=normalizeCode(t).code;
 if(bare.length===6)return {code:bare};
 // Inside a longer text, take the last code-shaped token that has a digit (plain 6-letter words are not codes).
 const hits=[...t.toUpperCase().matchAll(/(?:^|[^A-Z0-9])([A-Z0-9]{3})[ -]?([A-Z0-9]{3})(?![A-Z0-9])/g)].map(m=>m[1]+m[2]).filter(x=>/\d/.test(x));
 return hits.length?{code:hits[hits.length-1]}:null;
}
export const sameInvite=(a:Invite|null|undefined,b:Invite|null|undefined)=>!!a&&!!b&&a.code===b.code&&(a.testId||'')===(b.testId||'');

/** The one invite this device is working on, kept in localStorage 'de_quick' so it survives sign-up, the email code,
 * Google/Apple sign-in, an app restart and a test interrupted half-way:
 *  stage 'signin' — the QR was opened while signed out; it reopens once someone is signed in (for 24 hours)
 *  stage 'test'   — the test was started and not submitted; it reopens on launch to continue (for 7 days). */
export type Pending=Invite&{stage:'signin'|'test';at:number};
const KEY='de_quick';
const TTL={signin:24*3600_000,test:7*24*3600_000};
export function pendingInvite():Pending|null{
 try{
  const v=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!v||typeof v.code!=='string'||!/^[A-Z0-9]{6}$/.test(v.code))return null;
  const stage=v.stage==='signin'?'signin':'test';
  // Entries from the previous app version have no stage or time: they were tests in progress.
  const at=typeof v.at==='number'?v.at:Date.now();
  if(Date.now()-at>TTL[stage]){localStorage.removeItem(KEY);return null}
  return {code:v.code,testId:typeof v.testId==='string'?v.testId:undefined,stage,at};
 }catch{return null}
}
export function savePending(j:Invite,stage:'signin'|'test'){try{localStorage.setItem(KEY,JSON.stringify({code:j.code,testId:j.testId,stage,at:Date.now()}))}catch{/* storage unavailable */}}
/** Forgets the pending invite (only this one when given, so finishing an old test does not drop a newer invite). */
export function clearPending(j?:Invite){try{const p=pendingInvite();if(!j||!p||sameInvite(p,j))localStorage.removeItem(KEY)}catch{/* storage unavailable */}}
/** A QR test started on this device and not submitted. */
export const pendingQuickTest=():{code:string;testId:string}|null=>{const p=pendingInvite();return p&&p.stage==='test'&&p.testId?{code:p.code,testId:p.testId}:null};

/** The join sheet and the scanner are single overlays at the app root (main.tsx). Screens ask for them with these
 * events instead of mounting their own, so a double tap, a second deep link or a scan from the classroom never stacks
 * a second copy. CLASSROOM_CHANGED tells the classroom screen to reload after a join. */
export const JOIN_EVENT='de:join',SCAN_EVENT='de:scan',CLASSROOM_CHANGED='de:classroom';
export const openJoin=(j:Invite)=>{try{dispatchEvent(new CustomEvent(JOIN_EVENT,{detail:j}))}catch{/* no window */}};
export const openScan=()=>{try{dispatchEvent(new CustomEvent(SCAN_EVENT))}catch{/* no window */}};
export const classroomChanged=()=>{try{dispatchEvent(new CustomEvent(CLASSROOM_CHANGED))}catch{/* no window */}};
