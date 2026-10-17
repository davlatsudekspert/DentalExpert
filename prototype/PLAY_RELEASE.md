# Google Play’ga chiqarish: egasi uchun qadamma-qadam yo‘riqnoma

Ilova: **Dental Expert UZ**, paket nomi (applicationId): **`uz.dentalexpert.app`**.
Bu hujjat dasturchi bo‘lmagan egaga mo‘ljallangan. Kod tomonida hammasi tayyor; quyida faqat siz Play Console,
Google Cloud va GitHub’da bosadigan tugmalar yozilgan.

Muhim sana qoidasi: shaxsiy (personal) dasturchi akkaunti bilan ilovani hammaga chiqarishdan oldin **kamida 12 tester
14 kun uzluksiz** yopiq testda (closed testing) bo‘lishi kerak. Shuning uchun 1–7-qadamlarni imkon qadar tezroq qiling.
Batafsil: `store-assets/android/closed_testing_plan.md`.

---

## Umumiy manzara (qisqacha)

1. GitHub’dagi **“Android Play release (AAB)”** workflow ilovani yig‘adi va **.aab** faylini (Android App Bundle)
   **upload key** bilan imzolaydi.
2. Siz .aab ni Play Console’ga yuklaysiz (birinchi marta qo‘lda, keyin avtomatik).
3. Google ilovani o‘zining **app signing key** kaliti bilan qayta imzolab, foydalanuvchilarga tarqatadi.

---

## 1-qadam. Play Console akkaunti

1. https://play.google.com/console → dasturchi akkaunti (bir martalik 25 AQSh dollari, shaxsni tasdiqlash).
2. Akkaunt turi **Personal** bo‘lsa, 12 tester / 14 kun qoidasi amal qiladi. **Organization** (tashkilot, D-U-N-S
   raqami bilan) bo‘lsa, bu qoida yo‘q, lekin tasdiqlash uzoqroq.
3. **Create app**: App name `Dental Expert UZ`, Default language **English (United States) – en-US**,
   **App**, **Free**, ikkala deklaratsiyaga belgi qo‘ying → Create app.

> Paket nomi Play’da birinchi .aab yuklanganda abadiy bog‘lanadi va keyin o‘zgartirib bo‘lmaydi.

## 2-qadam. Upload keystore (yuklash kaliti) va 4 ta GitHub secret

Keystore fayli (`.jks`) va uning parollarini sizga alohida, xavfsiz yo‘l bilan beraman. Ularni:
- **hech qachon** chat, email matni yoki GitHub kodiga qo‘ymang;
- faylning **zaxira nusxasini** ikki joyda saqlang (masalan, shifrlangan fleshka va parol menejeri).

Agar keystore’ni o‘zingiz yaratmoqchi bo‘lsangiz (Java o‘rnatilgan kompyuterda, bitta buyruq):

```
keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

U parol va ism-familiya so‘raydi. Bu yerdagi `upload` — **alias** (kalit nomi).

### Faylni base64 matnga aylantirish

GitHub secret faqat matn qabul qiladi, shuning uchun faylni base64 ga o‘giramiz:

- **Windows (PowerShell):**
  `[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\yo'l\upload-keystore.jks")) | Set-Clipboard`
- **macOS (Terminal):** `base64 -i upload-keystore.jks | pbcopy`
- **Linux:** `base64 -w0 upload-keystore.jks`

Natija (uzun bir qator matn) endi buferda (clipboard).

### GitHub’ga secret qo‘shish

GitHub → repozitoriy → **Settings → Secrets and variables → Actions → New repository secret**. To‘rttasini qo‘shing:

| Secret nomi | Qiymati |
|---|---|
| `ANDROID_KEYSTORE_B64` | yuqoridagi base64 matn (hammasi) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore paroli (store password) |
| `ANDROID_KEY_ALIAS` | kalit nomi, masalan `upload` |
| `ANDROID_KEY_PASSWORD` | kalit paroli (key password; ko‘pincha keystore paroli bilan bir xil) |

Secret’lardan biri yo‘q bo‘lsa, workflow darhol to‘xtaydi va **qaysi secret yetishmayotganini** nomi bilan yozadi
(qiymatlarni hech qachon ko‘rsatmaydi).

## 3-qadam. Play App Signing nima?

- **App signing key** — ilovaning haqiqiy imzo kaliti. Uni **Google saqlaydi**, sizga kerak emas, yo‘qolmaydi.
- **Upload key** — bizning keystore. U faqat “bu faylni haqiqiy egasi yukladi” deb isbotlaydi.
- Upload key yo‘qolsa yoki o‘g‘irlansa, Play Console → App integrity orqali yangisini so‘rash mumkin (bir necha kun).
  Shunday bo‘lsa ham zaxira nusxani saqlang.
- Birinchi .aab yuklanganda Play “App signing by Google Play” ni yoqishni taklif qiladi → **rozilik bering**
  (standart variant, Google yaratgan kalit).

## 4-qadam. Birinchi .aab ni yig‘ish

1. GitHub → **Actions → “Android Play release (AAB)” → Run workflow**.
2. `track` = **internal**, `status` = **draft** → **Run workflow**.
3. Taxminan 10 daqiqadan so‘ng run yashil bo‘ladi. Pastda **Artifacts** bo‘limidan
   `dental-expert-release-aab-10NN` ni yuklab oling (zip ichida `app-release.aab`). Zip’ni oching.
4. Run sahifasidagi **Summary** da versionCode va upload key’ning **SHA-1** barmoq izi ko‘rinadi (11-qadamda kerak).

Har bir run yangi versiya raqami oladi: **versionCode = 1000 + run raqami** (Play har yuklashda kattaroq raqam talab
qiladi). Bir xil runni qayta ishga tushirsangiz (Re-run), raqam o‘zgarmaydi va Play uni rad etadi — yangi run boshlang.

## 5-qadam. Birinchi .aab ni Play Console’ga QO‘LDA yuklash (bir marta)

Nega qo‘lda: Google Play API mavjud ilovaga yangi versiya yuklay oladi, lekin **ilovaning birinchi relizini va
do‘kon sahifasini yarata olmaydi** — paket nomi Play’ga birinchi marta faqat Console orqali yuklangan fayl bilan
bog‘lanadi. Shundan keyin workflow avtomatik yuklashi mumkin.

1. Play Console → ilova → **Test and release → Testing → Internal testing → Create new release**.
2. “App signing” taklifi chiqsa → **Use Google-generated key / Continue** (3-qadam).
3. `app-release.aab` ni sudrab tashlang. Release name avtomatik to‘ladi.
4. Release notes (masalan: `First test version.`) → **Next → Save → Start rollout to Internal testing**.
5. **Testers** yorlig‘i → **Create email list** → o‘zingiz va 1–2 kishining Gmail manzillari → Save.
   **Copy link** — shu havola orqali ular ilovani Play’dan o‘rnatadi.

## 6-qadam. App content (majburiy bo‘limlar)

Play Console → **Policy and programs → App content**. Javoblar tayyor, faqat ko‘chirib kiriting:

| Bo‘lim | Fayl |
|---|---|
| Privacy policy | `https://dental-expert.pages.dev/privacy/` |
| App access (reviewer kirishi) | `store-assets/android/app_access.md` |
| Ads (reklama: **yo‘q**), Target audience (**18+**), Content rating, boshqalar | `store-assets/android/content_rating.md` |
| Data safety + Account deletion | `store-assets/android/data_safety.md` |
| Health apps | `store-assets/android/health_apps_declaration.md` |

Do‘kon sahifasi matnlari: **Grow users → Store presence → Main store listing** — `store-assets/android/listings/`
(en-US asosiy, ru-RU tarjima sifatida). Rasmlar: ikonka 512×512, feature graphic 1024×500, kamida 2 ta telefon
skrinshoti.

> Diqqat: Data safety’dagi javoblar maxfiylik siyosatiga mos kelishi kerak. Siyosatga hozircha dantist profilidagi
> telefon/ish joyi/aloqa kanallari, shikoyat matni va Google orqali kirish haqida yozilmagan — yopiq testni
> review’ga yuborishdan oldin siyosat sahifasini yangilating (`data_safety.md`, 4-bo‘lim).

## 7-qadam. Yopiq test (closed testing) — 14 kunlik soat shu yerda boshlanadi

1. **Test and release → Testing → Closed testing → Alpha** (standart yopiq trek) → **Create new release**.
2. Internal’dagi relizni ko‘chirish uchun: Internal testing → relizda **Promote release → Closed testing (Alpha)**.
   Yoki workflow’ni `track` = **alpha** bilan qayta ishga tushiring.
3. **Testers**: Google Group email’ini qo‘shing (masalan `dental-expert-testers@googlegroups.com`) yoki email ro‘yxati.
4. **Countries/regions**: Uzbekistan va kerakli boshqa davlatlar.
5. **Send for review**. Tasdiqlangach, Testers yorlig‘idagi **opt-in havolasini** testerlarga yuboring.
   Tayyor xabar matni: `store-assets/android/closed_testing_plan.md`.
6. 12 tester 14 kun uzluksiz qo‘shilib turgach: Dashboard → **Apply for production**.

## 8-qadam. Service account va `PLAY_SERVICE_ACCOUNT_JSON` (avtomatik yuklash uchun)

Bu ixtiyoriy: bu secret bo‘lmasa, workflow faqat .aab yasaydi va siz uni qo‘lda yuklaysiz.

1. https://console.cloud.google.com → yangi loyiha (masalan `dental-expert-play`).
2. **APIs & Services → Library → “Google Play Android Developer API” → Enable**.
3. **IAM & Admin → Service accounts → Create service account** (nomi: `github-play-upload`) → Done.
   Rol berish shart emas.
4. Service account → **Keys → Add key → Create new key → JSON** → fayl yuklanadi. Bu fayl — parol kabi, hech kimga
   yubormang.
5. Play Console (akkaunt darajasida, chap menyu) → **Users and permissions → Invite new users** → email sifatida
   service account manzili (`...@...iam.gserviceaccount.com`) → **App permissions → Add app → Dental Expert UZ** →
   ruxsatlar: **Release apps to testing tracks**, **Release to production, exclude devices, and use Play App Signing**,
   **View app information** → Invite user. (Console’da “Setup → API access” sahifasi bo‘lsa, loyihani u yerda ham
   bog‘lang.)
6. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   `PLAY_SERVICE_ACCOUNT_JSON` = JSON faylning **butun matni** (Notepad’da ochib, hammasini nusxalang).
7. Ruxsatlar kuchga kirishi uchun ba’zan 24 soatgacha kutish kerak bo‘ladi.

## 9-qadam. Keyingi har bir versiya

GitHub → Actions → **Android Play release (AAB)** → Run workflow:

| `track` | Ma’nosi |
|---|---|
| `internal` | Ichki test (100 tagacha tester, review deyarli yo‘q, tez) |
| `alpha` | Yopiq test (closed testing; 14 kunlik qoida shu trekda hisoblanadi) |
| `production` | Hamma uchun (faqat production ruxsati berilgandan keyin) |

| `status` | Ma’nosi |
|---|---|
| `draft` (standart) | Reliz Play Console’da qoralama bo‘lib turadi; siz tekshirib **Start rollout** bosasiz |
| `completed` | Darhol tarqatiladi (review’dan o‘tgach) |

Ilova hali birorta review’dan o‘tmagan bo‘lsa, Play `Only releases with status draft may be created on draft app`
deb xato beradi — unda `draft` tanlang va relizni Console’da yakunlang.

## 10-qadam. Testerlarni qo‘shish va internal → closed → production

- **Internal:** Internal testing → Testers → email ro‘yxati (100 tagacha) → havolani yuboring.
- **Closed:** Closed testing → Alpha → Testers → Google Group yoki email ro‘yxati → opt-in havola.
- **Ko‘tarish (promote):** trekdagi relizda **Promote release** → keyingi trekni tanlang → Save → Review → rollout.
  Production uchun “staged rollout” foizini (masalan 20%) tanlash mumkin.
- Testerlar ilovani **o‘chirib yubormasligi** va testdan chiqmasligi kerak, aks holda 14 kun hisobiga kirmaydi.

## 11-qadam. Google orqali kirish uchun SHA-1

Google Sign-In Android ilovani paket nomi + **SHA-1** bo‘yicha taniydi. Play’dan o‘rnatilgan ilova **Google’ning app
signing key**i bilan imzolangan bo‘ladi, shuning uchun **ikkala** SHA-1 ni ro‘yxatdan o‘tkazing:

1. **App signing key SHA-1** (eng muhimi): Play Console → **Test and release → App integrity** (eski menyuda:
   Release → Setup → App integrity) → **App signing** yorlig‘i → “App signing key certificate” → **SHA-1**.
   Shu sahifada “Upload key certificate” SHA-1 ham bor.
2. **Upload key SHA-1**: workflow run’ining Summary qismida yozilgan, yoki kompyuterda:
   `keytool -list -v -keystore upload-keystore.jks -alias upload` → `SHA1:` qatori.
3. Google Cloud Console (OAuth loyihasi) → **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Android** → Package name `uz.dentalexpert.app` + SHA-1 → Create. Har bir SHA-1 uchun alohida Android client
   yarating. Batafsil: `OAUTH_SETUP.md`.
4. `VITE_GOOGLE_WEB_CLIENT_ID` GitHub variable’i o‘rnatilgan bo‘lishi kerak, aks holda Google tugmasi ko‘rinmaydi
   (email-kod orqali kirish baribir ishlaydi).

SHA-1 — ochiq barmoq izi, sir emas; uni bemalol ko‘chirish mumkin.

## Muammolar va yechimlar

| Xabar | Sabab / yechim |
|---|---|
| `Missing GitHub secrets: ...` | Nomi yozilgan secret’ni 2-qadamdagidek qo‘shing |
| `ANDROID_KEYSTORE_B64 is not valid base64` | base64’ni qayta yarating, butun matnni nusxalang |
| `keystore cannot be opened ...` | Parol yoki alias noto‘g‘ri |
| `signed, but not with the upload key` | Boshqa kalit ishlatilgan: alias/secret’larni tekshiring |
| Play: `APK/AAB signed with the wrong key` | Play’ga birinchi yuklangan upload key’dan boshqa keystore ishlatilmoqda |
| Play: `Version code ... has already been used` | Yangi run boshlang (Re-run emas) |
| Play: `The caller does not have permission` | 8-qadam, 5-band ruxsatlari; 24 soat kuting |
| Play: `Package not found` | Birinchi .aab hali qo‘lda yuklanmagan (5-qadam) |
