import {PRODUCT_IDS,isPremiumProduct,roleOfProduct} from '../../../src/proConfig';
import {ipKey} from '../../_lib/classroom';
import {sha256,timingSafeEqual} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {underLimit} from '../../_lib/ratelimit';

// POST /api/billing/webhook — RevenueCat server events. Authenticated by the shared secret RevenueCat sends in the
// Authorization header (env REVENUECAT_WEBHOOK_AUTH). app_user_id is our user id. Idempotent by event id: a repeated
// delivery changes nothing. Always answers 200 for well-formed events we deliberately ignore, so RevenueCat stops retrying.
// Store purchases only ever apply to the plan of the account's role (a student cannot unlock the teacher plan); Premium is for any role.
const TYPE_STATUS:Record<string,'active'|'cancelled'|'expired'|'billing_issue'>={
 INITIAL_PURCHASE:'active',RENEWAL:'active',UNCANCELLATION:'active',PRODUCT_CHANGE:'active',NON_RENEWING_PURCHASE:'active',
 CANCELLATION:'cancelled',BILLING_ISSUE:'billing_issue',EXPIRATION:'expired'
};
const SOURCE:Record<string,'apple'|'google'>={APP_STORE:'apple',MAC_APP_STORE:'apple',PLAY_STORE:'google'};
const MAX_BODY=64*1024,MAX_FUTURE_MS=400*86400000;
const str=(v:unknown,max:number)=>typeof v==='string'&&v.length>0&&v.length<=max?v:null;
const sqlTime=(ms:number)=>new Date(ms).toISOString().slice(0,19).replace('T',' ');

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 if(!env.REVENUECAT_WEBHOOK_AUTH)return json({error:'billing_not_configured'},503,'no-store');
 // Rate limit before anything else (also stops guessing of the secret).
 if(!await underLimit(env,'rcwh:'+await ipKey(env,request),600,60))return json({error:'rate_limited'},429,'no-store');
 const given=request.headers.get('authorization')||'';
 const [a,b]=await Promise.all([sha256(given),sha256(env.REVENUECAT_WEBHOOK_AUTH)]);
 if(!timingSafeEqual(a,b)){const more=await underLimit(env,'rcwh-bad:'+await ipKey(env,request),20,600);return json({error:more?'unauthorized':'rate_limited'},more?401:429,'no-store')}
 if(!(request.headers.get('content-type')||'').includes('application/json'))return json({error:'json_required'},415,'no-store');
 const len=Number(request.headers.get('content-length')||0);
 if(len>MAX_BODY)return json({error:'too_large'},413,'no-store');
 const text=await request.text();
 if(text.length>MAX_BODY)return json({error:'too_large'},413,'no-store');
 let ev:Record<string,unknown>|null=null;
 try{const p=JSON.parse(text) as {event?:unknown};ev=p&&typeof p.event==='object'&&p.event?p.event as Record<string,unknown>:null}catch{ev=null}
 if(!ev)return json({error:'bad_event'},400,'no-store');

 const id=str(ev.id,100),type=str(ev.type,40),uid=str(ev.app_user_id,64);
 if(!id||!type||!uid||!/^[A-Za-z0-9_.:-]+$/.test(id)||!/^[A-Za-z0-9_-]+$/.test(uid))return json({error:'bad_event'},400,'no-store');
 const status=Object.hasOwn(TYPE_STATUS,type)?TYPE_STATUS[type]:null;
 if(!status)return json({ok:true,ignored:'type'},200,'no-store');   // TEST and other informational events
 const product=str(ev.product_id,100)?.split(':')[0]||null;           // Google Play ids may look like "de_student_monthly:base"
 if(!product||!PRODUCT_IDS.includes(product))return json({ok:true,ignored:'product'},200,'no-store');
 const source=Object.hasOwn(SOURCE,String(ev.store))?SOURCE[String(ev.store)]:null;
 if(!source)return json({error:'bad_store'},400,'no-store');
 const txn=str(ev.original_transaction_id,100)||str(ev.transaction_id,100);
 if(!txn)return json({error:'bad_event'},400,'no-store');
 const eventMs=Number.isFinite(Number(ev.event_timestamp_ms))?Number(ev.event_timestamp_ms):Date.now();
 const expMs=ev.expiration_at_ms==null?null:Number(ev.expiration_at_ms);
 if(expMs!==null&&(!Number.isFinite(expMs)||expMs>Date.now()+MAX_FUTURE_MS))return json({error:'bad_expiration'},400,'no-store');
 if(status==='active'&&expMs===null)return json({error:'bad_expiration'},400,'no-store');

 const user=await env.DB.prepare(`SELECT id,role FROM users WHERE id=? AND guest=0`).bind(uid).first<{id:string;role:string}>();
 // Remember the event id either way, so a replay of an ignored event is cheap.
 if(!user||(!isPremiumProduct(product)&&roleOfProduct(product)!==user.role)){
  await env.DB.prepare(`INSERT OR IGNORE INTO billing_events (event_id) VALUES (?)`).bind(id).run();
  return json({ok:true,ignored:user?'role_mismatch':'unknown_user'},200,'no-store');
 }
 const exp=expMs===null?null:sqlTime(expMs);
 // The event row and the subscription change are one batch: a failure leaves neither, so a retry applies it.
 const [mark]=await env.DB.batch([
  env.DB.prepare(`INSERT OR IGNORE INTO billing_events (event_id) VALUES (?)`).bind(id),
  // changes() is the row count of the statement above: 0 when this event id was already applied, so a replay does nothing.
  env.DB.prepare(`INSERT INTO subscriptions (user_id,product_id,source,status,expires_at,original_txn,last_event_ms)
   SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE changes()>0
   ON CONFLICT (original_txn) DO UPDATE SET product_id=excluded.product_id,status=excluded.status,expires_at=COALESCE(excluded.expires_at,subscriptions.expires_at),
    updated_at=datetime('now'),last_event_ms=excluded.last_event_ms
   WHERE subscriptions.user_id=excluded.user_id AND subscriptions.source=excluded.source AND subscriptions.last_event_ms<=excluded.last_event_ms`).bind(user.id,product,source,status,exp,txn,eventMs)
 ]);
 return json({ok:true,duplicate:mark.meta.changes===0},200,'no-store');
};
