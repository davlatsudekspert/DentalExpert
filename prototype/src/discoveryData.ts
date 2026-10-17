export type Lang='uz'|'ru'|'en';
export type Translated=Record<Lang,string>;
export type CityId='UZ-AN'|'UZ-FA'|'UZ-TK'|'AE-DU';

export type DemoDoctor={
 id:string;name:string;initials:string;portrait?:0|1|2;
 cityId:CityId;countryCode:'UZ'|'AE';clinic:string;
 specialty:Translated;bio:Translated;address:Translated;
 languages:string[];years:number;score:string;services:Translated[];
 // Present only for profiles loaded from the API; local demo profiles leave these unset.
 isDemo?:boolean;photoUrl?:string;contacts?:{kind:string;value:string}[];
};

export const demoCities:{id:CityId;countryCode:'UZ'|'AE';label:Translated}[]=[
 {id:'UZ-AN',countryCode:'UZ',label:{uz:'Andijon',ru:'Андижан',en:'Andijan'}},
 {id:'UZ-FA',countryCode:'UZ',label:{uz:'Farg‘ona',ru:'Фергана',en:'Fergana'}},
 {id:'UZ-TK',countryCode:'UZ',label:{uz:'Toshkent',ru:'Ташкент',en:'Tashkent'}},
 {id:'AE-DU',countryCode:'AE',label:{uz:'Dubay',ru:'Дубай',en:'Dubai'}}
];

export const cityName=(id:string,lang:Lang)=>demoCities.find(x=>x.id===id)?.label[lang]||id;

const T=(uz:string,ru:string,en:string):Translated=>({uz,ru,en});
export const demoDoctors:DemoDoctor[]=[
 {id:'kamila',name:'Dr. Kamila Karimova',initials:'KK',portrait:0,cityId:'UZ-AN',countryCode:'UZ',clinic:'Dental Avenue',specialty:T('Estetik stomatolog','Эстетический стоматолог','Aesthetic dentist'),bio:T('Tabassum estetikasi va profilaktik ko‘rik bo‘yicha namunaviy mutaxassis profili.','Пример профиля специалиста по эстетике улыбки и профилактическим осмотрам.','Sample specialist profile for smile aesthetics and preventive visits.'),address:T('Andijon, markaziy hudud','Андижан, центральный район','Central Andijan'),languages:['UZ','RU'],years:12,score:'4.9',services:[T('Konsultatsiya','Консультация','Consultation'),T('Professional tozalash','Профессиональная чистка','Professional cleaning')]},
 {id:'aziz',name:'Dr. Aziz Rahimov',initials:'AR',portrait:1,cityId:'UZ-AN',countryCode:'UZ',clinic:'Andijan Dental Studio',specialty:T('Implantolog','Имплантолог','Implant dentist'),bio:T('Implantologiya yo‘nalishidagi namunaviy profil; klinik xizmatlar demo sifatida ko‘rsatilgan.','Пример профиля по имплантологии; услуги показаны в демо-режиме.','Sample implant dentistry profile; services are illustrative only.'),address:T('Andijon, Bobur tumani','Андижан, район Бобур','Bobur district, Andijan'),languages:['UZ','RU','EN'],years:10,score:'4.8',services:[T('Konsultatsiya','Консультация','Consultation'),T('Implant uchun baholash','Оценка возможности имплантации','Implant assessment')]},
 {id:'malika',name:'Dr. Malika Saidova',initials:'MS',cityId:'UZ-AN',countryCode:'UZ',clinic:'Andijan Smile Clinic',specialty:T('Ortodont','Ортодонт','Orthodontist'),bio:T('Ortodontik maslahat va rejalashni ko‘rsatuvchi namunaviy profil.','Пример профиля для ортодонтической консультации и планирования.','Sample profile for orthodontic consultation and planning.'),address:T('Andijon, universitet hududi','Андижан, университетский район','University district, Andijan'),languages:['UZ','EN'],years:8,score:'5.0',services:[T('Ortodontik maslahat','Ортодонтическая консультация','Orthodontic consultation'),T('Nazorat ko‘rigi','Контрольный осмотр','Follow-up visit')]},
 {id:'umid',name:'Dr. Umid Ismoilov',initials:'UI',cityId:'UZ-AN',countryCode:'UZ',clinic:'Andijan Family Dental',specialty:T('Oilaviy stomatolog','Семейный стоматолог','Family dentist'),bio:T('Oilaviy stomatologiya xizmatlarini tanishtiruvchi namunaviy profil.','Пример профиля семейного стоматолога.','Illustrative family dentistry profile.'),address:T('Andijon, Bog‘ishamol hududi','Андижан, район Богишамол','Bogishamol district, Andijan'),languages:['UZ','RU'],years:6,score:'4.8',services:[T('Ko‘rik','Осмотр','Examination'),T('Profilaktik maslahat','Профилактическая консультация','Preventive consultation')]},
 {id:'dilnoza',name:'Dr. Dilnoza Ergasheva',initials:'DE',cityId:'UZ-FA',countryCode:'UZ',clinic:'Fergana Dental Care',specialty:T('Bolalar stomatologi','Детский стоматолог','Pediatric dentist'),bio:T('Bolalar stomatologiyasi uchun namunaviy profil. Haqiqiy shifokor hisobi emas.','Пример профиля детского стоматолога. Не реальный врачебный аккаунт.','Sample pediatric dentistry profile, not a real clinician account.'),address:T('Farg‘ona, markaziy hudud','Фергана, центральный район','Central Fergana'),languages:['UZ','RU'],years:9,score:'4.9',services:[T('Bola ko‘rigi','Осмотр ребёнка','Child examination'),T('Profilaktika','Профилактика','Prevention')]},
 {id:'sardor',name:'Dr. Sardor Yusupov',initials:'SY',cityId:'UZ-FA',countryCode:'UZ',clinic:'Fergana Implant Center',specialty:T('Protezlash mutaxassisi','Специалист по протезированию','Prosthodontist'),bio:T('Protezlash bo‘yicha o‘quv va qidiruv oqimini ko‘rsatadigan demo profil.','Демо-профиль для поиска специалиста по протезированию.','Demo profile showing a prosthodontics specialist search flow.'),address:T('Farg‘ona, Yangi hayot hududi','Фергана, район Янги Хаёт','Yangi Hayot district, Fergana'),languages:['UZ','RU','EN'],years:14,score:'4.9',services:[T('Konsultatsiya','Консультация','Consultation'),T('Protez rejalash','Планирование протезирования','Prosthetic planning')]},
 {id:'nodira',name:'Dr. Nodira Alimova',initials:'NA',cityId:'UZ-FA',countryCode:'UZ',clinic:'Fergana Smile House',specialty:T('Terapevt stomatolog','Стоматолог-терапевт','General dentist'),bio:T('Umumiy stomatologiya bo‘yicha namunaviy tanishuv profili.','Пример ознакомительного профиля стоматолога-терапевта.','Illustrative general dentistry profile.'),address:T('Farg‘ona, Mustaqillik hududi','Фергана, район Мустакиллик','Mustaqillik district, Fergana'),languages:['UZ','RU'],years:7,score:'4.8',services:[T('Ko‘rik','Осмотр','Examination'),T('Professional tozalash','Профессиональная чистка','Professional cleaning')]},
 {id:'shavkat',name:'Dr. Shavkat Karimov',initials:'SK',cityId:'UZ-FA',countryCode:'UZ',clinic:'Fergana Pearl Dental',specialty:T('Endodont','Эндодонтист','Endodontist'),bio:T('Ildiz kanali muolajasi yo‘nalishini ko‘rsatuvchi namunaviy profil.','Пример профиля специалиста по эндодонтии (лечению корневых каналов).','Illustrative endodontic specialist profile.'),address:T('Farg‘ona, Sayilgoh hududi','Фергана, район Сайилгох','Sayilgoh district, Fergana'),languages:['UZ','RU'],years:8,score:'4.9',services:[T('Konsultatsiya','Консультация','Consultation'),T('Ildiz kanalini baholash','Оценка корневых каналов','Root canal assessment')]},
 {id:'emma',name:'Dr. Emma Wilson',initials:'EW',cityId:'AE-DU',countryCode:'AE',clinic:'Dubai Dental Gallery',specialty:T('Ortodont','Ортодонт','Orthodontist'),bio:T('Xalqaro qidiruv qanday ishlashini ko‘rsatadigan Dubaydagi namunaviy profil.','Пример профиля в Дубае для демонстрации международного поиска.','Sample Dubai profile demonstrating international discovery.'),address:T('Dubay, markaziy hudud','Дубай, центральный район','Central Dubai'),languages:['EN','AR'],years:11,score:'4.9',services:[T('Ortodontik maslahat','Ортодонтическая консультация','Orthodontic consultation'),T('Nazorat ko‘rigi','Контрольный осмотр','Follow-up visit')]}
];

const regionalProfile=(id:string,name:string,initials:string,cityId:CityId,countryCode:'UZ'|'AE',specialty:Translated):DemoDoctor=>({
 id,name,initials,cityId,countryCode,specialty,
 clinic:cityId==='UZ-TK'?'Tashkent Dental Studio':'Dubai Smile Studio',
 bio:T('Bu shifokor va xizmatlar faqat dizayn prototipi uchun yaratilgan namunadir.','Врач и услуги вымышлены: это пример для дизайн-прототипа.','This clinician and the services are fictional design-prototype examples.'),
 address:T(`${cityName(cityId,'uz')} · namuna manzil`,`${cityName(cityId,'ru')} · пример адреса`,`${cityName(cityId,'en')} · sample address`),
 languages:countryCode==='UZ'?['UZ','RU','EN']:['EN','AR'],years:8,score:'4.8',
 services:[T('Konsultatsiya','Консультация','Consultation'),T('Profilaktik ko‘rik','Профилактический осмотр','Preventive examination')]
});

demoDoctors.push(
 regionalProfile('tashkent-1','Dr. Lola Abdullayeva','LA','UZ-TK','UZ',T('Terapevt stomatolog','Стоматолог-терапевт','General dentist')),
 regionalProfile('tashkent-2','Dr. Bekzod Yunusov','BY','UZ-TK','UZ',T('Ortodont','Ортодонт','Orthodontist')),
 regionalProfile('tashkent-3','Dr. Madina Rasulova','MR','UZ-TK','UZ',T('Bolalar stomatologi','Детский стоматолог','Pediatric dentist')),
 regionalProfile('tashkent-4','Dr. Jasur Mirzayev','JM','UZ-TK','UZ',T('Implantolog','Имплантолог','Implant dentist')),
 regionalProfile('dubai-2','Dr. Samir Malik','SM','AE-DU','AE',T('Terapevt stomatolog','Стоматолог-терапевт','General dentist')),
 regionalProfile('dubai-3','Dr. Omar Hassan','OH','AE-DU','AE',T('Implantolog','Имплантолог','Implant dentist')),
 regionalProfile('dubai-4','Dr. Lina Farah','LF','AE-DU','AE',T('Bolalar stomatologi','Детский стоматолог','Pediatric dentist'))
);

