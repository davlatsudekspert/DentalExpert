import type {DemoDoctor,Translated} from './discoveryData';
import {Capacitor} from '@capacitor/core';

/** Native builds load assets from the app bundle and call the hosted API; web builds stay same-origin. */
export const isNative=Capacitor.isNativePlatform();
const API_BASE=isNative?((import.meta.env.VITE_API_BASE as string|undefined)||'https://dental-expert.pages.dev'):'';
const url=(path:string)=>API_BASE+path;

const TOKEN_KEY='de_token';
// A class-only guest (QR quick test) keeps its secret in the Keychain / Android Keystore, not in web storage. It is read
// once at start-up; until then API calls wait for it. Signing in properly replaces it (the server moves the guest's results).
const GUEST_KEY='de_guest';
let guestToken:string|null=null;
// Never resolve a promise WITH a Capacitor plugin object: its proxy answers every property, including `then`, so the
// promise would wait forever (that froze sign-in on iOS). Call the method inside instead and return its result.
type Secure=typeof import('capacitor-secure-storage-plugin')['SecureStoragePlugin'];
const secure=async<T,>(f:(s:Secure)=>Promise<T>)=>{const m=await import('capacitor-secure-storage-plugin');return f(m.SecureStoragePlugin)};
// Reading the key may never block start-up for long: after 1.5 s the app carries on without a guest session.
export const tokenReady:Promise<void>=isNative?Promise.race([secure(s=>s.get({key:GUEST_KEY})).then(r=>{guestToken=r.value||null}).catch(()=>{guestToken=null}),new Promise<void>(r=>setTimeout(r,1500))]):Promise.resolve();
const setGuest=async(t:string|null)=>{guestToken=t;if(!isNative)return;try{await secure(s=>t?s.set({key:GUEST_KEY,value:t}):s.remove({key:GUEST_KEY}))}catch{/* keychain unavailable */}};
const getToken=()=>{try{return isNative?localStorage.getItem(TOKEN_KEY)||guestToken:null}catch{return guestToken}};
const setToken=(t:string|null)=>{try{if(!isNative)return;if(t)localStorage.setItem(TOKEN_KEY,t);else localStorage.removeItem(TOKEN_KEY)}catch{/* storage unavailable */}};
const authHeaders=():Record<string,string>=>{if(!isNative)return {};const t=getToken();return t?{'x-client':'native',authorization:'Bearer '+t}:{'x-client':'native'}};
/** A real sign-in or sign-out ends the device's guest session. */
const signedInAs=(t:string|null)=>{setToken(t);void setGuest(null)};

/** Fetch helpers below return null when the API is unreachable (offline demo.html, dev server without Functions) so callers keep the local demo data. */
type ApiDoctor={id:string;fullName:string;initials?:string|null;specialty:Translated;bio?:Translated|null;languages:string[];services:Translated[];years?:number|null;rating?:number|null;photoUrl?:string|null;isDemo:boolean;clinics:{name:string;address?:Translated|null;cityId:string}[];contacts:{kind:string;value:string}[]};

const initialsOf=(name:string)=>name.replace(/^Dr\.?\s+/i,'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();

/** Maps an API clinician onto the profile shape the screens already render. */
export function apiDoctorToView(a:ApiDoctor,countryCode:string,local?:DemoDoctor):DemoDoctor{
 const clinic=a.clinics[0];
 const none:Translated={uz:'',ru:'',en:''};
 return {
  ...(local||{}),
  id:a.id,name:a.fullName,initials:a.initials||initialsOf(a.fullName),
  cityId:(clinic?.cityId||local?.cityId||'') as DemoDoctor['cityId'],countryCode:countryCode as DemoDoctor['countryCode'],
  clinic:a.clinics.map(c=>c.name).join(' · '),specialty:a.specialty,bio:a.bio||none,address:clinic?.address||none,
  languages:a.languages,years:a.years??0,score:a.rating!=null?a.rating.toFixed(1):'',services:a.services,
  isDemo:a.isDemo,photoUrl:a.photoUrl||undefined,contacts:a.contacts
 };
}

/** Returns null when the API is unreachable so callers keep the local demo list. */
export async function fetchDoctors(cityId:string,signal?:AbortSignal):Promise<ApiDoctor[]|null>{
 try{
  const res=await fetch(url(`/api/doctors?city=${encodeURIComponent(cityId)}`),{signal,headers:{accept:'application/json'}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return null;
  return (await res.json() as {doctors:ApiDoctor[]}).doctors;
 }catch{return null}
}

export type AuthUser={id:string;guest?:boolean;email:string;name:string|null;role:'patient'|'dentist'|'teacher'|'student';countryCode:string|null;cityId:string|null;phone?:string|null;workplace?:string|null;bio?:string|null;isAdmin?:boolean;specialty?:string|null;telegram?:string|null;instagram?:string|null;publicEmail?:string|null;address?:string|null;mapUrl?:string|null;publishRequested?:boolean;verified?:boolean};
export type AuthState={enabled:boolean;user:AuthUser|null};

async function post<T>(path:string,body:unknown,method:'POST'|'PUT'|'DELETE'='POST'):Promise<{ok:boolean;status:number;data:T&{error?:string;retryAfterSec?:number;attemptsLeft?:number}}>{
 await tokenReady;
 try{
  const res=await fetch(url(path),{method,headers:{'content-type':'application/json',...authHeaders()},body:method==='DELETE'?undefined:JSON.stringify(body),credentials:'same-origin'});
  const data=await res.json().catch(()=>({})) as never;
  return {ok:res.ok,status:res.status,data};
 }catch{return {ok:false,status:0,data:{error:'network'} as never}}
}

/** enabled=false means email-code sign-in is unavailable and the labelled demo flow stays. */
export async function fetchAuth():Promise<AuthState>{
 await tokenReady;
 try{
  const res=await fetch(url('/api/auth/me'),{credentials:'same-origin',headers:{accept:'application/json',...authHeaders()}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return {enabled:false,user:null};
  return await res.json() as AuthState;
 }catch{return {enabled:false,user:null}}
}
export const requestCode=(b:{email:string;name?:string;role?:string;countryCode?:string;cityId?:string;lang:string})=>post<{ok?:boolean}>('/api/auth/request-code',b);
export const verifyCode=async(email:string,code:string)=>{const r=await post<{user?:AuthUser;token?:string}>('/api/auth/verify',{email,code});if(r.ok&&r.data.token)signedInAs(r.data.token);return r};
export type OAuthProfile={name?:string;role?:string;countryCode?:string;cityId?:string};
/** Exchanges a Google/Apple ID token for a session; same response as verifyCode (token on native, cookie on web). The nonce is the raw value whose SHA-256 hex was given to the provider. */
export const oauthSignIn=async(provider:'google'|'apple',idToken:string,nonce:string|undefined,profile:OAuthProfile={})=>{const r=await post<{user?:AuthUser;token?:string}>('/api/auth/oauth',{provider,idToken,nonce,...profile});if(r.ok&&r.data.token)signedInAs(r.data.token);return r};
export const logout=async()=>{const r=await post<{ok?:boolean}>('/api/auth/logout',{});signedInAs(null);return r};
export const deleteAccount=async()=>{const r=await post<{ok?:boolean}>('/api/auth/account',null,'DELETE');if(r.ok)signedInAs(null);return r};

import type {Institution} from './institutionsData';
/** Falls back to the bundled list when the API is unreachable. */
export async function fetchInstitutions(signal?:AbortSignal):Promise<Institution[]|null>{
 try{
  const res=await fetch(url('/api/institutions'),{signal,headers:{accept:'application/json'}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return null;
  return (await res.json() as {institutions:Institution[]}).institutions;
 }catch{return null}
}

/** Authenticated JSON call for the classroom API; returns status 0 when the network or API is unavailable. */
export async function callApi<T=Record<string,unknown>>(path:string,method:'GET'|'POST'|'PUT'|'DELETE'='GET',payload?:unknown):Promise<{ok:boolean;status:number;data:T&{error?:string}}>{
 await tokenReady;
 try{
  const res=await fetch(url('/api'+path),{method,credentials:'same-origin',headers:{accept:'application/json',...(payload!==undefined?{'content-type':'application/json'}:{}),...authHeaders()},body:payload!==undefined?JSON.stringify(payload):undefined});
  if(!(res.headers.get('content-type')||'').includes('json'))return {ok:false,status:0,data:{error:'network'} as never};
  const data=await res.json().catch(()=>({})) as never;
  return {ok:res.ok,status:res.status,data};
 }catch{return {ok:false,status:0,data:{error:'network'} as never}}
}

export type ProfileInput={name:string;phone:string;workplace:string;bio:string;specialty:string;address:string;telegram:string;instagram:string;publicEmail:string;mapUrl:string;publishRequested:boolean};
export const saveProfile=(b:ProfileInput)=>post<{user?:AuthUser}>('/api/auth/profile',b,'PUT');

export {SITE,joinLink,parseJoin} from './joinLink';
export type QuickJoined={group:{id:string;name:string};test:{id:string;title:string;status:string}|null;user?:AuthUser&{guest?:boolean}};
/** QR quick test: joins the group (signed in), or creates this device's class-only guest with just a nickname. */
export async function quickJoin(code:string,nickname:string,testId?:string){
 const r=await post<QuickJoined&{token?:string}>('/api/classroom/quick',{code,nickname,assignmentId:testId});
 if(r.ok&&r.data.token)await setGuest(r.data.token);
 return r;
}
