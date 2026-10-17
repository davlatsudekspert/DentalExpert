// Verified against official sites on 2026-10-17 (see INSTITUTIONS_REGISTER.md). Machine-read, awaiting human confirmation.
// The app links to official schedules and never copies them.
export type Institution={id:string;name:string;cityId:string;website:string;scheduleUrl:string|null;scheduleLabel?:string;attributionRequired:boolean;checkedOn:string};

export const institutions:Institution[]=[
 {id:'tsdi',name:'Toshkent davlat stomatologiya instituti',cityId:'UZ-TK',website:'https://tsdi.uz',scheduleUrl:'http://ouf.tsdi.uz/jadval',scheduleLabel:'Bakalavriat',attributionRequired:true,checkedOn:'2026-10-17'},
 {id:'sammu',name:'Samarqand davlat tibbiyot universiteti',cityId:'UZ-SA',website:'https://www.sammu.uz',scheduleUrl:'https://www.sammu.uz/uz/pages/class_schedule',scheduleLabel:'Bakalavriat',attributionRequired:true,checkedOn:'2026-10-17'},
 {id:'adti',name:'Andijon davlat tibbiyot instituti',cityId:'UZ-AN',website:'https://adti.uz',scheduleUrl:null,attributionRequired:false,checkedOn:'2026-10-17'},
 {id:'alfraganus',name:'Alfraganus universiteti',cityId:'UZ-TK',website:'https://afu.uz',scheduleUrl:'https://storage.afu.uz/s/zte7Rwb94JecjjF',attributionRequired:false,checkedOn:'2026-10-17'}
];
