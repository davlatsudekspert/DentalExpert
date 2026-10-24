/// <reference types="vite/client" />

declare module '*.pptx' { const url: string; export default url }

interface ImportMetaEnv {
 readonly VITE_API_BASE?: string;
 readonly VITE_PRO_ENABLED?: string;
 readonly VITE_RC_IOS_KEY?: string;
 readonly VITE_RC_ANDROID_KEY?: string;
 readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
 readonly VITE_GOOGLE_IOS_CLIENT_ID?: string;
 readonly VITE_APPLE_CLIENT_ID?: string;
 readonly VITE_APPLE_REDIRECT_URI?: string;
}
