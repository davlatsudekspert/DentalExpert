import type {DemoDoctor,Translated} from './discoveryData';
import {Capacitor} from '@capacitor/core';

/** Native builds load assets from the app bundle and call the hosted API; web builds stay same-origin. */
export const isNative=Capacitor.isNativePlatform();
const API_BASE=isNative?((import.meta.env.VITE_API_BASE as string|undefined)||'https://dental-expert.pages.dev'):'';
const url=(path:string)=>API_BASE+path;

const TOKEN_KEY='de_token';
const getToken=()=>{try{return isNative?localStorage.getItem(TOKEN_KEY):null}catch{return null}};
const setToken=(t:string|null)=>{try{if(!isNative)return;if(t)localStorage.setItem(TOKEN_KEY,t);else localStorage.removeItem(TOKEN_KEY)}catch{/* storage unavailable */}};
const authHeaders=():Record<string,string>=>{if(!isNative)return {};const t=getToken();return t?{'x-client':'native',authorization:'Bearer '+t}:{'x-client':'native'}};

export type SponsorsResponse={cityId:string;sample:boolean;activeCount:number;sponsors:{id:string;isDemo:boolean}[]};

/** Returns null when the API is unreachable (offline demo.html, dev server without Functions) so callers keep the local demo data. */
export async function fetchSponsors(cityId:string,signal?:AbortSignal):Promise<SponsorsResponse|null>{
 try{
  const res=await fetch(url(`/api/sponsors?city=${encodeURIComponent(cityId)}&includeDemo=1`),{signal,headers:{accept:'application/json'}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return null;
  return await res.json() as SponsorsResponse;
 }catch{return null}
}

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

export type AuthUser={id:string;email:string;name:string|null;role:'patient'|'dentist'|'teacher'|'student';countryCode:string|null;cityId:string|null};
export type AuthState={enabled:boolean;user:AuthUser|null};

async function post<T>(path:string,body:unknown,method='POST'):Promise<{ok:boolean;status:number;data:T&{error?:string;retryAfterSec?:number;attemptsLeft?:number}}>{
 try{
  const res=await fetch(url(path),{method,headers:{'content-type':'application/json',...authHeaders()},body:method==='DELETE'?undefined:JSON.stringify(body),credentials:'same-origin'});
  const data=await res.json().catch(()=>({})) as never;
  return {ok:res.ok,status:res.status,data};
 }catch{return {ok:false,status:0,data:{error:'network'} as never}}
}

/** enabled=false means email-code sign-in is unavailable and the labelled demo flow stays. */
export async function fetchAuth():Promise<AuthState>{
 try{
  const res=await fetch(url('/api/auth/me'),{credentials:'same-origin',headers:{accept:'application/json',...authHeaders()}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return {enabled:false,user:null};
  return await res.json() as AuthState;
 }catch{return {enabled:false,user:null}}
}
export const requestCode=(b:{email:string;name?:string;role?:string;countryCode?:string;cityId?:string;lang:string})=>post<{ok?:boolean}>('/api/auth/request-code',b);
export const verifyCode=async(email:string,code:string)=>{const r=await post<{user?:AuthUser;token?:string}>('/api/auth/verify',{email,code});if(r.ok&&r.data.token)setToken(r.data.token);return r};
export const logout=async()=>{const r=await post<{ok?:boolean}>('/api/auth/logout',{});setToken(null);return r};
export const deleteAccount=async()=>{const r=await post<{ok?:boolean}>('/api/auth/account',null,'DELETE');if(r.ok)setToken(null);return r};

import type {Institution} from './institutionsData';
/** Falls back to the bundled list when the API is unreachable. */
export async function fetchInstitutions(signal?:AbortSignal):Promise<Institution[]|null>{
 try{
  const res=await fetch(url('/api/institutions'),{signal,headers:{accept:'application/json'}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return null;
  return (await res.json() as {institutions:Institution[]}).institutions;
 }catch{return null}
}
