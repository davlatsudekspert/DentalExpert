/** Public site the QR codes point to (the /j/ landing page opens the app or continues in the browser). */
export const SITE='https://dental-expert.pages.dev';
export const joinLink=(code:string,testId?:string)=>`${SITE}/j/?c=${code}${testId?`&a=${encodeURIComponent(testId)}`:''}`;
/** Reads a join code (and test id) from a scanned QR link, a pasted invite text or a bare code like "G5R MBA". */
export function parseJoin(text:string):{code:string;testId?:string}|null{
 const t=text.trim().slice(0,600);
 const c=t.match(/[?&]c=([A-Za-z0-9]{6})(?![A-Za-z0-9])/)?.[1];
 const a=t.match(/[?&]a=([A-Za-z0-9-]{8,60})/)?.[1];
 if(c)return {code:c.toUpperCase(),testId:a};
 const bare=t.toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(bare.length===6)return {code:bare};
 // Inside a longer text, take the last code-shaped token that has a digit (plain 6-letter words are not codes).
 const hits=[...t.toUpperCase().matchAll(/(?:^|[^A-Z0-9])([A-Z0-9]{3})[ -]?([A-Z0-9]{3})(?![A-Z0-9])/g)].map(m=>m[1]+m[2]).filter(x=>/\d/.test(x));
 return hits.length?{code:hits[hits.length-1]}:null;
}
/** A QR test started on this device but not submitted (QuickJoin keeps it in localStorage 'de_quick' until submitted). */
export const pendingQuickTest=():{code:string;testId:string}|null=>{try{const v=JSON.parse(localStorage.getItem('de_quick')||'null');return v&&typeof v.code==='string'&&typeof v.testId==='string'?{code:v.code,testId:v.testId}:null}catch{return null}};
