import {useEffect, useRef, useState} from 'react';
import type {Lang} from './discoveryData';
import {oauthSignIn, type AuthUser, type OAuthProfile} from './api';
import {oauthPlatform, oauthProviders, type OAuthProvider} from './oauthConfig';
import {mountGoogleWebButton, OAuthCancelled, prepareAppleWeb, signInWithProvider, type ProviderToken} from './oauth';

const words:Record<Lang,{google:string;apple:string;or:string;errors:Record<string,string>}>={
 uz:{google:'Google bilan davom etish',apple:'Apple bilan davom etish',or:'yoki',errors:{
  bad_token:'Kirish tasdiqlanmadi. Qayta urinib ko‘ring.',
  email_not_verified:'Bu hisobdagi email tasdiqlanmagan. Email kod orqali kiring.',
  oauth_disabled:'Bu kirish usuli hozircha yoqilmagan. Email kod orqali kiring.',
  invalid_provider:'Bu kirish usuli qo‘llab-quvvatlanmaydi. Email kod orqali kiring.',
  too_many_requests:'Juda ko‘p so‘rov. Keyinroq urinib ko‘ring.',
  oauth_unavailable:'Google/Apple xizmati hozir javob bermayapti. Keyinroq urinib ko‘ring.',
  network:'Tarmoq xatosi. Qayta urinib ko‘ring.',
  unavailable:'Kirish oynasi ochilmadi. Keyinroq urinib ko‘ring yoki email koddan foydalaning.',
  other:'Kirish amalga oshmadi. Keyinroq urinib ko‘ring.'}},
 ru:{google:'Продолжить через Google',apple:'Продолжить через Apple',or:'или',errors:{
  bad_token:'Не удалось подтвердить вход. Попробуйте ещё раз.',
  email_not_verified:'Email этого аккаунта не подтверждён. Войдите по коду из письма.',
  oauth_disabled:'Этот способ входа пока не включён. Войдите по коду из письма.',
  invalid_provider:'Этот способ входа не поддерживается. Войдите по коду из письма.',
  too_many_requests:'Слишком много запросов. Попробуйте позже.',
  oauth_unavailable:'Сервис Google/Apple сейчас не отвечает. Попробуйте позже.',
  network:'Ошибка сети. Повторите попытку.',
  unavailable:'Не удалось открыть окно входа. Попробуйте позже или войдите по коду из письма.',
  other:'Не удалось войти. Попробуйте позже.'}},
 en:{google:'Continue with Google',apple:'Continue with Apple',or:'or',errors:{
  bad_token:'Sign-in could not be verified. Please try again.',
  email_not_verified:'This account’s email is not verified. Sign in with an email code instead.',
  oauth_disabled:'This sign-in option is not enabled yet. Use an email code instead.',
  invalid_provider:'This sign-in option is not supported. Use an email code instead.',
  too_many_requests:'Too many requests. Try again later.',
  oauth_unavailable:'Google/Apple is not responding right now. Try again later.',
  network:'Network error. Please try again.',
  unavailable:'The sign-in window could not open. Try again later or use an email code.',
  other:'Sign-in failed. Please try again later.'}}
};

/** Google “G” mark in its official four colours (Google brand guidelines). */
const GoogleG=()=><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">
 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>;
/** Apple logo, white on the black button (Apple Human Interface Guidelines). */
const AppleLogo=()=><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4.97 18.38 3.93 15.57 3.93 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.38 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"/></svg>;

/**
 * “Continue with Google / Apple” above the email form. Renders nothing when no provider is configured.
 * On success it hands the signed-in user to `onSignedIn`, exactly like the email-code verify path.
 */
export default function OAuthButtons({lang,profile,onSignedIn}:{lang:Lang;profile:()=>OAuthProfile;onSignedIn:(u:AuthUser)=>void}){
 const platform=oauthPlatform();
 const configured=oauthProviders(platform);
 // App Store reviewers look for Sign in with Apple first on iOS; elsewhere Google leads.
 const providers=platform==='ios'?[...configured].sort((a,b)=>(a==='apple'?0:1)-(b==='apple'?0:1)):configured;
 const t=words[lang];
 const [busy,setBusy]=useState<OAuthProvider|null>(null);
 const [error,setError]=useState('');
 const gisHost=useRef<HTMLDivElement>(null);
 const webGoogle=platform==='web'&&providers.includes('google');
 const webApple=platform==='web'&&providers.includes('apple');

 const finish=async(provider:OAuthProvider,tok:ProviderToken)=>{
  setBusy(provider);setError('');
  const p=profile();
  const r=await oauthSignIn(provider,tok.idToken,tok.nonce,{...p,name:p.name||tok.name});
  setBusy(null);
  if(r.ok&&r.data.user){onSignedIn(r.data.user);return}
  setError(t.errors[r.data.error||'']||t.errors.other);
 };
 // GIS calls back outside React; keep it pointed at the latest props.
 const finishRef=useRef(finish);finishRef.current=finish;

 useEffect(()=>{
  const host=gisHost.current;
  if(!webGoogle||!host)return;
  let dispose:(()=>void)|undefined;let live=true;
  mountGoogleWebButton(host,lang,tok=>{void finishRef.current('google',tok)}).then(d=>{if(live)dispose=d;else d()}).catch(()=>{/* GIS blocked: our own button stays and explains on tap */});
  return ()=>{live=false;dispose?.()};
 },[webGoogle,lang]);
 useEffect(()=>{if(webApple)prepareAppleWeb().catch(()=>{/* shown on tap */})},[webApple]);

 if(!providers.length)return null;
 const click=async(provider:OAuthProvider)=>{
  if(busy)return;
  setError('');setBusy(provider);
  try{await finish(provider,await signInWithProvider(provider))}
  catch(e){setBusy(null);if(!(e instanceof OAuthCancelled))setError(t.errors.unavailable)}
 };
 const button=(provider:OAuthProvider)=><button type="button" className={`oauth-button oauth-${provider}`} disabled={busy!==null} aria-busy={busy===provider} onClick={()=>void click(provider)}>
  {provider==='google'?<GoogleG/>:<AppleLogo/>}<span>{provider==='google'?t.google:t.apple}</span>
 </button>;
 return <div className="oauth-block" data-providers={providers.join(' ')}>
  {providers.map(provider=>provider==='google'&&webGoogle
   // Web: Google's own button (required by GIS for ID tokens) is drawn over ours once it loads, scaled to the same 48px.
   ?<div className="oauth-google-web" key={provider}>{button(provider)}<div className="oauth-gis-host" ref={gisHost}/></div>
   :<div key={provider}>{button(provider)}</div>)}
  {error&&<p className="oauth-error" role="alert">{error}</p>}
  <div className="oauth-divider" aria-hidden="true"><span>{t.or}</span></div>
 </div>;
}
