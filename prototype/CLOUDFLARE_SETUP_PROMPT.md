# Cloudflare yordamchisiga prompt

Quyidagini Cloudflare dashboard'dagi AI yordamchiga (yoki kirgan hisobdagi agentga) yuboring.

> GitHub'dagi `davlatsudekspert/DentalExpert` reposini Cloudflare Pages'ga ulab ber. Production branch: `main`. Root directory: `prototype`. Framework: Vite. Build command: `npm run build`. Build output directory: `dist`. Node versiyasi 20 yoki undan yuqori. Loyiha nomi: `dental-expert`.
>
> Keyin shu hisobda D1 bazasi yarat: nomi `dental-expert`. Yaratilgach `database_id` va account ID ni menga yoz. Pages loyihasining Functions bo‘limida `DB` nomli D1 binding qo‘sh (production va preview uchun) va shu bazaga ulab qo‘y. R2 bucket `dental-expert-media` yarat va `MEDIA` nomi bilan binding qil.
>
> Hech qanday pullik reja yoqma, domen sotib olma va mavjud boshqa loyihalarga tegma. Oxirida: Pages manzili (`*.pages.dev`), D1 `database_id`, R2 bucket nomi va deploy holatini yoz.

## Keyin Claude'ga qaytaring

`database_id` va Pages manzilini yuborsangiz, `wrangler.toml`, SQLite migratsiyasi va `/api/doctors`, `/api/sponsors` funksiyalari shu qiymatlar bilan yoziladi.
