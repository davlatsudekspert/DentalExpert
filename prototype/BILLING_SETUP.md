# Billing setup: what is left to do by hand

The code is written against a small provider interface (`src/billing.ts`). The purchase plugin is **not** in `package.json` yet, so the iOS/Android projects and TestFlight builds are untouched. Until you finish the steps below the paywall works but shows "subscribe in the iOS/Android app" and never sells.

## 1. RevenueCat
1. Create a RevenueCat project, add an **iOS** app (bundle id of Dental Expert) and an **Android** app (package name).
2. Entitlement: one entitlement, e.g. `pro`. Products below attach to it. (The server decides access from our own table; RevenueCat is the receipt checker and event source.)
3. Offerings: a `default` offering with six packages (monthly and yearly of each plan). The app picks the two packages of the user's role by product id.
4. API keys: the public **iOS** SDK key and **Android** SDK key.
5. Integrations, Webhooks: URL `https://<your-domain>/api/billing/webhook`, Authorization header value = a long random secret you invent (also set as `REVENUECAT_WEBHOOK_AUTH` below). Send events for all products.

## 2. App Store Connect
1. Agreements, Tax, Banking: paid-apps agreement active.
2. One **subscription group** ("Dental Expert Pro") with six auto-renewable subscriptions, ids exactly:
   `de_student_monthly` 1.49, `de_student_yearly` 9.99, `de_teacher_monthly` 2.49, `de_teacher_yearly` 24.99, `de_specialist_monthly` 3.49, `de_specialist_yearly` 34.99 (USD; pick the nearest tier, Apple converts to local currencies).
3. **No introductory offer / free trial in the store** (the 30-day trial is server-side, no card). Do not configure one.
4. Localizations (uz/ru/en display name and description) and a review screenshot of the paywall for each subscription.
5. App Review notes: describe the roles and plans; give the reviewer account (`REVIEW_ACCOUNTS`) a note that Pro is active for it. The paywall already shows: price, period, auto-renew text, cancellation path, links to Terms of Use (Apple standard EULA) and Privacy Policy, and "Restore purchases". Add the Privacy Policy URL and the EULA link in the app metadata.
6. Sandbox testers for TestFlight.

## 3. Google Play Console
1. Merchant account and payments profile.
2. Subscriptions with the same six product ids; one base plan each (monthly or yearly auto-renewing), prices in USD with automatic local conversion. **No free-trial offer** (server-side trial).
3. Real-time developer notifications are handled by RevenueCat: link the Play service-account credentials in RevenueCat.
4. License testers for internal testing. The Android build is the Education edition; Pro works the same, prices are the store's local currency.

## 4. Environment variables
| Where | Name | Value |
|---|---|---|
| Cloudflare Pages (production + preview as needed) | `PRO_ENABLED` | `1` to switch the server on (leave unset until launch) |
| Cloudflare Pages | `REVENUECAT_WEBHOOK_AUTH` | the secret from RevenueCat step 5 (encrypted variable) |
| Cloudflare Pages | `TRIAL_PEPPER` | a long random string for hashing trial claims (encrypted; do not change later or old claims stop matching) |
| App build (`.env.production` or CI) | `VITE_PRO_ENABLED` | `1` |
| App build | `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY` | public SDK keys |

Apply migration `migrations/0016_pro.sql` to production D1 (`wrangler d1 migrations apply dental-expert --remote`) **before** deploying the code: it gives existing accounts their 30 days from that moment. It has only been run locally so far.

## 5. Install the purchase plugin (one commit, then test on a device)
1. `npm install @revenuecat/purchases-capacitor` then `npx cap sync` (this changes the iOS and Android projects: do it on its own branch and run a TestFlight and Play internal build).
2. iOS: enable the **In-App Purchase** capability in Xcode. Android: nothing extra (billing permission is added by the plugin).
3. `src/billing.ts` already looks the plugin up by name (`Purchases`) and configures it with the two keys; no code change should be needed. After sign-in the paywall calls `logIn(appUserID = our user id)` so webhooks carry our id.
4. Test with sandbox / license testers: buy, restore, cancel, expire. The server updates through the webhook; the app re-reads `/api/auth/me` after a purchase.

## 6. Store requirements already covered in the UI
Price and period on each plan card (store price when available), auto-renew and cancellation text, links to Terms and Privacy, Restore Purchases button, no purchase buttons on the web, nothing blocks sign-out, delete account or privacy, patients never see a paywall.

## 7. Privacy answers
- App Store "App Privacy" and Google Play "Data safety": add **Device ID** (random install id kept in the Keychain/Keystore) collected for **fraud prevention / abuse prevention** (one free trial per device), not linked to advertising or tracking. Purchases: handled by Apple/Google and RevenueCat (purchase history, user id).
- Privacy policy text to add: "To prevent repeated use of the free trial we store a one-way hash of your e-mail, a random device identifier and a coarse network address. These hashes cannot be turned back into the original values and are not used for advertising."
- RevenueCat processes purchase data: list it among processors.

## 8. Launch checklist
1. Products approved/active in both stores and added to the RevenueCat offering.
2. Migration applied; `REVENUECAT_WEBHOOK_AUTH`, `TRIAL_PEPPER` set; send a RevenueCat **TEST** event (answers `ignored: type`, 200).
3. Build a TestFlight/internal build with `VITE_PRO_ENABLED=1` and the plugin; verify purchase, renewal, cancel, restore, expiry.
4. Set `PRO_ENABLED=1` on the server, release the apps. To roll back, unset `PRO_ENABLED`: everything is free again at once.

## At launch (when PRO_ENABLED is switched on)
- Trial clocks start at sign-up even while Pro is off, so accounts created in the free-for-all period would already be past their 30 days. Right before switching Pro on, give every account a fresh 30 days once:
  `UPDATE users SET trial_ends_at=datetime('now','+30 days') WHERE guest=0;`
- Apple App Privacy / Google Data safety: the app sends a random install ID (Keychain/Keystore) used for abuse prevention (one free trial per device). Declare "Device ID" (not linked to tracking, purpose: app functionality / fraud prevention) before the first store submission that contains it. The privacy policy (public/privacy) already describes it.
