# Google Play: Content rating (IARC) and the other App content answers

## Content rating questionnaire

Play Console → **Policy and programs → App content → Content ratings → Start questionnaire**.

- Email address for IARC: `davlatsudekspert@gmail.com`
- Category: **Reference, News, or Educational**

| Question (short form) | Answer | Why |
|---|---|---|
| Violence, blood, gore | No | Anatomy illustrations and tooth cutaways are educational, no injuries or violence. |
| Sexual content, nudity | No | |
| Profanity or crude humour | No | |
| Drugs, alcohol, tobacco | No | (No medication or substance content.) |
| Gambling, simulated gambling | No | |
| Users can interact or exchange content (text, images, voice) | **Yes** | Teachers post assignments to group members, students submit answers, dentists may publish a public profile. Moderation: complaint form in Settings, admin review. |
| Shares the user's current physical location with other users | No | No GPS. A dentist may publish a workplace address by choice; that is not the user's live location. |
| Allows purchases of digital goods | No | No in-app purchases or payments. |
| Unrestricted internet access / web browser | No | The app only opens its own content and a few official links. |

Expected result: low ratings (for example PEGI 3 / ESRB Everyone) with the interactive element "Users Interact".
The final rating is issued by IARC; do not promise a specific rating.

## Other App content sections (all required before closed testing)

| Section | Answer |
|---|---|
| Privacy policy | `https://dental-expert.pages.dev/privacy/` (update it first, see `data_safety.md` §4) |
| App access | **All or some functionality is restricted**: see `app_access.md` |
| Ads | **No, my app does not contain ads.** (The "Sample" doctor cards are demo content, not paid ads.) |
| Content rating | as above |
| Target audience and content | Age groups: **18 and over** (dentists, teachers, university dental students). Not designed for children; do not tick any under-13 group, otherwise the Families policy applies. "Appeals to children": No. |
| News app | No |
| COVID-19 contact tracing/status | No / not applicable |
| Data safety | `data_safety.md` |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | `health_apps_declaration.md` |
| Account deletion | Yes; URL as in `data_safety.md` |
| Advertising ID | **No** (no SDK uses the advertising ID; the manifest does not declare `AD_ID`) |
| App category | **Medical** (alternative: Education). Tags: Dentistry, Medical education. |
| Contact details | Email `davlatsudekspert@gmail.com`, website `https://dental-expert.pages.dev` |
