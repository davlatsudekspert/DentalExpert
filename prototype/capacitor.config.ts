import type {CapacitorConfig} from '@capacitor/cli';

// Bundled build: the app ships its own web assets and talks to the hosted API (see VITE_API_BASE).
const config:CapacitorConfig={
 appId:'uz.dentalexpert.app',
 appName:'Dental Expert',
 webDir:'dist',
 android:{allowMixedContent:false},
 ios:{contentInset:'automatic'}
};
export default config;
