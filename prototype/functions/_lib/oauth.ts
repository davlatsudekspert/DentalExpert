import {devEcho,normalizeEmail,sha256,timingSafeEqual} from './auth';
import type {Env} from './db';

// Sign in with Google / Apple: the client gets an OpenID Connect id_token from the provider SDK and posts it here.
// The token is trusted only after its RS256 signature verifies against the provider's published JWKS and the
// iss / aud / exp / iat / nonce / email claims check out. Nothing is ever accepted unverified.

export type Provider='google'|'apple';
export const PROVIDERS:readonly Provider[]=['google','apple'];

const CONFIG:Record<Provider,{jwks:string;issuers:string[];ids:(env:Env)=>string|undefined}>={
 google:{jwks:'https://www.googleapis.com/oauth2/v3/certs',issuers:['accounts.google.com','https://accounts.google.com'],ids:env=>env.GOOGLE_CLIENT_IDS},
 apple:{jwks:'https://appleid.apple.com/auth/keys',issuers:['https://appleid.apple.com'],ids:env=>env.APPLE_CLIENT_IDS}
};

export const clientIds=(env:Env,p:Provider)=>(CONFIG[p].ids(env)||'').split(',').map(s=>s.trim()).filter(Boolean);
export const oauthEnabled=(env:Env,p:Provider)=>clientIds(env,p).length>0;

const MAX_TOKEN_LEN=8192, CLOCK_SKEW_S=300, MAX_TOKEN_AGE_S=86400;
const JWKS_TTL_MIN_S=300, JWKS_TTL_MAX_S=86400, JWKS_TTL_DEFAULT_S=3600, JWKS_REFETCH_MIN_S=60;

type Jwk={kty?:string;kid?:string;n?:string;e?:string;alg?:string;use?:string};
type KeySet={keys:Map<string,CryptoKey>;fetchedAt:number;expiresAt:number};
/** Module-memory JWKS cache per URL (lives as long as the isolate). */
const cache=new Map<string,KeySet>();
const testCache=new Map<string,KeySet>();

class Unavailable extends Error {}
export type VerifyResult={ok:true;sub:string;email:string;name:string|null}|{ok:false;status:400|503;error:'bad_token'|'email_not_verified'|'oauth_unavailable'};

const b64urlBytes=(s:string)=>{
 if(!/^[A-Za-z0-9_-]*$/.test(s))throw new Error('b64');
 const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
 return Uint8Array.from(b,c=>c.charCodeAt(0));
};
const b64urlJson=(s:string)=>JSON.parse(new TextDecoder().decode(b64urlBytes(s))) as Record<string,unknown>;

async function importKeys(jwks:unknown):Promise<Map<string,CryptoKey>>{
 const list=(jwks as {keys?:unknown})?.keys;
 if(!Array.isArray(list))throw new Unavailable('jwks shape');
 const keys=new Map<string,CryptoKey>();
 for(const k of list as Jwk[]){
  if(k?.kty!=='RSA'||typeof k.kid!=='string'||typeof k.n!=='string'||typeof k.e!=='string')continue;
  if(k.alg&&k.alg!=='RS256')continue;
  if(k.use&&k.use!=='sig')continue;
  try{
   keys.set(k.kid,await crypto.subtle.importKey('jwk',{kty:'RSA',n:k.n,e:k.e,alg:'RS256',ext:true},{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']));
  }catch{/* skip malformed key */}
 }
 if(!keys.size)throw new Unavailable('jwks empty');
 return keys;
}

async function fetchKeySet(url:string):Promise<KeySet>{
 const res=await fetch(url,{headers:{accept:'application/json','user-agent':'DentalExpert-Auth/1.0'},signal:AbortSignal.timeout(5000)}).catch(()=>null);
 if(!res||!res.ok)throw new Unavailable('jwks fetch');
 const keys=await importKeys(await res.json().catch(()=>null));
 const m=(res.headers.get('cache-control')||'').match(/max-age=(\d+)/);
 const ttl=Math.min(JWKS_TTL_MAX_S,Math.max(JWKS_TTL_MIN_S,m?Number(m[1]):JWKS_TTL_DEFAULT_S));
 const now=Date.now();
 return {keys,fetchedAt:now,expiresAt:now+ttl*1000};
}

/** Returns the verification key for `kid`, refetching the JWKS when it expired or (rate limited) when the kid is unknown. */
async function keyFor(env:Env,request:Request,p:Provider,kid:string):Promise<CryptoKey|null>{
 // Test hook: local dev server only (AUTH_DEV_ECHO=1 and a localhost request), never reachable in production.
 if(env.OAUTH_TEST_JWKS&&devEcho(env,request)){
  let set=testCache.get(env.OAUTH_TEST_JWKS);
  if(!set){
   let parsed:unknown;try{parsed=JSON.parse(env.OAUTH_TEST_JWKS)}catch{throw new Unavailable('test jwks')}
   set={keys:await importKeys(parsed),fetchedAt:Date.now(),expiresAt:Infinity};testCache.set(env.OAUTH_TEST_JWKS,set);
  }
  return set.keys.get(kid)||null;
 }
 const url=CONFIG[p].jwks,now=Date.now();
 let set=cache.get(url);
 const stale=!set||set.expiresAt<=now;
 const unknownKid=!!set&&!set.keys.has(kid)&&now-set.fetchedAt>JWKS_REFETCH_MIN_S*1000;
 if(stale||unknownKid){
  try{set=await fetchKeySet(url);cache.set(url,set)}
  catch(e){if(!set)throw e}// A failed refresh keeps the last genuine keys; with none at all the caller answers 503.
 }
 return set!.keys.get(kid)||null;
}

const bad=(error:'bad_token'|'email_not_verified'='bad_token'):VerifyResult=>({ok:false,status:400,error});

export async function verifyIdToken(env:Env,request:Request,p:Provider,idToken:string,nonce?:string|null):Promise<VerifyResult>{
 if(idToken.length>MAX_TOKEN_LEN)return bad();
 const parts=idToken.split('.');
 if(parts.length!==3||parts.some(x=>!x))return bad();
 let header:Record<string,unknown>,claims:Record<string,unknown>,sig:Uint8Array;
 try{header=b64urlJson(parts[0]);claims=b64urlJson(parts[1]);sig=b64urlBytes(parts[2])}catch{return bad()}
 if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid)return bad();

 let key:CryptoKey|null;
 try{key=await keyFor(env,request,p,header.kid)}catch{return {ok:false,status:503,error:'oauth_unavailable'}}
 if(!key)return bad();
 const signed=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,sig,signed).catch(()=>false);
 if(!valid)return bad();

 // Claims are only looked at once the signature is proven.
 const now=Math.floor(Date.now()/1000);
 if(typeof claims.iss!=='string'||!CONFIG[p].issuers.includes(claims.iss))return bad();
 const allowed=clientIds(env,p);
 const aud=claims.aud;
 const audOk=typeof aud==='string'?allowed.includes(aud)
  :Array.isArray(aud)&&aud.length>0&&aud.every(a=>typeof a==='string')&&aud.some(a=>allowed.includes(a as string))&&(claims.azp===undefined||allowed.includes(claims.azp as string));
 if(!audOk)return bad();
 const exp=claims.exp,iat=claims.iat;
 if(typeof exp!=='number'||!Number.isFinite(exp)||exp<=now)return bad();
 if(typeof iat!=='number'||!Number.isFinite(iat)||iat>now+CLOCK_SKEW_S||iat<now-MAX_TOKEN_AGE_S||exp<iat)return bad();
 if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)return bad();
 if(nonce!=null){
  // Apple's native flow puts SHA-256(hex) of the raw nonce in the token; Google echoes the raw value.
  const got=typeof claims.nonce==='string'?claims.nonce:'';
  if(!got||!(timingSafeEqual(got,nonce)||timingSafeEqual(got,await sha256(nonce))))return bad();
 }
 const email=normalizeEmail(claims.email);
 const verified=claims.email_verified===true||claims.email_verified==='true';
 if(!email||!verified)return bad('email_not_verified');
 const name=typeof claims.name==='string'?claims.name.trim().slice(0,80)||null:null;
 return {ok:true,sub:claims.sub,email,name};
}
