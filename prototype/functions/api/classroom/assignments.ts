import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,needUser,newId,noStore} from '../../_lib/classroom';

type Row=Record<string,unknown>;
const MAX_ASSIGNMENTS=100;
const keyOf=(v:unknown)=>Array.isArray(v)&&v.length>=1&&v.length<=50&&v.every(x=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<=9)?v as number[]:null;

// GET ?groupId=… : members see their own submission status, the teacher sees counts and a roster by number/nickname.
// The answer key never leaves the server.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const url=new URL(request.url);
 const groupId=url.searchParams.get('groupId')||'';
 const role=await groupRole(env,groupId,user.id);
 if(!role)return json({error:'forbidden'},403,noStore);
 const {results}=await env.DB.prepare(
  `SELECT a.id,a.kind,a.title,a.body,a.deck_id,a.status,a.due_date,a.created_at,a.answer_key,
     (SELECT COUNT(*) FROM class_submissions s WHERE s.assignment_id=a.id) AS submitted,
     s.answer AS my_answer,s.score AS my_score,s.total AS my_total
   FROM class_assignments a LEFT JOIN class_submissions s ON s.assignment_id=a.id AND s.user_id=?
   WHERE a.group_id=? ORDER BY a.created_at DESC`
 ).bind(user.id,groupId).all<Row>();
 const assignments=results.map(r=>({id:r.id,kind:r.kind,title:r.title,body:r.body,deckId:r.deck_id,status:r.status,dueDate:r.due_date,createdAt:r.created_at,
  questionCount:r.answer_key?(JSON.parse(r.answer_key as string) as number[]).length:undefined,
  submitted:role==='owner'?r.submitted:undefined,
  mine:role==='member'&&(r.my_answer!==null||r.my_score!==null)?{answer:r.my_answer,score:r.my_score,total:r.my_total}:null}));
 let members:unknown;
 const assignmentId=url.searchParams.get('assignmentId');
 if(role==='owner'&&assignmentId){
  const {results:subs}=await env.DB.prepare(
   `SELECT m.member_no,m.nickname,s.answer,s.score,s.total,s.submitted_at FROM class_members m
    LEFT JOIN class_submissions s ON s.user_id=m.user_id AND s.assignment_id=(SELECT id FROM class_assignments WHERE id=? AND group_id=?) WHERE m.group_id=? ORDER BY m.member_no`
  ).bind(assignmentId,groupId,groupId).all<Row>();
  members=subs.map(r=>({no:r.member_no,nickname:r.nickname,answer:r.answer,score:r.score,total:r.total,submittedAt:r.submitted_at}));
 }
 return json({role,assignments,members},200,noStore);
};

export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 const groupId=clean(b.data.groupId,60);
 if(await groupRole(env,groupId,user.id)!=='owner')return json({error:'forbidden'},403,noStore);
 const kind=b.data.kind==='quiz'?'quiz':'task';
 const title=clean(b.data.title,100);
 if(title.length<2)return json({error:'title_required'},400,noStore);
 const text=clean(b.data.body,1000)||null;
 const deckId=kind==='quiz'?clean(b.data.deckId,60):'';
 const key=kind==='quiz'?keyOf(b.data.key):null;
 if(kind==='quiz'&&(!/^[a-z0-9-]{3,60}$/.test(deckId)||!key))return json({error:'deck_required'},400,noStore);
 const due=clean(b.data.dueDate,10);
 if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))return json({error:'bad_date'},400,noStore);
 const id=newId();
 // Check and insert in one statement so parallel requests cannot exceed the limit.
 const ins=await env.DB.prepare(`INSERT INTO class_assignments (id,group_id,kind,title,body,deck_id,answer_key,due_date)
  SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM class_assignments WHERE group_id=?)<?`)
  .bind(id,groupId,kind,title,text,deckId||null,key?JSON.stringify(key):null,due||null,groupId,MAX_ASSIGNMENTS).run();
 if(!ins.meta.changes)return json({error:'too_many'},429,noStore);
 return json({assignment:{id,kind,title}},201,noStore);
};

// PUT-like status change: the group's teacher closes or reopens an assignment.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const status=b.data.status==='closed'?'closed':b.data.status==='open'?'open':null;
 if(!status)return json({error:'bad_status'},400,noStore);
 const r=await env.DB.prepare(`UPDATE class_assignments SET status=? WHERE id=? AND group_id IN (SELECT id FROM class_groups WHERE teacher_id=?)`).bind(status,clean(b.data.assignmentId,60),a.user.id).run();
 return r.meta.changes?json({ok:true},200,noStore):json({error:'forbidden'},403,noStore);
};

// DELETE ?assignmentId=… : the group's teacher removes an assignment.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const id=new URL(request.url).searchParams.get('assignmentId')||'';
 await env.DB.prepare(`DELETE FROM class_assignments WHERE id=? AND group_id IN (SELECT id FROM class_groups WHERE teacher_id=?)`).bind(id,a.user.id).run();
 return json({ok:true},200,noStore);
};
