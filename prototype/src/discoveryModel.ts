import type {Translated} from './discoveryData';

export type CountryCode=string;
export type LicenseStatus='unverified'|'pending'|'verified'|'rejected';
export type ContactKind='phone'|'telegram'|'instagram'|'email'|'map'|'payment';

export type Clinician={id:string;fullName:string;specialty:Translated;languages:string[];photoUrl?:string;licenseStatus:LicenseStatus;isDemo:boolean};
export type Clinic={id:string;name:string;logoUrl?:string;cityId:string;address?:Translated};
export type ContactChannel={kind:ContactKind;value:string;verified:boolean};
export type ClinicianProfile={clinician:Clinician;clinics:Clinic[];contacts:ContactChannel[]};

export const activeContacts=(p:ClinicianProfile)=>p.clinician.isDemo?[]:p.contacts.filter(c=>c.verified);

/** Up to 4 visible sponsors from up to 5 active; the extra one rotates fairly by day seed. */
export const pickSponsors=<T,>(active:T[],daySeed:number,slots=4):T[]=>{
 if(active.length<=slots) return active;
 const start=((daySeed%active.length)+active.length)%active.length;
 return Array.from({length:slots},(_,i)=>active[(start+i)%active.length]);
};

export const nearbyMode=(permission:'granted'|'denied'|'prompt',manualCityId?:string)=>
 permission==='granted'?'gps':manualCityId?'manual':'ask-city';
