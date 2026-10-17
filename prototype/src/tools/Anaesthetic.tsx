import {useId,useState} from 'react';
import {Baby,HeartPulse,Minus,Plus,Layers} from 'lucide-react';
import {Notice,Seg,Sources,type L,type Lang,type ToolProps} from './shared';

/* ------------------------------------------------------------------ data
 * Maximum recommended doses (MRD) as tabulated in
 * Malamed SF, Handbook of Local Anesthesia, 7th ed. (Elsevier, 2019).
 * mgkg = MRD per kg body weight, max = absolute maximum per appointment.
 */
export type DrugId='lido'|'arti'|'mepi'|'prilo'|'bupi';
export type Drug={id:DrugId;pct:number;mgkg:number;max:number;epi:L|null;name:L};

export const DRUGS:Drug[]=[
 {id:'lido',pct:2,mgkg:7.0,max:500,
  name:{uz:'Lidokain 2%',ru:'Лидокаин 2%',en:'Lidocaine 2%'},
  epi:{uz:'epinefrin 1:100 000 bilan',ru:'с эпинефрином 1:100 000',en:'with epinephrine 1:100,000'}},
 {id:'arti',pct:4,mgkg:7.0,max:500,
  name:{uz:'Artikain 4%',ru:'Артикаин 4%',en:'Articaine 4%'},
  epi:{uz:'epinefrin 1:100 000 yoki 1:200 000 bilan',ru:'с эпинефрином 1:100 000 или 1:200 000',en:'with epinephrine 1:100,000 or 1:200,000'}},
 {id:'mepi',pct:3,mgkg:6.6,max:400,
  name:{uz:'Mepivakain 3%',ru:'Мепивакаин 3%',en:'Mepivacaine 3%'},
  epi:null},
 {id:'prilo',pct:4,mgkg:8.0,max:600,
  name:{uz:'Prilokain 4%',ru:'Прилокаин 4%',en:'Prilocaine 4%'},
  epi:{uz:'oddiy yoki epinefrin 1:200 000 bilan',ru:'без вазоконстриктора или с эпинефрином 1:200 000',en:'plain or with epinephrine 1:200,000'}},
 {id:'bupi',pct:0.5,mgkg:1.3,max:90,
  name:{uz:'Bupivakain 0,5%',ru:'Бупивакаин 0,5%',en:'Bupivacaine 0.5%'},
  epi:{uz:'epinefrin 1:200 000 bilan',ru:'с эпинефрином 1:200 000',en:'with epinephrine 1:200,000'}},
];

export const VOLUMES=[1.8,1.7,2.2] as const;
export type Volume=typeof VOLUMES[number];

/** Round DOWN to one decimal; the epsilon absorbs binary floating-point noise (e.g. 13.999999…). */
export function floor1(x:number){return Math.floor(x*10+1e-9)/10}

export type DoseResult={mgPerCart:number;byWeight:number;maxMg:number;carts:number;capped:boolean};

/** mg per cartridge = concentration % × 10 × volume (mL); max mg = min(MRD mg/kg × weight, absolute max). */
export function calcDose(drug:Drug,weightKg:number,volumeMl:number):DoseResult{
 const mgPerCart=drug.pct*10*volumeMl;
 const byWeight=drug.mgkg*weightKg;
 const capped=byWeight>drug.max;
 const maxMg=capped?drug.max:byWeight;
 return {mgPerCart,byWeight,maxMg:floor1(maxMg),carts:floor1(maxMg/mgPerCart),capped};
}

/* ------------------------------------------------------------------ i18n */
const T={
 uz:{
  discTitle:'Faqat o‘quv yordamchisi',
  disc:'Bu hisob-kitob o‘quv maqsadida berilgan. Klinik qaror bemorning tibbiy anamnezi va mahalliy klinik ko‘rsatmalarga asoslanib qabul qilinadi. Keksa, og‘ir umumiy kasalligi bor bemorlar va bolalarda xavfsiz doza bundan ancha past bo‘lishi mumkin.',
  weight:'Bemor vazni',kg:'kg',less:'Vaznni 1 kg kamaytirish',more:'Vaznni 1 kg oshirish',
  drug:'Anestetik',plain:'vazokonstriktorsiz',volume:'Karpula hajmi',ml:'ml',
  enter:'Hisoblash uchun vaznni kiriting (1–250 kg).',
  maxMg:'Maksimal doza',maxCarts:'Maksimal karpula',mg:'mg',carts:'karpula',
  perCart:(v:string,mg:string)=>`${v} ml karpulada ${mg} mg`,
  rule:(k:string,m:string)=>`Me’yor: ${k} mg/kg, mutlaq chegara ${m} mg`,
  byW:(w:string,k:string,r:string)=>`${k} mg/kg × ${w} kg = ${r} mg`,
  capped:(m:string)=>`Mutlaq chegara qo‘llanildi: ${m} mg`,
  rounding:'Karpulalar soni 0,1 gacha pastga yaxlitlangan.',
  visual:'Karpulalar soni ko‘rinishda',
  cardTitle:'Yurak-qon tomir kasalligi bo‘lgan bemor',
  card:'Epinefrin bir tashrifda 0,04 mg dan oshmasligi tavsiya etiladi: bu 1:100 000 konsentratsiyali taxminan 2 ta karpula (1,8 ml karpulada 0,018 mg). Sog‘lom kattalar uchun odatiy chegara bir tashrifda 0,2 mg (1:100 000 dan ≈11 karpula).',
  childTitle:'Bolalar',
  child:'Bolalarda dozani albatta vaznga (mg/kg) qarab hisoblang, yoshga qarab taxmin qilmang. Bolani tarozida o‘lchang va hisoblangan dozadan oshmang.',
  childHint:'Kichik vazn: bolalar uchun eslatmaga e’tibor bering.',
  comboTitle:'Ikki anestetik birga',
  combo:'Ikki xil anestetik birga qo‘llansa, umumiy miqdor ikkalasining past maksimal dozasidan oshmasligi kerak.',
  src:'Manba',
 },
 ru:{
  discTitle:'Только учебный инструмент',
  disc:'Расчёт носит учебный характер. Клиническое решение принимается с учётом анамнеза пациента и местных клинических рекомендаций. У пожилых, соматически отягощённых пациентов и детей безопасная доза может быть значительно ниже.',
  weight:'Масса тела пациента',kg:'кг',less:'Уменьшить массу на 1 кг',more:'Увеличить массу на 1 кг',
  drug:'Анестетик',plain:'без вазоконстриктора',volume:'Объём карпулы',ml:'мл',
  enter:'Введите массу тела для расчёта (1–250 кг).',
  maxMg:'Максимальная доза',maxCarts:'Максимум карпул',mg:'мг',carts:'карпул',
  perCart:(v:string,mg:string)=>`${mg} мг в карпуле ${v} мл`,
  rule:(k:string,m:string)=>`Норма: ${k} мг/кг, абсолютный максимум ${m} мг`,
  byW:(w:string,k:string,r:string)=>`${k} мг/кг × ${w} кг = ${r} мг`,
  capped:(m:string)=>`Применён абсолютный максимум: ${m} мг`,
  rounding:'Число карпул округлено вниз до 0,1.',
  visual:'Количество карпул наглядно',
  cardTitle:'Пациент с сердечно-сосудистым заболеванием',
  card:'Рекомендуется не превышать 0,04 мг эпинефрина за посещение: это около 2 карпул с концентрацией 1:100 000 (0,018 мг в карпуле 1,8 мл). Для здорового взрослого обычный предел — 0,2 мг за посещение (≈11 карпул 1:100 000).',
  childTitle:'Дети',
  child:'У детей дозу обязательно рассчитывают по массе тела (мг/кг), а не по возрасту. Взвесьте ребёнка и не превышайте рассчитанную дозу.',
  childHint:'Небольшая масса тела: обратите внимание на примечание для детей.',
  comboTitle:'Сочетание двух анестетиков',
  combo:'При сочетании двух анестетиков суммарная доза не должна превышать меньшую из их максимальных доз.',
  src:'Источник',
 },
 en:{
  discTitle:'Educational aid only',
  disc:'This calculation is for education. Clinical decisions follow the patient’s medical history and local guidelines. Safe doses can be considerably lower for elderly, medically compromised and paediatric patients.',
  weight:'Patient weight',kg:'kg',less:'Decrease weight by 1 kg',more:'Increase weight by 1 kg',
  drug:'Anaesthetic',plain:'plain (no vasoconstrictor)',volume:'Cartridge volume',ml:'mL',
  enter:'Enter a weight to calculate (1–250 kg).',
  maxMg:'Maximum dose',maxCarts:'Maximum cartridges',mg:'mg',carts:'cartridges',
  perCart:(v:string,mg:string)=>`${mg} mg per ${v} mL cartridge`,
  rule:(k:string,m:string)=>`MRD: ${k} mg/kg, absolute maximum ${m} mg`,
  byW:(w:string,k:string,r:string)=>`${k} mg/kg × ${w} kg = ${r} mg`,
  capped:(m:string)=>`Absolute maximum applied: ${m} mg`,
  rounding:'Cartridges are rounded down to 0.1.',
  visual:'Cartridge count, visualised',
  cardTitle:'Cardiovascular patient',
  card:'Keep epinephrine to 0.04 mg per appointment: about 2 cartridges of 1:100,000 (0.018 mg per 1.8 mL cartridge). The usual limit for a healthy adult is 0.2 mg per appointment (≈11 cartridges of 1:100,000).',
  childTitle:'Children',
  child:'In children, weight-based dosing (mg/kg) is essential; never estimate from age. Weigh the child and do not exceed the calculated dose.',
  childHint:'Low body weight: see the note for children.',
  comboTitle:'Two anaesthetics combined',
  combo:'When two anaesthetics are combined, the total should not exceed the lower of their maximum doses.',
  src:'Source',
 },
};

export function fmt(n:number,lang:Lang,digits=1){
 const s=(Math.round(n*10**digits)/10**digits).toFixed(digits).replace(/\.0+$/,'');
 return lang==='en'?s:s.replace('.',',');
}

function Cartridges({count,label}:{count:number;label:string}){
 const full=Math.floor(count+1e-9),part=floor1(count-full);
 const items=Array.from({length:full},()=>1);
 if(part>0)items.push(part);
 return <div className="tl-carts" role="img" aria-label={label}>
  {items.map((f,i)=><svg key={i} className="tl-cart" viewBox="0 0 14 40" aria-hidden="true">
   <rect x="4" y="0.5" width="6" height="3" rx="1" fill="#9db8bf"/>
   <rect x="1.5" y="3.5" width="11" height="34" rx="3" fill="#fff" stroke="#9db8bf"/>
   <rect x="2.5" y={4.5+32*(1-f)} width="9" height={32*f} rx="2" fill={f<1?'#7fc4c2':'#168d8b'}/>
   <rect x="3" y="37.5" width="8" height="2" rx="1" fill="#183e50"/>
  </svg>)}
 </div>;
}

export default function Anaesthetic({lang}:ToolProps){
 const t=T[lang];
 const ids={w:useId(),d:useId()};
 const [raw,setRaw]=useState('70');
 const [drugId,setDrugId]=useState<DrugId>('lido');
 const [vol,setVol]=useState<Volume>(1.8);
 const drug=DRUGS.find(d=>d.id===drugId)!;
 const w=Number(raw.replace(',','.'));
 const valid=raw.trim()!==''&&Number.isFinite(w)&&w>=1&&w<=250;
 const r=valid?calcDose(drug,w,vol):null;
 const step=(d:number)=>{const base=valid?w:70;const n=Math.min(250,Math.max(1,Math.round(base+d)));setRaw(String(n))};

 return <div className="tl-stack">
  <Notice title={t.discTitle}><p>{t.disc}</p></Notice>

  <section className="tl-card">
   <label className="tl-label" htmlFor={ids.w}>{t.weight}</label>
   <div className="tl-stepper">
    <button type="button" className="tl-step-btn" aria-label={t.less} onClick={()=>step(-1)}><Minus size={20}/></button>
    <div className="tl-weight">
     <input id={ids.w} className="tl-weight-input" type="text" inputMode="decimal" autoComplete="off" value={raw} onChange={e=>setRaw(e.target.value.replace(/[^0-9.,]/g,'').slice(0,6))} aria-invalid={!valid}/>
     <span className="tl-weight-unit">{t.kg}</span>
    </div>
    <button type="button" className="tl-step-btn" aria-label={t.more} onClick={()=>step(1)}><Plus size={20}/></button>
   </div>

   <span className="tl-label" id={ids.d}>{t.drug}</span>
   <div className="tl-drugs" role="radiogroup" aria-labelledby={ids.d}>
    {DRUGS.map(d=><button key={d.id} type="button" role="radio" aria-checked={d.id===drugId} className={'tl-drug'+(d.id===drugId?' tl-drug-on':'')} onClick={()=>setDrugId(d.id)}>
     <span className="tl-drug-dot" aria-hidden="true"/>
     <span className="tl-drug-text"><strong>{d.name[lang]}</strong><small>{d.epi?d.epi[lang]:t.plain}</small></span>
     <span className="tl-drug-mrd">{fmt(d.mgkg,lang)} mg/kg</span>
    </button>)}
   </div>

   <span className="tl-label">{t.volume}</span>
   <Seg label={t.volume} value={String(vol)} options={VOLUMES.map(v=>({id:String(v),label:`${fmt(v,lang)} ${t.ml}`}))} onChange={v=>setVol(Number(v) as Volume)}/>
  </section>

  <section className="tl-card tl-result" aria-live="polite">
   {!r?<p className="tl-muted">{t.enter}</p>:<>
    <div className="tl-result-grid">
     <div className="tl-metric">
      <span className="tl-metric-label">{t.maxMg}</span>
      <span className="tl-metric-num" data-testid="max-mg">{fmt(r.maxMg,lang)}<small>{t.mg}</small></span>
     </div>
     <div className="tl-metric tl-metric-brand">
      <span className="tl-metric-label">{t.maxCarts}</span>
      <span className="tl-metric-num" data-testid="max-carts">{fmt(r.carts,lang)}<small>{t.carts}</small></span>
     </div>
    </div>
    <Cartridges count={r.carts} label={`${t.visual}: ${fmt(r.carts,lang)}`}/>
    <ul className="tl-calc">
     <li><Layers size={14} aria-hidden="true"/>{t.perCart(fmt(vol,lang),fmt(r.mgPerCart,lang))}</li>
     <li className={r.capped?'tl-calc-off':''}>{t.byW(fmt(w,lang),fmt(drug.mgkg,lang),fmt(r.byWeight,lang))}</li>
     {r.capped&&<li className="tl-calc-cap">{t.capped(fmt(drug.max,lang))}</li>}
     <li className="tl-muted">{t.rule(fmt(drug.mgkg,lang),fmt(drug.max,lang))}. {t.rounding}</li>
    </ul>
    {w<40&&<p className="tl-hint"><Baby size={16} aria-hidden="true"/>{t.childHint}</p>}
   </>}
  </section>

  <section className="tl-notes">
   <div className="tl-note"><span className="tl-note-icon tl-note-red" aria-hidden="true"><HeartPulse size={18}/></span><div><strong>{t.cardTitle}</strong><p>{t.card}</p></div></div>
   <div className={'tl-note'+(valid&&w<40?' tl-note-focus':'')}><span className="tl-note-icon tl-note-amber" aria-hidden="true"><Baby size={18}/></span><div><strong>{t.childTitle}</strong><p>{t.child}</p></div></div>
   <div className="tl-note"><span className="tl-note-icon" aria-hidden="true"><Layers size={18}/></span><div><strong>{t.comboTitle}</strong><p>{t.combo}</p></div></div>
  </section>

  <Sources label={t.src} items={['Malamed SF. Handbook of Local Anesthesia. 7th ed. St. Louis: Elsevier; 2019. Maximum recommended doses (MRD) of local anaesthetics and vasoconstrictors.']}/>
 </div>;
}
