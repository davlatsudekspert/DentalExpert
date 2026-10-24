import {ROLES,guardPost,sessionUser,type Role} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {proOf} from '../../_lib/entitlement';
import {underLimit} from '../../_lib/ratelimit';

const MAX_PER_DAY=10;

// PUT {role}: the signed-in user switches their own role (Profil → Tahrirlash → Rolim). Only the four app roles; admin
// rights come from the admin email list (_lib/admin.ts), never from a role, so they cannot be reached here.
// Leaving 'dentist' takes the public dentist listing down: publish_requested=0 and verified_at=NULL, so the person
// drops out of /api/doctors and must ask and be verified again after switching back.
// Groups a teacher owns stay theirs: ownership is checked by owner id (groupRole), so the group pages keep working,
// but listing them as "my groups" and creating new groups need the teacher (or dentist) role again (classroom/groups.ts).
// Guests (old class-only sessions) cannot switch: sessionUser treats them as signed out on this path.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const g=guardPost(request);if(g)return g;
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user)return json({error:'unauthorized'},401,'no-store');
 if(user.guest)return json({error:'guest'},403,'no-store');
 let role:unknown;
 try{role=((await request.json()) as {role?:unknown}|null)?.role}catch{return json({error:'bad_json'},400,'no-store')}
 if(typeof role!=='string'||!ROLES.includes(role as Role))return json({error:'bad_role'},400,'no-store');
 if(role===user.role)return json({user},200,'no-store');
 if(!await underLimit(env,'role:'+user.id,MAX_PER_DAY,86400))return json({error:'rate_limited'},429,'no-store');
 const leaving=user.role==='dentist';
 await env.DB.prepare(
  `UPDATE users SET role=?,publish_requested=CASE WHEN ?=1 THEN 0 ELSE publish_requested END,verified_at=CASE WHEN ?=1 THEN NULL ELSE verified_at END WHERE id=?`
 ).bind(role,leaving?1:0,leaving?1:0,user.id).run();
 const pro=await proOf(env,{id:user.id,role:role as Role,guest:false}).catch(()=>undefined);
 return json({user:{...user,role,...(pro?{pro}:{}),...(leaving?{publishRequested:false,verified:false}:{})}},200,'no-store');
};
