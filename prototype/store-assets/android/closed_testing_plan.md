# Closed testing plan (12 testers × 14 days)

## The rule (checked 17 Oct 2026)

Google Play Console Help, "App testing requirements for new personal developer accounts"
(https://support.google.com/googleplay/android-developer/answer/14151465):

- Applies to **personal** developer accounts created **after 13 November 2023**. Organization accounts are not
  subject to it.
- "Developers with personal accounts created after November 13, 2023, must run a closed test" with "a minimum of 12
  testers who have been opted in continuously for at least 14 days."
- "At least 12 testers must be opted in to your closed test when you apply for production access."
- Testers who opt out before the 14 days end do not count. Until the requirement is met, Production (and
  pre-registration) stay disabled.
- After 14 days you click **Apply for production** on the Dashboard and answer questions about the test (how you
  recruited testers, what feedback you got, what you changed). Google then reviews the application (allow about a week).

Internal testing does **not** count toward the 14 days. Only the **closed testing** track (`alpha` in the workflow) does.

## Plan

| Day | What |
|---|---|
| 0 | First .aab uploaded by hand to **Internal testing** (PLAY_RELEASE.md step 6). Owner + 1-2 people install and check sign-in. Fill every App content section (data safety, content rating, health, app access, target audience, ads, privacy policy). |
| 0-1 | Create **Closed testing → Alpha** release with the same or a newer build, add the tester list (Google Group or email list), send for review. Review of a first closed release can take a few days. |
| 1-3 | As soon as the closed release is live: send the opt-in link to **15-20 people** (buffer above 12: some will forget or opt out). Ask each one to tap "Become a tester", install from Play and **keep the app installed**. |
| 3 | Check Play Console → Closed testing → Testers: at least 12 opted in. Count day 1 from the day the 12th person joined. |
| 3-17 | Testers use the app a few times a week and send feedback. Ship at least one update to the closed track with fixes (Google asks what you changed). |
| 17+ | Dashboard → **Apply for production**. Keep all testers opted in until access is granted. |

Who to ask: dental students and teachers from the institutes in the app, colleagues who are dentists, friends and
family with Android phones. Every tester needs an Android phone and a Google account (Gmail).

Easiest way to manage the list: create a Google Group (groups.google.com, e.g. `dental-expert-testers@googlegroups.com`,
"anyone can ask to join"), add the group email in Play Console as the closed-testing tester list, and share both
the group link and the opt-in link.

## Message to recruit testers

### O‘zbekcha
```
Assalomu alaykum! Men stomatologlar va stomatologiya talabalari uchun "Dental Expert" ilovasini Google Play'ga chiqaryapman. Google qoidasi bo‘yicha ilovani 12 kishidan ortiq 14 kun sinab ko‘rishi kerak. Yordam bera olasizmi?
1) Shu guruhga qo‘shiling (Gmail bilan): <GOOGLE GROUP LINK>
2) Shu havolani oching va "Become a tester / Testerga aylanish" tugmasini bosing: <OPT-IN LINK>
3) Ilovani Google Play'dan o‘rnating va kamida 14 kun o‘chirmang.
Vaqti-vaqti bilan oching va fikringizni yozing: nima yoqdi, nima ishlamadi. Ilova bepul, reklamasiz. Rahmat!
```

### Русский
```
Здравствуйте! Я выпускаю в Google Play приложение "Dental Expert" для стоматологов и студентов-стоматологов. По правилам Google его должны протестировать не менее 12 человек в течение 14 дней. Поможете?
1) Вступите в группу (через Gmail): <GOOGLE GROUP LINK>
2) Откройте ссылку и нажмите "Стать тестировщиком": <OPT-IN LINK>
3) Установите приложение из Google Play и не удаляйте его минимум 14 дней.
Иногда открывайте его и пишите отзыв: что понравилось, что не работает. Приложение бесплатное, без рекламы. Спасибо!
```

### English
```
Hi! I'm releasing "Dental Expert", an app for dentists and dental students, on Google Play. Google requires at least 12 people to test it for 14 days first. Could you help?
1) Join the tester group with your Gmail account: <GOOGLE GROUP LINK>
2) Open this link and tap "Become a tester": <OPT-IN LINK>
3) Install the app from Google Play and keep it installed for at least 14 days.
Open it now and then and tell me what works and what doesn't. It's free and has no ads. Thank you!
```

Where to find the opt-in link: Play Console → Test and release → Testing → **Closed testing** → your track →
**Testers** tab → "Join on the web" link (shown after the closed release is reviewed and live).
