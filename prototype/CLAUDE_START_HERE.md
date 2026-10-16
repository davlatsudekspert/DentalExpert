# Dental Expert prototipini Claude Code bilan davom ettirish

Bu papka mustaqil React + TypeScript + Vite **dizayn prototipi**. Asosiy loyiha kodi bu yerda o‘zgartirilmagan. Backend, API, haqiqiy login, to‘lov va bemor ma’lumotlari yo‘q. GitHub Pages yoki boshqa joyga deploy qilmang.

## Claude Code uchun boshlang‘ich ko‘rsatma

> Shu repository ichidagi `prototype/` papkasidan ishni davom ettir. Avval `README.md` va `DESIGN_HANDOFF.md`ni o‘qi. `npm ci && npm run build` bilan holatini tekshir, keyin `npm run dev` bilan mobil dizaynni och. Bu hozircha faqat demo UI/UX prototip; backend yoki haqiqiy ilova funksiyalarini qo‘shma. Asosiy e’tibor foydalanuvchi bergan ikki etalon rasmdagi premium dental mobil dizayn sifatiga qaratilsin. Splash/onboarding, stomatolog profili, qabulga yozilish va 3D Tooth Anatomy sahifalarini birinchi ko‘r. 3D tishning original Blender sahnasi `assets/tooth3d/DentalExpert_Tooth.blend`, uni yaratuvchi skript `tools/create_tooth_asset.py`, interaktiv WebGL kod esa `src/Tooth3D.tsx`da. O‘zgarishdan keyin `npm run build && python tools/package.py && PROTOTYPE_HTML=demo.html python tools/verify.py` bilan offline HTMLni va navigatsiyani tekshir; screenshotlarni haqiqiy frontenddan qayta ol. Foydalanuvchi ruxsatisiz deploy yoki ommaviy publikatsiya qilma.

## Fayllar va buyruqlar

- `demo.html` — offline ko‘rish uchun bitta HTML fayl.
- `src/main.tsx`, `src/style.css`, `src/Tooth3D.tsx` — ekranlar, dizayn va interaktiv tish.
- `assets/tooth3d/` — original Blender modeli va uning renderlari, splash va anatomiya uchun AI yaratilgan premium PNG/WebP/JPG illyustratsiyalar.
- `screenshots/jpg/preview-board.jpg` — 8 asosiy ekranning umumiy ko‘rinishi; `screenshots/jpg/` — barcha 19 ekran.
- `DESIGN_HANDOFF.md` — ekranlar, holatlar, komponentlar va cheklovlar haqida batafsil izoh.

```sh
cd prototype
npm ci
npm run build
npm run dev
```

Blender sahnasini qayta yaratish kerak bo‘lsa: `blender --background --factory-startup -t 4 --python tools/create_tooth_asset.py`. Model o‘quv vizuali; klinik aniqlik da’vo qilinmaydi.
