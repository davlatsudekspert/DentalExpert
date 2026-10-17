# Dental Expert — do‘kon to‘lovi va boshlang‘ich narx taklifi

Bu **tasdiqlash uchun boshlang‘ich narx modeli**. Hech qanday to‘lov, obuna yoki kampaniya hozir ishlamaydi. 2026-10-17 kuni Apple va Google rasmiy sahifalariga muhit proxy-si 403 qaytardi; amaldagi komissiya va mamlakat istisnolari jonli tekshirilmadi. Narxlarni App Store Connect yoki Play Console’ga kiritishdan oldin quyidagi rasmiy manbalarni ochib qayta tasdiqlang.

## To‘lov yo‘li

- iOS ilova ichida sotiladigan **raqamli Pro obuna** uchun Apple In-App Purchase / StoreKit, Android uchun Google Play Billing loyihalansin. Obuna huquqi faqat server tekshirgan tranzaksiyadan keyin ochiladi. Apple va Google uchun alohida mahsulot identifikatori, lekin yagona serverdagi entitlement holati bo‘lsin.
- Ilova ichidagi mahalliy **raqamli reklama joyi** uchun ham do‘kon to‘lovi oqimini loyihalang, ammo mahsulot turi va majburiy billing qoidalarini aniq reklamani qayerda ko‘rsatishimizga qarab rasmiy siyosatda tekshiring. To‘lovsiz faollashtirmang; do‘konni chetlab o‘tadigan web to‘lovga avtomatik yo‘naltirmang.
- Bemorning klinikadagi **real stomatologik xizmati** raqamli Pro/reklamadan alohida. Uning to‘lov qoidasini App Store/Play siyosatiga ko‘ra mustaqil belgilang; bu hujjat qabul narxini do‘kon ichidagi xarid deb hisoblamaydi.
- Uch oylik tanishuvda Pro huquqi bepul ochilishi mumkin; muddati tugagach Free qoladi. Foydalanuvchi do‘kon obunasini **o‘zi tanlamaguncha** avtomatik pullik yangilanish bo‘lmasin. Narx, davr, qayta to‘lov, bekor qilish va qaytarish qoidasi xariddan oldin ko‘rinsin.

## Komissiyani narxga qo‘shish

Hozircha ikkita hisoblash ssenariysi ishlatiladi: **15%** va ehtiyotkor **30%**. Haqiqiy stavka dasturga a’zolik, mahsulot turi, obuna davri, mamlakat va do‘kon qoidalariga bog‘liq. Soliq, valyuta ayirboshlash, qaytarish va bank xarajatlari bu jadvalga kirmaydi.

`taxdan keyingi do‘kon bazasi = xaridor narxi − do‘kon ushlab qolgan soliq`

`bizga qoladigan taxminiy tushum = taxdan keyingi do‘kon bazasi × (1 − amaldagi komissiya)`

Maqsadli sof tushum `N` bo‘lsa, soliqsiz taxminiy narx `N / (1 − komissiya)`; keyin do‘konning mavjud price point’i va hududiy soliqqa moslab yuqoriga yaxlitlang. **15% huquqi tasdiqlanmaguncha byudjetni 30% bilan rejalang.** Komissiya qiymatini kodga doimiy `0.15` qilib tikib qo‘ymang; store/product/region/davr bo‘yicha versiyalangan konfiguratsiya va haqiqiy payout hisobotini ishlating.

## Boshlang‘ich test narxlari (USD ekvivalenti)

| Mahsulot | Xaridor uchun sinov narxi | 30% ssenariyda qoladi | 15% ssenariyda qoladi |
| --- | ---: | ---: | ---: |
| Talaba Pro, oyiga | $3.99 | $2.79 | $3.39 |
| Stomatolog/Ustoz Pro, oyiga | $9.99 | $6.99 | $8.49 |
| Talaba Pro, yiliga | $29.99 | $20.99 | $25.49 |
| Stomatolog/Ustoz Pro, yiliga | $79.99 | $55.99 | $67.99 |

Yillik narxlar oylikni 12 marta to‘lashga nisbatan taxminan 33–37% arzon. Bu bozor sinovi taklifi, tasdiqlangan global tarif emas. Bemor Free doim $0. Majburiy ustoz darsi, test, amaliy ish va asosiy portfel talaba Pro ortiga yashirilmaydi. Narxlar UZ/RU/EN tiliga emas, do‘kon hududi va mahalliy valyutaga qarab belgilanadi; narxni ilova ichida do‘kon API’sidan olingan formatda ko‘rsating.

## Shahar reklamasi uchun test modeli

Kunlik shahar bazasi `P` va davomiylik koeffitsienti hozirgi mahsulot rejasidan olinadi: 1 kun `1P`, 3 kun `2.7P`, 6 kun `5.1P`, 10 kun `8P`. Birinchi test uchun `P = $4.99` (past talab), `$6.99` (o‘rtacha) yoki `$9.99` (yuqori talab) **taklif**; shaharni bandga haqiqiy talab, auditoriya va natija asosida joylang. Birinchi real reklama beruvchi kelmaguncha Dubai yoki boshqa shaharga “bozor narxi” deb raqam biriktirmang.

Masalan `P = $4.99` bo‘lsa, do‘kon narx nuqtasiga yaqinlashtirilgan taklif: **1/3/6/10 kun = $4.99 / $13.49 / $25.49 / $39.99**. 30% ssenariyda, soliqdan oldin taxminan `$3.49 / $9.44 / $17.84 / $27.99` qoladi. Har bir band/davomiylik uchun do‘konda mos mahsulot yoki qo‘llab-quvvatlanadigan konfiguratsiya bo‘lishi kerak; ilova o‘zi do‘kon narxini xohlagan son bilan almashtirmaydi. Reklama faollashishi serverdagi receipt/transaction tekshiruvi, profil tasdig‘i, shahar limiti va kampaniya sanasiga bog‘liq. Refund/revoke bo‘lsa entitlement ham qayta hisoblanadi.

## Claude uchun qabul mezoni

1. iOS StoreKit va Android Play Billing adapterlarini bitta purchase/entitlement interfeysiga ajrat; platforma va region bo‘yicha product ID xaritasini tuz. Demo UI’da provider bo‘lmasa “to‘landi” demagin.
2. Serverda Apple App Store Server API/Notifications va Google Play Developer API/Real-time Developer Notifications orqali tranzaksiyani tekshir; idempotent qayd, yangilanish, bekor qilish, refund va grace/hold holatlarini sinovdan o‘tkaz. Xarid tugmasi narxni do‘kon javobidan olsin.
3. Pro obuna, uch oylik promo huquqi va reklama kampaniyasi huquqini alohida saqla. Bemor uchun bepul funksiyalar obunaga bog‘lanmasin.
4. Admin hisobida store fee, tax, payout, refund va yalpi/sof tushumni hudud, platforma va mahsulot bo‘yicha ko‘rsat. Narx taklifini 30% ssenariy va mahalliy soliq bilan qayta hisoblab, foydalanuvchiga ko‘rinadigan haqiqiy price point’ni tasdiqlashga chiqargin.

Rasmiy manbalar (ushbu muhitda 403 sababli qayta o‘qilmagan): [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/), [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738), [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622).
