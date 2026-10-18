import {json,type Env} from '../../_lib/db';
import {groupRole,needUser,noStore} from '../../_lib/classroom';

// DELETE ?groupId=…&no=… : the teacher removes a student (by member number) from the group, with their answers there.
// A class-only guest who is left without any group is deleted altogether.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const url=new URL(request.url);
 const groupId=url.searchParams.get('groupId')||'';
 const no=Number(url.searchParams.get('no'));
 if(!Number.isInteger(no)||no<1)return json({error:'bad_member'},400,noStore);
 if(await groupRole(env,groupId,a.user.id)!=='owner')return json({error:'forbidden'},403,noStore);
 const m=await env.DB.prepare(`SELECT user_id FROM class_members WHERE group_id=? AND member_no=?`).bind(groupId,no).first<{user_id:string}>();
 if(!m)return json({error:'not_found'},404,noStore);
 await env.DB.batch([
  env.DB.prepare(`DELETE FROM class_submissions WHERE user_id=? AND assignment_id IN (SELECT id FROM class_assignments WHERE group_id=?)`).bind(m.user_id,groupId),
  env.DB.prepare(`DELETE FROM class_members WHERE group_id=? AND user_id=?`).bind(groupId,m.user_id),
  env.DB.prepare(`DELETE FROM users WHERE id=? AND guest=1 AND NOT EXISTS (SELECT 1 FROM class_members WHERE user_id=?)`).bind(m.user_id,m.user_id)
 ]);
 return json({ok:true},200,noStore);
};
