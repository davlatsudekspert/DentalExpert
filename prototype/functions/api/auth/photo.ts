import {NATIVE_ORIGINS,guardPost,sessionUser} from '../../_lib/auth';
import {isAdminEmail} from '../../_lib/admin';
import {json,type Env} from '../../_lib/db';
import {parsePhoto,photoUrl} from '../../_lib/photo';
import {underLimit} from '../../_lib/ratelimit';

const MAX_CHANGES=20,WINDOW_S=3600;
const bad=(error:string,status=400)=>json({error},status,'no-store');

// The signed-in user sets or removes their own profile photo. Class-only guests never reach this (sessionUser treats them
// as signed out outside GUEST_PATHS). A new photo is something patients would see, so like a name change it clears the owner's verification
// (the app owner, who is the verifier, keeps theirs).
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const g=guardPost(request);if(g)return g;
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user||user.guest)return bad('unauthorized',401);
 if(!await underLimit(env,'photo:'+user.id,MAX_CHANGES,WINDOW_S))return bad('rate_limited',429);
 let b:Record<string,unknown>;
 try{const raw=await request.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))return bad('bad_json');b=raw as Record<string,unknown>}catch{return bad('bad_json')}
 const p=parsePhoto(b.image);
 if(!p.ok)return bad(p.error,p.error==='too_large'?413:400);
 const keep=isAdminEmail(env,user.email);
 const at=new Date().toISOString();
 await env.DB.prepare(`UPDATE users SET photo=?,photo_at=?,verified_at=${keep?'verified_at':'NULL'} WHERE id=?`).bind(p.dataUrl,at,user.id).run();
 return json({user:{...user,verified:keep?user.verified:false,photoUrl:photoUrl(user.id,at)}},200,'no-store');
};

export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin&&!NATIVE_ORIGINS.has(origin))return bad('bad_origin',403);
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user||user.guest)return bad('unauthorized',401);
 if(!await underLimit(env,'photo:'+user.id,MAX_CHANGES,WINDOW_S))return bad('rate_limited',429);
 await env.DB.prepare(`UPDATE users SET photo=NULL,photo_at=NULL WHERE id=?`).bind(user.id).run();
 return json({user:{...user,photoUrl:null}},200,'no-store');
};
