import {useEffect} from 'react';
import type {Lang} from './discoveryData';
import {callApi} from './api';
import {appBuild,initAppVersion,requireUpdate,useUpdateGate} from './appVersion';

const words={
 uz:{title:'Yangilash kerak',body:'Ilovaning bu versiyasi endi qo‘llab-quvvatlanmaydi. Davom etish uchun yangi versiyani o‘rnating.',button:'Yangilash'},
 ru:{title:'Требуется обновление',body:'Эта версия приложения больше не поддерживается. Установите новую версию, чтобы продолжить.',button:'Обновить'},
 en:{title:'Update required',body:'This version of the app is no longer supported. Install the new version to continue.',button:'Update'}
};
type Config={minBuild?:Record<string,number>;updateUrl?:Record<string,string|null>};

/** Asks the server which builds are still allowed (once at start-up) and blocks the app when this one is too old.
 *  Any failure (offline, server error) lets the app carry on. */
export default function UpdateGate({lang}:{lang:Lang}){
 const g=useUpdateGate();const t=words[lang];
 useEffect(()=>{
  let off=false;
  (async()=>{
   await initAppVersion();const b=appBuild();if(!b)return;
   const r=await callApi<Config>('/app/config');if(off||!r.ok)return;
   if(b.build<(r.data.minBuild?.[b.platform]||0))requireUpdate(r.data.updateUrl?.[b.platform]||null);
  })();
  return()=>{off=true};
 },[]);
 if(!g)return null;
 return <div className="update-gate" role="alertdialog" aria-modal="true" aria-labelledby="ug-t" aria-describedby="ug-b">
  <div><h2 id="ug-t">{t.title}</h2><p id="ug-b">{t.body}</p>{g.url&&<a className="button" href={g.url} target="_blank" rel="noopener noreferrer">{t.button}</a>}</div>
 </div>;
}
