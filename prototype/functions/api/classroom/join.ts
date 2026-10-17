import {json,type Env} from '../../_lib/db';
import {body,clean,needUser,nickname,noStore,underLimit} from '../../_lib/classroom';

const MAX_MEMBERS=500;

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 // Join codes are guessable in principle (6 chars), so attempts are limited per account.
 if(!await underLimit(env,'join:'+user.id,10,900))return json({error:'rate_limited'},429,noStore);
 const b=await body(request);if('res' in b)return b.res;
 const code=clean(b.data.code,12).toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length!==6)return json({error:'bad_code'},400,noStore);
 const nick=nickname(b.data.nickname);
 if(nick===false)return json({error:'bad_nickname'},400,noStore);
 const g=await env.DB.prepare(`SELECT id,name,teacher_id FROM class_groups WHERE code=?`).bind(code).first<{id:string;name:string;teacher_id:string}>();
 if(!g)return json({error:'not_found'},404,noStore);
 if(g.teacher_id===user.id)return json({error:'own_group'},400,noStore);
 const has=await env.DB.prepare(`SELECT 1 AS x FROM class_members WHERE group_id=? AND user_id=?`).bind(g.id,user.id).first();
 if(has)return json({group:{id:g.id,name:g.name}},200,noStore);
 const n=await env.DB.prepare(`SELECT COUNT(*) AS n FROM class_members WHERE group_id=?`).bind(g.id).first<{n:number}>();
 if((n?.n||0)>=MAX_MEMBERS)return json({error:'group_full'},409,noStore);
 const no=await env.DB.prepare(`UPDATE class_groups SET next_member_no=next_member_no+1 WHERE id=? RETURNING next_member_no-1 AS no`).bind(g.id).first<{no:number}>();
 await env.DB.prepare(`INSERT OR IGNORE INTO class_members (group_id,user_id,member_no,nickname) VALUES (?,?,?,?)`).bind(g.id,user.id,no?.no||1,nick).run();
 return json({group:{id:g.id,name:g.name}},200,noStore);
};

// DELETE ?groupId=… : a student leaves a group.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const id=new URL(request.url).searchParams.get('groupId')||'';
 await env.DB.prepare(`DELETE FROM class_members WHERE group_id=? AND user_id=?`).bind(id,a.user.id).run();
 return json({ok:true},200,noStore);
};
