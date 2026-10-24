import index from '../data/attestation/index.json';
import type {Lang} from './discoveryData';

/** Attestation prep is ON unless the build sets VITE_ATTESTATION_ENABLED=0 (quick kill switch; the question files are then not
 * bundled at all) or the server variable ATTESTATION_ENABLED is "0" (the app asks /api/attestation/status once). */
export const ATTESTATION_ENABLED=import.meta.env.VITE_ATTESTATION_ENABLED!=='0';
export type AttStatus='ok'|'beta'|'withheld';
export type AttSpec={id:string;name:string;total:number;served:number;servedRu:number;status:AttStatus;agreement:number};
/** The feature is for Uzbek and Russian only: it does not exist (no tab, no route, no credits line) when the app language is English. */
export const attestationOn=(lang:string)=>ATTESTATION_ENABLED&&(lang==='uz'||lang==='ru');
export const ATT_SPECS:AttSpec[]=ATTESTATION_ENABLED?(index as AttSpec[]):[];
type Blk={q:string;o:string[];k:number};
/** A question in one or both languages: uz in q/o/k, ru in r. */
export type AttQ={id:string;q?:string;o?:string[];k?:number;r?:Blk};
// One lazily loaded chunk per specialty; only non-review questions of non-withheld specialties exist in data/attestation/served.
const loaders:Record<string,()=>Promise<{default:{questions:AttQ[]}}>>=ATTESTATION_ENABLED?(import.meta.glob('../data/attestation/served/*.json') as never):{};
export async function loadAtt(id:string,lang:'uz'|'ru'):Promise<Blk[]&{id:string}[]>{
 const f=loaders[`../data/attestation/served/${id}.json`];
 if(!f)return [];
 const all=(await f()).default.questions;
 return all.flatMap(x=>{const b=lang==='ru'?x.r:(x.q?{q:x.q,o:x.o as string[],k:x.k as number}:undefined);return b?[{id:x.id,...b}]:[]});
}

export const SUPPORT_EMAIL='davlatsudekspert@gmail.com';
export const sourceNote={
 uz:'Savollar manbasi: Tibbiyot va farmatsevtika xodimlarining malakasini baholash markazi (tmbm.ssv.uz) ochiq test bazasi. Norasmiy tayyorgarlik vositasi; rasmiy imtihon bilan bog‘liq emas. Javoblar kaliti avtomatik aniqlangan, xatolik haqida xabar bering.',
 ru:'Источник вопросов: открытая тестовая база Центра оценки квалификации медицинских и фармацевтических работников (tmbm.ssv.uz). Неофициальное средство подготовки; не связано с официальным экзаменом. Ключ ответов определён автоматически, сообщайте об ошибках.'
};
export const guaranteeNote={
 uz:'Diqqat: ilova imtihonda aynan shu savollar tushishiga kafolat bermaydi. Bu rasmiy ochiq bazadagi savollar bo‘yicha tayyorgarlik vositasi; imtihon tarkibi o‘zgarishi mumkin.',
 ru:'Внимание: приложение не гарантирует, что на экзамене попадутся именно эти вопросы. Это инструмент подготовки по вопросам из открытой официальной базы; состав экзамена может меняться.'
};
export const contactNote={
 uz:`Aloqa / olib tashlash so‘rovi (huquq egalari uchun): ${SUPPORT_EMAIL}`,
 ru:`Контакты / запрос на удаление (для правообладателей): ${SUPPORT_EMAIL}`
};

export function AttestationNote({lang,noGuarantee}:{lang:Lang;noGuarantee?:boolean}){
 if(lang==='en')return null;
 return <div className="at-note">{!noGuarantee&&<p className="at-guarantee"><b>{guaranteeNote[lang]}</b></p>}<p>{sourceNote[lang]}</p><p>{contactNote[lang]}</p></div>;
}
