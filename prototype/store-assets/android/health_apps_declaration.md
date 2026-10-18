# Google Play: Health apps declaration

Play Console → **Policy and programs → App content → Health apps**. Required for every app on a testing or
production track (Google: "After August 31, 2024, all apps will be required to have completed an accurate Health apps
declaration", https://support.google.com/googleplay/android-developer/answer/14738291).

## Why the Android build is the "education edition"

Google Play rejected the app: apps that declare **Healthcare Services and Management** must be published from an
organization developer account, and this listing is on a personal account. So the Android (Google Play) build is an
**education edition** with no healthcare-service features at all, and declares only Medical Reference and Education.
iOS and the website keep the full app.

The edition is chosen at runtime (`src/edition.ts`: `Capacitor.getPlatform()==='android'`; `?edition=edu` forces it on
the web for testing). In the education edition the app has **no**:
- patient role (the role picker offers dentist, teacher and student; an old patient account opens the student home),
- dentist search, dentist cards or profiles, clinic map, booking or appointment calendar,
- dentist's patient list, patient records, odontogram of patients or visit notes,
- public dentist profile ("show me in the dentist list" and the patient-facing contact fields are hidden),
- Search tab for finding a dentist in the bottom bar (4 tabs: Home, Atlas, Learn, Profile).

Blocked screens (deep link, history, `?screen=`, in-app navigation) open the role's learning home instead.
`tools/edu_edition_test.py` checks this on every push (CI: `.github/workflows/checks.yml`).

## What to tick

**Medical**
- [x] **Medical Reference and Education**: curriculum, illustrated lessons, slide presentations, quizzes, daily and
  picture practice, the 3D tooth atlas, and teacher–student groups with assignments and class tests (QR join), for
  dental students, teachers and dentists.
- [ ] **Healthcare Services and Management: no.** The Android build has no booking, no doctor finding, no clinic
  information and no health records (see the list above).
- [ ] Clinical Decision Support: **no** (no dosage calculators, risk scores or treatment suggestions).
- [ ] Diseases and Conditions Management: **no** (the app does not help a patient manage a condition).
- [ ] **Medical Device Apps: no.** The app is not regulated as a medical device (not under EU MDR/IVDR, not FDA
  cleared) and does not diagnose, treat, monitor or prevent disease.
- All other Health and fitness / Medical / Research boxes: **no**.

## Statement to keep consistent everywhere (listing, in-app, review notes)

> Dental Expert is an educational and reference app for learning dentistry. It is not a medical device, it does not
> provide a diagnosis or treatment advice, and it does not replace a consultation with a qualified dentist. The
> Android app offers no healthcare services: no booking, no dentist search and no patient records.

Also make sure:
- The store listing describes only the education features and does not promise diagnosis, cure or clinical accuracy
  (the texts in `listings/` follow this).
- Lesson content is not specialist-reviewed yet; keep the educational-use disclaimer in the app.
- Health Connect is not used, so no Health Connect permission declaration is needed.
