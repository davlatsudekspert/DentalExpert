import {Capacitor} from '@capacitor/core';

/**
 * Sign in with Google / Apple client ids, baked in at build time (VITE_* env vars).
 * Client ids are public identifiers, not secrets. When an id is missing, its button is hidden
 * and the email-code sign-in keeps working on its own. See OAUTH_SETUP.md.
 */
const env=(v:unknown)=>typeof v==='string'&&v.trim()?v.trim():'';
export const oauthIds={
 googleWeb:env(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID),
 googleIos:env(import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID),
 appleClientId:env(import.meta.env.VITE_APPLE_CLIENT_ID),
 appleRedirectUri:env(import.meta.env.VITE_APPLE_REDIRECT_URI)
};

export type OAuthProvider='google'|'apple';
export type OAuthPlatform='ios'|'android'|'web';
export const oauthPlatform=():OAuthPlatform=>{const p=Capacitor.getPlatform();return p==='ios'||p==='android'?p:'web'};

/**
 * Which buttons to show on this platform.
 * - web: Google needs the web client id; Apple needs the Services ID and its return URL.
 * - android: Google needs the web client id (Credential Manager uses it as the token audience).
 *   Apple on Android needs a server-side redirect bridge that the backend does not provide, so it stays hidden.
 * - ios: Google needs the iOS client id. Sign in with Apple is native and needs no id, and App Store
 *   guideline 4.8 requires it whenever another third-party login is offered, so it is shown with Google
 *   (or on its own once VITE_APPLE_CLIENT_ID is set to show that Apple is configured on the backend).
 */
export function oauthProviders(platform:OAuthPlatform=oauthPlatform(),ids=oauthIds):OAuthProvider[]{
 if(platform==='ios'){const google=!!ids.googleIos;return [...(google?['google' as const]:[]),...(google||ids.appleClientId?['apple' as const]:[])]}
 if(platform==='android')return ids.googleWeb?['google']:[];
 return [...(ids.googleWeb?['google' as const]:[]),...(ids.appleClientId&&ids.appleRedirectUri?['apple' as const]:[])];
}
