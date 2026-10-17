# Dental Expert — App Store va Google Play’ga chiqarish talablari

Bu hujjat **Apple/Google orqali kirish tugmalari haqida emas**. Maqsad — kelajakdagi haqiqiy iOS va Android ilovasini do‘konlarga topshirishdan oldin bajariladigan maxfiylik, hisob, tibbiy mazmun va forum talablarini kodlash vazifasiga aylantirish. Hozirgi React prototipi lokal demo: unda server, haqiqiy akkaunt, bemor bazasi, GPS yoki tahlil SDK’si yo‘q. Quyidagi bandlar bajarilmaguncha prototipni do‘konlarga tayyor yoki qoidalarga to‘liq mos deb atamang.

## Avval real ma’lumotlar xaritasini tuzing

Har bir rol (bemor, stomatolog, ustoz, talaba) va har bir SDK uchun quyidagilarni jadvalda yuriting: yig‘iladigan ma’lumot, nima uchun kerakligi, majburiymi, qurilmada yoki serverda saqlanishi, kimga uzatilishi, qancha muddat turishi, o‘chirish usuli va qaysi mamlakatga uzatilishi. Kamida email va hisob identifikatori, profil surati/logotipi, aloqa havolalari, aniq/taxminiy joylashuv, qabul ma’lumoti, klinik surat va bemor kartasi, o‘quv ishi, forum post/izohi, shikoyat, push tokeni, xatolik/analitika hamda tarjima yoki AI xizmatiga yuborilgan matn/audio alohida ko‘rib chiqilsin. Uchinchi tomon SDK’lari ham do‘kon deklaratsiyasiga kiradi. Xizmat haqiqatan ishlatmaydigan ma’lumotni yig‘mang.

Tibbiy va bemorni tanitadigan ma’lumotlar uchun rolga asoslangan kirish, saqlashda va uzatishda himoya, audit, zaxira nusxalaridan o‘chirish muddati, klinika/ustoz ruxsatlari va mamlakatga xos qonuniy talablar alohida loyihalansin. Foydalanuvchi qo‘shgan klinik surat yoki holat ommaga faqat huquqi va shaxssizlantirilishi tekshirilgach chiqsin. Ilovani dunyo bo‘ylab chiqarishdan oldin har bir bozorning sog‘liq ma’lumotlari va yoshga oid qoidalarini yuridik mutaxassis bilan ko‘rib chiqing.

## Ilova ichida ishlashi kerak bo‘lgan oqimlar

1. **Maxfiylik siyosati:** ilovada va ochiq, barqaror HTTPS sahifada UZ/RU/EN matn bo‘lsin. Unda operator va aloqa manzili, aniq ma’lumot turlari, maqsad, uchinchi tomonlar, saqlash/o‘chirish, xavfsizlik, foydalanuvchi huquqlari va siyosat sanasi yozilsin. Ishlamagan xizmat yoki mavjud bo‘lmagan huquqni va’da qilmang. Ro‘yxatdan o‘tishdan oldin siyosat va foydalanish shartlariga kirish mumkin bo‘lsin.
2. **Hisobni o‘chirish:** hisob yaratish haqiqiy ishga tushganda Sozlamalar → Hisob → Hisobni o‘chirish oqimi ishlasin. O‘chirish oqibati, qayta tasdiqlash, bekor qilish va qonunan saqlanishi zarur yozuvlar tushuntirilsin. Google Play uchun ilovadan tashqarida ham hisob/ma’lumotni o‘chirishni so‘rashga imkon beradigan ochiq web manzil tayyorlansin; Play Console’dagi URL aynan shu oqimga olib borsin. Ilovani o‘chirish hisobni o‘chirish o‘rniga o‘tmaydi. Demo tugmasi hisob o‘chirildi deb yolg‘on xabar bermasin.
3. **Ruxsatlar:** aniq GPS faqat “Yaqin stomatologlar”/xarita amali bosilganda, nima uchun kerakligi aytilgach so‘ralsin. Rad etilsa mamlakat/shaharni qo‘lda tanlash ishlasin. Kamera, foto va mikrofon ham faqat tegishli amal paytida so‘ralsin; platforma permission matnlari haqiqiy foydalanishga mos bo‘lsin. Audio tarjima foydalanuvchi boshlagandagina yozsin; tashqi tarjima/AI xizmatiga yuborish ochiq tushuntirilsin.
4. **Forum va foydalanuvchi kontenti:** yozishdan oldin qoidalar ko‘rinsin. Post/izohni shikoyat qilish, boshqa foydalanuvchini bloklash, moderator ko‘rigi, o‘chirish va takroriy buzilishdagi cheklovlar serverda haqiqatan ishlasin. Bemorni tanitadigan surat va matnni joylashga qarshi nazorat bo‘lsin. Faqat frontenddagi so‘z filtri yetarli emas.
5. **Tibbiy mazmun:** 3D atlas, test va Case Studio ta’lim vositasi sifatida aniq belgilansin; tashxis yoki davolashni avtomatik va kafolatli deb va’da qilmang. Klinik da’volar manbali va mutaxassis tekshirgan bo‘lsin. Agar mahsulot klinik qaror yoki tibbiy qurilma funksiyasiga o‘tsa, tegishli regulyator talablari alohida tekshirilsin.
6. **Yosh va xabarnoma:** maqsadli auditoriya va yosh reytingi haqiqiy mazmunga mos bo‘lsin. Push bildirishnomalari ruxsat va foydalanuvchi tanloviga bo‘ysunsin; reklama va xizmat xabarlari farqlansin.

## Apple App Store topshiruvi

- App Store Connect’dagi **App Privacy** savollarini haqiqiy build, backend va har bir SDK ma’lumot oqimiga mos to‘ldiring. Maxfiylik siyosati URL’ini metadata va ilova ichida taqdim eting.
- Hisob yaratilsa, foydalanuvchi ilova ichidan hisobni o‘chirishni boshlay olishi kerak. Faqat supportga xat yozish yo‘riqnomasi bilan cheklanib qolmang; Apple’ning joriy istisno va tasdiqlash qoidalarini chiqarish oldidan tekshiring.
- Agar keyinchalik Google/Facebook kabi uchinchi tomon ijtimoiy login **asosiy kirish usuli** sifatida qo‘shilsa, Apple’ning 4.8 login talabini tekshiring. Hozirgi reja — email-kod; bu band Apple yoki Google tugmasini majburiy qo‘shish degani emas.
- Tracking/advertising SDK qo‘shilsa, App Tracking Transparency va kerakli rozilik masalasi alohida baholansin. SDK maxfiylik manifestlari va kerakli API sabablarini buildga qarab tekshiring.
- iOS uchun imzolangan build, ilova belgisi, screenshotlar, yosh reytingi, support URL, ishlaydigan demo/reviewer hisobi yoki tushunarli tekshiruv yo‘riqnomasi va tibbiy da’volarga dalil tayyor bo‘lsin.

## Google Play topshiruvi

- Play Console’dagi **Data safety** javoblari haqiqiy build va SDK’lar bilan bir xil bo‘lsin; privacy policy URL ilova ichida va do‘kon sahifasida ochilsin.
- Hisob yaratadigan ilova ichida hisobni o‘chirish yo‘li va ilovadan tashqaridagi o‘chirish so‘rovi web URL’i ishlasin. Play Console’dagi account deletion deklaratsiyasi real oqimga mos bo‘lsin.
- Target API level, Android permission deklaratsiyalari, content rating, target audience, reklama deklaratsiyasi, health/medical mazmun va foydalanuvchi kontenti qoidalari **chiqarish sanasidagi** Play talablariga ko‘ra tekshirilsin. Aniq API raqamini hozirdan doimiy qoida deb yozmang.
- Play’ga odatda imzolangan **Android App Bundle (.aab)** topshiriladi; oddiy APK fayli ikki platformaga chiqarish rejasi emas. iOS uchun alohida Xcode/App Store Connect build va imzolash jarayoni kerak.

## Qabul mezoni va topshiriladigan materiallar

Do‘konga yuborishdan avval quyidagilar review qilinadi: ma’lumotlar xaritasi; uch tildagi amaldagi privacy policy va Terms URL’lari; ishlaydigan hisobni o‘chirish oqimi va web URL; permissions uchun rad etish holati; forum report/block/moderatsiya; SDK ro‘yxati; App Privacy va Data safety javoblari; yosh reytingi; tibbiy da’volar/manbalar; iOS/Android real qurilma testlari; reviewer kirish yo‘riqnomasi. Matn va deklaratsiyalarni yakuniy build bilan solishtiring. Backend, operator rekvizitlari, hosting, yurisdiksiya va ishlaydigan hisob bo‘lmaguncha bu bandlar faqat talab — **bajarilgan compliance emas**.

## Rasmiy manbalar — chiqarish oldidan qayta ochib tekshiring

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play User Generated Content policy: https://support.google.com/googleplay/android-developer/answer/9876937

Ushbu muhitda rasmiy sahifalar tarmoq tomonidan 403 bilan bloklandi; yuqoridagi havolalar shu sessiyada jonli tekshirilmadi. Siyosat va konsol savollari vaqt o‘tishi bilan o‘zgaradi, shuning uchun topshirish kunida rasmiy matnni qayta tekshirish shart.
