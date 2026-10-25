# QA journey report (branch qa/journey)

Final gate before the store release. Everything ran locally: `wrangler pages dev` + local D1 for the flag-off build (port 8820,
`/tmp/d1qa`) and for the Pro-on build (`VITE_PRO_ENABLED=1`, `PRO_ENABLED=1`, port 8821, `/tmp/d1qa2`). The live site and live
data were not touched. The app was driven as a real user in Chromium (390x844 and 360x640 at 2x, plus 844x390, 1024x768,
1280x720) and in WebKit 27 (360x640). To see what a user of the live site sees (no design-study frame, which only localhost
shows) the browser opened the app as `http://de.test` through a small host-rewriting proxy; `tools/journey_e2e.py` does the
same inside Playwright. Screenshots were reviewed as contact sheets; API checks were used where the existing suites already
cover the screens.

## Journeys covered

| # | Journey | uz | ru | en | Notes |
|---|---|---|---|---|---|
| 1 | Language pick, role, e-mail sign-up, wrong code, early resend (cooldown), sign-in again, sign-out, delete account, re-register with the same e-mail | pass | pass | pass | D5, D7, D10 fixed. OAuth buttons absent without ids; with ids `tools/oauth_ui.py` (was red, D9 fixed). Brute-force lock after 5 wrong codes, expired code, input validation, suspended account checked by API. Legacy guest session shows "save account". |
| 2 | Student: home, curriculum (16 subjects, topics, slides, topic self-test, key fetch), picture practice, review, exam, daily, 3D atlas, profile, role switch, join by code and `/j/` link, complaint form | pass | pass | pass | D1 fixed (system back). Assigned tests, variants, deadline, grace: existing classroom_v2/general/quick walks (green). |
| 3 | Teacher: groups, assignments, topic and general tests, students list and removal, big screen, presentation mode, Free 1-group limit | pass | pass | pass | D3, D7 fixed. |
| 4 | Dentist: workspace, profile, publish request, admin verification, listing, patient records and odontogram, role switch asks first | pass | – | pass | Covered by profile_e2e / profile_public_test (green) plus a walk; public_profile_e2e (not in CI) green. Patient records stay per account on a shared device. |
| 5 | Patient (web/iOS): city, doctor search, doctor card, booking calendar (sample), saved doctors; Android EDU edition | pass | pass | pass | edu_edition_test 177/177; EDU + Pro: no listing row, no patient role. |
| 6 | Admin: stats, complaints, users, verify, suspend, role change, Pro tab (grant 1/3/6/12 months and unlimited, pending grant, revoke, trial reset), no admin entry for others | pass (panel is Uzbek-only by design) | | | D4 fixed. IDOR / admin endpoint probes: all refused for non-admins. |
| 7 | Free / Pro / Premium on the Pro-on build (student, teacher, dentist, patient) | pass | pass | pass | Trial 30 days and days-left row; trial expired = Free limits as in PRO_PLAN.md (3 topics/subject with Pro tags, 20 practice q/day enforced on the server, 20 assessment q/day on the device, 1 group, Exam/Review/general tests/presentation/3D layers locked, listing paused); paywall per role with config prices, Premium group, Free-vs-Pro table, held-plan note, no buy button on web, Terms/Privacy; Student plan webhook, switch to teacher = held plan, nothing unlocked; Premium webhook unlocks the teacher; trial already used in the same browser; patients never see a paywall. D2, D3, D6 fixed. |
| 8 | Bilim va malakani baholash / Проверка знаний и компетенций | pass | pass | absent (correct) | 12 specialties, withheld ones greyed, 20/50 tests, results, report link, Russian questions, Free daily limit (50 shortened to 20, then paywall). Texts untouched. |
| 9 | Cross-cutting | | | | Offline / 5xx (D5), back navigation (D1), deep links (`/j/`, `?screen=`), double taps (D7), landscape and tablet width (D8), console errors and failed requests (none outside the deliberate cases), CORS preflight + GET for `capacitor://localhost` and `https://localhost` on all 33 API routes (all pass), accessibility basics (no unnamed buttons, unlabelled inputs or images without alt on the tab screens), IDOR (classroom and admin), rate limits, language scan (D12). |

## Defects found and fixed (each has a test that failed first)

| ID | Steps | Root cause | Fix | Test |
|---|---|---|---|---|
| D1 | Learn → subject → topic → slides, then the Android back button / browser back | `popstate` popped the whole screen; only the in-app arrow and the edge swipe closed the open viewer / sub-view first | shared `subBack()` in `main.tsx` also used on `popstate` (the popped entry is put back) | `journey_e2e.py` (uz/ru/en) |
| D2 | Pro on, trial over: 3D atlas → "Ajratish"/Pulpa; or teacher → slides → "present on a screen" | paywall `z-index:90` sat under the atlas (120) and slide player (95): nothing seemed to happen; the Pro layers had no lock mark | `.quiz-run.pw{z-index:150}`; lock icon on the exploded view and the Pro layers | `journey_pro_e2e.py` |
| D3 | Free teacher → group → "Give a general test" | builder opened unlocked; refused (402) only after the whole test was built | button shows the lock and opens the paywall at once | `journey_pro_e2e.py` |
| D4 | Admin → Pro → grant 3 months to an e-mail without an account | pending row read "Cheksiz (… · 3 oy)" | show the pending length only | `journey_pro_e2e.py` |
| D5 | Open the app while offline (or the API answers 5xx) | `/auth/me` failure was treated as "signed out, no backend": a signed-in user saw the welcome screen and "Sign up" offered the local DEMO form with a password field | `fetchAuth` reports `unreachable`; the sign-in screens show "cannot reach the server" + Retry (also on the `online` event); the single-file demo (`file:`) keeps its demo flow | `journey_e2e.py`; `i18n_scan.py` adjusted to answer `/auth/me` with "no backend" |
| D6 | Free student opens the paywall | the Free-plan line listed "1 group" (a teacher limit) | named only for teacher/dentist | `journey_pro_e2e.py` |
| D7 | Double tap on "Create" (group), "Create" (assignment), "Send code" | no in-flight guard: two identical groups / assignments; "please wait" toast over the code screen | ref guard on create group, join, create assignment, send code | `journey_e2e.py` |
| D8 | Phone in landscape, iPad, desktop browser (wider than 440 px) | tab bar is `position:sticky` inside `main.phone` with `overflow:hidden` (a scroll container), so the bar sat at the end of every page | `.studio.web-app .phone{overflow:clip}` (older engines keep `hidden`) | `journey_e2e.py` (844x390, 1024x768, 1280x720) |
| D9 | Ivory (default) look, sign-up with Google/Apple enabled | theme override made the Apple button #252422 in the app font and the Google button ivory; Apple / Google branding rules ask for black/system font and white with the #747775 outline (`oauth_ui.py` was red) | removed the two overrides | `journey_e2e.py` (stylesheet check) and `oauth_ui.py` (green) |
| D10 | Code screen: suspended account, or verify rate-limited | message said "the code is wrong or has expired" | own messages for `suspended` and `too_many_requests` | `journey_e2e.py` |
| D12 | Language scan | uz caption "15–40 o‘lchamlar" (singular after a number); ru privacy names Keychain/Keystore flagged | caption fixed; Keychain/Keystore allow-listed as technical names | `photo_credits_check.py` (plural after a number) |

Test-only fixes: `attestation_e2e.py` waited for the tabs before /auth/me answered (flaky "ru: Attestation tab present"); the
journey walks give each browser context its own client address so the 20-codes-per-hour limit does not stop them.
New CI entries: `journey_e2e` (flag-off browser walks), `journey_pro_e2e` (Pro step).

## Not fixed, and why

- **Session ended on the server while the app is open** (suspended account, expired session): screens that already loaded keep
  showing; the next API call gets 401 and the screen shows empty/sign-in states, the next start shows the sign-in screen. Low
  impact; a global "session lost" handler was tried but not kept because no single user action reliably reproduces it in a test.
- **OAuth error for a suspended account** shows the generic "sign-in failed" (true, but not specific).
- **`?screen=` deep links** open any role's screens (e.g. a student can open the dentist workspace demo). They are the
  design/screenshot links; data stays protected by the server. Left as is.
- **Switching role while holding a paid role plan** warns only after the switch (held-plan note), not in the confirm sheet.
- **Placeholder clipping**: "Личная метка (видна только…)" in the student list input is cut at 390 px (placeholder only).
- From the audit, still open: dark theme not selectable, pinch zoom disabled, no CSP, global mail cap.
- `admin_e2e.py` and `audit_fixes_e2e.py` (not in CI) are stale (old labels / removed odontogram button); their intent was
  re-checked by hand and passes.
- `tools/oauth_ui.py` and `tools/i18n_scan.py` are not in CI (they rebuild / take ~15 min); both were run here.

## Not testable here

Real iOS / Android shells (Keychain device id, hardware back button through Capacitor, deep links from the camera), store
billing (RevenueCat purchase, restore, sandbox renewals; the webhook was driven directly as in `premium_test.py`), real e-mail
delivery, Google/Apple sign-in against the real providers, store-review accounts (`review_account_test.py` needs special
bindings), push/TV casting on real hardware.

## How to rerun

```
DE_PORT=8820 D1_PERSIST=/tmp/d1qa bash tools/ci_local_server.sh journey_e2e
VITE_PRO_ENABLED=1 npx vite build --outDir dist-pro --emptyOutDir
PRO_ENABLED=1 DIST=dist-pro DE_PORT=8821 D1_PERSIST=/tmp/d1qa2 bash tools/ci_local_server.sh journey_pro_e2e
```
