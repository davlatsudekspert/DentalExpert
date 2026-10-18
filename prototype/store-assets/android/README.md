# Google Play store texts (Dental Expert UZ, uz.dentalexpert.app)

Owner guide (Uzbek, step by step): `../../PLAY_RELEASE.md`.

| File | Play Console place |
|---|---|
| `listings/<lang>/title.txt` (≤30), `short_description.txt` (≤80), `full_description.txt` (≤4000) | Grow users → Store presence → Main store listing (and Translations) |
| `data_safety.md` | App content → Data safety (+ Account deletion) |
| `content_rating.md` | App content → Content ratings, Target audience, Ads and the other declarations |
| `health_apps_declaration.md` | App content → Health apps |
| `app_access.md` | App content → App access (reviewer sign-in) |
| `closed_testing_plan.md` | 12 testers / 14 days rule, plan and recruiting message |

Lengths (characters, as Play counts them): title 16 in every language; short description en-US 71, ru-RU 67, uz 66;
full description about 1.7k in every language.

The Android app is the **education edition** (no patient role, dentist search, booking or patient records; see
`health_apps_declaration.md`), so these texts describe only the learning features. iOS keeps the full app.

Languages:
- **en-US**: set as the default language of the listing.
- **ru-RU**: add under Translations → Manage translations → Add your own translations.
- **uz**: Play Console's own list of listing languages has no Uzbek (checked 17 Oct 2026,
  https://support.google.com/googleplay/android-developer/answer/9844778). Keep `listings/uz/` for the website,
  social posts and tester messages; if Uzbek appears in the Console later, add it as a translation. Until then,
  Uzbek-speaking users see the English or Russian listing.

Graphics are not in this folder. Play needs: app icon 512×512 PNG, feature graphic 1024×500, at least 2 phone
screenshots (the iOS screenshots in `../ios/` can be reused if they meet Play's size rules: 320-3840 px per side,
long side at most 2× the short side; the 1290×2796 iPhone shots are slightly over 2:1, so crop or re-take them).
