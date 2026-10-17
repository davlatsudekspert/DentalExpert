import {guardPost,sessionUser} from '../../_lib/auth';
import {json,type Env} from '../../_lib/db';

const field=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max)||null:null;
const HANDLE=/^@?[A-Za-z0-9_.]{2,32}$/;
const bad=(error:string)=>json({error},400,'no-store');

// The signed-in user edits their own profile. Role and email never change here.
// Fields that identify the person or give patients a way to reach them clear the owner's verification when they change.
export const onRequestPut:PagesFunction<Env>=async({request,env})=>{
 const g=guardPost(request);if(g)return g;
 const user=await sessionUser(env,request).catch(()=>null);
 if(!user)return json({error:'unauthorized'},401,'no-store');
 let b:Record<string,unknown>;
 try{const raw=await request.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))return bad('bad_json');b=raw as Record<string,unknown>}catch{return bad('bad_json')}
 const name=field(b.name,80);
 if(!name||name.length<2)return bad('name_required');
 const phone=field(b.phone,30);
 if(phone&&!/^[+0-9 ()-]{5,30}$/.test(phone))return bad('bad_phone');
 const telegram=field(b.telegram,33),instagram=field(b.instagram,33);
 if(telegram&&!HANDLE.test(telegram))return bad('bad_telegram');
 if(instagram&&!HANDLE.test(instagram))return bad('bad_instagram');
 const publicEmail=field(b.publicEmail,120);
 if(publicEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(publicEmail))return bad('bad_email');
 const mapUrl=field(b.mapUrl,300);
 if(mapUrl&&!/^https:\/\/[^\s]+$/.test(mapUrl))return bad('bad_map');
 const workplace=field(b.workplace,100),bio=field(b.bio,600),specialty=field(b.specialty,80),address=field(b.address,150);
 const publishRequested=user.role==='dentist'&&b.publishRequested===true?1:0;
 const same=(a:string|null,c:string|null)=>(a||null)===(c||null);
 const identityChanged=!same(user.name,name)||!same(user.phone,phone)||!same(user.telegram,telegram)||!same(user.instagram,instagram)||!same(user.publicEmail,publicEmail)||!same(user.mapUrl,mapUrl)||!same(user.workplace,workplace)||!same(user.address,address)||!same(user.specialty,specialty);
 await env.DB.prepare(
  `UPDATE users SET name=?,phone=?,workplace=?,bio=?,specialty=?,telegram=?,instagram=?,public_email=?,address=?,map_url=?,publish_requested=?,
   verified_at=CASE WHEN ?=1 THEN NULL ELSE verified_at END WHERE id=?`
 ).bind(name,phone,workplace,bio,specialty,telegram,instagram,publicEmail,address,mapUrl,publishRequested,identityChanged?1:0,user.id).run();
 return json({user:{...user,name,phone,workplace,bio,specialty,telegram,instagram,publicEmail,address,mapUrl,publishRequested:!!publishRequested,verified:identityChanged?false:user.verified}},200,'no-store');
};
