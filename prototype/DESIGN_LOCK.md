# Dental Expert — UI implementation contract

The React prototype in this directory is the visual source for the first mobile implementation. It contains 30 navigable screens in Uzbek, Russian and English. It is a design prototype, not a live clinical, booking, education or payment system. Preserve its layout, premium tooth images, five-item navigation and local demo labels while wiring real services. Do not call the prototype a user-approved final design without a review.

## Visual system

| Element | Reference |
| --- | --- |
| Page | Ice-blue to white gradient, `#f0faff` / `#fafdff` / `#f2f9fd` |
| Headings | Deep navy `#10254e`, strongest `#09204a` |
| Primary action | Turquoise gradient `#17a6b7` → `#008fa8` |
| Status | Mint `#e8f5ee` with restrained teal text |
| Surfaces | White cards, light blue border, 17–24 px radii and soft shadow |
| Type | System sans, compact 9 px overline, 11–14 px body, 20–33 px display |
| Motion | Subtle scroll compacting and tap response; honor reduced-motion preference |

Use `src/style.css` and actual screenshots as the precise implementation reference. The supplied tooth renders in `assets/tooth3d/` are the approved-looking visual direction; preserve ivory enamel and lighter roots. The atlas exterior rotates through four photographic renders. It is **not** continuous clinical 3D. `reference-molar.glb` is an editable draft and must not silently replace the premium images.

## Screen inventory and routes

Every screen can be opened with `?screen=<id>&lang=uz|ru|en`. `screenshots/<id>.png` contains a real Chromium capture.

| Flow | Screen IDs | Important visible states |
| --- | --- | --- |
| Entry and account | `splash`, `onboard`, `roles`, `auth`, `login`, `signup`, `verifyEmail`, `forgot`, `changePassword` | Tooth-led welcome; role choice; centered tooth above sign-up; country/city; six-digit code design; recovery/mismatch messages |
| Patient discovery | `home`, `search`, `profile`, `clinics`, `booking` | Location choice; four local sample ads in 2×2; results/saved/empty; specialist card and six contact icons; date/time and demo confirmation |
| Dentist work | `dashboard`, `edit`, `record`, `chart` | Appointments, patient chart and FDI 32-tooth grid; photo preview; role-aware profile text |
| Anatomy | `anatomy` | Cutaway, exterior, top view, four-angle turntable, layer selection and zoom |
| Learning | `teacher`, `student`, `courses`, `lessonPage`, `caseStudy` | Weekly sample syllabus, illustrated lesson, explained quiz, PPTX, practice submission and revision |
| Growth | `plans`, `adManager` | Free/Pro comparison; four visible ad places, five active sponsor cap and 1/3/6/10-day selection |
| Account and community | `settings`, `privacy`, `forum`, `notifications` | Language, privacy, dental-only posting and reporting, demo notices |

Navigation is five items: role home, discovery, prominent center atlas, learning, profile/settings. On phone, it compacts on downward scroll and expands at the top. Do not add a sixth bottom item for advertising: the ad workspace belongs in the dentist/clinic account. Keep the patient home hero compact enough that four local sample ads fit in the first viewport above the bottom navigation at 360–430 px.

## Interaction contract for production code

1. Registration: choose role, enter name/email/password and country/city. Send and verify a time-limited email code server-side, with resend limits and failed-attempt handling. The current `verifyEmail` screen is visual only; its demo continue action bypasses validation and must be removed or relabelled when real auth is added. GPS is requested only after the user taps a nearby-search action; manual location remains available.
2. Public specialist profile: show clinician photo **or** uploaded clinic logo as distinct fields, services, workplaces, languages and consented contact channels. The six colored actions represent call, Telegram, Instagram, email, map and card/payment details. At present they only show a demo notice. Activate each only when its destination is verified, valid and provided by that profile owner. Never populate a fictional profile with a real person's number or account.
3. Sponsored discovery: filter campaigns by country and city, time window, approved professional profile and payment state. Show at most four clearly marked sponsored cards in the 2×2 patient home layout; allow at most five active sponsors per city and rotate the fifth fairly. Do not raise organic ratings or professional verification because of payment. Unsupported demo cities currently show no local ads.
4. Plans: patient essentials stay free. Free/Pro professional capabilities and the proposed three-month trial are visual proposals, with **no approved price**. Confirm the commercial terms before charging anyone. Keep essential student lessons and assessments available without a Pro paywall.
5. Education: make lessons, assignments, teacher feedback, revision and portfolio durable; retain source metadata (edition, chapter/page or stable URL, rights and review date). Never invent textbook page numbers, scientific citations or official certificates. Do not present the current sample lesson as validated clinical guidance.
6. Community: subject-specific moderation and reporting need a server queue, appeals and enforcement. Frontend keyword filtering is only a visual demonstration. Account deletion, privacy disclosures and data export must be implemented before store release.

## Acceptance for the code implementation

- Preserve 30 screen routes and UZ/RU/EN copy until a reviewed design change replaces them. Test 360, 390 and 430 px iPhones plus desktop; no horizontal overflow or controls hidden behind the bottom navigation.
- Replace in-memory demo state with typed models and API-backed flows one vertical slice at a time. Keep the frontend honest whenever a provider is unavailable.
- Run `npm ci`, `npm run build`, `PROTOTYPE_HTML=demo.html python tools/verify.py` after rebuilding the offline HTML with `python tools/package.py`. Browser tests are a prototype baseline; add service tests for live features.
- Preserve the supplied images and source register. Real profile photos need consent; real medical content needs qualified review. Apple App Store and Google Play requirements are documented in `STORE_RELEASE_REQUIREMENTS.md` and do not imply social sign-in buttons.

For Claude's next coding task, start with `CLAUDE_NEXT_STEP.md`, then `PRODUCT_VISION.md`, `MONETIZATION_PLAN.md`, `EDUCATION_PLAN.md`, `SOURCE_REGISTER.md` and `STORE_RELEASE_REQUIREMENTS.md`. The current screenshot captures and `validation.json` provide a concrete visual and behavioral comparison point.
