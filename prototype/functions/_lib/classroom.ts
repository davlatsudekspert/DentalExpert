import {GUEST_DAYS,guardPost,sessionToken,sha256,sessionUser,type SessionUser} from './auth';
import {isProfane} from './profanity';
import {json,type Env} from './db';

export const noStore='no-store';
/** Minutes a started student may still submit after the time limit or after the teacher finishes a test. */
export const GRACE_MIN=2;
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode=()=>{const b=crypto.getRandomValues(new Uint8Array(6));return [...b].map(x=>ALPHABET[x%ALPHABET.length]).join('')};
export const newId=()=>crypto.randomUUID();
export const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';

/** Resolves the signed-in user or a ready 401 response. */
export async function needUser(env:Env,request:Request):Promise<{user:SessionUser}|{res:Response}>{
 const user=await sessionUser(env,request).catch(()=>null);
 if(user?.guest)await touchGuest(env,request,user.id).catch(()=>{});
 return user?{user}:{res:json({error:'unauthorized'},401,noStore)};
}

/** A guest who keeps using the classroom stays alive: at most once a day the 180-day idle clock and the session restart. */
async function touchGuest(env:Env,request:Request,id:string){
 const r=await env.DB.prepare(`UPDATE users SET last_seen_at=datetime('now') WHERE id=? AND guest=1 AND (last_seen_at IS NULL OR last_seen_at<datetime('now','-1 day'))`).bind(id).run();
 const token=sessionToken(request);
 if(r.meta.changes&&token)await env.DB.prepare(`UPDATE sessions SET expires_at=datetime('now','+${GUEST_DAYS} days') WHERE token_hash=?`).bind(await sha256(token)).run();
}

/** Deletes guests idle for 180 days (their memberships, answers and sessions go with them by cascade). Called opportunistically. */
export const pruneGuests=(env:Env)=>env.DB.prepare(`DELETE FROM users WHERE id IN (SELECT id FROM users WHERE guest=1 AND COALESCE(last_seen_at,created_at)<datetime('now','-${GUEST_DAYS} days') LIMIT 50)`).run();

/** True when another member of the group already uses this nickname (case-insensitive). */
export async function nickTaken(env:Env,groupId:string,nick:string,userId:string){
 return !!await env.DB.prepare(`SELECT 1 AS x FROM class_members WHERE group_id=? AND user_id<>? AND lower(nickname)=lower(?)`).bind(groupId,userId,nick).first();
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

import {underLimit as underLimitImpl} from './ratelimit';
export {underLimit} from './ratelimit';
export {isProfane} from './profanity';
/** Optional nickname: 2–24 letters/digits/space/._'- ; anything else (emails, links) is rejected. */
export const nickname=(v:unknown):string|null|false=>{
 if(v==null||v==='')return null;
 if(typeof v!=='string')return false;
 const t=v.trim().replace(/\s+/g,' ');
 if(!t)return null;
 if(/^(student|talaba|студент)\s*\d+$/iu.test(t))return false; // would look like the numbered fallback label
 if(isProfane(t))return false;
 return /^[\p{L}\p{N}][\p{L}\p{N} ._'‘’-]{0,22}[\p{L}\p{N}.]$/u.test(t)?t:false;
};

export const MAX_MEMBERS=500;
/** Adds the user to the group (idempotent). The nickname must be free in that group; the check and insert are one
 * statement so two phones cannot take the same name at once. */
export async function addMember(env:Env,groupId:string,userId:string,nick:string|null):Promise<'ok'|'nick_taken'|'group_full'>{
 if(await env.DB.prepare(`SELECT 1 AS x FROM class_members WHERE group_id=? AND user_id=?`).bind(groupId,userId).first())return 'ok';
 const n=await env.DB.prepare(`SELECT COUNT(*) AS n FROM class_members WHERE group_id=?`).bind(groupId).first<{n:number}>();
 if((n?.n||0)>=MAX_MEMBERS)return 'group_full';
 if(nick&&await nickTaken(env,groupId,nick,userId))return 'nick_taken';
 const no=await env.DB.prepare(`UPDATE class_groups SET next_member_no=next_member_no+1 WHERE id=? RETURNING next_member_no-1 AS no`).bind(groupId).first<{no:number}>();
 const r=await env.DB.prepare(`INSERT OR IGNORE INTO class_members (group_id,user_id,member_no,nickname) SELECT ?1,?2,?3,?4
   WHERE ?4 IS NULL OR NOT EXISTS (SELECT 1 FROM class_members WHERE group_id=?1 AND lower(nickname)=lower(?4))`).bind(groupId,userId,no?.no||1,nick).run();
 return r.meta.changes?'ok':'nick_taken';
}

/** Client IP for rate limits, hashed. IPv6 is bucketed by /64, after expanding "::" so the prefix is really the first four groups. */
export async function ipKey(env:Env,request:Request){
 const raw=request.headers.get('cf-connecting-ip')||'local';
 let ip=raw;
 if(raw.includes(':')){const [a,b='']=raw.split('::');const h=a?a.split(':'):[],t=b?b.split(':'):[];const full=raw.includes('::')?[...h,...Array(8-h.length-t.length).fill('0'),...t]:raw.split(':');ip=full.slice(0,4).map(x=>x.toLowerCase().replace(/^0+(?=.)/,'')).join(':')}
 return sha256(ip+(env.AUTH_SECRET||''));
}
/** Join-code guessing guard shared by join and quick join: every lookup takes a slot first (so parallel requests
 * cannot overrun it) and a hit gives it back, so only wrong codes count — 30 per 15 minutes per IP. */
export async function codeGuess(env:Env,request:Request){
 const bucket='codebad:'+await ipKey(env,request);
 const ok=await underLimitImpl(env,bucket,30,900);
 return {ok,hit:()=>env.DB.prepare(`UPDATE rate_limits SET count=MAX(count-1,0) WHERE bucket=?`).bind(bucket).run()};
}
