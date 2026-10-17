import {oauthIds,oauthPlatform,type OAuthProvider} from './oauthConfig';

/**
 * Provider sign-in flows. Every flow returns a provider ID token plus the RAW nonce for the backend.
 * The provider is always given SHA-256(raw nonce) as lowercase hex, so the token's `nonce` claim equals
 * sha256hex(raw) on every platform (Apple's recommended pattern, applied to Google too for one rule).
 * Tokens are never logged or stored here; they go straight to POST /api/auth/oauth.
 */
export type ProviderToken={idToken:string;nonce:string;name?:string};
export type NoncePair={raw:string;hashed:string};

/** Thrown when the person closes the sign-in sheet; callers stay silent. */
export class OAuthCancelled extends Error{constructor(){super('cancelled')}}
/** Thrown when a provider SDK cannot start (script blocked, plugin missing, misconfigured ids). */
export class OAuthUnavailable extends Error{constructor(){super('unavailable')}}

const hex=(bytes:ArrayBuffer|Uint8Array)=>Array.from(bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function newNonce():Promise<NoncePair>{
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
 const raw=hex(bytes);
 return {raw,hashed:hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))};
}
const randomState=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return hex(b)};

const isCancel=(e:unknown)=>{
 const err=e as {code?:string;error?:string;message?:string}|undefined;
 if(!err)return false;
 if(err.code==='USER_CANCELLED')return true;
 if(err.error==='popup_closed_by_user'||err.error==='user_cancelled_authorize'||err.error==='user_trigger_new_signin_flow')return true;
 return /cancel/i.test(err.message||'');
};

// ---------- script loader (web only) ----------
const scripts=new Map<string,Promise<void>>();
export function loadScript(src:string):Promise<void>{
 let p=scripts.get(src);
 if(!p){
  p=new Promise<void>((resolve,reject)=>{
   const s=document.createElement('script');s.src=src;s.async=true;s.defer=true;
   s.onload=()=>resolve();
   s.onerror=()=>{scripts.delete(src);s.remove();reject(new OAuthUnavailable())};
   document.head.appendChild(s);
  });
  scripts.set(src,p);
 }
 return p;
}
export const GIS_SRC='https://accounts.google.com/gsi/client';
export const APPLE_JS_SRC='https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

// ---------- native (Capacitor plugin @capgo/capacitor-social-login) ----------
type SocialLoginApi=typeof import('@capgo/capacitor-social-login').SocialLogin;
let nativeReady:Promise<SocialLoginApi>|null=null;
function nativePlugin():Promise<SocialLoginApi>{
 if(!nativeReady){
  nativeReady=(async()=>{
   // Loaded on demand so the web bundle and the offline demo never pull the plugin in.
   const {SocialLogin}=await import('@capgo/capacitor-social-login');
   const platform=oauthPlatform();
   const google=platform==='ios'
    ?(oauthIds.googleIos?{iOSClientId:oauthIds.googleIos,mode:'online' as const}:undefined)
    :(oauthIds.googleWeb?{webClientId:oauthIds.googleWeb,mode:'online' as const}:undefined);
   // iOS Sign in with Apple is native (AuthenticationServices); the client id is only a label there and redirectUrl '' keeps it on-device.
   const apple=platform==='ios'?{clientId:oauthIds.appleClientId||'uz.dentalexpert.app',redirectUrl:''}:undefined;
   await SocialLogin.initialize({...(google?{google}:{}),...(apple?{apple}:{})});
   return SocialLogin;
  })().catch(()=>{nativeReady=null;throw new OAuthUnavailable()});
 }
 return nativeReady;
}

async function nativeSignIn(provider:OAuthProvider):Promise<ProviderToken>{
 const plugin=await nativePlugin();
 const nonce=await newNonce();
 try{
  if(provider==='google'){
   // forcePrompt: a restored iOS session would return an older ID token without this nonce.
   const r=await plugin.login({provider:'google',options:{nonce:nonce.hashed,forcePrompt:true}});
   const res=r.result;
   if(res.responseType!=='online'||!res.idToken)throw new OAuthUnavailable();
   return {idToken:res.idToken,nonce:nonce.raw,name:res.profile.name||undefined};
  }
  const r=await plugin.login({provider:'apple',options:{nonce:nonce.hashed}});
  const res=r.result;
  if(!res.idToken)throw new OAuthUnavailable();
  // Apple shares the name only on the very first authorization.
  const name=[res.profile.givenName,res.profile.familyName].filter(Boolean).join(' ').trim();
  return {idToken:res.idToken,nonce:nonce.raw,name:name||undefined};
 }catch(e){
  if(e instanceof OAuthUnavailable)throw e;
  if(isCancel(e))throw new OAuthCancelled();
  throw new OAuthUnavailable();
 }
}

// ---------- web: Google Identity Services ----------
type GisCredential={credential?:string};
type GisApi={accounts:{id:{
 initialize:(o:Record<string,unknown>)=>void;
 renderButton:(el:HTMLElement,o:Record<string,unknown>)=>void;
 prompt:(cb?:(n:{isNotDisplayed?:()=>boolean;isSkippedMoment?:()=>boolean})=>void)=>void;
 cancel?:()=>void;
}}};
const gis=()=>(window as unknown as {google?:GisApi}).google;
/** Reads only the display name claim; the backend verifies the token itself. */
const decodeName=(jwt:string)=>{try{const bin=atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'));const p=JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))));return typeof p.name==='string'?p.name:undefined}catch{return undefined}};

/**
 * Renders Google's own button (GIS requires it for ID tokens) into `host` and calls back with each credential.
 * A fresh nonce is set before every attempt. Returns a disposer, or throws OAuthUnavailable if GIS cannot load.
 */
export async function mountGoogleWebButton(host:HTMLElement,lang:string,onToken:(t:ProviderToken)=>void):Promise<()=>void>{
 await loadScript(GIS_SRC);
 const g=gis();
 if(!g?.accounts?.id)throw new OAuthUnavailable();
 let disposed=false;
 const arm=async()=>{
  const nonce=await newNonce();
  if(disposed)return;
  g.accounts.id.initialize({
   client_id:oauthIds.googleWeb,nonce:nonce.hashed,ux_mode:'popup',auto_select:false,
   cancel_on_tap_outside:true,itp_support:true,use_fedcm_for_button:true,
   callback:(resp:GisCredential)=>{
    if(disposed||!resp.credential)return;
    onToken({idToken:resp.credential,nonce:nonce.raw,name:decodeName(resp.credential)});
    void arm();
   }
  });
  host.replaceChildren();
  g.accounts.id.renderButton(host,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',logo_alignment:'center',locale:lang,width:Math.max(200,Math.min(400,Math.floor(host.clientWidth||300)))});
 };
 await arm();
 return ()=>{disposed=true;g.accounts.id.cancel?.();host.replaceChildren()};
}

// ---------- web: Sign in with Apple JS ----------
type AppleJs={auth:{init:(o:Record<string,unknown>)=>void;signIn:()=>Promise<{authorization?:{id_token?:string;state?:string};user?:{name?:{firstName?:string;lastName?:string}}}>}};
const appleJs=()=>(window as unknown as {AppleID?:AppleJs}).AppleID;
let appleNonce:NoncePair|null=null;
/** Loads Apple JS and prepares a nonce ahead of the click, because the popup must open inside the tap. */
export async function prepareAppleWeb():Promise<void>{
 await loadScript(APPLE_JS_SRC);
 if(!appleJs()?.auth)throw new OAuthUnavailable();
 if(!appleNonce)appleNonce=await newNonce();
}
async function appleWebSignIn():Promise<ProviderToken>{
 const api=appleJs();
 const nonce=appleNonce;
 if(!api?.auth||!nonce){void prepareAppleWeb().catch(()=>{});throw new OAuthUnavailable()}
 appleNonce=null;
 const state=randomState();
 try{
  api.auth.init({clientId:oauthIds.appleClientId,scope:'name email',redirectURI:oauthIds.appleRedirectUri,state,nonce:nonce.hashed,usePopup:true});
  const res=await api.auth.signIn();
  const idToken=res.authorization?.id_token;
  if(!idToken||res.authorization?.state!==state)throw new OAuthUnavailable();
  const name=[res.user?.name?.firstName,res.user?.name?.lastName].filter(Boolean).join(' ').trim();
  return {idToken,nonce:nonce.raw,name:name||undefined};
 }catch(e){
  if(e instanceof OAuthUnavailable)throw e;
  if(isCancel(e))throw new OAuthCancelled();
  throw new OAuthUnavailable();
 }finally{void prepareAppleWeb().catch(()=>{})}
}

/** Click handler path for the buttons we draw ourselves: native Google/Apple and web Apple. */
export function signInWithProvider(provider:OAuthProvider):Promise<ProviderToken>{
 if(oauthPlatform()!=='web')return nativeSignIn(provider);
 if(provider==='apple')return appleWebSignIn();
 // Web Google normally goes through the GIS button; this fallback only runs if the GIS iframe is not ready yet.
 const g=gis();
 if(g?.accounts?.id)g.accounts.id.prompt();
 return Promise.reject(g?.accounts?.id?new OAuthCancelled():new OAuthUnavailable());
}
