import credits from '../public/credits.json';
import type {Lang} from './discoveryData';

/** Bundled, credited photographs (src/photos/*.webp, listed in public/credits.json). Vite inlines them in the offline build. */
const files=import.meta.glob('./photos/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const photoUrl=(file:string)=>files['./photos/'+file]||'';
type Entry={file:string;width:number;height:number;alt:Record<Lang,string>};
const byFile=new Map((credits.images as unknown as Entry[]).map(e=>[e.file,e]));
export const photoInfo=(file:string)=>byFile.get(file);
export const photoAlt=(file:string,lang:Lang)=>byFile.get(file)?.alt[lang]||'';

/** Subject -> cover photo (only subjects with a clean, correctly matching image appear here; others keep their icon). */
export const SUBJECT_PHOTO:Record<string,string>={radio:'radio.webp',ped:'ped.webp',endo:'endo.webp',surg:'surg.webp',pros:'pros.webp',perio:'perio.webp',impl:'impl.webp',ortho:'ortho.webp',mfs:'mfs.webp',card:'card.webp',prev:'prev.webp'};

/** Focal point (CSS object-position) for the wide hero crop, so the subject of each photo stays inside the 16:7 box. */
export const PHOTO_FOCUS:Record<string,string>={'endo.webp':'50% 22%','mfs.webp':'50% 95%','impl.webp':'50% 58%','pros.webp':'50% 34%','perio.webp':'50% 58%','surg.webp':'50% 40%','ortho.webp':'50% 55%','ped.webp':'50% 55%','card.webp':'45% 62%','prev.webp':'50% 48%'};
export const photoFocus=(file:string)=>PHOTO_FOCUS[file]||'50% 50%';
