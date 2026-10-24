import {useSyncExternalStore} from 'react';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {FEATURE_ROLES,FREE,PLANS,planForRole,type Period,type PlanRole,type ProFeature,type ProState} from './proConfig';
import {callApi,fetchAuth,type AuthUser} from './api';

/** Pro / Free on the client. OFF unless the build sets VITE_PRO_ENABLED=1 (and the server PRO_ENABLED=1): then every
 * function below says "allowed" and no paywall or plan UI is ever shown. The server stays the source of truth for the
 * data-bearing gates; this file decides what the app shows and when it offers an upgrade. */
export const PRO_ENABLED=import.meta.env.VITE_PRO_ENABLED==='1';

// ---- Pro state of the signed-in account (from /api/auth/me and the other session answers).
type Snap={userId:string|null;role:AuthUser['role']|null;pro:ProState|null};
let snap:Snap={userId:null,role:null,pro:null};
const subs=new Set<()=>void>();
const emit=()=>subs.forEach(f=>f());
/** Called whenever the signed-in user changes. A later answer without `pro` (profile saves) keeps the known state. */
export function setProUser(u:AuthUser|null){
 if(!PRO_ENABLED)return;
 const keep=u&&snap.userId===u.id&&snap.role===u.role?snap.pro:null;
 const next:Snap=u&&!u.guest?{userId:u.id,role:u.role,pro:u.pro||keep}:{userId:null,role:null,pro:null};
 if(next.userId===snap.userId&&next.role===snap.role&&next.pro===snap.pro)return;
 snap=next;emit();
}
export const usePro=():Snap=>useSyncExternalStore(f=>{subs.add(f);return()=>{subs.delete(f)}},()=>snap);

/** True when the account has full access (trial, paid, admin grant, patient). Signed-out visitors are on the Free tier. */
export const proActive=()=>!PRO_ENABLED||!!snap.pro?.active;
/** Whether a Pro feature may be used now. Free features are never asked about. */
/** Features meant for other roles (a student has no groups to cap) are never locked for them. */
export const proAllowed=(f:ProFeature)=>proActive()||(!!snap.role&&!FEATURE_ROLES[f].includes(snap.role as PlanRole));
export const signedInForPro=()=>!!snap.userId;

// ---- Paywall visibility (the host component lives in main.tsx).
export type PaywallState={open:boolean;feature:ProFeature|null};
let pw:PaywallState={open:false,feature:null};
const pwSubs=new Set<()=>void>();
export const showPaywall=(feature:ProFeature|null=null)=>{if(!PRO_ENABLED)return;pw={open:true,feature};pwSubs.forEach(f=>f())};
export const hidePaywall=()=>{pw={open:false,feature:null};pwSubs.forEach(f=>f())};
export const usePaywall=():PaywallState=>useSyncExternalStore(f=>{pwSubs.add(f);return()=>{pwSubs.delete(f)}},()=>pw);
/** True (and the paywall opens) when a server answer was 402 pro_required. Use right after a callApi that may be gated. */
export const handleProRequired=(r:{status:number;data:{error?:string;feature?:string}},fallback:ProFeature):boolean=>{
 if(r.status!==402||r.data.error!=='pro_required')return false;
 showPaywall(((r.data.feature as ProFeature)||fallback));return true;
};

// ---- Daily practice allowance on Free (the server counts for signed-in accounts; signed-out visitors are counted on the device).
const dayKey=()=>new Date().toISOString().slice(0,10);
const localUsed=()=>{try{const v=JSON.parse(localStorage.getItem('de_pr_day')||'{}');return v.d===dayKey()?Number(v.n)||0:0}catch{return 0}};
const localAdd=(n:number)=>{try{localStorage.setItem('de_pr_day',JSON.stringify({d:dayKey(),n:localUsed()+n}))}catch{/* storage unavailable */}};
/** Takes `n` practice questions from today's allowance before a run starts. false = used up (the paywall is open). */
export async function reservePractice(n:number):Promise<boolean>{
 if(proActive())return true;
 if(!snap.userId){if(localUsed()+n>FREE.practicePerDay){showPaywall('practice');return false}localAdd(n);return true}
 const r=await callApi<{unlimited?:boolean}>('/billing/practice','POST',{n});
 if(r.ok)return true;
 if(handleProRequired(r,'practice'))return false;
 return true;   // network trouble never blocks learning
}

// ---- Store billing. The provider is the only place that talks to App Store / Google Play (through RevenueCat).
export type Offer={productId:string;period:Period;price:string};
export type PurchaseResult='ok'|'cancelled'|'error';
export interface BillingProvider{
 /** True on a native build that has the purchase plugin configured. The web never sells: it points to the apps. */
 available():Promise<boolean>;
 /** Links store purchases to our account id (RevenueCat app_user_id); the server webhook reads it. */
 identify(userId:string):Promise<void>;
 /** Store prices in the local currency for the given role's two products, when the store answered. */
 offers(role:PlanRole):Promise<Offer[]>;
 purchase(productId:string):Promise<PurchaseResult>;
 restore():Promise<'ok'|'error'>;
 logout():Promise<void>;
}

/** Web and every build without the plugin: nothing can be bought here. */
const noProvider:BillingProvider={available:async()=>false,identify:async()=>{},offers:async()=>[],purchase:async()=>'error',restore:async()=>'error',logout:async()=>{}};

// Written against @revenuecat/purchases-capacitor, but it is NOT a dependency yet (see BILLING_SETUP.md): the plugin is looked up
// by name at run time, so a build without it simply reports "not available" and the native projects stay untouched.
type Pkg={identifier:string;product:{identifier:string;priceString:string};packageType?:string};
interface PurchasesPlugin{
 configure(o:{apiKey:string;appUserID?:string|null}):Promise<void>;logIn(o:{appUserID:string}):Promise<unknown>;logOut():Promise<unknown>;
 getOfferings():Promise<{current?:{availablePackages:Pkg[]}|null}>;
 purchasePackage(o:{aPackage:Pkg}):Promise<unknown>;restorePurchases():Promise<unknown>;
}
const rcKey=()=>Capacitor.getPlatform()==='ios'?import.meta.env.VITE_RC_IOS_KEY:import.meta.env.VITE_RC_ANDROID_KEY;
let rc:PurchasesPlugin|null=null,rcReady:Promise<boolean>|null=null,pkgs:Pkg[]=[];
const rcInit=()=>rcReady||(rcReady=(async()=>{
 try{
  const key=rcKey();
  if(!Capacitor.isNativePlatform()||!key||!Capacitor.isPluginAvailable('Purchases'))return false;
  const p=registerPlugin<PurchasesPlugin>('Purchases');
  await p.configure({apiKey:key});rc=p;return true;
 }catch{return false}
})());
const periodOf=(id:string):Period=>id.endsWith('_yearly')?'yearly':'monthly';
const revenueCat:BillingProvider={
 available:()=>rcInit(),
 identify:async id=>{if(await rcInit())try{await rc!.logIn({appUserID:id})}catch{/* retried on the next start */}},
 offers:async role=>{
  if(!await rcInit())return [];
  try{
   const o=await rc!.getOfferings();pkgs=o.current?.availablePackages||[];
   const mine=planForRole(role);if(!mine)return [];
   return pkgs.filter(p=>[mine.monthly.product,mine.yearly.product].includes(p.product.identifier.split(':')[0]))
    .map(p=>({productId:p.product.identifier.split(':')[0],period:periodOf(p.product.identifier),price:p.product.priceString}));
  }catch{return []}
 },
 purchase:async id=>{
  if(!await rcInit())return 'error';
  const pk=pkgs.find(p=>p.product.identifier.split(':')[0]===id);if(!pk)return 'error';
  try{await rc!.purchasePackage({aPackage:pk});return 'ok'}
  catch(e){return (e as {userCancelled?:boolean})?.userCancelled?'cancelled':'error'}
 },
 restore:async()=>{if(!await rcInit())return 'error';try{await rc!.restorePurchases();return 'ok'}catch{return 'error'}},
 logout:async()=>{if(await rcInit())try{await rc!.logOut()}catch{/* ignore */}}
};
export const billing:BillingProvider=PRO_ENABLED&&Capacitor.isNativePlatform()?revenueCat:noProvider;

/** Re-reads the account (the store event reaches the server through RevenueCat's webhook, usually within seconds). */
let onUser:((u:AuthUser)=>void)|null=null;
export const onProRefreshed=(f:(u:AuthUser)=>void)=>{onUser=f};
export async function refreshPro(tries=1,wantActive=false):Promise<ProState|null>{
 for(let i=0;i<tries;i++){
  const a=await fetchAuth();
  if(a.user){setProUser(a.user);onUser?.(a.user);if(a.user.pro&&(!wantActive||a.user.pro.reason==='paid'))return a.user.pro}
  if(i<tries-1)await new Promise(r=>setTimeout(r,2000));
 }
 return snap.pro;
}

/** USD list price of the user's plan, for the web text and as a fallback while the store prices load. */
export const listPrice=(role:PlanRole,period:Period)=>PLANS[role][period].usd;
/** Percent saved by the yearly plan against twelve months, computed from the config. */
export const yearlySavingPct=(role:PlanRole)=>{const p=PLANS[role];return Math.max(0,Math.round((1-p.yearly.usd/(p.monthly.usd*12))*100))};
