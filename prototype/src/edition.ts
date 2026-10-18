import {Capacitor} from '@capacitor/core';

/** Education edition: the Android (Google Play) build is a medical reference and education app only.
 * It has no patient role, no dentist search, profiles, clinics or booking, and no patient records.
 * iOS and the website keep everything. On the web `?edition=edu` forces it for testing. */
const forced=(()=>{try{return new URLSearchParams(location.search).get('edition')==='edu'}catch{return false}})();
export const EDU=forced||Capacitor.getPlatform()==='android';
/** Screens that belong to healthcare services; in the education edition they are never shown. */
export const EDU_BLOCKED=['home','search','profile','clinics','booking','record','chart'];
if(EDU)document.documentElement.classList.add('edu');
