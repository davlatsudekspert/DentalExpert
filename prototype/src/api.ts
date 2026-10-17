export type SponsorsResponse={cityId:string;sample:boolean;activeCount:number;sponsors:{id:string;isDemo:boolean}[]};

/** Returns null when the API is unreachable (offline demo.html, dev server without Functions) so callers keep the local demo data. */
export async function fetchSponsors(cityId:string,signal?:AbortSignal):Promise<SponsorsResponse|null>{
 try{
  const res=await fetch(`/api/sponsors?city=${encodeURIComponent(cityId)}&includeDemo=1`,{signal,headers:{accept:'application/json'}});
  if(!res.ok||!(res.headers.get('content-type')||'').includes('application/json'))return null;
  return await res.json() as SponsorsResponse;
 }catch{return null}
}
