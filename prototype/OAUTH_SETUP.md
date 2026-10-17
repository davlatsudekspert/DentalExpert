# Google va Apple bilan kirish: sozlash (Google / Apple sign-in setup)

The app works without any of this (email codes). Each button appears only after its ids are set and the site/app is rebuilt.
Client ids are public identifiers, not passwords.

## 1. Google Cloud Console (console.cloud.google.com)
1. Create/select a project → **APIs & Services → OAuth consent screen**: type **External**, app name "Dental Expert", support email, scopes `email`, `profile`, `openid`. Publish it (or add test users while in Testing).
2. **Credentials → Create credentials → OAuth client ID**, three times:
   - **Web application**: Authorized JavaScript origins `https://dental-expert.pages.dev`. Copy its id → `VITE_GOOGLE_WEB_CLIENT_ID`.
   - **iOS**: Bundle ID `uz.dentalexpert.app`. Copy its id → `VITE_GOOGLE_IOS_CLIENT_ID`.
   - **Android**: package `uz.dentalexpert.app` + SHA-1. Make one Android client per signing key: the debug key (the Android workflow prints its SHA-1 in the run summary; it only stays the same if you set the `ANDROID_DEBUG_KEYSTORE_B64` secret, a base64 of a debug.keystore made once by a developer), your release key, and Google Play Console → App integrity → **App signing key** SHA-1. The Android id is not entered anywhere else.

## 2. Apple Developer portal (developer.apple.com → Certificates, IDs & Profiles)
1. **Identifiers → App IDs → uz.dentalexpert.app → tick "Sign In with Apple" → Save.** Do this before the next TestFlight run, otherwise export can fail with a profile/entitlement mismatch (the workflow uses `-allowProvisioningUpdates`, which regenerates the profile once the App ID has the capability).
2. Web only: **Identifiers → + → Services IDs**, e.g. `uz.dentalexpert.web`, enable Sign In with Apple → Configure: primary App ID `uz.dentalexpert.app`, domain `dental-expert.pages.dev`, return URL `https://dental-expert.pages.dev`. Its identifier → `VITE_APPLE_CLIENT_ID`; the return URL → `VITE_APPLE_REDIRECT_URI`.
3. No key (.p8) is needed: the server only checks Apple's public signing keys.

## 3. Where each value goes
| Where | Name | Value |
|---|---|---|
| Cloudflare Pages → dental-expert → Settings → Variables and Secrets (Production) | `GOOGLE_CLIENT_IDS` | web id,iOS id (comma-separated) |
| same | `APPLE_CLIENT_IDS` | `uz.dentalexpert.app,uz.dentalexpert.web` |
| same (used by `npm run build` on Pages) | `VITE_GOOGLE_WEB_CLIENT_ID`, `VITE_APPLE_CLIENT_ID`, `VITE_APPLE_REDIRECT_URI` | as above |
| GitHub → repo → Settings → Secrets and variables → Actions → **Variables** (secrets with the same names also work) | `VITE_GOOGLE_WEB_CLIENT_ID`, `VITE_GOOGLE_IOS_CLIENT_ID`, `VITE_APPLE_CLIENT_ID` | as above |

Then redeploy Pages (Deployments → Retry) and run the "Android test APK" / "iOS TestFlight" workflows.

## 4. Store rules
- **App Store 4.8**: when Google sign-in is offered on iOS, Sign in with Apple is shown too (automatic in this app).
- **App Store 5.1.1(v)**: account deletion exists in the app (Settings → delete account, `DELETE /api/auth/account`), also for Google/Apple accounts.
- Android shows Google only (Apple on Android would need an extra server redirect bridge).
