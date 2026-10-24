import {cityIdOk,doctorsInCity,json,type Env} from '../_lib/db';
import {proEnabled,SPECIALIST_PRO_SQL} from '../_lib/entitlement';
import {photoUrl} from '../_lib/photo';

type Row=Record<string,string|number|null>;
const tr=(v:unknown)=>{const t=typeof v==='string'?v:'';return {uz:t,ru:t,en:t}};
/** Dentists who asked to be listed and were verified by the owner: shown like any other doctor, with the contacts they entered. */
async function publishedDentists(env:Env,city:string){
 const {results}=await env.DB.prepare(
  `SELECT id,name,phone,workplace,bio,specialty,telegram,instagram,public_email,address,map_url,city_id,photo_at FROM users
   WHERE role='dentist' AND publish_requested=1 AND verified_at IS NOT NULL AND suspended_at IS NULL AND city_id=?${proEnabled(env)?' AND '+SPECIALIST_PRO_SQL('users'):''} ORDER BY verified_at DESC LIMIT 100`
 ).bind(city).all<Row>();
 return results.map(r=>{
  const contacts=[['phone',r.phone],['telegram',r.telegram],['instagram',r.instagram],['email',r.public_email],['map',r.map_url]]
   .filter(([,v])=>v).map(([kind,value])=>({kind,value,verified:true}));
  return {id:'u-'+r.id,fullName:r.name,initials:null,specialty:tr(r.specialty),bio:tr(r.bio),languages:[],services:[],years:null,rating:null,photoUrl:photoUrl(r.id,r.photo_at),
   licenseStatus:'verified',isDemo:false,clinics:[{id:null,name:r.workplace||'',logoUrl:null,cityId:r.city_id,address:tr(r.address)}],contacts};
 });
}

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const url=new URL(request.url);
 const city=url.searchParams.get('city');
 if(!cityIdOk(city))return json({error:'city must be a country-city id such as UZ-AN'},400,'no-store');
 const q=(url.searchParams.get('q')||'').trim().toLowerCase();
 let doctors:Record<string,unknown>[]=await doctorsInCity(env.DB,city!);
 doctors=[...doctors,...await publishedDentists(env,city!)];
 if(q)doctors=doctors.filter(d=>JSON.stringify([d.fullName,d.specialty]).toLowerCase().includes(q));
 return json({cityId:city,doctors});
};
