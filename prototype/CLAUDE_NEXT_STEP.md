# Claude Code uchun navbatdagi ish — Dental Expert

Ertangi sessiyada Claude Code'ga shuni yozing: **“`prototype/CLAUDE_NEXT_STEP.md` va `prototype/PRODUCT_VISION.md`ni o‘qi. Birinchi bosqichni faqat reja bilan emas, ishlaydigan kod va test bilan yakunla.”**

## Avval holatni tekshir

Repository `davlatsudekspert/DentalExpert`, `main`; ilova `prototype/`da. `README.md`, `DESIGN_HANDOFF.md`, `PRODUCT_VISION.md` va `CLAUDE_START_HERE.md`ni o‘qi. `npm run build` va `npm run dev` bilan mavjud React + TypeScript + Vite prototipini tekshir. 19 ekran, UZ/RU/EN va premium tish renderlarini saqla. Hozir backend, haqiqiy email-kod, global stomatolog bazasi yoki klinik booking yo‘q. GitHub Pages oxirgi foydalanuvchi tekshiruvida 404 qaytargan; ishlayotgan live demo deb taqdim etma.

## Mahsulot maqsadi

Bu butun dunyodagi stomatologlar va klinikalarni bemorlar bilan bog‘laydigan, ustoz/talaba amaliy ta’limi va forumga ega platforma bo‘ladi. Interfeys avval UZ/RU/EN; ro‘yxatdan o‘tishda barcha mamlakatlar bo‘lishi kerak. Emailga bir martalik kod, kasbiy tasdiq, klinika xaritasi, profil ijtimoiy havolalari, izohli forum va keyinchalik audio tarjima kerak. Aniq talablar va bosqichlar `PRODUCT_VISION.md`da. Forensic LabGuide alohida loyiha; bu repo ichida uning kodini yaratma.

## Hozir kodlanadigan birinchi bosqich

Mavjud mobil dizaynni saqlagan holda **global qidiruvning bitta to‘liq demo oqimi**ni qur:

1. Hozirgi katta `src/main.tsx`dan shu oqimga kerakli komponent va typed model/repository interfeyslarini ajrat. Mamlakat, shahar, klinika va stomatologni alohida modellashtir. Bitta stomatolog bir necha klinikada ishlay olsin. Demo yozuvlari aniq “namuna” deb belgilanadi.
2. Barcha mamlakatni tanlash, shaharni qo‘lda kiritish/tanlash, UZ/RU/EN tilini saqlash va bemor/stomatolog/ustoz/talaba rolini ko‘rsatish ishlasin. Bir email hisobi keyinchalik ko‘p rol olishi mumkinligini modelda hisobga ol.
3. Stomatolog qidiruvi profil, ixtisos, mamlakat, shahar va til bo‘yicha ishlasin. Profil sahifasida telefon, Telegram, WhatsApp, Instagram va sayt uchun ixtiyoriy maydonlar va tegishli ikonlar bo‘lsin; noto‘g‘ri URL/telefonni tekshir. Bemor shifokorni saqlab, keyin “Saqlanganlar”dan qayta ochsin. “Tasdiqlangan stomatolog” belgisi demo profilga asossiz berilmasin.
4. “Yaqin stomatologlar” bosilgandagina geolokatsiya ruxsatini so‘ra. Ruxsat rad qilinsa yoki joylashuv aniqlanmasa, qo‘lda tanlangan shahar bo‘yicha qidiruv ishlasin. Demo klinikalarni xaritada ko‘rsat; real global qamrovni da’vo qilma.
5. Email-kodli ro‘yxatdan o‘tish oqimi uchun frontend va `AuthGateway` interfeysini tayyorla. Haqiqiy email yuborish, kod muddati, rate limit va sessiya uchun server/auth provayder kerakligini aniq ko‘rsat. Provider va credentials hali yo‘q bo‘lsa, “kod yuborildi” deb yolg‘on xabar ko‘rsatma. Keyingi bosqich uchun integratsiya nuqtasini va kerakli tashqi konfiguratsiyani hujjatlashtir.

Bir sessiyaga sig‘adigan eng kichik to‘liq bo‘lakni tanla, lekin faqat statik maket yoki reja bilan to‘xtama. Yangi xarita/ISO mamlakat kutubxonasi kerak bo‘lsa, ishlatish shartlari va hajmini ko‘rib tanla. Oldingi `PremiumTurntable.tsx` to‘rtta tasvirdan iborat; uni uzluksiz 3D deb atama yoki eski GLB drafti bilan almashtirma.

## Qabul mezonlari

- Telefon o‘lchamida mamlakat/shahar tanlash → stomatologlarni filtrlash → profil va klinika xaritasini ochish → shifokorni saqlab qayta topish oqimi bosib ishlaydi. “Yaqin” bosilganda ruxsat so‘raladi; rad etilganda qo‘lda qidiruv ishlaydi.
- UZ/RU/EN matnlari va mavjud 19 ekran buzilmaydi. Demo ma’lumot va haqiqiy xizmat farqi foydalanuvchiga tushunarli.
- `npm run build` o‘tadi; yangi oqim uchun mazmunli browser testi qo‘shiladi. Frontend o‘zgarsa `python tools/package.py` bilan offline demo va haqiqiy screenshotlar yangilanadi, `PROTOTYPE_HTML=demo.html python tools/verify.py` ishlatiladi.
- README’da bajarilgan qismi, keyingi server/auth talablari va ishlamaydigan integratsiyalar aniq yoziladi. Natijani commit qil. Tekshirilmagan GitHub Pages yoki email yuborishni ishlaydi deb yozma.

## Keyingi bosqichlar

1. Haqiqiy email-kodli auth, ko‘p rolli huquqlar, server baza va global geo-qidiruv; kasbiy litsenziya tekshiruvi. Provider/hosting va hisob sozlamalari foydalanuvchi bilan aniqlanadi.
2. Ustoz/talaba uchun guruh kodi → amaliy ish → ustoz izohi → tasdiq → ko‘nikma portfeli. Faqat test/kunlik savolga aylantirma.
3. Moderatsiyali forum, post va izohlar, UZ/RU/EN matn tarjimasi; so‘ng foydalanuvchi boshlaydigan audio tarjima.
4. Haqiqiy qabul jadvali va boshqa klinik xizmatlar; so‘ng PWA yoki native iOS/Android tarqatish qarori. Bir xil sifat va huquqlar barcha rollarda tekshirilmaguncha “mukammal ilova” deb taqdim etma.
