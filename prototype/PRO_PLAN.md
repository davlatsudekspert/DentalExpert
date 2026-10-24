# Dental Expert Pro: plan, limits and flows

Status: built on branch `feat/pro`, **OFF by default**. With the flag off the app behaves exactly as before (everything free, no paywall, no plan UI, no counters). Turn it on only after the store products exist (see `BILLING_SETUP.md`).

## Flag
- Server: env `PRO_ENABLED=1` (Pages variable). Client: build with `VITE_PRO_ENABLED=1`. Both must be on; either one off hides Pro (the server then also stops gating).
- `GET /api/auth/me` returns `proEnabled` always; `user.pro` only when the flag is on.

## Prices (USD, store tiers; the stores show local currencies)
| Plan (role) | Monthly | Yearly | Product ids |
|---|---|---|---|
| Student | 1.49 | 9.99 | `de_student_monthly`, `de_student_yearly` |
| Teacher | 2.49 | 24.99 | `de_teacher_monthly`, `de_teacher_yearly` |
| Specialist (dentist) | 3.49 | 34.99 | `de_specialist_monthly`, `de_specialist_yearly` |
| **Premium** (all roles) | 4.99 | 49.99 | `de_premium_monthly`, `de_premium_yearly` |

Premium is Pro for every role in one plan (student, teacher and specialist features). Patients: always free, no paywall, no plan row. All numbers, ids, the trial length and the Free limits live in **one module**, `src/proConfig.ts`, imported by the app and the server. The yearly saving shown on the paywall is computed from it.

## Trial
- Every account gets 30 days of everything, no card. Existing accounts: 30 days from the migration (`0016_pro.sql`). New accounts: 30 days from sign-up.
- **One trial per person** (`functions/_lib/trial.ts`, table `trial_claims`, salted SHA-256 only): a new account gets no trial (it still signs up, on the Free tier, and the app says "the trial was already used on this device or account") when its
  - normalized e-mail already claimed one (lower-case, `+tag` removed on Gmail/Outlook/iCloud/Proton/Fastmail-style providers, Gmail dots removed, googlemail = gmail; deleting an account keeps its claim), or
  - device id already claimed one (native apps send a random UUID kept in the Keychain/Keystore, `X-Device-Id`), or
  - web browser cookie (signed, `de_trial`) already claimed one, or
  - coarse network address (IPv4 /24, IPv6 /64) already claimed 5 trials in 30 days (a limit, not a ban, so a campus network still works).
- A role switch never restarts or extends the trial (it belongs to the person, not the role).
- Store reviewer accounts (`REVIEW_ACCOUNTS`) have a trial that does not end.
- Admin can reset a claim (Admin, Pro tab, "Sinov muddatini tiklash": e-mail and optionally the raw device id).

## Free tier (after the trial) vs Pro
Never paywalled, for anyone: sign-in, sign-out, delete account, privacy, profile, joining a class, taking any assigned or class test, results of your own, the first topics (below), basic atlas.

| Area | Free | Pro |
|---|---|---|
| Curriculum topics | first 3 topics of every subject (self-study tests) | all 8 per subject, with answers and explanations |
| Picture practice | 20 questions per day (counted on the server per account, across devices; signed-out visitors counted on the device) | unlimited |
| Exam mode, Review (spaced repetition) | locked (calm lock card + paywall) | open |
| 3D atlas | assembled tooth, enamel and dentin | exploded view and all layers |
| Teacher: groups | 1 group | up to 20 |
| Teacher: general tests (several topics) | locked | open |
| Teacher: presentation mode (TV, big screen) | locked | open |
| Specialist: public verified-dentist listing | hidden from search (profile and verification kept) | listed |

Students in a class are never affected by their teacher's tier. Existing groups of a lapsed teacher are kept (only creating more is gated).

### Where it is enforced
- **Server (source of truth)**: topic answer keys (`/api/curriculum/key`, 402 `pro_required` past the free topics), the daily practice counter (`/api/billing/practice`), group creation, general tests, the public dentist listing (`/api/doctors`).
- **Client only** (content ships inside the app bundle, so it cannot be hidden from a determined user): practice questions themselves, atlas layers, presentation mode, Review/Exam screens. The server gate still blocks the answers for topics past the free ones.
- Results export: the app has no export feature today, so none is gated (add it behind `mayUse` when built).

## Entitlement
`entitlement(user)` (`functions/_lib/entitlement.ts`) returns `{active, reason: trial|paid|admin-grant|free, trialEndsAt, expiresAt, plan, trialUsed, heldRole}`.
- Order: admin grant, paid plan of the account's **current role** or a **Premium** plan (any role), trial, free.
- **Plans are bound to the role.** A Student plan unlocks only student features; after a switch to teacher or dentist the account gets nothing from it (`heldRole='student'`, the paywall says "you hold the Student plan; the Teacher role needs the Teacher plan"). **Premium is the exception: it is not bound to a role.** While a Premium subscription is live, `active` is true for student, teacher and dentist alike, it unlocks every Pro feature of the current role (also after a role switch, no `heldRole`), and patients still never need it. A role-bound plan held next to a different role is offered the Premium upgrade on the paywall ("one plan for all your roles"). Admin grants work for any role. Role switches stay limited to 10 a day.
- The webhook refuses (ignores) a purchase whose product does not belong to the account's role; the two Premium products are exempt and accepted for any account role (same idempotency and ordering). A Premium dentist is listed in the public listing like a Specialist subscriber.
- Paywall: the role's own plan and a separate Premium group ("Everything unlocked: all roles") with the yearly saving computed from the config; one line under the Free vs Pro table says Premium = Pro for every role. Profil "Plan" row reads "Premium" when active. The web still sells nothing.

## Billing flow
1. App (native, with the purchase plugin, see `BILLING_SETUP.md`) shows the paywall for the user's role, buys through RevenueCat with `app_user_id = our user id`.
2. RevenueCat calls `POST /api/billing/webhook` (secret in `Authorization`, env `REVENUECAT_WEBHOOK_AUTH`): INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, PRODUCT_CHANGE activate; CANCELLATION keeps Pro until expiry; BILLING_ISSUE keeps the grace period; EXPIRATION ends it. Idempotent by event id, ordered by event time, rate limited, validated.
3. The app re-reads `/api/auth/me` and unlocks. "Restore purchases" is on the paywall (App Store requirement).
- Web never sells: it shows "subscribe in the iOS/Android app" (store rules), and Pro bought in the app works on the web with the same account.

## Admin
Admin panel, Pro tab: grant Pro to **any e-mail** for 1/3/6/12 months or until revoked; an address with no account yet is stored and applied at its sign-up; list of current grants (e-mail, until, who granted) with revoke; trial reset. Everything is audit-logged (`admin_audit`). The Users tab shows each account's state. Works while the flag is off (effect appears when it is on).

## Data and privacy notes
Trial claims store only salted hashes (e-mail, device id, cookie, coarse network). Mention "device identifier used to prevent abuse of the free trial" in the App Privacy / Data safety answers (see `BILLING_SETUP.md`).

## Tests
`tools/pro_test.py` (trial, gates, webhook, admin grants), `tools/pro_trial_test.py` (one trial per person, role-bound plans, admin reset), `tools/pro_off_test.py` (flag off), `tools/premium_test.py` (Premium webhook, role switch, expiry, idempotency, ordering), `tools/premium_e2e.py` / `premium_off_e2e.py` (Premium cards at 360x640 and 390x844 for the three roles; flag off: no paywall), `tools/pro_e2e.py` and `tools/pro_off_e2e.py` (paywall, 360x640 and 390x844, flag on/off). All run in `.github/workflows/checks.yml`.

## Attestation prep (Attestatsiya tayyorgarligi) and the Free limit
Free: 20 attestation questions per UTC day, counted **on the device** (`attestationLeft` / `takeAttestation` in `src/billing.ts`, limit `FREE.attestationPerDay` in `src/proConfig.ts`); a test is shortened to what is left. Pro (trial, paid, admin grant): unlimited. Flag off: unlimited. Why not the server counter `/api/billing/practice`: the question files ship with the app as static chunks, so a server count would not protect anything, and it would mix with the picture-practice allowance. Answer keys never travel through the API. When the allowance is used up the existing `practice` paywall opens. The section is hidden in English (uz and ru only).
