# Audit report (branch audit/full)

Scope: the web build of the app (React 19 / Vite 7), `functions/` (Pages Functions + D1) and the Android EDU edition rules.
Everything ran against a local `wrangler pages dev` with a local D1 (`/tmp/d1audit`); the live site and live D1 were not touched.
Viewports: 360x640, 390x844, 1000x461 (landscape) and 1920x1080. Languages: uz, ru, en. Themes: ivory (mono, default), colour, dark.
Roles: student, teacher, dentist, patient, the owner/admin account and a legacy guest session.

## What was checked

- Baseline of every suite in `.github/workflows/checks.yml` (API suites, browser walks, present mode, EDU edition, offline verify).
- Every bottom-tab screen and its chip tabs for the four roles in uz/ru/en: horizontal overflow, clipped text, tap targets, missing labels,
  console and page errors, failed requests, `undefined`/`NaN`/`[object` leaks, wrong-language text (the existing `i18n_scan.py`
  reports 0 findings over 720 screen states; my own crawl found nothing either).
- Text contrast sampled from real screenshots (WCAG AA) in all three themes.
- Error and empty states: classroom API answering 500 or aborted, per role.
- Sign-up / code / wrong code flow, role switch, profile photo upload, doctors list and booking screens, legacy guest session.
- `functions/`: authz on every handler, CORS (`_middleware.ts`), CSRF/Origin handling, rate limits, input validation, body sizes.
- Dead code (`tsc --noUnusedLocals`, unreferenced modules), bundle and image sizes, static headers.

## Fixed (each with a test that failed first, added to `checks.yml`)

| Commit area | Problem | Test |
|---|---|---|
| CI tests | `photo_test` looked for the owner in the first 50 users only; `admin_flag_e2e` expected one button wording although a listed dentist gets the "leave" confirmation. Both made CI red on a fresh run. | the tests themselves |
| Contrast | Next-topic card subject line was dark on dark teal (1.1:1) in the colour theme; chips, search labels, doctor lines, language marks, profile tiles, booking labels were 2.7-4.4:1. Dark theme (forced via the attribute) had two more. | `tools/contrast_e2e.py` (student, teacher, patient x mono, colour, dark) |
| Tap targets / wrap | Chips, hero buttons, text buttons, selects, search field, atlas pins, achievements toggle, profile edit/progress buttons, booking days were 27-42 px. "Kun ketma-ket" wrapped after the hyphen on 360 px. | `tools/layout_e2e.py` (4 roles x 3 languages x 2 phone sizes: target size, hyphen break, page scroll) |
| Error state | A 5xx or 429 from the classroom API left "Guruhlar" on endless `...` dots (only status 0/404 was treated as offline); the group page did the same. Now a message plus a Retry button in uz/ru/en. | `tools/states_e2e.py` |
| Native CORS | `/api/curriculum/key` was missing from the CORS allow-list, so in the iOS/Android apps (origin `capacitor://localhost` / `https://localhost`) the key fetch for self-study topic tests, class tests and exams was blocked. | `tools/security_test.py` |
| CSRF depth | Classroom DELETEs (leave group, delete assignment, remove member) did not check `Origin`. Now every non-GET classroom call does, via `needUser`. | `tools/security_test.py` |
| Body size | Unauthenticated JSON endpoints parsed bodies of any size. `guardPost` now refuses `Content-Length` over 600 KB with 413 (photo max is about 270 KB). | `tools/security_test.py` |
| Static headers | No `_headers`: added `nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, a camera-only `Permissions-Policy` and one-year immutable caching for hashed `/assets/*`. | `tools/security_test.py` |
| Photo | A transparent PNG turned black where the JPEG fallback is used (Safari). Now drawn on white. The photo UI had no browser test. | `tools/photo_ui_e2e.py` |
| Bundle | Admin and the patient guides (95 KB source) now load on demand: main chunk 254 KB to 222 KB gzip. | build |
| Dead code | Removed `src/Tooth3D.tsx` (unreferenced WebGL draft) and unused imports/variables outside `main.tsx`/`ProfilePanel.tsx`. | `tsc` |
| Offline build | `demo.html` cannot fetch lazy chunks (package.py inlines only the entry script), so the new on-demand chunks broke the offline verify. `OFFLINE=1` now folds dynamic imports into the entry (`inlineDynamicImports`). The existing lazy Atlas3D chunk would have failed offline the same way. | `tools/verify.py` (363 checks) |
| Date-dependent tests | `verify.py` clicked booking day 22, which is disabled once today is past the 22nd (today is the 24th); its 100 ms scroll wait for the nav was flaky; `profile_e2e` knows the non-breaking hyphen label. | the tests themselves |
| Page metadata | `index.html` title was "Dental Expert - Design prototype", no description. | - |

## Checked and fine

- Authz on all handlers (needUser / needAdmin / groupRole), guest-legacy limits, rate limits on codes, verify, join guesses, photo, reports; hashed IP buckets; timing-safe compares; photo served only when public or to owner/admin; account deletion cascades.
- Android EDU edition: `edu_edition_test.py` passes (177 checks); nothing I added touches patient/booking/dentist search gating. The new CSS only changes sizes and colours.
- Language and mixed-language text; Uzbek apostrophes (the scan checks them); first-run language order en, ru, uz is intentional (App Review).
- Landscape 1000x461 and 1920x1080: the web build shows the phone column centred; no overflow or clipping found.

## Remaining, and why

- **Dark theme is not reachable.** `data-theme="dark"` CSS (about 55 KB raw) exists but Settings only offers ivory and colour, and `?theme=` ignores it. Forced on, it reads well and now passes the contrast walk. Exposing it means editing `ProfilePanel`/`main.tsx` theme state, which the Pro branch touches; left as a decision.
- **Pinch zoom is disabled** by `maximum-scale=1` in `index.html`. It is an accessibility gap (WCAG 1.4.4) but removing it makes iOS Safari zoom into the 12 px inputs on focus; needs a decision together with raising input font size to 16 px.
- **No Content-Security-Policy.** Needs a pass over fonts, jsQR, three.js workers and the OAuth SDKs; risky to guess.
- `src/main.tsx` still has unused imports/variables (Bell, Star, Plus, Play, name/setName, notify...) and `ProfilePanel.tsx` an unused `Users`: left to avoid merge conflicts with `feat/pro`.
- Tap-target and contrast walks cover the tab screens and their chips. Deep screens (lesson slides, quiz run, classroom group tabs, admin, odontogram) were only smoke-tested, not measured.
- The global mail cap (1500 codes per day, `mail-global`) is shared by everyone: a botnet could exhaust it. Per-IP and per-email limits exist; a captcha or Cloudflare rule would be the real fix.
- Docs (`README.md`, `CLAUDE_START_HERE.md`) still mention the removed `Tooth3D.tsx`.
- Not testable here: real iOS/Android shells, WebKit (CI runs it), the live site.

## How to rerun

`DE_PORT=8801 D1_PERSIST=/tmp/d1audit bash tools/ci_local_server.sh security_test states_e2e layout_e2e contrast_e2e photo_ui_e2e`
(after `npm run build`; `contrast_e2e` needs `pillow`).
