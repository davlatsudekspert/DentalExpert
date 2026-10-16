# Claude Code uchun navbatdagi ish — Dental Expert

Bu faylni ertangi sessiyada Claude Code'ga bering: **“`prototype/CLAUDE_NEXT_STEP.md`ni o‘qi va undagi birinchi bosqichni kod bilan yakunla.”** Ishni faqat reja yoki yangi maket bilan tugatma.

## Hozirgi holat

- Repository: `davlatsudekspert/DentalExpert`, `main`; ilova kodi `prototype/`da.
- React + TypeScript + Vite asosidagi 19 ekranli, UZ/RU/EN tilidagi **UI/UX demo** bor. Backend, haqiqiy hisob, klinik booking, to‘lov va bemor bazasi hali yo‘q.
- Bu hozir brauzer ilovasi; iOS/Android do‘konlari uchun native ilova yoki PWA yo‘nalishi hali tanlanmagan. Birinchi bosqichni mavjud React kodida tugat, platforma almashtirishni hozir boshlama.
- Premium tish renderlari ishlatiladi. `PremiumTurntable.tsx` to‘rtta rakursli vizual prototip; uzluksiz 3D mesh emas. Eski `Tooth3D.tsx` va GLB draftini premium ko‘rinish o‘rniga qo‘yma.
- GitHub Pages sozlash workflow'i bor, lekin `github.io` sahifasi oxirgi foydalanuvchi tekshiruvida **404** qaytargan. Uni ishlaydi deb da’vo qilma. `demo.html` lokal brauzerda ishlaydi.
- `README.md`, `DESIGN_HANDOFF.md` va `CLAUDE_START_HERE.md`ni o‘qi. Mavjud ekranlar va vizual sifatni saqla.

## Mahsulot yo‘nalishi

Dental Expert’da bemor/stomatolog oqimlari bilan birga ustoz/talaba ta’lim oqimi bo‘ladi. Foydalanuvchi ta’limni faqat test yoki kunlik savolga aylantirishni xohlamaydi. Talaba **amaliy ish** topshiradi, ustoz jarayon va natijaga fikr beradi, tasdiqlangan ishlar talabaning ko‘nikma portfelida saqlanadi. Forensic LabGuide’da ham o‘xshash ustoz/talaba modeli ko‘zda tutilgan, lekin u alohida repository: uning kodiga bu taskda tegma va ikki ilovaning ma’lumotlarini avtomatik birlashtirma.

## Birinchi kodlash bosqichi: bitta to‘liq amaliy ish oqimi

1. Mavjud demo ichida ustoz va talaba ekranlariga haqiqiy navigatsiya qo‘sh. Ustoz demo guruh ochadi; talaba guruh kodini kiritib unga qo‘shiladi. Bir sessiyada rolni almashtirib, ikki tomondagi natijani tekshirish mumkin bo‘lsin.
2. Ustoz **bitta namunaviy stomatologik amaliy topshiriq** yaratadi: tish yoki rentgen rasmi, vaziyat tavsifi, bajarish bosqichlari va baholash mezonlari. Real bemor ma’lumotlarini qo‘shma.
3. Talaba rasmda muhim joylarni belgilab, qisqa amaliy reja yozadi; qoralamani saqlab, so‘ng ustozga topshiradi. Bu ko‘p variantli savol-javob bo‘lmasin.
4. Ustoz topshirilgan ishni, belgilangan nuqtalarni va rejani ko‘radi; izoh yozadi va holatini “qayta ishlash kerak / qabul qilindi” deb belgilaydi. Talaba izohni ko‘rib ishini yangilay olsin. Qabul qilingan ish portfelda ko‘rinsin.
5. Demo ma’lumotlari brauzerda yangilashdan keyin ham saqlansin. LocalStorage yoki IndexedDB uchun aniq typed data model va repository interfeysi ishlat; buni haqiqiy login yoki server xavfsizligi deb ko‘rsatma. Keyingi backendga almashtirish mumkin bo‘lsin.

Avval mavjud `src/main.tsx` va CSSdagi ekranlarni kichik komponentlarga ajratib, faqat shu oqimga kerakli qismini tartibga sol. UZ/RU/EN matnlarini saqla. Telefon ekranida mavjud premium dizaynni buzma. Yangi kutubxonani faqat aniq ehtiyoj bo‘lsa qo‘sh.

## Qabul mezonlari

- Ustoz guruh yaratadi → talaba kod bilan qo‘shiladi → ustoz topshiriq beradi → talaba rasmni belgilab ish topshiradi → ustoz fikr bildiradi → talaba portfelda natijani ko‘radi. Bu zanjir brauzerda bosib ishlaydi.
- Yangilashdan keyin demo holatlari saqlanadi; rol almashganda boshqa rolning ma’lumotlari ko‘rinadi. Xatolik va bo‘sh holatlar tushunarli ko‘rsatiladi.
- `npm run build` va mavjud `PROTOTYPE_HTML=demo.html python tools/verify.py` tekshiruvlari o‘tadi. Dependency yo‘q yoki lockfile o‘zgargan bo‘lsa, avval lockfile bo‘yicha qayta o‘rnat. Yangi oqim uchun **bitta mazmunli end-to-end test** yoz va ustoz hamda talaba rollari o‘rtasidagi almashuvni tekshir. `python tools/package.py` bilan offline demo va haqiqiy frontend screenshotlarini yangila.
- Ish yakunida qanday ekranlar qo‘shilganini, qaysi ma’lumot faqat lokal ekanini va keyingi bosqich uchun qolgan qarorlarni README’da yoz. Natijani commit qil. Saytga joylanganini alohida tekshirmasdan “live” deb yozma.

## Keyingi bosqichlar — birinchisi tugagach

1. Haqiqiy autentifikatsiya, ustoz-guruh-talaba huquqlari, server bazasi va fayl saqlash. Texnologiyani mavjud talablar va hosting qaroriga qarab tanla; hozirdan tasodifiy backend tanlab qo‘yma.
2. Bemor/stomatolog oqimlarini backendga ulash: profil, klinika, jadval va qabulni alohida bosqichlarda tekshirish.
3. Ta’lim portfeli uchun ko‘nikma mezonlari va ustoz tasdig‘i. Testlar yordamchi bo‘lishi mumkin, lekin asosiy o‘quv tajribasi amaliy ish bo‘lsin.
4. Premium uzluksiz 3D tish modeli faqat bir-biriga mos, tahrirlanadigan va foydalanish huquqi aniq bo‘lgan asset tayyorlangach. To‘rtta rasmni haqiqiy 3D deb atama.
5. Ustoz/talaba oqimi va bemor/stomatolog xizmatlari ishlagach, foydalanuvchi bilan PWA yoki native iOS/Android tarqatish yo‘lini tanla.

Birinchi bosqichni tugatish uchun mutlaqo kerak bo‘lmagan mahsulot qarorlarini o‘zing oqilona tanla; haqiqiy server, klinik ma’lumot yoki to‘lovga o‘tish oldidan foydalanuvchining talablarini aniqlashtir.
