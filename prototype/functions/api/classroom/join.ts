import {json,type Env} from '../../_lib/db';
import {addMember,body,clean,codeGuess,isProfane,needUser,nickname,noStore,underLimit} from '../../_lib/classroom';

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 // Join codes are guessable in principle (6 chars), so attempts are limited per account.
 if(!await underLimit(env,'join:'+user.id,10,900))return json({error:'rate_limited'},429,noStore);
 const b=await body(request);if('res' in b)return b.res;
 const code=clean(b.data.code,12).toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length!==6)return json({error:'bad_code'},400,noStore);
 if(user.role==='teacher'||user.role==='dentist')return json({error:'teacher_cannot_join'},400,noStore);
 const nick=nickname(b.data.nickname);
 if(nick===false)return json({error:typeof b.data.nickname==='string'&&isProfane(b.data.nickname)?'nickname_rejected':'bad_nickname'},400,noStore);
 // Per IP as well, so free guest accounts cannot multiply the per-account limit.
 const guess=await codeGuess(env,request);
 if(!guess.ok)return json({error:'rate_limited'},429,noStore);
 const g=await env.DB.prepare(`SELECT id,name,teacher_id FROM class_groups WHERE code=?`).bind(code).first<{id:string;name:string;teacher_id:string}>();
 if(!g)return json({error:'not_found'},404,noStore);
 await guess.hit();
 if(g.teacher_id===user.id)return json({error:'own_group'},400,noStore);
 const r=await addMember(env,g.id,user.id,nick);
 if(r!=='ok')return json({error:r},409,noStore);
 return json({group:{id:g.id,name:g.name}},200,noStore);
};

// DELETE ?groupId=… : a student leaves a group.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const id=new URL(request.url).searchParams.get('groupId')||'';
 // Leaving also removes the member's answers in that group (the privacy policy promises this).
 await env.DB.batch([
  env.DB.prepare(`DELETE FROM class_submissions WHERE user_id=? AND assignment_id IN (SELECT id FROM class_assignments WHERE group_id=?)`).bind(a.user.id,id),
  env.DB.prepare(`DELETE FROM class_members WHERE group_id=? AND user_id=?`).bind(id,a.user.id),
  // A class-only guest with no group left has nothing to keep.
  env.DB.prepare(`DELETE FROM users WHERE id=? AND guest=1 AND NOT EXISTS (SELECT 1 FROM class_members WHERE user_id=?)`).bind(a.user.id,a.user.id)
 ]);
 return json({ok:true},200,noStore);
};
