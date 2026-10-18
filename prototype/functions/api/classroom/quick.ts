import {createSession,guestEmail,isNativeClient,sessionUser,GUEST_DAYS} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';
import {addMember,body,clean,codeGuess,ipKey,isProfane,nickname,noStore,pruneGuests,underLimit} from '../../_lib/classroom';

// QR quick test: POST {code, nickname, assignmentId?}. A signed-in student simply joins. Anyone else gets a class-only
// guest account for this device: no email, the nickname as name, a 180-day session that works only on the classroom
// endpoints. Abuse limits: attempts per IP (a whole class may share one school IP, so the limit is generous) and new
// guests per group; failed code lookups have their own tighter limit.
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 const b=await body(request);if('res' in b)return b.res;
 if(!env.AUTH_SECRET)return json({error:'unavailable'},503,noStore);
 const ip=await ipKey(env,request);
 if(!await underLimit(env,'quick:'+ip,150,3600))return json({error:'rate_limited'},429,noStore);
 const code=clean(b.data.code,12).toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length!==6)return json({error:'bad_code'},400,noStore);
 const raw=typeof b.data.nickname==='string'?b.data.nickname:'';
 const nick=nickname(raw);
 if(nick===false)return json({error:isProfane(raw)?'nickname_rejected':'bad_nickname'},400,noStore);
 // Codes are 6 characters, so wrong guesses are capped per IP (shared with /classroom/join).
 const guess=await codeGuess(env,request);
 if(!guess.ok)return json({error:'rate_limited'},429,noStore);
 const g=await env.DB.prepare(`SELECT id,name,teacher_id FROM class_groups WHERE code=?`).bind(code).first<{id:string;name:string;teacher_id:string}>();
 if(!g)return json({error:'not_found'},404,noStore);
 await guess.hit();
 // The test must be a quiz of this group that students can see (a topic test only while its topic is open).
 const aid=clean(b.data.assignmentId,60);
 let test:{id:string;title:string;status:string}|null=null;
 if(aid){
  test=await env.DB.prepare(`SELECT a.id,a.title,a.status FROM class_assignments a WHERE a.id=? AND a.group_id=? AND a.kind='quiz'
    AND (a.topic_id IS NULL OR EXISTS (SELECT 1 FROM class_topics t WHERE t.group_id=a.group_id AND t.topic_id=a.topic_id AND t.closed_at IS NULL))`).bind(aid,g.id).first();
  if(!test)return json({error:'test_not_found'},404,noStore);
 }
 const out=(extra:Record<string,unknown>={})=>({group:{id:g.id,name:g.name},test:test&&{id:test.id,title:test.title,status:test.status},...extra});
 const me=await sessionUser(env,request).catch(()=>null);
 if(me){
  if(me.role==='teacher'||me.role==='dentist')return json({error:'teacher_cannot_join'},400,noStore);
  const r=await addMember(env,g.id,me.id,nick);
  return r==='ok'?json(out(),200,noStore):json({error:r},409,noStore);
 }
 if(!nick)return json({error:'nickname_required'},400,noStore);
 if(!await underLimit(env,'quickgroup:'+g.id,150,3600))return json({error:'rate_limited'},429,noStore);
 await pruneGuests(env).catch(()=>{});
 const id=crypto.randomUUID();
 await env.DB.prepare(`INSERT INTO users (id,email,name,role,guest,last_seen_at) VALUES (?,?,?,'student',1,datetime('now'))`).bind(id,guestEmail(id),nick).run();
 const r=await addMember(env,g.id,id,nick);
 if(r!=='ok'){await env.DB.prepare(`DELETE FROM users WHERE id=? AND guest=1`).bind(id).run();return json({error:r},409,noStore)}
 const session=await createSession(env,request,id,GUEST_DAYS);
 const user={id,guest:true,email:'',name:nick,role:'student'};
 if(isNativeClient(request))return json(out({user,token:session.token}),200,noStore);
 const res=json(out({user}),200,noStore);
 res.headers.append('set-cookie',session.cookie);
 return res;
};
