import {json,type Env} from '../../_lib/db';
import {STATE_SQL,body,clean,ended,groupRole,isoOf,needUser,newId,noStore,revealOf,revealOpen} from '../../_lib/classroom';
import {explainFor,keyFor,refsOf} from '../../_lib/classTest';

type Row=Record<string,unknown>;
const MAX_ASSIGNMENTS=100;
const keyOf=(v:unknown)=>Array.isArray(v)&&v.length>=1&&v.length<=50&&v.every(x=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<=9)?v as number[]:null;

// GET ?groupId=… : members see their own submission status, the teacher sees counts and a roster by number/nickname.
// The answer key never leaves the server before the reveal the teacher chose (and never to other students).
// Topic tests carry `items`: the question refs ("topic:index") of the test (fixed tests) or of its pool (variant tests);
// a student's own variant questions are in mine.questions once they started.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const url=new URL(request.url);
 const groupId=url.searchParams.get('groupId')||'';
 const role=await groupRole(env,groupId,user.id);
 if(!role)return json({error:'forbidden'},403,noStore);
 const {results}=await env.DB.prepare(
  `SELECT a.id,a.kind,a.title,a.body,a.deck_id,a.status,a.due_date,a.created_at,a.answer_key,a.topic_id,a.questions,a.minutes,a.reveal,a.pool,a.per_student,a.deadline_at,${STATE_SQL('a.')},
     (SELECT COUNT(*) FROM class_submissions s WHERE s.assignment_id=a.id) AS submitted,
     s.answer AS my_answer,s.score AS my_score,s.total AS my_total,s.started_at AS my_started,s.answers AS my_answers,s.questions AS my_questions
   FROM class_assignments a LEFT JOIN class_submissions s ON s.assignment_id=a.id AND s.user_id=?
   WHERE a.group_id=?${role==='owner'?'':` AND (a.topic_id IS NULL OR EXISTS (SELECT 1 FROM class_topics t WHERE t.group_id=a.group_id AND t.topic_id=a.topic_id AND t.closed_at IS NULL))`} ORDER BY a.created_at DESC`
 ).bind(user.id,groupId).all<Row>();
 const items=(r:Row)=>r.pool?JSON.parse(r.pool as string) as string[]:r.topic_id&&r.questions?(JSON.parse(r.questions as string) as number[]).map(i=>`${r.topic_id}:${i}`):undefined;
 const assignments=results.map(r=>{
  const st=r as Row&{status:unknown;since_close:unknown;since_deadline:unknown;reveal:unknown};
  const mineRefs=r.pool?(r.my_questions?JSON.parse(r.my_questions as string) as string[]:null):refsOf(r as never,null);
  return {id:r.id,kind:r.kind,title:r.title,body:r.body,deckId:r.deck_id,status:r.status,dueDate:r.due_date,createdAt:r.created_at,
  questionCount:r.pool?r.per_student:r.answer_key?(JSON.parse(r.answer_key as string) as number[]).length:undefined,
  topicId:r.topic_id??undefined,questions:r.questions?JSON.parse(r.questions as string):undefined,items:items(r),variant:r.pool?true:undefined,perStudent:r.per_student??undefined,
  minutes:r.minutes??undefined,deadlineAt:isoOf(r.deadline_at)??undefined,ended:ended(st),reveal:revealOf(r.reveal),
  submitted:role==='owner'?r.submitted:undefined,
  mine:role==='member'&&(r.my_answer!==null||r.my_score!==null)?{answer:r.my_answer,score:r.my_score,total:r.my_total,startedAt:r.my_started,questions:r.pool?mineRefs??undefined:undefined,
   // Each student reviews their own finished test (own answers, the right options, explanations) once the reveal opens.
   review:r.my_answer==='done'&&r.answer_key&&revealOpen(st)?{answers:r.my_answers?JSON.parse(r.my_answers as string):null,
    correct:keyFor(r as never,mineRefs),explain:explainFor(mineRefs),questions:r.pool?mineRefs:undefined}:undefined}:null};
 });
 let members:unknown,stats:unknown;
 const assignmentId=url.searchParams.get('assignmentId');
 if(role==='owner'&&assignmentId){
  const {results:subs}=await env.DB.prepare(
   `SELECT m.member_no,m.nickname,s.answer,s.answers,s.progress,s.score,s.total,s.started_at,s.submitted_at,s.questions FROM class_members m
    LEFT JOIN class_submissions s ON s.user_id=m.user_id AND s.assignment_id=(SELECT id FROM class_assignments WHERE id=? AND group_id=?) WHERE m.group_id=? ORDER BY m.member_no`
  ).bind(assignmentId,groupId,groupId).all<Row>();
  members=subs.map(r=>({no:r.member_no,nickname:r.nickname,answer:r.answer,answers:r.answers?JSON.parse(r.answers as string):null,score:r.score,total:r.total,startedAt:isoOf(r.started_at),submittedAt:r.answer&&r.answer!=='started'?isoOf(r.submitted_at):null,
   questions:r.questions?JSON.parse(r.questions as string):undefined,
   answered:r.answer==='started'&&r.progress?(JSON.parse(r.progress as string) as (number|null)[]).filter(x=>x!==null&&x>=0).length:undefined}));
  // Per-question right/answered counts for the "hardest questions" panel, only once the test is over. Aligned with
  // `items` for topic tests (a variant question counts only the students who got it), with the key for deck quizzes.
  const t=results.find(r=>r.id===assignmentId);
  if(t&&t.answer_key&&ended(t as never)){
   const done=subs.filter(r=>r.answer==='done'&&r.answers).map(r=>({answers:JSON.parse(r.answers as string) as number[],refs:t.pool?JSON.parse(r.questions as string||'[]') as string[]:null}));
   if(t.pool){
    const pool=JSON.parse(t.pool as string) as string[];const key=JSON.parse(t.answer_key as string) as number[];
    stats=pool.map((ref,i)=>{const got=done.filter(d=>d.refs!.includes(ref));return {right:got.filter(d=>d.answers[d.refs!.indexOf(ref)]===key[i]).length,answered:got.length}});
   }else{
    const key=JSON.parse(t.answer_key as string) as number[];
    stats=key.map((k,i)=>({right:done.filter(d=>d.answers[i]===k).length,answered:done.length}));
   }
  }
 }
 return json({role,assignments,members,stats},200,noStore);
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
 const reveal=b.data.reveal==='instant'?'instant':'closed'; // deck quizzes have no deadline time, so no 'deadline' reveal
 const id=newId();
 // Check and insert in one statement so parallel requests cannot exceed the limit.
 const ins=await env.DB.prepare(`INSERT INTO class_assignments (id,group_id,kind,title,body,deck_id,answer_key,due_date,reveal)
  SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM class_assignments WHERE group_id=? AND topic_id IS NULL)<?`)
  .bind(id,groupId,kind,title,text,deckId||null,key?JSON.stringify(key):null,due||null,reveal,groupId,MAX_ASSIGNMENTS).run();
 if(!ins.meta.changes)return json({error:'too_many'},429,noStore);
 return json({assignment:{id,kind,title}},201,noStore);
};

// PUT-like status change: the group's teacher closes or reopens an assignment. A finished topic test stays closed:
// its students may already have seen the answers.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const status=b.data.status==='closed'?'closed':b.data.status==='open'?'open':null;
 if(!status)return json({error:'bad_status'},400,noStore);
 const r=await env.DB.prepare(`UPDATE class_assignments SET status=?,closed_at=CASE WHEN ?='closed' THEN datetime('now') END WHERE id=? AND group_id IN (SELECT id FROM class_groups WHERE teacher_id=?)
   AND NOT (topic_id IS NOT NULL AND ?='open' AND closed_at IS NOT NULL)`).bind(status,status,clean(b.data.assignmentId,60),a.user.id,status).run();
 return r.meta.changes?json({ok:true},200,noStore):json({error:'forbidden'},403,noStore);
};

// DELETE ?assignmentId=… : the group's teacher removes an assignment.
export const onRequestDelete:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const id=new URL(request.url).searchParams.get('assignmentId')||'';
 await env.DB.prepare(`DELETE FROM class_assignments WHERE id=? AND group_id IN (SELECT id FROM class_groups WHERE teacher_id=?)`).bind(id,a.user.id).run();
 return json({ok:true},200,noStore);
};
