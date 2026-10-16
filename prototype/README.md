# Dental Expert · mobile UI prototype

Mustaqil React + TypeScript + Vite dizayn prototipi. Backend, API, haqiqiy autentifikatsiya, to‘lov va bemor bazasi yo‘q. Hech qayerga publikatsiya qilinmagan.

## Uyda ko‘rish va davom ettirish

1. `dental-expert-prototype.zip`ni yuklab oling va arxivdan chiqaring.
2. Tez ko‘rish uchun `demo.html`ni kompyuter brauzerida oching. Internet ham, Node.js ham kerak emas. Telefonning fayl ko‘rish dasturi HTML/JavaScript ishlatishini kafolatlab bo‘lmaydi; telefonda ishonchli ko‘rish uchun Vite serveridan foydalaning.
3. Kodni davom ettirish uchun Node.js 22.12+ yoki 24 va npm o‘rnating. Ushbu papkada:

```sh
npm ci
npm run dev
```

Telefon va kompyuter bir Wi-Fi tarmog‘ida bo‘lsa, Vite ko‘rsatgan kompyuterning Network manzilini telefon brauzerida oching. Internetda publikatsiya qilish shart emas. Lokal serverni faqat ishonchli tarmoqda ishlating.

```sh
npm run build
npm run preview
```

Build natijasi `dist/` ichida. `demo.html` esa shu buildning bitta faylga yig‘ilgan nusxasi.

## Prototipni sinash

- Desktopda chapdagi ekranlar ro‘yxati; telefonda pastki o‘ngdagi ekran tanlagich.
- `?screen=onboard&lang=uz`, `?screen=profile&lang=en` kabi parametrlar ekranlarni bevosita ochadi.
- Onboarding yoki Sozlamalardan UZ / RU / EN tilini tanlang.
- Rol tanlash → Continue → demo kirish → rol bosh sahifasi.
- Shifokor kartasi → profil → qabul → kun / vaqt → demo tasdiq.
- Odontogrammada 32 ta FDI raqami bor; tishni tanlab anatomiya ekraniga o‘ting.
- Anatomiya sahifasida original Blender 3D maketining sifatli renderi ochiladi. Renderdagi «Aylantirish · 3D»ni bosib jonli WebGL modeliga o‘ting; qatlamlar, aylantirish, yaqinlashtirish va barmoq bilan burishni sinang.
- Profil tahriri joriy sessiya ichida aks etadi; yangilaganda barcha demo holatlar tiklanadi.

19 ko‘rinish: splash, onboarding, rol tanlash, login, sign up, bemor bosh sahifasi, qidiruv, shifokor profili, klinika, qabul, stomatolog ish maydoni, profil tahriri, bemor kartasi, odontogramma, anatomiya, ustoz, talaba, kurslar, sozlamalar.

## Vizual yo‘nalish va chegaralar

Foydalanuvchi bergan ikki etalon asosida och moviy gradient, navy sarlavhalar, turquoise tugmalar, mint statuslar, yumaloq oq kartalar va tish atrofidagi orbitalar ishlatilgan. Bu etalonning pikselma-piksel nusxasi emas. Shifokor portretlari bitta original AI yaratilgan fotografik demo aktivdan olinadi. Ular haqiqiy shifokorlarning surati emas. Barcha portretlar mahalliy faylda, klinika xaritasi esa sxema. Dastlabki ochiq foto manzasiga tarmoq orqali kirish bloklandi; o‘rniga yuqori sifatli fiktsion demo aktiv tayyorlandi.

Tish maketi original 3D geometriya. `assets/tooth3d/DentalExpert_Tooth.blend`da Blender sahnasi, fizik kesimi va emal/dentin/pulpa/ildiz materiallari saqlangan; `tools/create_tooth_asset.py` uni qayta yaratadi. Onboarding va anatomiya sahifasida shu maketdan olingan render ko‘rsatiladi. Anatomiya renderiga bosilganda `src/Tooth3D.tsx`dagi jonli Three.js/WebGL 3D model ochiladi: burish, zoom va qatlamlar ishlaydi. Bu o‘quv uchun soddalashtirilgan maket; klinik/ilmiy aniqligi tekshirilmagan. Tish AI rasm emas; faqat fiktsion shifokor portretlari AI bilan yaratilgan.

Login ma’lumotlarini hech qayerga yubormaydi. Testlar, maxfiylik va bildirishnoma kabi ayrim elementlar faqat demo holat yoki izohni ko‘rsatadi. Kurslar o‘quv kontenti emas; navigatsiya namunasi. Narxlar, vaqtlar, ism va barcha ko‘rsatkichlar sun’iy demo ma’lumotlar.

## Tekshiruv va screenshotlar

- TypeScript + production build: `npm run build`.
- `tools/verify.py`: Playwright + Python, tizim Chromium kerak. Ishlayotgan Vite serveriga qarshi `python tools/verify.py` yoki offline HTML bilan `PROTOTYPE_HTML=demo.html python tools/verify.py`.
- Barcha 19 ekran uch tilda, asosiy interaksiyalar, 360 / 390 / 430 / 1280 px moslashuv tekshirildi. asosiy brauzer tekshiruvlari o‘tdi, brauzer exception yo‘q.
- `screenshots/*.png`: haqiqiy frontendning 390 px kenglikdagi to‘liq sahifa tasvirlari (2× pixel density). Uzun ekranlarni ko‘rish uchun skroll kerak.
- `screenshots/preview-board.png`: 8 ta asosiy ekran to‘liq ko‘rsatilgan umumiy board.
- `screenshots/validation.json`: bajarilgan tekshiruvlar ro‘yxati.
- `tools/package.py`: tayyor builddan offline HTML, board va ZIP qayta yaratadi; Pillow kerak. Avval build, keyin verify, keyin package bajaring.

## Fayllar

`src/main.tsx` — ekranlar, lokal holat va tarjimalar.
`src/Tooth3D.tsx` — original 3D geometriya, yoritish, kesim va WebGL boshqaruvi.
`assets/tooth3d/` — original Blender `.blend` sahnasi, transparent WebP previewlar va JPG renderlar; `tools/create_tooth_asset.py` — Blender generatori.
`public/clinicians.png` — 3 ta fiktsion shifokor portretidan iborat lokal fotografik aktiv; `src/Portrait.tsx` — uning vektor fallbacki. `src/LogoMark.tsx` — original vektor logo.
`src/style.css` — mobil dizayn tizimi va responsive layout.
`DESIGN_HANDOFF.md` — Claude Code yoki keyingi ishlab chiquvchi uchun topshirish.

Asl loyiha bo‘sh edi; barcha yangi ish faqat `prototype/` ichida. GitHubga push va ommaviy joylashtirish bajarilmagan. Fayllarni saqlab qolishning mustaqil usuli — ZIPni o‘z qurilmangizga yuklab olish.

Offline HTMLning navigatsiyasi va demo qabuli brauzer xotirasidan yuklash orqali tekshirildi: tashqi HTTP so‘rovlari yo‘q. Cloud Chromium `file://` navigatsiyasini administrator siyosati bilan bloklaydi, shu sababli faylni bevosita ochish ushbu muhitda tekshirilmagan. ZIP yaxlitligi tekshirildi. Bulut uchun install/start ko‘rsatmalari draft sifatida saqlandi; ular avtomatik faollashtirilmagan va muhit publikatsiya qilinmagan.
