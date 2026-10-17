import {cityIdOk,doctorsInCity,json,type Env} from '../_lib/db';

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
 const url=new URL(request.url);
 const city=url.searchParams.get('city');
 if(!cityIdOk(city))return json({error:'city must be a country-city id such as UZ-AN'},400,'no-store');
 const q=(url.searchParams.get('q')||'').trim().toLowerCase();
 let doctors=await doctorsInCity(env.DB,city!);
 if(q)doctors=doctors.filter(d=>JSON.stringify([d.fullName,d.specialty]).toLowerCase().includes(q));
 return json({cityId:city,doctors});
};
