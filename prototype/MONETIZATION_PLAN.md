# Dental Expert — tarif va homiylik joylari (taklif)

Bu hujjat mahsulot qarori va keyingi kodlash uchun asos. **Hozircha haqiqiy to‘lov, obuna yoki reklama kampaniyasi yo‘q.** Hozirgi Asosiy sahifada mavjud uch demo shifokorga olib boradigan 3 ta aniq “Namuna reklama” kartasi bor; ular pul to‘langan joy deb taqdim etilmaydi. Bu ilk vizual namuna hali shahar bo‘yicha almashmaydi. Keyingi bosqichda Andijon va Farg‘ona uchun alohida namunalar va kampaniya modeli quriladi. Narxlar bozor sinovidan va to‘lov siyosati tekshiruvidan keyin e’lon qilinadi.

## Shahar bo‘yicha reklama

- Har bir mamlakat+shahar juftligi uchun **ko‘pi bilan 5 ta faol homiy kampaniyasi** qabul qilinadi. Andijon va Farg‘ona alohida navbat; boshqa shahar reklamasi aralashmaydi.
- Asosiy sahifada shu shaharning **ko‘pi bilan 3 ta kartasi** ko‘rinadi. 4–5-homiylar bir xil huquq bilan navbatga kiradi. Keyingi kirish/ko‘rishda navbat almashadi; bitta homiyga yashirin doimiy birinchi o‘rin berilmaydi. Agar faol homiy 3 tadan kam bo‘lsa faqat mavjudlari chiqadi.
- Sotib olinadigan muddatlar: **1, 3, 6 yoki 10 kun**. Boshlanish va tugash vaqti UTC’da saqlanadi, foydalanuvchiga shahar vaqtida ko‘rsatiladi. Muddat tugasa kampaniya avtomatik to‘xtaydi. Bir homiyning bir shaharda bir vaqtdagi takroriy kampaniyasi alohida joyni egallamaydi.
- Narx formulasi uchun boshlang‘ich taklif: shaharning 1 kunlik bazaviy narxi **P** bo‘lsa, 1 kun = `1P`, 3 kun = `2.7P`, 6 kun = `5.1P`, 10 kun = `8P`. Bu 3/6/10 kun uchun taxminan 10/15/20% muddat chegirmasi beradi. **P summasi va valyutasi hali belgilanmagan**; shahar talabi va real natijalar o‘lchanmaguncha ekranga narx yozilmaydi. Narx, soliq, qaytarish, to‘xtatish va to‘lov kanali oldindan ko‘rsatiladi.
- Real homiylikka faqat tasdiqlangan shifokor, faol klinika va tekshirilgan manzil ega bo‘ladi. Har kartada “Reklama” belgisi bor; homiylik reyting, klinik tavsiya yoki litsenziya tasdig‘ini sotib olmaydi. Pro tarif reklama joyini avtomatik bermaydi, reklama xaridi Pro obunasidan alohida.
- Serverda `campaignId`, `doctorId`, `clinicId`, `countryCode`, `cityId`, `startAt`, `endAt`, `status`, `paidAmount`, `currency`, `impressions`, `clicks` va audit ma’lumotlari yuritiladi. Faol kampaniyalar soni 5 dan oshmasligi hamda adolatli aylanish **serverda** tekshiriladi; frontend bu hisobning yagona manbasi bo‘lmaydi.

## Rollar va tariflar

| Kim | Narx | Asosiy imkoniyat |
| --- | --- | --- |
| Bemor | Doim bepul | Qidirish, profil ko‘rish, saqlash va qabul so‘rovi; reklama ko‘rish uchun to‘lov yo‘q. |
| Stomatolog — Free | Doim mavjud | Kasbiy profil, klinika va kontaktlar, forum/o‘quvning asosiy qismi; **oyiga 5 tagacha yangi tasdiqlangan onlayn qabul**. |
| Stomatolog — Pro | Pullik, narxi keyin | Oyiga qabul soni bo‘yicha sun’iy limit yo‘q; haqiqiy jadval sig‘imi va xavfsizlik cheklovlari qoladi. Kengaytirilgan jadval/statistika va ish jarayoni funksiyalari keyin aniqlanadi. Reklama joyi kirmaydi. |
| Ustoz — Free | Doim mavjud | 1 faol guruh, dars/test berish, ishni ko‘rish va izoh yozish. |
| Ustoz — Pro | Pullik, narxi keyin | Ko‘proq guruh, kengaytirilgan progress tahlili, maxsus Case Studio topshiriqlari va ko‘proq fayl joyi. |
| Talaba — Free | Doim mavjud | Ustoz majburiy bergan dars, test, amaliy ish, izoh va asosiy portfelga kirish. |
| Talaba — Pro | Pullik, narxi keyin | Qo‘shimcha interaktiv holatlar, shaxsiy o‘quv tahlili, ruxsatli premium kutubxona va oflayn material. Majburiy kurslar yopilmaydi. |

**Odam yig‘ish davri:** ishga tushganidan keyin shifokor, ustoz va talabaga **3 oylik bepul Pro sinovi** taklif etiladi. “3 oylik Free” nomi chalkash: Free keyin ham bepul qoladi, sinov esa Pro imkoniyatlarini vaqtincha ochadi. Sinovdan keyin foydalanuvchi Free’da davom etadi yoki aniq narxni ko‘rib Pro’ni ixtiyoriy tanlaydi. Avtomatik pullik yangilanish sukut bo‘yicha yoqilmaydi; rozilik va to‘lov qoidalari oldindan ko‘rsatiladi. Bemorlar uchun muddatli sinov yo‘q — ular doim bepul. Ustoz/talaba oqimining batafsil qoidasi [`EDUCATION_PLAN.md`](EDUCATION_PLAN.md)da.

**Qabul hisoblash qoidasi:** Free limitiga har oy faqat yangi **tasdiqlangan** onlayn qabul kiradi; bekor qilingan, test va dublikat so‘rov kirmaydi. Oy qaysi vaqt zonasida yangilanishi, bemor qayta yozilishi, klinika qabulni ko‘chirishi va no-show holati serverda aniq modellashtiriladi. Limit to‘lganda mavjud qabullar boshqariladi, yangi onlayn so‘rov qabul qilinmaydi; bemorga tushunarli alternativalar ko‘rsatiladi. Pro “cheksiz” degani jadvaldan ortiq band qilish yoki spamga ruxsat degani emas.

## Birinchi demo va keyingi bosqich

1. Keyingi UI bosqichida mavjud uch kartali blokni shahar tanlash bilan Andijon va Farg‘onaning har biri uchun **3 tadan namunaviy reklama kartasi**ga bog‘la; har biri haqiqiy demo profilga olib borsin. Faqat 3 karta ko‘rinadi, to‘lov tugmasi yo‘q. Free/Pro taqqoslash sahifasi bo‘lsa “Reja — hozircha to‘lov ishlamaydi” deb belgilansin.
2. Real ishga tushirishdan avval litsenziya tekshiruvi, backend kampaniya navbati, shahar bo‘yicha 5 joy limiti, qabul hisoblagichi, 3 oylik sinov sanalari, billing, hisob-faktura/soliq, bekor qilish va qaytarish jarayonlari qurilsin. Narxlar bozor va shahar kesimida tekshirilsin.
3. Native ilova ichida Pro yoki reklama joyini sotishdan oldin Apple/Google’ning **raqamli xizmat uchun to‘lov** qoidalari va kerakli billing usuli chiqarish sanasidagi rasmiy matn bilan tekshirilsin. Bemorning real klinik xizmat to‘lovi reklama/obunadan alohida mahsulot oqimi.

Bu model hozircha taklif: narx, Free limiti va sinov davomiyligi foydalanuvchi hamda shifokorlar bilan sinab ko‘rilgach yakunlanadi.
