import {pickSponsors} from '../../src/discoveryModel';
import {activeSponsorIds,cityIdOk,doctorsInCity,json,type Env} from '../_lib/db';

// Up to 4 visible sponsors per city, rotated daily when 5 are active.
// includeDemo=1 lets the prototype fill the city with clearly flagged fictional sample ads when no real sponsor exists.
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const url=new URL(request.url);
 const city=url.searchParams.get('city');
 if(!cityIdOk(city))return json({error:'city must be a country-city id such as UZ-AN'},400,'no-store');
 const daySeed=Math.floor(Date.now()/86_400_000);
 const active=await activeSponsorIds(env.DB,city!);
 if(active.length){
  const ids=pickSponsors(active,daySeed);
  return json({cityId:city,sample:false,activeCount:active.length,sponsors:await doctorsInCity(env.DB,city!,ids)});
 }
 if(url.searchParams.get('includeDemo')==='1'){
  const demo=(await doctorsInCity(env.DB,city!)).filter(d=>d.isDemo).slice(0,4);
  return json({cityId:city,sample:true,activeCount:0,sponsors:demo});
 }
 return json({cityId:city,sample:false,activeCount:0,sponsors:[]});
};
