import {sessionUser} from '../_lib/auth';
import {isAdminEmail} from '../_lib/admin';
import {json,type Env} from '../_lib/db';
import {decodeStored} from '../_lib/photo';

const notFound=()=>json({error:'not_found'},404,'no-store');

// Serves a profile photo. Anyone may load it when the profile is public (the same rule as the doctors list: a dentist who
// asked to be listed and was verified, not suspended); otherwise only the owner and the app owner (who verifies it) can.
// `v` must be the current photo_at, so each URL names one image and can be cached for a year.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const url=new URL(request.url);
 const id=url.searchParams.get('u')||'',v=url.searchParams.get('v')||'';
 if(!/^[A-Za-z0-9-]{1,64}$/.test(id)||!v||v.length>40)return notFound();
 const row=await env.DB.prepare(
  `SELECT photo,photo_at,(role='dentist' AND publish_requested=1 AND verified_at IS NOT NULL AND suspended_at IS NULL) AS public FROM users WHERE id=? AND photo IS NOT NULL`
 ).bind(id).first<{photo:string;photo_at:string;public:number}>();
 if(!row||row.photo_at!==v)return notFound();
 let shared=!!row.public;
 if(!shared){
  const user=await sessionUser(env,request).catch(()=>null);
  shared=!!user&&(user.id===id||isAdminEmail(env,user.email));
 }
 if(!shared)return notFound();
 const img=decodeStored(row.photo);
 if(!img)return notFound();
 // Only public photos may sit in shared caches; the owner's own unpublished photo stays private to their browser.
 return new Response(img.bytes,{headers:{'content-type':img.type,'cache-control':row.public?'public, max-age=31536000, immutable':'private, max-age=31536000, immutable','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'",'cross-origin-resource-policy':'cross-origin'}});
};
