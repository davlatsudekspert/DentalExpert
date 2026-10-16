# Dental Expert prototipini Claude Code bilan davom ettirish

Bu papka mustaqil React + TypeScript + Vite **dizayn prototipi**. Asosiy loyiha kodi bu yerda o‘zgartirilmagan. Backend, API, haqiqiy login, to‘lov va bemor ma’lumotlari yo‘q. GitHub Pages yoki boshqa joyga deploy qilmang.

## Claude Code uchun boshlang‘ich ko‘rsatma

> Shu repository ichidagi `prototype/` papkasidan ishni davom ettir. Avval `README.md` va `DESIGN_HANDOFF.md`ni o‘qi. `npm ci && npm run build` bilan holatini tekshir, keyin `npm run dev` bilan mobil dizaynni och. Bu hozircha faqat demo UI/UX prototip; backend yoki haqiqiy ilova funksiyalarini qo‘shma. Asosiy e’tibor foydalanuvchi bergan ikki etalon rasmdagi premium dental mobil dizayn sifatiga qaratilsin. Arxivdagi `archive-*.webp` ko‘rinishlari splash, home va anatomiya ekranlarida ishlaydi; ularni bir-biriga mos bitta 3D model deb hisoblama. Splash/onboarding, stomatolog profili, qabulga yozilish va 3D Tooth Anatomy sahifalarini birinchi ko‘r. Yangi `assets/tooth3d/reference-molar.glb` va `reference-molar.blend` foydalanuvchi yuborgan JPG’lardan **taxminan** yasalgan uch ildizli draft; `tools/build_reference_molar.py` manbasi va `screenshots/anatomy-3d.png` real ko‘rinishini tekshir. Kesimdagi ikki ildizli tasvir bilan tashqi uch ildizli rasmlar mos emas. `src/Tooth3D.tsx` WebGL kodini boshqaradi. O‘zgarishdan keyin `npm run build && python tools/package.py && PROTOTYPE_HTML=demo.html python tools/verify.py` bilan offline HTMLni va navigatsiyani tekshir; screenshotlarni haqiqiy frontenddan qayta ol. Foydalanuvchi ruxsatisiz ilovani deploy qilma.

## Fayllar va buyruqlar

- `demo.html` — offline ko‘rish uchun bitta HTML fayl.
- `src/main.tsx`, `src/style.css`, `src/Tooth3D.tsx` — ekranlar, dizayn va interaktiv tish.
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
