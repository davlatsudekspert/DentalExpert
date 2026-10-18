import {isAdminEmail,needAdmin} from '../../_lib/admin';
import {body,clean} from '../../_lib/classroom';
import {json,type Env} from '../../_lib/db';
import {photoUrl} from '../../_lib/photo';

const ROLES=['patient','dentist','teacher','student'];

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const url=new URL(request.url);
 const q=clean(url.searchParams.get('q'),80).toLowerCase();
 const offset=Math.max(0,Number(url.searchParams.get('offset'))||0);
 const like='%'+q.replace(/[%_\\]/g,m=>'\\'+m)+'%';
 const {results}=await env.DB.prepare(
  `SELECT id,email,name,role,country_code,city_id,created_at,suspended_at,phone,workplace,specialty,telegram,instagram,public_email,address,map_url,publish_requested,verified_at,photo_at FROM users
   WHERE (?1='' OR lower(email) LIKE ?2 ESCAPE '\\' OR lower(COALESCE(name,'')) LIKE ?2 ESCAPE '\\')
   ORDER BY created_at DESC LIMIT 50 OFFSET ?3`
 ).bind(q,like,offset).all<Record<string,unknown>>();
 return json({users:results.map(r=>({id:r.id,email:r.email,name:r.name,role:r.role,countryCode:r.country_code,cityId:r.city_id,createdAt:r.created_at,suspended:!!r.suspended_at,admin:isAdminEmail(env,String(r.email)),publishRequested:!!r.publish_requested,verified:!!r.verified_at,profile:r.role==='dentist'?{phone:r.phone,workplace:r.workplace,specialty:r.specialty,telegram:r.telegram,instagram:r.instagram,email:r.public_email,address:r.address,map:r.map_url,city:r.city_id,photoUrl:photoUrl(r.id,r.photo_at)}:null}))},200,'no-store');
};

// PUT {id, role?, suspended?}: change a role or suspend/restore an account. Admins cannot be suspended.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const a=await needAdmin(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const id=clean(b.data.id,60);
 const target=await env.DB.prepare(`SELECT email FROM users WHERE id=?`).bind(id).first<{email:string}>();
 if(!target)return json({error:'not_found'},404,'no-store');
 if(typeof b.data.role==='string'){
  if(!ROLES.includes(b.data.role))return json({error:'bad_role'},400,'no-store');
  await env.DB.prepare(`UPDATE users SET role=? WHERE id=?`).bind(b.data.role,id).run();
 }
 if(typeof b.data.suspended==='boolean'){
  if(isAdminEmail(env,target.email))return json({error:'cannot_suspend_admin'},400,'no-store');
  await env.DB.prepare(`UPDATE users SET suspended_at=${b.data.suspended?`datetime('now')`:'NULL'} WHERE id=?`).bind(id).run();
  if(b.data.suspended)await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(id).run();
 }
 if(typeof b.data.verified==='boolean'){
  // Only a dentist who asked to be listed can be verified; un-verifying always works.
  const r=await env.DB.prepare(`UPDATE users SET verified_at=${b.data.verified?`datetime('now')`:'NULL'} WHERE id=? AND role='dentist' AND (?=0 OR publish_requested=1)`).bind(id,b.data.verified?1:0).run();
  if(!r.meta.changes)return json({error:'not_publishable'},400,'no-store');
 }
 return json({ok:true},200,'no-store');
};
