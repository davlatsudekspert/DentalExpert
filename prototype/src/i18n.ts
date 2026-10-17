import type {Lang} from './discoveryData';

/** Order in which languages are offered everywhere: English, Russian, Uzbek. */
export const LANG_ORDER:Lang[]=['en','ru','uz'];
export const LANG_LABEL:Record<Lang,string>={en:'English',ru:'Русский',uz:'O‘zbekcha'};

/** Russian plural category: 1 урок, 2 урока, 5 уроков (11–14 take the "many" form). */
export const ruForm=(n:number,one:string,few:string,many:string)=>{const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
/** Counted noun. Uzbek keeps the singular after a number ("8 dars"); English uses one/other. */
export const count=(lang:Lang,n:number,w:{uz:string;ru:[string,string,string];en:[string,string]})=>
 `${n} ${lang==='uz'?w.uz:lang==='ru'?ruForm(n,...w.ru):n===1?w.en[0]:w.en[1]}`;

const MONTHS={
 uz:['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'],
 ruNom:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
 ruGen:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
 en:['January','February','March','April','May','June','July','August','September','October','November','December']
};
const cap=(s:string)=>s[0].toUpperCase()+s.slice(1);
/** Calendar heading: "October 2026", "Октябрь 2026", "Oktabr 2026". Month is 0-based. */
export const monthYear=(lang:Lang,month:number,year:number)=>`${cap(lang==='uz'?MONTHS.uz[month]:lang==='ru'?MONTHS.ruNom[month]:MONTHS.en[month])} ${year}`;
/** Full date: "22 October 2026", "22 октября 2026 г.", "2026-yil 22-oktabr". Month is 0-based. */
export const fullDate=(lang:Lang,day:number,month:number,year:number)=>
 lang==='uz'?`${year}-yil ${day}-${MONTHS.uz[month]}`:lang==='ru'?`${day} ${MONTHS.ruGen[month]} ${year} г.`:`${day} ${MONTHS.en[month]} ${year}`;
/** ISO "2026-10-17" shown as a localized date. */
export const isoDate=(lang:Lang,iso:string)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);return m?fullDate(lang,Number(m[3]),Number(m[2])-1,Number(m[1])):iso};

/** Spoken-language codes on clinician profiles. */
const SPOKEN:Record<string,Record<Lang,string>>={
 UZ:{en:'Uzbek',ru:'узбекский',uz:'o‘zbek'},RU:{en:'Russian',ru:'русский',uz:'rus'},EN:{en:'English',ru:'английский',uz:'ingliz'},
 AR:{en:'Arabic',ru:'арабский',uz:'arab'},TR:{en:'Turkish',ru:'турецкий',uz:'turk'},KK:{en:'Kazakh',ru:'казахский',uz:'qozoq'},
 TG:{en:'Tajik',ru:'таджикский',uz:'tojik'},KY:{en:'Kyrgyz',ru:'киргизский',uz:'qirg‘iz'},DE:{en:'German',ru:'немецкий',uz:'nemis'}
};
export const spokenLanguages=(codes:string[],lang:Lang)=>{const names=codes.map(c=>SPOKEN[c.toUpperCase()]?.[lang]||c);return names.length?cap(names.join(', ')):''};
