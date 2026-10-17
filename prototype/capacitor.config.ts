import type {CapacitorConfig} from '@capacitor/cli';

// Bundled build: the app ships its own web assets and talks to the hosted API (see VITE_API_BASE).
const config:CapacitorConfig={
 appId:'uz.dentalexpert.app',
 appName:'Dental Expert',
 webDir:'dist',
 android:{allowMixedContent:false},
 backgroundColor:'#f0faff',
 ios:{contentInset:'never',backgroundColor:'#f0faff'},
 plugins:{
  // @capgo/capacitor-social-login: only Google and Apple are bundled (no Facebook/Twitter SDKs).
  // Client ids are passed at runtime from VITE_* build variables (src/oauthConfig.ts), see OAUTH_SETUP.md.
  SocialLogin:{providers:{google:true,apple:true,facebook:false,twitter:false},logLevel:1}
 }
};
export default config;
