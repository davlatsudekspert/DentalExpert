# Google Play: Data safety answers (Dental Expert, uz.dentalexpert.app)

Play Console → **Policy and programs → App content → Data safety**. Answers match the build of 17 Oct 2026
(code checked: `functions/api/auth/*`, `functions/api/classroom/*`, `functions/api/reports.ts`, `src/Patients.tsx`,
`src/Daily.tsx`, `src/api.ts`). The app has **no ads, analytics, crash-reporting or tracking SDKs**. Re-check these
answers whenever a new SDK or a new server field is added.

## 1. Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only; `allowMixedContent:false`) |
| Which of the following methods of account creation does your app support? | **Username and other authentication** (email + one-time code) and **OAuth** (Sign in with Google). Apple sign-in is iOS/web only. |
| Do you provide a way for users to request that their data is deleted? | **Yes** |
| Delete account URL (Account deletion section) | `https://dental-expert.pages.dev/privacy/` (section "Your rights": deletion in Settings and by email to davlatsudekspert@gmail.com). A dedicated page such as `/delete-account/` that only explains the steps would be safer for review, see note at the end. |
| In-app deletion path | **Settings → Delete account** (deletes the account, sessions, group memberships and answers; also clears the patient list and daily results stored on this device). |

## 2. Data types: collected (none are "shared")

"Shared" = **No** for every type. Cloudflare (hosting/database) and Resend (sign-in email) process data on our
behalf as service providers; Play does not count service providers as sharing.

| Play category → data type | Collected? | Required or optional | Purposes | Notes |
|---|---|---|---|---|
| Personal info → **Name** | Yes | Optional (user may leave it empty) | App functionality, Account management | Name on the account; comes from Google when using Google sign-in. |
| Personal info → **Email address** | Yes | **Required** | App functionality, Account management | Sign-in identity. A separate public contact email is optional (dentist profile). |
| Personal info → **User IDs** | Yes | **Required** | App functionality, Account management | Internal account id; Google account subject id when Google sign-in is used. |
| Personal info → **Phone number** | Yes | Optional | App functionality | Only if a dentist enters it in the profile to publish. |
| Personal info → **Address** | Yes | Optional | App functionality | Only the workplace address a dentist chooses to publish. |
| Personal info → **Other info** | Yes | Optional | App functionality | Workplace, specialty, bio, Telegram/Instagram handles, map link, group nickname, role (patient/dentist/teacher/student). |
| Location → **Approximate location** | Yes | Optional | App functionality | Not GPS: the country/city the user picks is saved on the account. The app has no location permission. Declare it to be safe; if you decide a manually typed city is not "location", you may answer No, but Yes is the conservative choice. |
| App activity → **Other user-generated content** | Yes | Optional | App functionality | Answers/quiz results submitted to a teacher's group; text of complaints/messages sent from Settings (plus optional contact). |

Processing details asked for each type:
- **Is this data processed ephemerally?** No.
- **Is collection required or can users choose?** As in the table (email and user ID are required for an account).
- **Purposes:** only *App functionality* and *Account management*. Never Analytics, Advertising or marketing, Fraud
  prevention as a purpose of its own, Personalization or Developer communications.

## 3. Data types: NOT collected (answer "No")

- **Health and fitness → Health info:** No. The dentist's patient list (names, phones, notes, odontogram, visits) is
  stored **only on the device** in the app's WebView storage and is never sent to the server. Daily practice results
  are also on-device only. Backup is disabled (`android:allowBackup="false"` plus data-extraction rules that exclude
  everything), so this data does not leave the phone through Google backup or device transfer either.
- **Photos and videos:** No. A profile photo picked in the form is only previewed on the device, not uploaded.
- **Precise location, Contacts, Calendar, Messages (email/SMS), Files and docs, Audio, Financial info, Web browsing,
  App info and performance (crash logs, diagnostics), Device or other IDs, Race/ethnicity, Political or religious
  beliefs, Sexual orientation:** No.
- Session token: an access token is kept on the device and only its hash on the server; it is an authentication
  credential, not a Data safety data type.
- The server keeps a keyed **hash** of the IP address for sign-in rate limiting, purged within about a day; this is
  security processing and is not listed as a separate data type.

## 4. Consistency check before you submit

1. The privacy policy at `https://dental-expert.pages.dev/privacy/` currently lists email, name, role and city,
   sessions and group answers. It does **not yet mention** the optional dentist profile fields (phone, workplace,
   address, bio, Telegram/Instagram/public email/map link), complaint messages, Google sign-in, or that the patient
   list stays on the device. Play compares the policy with these answers: update the policy page first.
2. Google recommends a deletion web page that names the app/developer and lists the steps; the privacy page
   works, a dedicated page is clearer.
