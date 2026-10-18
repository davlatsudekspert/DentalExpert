/** Profile photos: a small square image the client crops and encodes (512×512 WebP or JPEG), kept as a data URL in users.photo. */
export const PHOTO_MAX_BYTES=200*1024;
const TYPES={webp:'image/webp',jpeg:'image/jpeg',png:'image/png'} as const;
type PhotoType=typeof TYPES[keyof typeof TYPES];
const DATA_URL=/^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/;

/** The public URL of a stored photo; `v` changes with every upload so the response can be cached as immutable. */
export const photoUrl=(userId:unknown,photoAt:unknown)=>photoAt?`/api/photo?u=${encodeURIComponent(String(userId))}&v=${encodeURIComponent(String(photoAt))}`:null;

/** True when the first bytes are the signature of the declared format (JPEG FFD8FF, PNG 89504E47…, WebP RIFF….WEBP). */
export function magicMatches(type:PhotoType,b:Uint8Array){
 if(type==='image/jpeg')return b.length>3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
 if(type==='image/png')return b.length>8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((x,i)=>b[i]===x);
 const tag=(o:number)=>String.fromCharCode(b[o],b[o+1],b[o+2],b[o+3]);
 return b.length>12&&tag(0)==='RIFF'&&tag(8)==='WEBP';
}

/** Validates an uploaded data URL strictly: exact prefix, clean base64, size limit and matching file signature. */
export function parsePhoto(v:unknown):{ok:true;type:PhotoType;bytes:Uint8Array;dataUrl:string}|{ok:false;error:'bad_image'|'too_large'|'type_mismatch'}{
 if(typeof v!=='string')return {ok:false,error:'bad_image'};
 // Cheap length check first: base64 is 4/3 of the decoded size.
 if(v.length>Math.ceil(PHOTO_MAX_BYTES/3)*4+40)return {ok:false,error:'too_large'};
 const m=v.match(DATA_URL);
 if(!m||m[2].length%4!==0)return {ok:false,error:'bad_image'};
 let bin:string;
 try{bin=atob(m[2])}catch{return {ok:false,error:'bad_image'}}
 if(bin.length>PHOTO_MAX_BYTES)return {ok:false,error:'too_large'};
 if(bin.length<16)return {ok:false,error:'bad_image'};
 const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
 const type=TYPES[m[1] as keyof typeof TYPES];
 if(!magicMatches(type,bytes))return {ok:false,error:'type_mismatch'};
 return {ok:true,type,bytes,dataUrl:v};
}

/** Splits a stored data URL back into content-type and bytes; null if the stored value is not a valid photo. */
export function decodeStored(v:unknown){
 const p=parsePhoto(v);
 return p.ok?{type:p.type,bytes:p.bytes}:null;
}
