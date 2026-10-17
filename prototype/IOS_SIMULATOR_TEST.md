# iPhone simulyatorida avtomatik sinov (Mac kerak emas)

Bu sinov ilovani GitHub serveridagi Mac kompyuterda **iPhone simulyatorida** ishga tushiradi, ekranlarni o‘zi bosib chiqadi va har bir qadamning **rasmini (skrinshot)** hamda butun jarayonning **videosini** saqlab beradi. Telefon, Apple hisobi yoki sertifikat kerak emas.

## Qanday ishga tushiriladi

1. GitHub’da repozitoriyani oching → yuqoridagi **Actions** bo‘limi.
2. Chap ro‘yxatdan **iOS Simulator test** ni tanlang.
3. O‘ng tomondagi **Run workflow** tugmasini bosing. Ochilgan oynada:
   - **sign_in_flow**: belgilanmagan bo‘lsa (odatiy), faqat qisqa sinov: til tanlash → O‘zbekcha → rollar → ro‘yxatdan o‘tish ekrani. Hech narsa yuborilmaydi, hisob yaratilmaydi, xat ketmaydi.
     Belgilansa, to‘liq sinov ham o‘tadi: stomatolog, ustoz va talaba sifatida ro‘yxatdan o‘tish, bemor qo‘shish, tishlarni belgilash, 3D atlas, guruh va topshiriq, kunlik test, chiqish.
   - **api_base**: qisqa sinovda ilova qaysi serverga ulanadi (odatda `https://dental-expert.pages.dev`; sinov serveringiz bo‘lsa, uning manzilini yozing). To‘liq sinovda bu maydon ishlatilmaydi (pastga qarang).
   - **test_email**: to‘liq sinovdagi hisoblar uchun asos manzil (masalan `maestro@example.test`). Undan `...-dentist-...`, `...-teacher-...`, `...-student-...` manzillari yasaladi. Bu manzillarga **xat yuborilmaydi**.
   - **device** va **maestro_version**: odatda o‘zgartirmang.
4. Yashil **Run workflow** tugmasini bosing. Sinov taxminan 25–45 daqiqa davom etadi (ilovani Mac’da yig‘ish eng ko‘p vaqt oladi).

## Rasmlar va videoni qayerdan yuklab olish mumkin

1. Actions → **iOS Simulator test** → eng yuqoridagi (oxirgi) ishga tushirishni oching.
2. Sahifaning pastida **Artifacts** bo‘limi bor:
   - **ios-simulator-screenshots-N** — eng keraklisi: `screenshots/` papkasida har bir sinov bo‘yicha rasmlar (`onboarding-01-language.png`, `dentist-06-odontogram.png`, …), `video/simulator.mp4` — butun jarayon videosi, `summary.md` — qaysi sinov o‘tdi, qaysi biri o‘tmadi.
   - **ios-simulator-results-N** — dasturchilar uchun to‘liq hisobot: Maestro hisobotlari, xatolik paytidagi rasmlar, simulyator jurnali (`logs/`).
3. Fayl nomini bosing — zip arxiv yuklanadi, uni oching.

Sinov o‘tmasa, ishga tushirish qizil belgi bilan tugaydi, lekin rasmlar va video baribir saqlanadi: xato qayerda bo‘lganini aynan shu rasmlardan ko‘rish mumkin (`zz-after-failure.png` — xatodan keyingi ekran).

## To‘liq sinovda kirish kodi qanday olinadi

Ilovada parol yo‘q: emailga 6 xonali kod yuboriladi. Avtomatik sinov haqiqiy pochtani o‘qiy olmaydi, shuning uchun:

- **1-variant (ishlatilmaydi):** sinov serveriga (`api_base`) ulanib, kodni haqiqiy pochtadan o‘qish. Bu uchun pochta qutisiga avtomatik kirish kerak; server kodni javobda qaytarishi (`devCode`) esa xavfsizlik uchun **faqat localhost’da** ishlaydi. Kompyuteringizdagi lokal serverni tunnel orqali GitHub serveriga ulash ham bu yerda mumkin emas.
- **2-variant (ishlatiladi):** sinov vaqtida GitHub’ning Mac serverining o‘zida vaqtinchalik server ishga tushiriladi (`npx wrangler pages dev`, alohida bo‘sh ma’lumotlar bazasi, `.dev.vars` faylida `AUTH_DEV_ECHO=1`). Ilova shu serverga (`http://127.0.0.1:8789`) ulanadi, kod xat bilan yuborilmaydi, balki javobda qaytadi va sinov uni kichik yordamchi skript orqali o‘qiydi. Asosiy (jonli) server va uning bazasiga umuman tegilmaydi; sinov tugagach, vaqtinchalik baza o‘chib ketadi.

## Birinchi marta ishga tushirganda nimani tekshirish kerak

- Ishga tushirish 5 soniyada, birorta qadam boshlanmasdan qizil bo‘lsa — bu GitHub hisobidagi to‘lov/limit masalasi (Settings → Billing and plans). Mac serverlari daqiqalari yopiq repozitoriyada oddiy serverdan ancha qimmat hisoblanadi.
- **Build for the iOS Simulator** qadami qizil bo‘lsa — `ios-simulator-results-N` ichidagi `logs/xcodebuild.log` faylining oxirini dasturchiga yuboring.
- Qisqa sinov o‘tdi, lekin to‘liq sinovda ro‘yxatdan o‘tish ekranida **Kod yuborish** o‘rniga **Ro‘yxatdan o‘tish (demo)** chiqsa — ilova vaqtinchalik serverga ulana olmagan. `logs/local-api/e2e-proxy.log` faylini oching: unda ilovadan kelgan so‘rovlar bo‘lishi kerak.
- Rasmlar bor-u, `video/simulator.mp4` ochilmasa — `logs/recordVideo.log` ni dasturchiga yuboring.

## Dasturchilar uchun qisqacha

- Workflow: `.github/workflows/ios-simulator-test.yml`. Skriptlar va Maestro sinovlari: `prototype/tools/ios_sim/` (`flows/*.yaml`, `run_flows.sh`, `boot_simulator.sh`, `start_local_api.sh`, `e2e_proxy.mjs`).
- Mac’da qo‘lda: `npm ci && VITE_API_BASE=http://127.0.0.1:8789 npm run build && npx cap sync ios`, Xcode’da simulyator uchun yig‘ing, so‘ng `tools/ios_sim/start_local_api.sh`, `tools/ios_sim/boot_simulator.sh` va `SIM_UDID=… APP_PATH=…/App.app OUT_DIR=/tmp/sim tools/ios_sim/run_flows.sh tools/ios_sim/flows/0*.yaml` (`DENTIST_EMAIL`, `TEACHER_EMAIL`, `STUDENT_EMAIL`, `GROUP_NAME`, `QUIZ_OPTION_RE` — workflow’dagi **Test identities** qadamiga qarang).
- Matnlar o‘zgarganda selektorlarni Mac’siz tekshirish: `tools/ios_sim/chromium_dryrun.py` (ichidagi izohga qarang).
