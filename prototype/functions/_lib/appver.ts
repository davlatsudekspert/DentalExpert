import type {Env} from './db';

/** Switching old app builds off. All env values are optional; with none set nothing is blocked.
 *  MIN_BUILD_ANDROID / MIN_BUILD_IOS: the lowest allowed build (Android versionCode, iOS build number).
 *  BLOCK_LEGACY_NATIVE=1: also block native builds that send no build number (those from before this feature).
 *  UPDATE_URL_ANDROID / UPDATE_URL_IOS: https store link shown on the update screen. */
const num=(v?:string)=>{const n=Number(v);return Number.isFinite(n)&&n>0?Math.floor(n):0};
const httpsUrl=(v?:string)=>v&&/^https:\/\/[^\s]+$/.test(v)?v:null;
export const appConfig=(env:Env)=>({
 minBuild:{android:num(env.MIN_BUILD_ANDROID),ios:num(env.MIN_BUILD_IOS)},
 updateUrl:{android:httpsUrl(env.UPDATE_URL_ANDROID),ios:httpsUrl(env.UPDATE_URL_IOS)},
 blockLegacy:env.BLOCK_LEGACY_NATIVE==='1'
});
/** True when a native request comes from a build the owner has switched off. Web requests are never blocked. */
export function tooOld(request:Request,env:Env):boolean{
 if(request.headers.get('x-client')!=='native')return false;
 const b=request.headers.get('x-app-build');
 if(b===null)return env.BLOCK_LEGACY_NATIVE==='1';
 const n=Number(b);if(!Number.isFinite(n))return false;
 const min=request.headers.get('x-app-platform')==='ios'?num(env.MIN_BUILD_IOS):num(env.MIN_BUILD_ANDROID);
 return n<min;
}
