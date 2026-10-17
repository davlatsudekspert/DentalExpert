import {guardPost,sessionUser,type SessionUser} from './auth';
import {json,type Env} from './db';

export const noStore='no-store';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode=()=>{const b=crypto.getRandomValues(new Uint8Array(6));return [...b].map(x=>ALPHABET[x%ALPHABET.length]).join('')};
export const newId=()=>crypto.randomUUID();
export const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';

/** Resolves the signed-in user or a ready 401 response. */
export async function needUser(env:Env,request:Request):Promise<{user:SessionUser}|{res:Response}>{
 const user=await sessionUser(env,request).catch(()=>null);
 return user?{user}:{res:json({error:'unauthorized'},401,noStore)};
}

/** Parses a guarded JSON body. */
export async function body(request:Request):Promise<{data:Record<string,unknown>}|{res:Response}>{
 const g=guardPost(request);if(g)return {res:g};
 try{const data=await request.json();return data&&typeof data==='object'?{data:data as Record<string,unknown>}:{res:json({error:'bad_json'},400,noStore)}}
 catch{return {res:json({error:'bad_json'},400,noStore)}}
}

/** 'owner' when the user teaches the group, 'member' when they joined it, else null. */
export async function groupRole(env:Env,groupId:string,userId:string):Promise<'owner'|'member'|null>{
 const r=await env.DB.prepare(
  `SELECT g.teacher_id AS t, (SELECT 1 FROM class_members m WHERE m.group_id=g.id AND m.user_id=?) AS m FROM class_groups g WHERE g.id=?`
 ).bind(userId,groupId).first<{t:string;m:number|null}>();
 if(!r)return null;
 return r.t===userId?'owner':r.m?'member':null;
}

/** Fixed-window counter in D1; returns false once `limit` is exceeded inside the window. */
export async function underLimit(env:Env,bucket:string,limit:number,windowSec:number){
 const now=Date.now(),win=windowSec*1000;
 const r=await env.DB.prepare(
  `INSERT INTO rate_limits (bucket,window_start,count) VALUES (?1,?2,1)
   ON CONFLICT (bucket) DO UPDATE SET
    count=CASE WHEN rate_limits.window_start<=?3 THEN 1 ELSE rate_limits.count+1 END,
    window_start=CASE WHEN rate_limits.window_start<=?3 THEN ?2 ELSE rate_limits.window_start END
   RETURNING count`
 ).bind(bucket,now,now-win).first<{count:number}>();
 return (r?.count||0)<=limit;
}
/** Optional nickname: 2–24 letters/digits/space/._'- ; anything else (emails, links) is rejected. */
export const nickname=(v:unknown):string|null|false=>{
 if(v==null||v==='')return null;
 if(typeof v!=='string')return false;
 const t=v.trim().replace(/\s+/g,' ');
 if(!t)return null;
 return /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{0,22}[\p{L}\p{N}.]$/u.test(t)?t:false;
};
