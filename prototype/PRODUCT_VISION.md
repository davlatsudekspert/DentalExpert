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

## Kasbiy ta’lim kutubxonasi

Ustoz, talaba va stomatolog uchun bitta tartibli o‘quv bo‘limi bo‘lsin: mavzu va mutaxassislik bo‘yicha qidiriladigan qo‘llanmalar, rasmlar bilan darslar, PPTX taqdimotlar va qisqa testlar. Ustoz materialni guruhga biriktiradi, amaliy holat va test beradi, talabaning sababli javobi hamda ishiga izoh yozadi. Talaba o‘qigan materialini davom ettiradi, topshiriqni qayta ishlaydi va ko‘nikma portfelida natijani ko‘radi. Amaldagi stomatolog ham materiallardan malaka oshirish va kasbiy muhokama uchun foydalanadi. Test bilimni tekshirishga yordam beradi, ammo ilovaning asosiy qiziqarli tajribasi rasmli klinik holatni tahlil qilish va ustoz/hamkasb fikridir.

PPTX uchun kamida fayl nomi, muallif, til, mavzu, tavsif, hajm va ochish/yuklab olish amali ko‘rinsin; telefonda qulay ko‘rish usuli tanlansin. Haqiqiy fayl saqlash va taqdimotni slaydga aylantirish server yoki mos xizmat talab qilsa, demo buni haqiqiy yuklash deb ko‘rsatmasin. Mualliflik huquqi va manba, tibbiy kontentning ekspert ko‘rigi, foydalanuvchi rollari bo‘yicha ko‘rish/yuklash ruxsati, bemor tasvirlarini shaxssizlantirish va test savollarining tibbiy aniqligi tekshirilsin. Sertifikat yoki chegirma faqat aniq mezon va haqiqiy beruvchi mavjud bo‘lganda va’da qilinsin.

O‘quv kontenti uchun o‘zbek va xorijiy stomatologik adabiyotlar, ochiq klinik qo‘llanmalar va ishonchli ilmiy manbalardan foydalan. Har dars, test savoli, klinik izoh va taqdimotda tekshiriladigan havola bo‘lsin: muallif/tashkilot, asar nomi, nashr yoki yil, til, tegishli bob/bo‘lim va **aynan tekshirilgan nashrdagi bet raqami** (elektron sahifa o‘zgarsa barqaror bo‘lim, DOI yoki URL). Qaysi fikr qaysi manbaga tayanganini materialning o‘sha joyida ko‘rsat, oxirida foydalanilgan adabiyotlar ro‘yxatini ber. Manbani yoki betni taxmin qilib yozma; topilmasa “beti tasdiqlanmagan” deb belgilab, o‘sha da’voni nashrdan oldin tekshir. Tarjima matnning asl ma’nosini saqlasin, asl til va nashr ko‘rinsin. Kitob sahifalari, rasmlar yoki PPTXni to‘liq ko‘chirishdan oldin foydalanish huquqini tekshir; kerak bo‘lsa o‘z so‘zing bilan qisqa izoh va manbaga havola ber. Klinik mazmunni malakali stomatolog ko‘rib chiqmaguncha tasdiqlangan tibbiy tavsiya sifatida chiqarmagin.

Shifokor bir necha klinikada ishlashi mumkin; xaritada klinika manzili va shifokorning shu manzildagi faoliyati alohida modellansin. Profilga telefon, Telegram, WhatsApp, Instagram, sayt va boshqa mos ijtimoiy havolalar logotipi bilan qo‘shilsin. Aloqa maydonlari ixtiyoriy, havolalar tekshiriladi va qaysisi ommaga ko‘rinishini egasi tanlaydi. Professional tasdiq mamlakatga qarab hujjat va inson tekshiruvi bilan yuritiladi; tasdiqlanmagan profilni tasdiqlangan shifokor sifatida ko‘rsatma.

Aloqa tugmalari profilda ko‘rinadigan, brend ikonli va yozuvli bo‘lsin: qo‘ng‘iroq, Telegram, Instagram, email, xarita va raqamli vizitka (profil QR/ulashish). WhatsApp va sayt mavjud bo‘lsa qo‘shiladi. “Kuzatish” va ulashish alohida amallar. QR yoki vizitka to‘lov kartasi sifatida talqin qilinmasin. Bosiladigan tashqi havolalar tekshirilsin; demo profilning o‘ylab topilgan kontaktlari ishlaydigan deb ko‘rsatilmasin.

Profil rasmi foydalanuvchi tomonidan yuklanadi: mutaxassis o‘z fotosuratini, klinika egasi klinikaning firma logotipini qo‘yadi. Bular alohida identifikator va joylarda ko‘rsatiladi, profil egasi ularni almashtirishi yoki olib tashlashi mumkin. Format/hajm tekshiruvi, kesishdan oldin ko‘rish va rasm yo‘q holatida sifatli placeholder bo‘lsin. Yuklangan rasm kasbiy litsenziya tasdig‘i emas.

Boshlang‘ich demoda kamida yettita **namunaviy, to‘liq tasvirlangan** stomatolog profili bo‘lsin: uchtasi Andijonda, uchtasi Farg‘onada va kamida bittasi boshqa mamlakatda. Turli mamlakat, shahar, ixtisos va ish tillari orqali qidiruvni ko‘rsatadi. Profilning izohli matnlari UZ/RU/EN interfeysiga moslashadi; odam ismi va joy nomi o‘zgarmaydi. “100% to‘liq” degani bemorga qaror qilish uchun kerakli ma’lumotlar borligini anglatadi; ixtiyoriy ijtimoiy tarmoq maydonini sun’iy ma’lumot bilan to‘ldirish shart emas. Barcha demo profillar aniq belgilansin, haqiqiy reyting, litsenziya yoki aloqa ekanini da’vo qilmasin.

## Asosiy sahifadagi homiylik joylari

Bemorning Asosiy sahifasida tanlangan **har bir shahar uchun alohida 3 ta homiylik joyi** bo‘lsin. Andijon tanlansa Andijondagi, Farg‘ona tanlansa Farg‘onadagi reklama beruvchilar chiqadi; boshqa shahar homiysi aralashmaydi. Telefon ekranida uch karta gorizontal suriladigan premium blokda ko‘rinsin. Har bir kartada ko‘zga ko‘rinadigan “Reklama” / “Реклама” / “Sponsored” belgisi, shifokor fotosurati, ixtisosi, klinika/shahar va profilga o‘tish amali bo‘lsin. Reklamadan keyin oddiy qidiruv va tavsiya natijalari ko‘rinsin; to‘lov reyting, klinik malaka yoki “tasdiqlangan” belgisini sotib olmaydi.

Joylashtirish foydalanuvchi **qo‘lda tanlagan** lokatsiyaga ishlasin; aniq GPS faqat “Yaqinlar” amali uchun ruxsat bilan ishlatiladi. Kalit sifatida shahar nomining matni emas, mamlakat va shahar identifikatori ishlatilsin (bir xil nomli shaharlarga reklama aralashmasin). Har shaharda reklama beruvchilar soni 3 tadan ko‘p bo‘lishi mumkin: ekranda ko‘pi bilan 3 ta chiqadi, qolgan faol kampaniyalar belgilangan muddat va adolatli navbat bo‘yicha aylanadi. Shu shaharda 3 tadan kam haqiqiy homiy bo‘lsa faqat borlari chiqsin; bo‘sh joyni “Reklama” deb soxta to‘ldirma va boshqa shaharning reklamasini qo‘shma. Reklama beruvchi real shifokor/profil, faol klinika va tekshirilgan kasbiy huquqqa ega bo‘lsin. Bir odamga qayta-qayta bitta reklama ko‘rsatishni cheklash mumkin. Narx, muddat, hudud, ko‘rish/bosish hisobi va bekor qilish qayd etilsin, lekin to‘lov hamda hisobot **serverda** tekshirilsin. Dastlabki prototipda Andijon va Farg‘ona uchun har biriga uchtadan aniq “Namuna reklama” kartasi bo‘lsin; haqiqiy to‘lov yoki homiylik bor deb ko‘rsatma.

## Hamjamiyat va tarjima

- Forum/hamjamiyatda mavzu, post, izoh, javob, qidiruv, mutaxassislik bo‘yicha bo‘limlar, shikoyat qilish va moderatsiya bo‘lsin. Bemor savollari, stomatologlar professional munozarasi va yopiq o‘quv guruhlari huquq bilan ajratilsin.
- Post yoki izoh yozishdan oldin aniq qoidalar va ogohlantirish ko‘rsatiladi: faqat stomatologiya va kasbiy ta’lim mavzulari; diniy/siyosiy targ‘ibot, pornografik mazmun, haqorat, reklama va bemorni tanitadigan ma’lumotlar joylanmaydi. Mavzu bo‘limi tanlanadi; shikoyat sababi, moderator ko‘rib chiqishi, ogohlantirish, yashirish/o‘chirish va takroriy qoidabuzarlik uchun cheklov serverda yuritiladi. Frontenddagi oddiy so‘z filtri yakuniy moderatsiya emas, noto‘g‘ri rad etish va aylanib o‘tish ehtimoli bor.
- Har postning asl tili saqlansin. UZ/RU/EN matn tarjimasi foydalanuvchi xohlaganda ko‘rsatilsin; original matn doim ochiq bo‘lsin.
- **Audio tarjima mumkin**: ovoz → matn → tarjima → ovoz. Bu keyingi bosqich; faqat foydalanuvchi bosganda ishlasin, yozib olish/saqlash haqida aniq rozilik va narx nazorati bo‘lsin. Tibbiy ma’nosi o‘zgarmasligi uchun muhim klinik ma’lumotda asl matn yoki audio ham ko‘rinsin.

## Odamlar nima uchun qaytib kiradi

Ilova hamma rolga bitta umumiy lenta yoki faqat ball berish orqali qiziqarli bo‘lib qolmaydi. Kirishda rol, til, mamlakat/shahar va qiziqish bo‘yicha foydali bosh sahifa ochilsin. Har qaytishda odam o‘zi boshlagan ishni davom ettira olsin.

Mobil pastki navigatsiyada beshta aniq yo‘nalish bo‘lsin: Asosiy, Qidiruv, markazda ajralib turadigan 3D atlas, O‘rganish va Profil. Ko‘proq kontent ko‘rish uchun pastga aylantirganda panel ixchamlashadi, yuqoriga qaytganda yozuvlari yana ochiladi; tugmalarni bosish va ekran o‘quvchisi orqali boshqarish saqlanadi. Hozirgi demo 3D atlasga olib boradi; keyingi Case Studio yoki boshqa rolga mos asosiy ishga o‘tish faqat shu oqim haqiqatda qurilgandan keyin hal qilinadi.

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
   Shu bosqichda ustoz, talaba va stomatolog uchun qo‘llanma, rasmli dars, PPTX taqdimot va yordamchi test kutubxonasining birinchi ishlaydigan oqimini ham qur; avval bitta mavzu va ruxsatli namunaviy materialdan boshlagin.
3. **Hamjamiyat:** forum, izohlar, moderatsiya va matn tarjimasi.
4. **Xizmatlar:** qabul jadvali va tasdiq, xabarlar, audio tarjima va keyingi integratsiyalar.
5. **Mobil tarqatish:** ishlaydigan web oqimlari va backend tasdiqlangach PWA yoki native iOS/Android yo‘li tanlansin. Apple/Google orqali kirish tugmalari do‘kon talabi degani emas; bu yerda App Store/Google Play maxfiylik, Data safety/App Privacy, hisobni o‘chirish, ruxsat, tibbiy mazmun va forum moderatsiyasi talablari nazarda tutiladi. Aniq chiqarish mezonlari [`STORE_RELEASE_REQUIREMENTS.md`](STORE_RELEASE_REQUIREMENTS.md)da. Ilovani “butun dunyoda ishlaydi” deb atashdan oldin real email, geografik qidiruv, kasbiy tasdiq, xavfsizlik va xalqaro ish yuklamasi tekshirilsin.

## Birinchi Claude sessiyasining natijasi

[`CLAUDE_NEXT_STEP.md`](CLAUDE_NEXT_STEP.md) birinchi kodlash vazifasini belgilaydi. Dizayn prototipi va global mahsulotni chalkashtirmaslik, ishlamagan integratsiyani ishlaydi deb yozmaslik va har bir bosqichni brauzerda tekshirish shart.
