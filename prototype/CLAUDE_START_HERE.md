# Dental Expert prototipini Claude Code bilan davom ettirish

Bu papka mustaqil React + TypeScript + Vite **dizayn prototipi**. Asosiy loyiha kodi bu yerda o‘zgartirilmagan. Backend, API, haqiqiy login, to‘lov va bemor ma’lumotlari yo‘q. GitHub Pages workflow qo‘shilgan, lekin sayt hozir 404; boshqa joyga foydalanuvchi ruxsatisiz deploy qilmang.

## Claude Code uchun boshlang‘ich ko‘rsatma

> Shu repository ichidagi `prototype/` papkasidan ishni davom ettir. Avval `README.md` va `DESIGN_HANDOFF.md`ni o‘qi. `npm ci && npm run build` bilan holatini tekshir, keyin `npm run dev` bilan mobil dizaynni och. Bu hozircha faqat demo UI/UX prototip; backend yoki haqiqiy ilova funksiyalarini qo‘shma. Asosiy e’tibor foydalanuvchi bergan ikki etalon rasmdagi premium dental mobil dizayn sifatiga qaratilsin. Foydalanuvchi rasmlaridan olingan `premium-reference-*-ivory.webp` ko‘rinishlari splash, home va anatomiya ekranlarida ishlaydi; ildizlari ochroq tabiiy ivory rangga tuzatilgan, qolgan premium ko‘rinishni saqla. ularni bir-biriga mos bitta 3D model deb hisoblama. Splash/onboarding, stomatolog profili, qabulga yozilish va 3D Tooth Anatomy sahifalarini birinchi ko‘r. `src/PremiumTurntable.tsx` old/o‘ng/orqa/chap renderlar bilan 360° vizual prototipni boshqaradi; bu uzluksiz 3D mesh emas. `assets/tooth3d/reference-molar.glb` va `reference-molar.blend` foydalanuvchi yuborgan JPG’lardan **taxminan** yasalgan eski uch ildizli draft; `tools/build_reference_molar.py` manbasi va `screenshots/anatomy-3d.png` real ko‘rinishini tekshir. Kesimdagi ikki ildizli tasvir bilan tashqi uch ildizli rasmlar mos emas. `src/Tooth3D.tsx` WebGL draft kodini saqlaydi, lekin foydalanuvchi ekranlarida ishlatilmaydi. Premium ko‘rinishni soddalashtirilgan GLB bilan almashtirma. O‘zgarishdan keyin `npm run build && python tools/package.py && PROTOTYPE_HTML=demo.html python tools/verify.py` bilan offline HTMLni va navigatsiyani tekshir; screenshotlarni haqiqiy frontenddan qayta ol. GitHub Pages workflow bor, ammo `https://davlatsudekspert.github.io/DentalExpert/` hozir 404 qaytaryapti; uni ishlaydigan demo deb taqdim etma. Boshqa joyga yangi ilova deployini foydalanuvchi ruxsatisiz qilma.

## Fayllar va buyruqlar

- `demo.html` — offline ko‘rish uchun bitta HTML fayl.
- `src/main.tsx`, `src/style.css`, `src/PremiumTurntable.tsx` — ekranlar, dizayn va 360° vizual; `src/Tooth3D.tsx` — eski GLB drafti.
- `assets/tooth3d/` — original Blender sahnalari, uch ildizli GLB draft, foydalanuvchi yuborgan JPG ko‘rinishlar va splash/anatomiya illyustratsiyalari.
- `screenshots/jpg/preview-board.jpg` — 8 asosiy ekranning umumiy ko‘rinishi; `screenshots/jpg/` — barcha 19 ekran.
- `DESIGN_HANDOFF.md` — ekranlar, holatlar, komponentlar va cheklovlar haqida batafsil izoh.

```sh
cd prototype
npm ci
npm run build
npm run dev
```

Blender sahnasini qayta yaratish kerak bo‘lsa: `blender --background --factory-startup -t 4 --python tools/create_tooth_asset.py`. Model o‘quv vizuali; klinik aniqlik da’vo qilinmaydi.
Uch ildizli GLB draftni qayta yaratish: `blender --background --factory-startup -t 4 --python tools/build_reference_molar.py`. Hozirgi screenshot foto-realistik sifatga yetmagan; uni tayyor premium model deb taqdim etma.
