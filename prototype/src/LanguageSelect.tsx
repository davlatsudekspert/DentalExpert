import LogoMark from './LogoMark';
import type {Lang} from './discoveryData';

const options:{lang:Lang;label:string;hint:string}[]=[
 {lang:'en',label:'English',hint:'Continue in English'},
 {lang:'ru',label:'Русский',hint:'Продолжить на русском'},
 {lang:'uz',label:'O‘zbekcha',hint:'O‘zbek tilida davom etish'}
];

/** First screen on a fresh install: pick the app language, then registration follows. */
export default function LanguageSelect({onPick}:{onPick:(lang:Lang)=>void}){
 return <section className="language-select" aria-label="Language">
  <div className="language-brand"><span className="brand-symbol"><LogoMark/></span><span>Dental<span>Expert</span></span></div>
  <h1>Choose your language</h1>
  <p>Выберите язык · Tilni tanlang</p>
  <div className="language-list">
   {options.map(o=><button key={o.lang} className="language-option" onClick={()=>onPick(o.lang)} lang={o.lang}>
    <strong>{o.label}</strong><small>{o.hint}</small>
   </button>)}
  </div>
 </section>;
}
