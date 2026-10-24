import {FREE} from '../../../src/proConfig';
import {body,needUser,noStore,underLimit} from '../../_lib/classroom';
import {json,type Env} from '../../_lib/db';
import {entitlement,proEnabled,proRequired} from '../../_lib/entitlement';

// The Free daily practice cap, kept per account on the server so it holds across devices.
// GET  → {limit,used,unlimited}
// POST {n} → counts n practice questions (1..FREE.practicePerDay) before they are shown; 402 pro_required once the day's
//            allowance is used up. Pro (trial, paid, admin grant) and the flag-off state are unlimited and counted nowhere.
const today=()=>new Date().toISOString().slice(0,10);
async function state(env:Env,userId:string,role:string){
 if(!proEnabled(env))return {unlimited:true as const};
 const p=await entitlement(env,{id:userId,role:role as 'student',guest:false});
 return p.active?{unlimited:true as const}:{unlimited:false as const};
}

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const s=await state(env,a.user.id,a.user.role);
 if(s.unlimited)return json({unlimited:true,limit:null,used:0},200,noStore);
 const r=await env.DB.prepare(`SELECT count FROM practice_usage WHERE user_id=? AND day=?`).bind(a.user.id,today()).first<{count:number}>();
 return json({unlimited:false,limit:FREE.practicePerDay,used:r?.count||0},200,noStore);
};

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 if(!await underLimit(env,'practice:'+a.user.id,240,60))return json({error:'rate_limited'},429,noStore);
 const b=await body(request);if('res' in b)return b.res;
 const n=b.data.n;
 if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>FREE.practicePerDay)return json({error:'bad_count'},400,noStore);
 const s=await state(env,a.user.id,a.user.role);
 if(s.unlimited)return json({unlimited:true,limit:null,used:0},200,noStore);
 const day=today();
 // Atomic: the allowance is taken only when it fits.
 const r=await env.DB.prepare(
  `INSERT INTO practice_usage (user_id,day,count) VALUES (?1,?2,?3)
   ON CONFLICT (user_id,day) DO UPDATE SET count=count+?3 WHERE count+?3<=?4 RETURNING count`
 ).bind(a.user.id,day,n,FREE.practicePerDay).first<{count:number}>();
 if(r)return json({unlimited:false,limit:FREE.practicePerDay,used:r.count},200,noStore);
 const used=(await env.DB.prepare(`SELECT count FROM practice_usage WHERE user_id=? AND day=?`).bind(a.user.id,day).first<{count:number}>())?.count||0;
 return proRequired('practice',{limit:FREE.practicePerDay,used});
};
