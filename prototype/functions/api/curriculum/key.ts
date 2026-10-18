import {json,type Env} from '../../_lib/db';
import {ipKey,underLimit} from '../../_lib/classroom';
import {CURRICULUM_KEYS} from '../../_lib/curriculumKeys';

// GET ?topicId=… : answers and explanations of a curriculum topic test for SELF-STUDY (Learn → O‘quv reja → topic).
// The questions ship with the app; the key is served on request so it is not bundled for scraping in one go.
// Note: group topic tests draw from the same bank, so a timed group test checks recall rather than secrecy.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const id=new URL(request.url).searchParams.get('topicId')||'';
 if(!/^[a-z]{2,8}-\d{2}$/.test(id)||!Object.hasOwn(CURRICULUM_KEYS,id))return json({error:'not_found'},404,'no-store');
 if(!await underLimit(env,'ckey:'+await ipKey(env,request),600,3600))return json({error:'rate_limited'},429,'no-store');
 const k=CURRICULUM_KEYS[id];
 return json({correct:k.c,explain:k.e},200,'private, max-age=3600');
};
