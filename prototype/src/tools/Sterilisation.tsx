import {useState} from 'react';
import {Activity,CircleCheck,Droplets,Gauge,Hand,Layers,ScanSearch,Sparkles,Package,Archive,Timer,Thermometer} from 'lucide-react';
import {Notice,Seg,Sources,type L,type ToolProps} from './shared';

/* ------------------------------------------------------------------ data
 * Spaulding EH (1968) categories with dental examples and processing as given in
 * CDC, Guidelines for Infection Control in Dental Health-Care Settings, 2003 (MMWR 52/RR-17).
 * Steam cycles: holding times per EN 13060 / HTM 01-05 (121 °C ≥15 min; 134 °C ≥3 min) and
 * CDC 2008 (gravity-displacement, wrapped: 121 °C 30 min). Pressures are approximate gauge
 * pressures of saturated steam at that temperature.
 */
type Cat={id:'crit'|'semi'|'non';tone:'red'|'amber'|'brand';name:L;def:L;ex:L[];proc:L};

const CATS:Cat[]=[
 {id:'crit',tone:'red',
  name:{uz:'Kritik',ru:'Критические',en:'Critical'},
  def:{uz:'Yumshoq to‘qimani teshib o‘tadi yoki suyakka, qon oqimiga yoki boshqa steril to‘qimaga tegadi.',ru:'Проникают в мягкие ткани, контактируют с костью, кровотоком или другими в норме стерильными тканями.',en:'Penetrate soft tissue, contact bone, enter or contact the bloodstream or other normally sterile tissue.'},
  ex:[
   {uz:'Jarrohlik asboblari, ekstraksiya qisqichlari va elevatorlar',ru:'Хирургические инструменты, щипцы и элеваторы для удаления',en:'Surgical instruments, extraction forceps and elevators'},
   {uz:'Parodontal skalerlar va kyuretkalar',ru:'Пародонтальные скейлеры и кюретки',en:'Periodontal scalers and curettes'},
   {uz:'Skalpel tig‘lari',ru:'Лезвия скальпеля',en:'Scalpel blades'},
   {uz:'Jarrohlik borlari',ru:'Хирургические боры',en:'Surgical burs'}],
  proc:{uz:'Issiqlik bilan sterilizatsiya qilinadi yoki bir martalik buyum ishlatiladi.',ru:'Стерилизация паром (теплом) или одноразовые изделия.',en:'Heat sterilisation, or use single-use disposable items.'}},
 {id:'semi',tone:'amber',
  name:{uz:'Yarim kritik',ru:'Полукритические',en:'Semi-critical'},
  def:{uz:'Shilliq qavatga yoki butunligi buzilgan teriga tegadi, lekin to‘qimani teshib o‘tmaydi.',ru:'Контактируют со слизистой оболочкой или повреждённой кожей, но не проникают в ткани.',en:'Contact mucous membranes or non-intact skin but do not penetrate soft tissue.'},
  ex:[
   {uz:'Stomatologik ko‘zgu',ru:'Стоматологическое зеркало',en:'Mouth mirror'},
   {uz:'Amalgama kondensori (plyugger)',ru:'Штопфер для амальгамы',en:'Amalgam condenser'},
   {uz:'Qayta ishlatiladigan qolip qoshiqlari',ru:'Многоразовые оттискные ложки',en:'Reusable impression trays'},
   {uz:'Stomatologik uchliklar (nakonechniklar)',ru:'Стоматологические наконечники',en:'Dental handpieces'}],
  proc:{uz:'Issiqlikka chidamli bo‘lsa — issiqlik bilan sterilizatsiya. Issiqlikka sezgir bo‘lsa — kamida yuqori darajali dezinfeksiya. Uchliklar har bir bemordan keyin issiqlik bilan sterilizatsiya qilinadi.',ru:'Термостойкие — стерилизация теплом. Термочувствительные — как минимум дезинфекция высокого уровня. Наконечники стерилизуют теплом после каждого пациента.',en:'Heat-tolerant: heat sterilisation. Heat-sensitive: high-level disinfection at minimum. Handpieces are heat-sterilised between patients.'}},
 {id:'non',tone:'brand',
  name:{uz:'Nokritik',ru:'Некритические',en:'Non-critical'},
  def:{uz:'Faqat butun teriga tegadi.',ru:'Контактируют только с неповреждённой кожей.',en:'Contact intact skin only.'},
  ex:[
   {uz:'Rentgen apparati tubusi (boshi)',ru:'Тубус (головка) рентгеновского аппарата',en:'Radiograph tube head (cone)'},
   {uz:'Qon bosimi manjeti',ru:'Манжета тонометра',en:'Blood pressure cuff'},
   {uz:'Yuz yoyi (feysbou)',ru:'Лицевая дуга',en:'Facebow'},
   {uz:'Pulsoksimetr',ru:'Пульсоксиметр',en:'Pulse oximeter'}],
  proc:{uz:'Tozalanadi va past darajali dezinfektant bilan ishlov beriladi; qon bilan ko‘rinadigan darajada ifloslangan bo‘lsa — o‘rta darajali (tuberkulotsid) dezinfektant.',ru:'Очистка и дезинфекция низкого уровня; при видимом загрязнении кровью — дезинфектант среднего уровня (туберкулоцидный).',en:'Clean and low-level disinfect; if visibly contaminated with blood, use an intermediate-level (tuberculocidal) disinfectant.'}},
];

type Cycle={temp:string;bar:string;psi:string;hold:L;use:L;note?:L};
const CYCLES:Cycle[]=[
 {temp:'121',bar:'1,0',psi:'15',
  hold:{uz:'kamida 15 daqiqa',ru:'не менее 15 мин',en:'at least 15 min'},
  use:{uz:'Issiqlikka sezgirroq, lekin 121 °C ga ruxsat etilgan buyumlar (ayrim plastmassa va matolar).',ru:'Более термочувствительные изделия, допускающие 121 °C (некоторые пластмассы и текстиль).',en:'More heat-sensitive items rated for 121 °C (some plastics and textiles).'},
  note:{uz:'Gravitatsion rejimda o‘ralgan yuk uchun odatda 30 daqiqa.',ru:'В гравитационном режиме для упакованной загрузки обычно 30 мин.',en:'Gravity-displacement cycles for wrapped loads: typically 30 min.'}},
 {temp:'134',bar:'2,0',psi:'30',
  hold:{uz:'kamida 3 daqiqa',ru:'не менее 3 мин',en:'at least 3 min'},
  use:{uz:'Ko‘pchilik zanglamaydigan po‘lat asboblar va ishlab chiqaruvchi ruxsat bergan uchliklar uchun standart rejim.',ru:'Стандартный режим для большинства инструментов из нержавеющей стали и наконечников, если это допускает производитель.',en:'Standard cycle for most stainless-steel instruments and for handpieces where the manufacturer allows.'},
  note:{uz:'Oldindan vakuumli (B klass) sterilizatorda o‘ralgan va kovak buyumlar uchun.',ru:'В стерилизаторе с предвакуумом (класс B) — для упакованных и полых изделий.',en:'In a pre-vacuum (Class B) steriliser for wrapped and hollow items.'}},
];

type Cls={id:string;text:L};
const CLASSES:Cls[]=[
 {id:'B',text:{uz:'O‘ralgan, kovak (uchliklar) va g‘ovak yuklar; havo vakuum bilan chiqariladi.',ru:'Упакованные, полые (наконечники) и пористые загрузки; воздух удаляется вакуумом.',en:'Wrapped, hollow (handpieces) and porous loads; air removed by vacuum.'}},
 {id:'N',text:{uz:'Faqat o‘ralmagan, yaxlit (kovaksiz) buyumlar.',ru:'Только неупакованные сплошные (неполые) изделия.',en:'Unwrapped solid (non-hollow) items only.'}},
 {id:'S',text:{uz:'Ishlab chiqaruvchi ko‘rsatgan yuk turlari uchun.',ru:'Для загрузок, указанных производителем.',en:'For the load types specified by the manufacturer.'}},
];

const T={
 uz:{
  noticeT:'Ishlab chiqaruvchi ko‘rsatmasiga amal qiling',
  notice:'Rejimlar odatiy qiymatlar. Sterilizator va har bir asbob uchun ishlab chiqaruvchining ko‘rsatmasi (IFU) hamda mamlakatingiz me’yoriy hujjatlari ustuvor.',
  tabSp:'Spaulding tasnifi',tabAc:'Avtoklav',tab:'Bo‘lim',
  spIntro:'Asbob bemorning qaysi to‘qimasiga tegishiga qarab qayta ishlash darajasi tanlanadi.',
  def:'Ta’rif',ex:'Stomatologiyadan misollar',proc:'Qayta ishlash',
  cycles:'Odatiy bug‘ rejimlari',hold:'Ushlab turish vaqti',press:'Bosim',use:'Qo‘llanilishi',
  pressV:(b:string,p:string)=>`≈${b} bar (≈${p} psi) atmosferadan yuqori`,
  holdNote:'Ushlab turish vaqti qizdirish va quritish bosqichlariga kirmaydi; to‘liq sikl ancha uzoq davom etadi.',
  classes:'Kichik bug‘ sterilizatorlari klasslari (EN 13060)',
  steps:'Asboblarni qayta ishlash tartibi',
  stepList:['Tozalash (ultratovushli vanna yoki yuvish-dezinfeksiya mashinasi)','Ko‘zdan kechirish va quritish','Qadoqlash va belgilash','Sterilizatsiya','Quruq, yopiq joyda saqlash'],
  monitor:'Nazorat',
  monList:['Fizik: har siklda harorat, bosim va vaqt qayd etiladi','Kimyoviy: har bir paket ichida va tashqarisida indikator','Biologik: spora testi (Geobacillus stearothermophilus) kamida haftada bir marta'],
  src:'Manbalar',
 },
 ru:{
  noticeT:'Следуйте инструкции производителя',
  notice:'Режимы приведены как типичные значения. Приоритет имеют инструкции производителя стерилизатора и каждого инструмента (IFU), а также национальные нормативные документы.',
  tabSp:'Классификация Сполдинга',tabAc:'Автоклав',tab:'Раздел',
  spIntro:'Уровень обработки выбирают в зависимости от того, с какими тканями пациента контактирует изделие.',
  def:'Определение',ex:'Примеры в стоматологии',proc:'Обработка',
  cycles:'Типичные режимы паровой стерилизации',hold:'Время выдержки',press:'Давление',use:'Применение',
  pressV:(b:string,p:string)=>`≈${b} бар (≈${p} psi) избыточного давления`,
  holdNote:'Время выдержки не включает нагрев и сушку; полный цикл значительно длиннее.',
  classes:'Классы малых паровых стерилизаторов (EN 13060)',
  steps:'Порядок обработки инструментов',
  stepList:['Очистка (ультразвуковая ванна или моюще-дезинфицирующая машина)','Осмотр и сушка','Упаковка и маркировка','Стерилизация','Хранение в сухом закрытом месте'],
  monitor:'Контроль',
  monList:['Физический: температура, давление и время в каждом цикле','Химический: индикатор внутри и снаружи каждой упаковки','Биологический: споровый тест (Geobacillus stearothermophilus) не реже одного раза в неделю'],
  src:'Источники',
 },
 en:{
  noticeT:'Follow the manufacturer’s instructions',
  notice:'Cycles shown are typical values. The instructions for use (IFU) of the steriliser and of each instrument, and your national regulations, take precedence.',
  tabSp:'Spaulding classification',tabAc:'Autoclave',tab:'Section',
  spIntro:'The level of reprocessing depends on which patient tissues the item contacts.',
  def:'Definition',ex:'Dental examples',proc:'Reprocessing',
  cycles:'Typical steam cycles',hold:'Holding time',press:'Pressure',use:'Use',
  pressV:(b:string,p:string)=>`≈${b.replace(',','.')} bar (≈${p} psi) above atmospheric`,
  holdNote:'Holding time excludes heat-up and drying; the full cycle takes considerably longer.',
  classes:'Small steam steriliser classes (EN 13060)',
  steps:'Instrument reprocessing sequence',
  stepList:['Cleaning (ultrasonic bath or washer-disinfector)','Inspection and drying','Packaging and labelling','Sterilisation','Storage in a dry, closed area'],
  monitor:'Monitoring',
  monList:['Physical: time, temperature and pressure recorded every cycle','Chemical: an indicator inside and outside every package','Biological: spore test (Geobacillus stearothermophilus) at least weekly'],
  src:'Sources',
 },
};

const STEP_ICONS=[Droplets,ScanSearch,Package,Thermometer,Archive];
const MON_ICONS=[Gauge,CircleCheck,Activity];

export default function Sterilisation({lang}:ToolProps){
 const t=T[lang];
 const [tab,setTab]=useState<'sp'|'ac'>('sp');
 return <div className="tl-stack">
  <Seg label={t.tab} value={tab} options={[{id:'sp',label:t.tabSp},{id:'ac',label:t.tabAc}]} onChange={setTab}/>

  {tab==='sp'&&<>
   <p className="tl-muted">{t.spIntro}</p>
   <svg className="tl-sp-fig" viewBox="0 0 320 64" role="img" aria-label={CATS.map(c=>c.name[lang]).join(', ')}>
    <defs><linearGradient id="tl-sp-g" x1="0" x2="1"><stop offset="0" stopColor="#b3261e"/><stop offset=".5" stopColor="#d79a2b"/><stop offset="1" stopColor="#168d8b"/></linearGradient></defs>
    <rect x="8" y="26" width="304" height="10" rx="5" fill="url(#tl-sp-g)" opacity=".85"/>
    {CATS.map((c,i)=>{const x=[40,160,280][i];return <g key={c.id}>
     <circle cx={x} cy="31" r="12" fill="#fff" stroke={c.tone==='red'?'#b3261e':c.tone==='amber'?'#8a5a0b':'#168d8b'} strokeWidth="3"/>
     <text x={x} y="35.5" textAnchor="middle" className="tl-sp-fig-n">{i+1}</text>
     <text x={[8,160,312][i]} y="60" textAnchor={i===0?'start':i===2?'end':'middle'} className="tl-sp-fig-t">{c.name[lang]}</text>
    </g>})}
    <text x="8" y="14" className="tl-sp-fig-s">{lang==='uz'?'Yuqori xavf':lang==='ru'?'Высокий риск':'Higher risk'}</text>
    <text x="312" y="14" textAnchor="end" className="tl-sp-fig-s">{lang==='uz'?'Past xavf':lang==='ru'?'Низкий риск':'Lower risk'}</text>
   </svg>
   {CATS.map(c=><section key={c.id} className={'tl-card tl-sp tl-sp-'+c.tone}>
    <div className="tl-sp-head">
     <span className={'tl-badge tl-badge-'+c.tone}>{c.name[lang]}</span>
    </div>
    <p className="tl-sp-def">{c.def[lang]}</p>
    <h4 className="tl-h4">{t.ex}</h4>
    <ul className="tl-bullets">{c.ex.map(e=><li key={e.en}>{e[lang]}</li>)}</ul>
    <div className="tl-sp-proc"><Sparkles size={16} aria-hidden="true"/><div><strong>{t.proc}</strong><p>{c.proc[lang]}</p></div></div>
   </section>)}
  </>}

  {tab==='ac'&&<>
   <Notice title={t.noticeT}><p>{t.notice}</p></Notice>
   <h3 className="tl-h3">{t.cycles}</h3>
   <div className="tl-cycles">
    {CYCLES.map(c=><section key={c.temp} className="tl-card tl-cycle">
     <div className="tl-cycle-temp"><Thermometer size={18} aria-hidden="true"/><b>{c.temp}</b><span>°C</span></div>
     <dl className="tl-kv">
      <div><dt><Timer size={14} aria-hidden="true"/>{t.hold}</dt><dd>{c.hold[lang]}</dd></div>
      <div><dt><Gauge size={14} aria-hidden="true"/>{t.press}</dt><dd>{t.pressV(c.bar,c.psi)}</dd></div>
      <div><dt><Hand size={14} aria-hidden="true"/>{t.use}</dt><dd>{c.use[lang]}</dd></div>
     </dl>
     {c.note&&<p className="tl-muted tl-small">{c.note[lang]}</p>}
    </section>)}
   </div>
   <p className="tl-muted tl-small">{t.holdNote}</p>

   <section className="tl-card">
    <h3 className="tl-h3"><Layers size={16} aria-hidden="true"/>{t.classes}</h3>
    <ul className="tl-codes">{CLASSES.map(c=><li key={c.id}><span className="tl-code">{c.id}</span><p>{c.text[lang]}</p></li>)}</ul>
   </section>

   <section className="tl-card">
    <h3 className="tl-h3">{t.steps}</h3>
    <ol className="tl-steps">{t.stepList.map((s,i)=>{const I=STEP_ICONS[i];return <li key={s}><span className="tl-step-ico" aria-hidden="true"><I size={16}/></span><span>{s}</span></li>})}</ol>
   </section>

   <section className="tl-card">
    <h3 className="tl-h3">{t.monitor}</h3>
    <ul className="tl-steps tl-steps-plain">{t.monList.map((s,i)=>{const I=MON_ICONS[i];return <li key={s}><span className="tl-step-ico" aria-hidden="true"><I size={16}/></span><span>{s}</span></li>})}</ul>
   </section>
  </>}

  <Sources label={t.src} items={[
   'Spaulding EH. Chemical disinfection of medical and surgical materials. In: Lawrence CA, Block SS, eds. Disinfection, Sterilization, and Preservation. Philadelphia: Lea & Febiger; 1968:517–531.',
   'Kohn WG, et al. Guidelines for Infection Control in Dental Health-Care Settings — 2003. MMWR Recomm Rep. 2003;52(RR-17):1–61.',
   'Rutala WA, Weber DJ, HICPAC. Guideline for Disinfection and Sterilization in Healthcare Facilities. CDC; 2008.',
   'EN 13060. Small steam sterilizers. CEN.',
   'Department of Health (England). HTM 01-05: Decontamination in primary care dental practices.',
  ]}/>
 </div>;
}
