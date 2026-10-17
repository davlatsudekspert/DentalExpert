# Claude Code — Dental Expert: keyingi ish

Claude'ga yuboriladigan qisqa prompt:

> `davlatsudekspert/DentalExpert` reposining `main` tarmog‘ini yangilab, `prototype/CLAUDE_NEXT_STEP.md`, `PRODUCT_VISION.md`, `MONETIZATION_PLAN.md`, `EDUCATION_PLAN.md`, `SOURCE_REGISTER.md` va `STORE_RELEASE_REQUIREMENTS.md`ni o‘qi. Mavjud premium tish rasmlari va UZ/RU/EN prototipini saqla. `prototype`dagi ishlaydigan shahar qidiruvi, Andijon/Farg‘ona/Toshkent/Dubay reklamalari, 16 demo profil, rasmli dars/test/PPTX/Case Studio oqimidan davom et. Avval mavjud kod va testni tekshir; keyin eng foydali bitta to‘liq real oqimni kodla va test qil. O‘zbek va xorijiy stomatologik manbalarning litsenziyasi, nashri, aniq bo‘lim/betini tekshir; tasdiqlanmaganini iqtibos qilma va tibbiy kontentni mutaxassis tasdig‘isiz klinik ma’lumot deb ko‘rsatma. Kerakli skill va vositadan foydalangin, takroriy generatsiya va qidiruv bilan limit sarflama. Yakunda nima haqiqatan ishlashini, tekshiruv natijasini va qolgan backend yoki manba cheklovlarini aniq ayt.

## Hozirgi holat

- React + TypeScript + Vite, 27 demo ekran, `prototype/demo.html` oflayn nusxa. `npm ci`, `npm run build`, `python tools/package.py`, `PROTOTYPE_HTML=demo.html python tools/verify.py`.
- Patient Home va Search: ISO mamlakat tanlash, Andijon/Farg‘ona/Toshkent/Dubay demo shaharlari, boshqa mamlakat uchun shaharni qo‘lda yozish, shaharga mos shifokorlar. To‘rtta demo shaharning har birida 4 tadan **namuna reklama**; boshqa shaharga sun’iy reklama qo‘yilmaydi. 16 ta demo profil, local Saved, profil/klinika/booking demo.
- Ustoz/talaba: namunaviy haftalik jadval, foydalanuvchi yuborgan kesim tasviridan rasmli dars, 3 savollik vizual test, o‘zbekcha PPTX, yozma amaliy ish, namunaviy ustoz izohi va qayta ishlash. Tashqi darslik nashri/beti hali tasdiqlanmagan; bu klinik o‘quv materiali emas. Barcha matn UZ/RU/EN; PPTX hozir faqat o‘zbekcha.
- Premium tasvirlar `assets/tooth3d/`da. `PremiumTurntable` 4 diskret suratni aylantiradi; uzluksiz 3D mesh deb atama. Eski GLB va protsedurali tish draftini qayta ishlatma.
- Backend, email-kod yuborish, global shifokor bazasi, geolokatsiya, real to‘lov/reklama, ustozga ish yuborish, tasdiqlangan adabiyotlar va rasmiy sertifikat hali yo‘q. GitHub Pages oxirgi tekshiruvda 404 edi; ishlayotgan live havola deb va’da berma.

## Keyingi bosqichning ustuvorligi

1. Source registerdagi nomzod manbalarni rasmiy yoki ruxsatli nashrdan ochib tekshir. O‘zbek va chet el darsliklari uchun to‘liq bibliografiya, nashr, bo‘lim/bet, URL/DOI, foydalanish huquqi va tekshirgan sana yoz. Klinik da’volarni malakali stomatolog ko‘rib chiqmaguncha demo deb belgilashda davom et. Rasmli dars/PPTX/test javoblariga faqat tasdiqlangan manbalarni bog‘la; uydirma bet yozma.
2. Darsni fan/muassasa/o‘quv rejasiga mos typed modelga ajrat; ustozning guruh va topshiriq yaratishi, talabaning ishlashi, izoh/qayta yuborish hamda portfel holatini avval lokal demo oqimida yaxlit qil. Majburiy dars/test Pro devoriga tushmasin. Hozirgi namunaviy jadvalni rasmiy dastur deb atama.
3. Global discovery uchun shifokor/klinika/mamlakat/shahar modellarini ajrat; bir shifokorning bir nechta klinikasini qo‘llab-quvvatla. Kontaktlar bo‘lsa tekshirilgan haqiqiy URL/telefon bilangina faol qil, demo odamga soxta aloqa qo‘shma. Foto va klinika logotipi alohida. Geolokatsiyani faqat “Yaqin shifokorlar” bosilganda so‘ra; rad etilganda manual shahar ishlasin.
4. Real email-kod, server bazasi, reklama/to‘lov va booking keyingi integratsiya. Provider/config bo‘lmasa jo‘natildi yoki to‘landi deb ko‘rsatma. Apple/Google do‘konlari maxfiylik talablarini ijtimoiy kirish tugmalari bilan adashtirma.

## Reklama UX qarori

Bemor asosiy sahifasida tanlangan shaharga mos, aniq belgilangan 4 ta homiylik kartasi ko‘rinsin; organik shifokorlar ro‘yxati undan keyin ham ochiq qolsin. Reklama kampaniyasini yaratish, muddat/joylashuv, to‘lov va natijani ko‘rish stomatolog yoki klinika kabinetidagi **alohida boshqaruv bo‘limi** bo‘lsin; bemor pastki navigatsiyasiga oltinchi tugma qo‘shma. Har shaharda ko‘pi bilan 5 faol homiy, 4 ko‘rinadigan joy va 1/3/6/10 kunlik kampaniya — `MONETIZATION_PLAN.md`dagi taklif, server qoidasi emas. Hozir demo haqiqiy homiylik/analitika qilmaydi.

### Global reklama oqimini haqiqiy qilish — hali bajarilmagan

Foydalanuvchi barcha hududlarda to‘rtta reklama joyini xohlaydi. Hozir **faqat 4 demo shahar** (Andijon, Farg‘ona, Toshkent, Dubay) uchun 4 tadan mahalliy namunaviy profil bor; qolgan mamlakat/shaharlarga reklama beruvchi va tasdiqlangan profil yo‘q. Dunyo bo‘yicha 4 ta haqiqiy shifokorni yoki klinikani o‘ylab topma, boshqa shahardagi profilni mahalliy deb ko‘rsatma. Keyingi real bosqichda mamlakat+shahar IDsi, tasdiqlangan shifokor/klinika, professional litsenziya holati, faol kampaniya va muddatni serverda bog‘la. To‘rt yoki undan kam tegishli faol homiy bo‘lsa faqat mavjudlarini ko‘rsat; beshinchisini adolatli navbat bilan almashtir. Bo‘sh shaharda reklama bloki o‘rnida organik qidiruv va reklama berish taklifi bo‘lishi mumkin. Bemor GPS ruxsatini faqat “Yaqin shifokorlar” amalida so‘ra; ruxsat rad etilsa qo‘lda tanlangan shahar ishlasin.

Vizual qabul mezoni: 360–430 px telefonda to‘rt karta 2×2 bo‘lib birinchi ekranda pastki navigatsiyadan yuqorida sig‘sin; UZ/RU/EN’dagi uzun ism va ixtisos matnlari kesilib, boshqa kartaga chiqib ketmasin. Surat bo‘lmagan demo profillarda hozir monogramma ishlatiladi; haqiqiy ishga tushirishda shifokor roziligi bilan olingan surat yoki klinika logotipini qo‘sh, takrorlangan/soxta portretni ishlatma. Har bir karta bosilganda aynan o‘zining tekshirilgan profili ochilsin, “Reklama” belgisi aniq qolsin, pul to‘lash kasbiy tasdiq yoki reytingni o‘zgartirmasin. Shahar almashtirish, muddati tugagan kampaniya, 5-homiy navbati, kartani bosish va reklamasiz holatni test qil.

Ishni tugatgach build va mazmunli browser testini o‘tkaz, `demo.html` va screenshotlarni yangila, aniq holatni README’da yoz. O‘z fikringdagi mahsulot yaxshilanishini qisqa asoslab taklif qil, ammo tayyor bo‘lmaganini tayyor demagin.
