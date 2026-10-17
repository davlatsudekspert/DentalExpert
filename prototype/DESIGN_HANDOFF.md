# Dental Expert — design handoff for Claude Code

## Scope

Use this standalone **mobile UI design prototype** as the visual contract for coding the application. The user requests cost-conscious work and no app publication yet. Implement live features in reviewable, tested slices; preserve the prototype as a visual baseline. Use the existing checkout; do not create a worktree unless requested.

## Current state

React 19, TypeScript 5.9, Vite 7, plain CSS, lucide-react and Three.js WebGL. Reproducible dependency versions are in package-lock.json. Node 24 verified. `npm ci`, `npm run build`, `npm run dev` are the development workflow. Root workspace is `/workspace/DentalExpert`; app working directory is its `prototype/` subdirectory.

The two chat reference images establish ice-blue/ivory surfaces, navy headings, cyan-to-teal CTAs, mint statuses, softly rounded cards, white dentistry visual, compact clinical information and mobile dashboards. References remain in the conversation, not bundled as production assets. The user-provided archive images, cleaned to transparent WebP, are used as static visual previews.

## Design system

- Primary text: `#10254e`; stronger navy: `#09204a`.
- Primary gradient: `#17a6b7` → `#008fa8`.
- Surface: white, ice-blue `#f0faff`, `#f2f9fd`.
- Mint positive status: `#e8f5ee` / `#579587`.
- System sans fonts, 9px letterspaced eyebrows, 12–14px body/card text, 20–33px display text.
- Cards 17–24px radii, CTAs 16px radius, very light blue borders and shadows.
- Base mobile width 390px; fluid at 360–430px; desktop adds an interactive screen index and phone frame.
- `prefers-reduced-motion` supported. Semantic buttons, labeled form fields and focus indicators included.

## Navigation and local interactions

30 screen IDs are in `screens` inside `src/main.tsx`. `?screen=...&lang=uz|ru|en` permits deterministic screenshots. `go` maintains a small in-memory history; top back returns to the preceding screen. Bottom navigation selects role home, search, anatomy, learning or settings. Mobile screen selector exposes every screen for review. `src/AccountCommunity.tsx` adds local-only password recovery/change, privacy, forum and notification screens. `src/DesignCompletion.tsx` adds email-code, Free/Pro and city ad-management designs. `src/ContactPreview.tsx` shows six contact channels on a sample profile without inventing live destinations. Auth and moderation still require server providers.

The user's Apple/Google request concerns **App Store and Google Play release/privacy requirements**, not social sign-in buttons. `STORE_RELEASE_REQUIREMENTS.md` is the release specification: data mapping, privacy disclosures, account deletion, permission timing, user-generated content moderation and medical claims. The in-app privacy screen is explicitly a demo and does not replace a published legal policy or store declarations.

Roles: patient → home; dentist → dashboard; teacher → teacher; student → student. Login/signup are demo entry forms. Signup includes country/city choice and opens an email-code visual flow; no code is sent or verified. No credentials are saved or transmitted. All state resets on reload. In-memory editing of Dr. Kamila's name is reflected in profile and cards. Booking selects day/time and displays a clearly marked demo confirmation. Search filters the sixteen fictional sample clinicians by selected city and name; a local Saved subset and rating filter work. Andijon, Fargona, Tashkent and Dubai each have four city-specific sample sponsored cards; unsupported cities are not filled with invented local ads. The 32-tooth FDI grid retains selected tooth when moving into anatomy.

## Translation

`copy.uz`, `copy.ru`, `copy.en` hold main UI strings; `Key` ensures consistency. Screen labels, main navigation, role labels, booking and anatomy controls are translated. Editorial desktop framing/brand labels and fictional names are intentionally language-independent. For a production implementation split dictionaries into modules and obtain native-speaker copy review.

## Anatomy asset seam and limitations

`assets/tooth3d/premium-reference-hero-ivory.webp` is displayed in onboarding and home. The anatomy stage defaults to `premium-reference-cutaway-ivory.webp`. The `turntable-front.webp`, `turntable-right.webp`, and `turntable-back.webp` assets provide four premium exterior views: front, right, back, and a mirrored right view for left. `src/PremiumTurntable.tsx` selects these frames by angle and supports pointer drag and arrow keys. This is an image-based 360° **visual prototype with four discrete views**, not one 3D mesh or a clinically consistent reconstruction. The exterior has three roots and the cutaway has two. The old `Tooth3D.tsx` WebGL draft and `reference-molar.glb` remain in the repository for future modeling work but are no longer shown in user-facing screens because their geometry did not meet the visual target. None of the assets are validated medical anatomy, disease detection or diagnostic tools.

The six JPGs from the user's `Tish Rasm.rar` are preserved under `assets/tooth3d/user-views/`. The exterior views depict three roots while the cutaway views depict two. `tools/build_reference_molar.py` uses the exterior proportions to generate `reference-molar.glb`, an editable `reference-molar.blend`, and a render. The GLB remains available as an editable draft; the anatomy poster now opens the four-view premium turntable, while tissue selection shows the premium cutaway image. This GLB is an approximate original mesh, **not** a photogrammetric reconstruction or premium match to the reference JPGs. `screenshots/anatomy-3d.png` captures the actual loaded frontend mesh so it can be reviewed honestly.

No third-party GLB/GLTF was bundled. Do not copy an unlicensed model into this repository; use a model with explicit compatible terms if replacing the procedural mesh. The current visuals should receive dental review before any claim of clinical accuracy. `public/clinicians.png` is the original AI-generated three-portrait sheet; `assets/clinician-contact-sheet.png` and `assets/headscarf-clinicians.png` supply photographic-looking synthetic portraits for the remaining sample profiles. Each of the four demo cities presents two male and two female sample clinicians, one of the women wearing a headscarf. `Portrait.tsx` retains vector fallbacks. The map is a CSS illustration. The portraits must not be represented as actual clinicians. All assets are locally available offline.

The user suggested `NateSaindon/3Dentes` and `Igor-Vuk/dentist-dream` as examples. 3Dentes code is MIT, but its scan-derived geometry is explicitly CC BY-NC 4.0 and is from a named person's imaging. Dentist Dream demonstrates glTF loading, separate layer meshes and orbit controls, but the repository has no declared license for its code or `tooth-final.glb`. No meshes or code from either were copied. Their interaction concepts informed this prototype's direction; verify permissions before using either project in a commercial product.

The learning section now has a visual tooth-layers lesson, three visual questions, an Uzbek PPTX, and a local practice case with sample feedback. Textbook citations and clinical review are pending; see `SOURCE_REGISTER.md`.

## Design completion contract

`DESIGN_LOCK.md` is the screen and state inventory for Claude. It records the visual tokens, routing, interaction outcomes, responsive targets and production code seams. The first implementation should use these existing screens and assets as its UI source of truth. It must not present demo-only buttons as live services.

## Recommended next implementation work

1. Turn one complete flow into a real service-backed feature, beginning with account creation and verified email; preserve all visual states.
2. Split `main.tsx` into role screens and i18n modules when it helps service integration. Preserve visual behavior and avoid an unsolicited rewrite.
3. Replace fictional demo portraits with consented staff photography or clinic logos as real profiles are created.
4. Build a properly modeled and licensed continuous 3D viewer only if that is a distinct required feature; keep the premium image atlas until a visual and clinical review accepts a replacement.
5. Keep demo/test placeholders explicit until their backends and verification are truly working.

## Verification and artifacts

`npm run build` performs TS checking and production compilation. `python tools/verify.py` checks all screens in three languages, role entry, language switching, doctor search/profile, booking, tooth/layer selection, rotate/zoom, profile edits, password demo, forum warnings/reports, email-code design, tariffs, ad duration and responsive overflow. It writes 30 actual rendered PNGs and `validation.json`; the validation JSON records the exact passing checks and browser exceptions. Chromium and Python Playwright are tooling, not shipped runtime dependencies.

`python tools/package.py` embeds the built CSS/JS into `demo.html` (offline desktop viewing), composes the eight-screen board from real screenshots and generates `dental-expert-prototype.zip` without node_modules. It does not fabricate UI screenshots. The source was pushed to the existing repository with user authorization; the app itself was not deployed. ZIP includes code, lockfile, docs, screenshots, build, offline HTML and validation tools.

## Remaining review

This is an initial reference-led design implementation, not user-approved final visual parity. Production browser/device accessibility audits, actual medical content, scientific validation and real-device GPU coverage are outside the completed checks. The four-view image turntable was visually inspected in Chromium; it is not a continuous 3D reconstruction. Avoid presenting these as verified. Do not include private patient information in future demo fixtures.
