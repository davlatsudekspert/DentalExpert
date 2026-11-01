import {Capacitor} from '@capacitor/core';
import {useSyncExternalStore} from 'react';

/** Which build of the app is running (Android versionCode / iOS build number), so the server can switch old builds off.
 *  Web builds have no build number. `window.__DE_TEST_BUILD__` lets the browser tests stand in for a native build; it only
 *  works on the web, where the update screen is otherwise never shown. */
export type BuildInfo={platform:'android'|'ios';build:number};
declare global{interface Window{__DE_TEST_BUILD__?:BuildInfo}}
let info:BuildInfo|null=null,ready:Promise<void>|null=null,gate:{url:string|null}|null=null;
const subs=new Set<()=>void>();
export const appBuild=()=>info;
export const initAppVersion=():Promise<void>=>(ready??=(async()=>{
 if(!Capacitor.isNativePlatform()){const t=typeof window!=='undefined'?window.__DE_TEST_BUILD__:undefined;if(t)info=t;return}
 try{const {App}=await import('@capacitor/app');const i=await App.getInfo();const b=parseInt(i.build,10);if(Number.isFinite(b))info={platform:Capacitor.getPlatform()==='ios'?'ios':'android',build:b}}catch{/* unknown build: the server decides */}
})());
/** Sent with every API call from a native build (functions/_lib/appver.ts reads them). */
export const versionHeaders=():Record<string,string>=>info?{'x-app-build':String(info.build),'x-app-platform':info.platform}:{};
/** Shows the blocking "update the app" screen; a later call with a store link fills the link in. */
export const requireUpdate=(url:string|null)=>{if(gate&&(gate.url||!url))return;gate={url};subs.forEach(f=>f())};
export const useUpdateGate=()=>useSyncExternalStore(f=>{subs.add(f);return()=>{subs.delete(f)}},()=>gate);
