import {GUEST_DAYS,guardPost,sha256,sessionUser,type SessionUser} from './auth';
import {isProfane} from './profanity';
import {json,type Env} from './db';
import {CODE_ALPHABET,checkNick,normalizeCode,normalizeNick} from '../../src/classroomShared';
import {underLimit as underLimitImpl} from './ratelimit';
export {underLimit} from './ratelimit';
export {isProfane} from './profanity';

export const noStore='no-store';
/** Minutes a started student may still submit after the time limit, the deadline, or after the teacher finishes a test. */
export const GRACE_MIN=2;
export const newCode=()=>{const b=crypto.getRandomValues(new Uint8Array(6));return [...b].map(x=>CODE_ALPHABET[x%CODE_ALPHABET.length]).join('')};
export const newId=()=>crypto.randomUUID();
export const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';

/** Resolves the signed-in user or a ready 401 response. Old class-only guest sessions reach only the few read-only
 * classroom paths auth.ts still allows (no new guests are created); they are no longer extended, so they expire. */
export async function needUser(env:Env,request:Request):Promise<{user:SessionUser}|{res:Response}>{
 const user=await sessionUser(env,request).catch(()=>null);
 return user?{user}:{res:json({error:'unauthorized'},401,noStore)};
}

/** Deletes guests idle for 180 days (their memberships, answers and sessions go with them by cascade). Called opportunistically. */
export const pruneGuests=(env:Env)=>env.DB.prepare(`DELETE FROM users WHERE id IN (SELECT id FROM users WHERE guest=1 AND COALESCE(last_seen_at,created_at)<datetime('now','-${GUEST_DAYS} days') LIMIT 50)`).run();

/** A typed join code: 6 characters after normalising, none of 0/O/1/I (codes never contain them, so it was misread). */
export function joinCode(v:unknown):{code:string}|{error:'bad_code'|'ambiguous_code'}{
 const {code,ambiguous}=normalizeCode(clean(v,24));
 if(code.length!==6)return {error:'bad_code'};
 return ambiguous?{error:'ambiguous_code'}:{code};
}

// Older rows may still hold a curly apostrophe; compare them with the normalisation new nicknames get.
const Q="''";
const NICK_SQL=(c:string)=>['’','‘','ʻ','ʼ','`','´','′'].reduce((x,ch)=>`replace(${x},'${ch}','${Q}')`,c);
const nickEq=(col:string,param:string)=>`lower(${NICK_SQL(col)})=lower(${param})`;

/** True when another member of the group already uses this nickname (case-insensitive). */
export async function nickTaken(env:Env,groupId:string,nick:string,userId:string){
 return !!await env.DB.prepare(`SELECT 1 AS x FROM class_members WHERE group_id=? AND user_id<>? AND ${nickEq('nickname','?')}`).bind(groupId,userId,nick).first();
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

/** Optional nickname: 2–24 letters/digits/space/._'- after normalising apostrophes (src/classroomShared.ts); emails,
 * links, emoji, offensive words and "Talaba 7"-like names are rejected (false). */
export const nickname=(v:unknown):string|null|false=>{
 if(v==null||v==='')return null;
 if(typeof v!=='string')return false;
 const t=normalizeNick(v);
 if(!t)return null;
 const c=checkNick(t);
 if(!c.ok||isProfane(c.nick))return false;
 return c.nick;
};
/** The error code for a nickname that nickname() refused. */
export const nickError=(v:unknown)=>typeof v==='string'&&isProfane(normalizeNick(v))?'nickname_rejected':'bad_nickname';

export const MAX_MEMBERS=200;
/** Adds the user to the group (idempotent). The nickname must be free in that group and the group below the cap; both
 * are checked again inside the insert, so two phones cannot take the same name or overrun the cap at once. */
export async function addMember(env:Env,groupId:string,userId:string,nick:string|null):Promise<'ok'|'nick_taken'|'group_full'>{
 if(await env.DB.prepare(`SELECT 1 AS x FROM class_members WHERE group_id=? AND user_id=?`).bind(groupId,userId).first())return 'ok';
 const count=async()=>(await env.DB.prepare(`SELECT COUNT(*) AS n FROM class_members WHERE group_id=?`).bind(groupId).first<{n:number}>())?.n||0;
 if(await count()>=MAX_MEMBERS)return 'group_full';
 if(nick&&await nickTaken(env,groupId,nick,userId))return 'nick_taken';
 const no=await env.DB.prepare(`UPDATE class_groups SET next_member_no=next_member_no+1 WHERE id=? RETURNING next_member_no-1 AS no`).bind(groupId).first<{no:number}>();
 const r=await env.DB.prepare(`INSERT OR IGNORE INTO class_members (group_id,user_id,member_no,nickname) SELECT ?1,?2,?3,?4
   WHERE (?4 IS NULL OR NOT EXISTS (SELECT 1 FROM class_members WHERE group_id=?1 AND ${nickEq('nickname','?4')}))
   AND (SELECT COUNT(*) FROM class_members WHERE group_id=?1)<?5`).bind(groupId,userId,no?.no||1,nick,MAX_MEMBERS).run();
 if(r.meta.changes)return 'ok';
 return await count()>=MAX_MEMBERS?'group_full':'nick_taken';
}

/** Client IP for rate limits, hashed. IPv6 is bucketed by /64, after expanding "::" so the prefix is really the first four groups. */
export async function ipKey(env:Env,request:Request){
 const raw=request.headers.get('cf-connecting-ip')||'local';
 let ip=raw;
 if(raw.includes(':')){const [a,b='']=raw.split('::');const h=a?a.split(':'):[],t=b?b.split(':'):[];const full=raw.includes('::')?[...h,...Array(8-h.length-t.length).fill('0'),...t]:raw.split(':');ip=full.slice(0,4).map(x=>x.toLowerCase().replace(/^0+(?=.)/,'')).join(':')}
 return sha256(ip+(env.AUTH_SECRET||''));
}
/** Join-code guessing guard shared by join and the QR join: every lookup takes a slot first (so parallel requests
 * cannot overrun it) and a hit gives it back, so only wrong codes count — 30 per 15 minutes per IP. */
export async function codeGuess(env:Env,request:Request){
 const bucket='codebad:'+await ipKey(env,request);
 const ok=await underLimitImpl(env,bucket,30,900);
 return {ok,hit:()=>env.DB.prepare(`UPDATE rate_limits SET count=MAX(count-1,0) WHERE bucket=?`).bind(bucket).run()};
}

/** Per-account limits on the test endpoints (requests per 10 minutes). Progress is saved on every answer, so it gets the most. */
export const LIMITS={quick:30,start:40,submit:30,progress:240} as const;
export const limited=async(env:Env,kind:keyof typeof LIMITS,userId:string)=>!await underLimitImpl(env,`${kind}:${userId}`,LIMITS[kind],600);
export const tooMany=()=>json({error:'rate_limited'},429,noStore);

/** SQLite datetime ('YYYY-MM-DD HH:MM:SS', UTC) → ISO with Z for the API. */
export const isoOf=(s:unknown)=>typeof s==='string'&&s?s.replace(' ','T')+'Z':null;
/** A deadline from the client (ISO, any offset) → SQLite UTC text, if it lies between 1 minute and 1 year ahead. */
export function deadlineOf(v:unknown):string|null|false{
 if(v==null||v==='')return null;
 if(typeof v!=='string'||v.length>40)return false;
 const t=Date.parse(v);
 if(!Number.isFinite(t)||t<Date.now()+60_000||t>Date.now()+366*86400_000)return false;
 return new Date(t).toISOString().slice(0,19).replace('T',' ');
}
/** Columns every test-state check needs: minutes since the teacher finished it and since its deadline (null when none). */
export const STATE_SQL=(p='')=>`(julianday('now')-julianday(${p}closed_at))*1440 AS since_close,(julianday('now')-julianday(${p}deadline_at))*1440 AS since_deadline`;
type State={status:unknown;since_close:unknown;since_deadline:unknown;reveal:unknown};
const num=(v:unknown)=>typeof v==='number'?v:null;
/** Over: finished by the teacher or past its deadline. */
export const ended=(a:State)=>a.status==='closed'||(num(a.since_deadline)??-1)>=0;
/** Whether a student who finished may see the right answers: right away ('instant'), once the teacher finished the test
 * ('closed'), or once it was finished or its deadline passed ('deadline') — never during the grace minutes, so the key
 * cannot reach classmates who are still answering. */
export function revealOpen(a:State){
 if(a.reveal==='instant')return true;
 const afterClose=a.status==='closed'&&(num(a.since_close)??0)>GRACE_MIN;
 if(a.reveal==='deadline')return afterClose||(num(a.since_deadline)??-1)>GRACE_MIN;
 return afterClose;
}
export const revealOf=(v:unknown)=>v==='instant'||v==='deadline'?v:'closed';
