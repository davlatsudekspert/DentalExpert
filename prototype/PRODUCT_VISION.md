# Dental Expert — global ilova talablari

Bu hujjat mahsulot maqsadini belgilaydi. Hozirgi `prototype/` — mobil brauzerda ishlaydigan UI/UX demo; quyidagi xizmatlar hali haqiqiy backend bilan qurilmagan. Demo ma’lumotini global xizmat deb ko‘rsatmaslik kerak.

## Asosiy maqsad

Butun dunyodagi stomatologlar, klinikalar, bemorlar, ustozlar va talabalarni bitta platformada bog‘lash. UZ, RU va EN interfeyslari birinchi kundan mavjud bo‘lsin. **Barcha mamlakatlar** ro‘yxatdan o‘tishda tanlansin; foydalanuvchi mamlakat, shahar va interfeys tilini o‘zi tanlaydi. Keyingi tillarni qo‘shishga tuzilma tayyor bo‘lsin. Bir email hisobi bir nechta rolga ega bo‘lishi mumkin, lekin har bir rolning huquqi va profili alohida boshqariladi.

## Ro‘yxatdan o‘tish va joylashuv

- Emailga bir martalik kod yuborib tasdiqlash: kodning muddati, qayta yuborish chegarasi, xato urinishlari cheklovi va sessiya boshqaruvi bo‘lsin. Haqiqiy email yuborish faqat server/auth provayder ulanganda ishlaydi; frontenddagi soxta kodni haqiqiy login deb atama.
- Mamlakat va shaharni qo‘lda tanlash mumkin bo‘lsin. Ro‘yxatdan o‘tishda aniq GPS joylashuvini majburiy so‘rama.
- Foydalanuvchi “Yaqin stomatologlar” yoki xaritani ochganda joylashuv nima uchun kerakligini aytib, shundan keyin brauzer/telefon ruxsatini so‘ra. Rad etsa, mamlakat/shahar bo‘yicha qidiruv ishlasin. Aniq koordinatani keraksiz saqlama.

## Rollar va asosiy oqimlar

| Rol | Kerakli imkoniyatlar |
| --- | --- |
| Bemor | Shifokor/klinika qidirish va filtrlash; yaqinlarni xaritada ko‘rish; profil, xizmat, til va aloqa ma’lumotlarini ko‘rish; keyin haqiqiy qabulga yozilish. |
| Stomatolog | Kasbiy profil, ixtisos, mamlakat/shahar, ish joylari, jadval, xizmatlar, tillar, aloqa kanallari; litsenziya tekshiruvi va tasdiq belgisi; hamjamiyatda qatnashish. |
| Ustoz | Guruh/kurs ochish, talabani kod bilan qo‘shish, amaliy topshiriq berish, ishni ko‘rib izoh va tasdiq berish, ko‘nikma portfelini kuzatish. |
| Talaba | Guruhga qo‘shilish, amaliy ish topshirish, ustoz izohini ko‘rish, qayta ishlash va portfelni yuritish. Test yordamchi, asosiy tajriba amaliy ish. |

Shifokor bir necha klinikada ishlashi mumkin; xaritada klinika manzili va shifokorning shu manzildagi faoliyati alohida modellansin. Profilga telefon, Telegram, WhatsApp, Instagram, sayt va boshqa mos ijtimoiy havolalar logotipi bilan qo‘shilsin. Aloqa maydonlari ixtiyoriy, havolalar tekshiriladi va qaysisi ommaga ko‘rinishini egasi tanlaydi. Professional tasdiq mamlakatga qarab hujjat va inson tekshiruvi bilan yuritiladi; tasdiqlanmagan profilni tasdiqlangan shifokor sifatida ko‘rsatma.

Boshlang‘ich demoda beshta **namunaviy, to‘liq tasvirlangan** stomatolog profili bo‘lsin. Turli mamlakat, shahar, ixtisos va ish tillari orqali qidiruvni ko‘rsatadi. Profilning izohli matnlari UZ/RU/EN interfeysiga moslashadi; odam ismi va joy nomi o‘zgarmaydi. “100% to‘liq” degani bemorga qaror qilish uchun kerakli ma’lumotlar borligini anglatadi; ixtiyoriy ijtimoiy tarmoq maydonini sun’iy ma’lumot bilan to‘ldirish shart emas. Barcha demo profillar aniq belgilansin, haqiqiy reyting, litsenziya yoki aloqa ekanini da’vo qilmasin.

## Hamjamiyat va tarjima

- Forum/hamjamiyatda mavzu, post, izoh, javob, qidiruv, mutaxassislik bo‘yicha bo‘limlar, shikoyat qilish va moderatsiya bo‘lsin. Bemor savollari, stomatologlar professional munozarasi va yopiq o‘quv guruhlari huquq bilan ajratilsin.
- Har postning asl tili saqlansin. UZ/RU/EN matn tarjimasi foydalanuvchi xohlaganda ko‘rsatilsin; original matn doim ochiq bo‘lsin.
- **Audio tarjima mumkin**: ovoz → matn → tarjima → ovoz. Bu keyingi bosqich; faqat foydalanuvchi bosganda ishlasin, yozib olish/saqlash haqida aniq rozilik va narx nazorati bo‘lsin. Tibbiy ma’nosi o‘zgarmasligi uchun muhim klinik ma’lumotda asl matn yoki audio ham ko‘rinsin.

## Odamlar nima uchun qaytib kiradi

Ilova hamma rolga bitta umumiy lenta yoki faqat ball berish orqali qiziqarli bo‘lib qolmaydi. Kirishda rol, til, mamlakat/shahar va qiziqish bo‘yicha foydali bosh sahifa ochilsin. Har qaytishda odam o‘zi boshlagan ishni davom ettira olsin.

| Foydalanuvchi | Birinchi foyda | Qaytish sababi |
| --- | --- | --- |
| Bemor | Yaqinidagi mos, tasdiqlangan stomatologni topish; profil va klinikani solishtirish. | Saqlangan shifokorlar, qabul holati, o‘zi kuzatgan mavzudagi tushunarli maslahatlar. |
| Stomatolog | Ishonchli kasbiy profil va mutaxassislik bo‘yicha topilish. | Hamkasblar bilan mazmunli munozara, yangi murojaat va o‘z profilini yangilash. |
| Ustoz | Guruhdagi talabalar ishini bitta joyda ko‘rish. | Yangi topshirilgan amaliy ishga izoh berish va o‘sishni kuzatish. |
| Talaba | Ustoz bergan real vazifani bajarish. | Ustoz fikrini ko‘rish, ishini yaxshilash va portfelini to‘ldirish. |

Hamjamiyatda mutaxassislikka oid mavzuni kuzatish, foydali postni saqlash va izohga javob olish ishlasin. Xabarnomalar faqat foydalanuvchi tanlagan mavzu, uchrashuv yoki ish holati uchun bo‘lsin; bezovta qiladigan majburiy kundalik savol va sun’iy “streak” asosiy mexanizm bo‘lmasin. Reputatsiya haqiqiy kasbiy tasdiq va foydali hissa bilan bog‘lansin. Qidiruvda pullik joylashuv bo‘lsa, reklama ekanini aniq belgilash kerak.

Forensic LabGuide ham alohida ilova sifatida shu tamoyildan foydalanadi: talaba keyingi tergov ishini davom ettirish, ustoz izohini ko‘rish va amaliy portfelini to‘ldirish uchun qaytadi. Uning kontenti, forumi va foydalanuvchi ma’lumotlari Dental Expert bilan avtomatik qo‘shilmaydi.

## Ikkala ilovaning ajralib turadigan tajribasi: Case Studio

Case Studio foydalanuvchiga bir holatni bosqichma-bosqich o‘rganish, o‘z qarorini asoslash va ustoz yoki hamkasbdan mazmunli fikr olish imkonini beradi. Bu majburiy kundalik test emas. Har holatning manbasi, muallifi, murakkabligi va zarur ogohlantirishi ko‘rsatiladi; faqat ruxsat berilgan, shaxsi aniqlanmaydigan materiallar ishlatiladi. Talabaning ishi va ustoz izohi ruxsatlari bilan yopiq qoladi; ommaga chiqarish alohida ixtiyoriy amal bo‘ladi.

| Ilova | Holatdagi asosiy amal | Qaytishga sabab |
| --- | --- | --- |
| Dental Expert | 3D tish atlasi va klinik tasvirga belgi qo‘yish, ehtimoliy tashxis va davolash yo‘llarini dalil bilan solishtirish, ustozga ish yuborish. | Ustozning aniq izohi, qayta ishlangan reja, rivojlangan ko‘nikma portfeli va ixtiyoriy kasbiy muhokama. |
| Forensic LabGuide | Hodisa materiallari va laboratoriya natijalarini vaqt chizig‘i hamda dalillar taxtasida bog‘lash, xulosa va noaniqliklarni yozish, ustozga topshirish. | Yangi dalil yoki ustoz izohi kelganda xulosani qayta ko‘rish, oldingi qarorlar bilan solishtirish va amaliy portfelni to‘ldirish. |

Ikkalasida ham ustoz kichik guruhga holat tayinlaydi, bosqichma-bosqich izoh beradi va talabaning **fikrlash jarayonini** baholaydi. To‘g‘ri javobni birdan ochib berish o‘rniga foydalanuvchi qaysi dalilga suyanganini ko‘rsatadi. Kasbiy hamjamiyat uchun alohida, moderatsiyali “holat muhokamasi” bo‘lishi mumkin; bemorga individual tashxis yoki sud-tergovga rasmiy xulosa o‘rnini bosmasligi aniq aytiladi.

Birinchi kichik mahsulot bo‘lagi: Dental Expert’da bitta ruxsatli namunaviy holatga 3D atlasda belgi qo‘yish → qaror sababini yozish → ustoz izohini ko‘rish; Forensic LabGuide’da bitta namunaviy dalillar taxtasi → vaqt chizig‘i → asoslangan xulosa → ustoz izohi. Avval shu oqimlar foydali ekanini haqiqiy ustoz va talabalar bilan tekshirish, keyin kontent kutubxonasi, tarjima va avtomatik tahlilni kengaytirish. Forensic LabGuide kodi va ma’lumotlari uning o‘z reposida yuritiladi.

## Qurish tartibi

1. **Global poydevor:** 3 til, barcha mamlakatlar, email-kodli hisob arxitekturasi, ko‘p rolli profil, stomatolog/klinika katalogi, filtr va xarita, GPSga o‘z vaqtida ruxsat so‘rash. Avval demo ma’lumot bilan aniq ishlaydigan bir oqim; keyin haqiqiy auth, baza va tasdiqlash.
2. **Ustoz/talaba:** guruh, amaliy ish, izoh, tasdiq va portfel. Bu oqim Forensic LabGuide’da ham mahsulot g‘oyasi sifatida ishlatilishi mumkin, ammo kod/baza avtomatik birlashtirilmasin.
3. **Hamjamiyat:** forum, izohlar, moderatsiya va matn tarjimasi.
4. **Xizmatlar:** qabul jadvali va tasdiq, xabarlar, audio tarjima va keyingi integratsiyalar.
5. **Mobil tarqatish:** ishlaydigan web oqimlari va backend tasdiqlangach PWA yoki native iOS/Android yo‘li tanlansin. Ilovani “butun dunyoda ishlaydi” deb atashdan oldin real email, geografik qidiruv, kasbiy tasdiq, xavfsizlik va xalqaro ish yuklamasi tekshirilsin.

## Birinchi Claude sessiyasining natijasi

[`CLAUDE_NEXT_STEP.md`](CLAUDE_NEXT_STEP.md) birinchi kodlash vazifasini belgilaydi. Dizayn prototipi va global mahsulotni chalkashtirmaslik, ishlamagan integratsiyani ishlaydi deb yozmaslik va har bir bosqichni brauzerda tekshirish shart.
