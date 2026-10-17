# Google Play: Health apps declaration

Play Console → **Policy and programs → App content → Health apps**. Required for every app on a testing or
production track (Google: "After August 31, 2024, all apps will be required to have completed an accurate Health apps
declaration", https://support.google.com/googleplay/android-developer/answer/14738291).

## What to tick

**Medical**
- [x] **Medical Reference and Education**: lessons, slide presentations, quizzes, daily practice and the 3D tooth atlas
  for dental students, teachers and dentists.
- [x] **Healthcare Services and Management**: Google lists "health records" here. The dentist's patient list with an
  odontogram and visit notes is a simple record-keeping tool (stored only on the device). Ticking this is the honest
  answer; leaving it out while the feature exists risks a rejection for an inaccurate declaration.
- [ ] Clinical Decision Support: **no** (no dosage calculators, risk scores or treatment suggestions).
- [ ] Diseases and Conditions Management: **no** (the app does not help a patient manage a condition).
- [ ] **Medical Device Apps: no.** The app is not regulated as a medical device (not under EU MDR/IVDR, not FDA
  cleared) and does not diagnose, treat, monitor or prevent disease.
- All other Health and fitness / Medical / Research boxes: **no**.

## Statement to keep consistent everywhere (listing, in-app, review notes)

> Dental Expert is an educational and reference app. It is not a medical device, it does not provide a diagnosis or
> treatment advice, and it does not replace a consultation with a qualified dentist. The patient list is a personal
> note-taking tool for dentists; its contents stay on the dentist's phone.

Also make sure:
- The store listing does not promise diagnosis, cure or clinical accuracy (the texts in `listings/` already follow this).
- Lesson content is not specialist-reviewed yet; keep the educational-use disclaimer in the app.
- Health Connect is not used, so no Health Connect permission declaration is needed.
