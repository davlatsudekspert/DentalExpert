# Cloudflare yordamchisiga prompt

Quyidagini Cloudflare dashboard'dagi AI yordamchiga (yoki kirgan hisobdagi agentga) yuboring.

> GitHub'dagi `davlatsudekspert/DentalExpert` reposini Cloudflare Pages'ga ulab ber. Production branch: `main`. Root directory: `prototype`. Framework: Vite. Build command: `npm run build`. Build output directory: `dist`. Node versiyasi 20 yoki undan yuqori. Loyiha nomi: `dental-expert`.
>
> Keyin shu hisobda D1 bazasi yarat: nomi `dental-expert`. Yaratilgach `database_id` va account ID ni menga yoz. Pages loyihasining Functions bo‘limida `DB` nomli D1 binding qo‘sh (production va preview uchun) va shu bazaga ulab qo‘y. R2 bucket `dental-expert-media` yarat va `MEDIA` nomi bilan binding qil.
>
> Hech qanday pullik reja yoqma, domen sotib olma va mavjud boshqa loyihalarga tegma. Oxirida: Pages manzili (`*.pages.dev`), D1 `database_id`, R2 bucket nomi va deploy holatini yoz.

## Keyin Claude'ga qaytaring

`database_id` va Pages manzilini yuborsangiz, `wrangler.toml`, SQLite migratsiyasi va `/api/doctors`, `/api/sponsors` funksiyalari shu qiymatlar bilan yoziladi.

## Holat (2026-10-17)

Cloudflare tomonida yaratilgan: Pages `dental-expert` (`dental-expert.pages.dev`), D1 `dental-expert`, R2 `dental-expert-media`. `wrangler.toml` repoda.

**Qolgan qadam — D1 migratsiyalarini jonli bazaga qo‘llash** (bu qilinmaguncha `/api/*` jonli saytda 500 qaytaradi; frontend avtomatik demo ma’lumotga qaytadi):

```
cd prototype
CLOUDFLARE_API_TOKEN=... npx wrangler d1 migrations apply dental-expert --remote
```

yoki Cloudflare yordamchisiga: «`dental-expert` D1 bazasida `prototype/migrations/0001_global_discovery.sql`, so‘ng `0002_demo_seed.sql`, `0003_auth_and_ratings.sql`, `0004_demo_ratings.sql` ni ketma-ket bajar».

Lokal sinov: `npm run build && npm run db:local && npm run api:dev`, so‘ng `curl 'http://127.0.0.1:8788/api/sponsors?city=UZ-AN&includeDemo=1'`.

**Xavfsizlik:** Cloudflare AI agentiga «Full access» token berilgan. Ishlar tugagach Cloudflare → My Profile → API Tokens bo‘limidan uni bekor qiling.

## Email-kod (auth) uchun Pages sozlamalari

Pages → `dental-expert` → Settings → Variables and Secrets (production), **Secret** sifatida:

- `AUTH_SECRET` — uzun tasodifiy qator (kamida 32 belgi), kodlarni xeshlash uchun. Masalan: `openssl rand -base64 48`.
- `RESEND_API_KEY` — [Resend](https://resend.com) API kaliti (email jo‘natish xizmati).
- `AUTH_FROM` — jo‘natuvchi, masalan `Dental Expert <noreply@sizning-domeningiz>` (Resend’da domen tasdiqlangan bo‘lishi kerak; sinov uchun standart `onboarding@resend.dev` faqat o‘z emailingizga jo‘natadi).

Shulardan biri yo‘q bo‘lsa, `/api/auth/me` `enabled:false` qaytaradi va ilova belgilangan demo kirishni saqlaydi. **`AUTH_DEV_ECHO` ni jonli muhitga hech qachon qo‘ymang** (kod javobda qaytadi; u faqat localhost’da ishlaydi, lekin baribir qo‘ymang).

Lokal sinov: `prototype/.dev.vars` ga `AUTH_SECRET=...` va `AUTH_DEV_ECHO=1` yozing (git’ga kirmaydi), so‘ng `python3 tools/auth_test.py` va `python3 tools/e2e_live.py` (avval `npx wrangler d1 execute dental-expert --local --file tools/e2e_seed.sql`).
