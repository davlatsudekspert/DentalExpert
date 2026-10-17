import type {Env} from './db';
import type {Role} from './auth';
import {ROLES} from './auth';

/**
 * Store-review test accounts. REVIEW_ACCOUNTS is a secret like "reviewer-dentist@review.invalid:dentist,reviewer-student@review.invalid:student"
 * and REVIEW_CODE is the fixed sign-in code for exactly those addresses (so App Store / Google Play reviewers can sign in without an inbox).
 * Nothing is active unless both secrets are set. These accounts can never be admins (the admin check is by address).
 */
export function reviewRole(env:Env,email:string):Role|null{
 if(!env.REVIEW_ACCOUNTS||!env.REVIEW_CODE||!/^\d{6}$/.test(env.REVIEW_CODE))return null;
 for(const part of env.REVIEW_ACCOUNTS.split(',')){
  const [e,r]=part.trim().toLowerCase().split(':');
  if(e===email&&ROLES.includes(r as Role))return r as Role;
 }
 return null;
}
