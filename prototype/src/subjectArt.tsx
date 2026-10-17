/** Colour and line icon per curriculum subject (24×24, stroke icons in the lucide style). */
const tooth='M7 3.5c1.6 0 2.9.8 5 .8s3.4-.8 5-.8c2.3 0 3.5 1.9 3.5 4.3 0 2.6-1.2 4.2-1.8 6.4-.6 2.2-.9 6.3-2.6 6.3-1.6 0-1.4-4.6-4.1-4.6s-2.5 4.6-4.1 4.6c-1.7 0-2-4.1-2.6-6.3C4.7 12 3.5 10.4 3.5 7.8c0-2.4 1.2-4.3 3.5-4.3z';
const ART:Record<string,{c:string;bg:string;d:string[]}>={
 prop:{c:'#168d8b',bg:'#e3f1f1',d:['M14.5 9.5a5 5 0 1 0-.01 0','M13 13.5l7 7']},
 prev:{c:'#2f8f4e',bg:'#e5f4e9',d:['M4 20l9-9','M13 11l2-2m-4 0l2 2m0-4l2 2m0-4l2 2','M15 5l4 4 1.5-1.5-4-4z']},
 mat:{c:'#6b54b0',bg:'#eeebf8',d:['M9 3h6','M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3','M7.5 15h9']},
 card:{c:'#b25a1b',bg:'#fbeee3',d:[tooth,'M13.5 9.2a1.6 1.6 0 1 0 .01 0']},
 radio:{c:'#3d4b63',bg:'#e7ebf2',d:['M4 4h16v16H4z','M9 8c1 0 1.6.4 3 .4s2-.4 3-.4c1.3 0 2 1 2 2.4 0 2.6-1.4 3.6-1.8 6.6M9 8c-1.3 0-2 1-2 2.4 0 2.6 1.4 3.6 1.8 6.6']},
 endo:{c:'#c0392b',bg:'#fbe9e7',d:[tooth,'M10.2 9v7.5M13.8 9v7.5']},
 surg:{c:'#1f6f9f',bg:'#e4f0f8',d:['M5 19l7-7','M12 12l5.5-5.5a2 2 0 0 1 2.8 2.8L14.8 15','M4 20l2 0 0-2']},
 pros:{c:'#a07a12',bg:'#f8f1dc',d:['M4 10l3-5 5 3 5-3 3 5-2 9H6z','M6 14h12']},
 perio:{c:'#c2416b',bg:'#fbe8ee',d:[tooth,'M3 13c2 1.5 3.5 1.5 4.5 0s2.5-1.5 4.5 0 3.5 1.5 4.5 0 2.5-1.5 4.5 0']},
 oralmed:{c:'#7a4fb5',bg:'#f1eafa',d:['M3 12c3-4 6-5 9-5s6 1 9 5c-3 4-6 5-9 5s-6-1-9-5z','M3 12h18','M16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z']},
 ped:{c:'#e08a1e',bg:'#fdf1e1',d:[tooth,'M9.5 10.5a3 2 0 0 0 5 0','M9.6 7.8h.01M14.4 7.8h.01']},
 ortho:{c:'#2b6cb0',bg:'#e6eff9',d:['M3 9h18M3 15h18','M5 7h3v4H5zM10.5 7h3v4h-3zM16 7h3v4h-3zM5 13h3v4H5zM10.5 13h3v4h-3zM16 13h3v4h-3z']},
 mfs:{c:'#8b3b2f',bg:'#f6e9e6',d:['M4 6c0 7 3 13 8 13s8-6 8-13','M4 6c2 2 5 3 8 3s6-1 8-3','M9 15h6']},
 esth:{c:'#c48a10',bg:'#fcf3dc',d:[tooth,'M18.5 2.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z']},
 impl:{c:'#4a5d73',bg:'#e9eef3',d:['M8 3h8v3H8z','M9.5 6h5l-.5 13-2 2-2-2z','M9 9.5h6M9.2 12.5h5.6M9.4 15.5h5.2']}
};
export const subjectColor=(id:string)=>ART[id]||ART.prop;

export function SubjectIcon({id,size=22}:{id:string;size?:number}){
 const a=subjectColor(id);
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={a.c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{a.d.map((d,k)=><path key={k} d={d}/>)}</svg>;
}
