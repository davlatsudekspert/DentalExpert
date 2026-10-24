import {json,type Env} from '../../_lib/db';
import {entitlement,proEnabled,proRequired} from '../../_lib/entitlement';
import {FREE} from '../../../src/proConfig';
import {body,clean,needUser,newCode,newId,noStore} from '../../_lib/classroom';

type Row=Record<string,unknown>;
const MAX_GROUPS=20;

// GET: teachers get the groups they run, everyone else the groups they joined.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const own=user.role==='teacher'||user.role==='dentist';
 const {results}=own
  ?await env.DB.prepare(
    `SELECT g.id,g.name,g.code,g.created_at,(SELECT COUNT(*) FROM class_members m WHERE m.group_id=g.id) AS members
     FROM class_groups g WHERE g.teacher_id=? ORDER BY g.created_at DESC`).bind(user.id).all<Row>()
  :await env.DB.prepare(
    `SELECT g.id,g.name,u.name AS teacher_name,m.member_no,m.nickname FROM class_members m
     JOIN class_groups g ON g.id=m.group_id JOIN users u ON u.id=g.teacher_id WHERE m.user_id=? ORDER BY m.joined_at DESC`).bind(user.id).all<Row>();
 return json({role:own?'owner':'member',groups:results.map(r=>own
  ?{id:r.id,name:r.name,code:r.code,members:r.members,createdAt:r.created_at}
  :{id:r.id,name:r.name,teacher:r.teacher_name||null,myNo:r.member_no,myNickname:r.nickname})},200,noStore);
};

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 if(user.role!=='teacher'&&user.role!=='dentist')return json({error:'teacher_only'},403,noStore);
 const b=await body(request);if('res' in b)return b.res;
 const name=clean(b.data.name,60);
 if(name.length<2)return json({error:'name_required'},400,noStore);
  // Free tier: one group. Pro (trial, paid, admin grant) keeps the usual MAX_GROUPS. Existing groups are never removed.
 let cap=MAX_GROUPS;
 if(proEnabled(env)&&!(await entitlement(env,user)).active)cap=FREE.groups;
 for(let i=0;i<5;i++){
  const id=newId(),code=newCode();
  try{
   const r=await env.DB.prepare(`INSERT INTO class_groups (id,teacher_id,name,code) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM class_groups WHERE teacher_id=?)<?`).bind(id,user.id,name,code,user.id,cap).run();
   if(!r.meta.changes)return cap<MAX_GROUPS?proRequired('groups',{limit:cap}):json({error:'too_many_groups'},429,noStore);
   return json({group:{id,name,code,members:0}},201,noStore);
  }catch{/* code collision, retry */}
 }
 return json({error:'try_again'},500,noStore);
};
