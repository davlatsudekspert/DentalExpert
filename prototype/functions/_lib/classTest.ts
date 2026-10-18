import {CURRICULUM_KEYS} from './curriculumKeys';
import {refIndex,refTopic} from '../../src/classroomShared';

/** The question refs ("topic:index") a student answered, in order: their own draw in a variant test, else the test's fixed list. */
export const refsOf=(a:{topic_id:string|null;questions:string|null;pool:string|null},mine:string|null)=>
 a.pool?(mine?JSON.parse(mine) as string[]:[]):a.topic_id&&a.questions?(JSON.parse(a.questions) as number[]).map(i=>`${a.topic_id}:${i}`):null;
/** Correct options for those refs: the pool key (variant) or the stored key (fixed test or deck quiz). */
export function keyFor(a:{answer_key:string|null;pool:string|null},refs:string[]|null){
 const key=JSON.parse(a.answer_key||'[]') as number[];
 if(!a.pool)return key;
 const pool=JSON.parse(a.pool) as string[];
 return (refs||[]).map(r=>key[pool.indexOf(r)]);
}
export const explainFor=(refs:string[]|null)=>refs?refs.map(r=>{const t=refTopic(r);return Object.hasOwn(CURRICULUM_KEYS,t)?CURRICULUM_KEYS[t].e[refIndex(r)]??null:null}):null;

