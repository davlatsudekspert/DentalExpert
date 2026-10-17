import {sessionUser,type SessionUser} from './auth';
import {json,type Env} from './db';

/** The app owner. ADMIN_EMAILS (comma-separated secret) overrides this list. Admins sign in with the normal email code, so the address is always verified. */
const DEFAULT_ADMINS=['davlatsudekspert@gmail.com'];
export const adminEmails=(env:Env&{ADMIN_EMAILS?:string})=>(env.ADMIN_EMAILS?env.ADMIN_EMAILS.split(','):DEFAULT_ADMINS).map(e=>e.trim().toLowerCase()).filter(Boolean);
export const isAdminEmail=(env:Env,email:string)=>adminEmails(env as Env&{ADMIN_EMAILS?:string}).includes(email.toLowerCase());

/** Resolves the signed-in admin or a ready 401/403 response. */
export async function needAdmin(env:Env,request:Request):Promise<{user:SessionUser}|{res:Response}>{
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user)return {res:json({error:'unauthorized'},401,'no-store')};
 if(!isAdminEmail(env,user.email))return {res:json({error:'forbidden'},403,'no-store')};
 return {user};
}
