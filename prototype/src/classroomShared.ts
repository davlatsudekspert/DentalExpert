/** Classroom rules shared by the server (functions/) and the app (src/): nickname and join-code normalisation, and the
 * per-student variant draw. One implementation for both sides; tools/variant_test.ts checks it against
 * tools/variant_vectors.json, which tools/variant_vectors.py generates from an independent Python implementation, and the
 * API suite checks that the live server's draws match the Python implementation too. Keep this file free of DOM and
 * Worker-only APIs: it runs in browsers, in the iOS/Android WebView and in Cloudflare Workers. */

/** iPhone "smart punctuation" turns ' into ’; Uzbek is also typed with ʻ ʼ ‘ ` ´ ′. All of them become a plain '. */
export const APOSTROPHES=/[‘’ʻʼ`´′]/g;
export const normalizeNick=(v:string)=>v.normalize('NFC').replace(APOSTROPHES,"'").trim().replace(/\s+/g,' ');
/** Shape of a nickname (the server also checks a list of offensive words): 2–24 letters/digits/space/._'- , starting with
 * a letter or digit, so emails, links and emoji are refused. */
export const NICK_SHAPE=/^[\p{L}\p{N}][\p{L}\p{N} ._'-]{0,22}[\p{L}\p{N}.]$/u;
/** Names like "Talaba 7" would look like the numbered label teachers see for students without a nickname. */
export const NICK_RESERVED=/^(student|talaba|студент)\s*\d+$/iu;
export type NickCheck={ok:true;nick:string}|{ok:false;error:'bad_nickname'|'reserved_nickname'};
export function checkNick(raw:string):NickCheck{
 const nick=normalizeNick(raw);
 if(NICK_RESERVED.test(nick))return {ok:false,error:'reserved_nickname'};
 return NICK_SHAPE.test(nick)?{ok:true,nick}:{ok:false,error:'bad_nickname'};
}

/** Join codes use 32 characters without 0/O and 1/I. Typed codes are upper-cased, Cyrillic look-alikes (a Russian
 * keyboard) become Latin, spaces and dashes go. A code that still holds 0, O, 1 or I was misread from the screen. */
export const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CYR:Record<string,string>={'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','У':'Y'};
export function normalizeCode(raw:string):{code:string;ambiguous:boolean}{
 const code=raw.toUpperCase().replace(/[АВСЕНКМОРТХУ]/g,c=>CYR[c]).replace(/[^A-Z0-9]/g,'');
 return {code,ambiguous:/[01OI]/.test(code)};
}

/** A question reference is "<topicId>:<index in that topic's test>", e.g. "card-01:3". */
export const qref=(topicId:string,i:number)=>`${topicId}:${i}`;
export const refTopic=(ref:string)=>ref.slice(0,ref.lastIndexOf(':'));
export const refIndex=(ref:string)=>Number(ref.slice(ref.lastIndexOf(':')+1));
/** Largest pool a variant test draws from (the topic itself plus up to five topics already opened in the group). */
export const VARIANT_POOL_MAX=60;
/** Variants only make sense when each student gets at most half of the pool; otherwise two students share most questions. */
/** A general test: at most 50 questions per student, from at most 1500 in the chosen sources. */
export const GENERAL_MAX=50,GENERAL_POOL_MAX=1500;
export const variantAllowed=(poolSize:number,perStudent:number)=>perStudent>=1&&poolSize>=perStudent*2;
export const maxVariantCount=(poolSize:number)=>Math.floor(poolSize/2);

const enc=new TextEncoder();
export async function sha256hex(s:string){
 const d=await crypto.subtle.digest('SHA-256',enc.encode(s));
 return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;

/** The questions one student gets in a variant test, as indices into `pool` in the order they are shown.
 *  1. seed = "<assignmentId>:<userId>"; each question gets h = hex(SHA-256(seed + ":" + ref)) (UTF-8).
 *  2. Questions are grouped by topic (the ref's prefix); inside a topic they are sorted by h, then by ref.
 *  3. With several topics, the `primary` topic (the one the test is about) gives min(ceil(count/2), its size) questions
 *     first; the other topics then give one question each in turn, ordered by hex(SHA-256(seed + "#" + topic)), then by
 *     topic id, until `count` is reached; if they run out, the primary topic fills the rest. Without a primary topic (or
 *     with one topic) all topics take turns the same way.
 *  4. The picks are shown sorted by h, then by ref.
 *  Strings compare by UTF-16 code units (JS `<`, Python str on these ASCII ids). The same student always gets the same
 *  set; different students get different, comparable sets (each topic's share differs by at most one). */
export async function drawVariant(assignmentId:string,userId:string,pool:readonly string[],count:number,primary?:string|null):Promise<number[]>{
 const seed=`${assignmentId}:${userId}`;
 const h=await Promise.all(pool.map(r=>sha256hex(`${seed}:${r}`)));
 const strata=new Map<string,number[]>();
 pool.forEach((r,i)=>{const t=refTopic(r);const s=strata.get(t);if(s)s.push(i);else strata.set(t,[i])});
 for(const s of strata.values())s.sort((x,y)=>cmp(h[x],h[y])||cmp(pool[x],pool[y]));
 const n=Math.max(0,Math.min(Math.floor(count),pool.length));
 const out:number[]=[];
 const usePrimary=!!primary&&strata.has(primary)&&strata.size>1;
 const P=usePrimary?strata.get(primary!)!:[];
 let taken=0;
 if(usePrimary){taken=Math.min(Math.ceil(n/2),P.length);out.push(...P.slice(0,taken))}
 const keys=[...strata.keys()].filter(k=>!usePrimary||k!==primary);
 const kh=new Map(await Promise.all(keys.map(async k=>[k,await sha256hex(`${seed}#${k}`)] as const)));
 keys.sort((a,b)=>cmp(kh.get(a)!,kh.get(b)!)||cmp(a,b));
 const lists=keys.map(k=>strata.get(k)!);
 for(let round=0;out.length<n&&lists.some(l=>round<l.length);round++)
  for(const l of lists)if(round<l.length&&out.length<n)out.push(l[round]);
 while(out.length<n&&taken<P.length)out.push(P[taken++]);
 return out.sort((x,y)=>cmp(h[x],h[y])||cmp(pool[x],pool[y]));
}
