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
 return e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)?e:null;
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

export type SessionUser={id:string;email:string;name:string|null;role:Role;countryCode:string|null;cityId:string|null};

export async function sessionUser(env:Env,request:Request):Promise<SessionUser|null>{
 const token=sessionToken(request);
 if(!token)return null;
 const row=await env.DB.prepare(
  `SELECT u.id,u.email,u.name,u.role,u.country_code,u.city_id FROM sessions s JOIN users u ON u.id=s.user_id
   WHERE s.token_hash=? AND s.expires_at>datetime('now')`
 ).bind(await sha256(token)).first<Record<string,string|null>>();
 return row?{id:row.id!,email:row.email!,name:row.name,role:row.role as Role,countryCode:row.country_code,cityId:row.city_id}:null;
}

export async function createSession(env:Env,request:Request,userId:string){
 const token=randomToken();
 await env.DB.prepare(`INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,datetime('now','+${SESSION_DAYS} days'))`)
  .bind(await sha256(token),userId).run();
 return {token,cookie:cookieHeader(request,token,SESSION_DAYS*86400)};
}

const mail={
 uz:{subject:'Dental Expert tasdiqlash kodi',body:(c:string)=>`Dental Expert tasdiqlash kodingiz: ${c}\nKod 10 daqiqa amal qiladi. Siz so‘ramagan bo‘lsangiz, bu xatni e’tiborsiz qoldiring.`},
 ru:{subject:'Код подтверждения Dental Expert',body:(c:string)=>`Ваш код подтверждения Dental Expert: ${c}\nКод действует 10 минут. Если вы его не запрашивали, проигнорируйте письмо.`},
 en:{subject:'Your Dental Expert verification code',body:(c:string)=>`Your Dental Expert verification code is ${c}\nIt expires in 10 minutes. If you did not request it, ignore this email.`}
};
export async function sendCodeEmail(env:Env,to:string,code:string,lang:string){
 const m=mail[lang as keyof typeof mail]||mail.en;
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},
  body:JSON.stringify({from:env.AUTH_FROM||'Dental Expert <onboarding@resend.dev>',to:[to],subject:m.subject,text:m.body(code)})
 });
 return res.ok;
}
