# iOS test build (TestFlight) without a Mac

Why not GitHub Actions: every Actions run in this repository, including the very first `preview.yml`, fails within 5 seconds before any step starts. That is an account/billing/limit issue, not a workflow bug. Fix it in GitHub (Settings → Billing and plans, or read the red message on a failed run) to use `.github/workflows/ios-testflight.yml`. Until then, use Codemagic.

## Codemagic (recommended)
1. Sign in at https://codemagic.io with GitHub and add the `DentalExpert` repository (configure with `codemagic.yaml` at the repo root).
2. App Store Connect → Users and Access → Integrations → App Store Connect API: create a key (role **App Manager** or Admin). Download the `.p8` once, note Key ID and Issuer ID.
3. Codemagic → Team settings → Integrations → App Store Connect → Connect, name it exactly `dental-expert-asc`, paste Issuer ID, Key ID and the `.p8`.
4. In App Store Connect create the app record: New App, iOS, bundle ID `uz.dentalexpert.app` (register the identifier under Certificates, Identifiers & Profiles if it is not listed).
5. Codemagic → the app → Start new build → workflow `ios-testflight`. Signing certificates and profiles are created automatically through the API key.
6. After the build is uploaded, wait for Apple processing (about 5–30 minutes), then App Store Connect → TestFlight → add internal testers (App Store Connect users). Internal testers need no Apple review.

## Known limits of this test build
- Sign-in inside the app is the labelled demo (cookie sessions do not work cross-site in the native WebView). Web sign-in at https://dental-expert.pages.dev works with email codes.
- The app reads data from the hosted API; it falls back to bundled demo data when offline.
- The build number comes from Codemagic's `BUILD_NUMBER`; the marketing version is 1.0.
- iPad is enabled by the Capacitor template. App Store review (not TestFlight) would need iPad screenshots, a privacy policy URL and account deletion (the API endpoint exists; in-app button is shown on the Settings screen when signed in).
