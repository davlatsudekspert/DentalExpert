import {json,type Env} from '../../_lib/db';

// Kill switch for the attestation-prep feature (question texts ship inside the app bundle, so this is the server half of the
// switch: the app asks once and hides the feature when it says false). ON unless the server variable ATTESTATION_ENABLED is "0".
// The client also has a build switch (VITE_ATTESTATION_ENABLED=0 leaves the question files out of the bundle altogether).
export const onRequestGet:PagesFunction<Env>=async({env})=>json({enabled:env.ATTESTATION_ENABLED!=='0'},200,'public, max-age=300');
