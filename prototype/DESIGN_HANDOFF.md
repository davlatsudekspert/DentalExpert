# Dental Expert — design handoff for Claude Code

## Scope

Continue a standalone **mobile UI design prototype**, not a production application. The user requests cost-conscious work and no publication. Do not introduce backend, database, real authentication, payments, paid maps, app-store workflows or Flutter. Keep work in `prototype/` until explicitly authorized otherwise. Use the existing isolated checkout; do not create a worktree unless requested.

## Current state

React 19, TypeScript 5.9, Vite 7, plain CSS, lucide-react and Three.js WebGL. Reproducible dependency versions are in package-lock.json. Node 24 verified. `npm ci`, `npm run build`, `npm run dev` are the development workflow. Root workspace is `/workspace/DentalExpert`; app working directory is its `prototype/` subdirectory.

The two chat reference images establish ice-blue/ivory surfaces, navy headings, cyan-to-teal CTAs, mint statuses, softly rounded cards, white dentistry visual, compact clinical information and mobile dashboards. References remain in the conversation, not bundled as licensed production assets. No generated AI images were substituted.

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

19 screen IDs are in `screens` inside `src/main.tsx`. `?screen=...&lang=uz|ru|en` permits deterministic screenshots. `go` maintains a small in-memory history; top back returns to the preceding screen. Bottom navigation selects role home, search, anatomy or settings. Mobile screen selector exposes every screen for review.

Roles: patient → home; dentist → dashboard; teacher → teacher; student → student. Login/signup are demo entry forms. No credentials are saved or transmitted. All state resets on reload. In-memory editing of Dr. Kamila's name is reflected in profile and cards. Booking selects day/time and displays a clearly marked demo confirmation. Search filters by doctor name; rating and service chips are demo subsets. The 32-tooth FDI grid retains selected tooth when moving into anatomy.

## Translation

`copy.uz`, `copy.ru`, `copy.en` hold main UI strings; `Key` ensures consistency. Screen labels, main navigation, role labels, booking and anatomy controls are translated. Editorial desktop framing/brand labels and fictional names are intentionally language-independent. For a production implementation split dictionaries into modules and obtain native-speaker copy review.

## Anatomy asset seam and limitations

`assets/tooth3d/DentalExpert_Tooth.blend` is an original Blender 3D tooth scene. `tools/create_tooth_asset.py` constructs the four-cusp crown, roots, physically cut sagittal view, tissue sections, root canals, blue/red vessels, lights and orbital glass. The Blender renders appear in onboarding, home and the initial anatomy view. The anatomy image is a preview: tap «Rotate · 3D» or any atlas control to reveal the live WebGL viewer. `Tooth3D({cut,angle,zoom,layer,variant})` in `src/Tooth3D.tsx` builds its own interactive mesh at runtime using Three.js. Pointer drag and Rotate change its 3D Y rotation, Zoom moves the camera, and layer selection changes emissive emphasis. Both assets are original 3D models, but the geometry is educational and simplified; it is **not** validated medical anatomy, disease detection or a diagnostic tool.

No GLB/GLTF was downloaded. The source Blender scene and procedural WebGL code are bundled, so the tooth needs no external asset license. It should receive dental review before any claim of clinical accuracy. `public/clinicians.png` is one original AI-generated contact sheet of three fictional demo clinicians; it is displayed as cropped CSS backgrounds, with the original vectors in `Portrait.tsx` as a fallback. The map is a CSS illustration. A stock-photo endpoint was blocked by the network proxy; no external photo dependency remains. The portraits must not be represented as actual clinicians. Clinician-reviewed anatomy and approved real staff photography would be needed for production. All assets are locally available offline.

## Recommended next design work

1. Ask the user to review the board and choose concrete visual corrections before spending more resources.
2. Split `main.tsx` into `screens/`, `components/Tooth.tsx`, `components/DoctorCard.tsx`, and `i18n/` if continuing beyond this review prototype. Preserve behavior and avoid an unsolicited rewrite.
3. For any real product, replace fictional demo portraits with consented staff photography and refine profile hero / appointment location selection toward references.
4. Preserve the interactive 3D viewer; refine the geometry after clinician review or replace it with a licensed validated GLB/GLTF if required.
5. Keep demo/test placeholders explicit; do not silently turn them into live features.

## Verification and artifacts

`npm run build` performs TS checking and production compilation. `python tools/verify.py` checks all screens in three languages, role entry, language switching, doctor search/profile, booking, tooth/layer selection, rotate/zoom, profile edits and responsive overflow. It writes 19 actual rendered PNGs and `validation.json`; the validation JSON records the exact passing checks and browser exceptions. Chromium and Python Playwright are tooling, not shipped runtime dependencies.

`python tools/package.py` embeds the built CSS/JS (including Three.js) into `demo.html` (offline desktop viewing), composes the eight-screen board from real screenshots and generates `dental-expert-prototype.zip` without node_modules. It does not fabricate UI screenshots. No publish/deploy was performed. ZIP includes code, lockfile, docs, screenshots, build, offline HTML and validation tools.

## Remaining review

This is an initial reference-led design implementation, not user-approved final visual parity. Production browser/device accessibility audits, actual medical content, scientific validation and real-device GPU coverage are outside the completed checks. Live WebGL rendering in Chromium was visually inspected. Avoid presenting these as verified. Do not include private patient information in future demo fixtures.
