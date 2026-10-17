import {json,type Env} from '../../_lib/db';
import {body,clean,groupRole,needUser,newId,noStore} from '../../_lib/classroom';
import {CURRICULUM_KEYS} from '../../_lib/curriculumKeys';

type Row=Record<string,unknown>;
const MAX_TOPICS=300;
const topicOf=(v:unknown)=>{const id=clean(v,20);return Object.hasOwn(CURRICULUM_KEYS,id)?id:null};
const pickOf=(v:unknown,count:number)=>Array.isArray(v)&&v.length>=1&&v.length<=count&&new Set(v).size===v.length&&v.every(x=>Number.isInteger(x)&&(x as number)>=0&&(x as number)<count)?v as number[]:null;

// GET ?groupId=… : the group's topics (students see only the open ones).
// GET ?groupId=…&key=<topicId> : the teacher's answer key for a topic test (correct option per question + explanation).
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const url=new URL(request.url);
 const groupId=url.searchParams.get('groupId')||'';
 const role=await groupRole(env,groupId,a.user.id);
 if(!role)return json({error:'forbidden'},403,noStore);
 const keyFor=url.searchParams.get('key');
 if(keyFor!==null){
  const id=topicOf(keyFor);
  if(role!=='owner'||!id)return json({error:'forbidden'},403,noStore);
  return json({topicId:id,correct:CURRICULUM_KEYS[id].c,explain:CURRICULUM_KEYS[id].e},200,noStore);
 }
 const {results}=await env.DB.prepare(
  `SELECT topic_id,opened_at,closed_at,lecture_done_at,oral_done_at,test_assignment_id FROM class_topics WHERE group_id=?${role==='owner'?'':' AND closed_at IS NULL'} ORDER BY opened_at`
 ).bind(groupId).all<Row>();
 return json({role,topics:results.map(r=>({topicId:r.topic_id,openedAt:r.opened_at,closedAt:r.closed_at,
  lectureDoneAt:r.lecture_done_at,oralDoneAt:r.oral_done_at,testId:r.test_assignment_id}))},200,noStore);
};

// POST {groupId, topicId, action}: the group's teacher runs a topic.
//  open | close                       show the topic to students or hide it again
//  lecture | oral  (+ done:boolean)   mark a lesson stage done or not done
//  test {questions:number[], minutes, title}   start the topic's timed group test (once per topic)
//  finish                             end the topic test; students who already started get a 2-minute grace
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const b=await body(request);if('res' in b)return b.res;
 const groupId=clean(b.data.groupId,60);
 if(await groupRole(env,groupId,a.user.id)!=='owner')return json({error:'forbidden'},403,noStore);
 const topicId=topicOf(b.data.topicId);
 if(!topicId)return json({error:'unknown_topic'},400,noStore);
 const action=b.data.action;
 if(action==='open'){
  const r=await env.DB.prepare(`INSERT INTO class_topics (group_id,topic_id) SELECT ?,? WHERE (SELECT COUNT(*) FROM class_topics WHERE group_id=?)<?
   ON CONFLICT(group_id,topic_id) DO UPDATE SET closed_at=NULL`).bind(groupId,topicId,groupId,MAX_TOPICS).run();
  return r.meta.changes?json({ok:true},200,noStore):json({error:'too_many'},429,noStore);
 }
 const row=await env.DB.prepare(`SELECT test_assignment_id AS t FROM class_topics WHERE group_id=? AND topic_id=?`).bind(groupId,topicId).first<{t:string|null}>();
 if(!row)return json({error:'not_open'},409,noStore);
 if(action==='close'){
  await env.DB.prepare(`UPDATE class_topics SET closed_at=datetime('now') WHERE group_id=? AND topic_id=?`).bind(groupId,topicId).run();
  return json({ok:true},200,noStore);
 }
 if(action==='lecture'||action==='oral'){
  const col=action==='lecture'?'lecture_done_at':'oral_done_at';
  await env.DB.prepare(`UPDATE class_topics SET ${col}=${b.data.done===false?'NULL':`datetime('now')`} WHERE group_id=? AND topic_id=?`).bind(groupId,topicId).run();
  return json({ok:true},200,noStore);
 }
 if(action==='test'){
  if(row.t)return json({error:'test_exists'},409,noStore);
  const all=CURRICULUM_KEYS[topicId].c;
  const pick=pickOf(b.data.questions,all.length);
  const minutes=Number(b.data.minutes);
  if(!pick)return json({error:'bad_questions'},400,noStore);
  if(!Number.isInteger(minutes)||minutes<1||minutes>180)return json({error:'bad_minutes'},400,noStore);
  const title=clean(b.data.title,100)||topicId;
  const id=newId();
  const [ins]=await env.DB.batch([
   env.DB.prepare(`INSERT INTO class_assignments (id,group_id,kind,title,answer_key,topic_id,questions,minutes) SELECT ?,?,'quiz',?,?,?,?,?
     WHERE NOT EXISTS (SELECT 1 FROM class_topics WHERE group_id=? AND topic_id=? AND test_assignment_id IS NOT NULL)`)
    .bind(id,groupId,title,JSON.stringify(pick.map(i=>all[i])),topicId,JSON.stringify(pick),minutes,groupId,topicId),
   env.DB.prepare(`UPDATE class_topics SET test_assignment_id=? WHERE group_id=? AND topic_id=? AND test_assignment_id IS NULL AND EXISTS (SELECT 1 FROM class_assignments WHERE id=?)`)
    .bind(id,groupId,topicId,id)
  ]);
  if(!ins.meta.changes)return json({error:'test_exists'},409,noStore);
  return json({ok:true,testId:id},201,noStore);
 }
 if(action==='finish'){
  if(!row.t)return json({error:'no_test'},409,noStore);
  await env.DB.prepare(`UPDATE class_assignments SET status='closed',closed_at=datetime('now') WHERE id=? AND status='open'`).bind(row.t).run();
  return json({ok:true},200,noStore);
 }
 return json({error:'bad_action'},400,noStore);
};
