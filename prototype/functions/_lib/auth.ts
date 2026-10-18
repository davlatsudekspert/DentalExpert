import {json,type Env} from './db';

export const ROLES=['patient','dentist','teacher','student'] as const;
export type Role=typeof ROLES[number];
export const COOKIE='de_session';
/** Native app WebViews are cross-site, so they authenticate with a bearer token instead of the cookie. */
export const NATIVE_ORIGINS=new Set(['https://localhost','capacitor://localhost','http://localhost']);
export const isNativeClient=(request:Request)=>request.headers.get('x-client')==='native';
export const bearerToken=(request:Request)=>{const m=(request.headers.get('authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{20,100})$/);return m?m[1]:null};
export const sessionToken=(request:Request)=>bearerToken(request)||readCookie(request,COOKIE);
const SESSION_DAYS=30;
const enc=new TextEncoder();
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');

export const sha256=async(v:string)=>hex(await crypto.subtle.digest('SHA-256',enc.encode(v)));
export async function hmac(secret:string,msg:string){
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,enc.encode(msg)));
}
export const timingSafeEqual=(a:string,b:string)=>{
 if(a.length!==b.length)return false;
 let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
 return d===0;
};
export const randomToken=()=>{const b=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
export function randomCode(){
 // Rejection sampling keeps the six digits uniform.
 const limit=Math.floor(0xffffffff/1_000_000)*1_000_000;
 for(;;){const n=crypto.getRandomValues(new Uint32Array(1))[0];if(n<limit)return String(n%1_000_000).padStart(6,'0')}
}

export const isLocal=(request:Request)=>['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname);
/** Dev echo returns the code in the response; it only ever works on localhost, whatever the env says. */
export const devEcho=(env:Env,request:Request)=>env.AUTH_DEV_ECHO==='1'&&isLocal(request);
export const authEnabled=(env:Env,request:Request)=>!!env.AUTH_SECRET&&(!!env.RESEND_API_KEY||devEcho(env,request));

export const normalizeEmail=(v:unknown)=>{
 if(typeof v!=='string')return null;
 const e=v.trim().toLowerCase();
 // The guest placeholder domain is reserved: nobody can request a code for it or sign in to a guest that way.
 return e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)&&!e.endsWith('@guest.invalid')?e:null;
};

/** State-changing requests must be JSON and, when the browser sends Origin, same-origin. */
export function guardPost(request:Request){
 if(!(request.headers.get('content-type')||'').includes('application/json'))return json({error:'json_required'},415,'no-store');
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin&&!NATIVE_ORIGINS.has(origin))return json({error:'bad_origin'},403,'no-store');
 return null;
}

export function readCookie(request:Request,name:string){
 for(const part of (request.headers.get('cookie')||'').split(';')){
  const [k,...v]=part.trim().split('=');
  if(k===name)return v.join('=');
 }
 return null;
}
export const cookieHeader=(request:Request,value:string,maxAge:number)=>
 `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isLocal(request)?'':'; Secure'}`;

export type SessionUser={id:string;guest:boolean;email:string;name:string|null;role:Role;countryCode:string|null;cityId:string|null;phone:string|null;workplace:string|null;bio:string|null;specialty:string|null;telegram:string|null;instagram:string|null;publicEmail:string|null;address:string|null;mapUrl:string|null;publishRequested:boolean;verified:boolean};

/** A class-only guest session (QR quick test) is accepted only here; every other endpoint treats it as signed out. */
const GUEST_PATHS=/^\/api\/(classroom\/(groups|join|quick|start|submit|progress|assignments|topics)|auth\/(me|logout|account))$/;
export const GUEST_DAYS=180;
export const guestEmail=(id:string)=>`guest-${id}@guest.invalid`;
export const isGuestEmail=(e:string)=>e.endsWith('@guest.invalid');

export async function sessionUser(env:Env,request:Request):Promise<SessionUser|null>{
 const token=sessionToken(request);
 if(!token)return null;
 const row=await env.DB.prepare(
  `SELECT u.id,u.guest,u.email,u.name,u.role,u.country_code,u.city_id,u.phone,u.workplace,u.bio,u.specialty,u.telegram,u.instagram,u.public_email,u.address,u.map_url,u.publish_requested,u.verified_at FROM sessions s JOIN users u ON u.id=s.user_id
   WHERE s.token_hash=? AND s.expires_at>datetime('now') AND u.suspended_at IS NULL`
 ).bind(await sha256(token)).first<Record<string,string|number|null>>();
 if(row?.guest&&!GUEST_PATHS.test(new URL(request.url).pathname))return null;
 return row?{id:row.id as string,guest:!!row.guest,email:row.email as string,name:row.name as string|null,role:row.role as Role,countryCode:row.country_code as string|null,cityId:row.city_id as string|null,phone:row.phone as string|null,workplace:row.workplace as string|null,bio:row.bio as string|null,specialty:row.specialty as string|null,telegram:row.telegram as string|null,instagram:row.instagram as string|null,publicEmail:row.public_email as string|null,address:row.address as string|null,mapUrl:row.map_url as string|null,publishRequested:!!row.publish_requested,verified:!!row.verified_at}:null;
}

export async function createSession(env:Env,request:Request,userId:string,days=SESSION_DAYS){
 const token=randomToken();
 await env.DB.prepare(`INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,datetime('now','+${days} days'))`)
  .bind(await sha256(token),userId).run();
 return {token,cookie:cookieHeader(request,token,days*86400)};
}

/** Signing in (email code, Google, Apple) from a device that holds a guest session keeps that guest's groups and
 * results: memberships and submissions move to the real account and the guest is deleted. Teachers never take them. */
async function adoptGuest(env:Env,request:Request,userId:string,role:unknown){
 const token=sessionToken(request);
 if(!token)return;
 const g=await env.DB.prepare(`SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND u.guest=1 AND s.expires_at>datetime('now')`).bind(await sha256(token)).first<{id:string}>();
 if(!g||g.id===userId)return;
 // A teacher signing in on a student's device ends that guest session instead (its data expires with the guest).
 if(role==='teacher'||role==='dentist'){await env.DB.prepare(`DELETE FROM sessions WHERE token_hash=?`).bind(await sha256(token)).run();return}
 // Only groups the account is not in yet move over, with their results; for groups it already belongs to the guest's
 // attempts are dropped, so a student cannot keep the best of several tries under their real name.
 await env.DB.batch([
  env.DB.prepare(`UPDATE class_submissions SET user_id=? WHERE user_id=? AND assignment_id IN (SELECT a.id FROM class_assignments a JOIN class_members m ON m.group_id=a.group_id
    WHERE m.user_id=? AND a.group_id NOT IN (SELECT group_id FROM class_members WHERE user_id=?) AND a.group_id NOT IN (SELECT id FROM class_groups WHERE teacher_id=?))`).bind(userId,g.id,g.id,userId,userId),
  env.DB.prepare(`INSERT OR IGNORE INTO class_members (group_id,user_id,member_no,nickname,joined_at) SELECT m.group_id,?,m.member_no,m.nickname,m.joined_at FROM class_members m
   WHERE m.user_id=? AND m.group_id NOT IN (SELECT id FROM class_groups WHERE teacher_id=?)`).bind(userId,g.id,userId),
  env.DB.prepare(`DELETE FROM users WHERE id=? AND guest=1`).bind(g.id)
 ]);
}

/** Profile shape returned by every sign-in endpoint. */
export const USER_COLUMNS='id,email,name,role,country_code,city_id,phone,workplace,bio,specialty,telegram,instagram,public_email,address,map_url,publish_requested,verified_at';
export const profileOf=(u:Record<string,string|number|null>)=>({id:u.id,email:u.email,name:u.name,role:u.role,countryCode:u.country_code,cityId:u.city_id,phone:u.phone,workplace:u.workplace,bio:u.bio,specialty:u.specialty,telegram:u.telegram,instagram:u.instagram,publicEmail:u.public_email,address:u.address,mapUrl:u.map_url,publishRequested:!!u.publish_requested,verified:!!u.verified_at});

/** Opens a session: native clients get the token in the body (stored on the device); browsers get an HttpOnly cookie. */
export async function signedIn(env:Env,request:Request,user:Record<string,string|number|null>){
 const blocked=await env.DB.prepare(`SELECT suspended_at FROM users WHERE id=?`).bind(user.id).first<{suspended_at:string|null}>();
 if(blocked?.suspended_at)return json({error:'suspended'},403,'no-store');
 await adoptGuest(env,request,String(user.id),user.role).catch(()=>{});
 const session=await createSession(env,request,String(user.id));
 const profile=profileOf(user);
 if(isNativeClient(request))return json({user:profile,token:session.token},200,'no-store');
 const res=json({user:profile},200,'no-store');
 res.headers.append('set-cookie',session.cookie);
 return res;
}

const mail={
 uz:{subject:'Dental Expert tasdiqlash kodi',body:(c:string)=>`Dental Expert tasdiqlash kodingiz: ${c}\nKod 10 daqiqa amal qiladi. Siz so‘ramagan bo‘lsangiz, bu xatni e’tiborsiz qoldiring.`},
 ru:{subject:'Код подтверждения Dental Expert',body:(c:string)=>`Ваш код подтверждения Dental Expert: ${c}\nКод действует 10 минут. Если вы его не запрашивали, проигнорируйте письмо.`},
 en:{subject:'Your Dental Expert verification code',body:(c:string)=>`Your Dental Expert verification code is ${c}\nIt expires in 10 minutes. If you did not request it, ignore this email.`}
};
export async function sendCodeEmail(env:Env,to:string,code:string,lang:string){
 const m=Object.hasOwn(mail,lang)?mail[lang as keyof typeof mail]:mail.en;
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},
  body:JSON.stringify({from:env.AUTH_FROM||'Dental Expert <onboarding@resend.dev>',to:[to],subject:m.subject,text:m.body(code)})
 });
 return res.ok;
}
