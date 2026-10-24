import {TRIAL_DAYS,PLANS,PREMIUM_PRODUCTS,PRODUCT_IDS,isPremiumProduct,planForRole,roleOfProduct,type ProState} from '../../src/proConfig';
import {json,type Env} from './db';
import type {SessionUser} from './auth';

/** The Pro system is OFF unless the server variable PRO_ENABLED is "1". Off means every feature is free, nothing is
 * counted and no `pro` object is returned, exactly as before Pro existed. */
export const proEnabled=(env:Env)=>env.PRO_ENABLED==='1';

type Who=Pick<SessionUser,'id'|'role'|'guest'>;
const toIso=(v:string|null)=>v?(v.includes('T')?v:v.replace(' ','T')+'Z'):null;
export type SubRow={product_id:string;source:string;status:string;expires_at:string|null};

/** The trial end of a user row: the stored value, else created_at + 30 days (accounts made after the migration). */
export const TRIAL_SQL=(u:string)=>`COALESCE(${u}.trial_ends_at,datetime(${u}.created_at,'+${TRIAL_DAYS} days'))`;
const LIVE_SUB=`status IN ('active','cancelled','billing_issue') AND (expires_at IS NULL OR expires_at>datetime('now'))`;

/** The pure decision: best of an admin grant, a paid subscription for this role's plan or a Premium one (any role), the trial. Dates are SQLite UTC strings. */
export function stateOf(user:Pick<SessionUser,'role'|'guest'>,trial:string|null,now:string,subs:SubRow[],trialUsed=false):ProState{
 // Patients (and old class-only guests) never pay: active forever, nothing to buy.
 if(user.role==='patient'||user.guest)return {active:true,reason:'free',trialEndsAt:null,expiresAt:null,plan:null};
 const live=subs.filter(s=>['active','cancelled','billing_issue'].includes(s.status)&&(!s.expires_at||s.expires_at>now));
 const admin=live.find(s=>s.source==='admin');
 const plan=planForRole(user.role)?.id||null;
 if(admin)return {active:true,reason:'admin-grant',trialEndsAt:toIso(trial),expiresAt:toIso(admin.expires_at),plan};
 // A purchase counts only for the plan of the account's current role (a role switch never gives another role's Pro).
 // A plan of another role unlocks nothing here, but the app explains it ("you hold the Student plan; the teacher panel needs the Teacher plan").
 const other=live.find(s=>s.source!=='admin'&&roleOfProduct(s.product_id)&&roleOfProduct(s.product_id)!==user.role);
 const heldRole=other?roleOfProduct(other.product_id):null;
 // Premium is the exception: it is not bound to a role, so it counts for whatever role the account has now.
 const paid=live.filter(s=>s.source!=='admin'&&(isPremiumProduct(s.product_id)||roleOfProduct(s.product_id)===user.role)).sort((a,b)=>(b.expires_at||'').localeCompare(a.expires_at||''))[0];
 if(paid)return {active:true,reason:'paid',trialEndsAt:toIso(trial),expiresAt:toIso(paid.expires_at),plan:paid.product_id};
 if(trial&&trial>now)return {active:true,reason:'trial',trialEndsAt:toIso(trial),expiresAt:null,plan,trialUsed,heldRole};
 return {active:false,reason:'free',trialEndsAt:toIso(trial),expiresAt:null,plan,trialUsed,heldRole};
}

/** Reads the rows and decides. Call only when the flag is on. */
export async function entitlement(env:Env,user:Who):Promise<ProState>{
 if(user.role==='patient'||user.guest)return stateOf(user,null,'',[]);
 const [u,s]=await env.DB.batch([
  env.DB.prepare(`SELECT ${TRIAL_SQL('u')} AS trial,datetime('now') AS now,u.trial_denied AS denied FROM users u WHERE u.id=?`).bind(user.id),
  env.DB.prepare(`SELECT product_id,source,status,expires_at FROM subscriptions WHERE user_id=? AND ${LIVE_SUB}`).bind(user.id)
 ]);
 const r=u.results[0] as {trial:string;now:string;denied:number}|undefined;
 return stateOf(user,r?.trial||null,r?.now||'',s.results as SubRow[],!!r?.denied);
}

/** `pro` for session answers: undefined while the flag is off. */
export async function proOf(env:Env,user:Who):Promise<ProState|undefined>{
 return proEnabled(env)?entitlement(env,user):undefined;
}

export const proRequired=(feature:string,extra?:Record<string,unknown>)=>json({error:'pro_required',feature,...extra},402,'no-store');

/** True when the caller may use a Pro feature: flag off, or an entitled account. */
export async function mayUse(env:Env,user:Who|null):Promise<boolean>{
 if(!proEnabled(env))return true;
 return !!user&&(await entitlement(env,user)).active;
}

/** SQL for "this users row (alias u) has Pro as a specialist" (public dentist listing). Same rules as stateOf. */
export const SPECIALIST_PRO_SQL=(u:string)=>`(${TRIAL_SQL(u)}>datetime('now') OR EXISTS(SELECT 1 FROM subscriptions s WHERE s.user_id=${u}.id AND s.status IN ('active','cancelled','billing_issue')
 AND (s.expires_at IS NULL OR s.expires_at>datetime('now')) AND (s.source='admin' OR s.product_id IN ('${PLANS.dentist.monthly.product}','${PLANS.dentist.yearly.product}',${PREMIUM_PRODUCTS.map(p=>`'${p}'`).join(',')}))))`;
export {PRODUCT_IDS};
