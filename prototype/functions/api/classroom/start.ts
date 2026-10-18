import {json,type Env} from '../../_lib/db';
import {STATE_SQL,body,clean,groupRole,isoOf,limited,needUser,noStore,tooMany} from '../../_lib/classroom';
import {drawVariant} from '../../../src/classroomShared';

type A={group_id:string;kind:string;status:string;answer_key:string|null;due_date:string|null;minutes:number|null;topic_id:string|null;
 pool:string|null;per_student:number|null;deadline_at:string|null;since_close:number|null;since_deadline:number|null};
// A member starts a quiz. The attempt is recorded immediately with a 0 score, so closing the sheet or peeking at the
// questions does not give a second try; finishing it (submit) replaces the 0 with the real score. A variant test draws the
// student's own questions here (deterministic, src/classroomShared.ts) and keeps them with the attempt.
// The reply carries the server's clock for the attempt: endsAt = the earlier of start + time limit and the deadline.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const a=await needUser(env,request);if('res' in a)return a.res;
 const {user}=a;
 const b=await body(request);if('res' in b)return b.res;
 if(await limited(env,'start',user.id))return tooMany();
 const id=clean(b.data.assignmentId,60);
 const as=await env.DB.prepare(`SELECT group_id,kind,status,answer_key,due_date,minutes,topic_id,pool,per_student,deadline_at,${STATE_SQL()} FROM class_assignments WHERE id=?`).bind(id).first<A>();
 if(!as||as.kind!=='quiz'||await groupRole(env,as.group_id,user.id)!=='member')return json({error:'forbidden'},403,noStore);
 if(as.status!=='open')return json({error:'closed'},409,noStore);
 if(as.due_date&&as.due_date<new Date().toISOString().slice(0,10))return json({error:'past_due'},409,noStore);
 const pool=as.pool?JSON.parse(as.pool) as string[]:null;
 const total=pool?as.per_student||0:(JSON.parse(as.answer_key||'[]') as number[]).length;
 const s=await env.DB.prepare(`SELECT answer,progress,questions,started_at,(julianday('now')-julianday(started_at))*1440 AS elapsed FROM class_submissions WHERE assignment_id=? AND user_id=?`)
  .bind(id,user.id).first<{answer:string;progress:string|null;questions:string|null;started_at:string;elapsed:number}>();
 const clock=(startedAt:string)=>{const st=Date.parse(isoOf(startedAt)!);const ends=[as.minutes?st+as.minutes*60000:Infinity,as.deadline_at?Date.parse(isoOf(as.deadline_at)!):Infinity];const e=Math.min(...ends);
  return {now:new Date().toISOString(),minutes:as.minutes,startedAt:isoOf(startedAt),deadlineAt:isoOf(as.deadline_at),endsAt:Number.isFinite(e)?new Date(e).toISOString():null}};
 if(s){
  // The same student coming back (app closed, phone locked) continues the attempt they started: same clock, the same
  // questions, the answers saved so far. A finished attempt or one whose time ran out cannot be reopened.
  if(s.answer!=='started')return json({error:'already_submitted'},409,noStore);
  if(as.minutes&&s.elapsed>as.minutes)return json({error:'time_up'},409,noStore);
  if(as.since_deadline!==null&&as.since_deadline>=0)return json({error:'past_due'},409,noStore);
  return json({ok:true,resumed:true,total,...clock(s.started_at),questions:s.questions?JSON.parse(s.questions):undefined,progress:s.progress?JSON.parse(s.progress):null},200,noStore);
 }
 if(as.since_deadline!==null&&as.since_deadline>=0)return json({error:'past_due'},409,noStore);
 const mine=pool?(await drawVariant(id,user.id,pool,total,as.topic_id)).map(i=>pool[i]):null;
 const r=await env.DB.prepare(`INSERT OR IGNORE INTO class_submissions (assignment_id,user_id,answer,score,total,started_at,questions) VALUES (?,?,'started',0,?,datetime('now'),?) RETURNING started_at`)
  .bind(id,user.id,total,mine?JSON.stringify(mine):null).first<{started_at:string}>();
 if(!r)return json({error:'try_again'},409,noStore); // a parallel start won; the next call resumes it
 return json({ok:true,total,...clock(r.started_at),questions:mine??undefined},200,noStore);
};
