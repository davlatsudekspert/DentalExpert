import {explainOf} from './questionIndex';

type A={topic_id:string|null;questions:string|null;pool:string|null;deck_id?:string|null;answer_key?:string|null};
/** The question refs a student answered, in order, all resolvable in the one question index (questionIndex.ts):
 *  their own draw for a pool test (variant or general test), the fixed questions of a topic test, or a deck quiz. */
export const refsOf=(a:A,mine:string|null):string[]|null=>
 a.pool?(mine?JSON.parse(mine) as string[]:[])
 :a.topic_id&&a.questions?(JSON.parse(a.questions) as number[]).map(i=>`${a.topic_id}:${i}`)
 :a.deck_id&&a.answer_key?(JSON.parse(a.answer_key) as number[]).map((_,i)=>`deck.${a.deck_id}:${i}`):null;
/** Correct options for those refs: the pool key (pool tests) or the stored key (fixed topic test or deck quiz). */
export function keyFor(a:{answer_key:string|null;pool:string|null},refs:string[]|null){
 const key=JSON.parse(a.answer_key||'[]') as number[];
 if(!a.pool)return key;
 const pool=JSON.parse(a.pool) as string[];
 return (refs||[]).map(r=>key[pool.indexOf(r)]);
}
export const explainFor=(refs:string[]|null)=>refs?refs.map(r=>explainOf(r)):null;
/** Score of an attempt from its answers (missing ones count as wrong). */
export const scoreOf=(key:number[],answers:(number|null)[])=>key.filter((k,i)=>k===answers[i]).length;

import type {Env} from './db';
/** Attempts whose time is over are finished on the server with the answers saved so far (the app also submits them
 * itself when the clock runs out; this covers a closed app or a lost connection): past the time limit, past the
 * deadline, or after the teacher finished the test — each plus the 2-minute grace. Called when the group's tests are read. */
export async function finalizeExpired(env:Env,groupId:string,grace:number){
 const {results}=await env.DB.prepare(`SELECT s.assignment_id,s.user_id,s.progress,s.questions AS mine,s.total,a.answer_key,a.pool,a.topic_id,a.questions,a.deck_id
   FROM class_submissions s JOIN class_assignments a ON a.id=s.assignment_id
   WHERE a.group_id=? AND a.kind='quiz' AND s.answer='started' AND (
    (a.minutes IS NOT NULL AND (julianday('now')-julianday(s.started_at))*1440>a.minutes+?2) OR
    (a.deadline_at IS NOT NULL AND (julianday('now')-julianday(a.deadline_at))*1440>?2) OR
    (a.status='closed' AND a.closed_at IS NOT NULL AND (julianday('now')-julianday(a.closed_at))*1440>?2)) LIMIT 200`).bind(groupId,grace)
  .all<{assignment_id:string;user_id:string;progress:string|null;mine:string|null;total:number|null;answer_key:string|null;pool:string|null;topic_id:string|null;questions:string|null;deck_id:string|null}>();
 if(!results.length)return 0;
 await env.DB.batch(results.map(r=>{
  const key=keyFor(r,refsOf(r,r.mine));
  const saved=r.progress?JSON.parse(r.progress) as (number|null)[]:[];
  const answers=key.map((_,i)=>typeof saved[i]==='number'?saved[i] as number:-1);
  return env.DB.prepare(`UPDATE class_submissions SET answer='done',score=?,answers=?,submitted_at=datetime('now') WHERE assignment_id=? AND user_id=? AND answer='started'`)
   .bind(scoreOf(key,answers),JSON.stringify(answers),r.assignment_id,r.user_id);
 }));
 return results.length;
}
