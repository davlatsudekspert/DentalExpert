/** Small nickname filter for uz/ru/en: Cyrillic is transliterated, look-alike digits and repeats are folded, then
 * distinctive roots are matched anywhere and short ones only at the start of a word (so "klassik" or "dicky" in a
 * surname-like token do not trip the short roots by accident). It is a first line of defence; teachers can remove members. */
const CYR:Record<string,string>={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'o',қ:'q',ғ:'g',ҳ:'h',і:'i',ї:'i',є:'e'};
const LEET:Record<string,string>={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i','|':'i'};
const ANYWHERE=['fuck','fuk','shit','bitch','cunt','pussy','nigger','nigga','whore','slut','asshole','motherf','pizd','yeban','yebat','yobany','ebat','eban','blyad','blyat','mudak','mudil','pidor','pidar','pedik','zalup','gandon','shlyux','shlyuh','dolbo','dalbayob','dalbayop','qotoq','jalab','onangni','qanjiq','xuesos','huesos','haromi','siktir','dickhead','faggot'];
const WORD_START=['sikay','sikam','sikib','sikdi','sikish','sikvo','xuy','xui','huy','hui','suka','ebl','nahu','naxu','skay'];
export function fold(v:string){
 let t=v.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'');
 t=[...t].map(c=>CYR[c]??LEET[c]??c).join('');
 t=t.replace(/['’‘ʻʼ`]/g,'').replace(/(.)\1+/g,'$1');
 return t;
}
export function isProfane(v:string){
 const f=fold(v);
 const joined=f.replace(/[^a-z]/g,'');
 if(ANYWHERE.some(w=>joined.includes(w)))return true;
 const words=f.split(/[^a-z]+/).filter(Boolean);
 return words.some(w=>WORD_START.some(r=>w.startsWith(r)));
}
