# Dental Expert · mobile UI prototype

Mustaqil React + TypeScript + Vite dizayn prototipi. Backend, API, haqiqiy autentifikatsiya, to‘lov va bemor bazasi yo‘q. GitHub Pages manzili hozir 404 qaytaryapti; interaktiv demo hali onlayn ishlamaydi.

Global mahsulot talablari [`PRODUCT_VISION.md`](PRODUCT_VISION.md)da, shahar reklamalari va Free/Pro taklifi [`MONETIZATION_PLAN.md`](MONETIZATION_PLAN.md)da, ustoz/talaba oqimi [`EDUCATION_PLAN.md`](EDUCATION_PLAN.md)da, App Store/Google Play’ga chiqarish talablari [`STORE_RELEASE_REQUIREMENTS.md`](STORE_RELEASE_REQUIREMENTS.md)da, Claude uchun birinchi kodlash bosqichi [`CLAUDE_NEXT_STEP.md`](CLAUDE_NEXT_STEP.md)da. Hozirgi ekranlar bu talablardagi haqiqiy xizmatlar tayyorligini anglatmaydi.

## Uyda ko‘rish va davom ettirish

GitHub Pages yoqilgach telefon yoki kompyuterda interaktiv demo manzili `https://davlatsudekspert.github.io/DentalExpert/?screen=anatomy&lang=uz` bo‘ladi. Hozir uning ishlashi tasdiqlanmagan.

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
- Oddiy ochilganda premium ro‘yxatdan o‘tish/kirish ekrani chiqadi. `?screen=auth&lang=uz`, `?screen=profile&lang=en` kabi parametrlar ekranlarni bevosita ochadi.
- Onboarding yoki Sozlamalardan UZ / RU / EN tilini tanlang.
- Rol tanlash → premium kirish ekrani → ro‘yxatdan o‘tish yoki demo kirish → rol bosh sahifasi.
- Bemorning Asosiy sahifasida 3 ta “Namuna reklama” kartasi gorizontal ko‘rinadi va mavjud demo profilga ochiladi. Hozir Andijon va Farg‘onada tanlangan shaharga mos uchtadan namuna karta chiqadi; haqiqiy kampaniya, to‘lov yoki Free/Pro obuna ishlamaydi; keyingi oqim va tarif taklifi `MONETIZATION_PLAN.md`da.
- Ustoz/talaba kursida namunaviy haftalik reja → rasmli tish qatlamlari darsi → 3 savollik vizual test → o‘zbekcha PPTX → yozma amaliy holat va namunaviy izoh ishlaydi. Bu haqiqiy bemor yoki ustozga yuborish emas; tashqi darslik nashri/beti hali tasdiqlanmagan. Tafsilotlar [`SOURCE_REGISTER.md`](SOURCE_REGISTER.md)da.
- Shifokor kartasi → profil → qabul → kun / vaqt → demo tasdiq.
- Odontogrammada 32 ta FDI raqami bor; tishni tanlab anatomiya ekraniga o‘ting.
- Anatomiya sahifasida `Tish Rasm.rar`dagi kesim, tashqi va yuqori ko‘rinishlarni tanlash mumkin. «360° ko‘rinish»ni bosib uch ildizli tishning old, o‘ng, orqa va chap premium tasvirlarini aylantirib ko‘ring; drag, klaviatura strelkalari va yaqinlashtirish ishlaydi. Bu to‘rtta statik renderdan tuzilgan vizual prototip, uzluksiz 3D mesh emas. Qatlam tanlanganda premium kesim tasviri ochiladi.
- Profil tahriri joriy sessiya ichida aks etadi; yangilaganda barcha demo holatlar tiklanadi.
- Kirish ekranida ma’qullangan premium tish rasmi markazda turadi; uning ostidagi asosiy tugma ro‘yxatdan o‘tishni ochadi. «Parolni unutdingizmi?» tiklash sahifasini, sozlamalar esa parolni almashtirish, profil tahriri, maxfiylik, forum va bildirishnomalarni ochadi. Surat yuklash faqat lokal preview. Hozirgi reja email-kodli autentifikatsiya; Apple/Google do‘konlarining maxfiylik talablari ijtimoiy kirish tugmasi bilan adashtirilmasin. Haqiqiy autentifikatsiya hali ulanmagan.
- Forumda ogohlantirish va qoidalar, stomatologiya mavzusidagi demo post/izoh hamda lokal shikoyat amali bor. Mavzudan tashqari yoki taqiqlangan iboralar frontendda qaytariladi. Haqiqiy moderatsiya, shikoyat navbati, xabarnoma va doimiy saqlash uchun server kerak.

27 ko‘rinish: splash, onboarding, rol tanlash, premium kirish, login, sign up, bemor bosh sahifasi, qidiruv, shifokor profili, klinika, qabul, stomatolog ish maydoni, profil tahriri, bemor kartasi, odontogramma, anatomiya, ustoz, talaba, kurslar, rasmli dars, amaliy holat, sozlamalar, parolni tiklash, parolni almashtirish, maxfiylik, forum va bildirishnomalar.

## Vizual yo‘nalish va chegaralar

Foydalanuvchi bergan ikki etalon asosida och moviy gradient, navy sarlavhalar, turquoise tugmalar, mint statuslar, yumaloq oq kartalar va tish atrofidagi orbitalar ishlatilgan. Bu etalonning pikselma-piksel nusxasi emas. Shifokor portretlari bitta original AI yaratilgan fotografik demo aktivdan olinadi. Ular haqiqiy shifokorlarning surati emas. Barcha portretlar mahalliy faylda, klinika xaritasi esa sxema. Dastlabki ochiq foto manzasiga tarmoq orqali kirish bloklandi; o‘rniga yuqori sifatli fiktsion demo aktiv tayyorlandi.

Splash va bosh sahifada `premium-reference-hero-ivory.webp`, anatomiyada esa kesim, tepadan ko‘rinish va `turntable-*.webp` asosidagi to‘rt burchakli 360° vizual ishlatiladi. Premium renderlar foydalanuvchi yuborgan JPGlar asosida tayyorlangan; original JPGlar `assets/tooth3d/user-views/`da saqlangan. Turntable old/o‘ng/orqa/chap ko‘rinishlarga ega, lekin bu yagona aylantiriladigan 3D mesh yoki klinik rekonstruksiya emas. `src/PremiumTurntable.tsx` drag va klaviatura orqali burchak almashtiradi; `src/Tooth3D.tsx`dagi eski WebGL drafti manba sifatida qoldirilgan, foydalanuvchi ekranlarida ko‘rsatilmaydi.

`Tish Rasm.rar`dan 6 JPG ochildi va `assets/tooth3d/user-views/`da saqlandi. Tashqi ko‘rinishlarda uchta ildiz, kesimlarda ikkita ildiz ko‘rinadi; rasmlar bitta mos 3D obyektning kalibrlangan ko‘rinishlari emas. `tools/build_reference_molar.py` tashqi ko‘rinishlarga tayangan holda `reference-molar.glb` va tahrirlanadigan `reference-molar.blend` yaratadi. Bu repoda saqlangan haqiqiy aylantiriladigan 3D **draft**, ammo ilovadagi premium turntable uchun ishlatilmaydi; tashqi sirtida yuborilgan tish renderi tekstura sifatida ishlatiladi, lekin geometriyasi hali surat darajasidagi premium yoki klinik jihatdan to‘g‘ri rekonstruksiya emas. Jonli holatning haqiqiy frontend screenshoti `screenshots/anatomy-3d.png`da.

Login ma’lumotlarini hech qayerga yubormaydi. Maxfiylik sahifasi yuridik jihatdan tayyor siyosat emas, bildirishnomalar namunaviy. Kurslar o‘quv kontenti emas; navigatsiya namunasi. Narxlar, vaqtlar, ism va barcha ko‘rsatkichlar sun’iy demo ma’lumotlar.

## Tekshiruv va screenshotlar

- TypeScript + production build: `npm run build`.
- `tools/verify.py`: Playwright + Python, tizim Chromium kerak. Ishlayotgan Vite serveriga qarshi `python tools/verify.py` yoki offline HTML bilan `PROTOTYPE_HTML=demo.html python tools/verify.py`.
- Barcha 25 ekran uch tilda, asosiy interaksiyalar, 360 / 390 / 430 / 1280 px moslashuv tekshirildi; brauzer exception yo‘q.
- `screenshots/*.png`: haqiqiy frontendning 390 px kenglikdagi to‘liq sahifa tasvirlari (2× pixel density). Uzun ekranlarni ko‘rish uchun skroll kerak.
- `screenshots/preview-board.png`: premium kirish ekrani bilan boshlanadigan 8 ta asosiy ekranning umumiy boardi.
- `screenshots/validation.json`: bajarilgan tekshiruvlar ro‘yxati.
- `tools/package.py`: tayyor builddan offline HTML, board va ZIP qayta yaratadi; Pillow kerak. Avval build, keyin verify, keyin package bajaring.
- `dental-expert-review.zip`: telefonda ko‘rish uchun ixcham to‘plam — offline `demo.html`, 25 ta sahifa rasmi, anatomiya ko‘rinishlari va ochish yo‘riqnomasi.

## Fayllar

`src/main.tsx` — ekranlar, lokal holat va tarjimalar.
`src/PremiumTurntable.tsx` — premium tasvirli 360° vizual boshqaruvi; `src/Tooth3D.tsx` — avvalgi WebGL drafti.
`assets/tooth3d/` — original Blender `.blend` sahnasi va uning renderlari, premium hero hamda foydalanuvchi yuborgan kesim illyustratsiyasi (PNG/WebP/JPG); `tools/create_tooth_asset.py` — Blender generatori.
`tools/build_reference_molar.py` — arxivdagi JPG ko‘rinishlari asosida uch ildizli tahrirlanadigan Blender sahnasi va GLB draft yaratadi.
`public/clinicians.png` — 3 ta fiktsion shifokor portretidan iborat lokal fotografik aktiv; `src/Portrait.tsx` — uning vektor fallbacki. `src/LogoMark.tsx` — original vektor logo.
`src/style.css` — mobil dizayn tizimi va responsive layout.
`DESIGN_HANDOFF.md` — Claude Code yoki keyingi ishlab chiquvchi uchun topshirish.

Asl loyiha bo‘sh edi; barcha yangi ish faqat `prototype/` ichida. Manba kod foydalanuvchi ruxsati bilan GitHubdagi public repoga yuborilgan; ilova alohida deploy qilinmagan. Fayllarni saqlab qolishning mustaqil usuli — ZIPni o‘z qurilmangizga yuklab olish.

Offline HTMLning navigatsiyasi va demo qabuli brauzer xotirasidan yuklash orqali tekshirildi: tashqi HTTP so‘rovlari yo‘q. Cloud Chromium `file://` navigatsiyasini administrator siyosati bilan bloklaydi, shu sababli faylni bevosita ochish ushbu muhitda tekshirilmagan. ZIP yaxlitligi tekshirildi. Bulut uchun install/start ko‘rsatmalari draft sifatida saqlandi; ular avtomatik faollashtirilmagan va muhit publikatsiya qilinmagan.
