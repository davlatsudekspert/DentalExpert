# Claude Code uchun navbatdagi ish — Dental Expert

Ertangi sessiyada Claude Code'ga shuni yozing: **“`prototype/CLAUDE_NEXT_STEP.md` va `prototype/PRODUCT_VISION.md`ni o‘qi. Birinchi bosqichni faqat reja bilan emas, ishlaydigan kod va test bilan yakunla. Mahsulotni yaxshilaydigan o‘z takliflaringni qisqa asosla; tasdiqlangan talablarga mos, kichik va tekshiriladigan yaxshilanishlarni kodga ham qo‘sh.”**

Claude Code avval repo ichida ishlayotganini va `main`ning so‘nggi holatini olganini tekshirsin. Repo unga ko‘rinmasa yoki GitHub 404 qaytarsa, kodni o‘qiyapman deb taxmin qilmasin: GitHub hisobiga kirish huquqini tekshirib, foydalanuvchiga aniq to‘siqni aytsin. Dizayn yoki mahsulot bo‘yicha o‘z fikrini taklif qilishi mumkin, lekin yangi imkoniyatni haqiqatan ishlamaguncha “tayyor” deb atamasin. Katta g‘oyalar keyingi bosqichga yozilsin, birinchi bosqichdagi ishlaydigan oqimni tugatishga xalaqit bermasin.

## Avval holatni tekshir

Repository `davlatsudekspert/DentalExpert`, `main`; ilova `prototype/`da. `README.md`, `DESIGN_HANDOFF.md`, `PRODUCT_VISION.md` va `CLAUDE_START_HERE.md`ni o‘qi. `npm run build` va `npm run dev` bilan mavjud React + TypeScript + Vite prototipini tekshir. 19 ekran, UZ/RU/EN va premium tish renderlarini saqla. Hozir backend, haqiqiy email-kod, global stomatolog bazasi yoki klinik booking yo‘q. GitHub Pages oxirgi foydalanuvchi tekshiruvida 404 qaytargan; ishlayotgan live demo deb taqdim etma.

## Mahsulot maqsadi

Bu butun dunyodagi stomatologlar va klinikalarni bemorlar bilan bog‘laydigan, ustoz/talaba amaliy ta’limi va forumga ega platforma bo‘ladi. Interfeys avval UZ/RU/EN; ro‘yxatdan o‘tishda barcha mamlakatlar bo‘lishi kerak. Emailga bir martalik kod, kasbiy tasdiq, klinika xaritasi, profil ijtimoiy havolalari, izohli forum va keyinchalik audio tarjima kerak. Aniq talablar va bosqichlar `PRODUCT_VISION.md`da. Forensic LabGuide alohida loyiha; bu repo ichida uning kodini yaratma.

## Hozir kodlanadigan birinchi bosqich

Mavjud mobil dizaynni saqlagan holda **global qidiruvning bitta to‘liq demo oqimi**ni qur:

1. Hozirgi katta `src/main.tsx`dan shu oqimga kerakli komponent va typed model/repository interfeyslarini ajrat. Mamlakat, shahar, klinika va stomatologni alohida modellashtir. Bitta stomatolog bir necha klinikada ishlay olsin. Demo yozuvlari aniq “namuna” deb belgilanadi.
2. Barcha mamlakatni tanlash, shaharni qo‘lda kiritish/tanlash, UZ/RU/EN tilini saqlash va bemor/stomatolog/ustoz/talaba rolini ko‘rsatish ishlasin. Bir email hisobi keyinchalik ko‘p rol olishi mumkinligini modelda hisobga ol.
3. Stomatolog qidiruvi profil, ixtisos, mamlakat, shahar va til bo‘yicha ishlasin. **Beshta to‘liq namunaviy stomatolog profili** bo‘lsin: turli mamlakat/shahar, ixtisos va ish tillari ko‘rinsin; UZ, RU, EN interfeyslarida har bir profilning sarlavha, bio, xizmat va tushuntirish matnlari tanlangan tilga mos chiqsin. Ism, klinika nomi va geografik nomlar asossiz tarjima qilinmasin. Profil sahifasida foto/avatar, ixtisos, ish tillari, tajriba, klinika va manzil, jadval, xizmatlar hamda narx birligi, qisqa bio va tegishli aloqa maydonlari to‘liq ko‘rinsin. Telefon, Telegram, WhatsApp, Instagram va sayt ixtiyoriy bo‘lsin; ikonlar va noto‘g‘ri URL/telefon tekshiruvi bo‘lsin. Demo profil uchun haqiqiy odamning telefon/ijtimoiy manzilini o‘ylab topma; soxta aloqa tugmasini ishlaydigan aloqa deb ko‘rsatma. Har kartada “Namuna profil” belgisi bo‘lsin. Bemor shifokorni saqlab, keyin “Saqlanganlar”dan qayta ochsin. “Tasdiqlangan stomatolog” belgisi demo profilga asossiz berilmasin.
   - Profilning aloqa qismi foydalanuvchi yuborgan namunadek bir qatorda yoki telefonda moslashuvchan gridda yirik, yumaloq **o‘z logosi bilan** ikon-tugmalar bo‘lsin: Qo‘ng‘iroq, Telegram, Instagram, Email, Xarita, Raqamli vizitka; WhatsApp yoki sayt mavjud bo‘lsa qo‘shilsin. Har ikon ostida tanlangan tildagi nomi yozilsin, ranglari Dental Expert premium uslubiga mos bo‘lsin. “Kuzatish”, QR va ulashish amallari ham profil tepasida aniq joylashsin. Raqamli vizitka — profilni ulashish/QR, to‘lov kartasi emas. Faqat mavjud va tekshirilgan kontaktlar bosiladigan bo‘lsin; demo profilning soxta kontaktlari faol tashqi havolaga olib bormasin. QR/ulashish ichidagi manzil foydalanuvchiga haqiqatan ochilmasa, uni ishlaydigan deb ko‘rsatma.
   - Profil egasi o‘z suratini yuklay/yangilay/olib tashlay olsin; klinika egasi esa klinika logotipini alohida yuklay olsin. Shifokor fotosurati va klinika logotipi turli maydonlar bo‘lsin. Yuklashdan oldin crop/preview, kvadrat ko‘rinish va oddiy placeholder; format/hajm tekshiruvi bo‘lsin. Birinchi bosqichda backend media xizmati yo‘q bo‘lsa, buni faqat lokal demo preview deb aniq belgilagin va qayta ochilganda serverda saqlangan deb ko‘rsatma. Foto yoki logo professional tasdiq belgisi o‘rnini bosmaydi.
4. “Yaqin stomatologlar” bosilgandagina geolokatsiya ruxsatini so‘ra. Ruxsat rad qilinsa yoki joylashuv aniqlanmasa, qo‘lda tanlangan shahar bo‘yicha qidiruv ishlasin. Demo klinikalarni xaritada ko‘rsat; real global qamrovni da’vo qilma.
5. Email-kodli ro‘yxatdan o‘tish oqimi uchun frontend va `AuthGateway` interfeysini tayyorla. Haqiqiy email yuborish, kod muddati, rate limit va sessiya uchun server/auth provayder kerakligini aniq ko‘rsat. Provider va credentials hali yo‘q bo‘lsa, “kod yuborildi” deb yolg‘on xabar ko‘rsatma. Keyingi bosqich uchun integratsiya nuqtasini va kerakli tashqi konfiguratsiyani hujjatlashtir.

Bir sessiyaga sig‘adigan eng kichik to‘liq bo‘lakni tanla, lekin faqat statik maket yoki reja bilan to‘xtama. Yangi xarita/ISO mamlakat kutubxonasi kerak bo‘lsa, ishlatish shartlari va hajmini ko‘rib tanla. Oldingi `PremiumTurntable.tsx` to‘rtta tasvirdan iborat; uni uzluksiz 3D deb atama yoki eski GLB drafti bilan almashtirma.

## Qabul mezonlari

- Telefon o‘lchamida mamlakat/shahar tanlash → beshta namunaviy stomatologni filtrlash → to‘liq profil va klinika xaritasini ochish → shifokorni saqlab qayta topish oqimi bosib ishlaydi. Til o‘zgarganda profil matnlari ham o‘zgaradi; ism va joy nomlari saqlanadi. “Yaqin” bosilganda ruxsat so‘raladi; rad etilganda qo‘lda qidiruv ishlaydi.
- UZ/RU/EN matnlari va mavjud 19 ekran buzilmaydi. Demo ma’lumot va haqiqiy xizmat farqi foydalanuvchiga tushunarli.
- `npm run build` o‘tadi; yangi oqim uchun mazmunli browser testi qo‘shiladi. Frontend o‘zgarsa `python tools/package.py` bilan offline demo va haqiqiy screenshotlar yangilanadi, `PROTOTYPE_HTML=demo.html python tools/verify.py` ishlatiladi.
- README’da bajarilgan qismi, keyingi server/auth talablari va ishlamaydigan integratsiyalar aniq yoziladi. Natijani commit qil. Tekshirilmagan GitHub Pages yoki email yuborishni ishlaydi deb yozma.

## Keyingi bosqichlar

1. Haqiqiy email-kodli auth, ko‘p rolli huquqlar, server baza va global geo-qidiruv; kasbiy litsenziya tekshiruvi. Provider/hosting va hisob sozlamalari foydalanuvchi bilan aniqlanadi.
2. Ustoz/talaba uchun guruh kodi → amaliy ish → ustoz izohi → tasdiq → ko‘nikma portfeli. `PRODUCT_VISION.md`dagi Case Studio’dan bitta namunaviy stomatologik holat bilan boshlagin. Faqat test/kunlik savolga aylantirma; hozirgi to‘rt tasvirli aylantirgichni haqiqiy 3D model deb ko‘rsatma.
3. Moderatsiyali forum, post va izohlar, UZ/RU/EN matn tarjimasi; so‘ng foydalanuvchi boshlaydigan audio tarjima.
4. Haqiqiy qabul jadvali va boshqa klinik xizmatlar; so‘ng PWA yoki native iOS/Android tarqatish qarori. Bir xil sifat va huquqlar barcha rollarda tekshirilmaguncha “mukammal ilova” deb taqdim etma.
