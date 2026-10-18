// Patient education content: "Sog‘lom tabassum qo‘llanmalari".
// General information aligned with mainstream public guidance (ADA / NHS / WHO / IADT).
// No brand names and no drug doses: medicine advice always points to the leaflet or a pharmacist.

export type GuideLang = 'uz' | 'ru' | 'en';
export type T = Record<GuideLang, string>;

export type GuideIcon =
  | 'brush' | 'floss' | 'pain' | 'extraction' | 'filling' | 'gums'
  | 'child' | 'pregnancy' | 'braces' | 'implant' | 'breath' | 'trauma';

export type GuideSection = {
  title: T;
  kind: 'steps' | 'bullets';
  items: T[];
};

export type Guide = {
  id: string;
  icon: GuideIcon;
  minutes: number;
  title: T;
  summary: T;
  intro: T;
  sections: GuideSection[];
  redFlags: T[];
};

const t = (uz: string, ru: string, en: string): T => ({ uz, ru, en });

export const GUIDE_UI = {
  eyebrow: t("Bemorlar uchun", "Для пациентов", "For patients"),
  heading: t("Sog‘lom tabassum qo‘llanmalari", "Руководства для здоровой улыбки", "Healthy smile guides"),
  lead: t(
    "Tish va milk parvarishi bo‘yicha qisqa, tushunarli maslahatlar. Kerakli mavzuni tanlang.",
    "Короткие и понятные советы по уходу за зубами и дёснами. Выберите нужную тему.",
    "Short, clear advice on caring for your teeth and gums. Pick a topic to read."
  ),
  minRead: t("daqiqa o‘qish", "мин чтения", "min read"),
  back: t("Orqaga", "Назад", "Back"),
  allGuides: t("Barcha qo‘llanmalar", "Все руководства", "All guides"),
  redFlags: t(
    "Shifokorga qachon murojaat qilish kerak",
    "Когда обратиться к врачу",
    "When to see a dentist"
  ),
  disclaimer: t(
    "Bu umumiy ma’lumot, shifokor ko‘rigi o‘rnini bosmaydi.",
    "Это общая информация, она не заменяет осмотр у врача.",
    "This is general information and does not replace an examination by a dentist."
  ),
};

export const GUIDES: Guide[] = [
  // 1 ─────────────────────────────────────────────────────────────
  {
    id: 'brushing',
    icon: 'brush',
    minutes: 3,
    title: t("Tishni to‘g‘ri tozalash", "Как правильно чистить зубы", "How to brush correctly"),
    summary: t(
      "Kuniga ikki marta, ikki daqiqa — ftorli pasta bilan.",
      "Дважды в день по две минуты — с фторсодержащей пастой.",
      "Twice a day for two minutes, with fluoride toothpaste."
    ),
    intro: t(
      "Tishni to‘g‘ri tozalash — karies va milk kasalliklarining eng oddiy va eng samarali oldini olish usuli. Bu yerda kuch emas, muntazamlik va to‘g‘ri usul muhim.",
      "Правильная чистка зубов — самый простой и самый действенный способ защититься от кариеса и болезней дёсен. Важна не сила, а регулярность и правильная техника.",
      "Brushing well is the simplest and most effective way to prevent tooth decay and gum disease. What matters is not force but doing it regularly and the right way."
    ),
    sections: [
      {
        title: t("Qadamma-qadam", "Шаг за шагом", "Step by step"),
        kind: 'steps',
        items: [
          t(
            "Cho‘tkaga no‘xatdek ftorli tish pastasi oling (kattalar uchun 1350–1500 ppm ftor).",
            "Выдавите на щётку пасту размером с горошину (для взрослых — 1350–1500 ppm фтора).",
            "Put a pea-sized amount of fluoride toothpaste on the brush (1,350–1,500 ppm fluoride for adults)."
          ),
          t(
            "Cho‘tkani milk chizig‘iga taxminan 45° burchak ostida tuting.",
            "Держите щётку под углом около 45° к линии десны.",
            "Hold the brush at about a 45° angle to the gum line."
          ),
          t(
            "Kichik, yumshoq aylanma harakatlar bilan tishlarni birma-bir tozalang. Qattiq ishqalamang.",
            "Чистите зубы по одному мягкими короткими круговыми движениями. Не трите с силой.",
            "Clean each tooth with small, gentle circular movements. Don’t scrub hard."
          ),
          t(
            "Barcha yuzalarni tozalang: tashqi, ichki va chaynov yuzalarini. Eng orqadagi tishlarni unutmang.",
            "Очищайте все поверхности: наружные, внутренние и жевательные. Не забывайте самые дальние зубы.",
            "Clean every surface: outer, inner and chewing surfaces. Don’t forget the back teeth."
          ),
          t(
            "Tilni ham yengil tozalang — bu og‘iz hidini kamaytiradi.",
            "Аккуратно почистите и язык — это уменьшает неприятный запах.",
            "Gently brush your tongue too — it helps keep breath fresh."
          ),
          t(
            "Hammasi bo‘lib kamida 2 daqiqa tozalang. Taymer yordam beradi.",
            "Чистите не меньше 2 минут. Помогает таймер.",
            "Brush for at least 2 minutes in total. A timer helps."
          ),
          t(
            "Pastani tupuring, lekin og‘izni suv bilan chayqamang — ftor tishda qolib, uni himoya qilishda davom etadi.",
            "Сплюньте пасту, но не полощите рот водой — фтор останется на зубах и продолжит их защищать.",
            "Spit out the toothpaste but don’t rinse with water — the fluoride stays on your teeth and keeps protecting them."
          ),
        ],
      },
      {
        title: t("Foydali odatlar", "Полезные привычки", "Good habits"),
        kind: 'bullets',
        items: [
          t(
            "Kuniga ikki marta tozalang: ertalab va kechasi uxlashdan oldin. Kechki tozalash ayniqsa muhim.",
            "Чистите зубы дважды в день: утром и вечером перед сном. Вечерняя чистка особенно важна.",
            "Brush twice a day: in the morning and last thing at night. The night-time brush matters most."
          ),
          t(
            "Yumshoq yoki o‘rtacha qattiqlikdagi cho‘tka tanlang. Oddiy yoki elektr cho‘tka — to‘g‘ri ishlatilsa, ikkalasi ham yaxshi.",
            "Выбирайте мягкую или средней жёсткости щётку. Обычная и электрическая одинаково хороши, если пользоваться ими правильно.",
            "Choose a soft or medium brush. Manual and electric brushes both work well when used properly."
          ),
          t(
            "Cho‘tkani har 3 oyda yoki tuklari yoyilib ketganda almashtiring.",
            "Меняйте щётку каждые 3 месяца или когда щетинки растрепались.",
            "Replace your brush every 3 months, or sooner if the bristles are splayed."
          ),
          t(
            "Nordon ovqat yoki ichimlikdan (sharbat, gazli ichimlik) keyin darhol emas, taxminan bir soat o‘tib tozalang.",
            "После кислой еды и напитков (сок, газировка) чистите зубы не сразу, а примерно через час.",
            "After acidic food or drinks (juice, fizzy drinks), wait about an hour before brushing."
          ),
          t(
            "Shirinlik va shirin ichimliklarni kamaytiring, ularni asosan ovqat vaqtida iste’mol qiling.",
            "Ограничьте сладкое и сладкие напитки, лучше — только во время основных приёмов пищи.",
            "Cut down on sugary foods and drinks, and keep them to mealtimes."
          ),
          t(
            "Har 6–12 oyda yoki shifokor aytgan muddatda stomatologik ko‘rikdan o‘ting.",
            "Проходите осмотр у стоматолога раз в 6–12 месяцев или так часто, как советует врач.",
            "Have a dental check-up every 6–12 months, or as often as your dentist advises."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Tozalaganda milk 2 haftadan ortiq qonasa.",
        "Дёсны кровоточат при чистке дольше 2 недель.",
        "Your gums bleed when brushing for more than 2 weeks."
      ),
      t(
        "Tishlar sovuq yoki issiqqa uzoq vaqt sezgir bo‘lib qolsa yoki og‘risa.",
        "Зубы долго реагируют на холодное или горячее либо болят.",
        "Teeth stay sensitive to hot or cold, or start to ache."
      ),
      t(
        "Og‘izda 3 haftadan ortiq bitmayotgan yara, oq yoki qizil dog‘ bo‘lsa.",
        "Во рту есть язвочка, белое или красное пятно, которое не проходит больше 3 недель.",
        "You have a mouth ulcer or a white or red patch that hasn’t healed in 3 weeks."
      ),
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────
  {
    id: 'interdental',
    icon: 'floss',
    minutes: 3,
    title: t("Tish ipi va tishlararo cho‘tkalar", "Зубная нить и межзубные ёршики", "Flossing and interdental brushes"),
    summary: t(
      "Cho‘tka yetmaydigan joylarni kuniga bir marta tozalang.",
      "Раз в день очищайте места, куда не достаёт щётка.",
      "Once a day, clean where your toothbrush can’t reach."
    ),
    intro: t(
      "Tish cho‘tkasi tishlar orasidagi tor joylarga yetib bormaydi, karies va milk yallig‘lanishi esa ko‘pincha aynan shu yerda boshlanadi. Tishlar orasini kuniga bir marta tozalash yetarli — masalan, kechqurun tish yuvishdan oldin.",
      "Щётка не достаёт до узких промежутков между зубами, а кариес и воспаление дёсен часто начинаются именно там. Достаточно очищать межзубные промежутки раз в день — например, вечером перед чисткой зубов.",
      "A toothbrush can’t reach the tight spaces between teeth, and that is often where decay and gum inflammation start. Cleaning between your teeth once a day is enough — for example, in the evening before you brush."
    ),
    sections: [
      {
        title: t("Tish ipi bilan", "Зубная нить", "Using floss"),
        kind: 'steps',
        items: [
          t(
            "Taxminan 40 sm ip oling va uchlarini ikki qo‘lingizning o‘rta barmoqlariga o‘rang.",
            "Отмотайте около 40 см нити и намотайте концы на средние пальцы обеих рук.",
            "Take about 40 cm of floss and wind the ends around the middle fingers of each hand."
          ),
          t(
            "Ipni bosh va ko‘rsatkich barmoqlar bilan tarang tutib, tishlar orasiga sekin, arralash harakati bilan kiriting.",
            "Натяните нить большими и указательными пальцами и мягко введите её между зубами пилящими движениями.",
            "Hold it tight between thumbs and forefingers and ease it between the teeth with a gentle sawing motion."
          ),
          t(
            "Ipni tish atrofida «C» harfi shaklida egib, milk ostiga ozgina tushiring va yuqoriga-pastga suring.",
            "Обогните нитью зуб в форме буквы «С», слегка заведите под десну и проведите вверх-вниз.",
            "Curve the floss into a “C” shape around the tooth, slide it just under the gum and move it up and down."
          ),
          t(
            "Har bir oraliq uchun ipning toza qismidan foydalaning.",
            "Для каждого промежутка используйте чистый участок нити.",
            "Use a clean section of floss for each gap."
          ),
          t(
            "Ipni milkka keskin urmang — bu milkni jarohatlashi mumkin.",
            "Не дёргайте нить резко в десну — так её можно травмировать.",
            "Don’t snap the floss into the gum — it can hurt it."
          ),
        ],
      },
      {
        title: t("Tishlararo cho‘tkalar", "Межзубные ёршики", "Interdental brushes"),
        kind: 'bullets',
        items: [
          t(
            "Tishlar orasi kengroq bo‘lsa yoki breket, ko‘prik, implant bo‘lsa, tishlararo cho‘tka ko‘pincha ipdan qulayroq.",
            "Если промежутки шире или есть брекеты, мост, импланты, межзубный ёршик часто удобнее нити.",
            "If the gaps are wider, or you have braces, a bridge or implants, interdental brushes are often easier than floss."
          ),
          t(
            "Cho‘tka oraliqqa zo‘riqishsiz, lekin zich kirishi kerak. Turli joylarga turli o‘lcham kerak bo‘lishi mumkin — mos o‘lchamni stomatolog yoki gigiyenist tanlab beradi.",
            "Ёршик должен входить плотно, но без усилия. Для разных промежутков могут понадобиться разные размеры — подобрать их поможет стоматолог или гигиенист.",
            "The brush should fit snugly without forcing it. Different gaps may need different sizes — your dentist or hygienist can help you choose."
          ),
          t(
            "Cho‘tkani sekin kiriting va bir necha marta oldinga-orqaga yuriting. Hech qachon kuch bilan tiqmang.",
            "Вводите ёршик медленно и проведите им несколько раз вперёд-назад. Никогда не проталкивайте силой.",
            "Insert it gently and move it back and forth a few times. Never force it in."
          ),
          t(
            "Suvli irrigator qo‘shimcha yordamchi bo‘lishi mumkin, ayniqsa breket yoki implant bo‘lsa.",
            "Ирригатор может быть полезным дополнением, особенно при брекетах или имплантах.",
            "A water flosser can be a useful extra, especially with braces or implants."
          ),
          t(
            "Boshida milk biroz qonashi mumkin. Bu odatda 1–2 hafta ichida, milk sog‘aygan sari to‘xtaydi. Tozalashni to‘xtatmang.",
            "Вначале дёсны могут немного кровоточить. Обычно это проходит за 1–2 недели по мере заживления. Не прекращайте чистку.",
            "Your gums may bleed a little at first. This usually stops within 1–2 weeks as they heal — keep going."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Qonash 2 haftadan keyin ham to‘xtamasa.",
        "Кровоточивость не проходит через 2 недели.",
        "Bleeding hasn’t stopped after 2 weeks."
      ),
      t(
        "Tishlar orasiga doim ovqat tiqilib, og‘riq bersa.",
        "Между зубами постоянно застревает еда и это вызывает боль.",
        "Food keeps getting stuck between teeth and it hurts."
      ),
      t(
        "Milk shishgan, og‘riqli bo‘lsa yoki tish qimirlay boshlasa.",
        "Десна опухла, болит или зуб начал шататься.",
        "Your gum is swollen or sore, or a tooth feels loose."
      ),
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────
  {
    id: 'toothache',
    icon: 'pain',
    minutes: 3,
    title: t("Tish og‘riganda birinchi yordam", "Первая помощь при зубной боли", "Toothache first aid"),
    summary: t(
      "Stomatologga borguncha og‘riqni qanday yengillatish mumkin.",
      "Как облегчить боль до визита к стоматологу.",
      "How to ease the pain until you see a dentist."
    ),
    intro: t(
      "Tish og‘rig‘i — tish yoki milkda muammo borligi haqidagi signal. Quyidagi maslahatlar og‘riqni vaqtincha yengillatadi, lekin sababini faqat stomatolog davolaydi. Iloji boricha tezroq qabulga yoziling.",
      "Зубная боль — сигнал о проблеме с зубом или десной. Эти советы помогут временно облегчить боль, но устранить причину может только стоматолог. Запишитесь на приём как можно скорее.",
      "Toothache is a sign that something is wrong with a tooth or the gum. These tips can ease the pain for now, but only a dentist can treat the cause. Book an appointment as soon as you can."
    ),
    sections: [
      {
        title: t("Hozir nima qilish mumkin", "Что можно сделать сейчас", "What you can do now"),
        kind: 'steps',
        items: [
          t(
            "Og‘izni iliq tuzli suv bilan chayqang (bir stakan iliq suvga yarim choy qoshiq tuz).",
            "Прополощите рот тёплой солёной водой (половина чайной ложки соли на стакан тёплой воды).",
            "Rinse with warm salty water (half a teaspoon of salt in a glass of warm water)."
          ),
          t(
            "Tishlar orasiga ovqat tiqilgan bo‘lsa, ip bilan ehtiyotkorlik bilan olib tashlang.",
            "Если между зубами застряла еда, аккуратно уберите её нитью.",
            "If food is stuck between your teeth, gently remove it with floss."
          ),
          t(
            "Yuz shishgan bo‘lsa, yonoqqa sochiqqa o‘ralgan sovuq narsani 15–20 daqiqa qo‘ying.",
            "Если щека отекла, приложите к ней что-то холодное, завёрнутое в полотенце, на 15–20 минут.",
            "If your face is swollen, hold something cold wrapped in a cloth against your cheek for 15–20 minutes."
          ),
          t(
            "Kerak bo‘lsa, dorixonadagi retseptsiz og‘riq qoldiruvchi vositadan foydalaning — yo‘riqnomaga amal qiling yoki farmatsevtdan so‘rang.",
            "При необходимости примите безрецептурное обезболивающее — строго по инструкции или по совету фармацевта.",
            "If needed, take an over-the-counter painkiller — follow the leaflet or ask a pharmacist."
          ),
          t(
            "Og‘riyotgan tomon bilan chaynamang. Juda issiq, sovuq va shirin ovqatlardan saqlaning.",
            "Не жуйте больной стороной. Избегайте очень горячего, холодного и сладкого.",
            "Chew on the other side and avoid very hot, cold or sweet food."
          ),
          t(
            "Uxlaganda boshingizni biroz balandroq qo‘ying — bu zirqirashni kamaytirishi mumkin.",
            "Во время сна держите голову чуть выше — пульсирующая боль может уменьшиться.",
            "Raise your head on an extra pillow at night — it can ease throbbing pain."
          ),
        ],
      },
      {
        title: t("Nima qilmaslik kerak", "Чего делать не стоит", "What not to do"),
        kind: 'bullets',
        items: [
          t(
            "Tabletkani milk yoki tish ustiga qo‘ymang — u og‘iz shilliq qavatini kuydiradi.",
            "Не кладите таблетку на десну или зуб — она обжигает слизистую.",
            "Don’t put a tablet directly on the gum or tooth — it can burn the inside of your mouth."
          ),
          t(
            "Yuzga issiq kompress qo‘ymang — yallig‘lanish kuchayishi mumkin.",
            "Не грейте щёку — воспаление может усилиться.",
            "Don’t put heat on your face — it can make swelling worse."
          ),
          t(
            "Antibiotikni o‘zingiz boshlamang. U og‘riq sababini yo‘qotmaydi va faqat shifokor ko‘rsatmasi bilan ichiladi.",
            "Не начинайте антибиотики самостоятельно. Они не устраняют причину боли и принимаются только по назначению врача.",
            "Don’t start antibiotics on your own. They don’t fix the cause of toothache and should only be taken when prescribed."
          ),
          t(
            "Og‘riq kamaysa ham, qabulni bekor qilmang — muammo yo‘qolgan degani emas.",
            "Не отменяйте приём, даже если боль утихла, — проблема от этого не исчезла.",
            "Don’t cancel your appointment if the pain eases — the problem hasn’t gone away."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Yuz, ko‘z atrofi yoki bo‘yin shishib ketsa, yutish yoki nafas olish qiyinlashsa — darhol tez yordam chaqiring.",
        "Отекает лицо, область вокруг глаза или шея, трудно глотать или дышать — немедленно вызывайте скорую.",
        "Swelling spreads to your eye or neck, or you find it hard to swallow or breathe — call emergency services straight away."
      ),
      t(
        "Og‘riq bilan birga isitma yoki kuchli holsizlik bo‘lsa.",
        "Боль сопровождается температурой или сильной слабостью.",
        "You have a fever or feel generally unwell along with the pain."
      ),
      t(
        "Og‘riq kuchli bo‘lib, og‘riq qoldiruvchi yordam bermasa.",
        "Боль сильная и обезболивающие не помогают.",
        "The pain is severe and painkillers aren’t helping."
      ),
      t(
        "Milkda yiring yoki bo‘rtma paydo bo‘lsa, og‘izda yoqimsiz ta’m bo‘lsa.",
        "На десне появился гной или шишка, во рту неприятный привкус.",
        "There is pus or a lump on the gum, or a bad taste in your mouth."
      ),
      t(
        "Og‘riq jarohat yoki zarbadan keyin boshlangan bo‘lsa.",
        "Боль началась после травмы или удара.",
        "The pain started after an injury."
      ),
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────
  {
    id: 'extraction',
    icon: 'extraction',
    minutes: 4,
    title: t("Tish olingandan keyin", "После удаления зуба", "After a tooth extraction"),
    summary: t(
      "Birinchi 24 soat, nimadan saqlanish va xavfli belgilar.",
      "Первые 24 часа, чего избегать и тревожные признаки.",
      "The first 24 hours, what to avoid and warning signs."
    ),
    intro: t(
      "Tish olingan joyda qon laxtasi hosil bo‘ladi — u yarani himoya qiladi va bitishiga yordam beradi. Birinchi kunlardagi asosiy vazifa — shu laxtani saqlab qolish.",
      "В лунке после удаления образуется сгусток крови — он защищает рану и помогает ей зажить. Главная задача первых дней — сохранить этот сгусток.",
      "A blood clot forms in the socket after a tooth is removed. It protects the wound and helps it heal, so the main job in the first days is to keep that clot in place."
    ),
    sections: [
      {
        title: t("Birinchi 24 soat", "Первые 24 часа", "The first 24 hours"),
        kind: 'steps',
        items: [
          t(
            "Doka tamponni 30–45 daqiqa mahkam tishlab turing.",
            "Плотно держите марлевый тампон прикушенным 30–45 минут.",
            "Bite firmly on the gauze pad for 30–45 minutes."
          ),
          t(
            "Qon ketishi davom etsa, toza dokani buklab, yana 20–30 daqiqa bosib turing. Birinchi kun so‘lakda ozgina qon bo‘lishi odatiy.",
            "Если кровь не останавливается, сложите чистую марлю и прикусите ещё на 20–30 минут. Немного крови в слюне в первый день — это нормально.",
            "If it keeps bleeding, fold a clean piece of gauze and bite on it for another 20–30 minutes. A little blood in your saliva on the first day is normal."
          ),
          t(
            "Uyushish o‘tguncha ovqatlanmang va issiq ichmang — lab yoki yonoqni bilmay tishlab olishingiz yoki kuydirishingiz mumkin.",
            "Пока не прошло онемение, не ешьте и не пейте горячее — можно незаметно прикусить или обжечь губу или щёку.",
            "Don’t eat or have hot drinks until the numbness wears off — you could bite or burn your lip or cheek without noticing."
          ),
          t(
            "Yumshoq, iliq yoki sovuq ovqat yeng (qatiq, pyure, iliq sho‘rva). Boshqa tomon bilan chaynang.",
            "Ешьте мягкую тёплую или прохладную пищу (йогурт, пюре, тёплый суп). Жуйте другой стороной.",
            "Eat soft, lukewarm or cool food (yoghurt, mashed potato, lukewarm soup) and chew on the other side."
          ),
          t(
            "Shish uchun yonoqqa sochiqqa o‘ralgan sovuq kompressni 15–20 daqiqadan qo‘yib turing.",
            "При отёке прикладывайте к щеке холод, завёрнутый в ткань, на 15–20 минут.",
            "For swelling, hold a cold pack wrapped in a cloth on your cheek for 15–20 minutes at a time."
          ),
          t(
            "Uxlaganda boshingizni qo‘shimcha yostiq bilan balandroq qo‘ying.",
            "Спите с приподнятой головой, подложив лишнюю подушку.",
            "Sleep with your head raised on an extra pillow."
          ),
        ],
      },
      {
        title: t("Nimalardan saqlanish kerak", "Чего избегать", "What to avoid"),
        kind: 'bullets',
        items: [
          t(
            "Birinchi 24 soat og‘izni chayqamang va kuchli tupurmang.",
            "Первые 24 часа не полощите рот и не сплёвывайте с силой.",
            "Don’t rinse your mouth or spit forcefully for the first 24 hours."
          ),
          t(
            "Somonchadan (trubochkadan) ichmang — so‘rish laxtani ko‘chirib yuborishi mumkin.",
            "Не пейте через трубочку — всасывание может сместить сгусток.",
            "Don’t drink through a straw — the suction can dislodge the clot."
          ),
          t(
            "Kamida 24 soat, iloji bo‘lsa undan ham ko‘proq chekmang va spirtli ichimlik ichmang.",
            "Не курите и не пейте алкоголь хотя бы 24 часа, а лучше дольше.",
            "Don’t smoke or drink alcohol for at least 24 hours — longer if you can."
          ),
          t(
            "Bir-ikki kun og‘ir jismoniy ish va sport bilan shug‘ullanmang.",
            "Один-два дня избегайте тяжёлых физических нагрузок и спорта.",
            "Avoid strenuous exercise for a day or two."
          ),
          t(
            "Yarani til yoki barmoq bilan bezovta qilmang.",
            "Не трогайте лунку языком или пальцами.",
            "Don’t poke the socket with your tongue or fingers."
          ),
        ],
      },
      {
        title: t("24 soatdan keyin", "Через 24 часа", "After 24 hours"),
        kind: 'bullets',
        items: [
          t(
            "Taxminan bir hafta davomida ovqatdan keyin og‘izni iliq tuzli suv bilan sekin chayqang.",
            "Примерно неделю после еды мягко полощите рот тёплой солёной водой.",
            "For about a week, gently rinse with warm salty water after meals."
          ),
          t(
            "Boshqa tishlarni odatdagidek tozalang, yara atrofida ehtiyot bo‘ling.",
            "Чистите остальные зубы как обычно, осторожно возле лунки.",
            "Brush your other teeth as normal, taking care around the socket."
          ),
          t(
            "Shish va og‘riq odatda 2–3-kunda eng kuchli bo‘lib, keyin kamayadi. Og‘riq qoldiruvchi kerak bo‘lsa, yo‘riqnomaga amal qiling yoki farmatsevtdan so‘rang. Shifokor dori yozgan bo‘lsa, uning ko‘rsatmasiga amal qiling.",
            "Отёк и боль обычно сильнее всего на 2–3-й день, затем уменьшаются. Обезболивающие — по инструкции или по совету фармацевта. Если врач что-то назначил, следуйте его указаниям.",
            "Swelling and soreness usually peak on day 2–3 and then settle. If you need a painkiller, follow the leaflet or ask a pharmacist. If your dentist prescribed something, follow their instructions."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "2–4 kundan keyin og‘riq kamayish o‘rniga kuchaysa, quloqqa tarqalsa, og‘izda yoqimsiz hid yoki ta’m paydo bo‘lsa, lunka bo‘sh ko‘rinsa — bu quruq lunka (alveolit) belgisi bo‘lishi mumkin.",
        "Через 2–4 дня боль не стихает, а усиливается, отдаёт в ухо, появился неприятный запах или привкус, лунка выглядит пустой — это может быть сухая лунка (альвеолит).",
        "After 2–4 days the pain gets worse instead of better, spreads to your ear, there is a bad taste or smell, or the socket looks empty — this may be a dry socket."
      ),
      t(
        "30 daqiqa bosib turgandan keyin ham qon ketishi to‘xtamasa.",
        "Кровотечение не останавливается после 30 минут давления.",
        "Bleeding doesn’t stop after 30 minutes of firm pressure."
      ),
      t(
        "Isitma chiqsa, yiring paydo bo‘lsa yoki shish 3-kundan keyin ham kattalashsa.",
        "Поднялась температура, появился гной или отёк продолжает расти после 3-го дня.",
        "You develop a fever, there is pus, or the swelling is still growing after day 3."
      ),
      t(
        "Lab, iyak yoki tildagi uyushish ertasi kungacha o‘tmasa.",
        "Онемение губы, подбородка или языка не прошло к следующему дню.",
        "Numbness of the lip, chin or tongue hasn’t worn off by the next day."
      ),
      t(
        "Yutish yoki nafas olish qiyinlashsa — darhol shoshilinch yordamga murojaat qiling.",
        "Стало трудно глотать или дышать — немедленно обращайтесь за неотложной помощью.",
        "You find it hard to swallow or breathe — get emergency help straight away."
      ),
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────
  {
    id: 'filling',
    icon: 'filling',
    minutes: 3,
    title: t("Plomba yoki kanal davolashdan keyin", "После пломбы или лечения каналов", "After a filling or root canal"),
    summary: t(
      "Sezuvchanlik, chaynash va vaqtinchalik plomba haqida.",
      "О чувствительности, жевании и временной пломбе.",
      "Sensitivity, chewing and temporary fillings."
    ),
    intro: t(
      "Davolangan tish odatda tez moslashadi. Bir necha kun yengil noqulaylik bo‘lishi tabiiy. Quyidagi maslahatlar tishni asrashga yordam beradi.",
      "Пролеченный зуб обычно быстро привыкает. Небольшой дискомфорт в течение нескольких дней — это нормально. Эти советы помогут сохранить зуб.",
      "A treated tooth usually settles quickly, and mild discomfort for a few days is normal. These tips help protect it."
    ),
    sections: [
      {
        title: t("Plombadan keyin", "После пломбы", "After a filling"),
        kind: 'bullets',
        items: [
          t(
            "Uyushish odatda 1–3 soatda o‘tadi. Shu vaqtgacha chaynamang va issiq ichmang.",
            "Онемение обычно проходит за 1–3 часа. До этого не жуйте и не пейте горячее.",
            "Numbness usually wears off in 1–3 hours. Until then, don’t chew or have hot drinks."
          ),
          t(
            "Tish rangidagi plomba darhol qotadi. Metall (amalgama) plomba qo‘yilgan bo‘lsa, 24 soat shu tomon bilan qattiq ovqat chaynamang.",
            "Пломба цвета зуба затвердевает сразу. Если поставлена металлическая (амальгамовая), 24 часа не жуйте твёрдое этой стороной.",
            "Tooth-coloured fillings set straight away. If you have a metal (amalgam) filling, avoid chewing hard food on that side for 24 hours."
          ),
          t(
            "Bir necha kun yoki hafta davomida sovuq-issiqqa sezuvchanlik bo‘lishi mumkin — u asta-sekin kamayadi.",
            "Чувствительность к холодному и горячему может сохраняться от нескольких дней до пары недель и постепенно проходит.",
            "Sensitivity to hot and cold can last from a few days to a couple of weeks and gradually fades."
          ),
          t(
            "Tishlaganda plomba «baland» tuyulsa, kutmang — stomatolog uni bir necha daqiqada to‘g‘rilab beradi. Aks holda tish og‘rishi mumkin.",
            "Если при смыкании пломба кажется «высокой», не ждите — стоматолог подправит её за несколько минут. Иначе зуб может начать болеть.",
            "If the filling feels “high” when you bite, don’t wait — your dentist can adjust it in a few minutes. Left alone, it can make the tooth sore."
          ),
        ],
      },
      {
        title: t("Kanal (ildiz) davolashdan keyin", "После лечения каналов", "After root canal treatment"),
        kind: 'bullets',
        items: [
          t(
            "Bir necha kun tishlaganda yengil og‘riq yoki noqulaylik bo‘lishi odatiy.",
            "Несколько дней зуб может слегка болеть при накусывании — это нормально.",
            "It is normal for the tooth to feel tender when biting for a few days."
          ),
          t(
            "Kerak bo‘lsa, retseptsiz og‘riq qoldiruvchidan foydalaning — yo‘riqnomaga amal qiling yoki farmatsevtdan so‘rang.",
            "При необходимости — безрецептурное обезболивающее по инструкции или по совету фармацевта.",
            "If needed, use an over-the-counter painkiller — follow the leaflet or ask a pharmacist."
          ),
          t(
            "Vaqtinchalik plomba bo‘lsa, doimiy plomba yoki qoplama qo‘yilguncha shu tomon bilan qattiq va yopishqoq ovqat chaynamang.",
            "Если стоит временная пломба, до постоянной пломбы или коронки не жуйте этой стороной твёрдое и липкое.",
            "If you have a temporary filling, avoid hard and sticky food on that side until the permanent filling or crown is placed."
          ),
          t(
            "Kanal davolangan orqa tishlar mo‘rtroq bo‘lishi mumkin, shuning uchun ko‘pincha qoplama (koronka) tavsiya qilinadi. Keyingi qabulni qoldirmang.",
            "Зубы после лечения каналов, особенно жевательные, становятся более хрупкими, поэтому часто рекомендуют коронку. Не пропускайте следующий приём.",
            "Back teeth can become more brittle after root canal treatment, so a crown is often recommended. Don’t skip the next appointment."
          ),
          t(
            "Tishni odatdagidek tozalang va tishlar orasini tozalashni davom ettiring.",
            "Чистите зуб как обычно и продолжайте очищать межзубные промежутки.",
            "Keep brushing and cleaning between your teeth as normal."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Og‘riq 2–3 kundan keyin kamayish o‘rniga kuchaysa.",
        "Через 2–3 дня боль не уменьшается, а нарастает.",
        "The pain gets worse rather than better after 2–3 days."
      ),
      t(
        "Milk yoki yuz shishsa, isitma chiqsa.",
        "Отекает десна или лицо, поднимается температура.",
        "Your gum or face swells, or you develop a fever."
      ),
      t(
        "Vaqtinchalik plomba tushib ketsa yoki tish sinsa.",
        "Выпала временная пломба или откололся зуб.",
        "The temporary filling falls out or the tooth breaks."
      ),
      t(
        "Tishlash noqulay bo‘lsa, plomba baland tuyulsa.",
        "Неудобно смыкать зубы, пломба мешает.",
        "Your bite feels uneven or the filling feels high."
      ),
      t(
        "Toshma, qichishish yoki boshqa allergiya belgilari paydo bo‘lsa.",
        "Появились сыпь, зуд или другие признаки аллергии.",
        "You notice a rash, itching or other signs of an allergic reaction."
      ),
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────
  {
    id: 'gums',
    icon: 'gums',
    minutes: 3,
    title: t("Milk qonashi", "Кровоточивость дёсен", "Bleeding gums"),
    summary: t(
      "Nima uchun qonaydi va nima qilish kerak.",
      "Почему кровоточат дёсны и что делать.",
      "Why gums bleed and what to do about it."
    ),
    intro: t(
      "Milk qonashi ko‘pincha milk yallig‘lanishi (gingivit) belgisi. Uning asosiy sababi — tish yuzasida to‘planadigan blyashka. Yaxshi xabar: erta bosqichda gingivit to‘liq qaytadi va yaxshi parvarish bilan qonash odatda 1–2 hafta ichida to‘xtaydi.",
      "Кровоточивость дёсен чаще всего — признак воспаления (гингивита). Основная причина — налёт на зубах. Хорошая новость: на ранней стадии гингивит полностью обратим, и при хорошем уходе кровоточивость обычно проходит за 1–2 недели.",
      "Bleeding gums are most often a sign of gum inflammation (gingivitis), mainly caused by plaque building up on the teeth. The good news: early gingivitis is fully reversible, and with good cleaning the bleeding usually stops within 1–2 weeks."
    ),
    sections: [
      {
        title: t("Ko‘p uchraydigan sabablar", "Частые причины", "Common causes"),
        kind: 'bullets',
        items: [
          t(
            "Blyashka va tish toshi — eng ko‘p uchraydigan sabab.",
            "Налёт и зубной камень — самая частая причина.",
            "Plaque and tartar — by far the most common cause."
          ),
          t(
            "Juda qattiq cho‘tka yoki kuch bilan tozalash.",
            "Слишком жёсткая щётка или чистка с силой.",
            "A hard toothbrush or brushing too hard."
          ),
          t(
            "Tish ipini endi boshlaganda — dastlabki kunlarda.",
            "Начало использования нити — в первые дни.",
            "Starting to floss — in the first few days."
          ),
          t(
            "Paradontit — milk va suyakni zararlovchi chuqurroq kasallik.",
            "Пародонтит — более глубокое заболевание, затрагивающее десну и кость.",
            "Periodontitis — a deeper gum disease that affects the bone."
          ),
          t(
            "Homiladorlik paytidagi gormonal o‘zgarishlar.",
            "Гормональные изменения во время беременности.",
            "Hormonal changes during pregnancy."
          ),
          t(
            "Qonni suyultiruvchi dorilar va qandli diabet. Chekish esa qonashni yashirib, kasallikni sezdirmasligi mumkin.",
            "Препараты, разжижающие кровь, и сахарный диабет. Курение же может скрывать кровоточивость и маскировать болезнь.",
            "Blood-thinning medicines and diabetes. Smoking can hide bleeding and mask gum disease."
          ),
          t(
            "Kamdan-kam hollarda — qon kasalliklari yoki vitamin yetishmovchiligi.",
            "Редко — болезни крови или нехватка витаминов.",
            "Rarely — blood disorders or vitamin deficiency."
          ),
        ],
      },
      {
        title: t("Nima qilish kerak", "Что делать", "What to do"),
        kind: 'steps',
        items: [
          t(
            "Tozalashni to‘xtatmang — aksincha, kuniga ikki marta yumshoq cho‘tka bilan ehtiyotkorlik bilan tozalang.",
            "Не прекращайте чистку — наоборот, чистите дважды в день мягкой щёткой, бережно.",
            "Don’t stop brushing — brush gently twice a day with a soft brush."
          ),
          t(
            "Har kuni tish ipi yoki tishlararo cho‘tka bilan tishlar orasini tozalang.",
            "Каждый день очищайте межзубные промежутки нитью или ёршиком.",
            "Clean between your teeth every day with floss or interdental brushes."
          ),
          t(
            "Stomatolog yoki gigiyenistga ko‘rining — tish toshini faqat professional tozalash olib tashlaydi.",
            "Обратитесь к стоматологу или гигиенисту — зубной камень удаляется только профессиональной чисткой.",
            "See your dentist or hygienist — tartar can only be removed by a professional clean."
          ),
          t(
            "Chekishni tashlang — bu milk sog‘lig‘i uchun eng katta foydalardan biri.",
            "Бросьте курить — это одно из лучшего, что можно сделать для дёсен.",
            "Stop smoking — it is one of the best things you can do for your gums."
          ),
          t(
            "Qonni suyultiruvchi dori ichsangiz, uni o‘zingiz to‘xtatmang — avval shifokoringiz bilan maslahatlashing.",
            "Если вы принимаете препараты, разжижающие кровь, не отменяйте их сами — сначала посоветуйтесь с врачом.",
            "If you take blood thinners, don’t stop them yourself — talk to your doctor first."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "2 hafta yaxshi parvarishdan keyin ham qonash to‘xtamasa.",
        "Кровоточивость не проходит после 2 недель хорошего ухода.",
        "Bleeding continues after 2 weeks of good cleaning."
      ),
      t(
        "Tishlar qimirlasa yoki milk pastga tushib, tish ildizi ochila boshlasa.",
        "Зубы шатаются или десна опускается, обнажая корни.",
        "Teeth feel loose, or your gums are shrinking back from the teeth."
      ),
      t(
        "Milkdan yiring chiqsa yoki og‘izda doimiy yoqimsiz ta’m bo‘lsa.",
        "Из десны выделяется гной или во рту постоянно неприятный привкус.",
        "There is pus from the gums or a constant bad taste."
      ),
      t(
        "Milk o‘z-o‘zidan qonasa, tanada sababsiz ko‘karishlar, burundan tez-tez qon ketishi yoki kuchli holsizlik bo‘lsa — umumiy shifokorga ham murojaat qiling.",
        "Дёсны кровоточат сами по себе, есть беспричинные синяки, частые носовые кровотечения или сильная слабость — обратитесь также к терапевту.",
        "Gums bleed on their own, or you have unexplained bruising, frequent nosebleeds or unusual tiredness — see your doctor as well."
      ),
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────
  {
    id: 'children',
    icon: 'child',
    minutes: 4,
    title: t("Bolalar tishlari", "Зубы у детей", "Children’s teeth"),
    summary: t(
      "Birinchi tishdan birinchi stomatolog qabuligacha.",
      "От первого зуба до первого визита к стоматологу.",
      "From the first tooth to the first dental visit."
    ),
    intro: t(
      "Sut tishlari vaqtinchalik bo‘lsa ham juda muhim: ular bolaga chaynash, gapirish va doimiy tishlar uchun joy saqlashda yordam beradi. Sog‘lom odatlar birinchi tishdan boshlanadi.",
      "Молочные зубы временные, но очень важны: они помогают ребёнку жевать, говорить и сохраняют место для постоянных зубов. Полезные привычки начинаются с первого зуба.",
      "Baby teeth are temporary but very important: they help your child chew and speak, and they hold space for the adult teeth. Good habits start with the very first tooth."
    ),
    sections: [
      {
        title: t("Birinchi tish", "Первый зуб", "The first tooth"),
        kind: 'bullets',
        items: [
          t(
            "Birinchi tish ko‘pincha 6 oylik atrofida chiqadi, lekin 4 oydan 12 oygacha bo‘lgan muddat ham normal.",
            "Первый зуб обычно появляется около 6 месяцев, но нормой считается и срок от 4 до 12 месяцев.",
            "The first tooth usually appears around 6 months, but anywhere from 4 to 12 months is normal."
          ),
          t(
            "Tish chiqayotganda sovutilgan (muzlatilmagan) tishlash halqasi yoki milkni toza barmoq bilan yengil uqalash yordam beradi.",
            "При прорезывании помогает охлаждённое (не замороженное) кольцо-прорезыватель или лёгкий массаж десны чистым пальцем.",
            "When teething, a chilled (not frozen) teething ring or gently rubbing the gum with a clean finger can help."
          ),
          t(
            "Birinchi tish chiqishi bilan uni kuniga ikki marta yumshoq bolalar cho‘tkasi bilan tozalashni boshlang.",
            "Как только появился первый зуб, начинайте чистить его дважды в день мягкой детской щёткой.",
            "As soon as the first tooth comes through, brush it twice a day with a soft baby toothbrush."
          ),
        ],
      },
      {
        title: t("Ftorli pasta miqdori yoshga qarab", "Сколько пасты с фтором по возрасту", "Fluoride toothpaste by age"),
        kind: 'bullets',
        items: [
          t(
            "3 yoshgacha: guruch donidek yupqa surtma (kamida 1000 ppm ftorli pasta).",
            "До 3 лет: тонкий мазок размером с рисовое зёрнышко (паста не менее 1000 ppm фтора).",
            "Under 3: a smear the size of a grain of rice (toothpaste with at least 1,000 ppm fluoride)."
          ),
          t(
            "3–6 yosh: no‘xatdek miqdor (1000–1500 ppm ftorli pasta).",
            "3–6 лет: количество размером с горошину (паста 1000–1500 ppm фтора).",
            "Ages 3–6: a pea-sized amount (toothpaste with 1,000–1,500 ppm fluoride)."
          ),
          t(
            "6 yoshdan katta: no‘xatdek miqdor, oilaviy pasta (1350–1500 ppm).",
            "Старше 6 лет: горошина обычной «семейной» пасты (1350–1500 ppm).",
            "Over 6: a pea-sized amount of family toothpaste (1,350–1,500 ppm)."
          ),
          t(
            "Bola pastani tupursin, lekin chayqamasin. Taxminan 7–8 yoshgacha kattalar tozalab bersin yoki kuzatib tursin.",
            "Ребёнок должен сплюнуть пасту, но не полоскать рот. Примерно до 7–8 лет взрослые чистят зубы ребёнку или следят за чисткой.",
            "Teach your child to spit, not rinse. Brush for them or supervise until about age 7–8."
          ),
        ],
      },
      {
        title: t("Shisha bilan bog‘liq kariesning oldini olish", "Как избежать «бутылочного» кариеса", "Preventing bottle caries"),
        kind: 'bullets',
        items: [
          t(
            "Bolani sut, aralashma yoki sharbat solingan shisha bilan uxlatmang — kechasi tishlar shu shakar ichida qoladi.",
            "Не укладывайте ребёнка спать с бутылочкой молока, смеси или сока — ночью зубы остаются в сахаре.",
            "Don’t put your baby to bed with a bottle of milk, formula or juice — the sugar sits on the teeth all night."
          ),
          t(
            "Kechasi chanqasa, faqat oddiy suv bering.",
            "Если ребёнок хочет пить ночью, давайте только простую воду.",
            "If your child is thirsty at night, offer plain water only."
          ),
          t(
            "6 oylikdan boshlab ochiq stakandan ichishni o‘rgating va taxminan 1 yoshda shishadan voz kechishga harakat qiling.",
            "С 6 месяцев приучайте пить из открытой чашки и постарайтесь отказаться от бутылочки примерно к году.",
            "From 6 months, introduce an open cup and aim to stop using bottles by around age 1."
          ),
          t(
            "Shirin ichimlik va shirinliklarni cheklang; bersangiz, asosiy ovqat vaqtida bering.",
            "Ограничьте сладкие напитки и сладости; если даёте — только во время основной еды.",
            "Limit sugary drinks and sweets, and keep them to mealtimes."
          ),
          t(
            "Qoshiq yoki so‘rg‘ichni avval o‘z og‘zingizga solib, keyin bolaga bermang — karies bakteriyalari o‘tishi mumkin.",
            "Не облизывайте ложку или соску перед тем, как дать ребёнку, — так передаются бактерии кариеса.",
            "Don’t lick your baby’s spoon or dummy — decay-causing bacteria can be passed on."
          ),
        ],
      },
      {
        title: t("Birinchi stomatolog qabuli", "Первый визит к стоматологу", "The first dental visit"),
        kind: 'bullets',
        items: [
          t(
            "Birinchi tish chiqqandan keyin, 1 yoshdan kechiktirmay stomatologga ko‘rsating.",
            "Покажите ребёнка стоматологу после появления первого зуба, но не позже года.",
            "Take your child to the dentist when the first tooth appears, and no later than their first birthday."
          ),
          t(
            "Keyin shifokor aytgan muddatda, odatda har 6–12 oyda, ko‘rikka boring. Shifokor tishlarga ftorli lak surtishni taklif qilishi mumkin.",
            "Дальше — осмотры с интервалом, который советует врач, обычно раз в 6–12 месяцев. Врач может предложить покрытие зубов фторлаком.",
            "After that, go as often as your dentist advises, usually every 6–12 months. They may offer fluoride varnish for extra protection."
          ),
          t(
            "Qabulni qiziqarli sayohat sifatida tanishtiring, shifokor bilan bolani qo‘rqitmang.",
            "Рассказывайте о визите как о интересном приключении и не пугайте ребёнка врачом.",
            "Talk about the visit as something fun, and never use the dentist as a threat."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Tishlarda, ayniqsa milk yonida, oq bo‘rsimon yoki jigarrang dog‘lar paydo bo‘lsa.",
        "На зубах, особенно у десны, появились белые меловые или коричневые пятна.",
        "You see chalky white or brown spots on the teeth, especially near the gum."
      ),
      t(
        "Bola tish og‘rig‘idan shikoyat qilsa yoki ovqatdan bosh tortsa.",
        "Ребёнок жалуется на зубную боль или отказывается от еды.",
        "Your child complains of toothache or refuses to eat."
      ),
      t(
        "Milk yoki yuz shishsa, ayniqsa isitma bilan birga bo‘lsa.",
        "Отекает десна или лицо, особенно с температурой.",
        "The gum or face is swollen, especially with a fever."
      ),
      t(
        "Tish urilib singan, siljigan yoki tushib ketgan bo‘lsa.",
        "Зуб сломался, сместился или выпал после удара.",
        "A tooth is broken, pushed out of place or knocked out."
      ),
      t(
        "Bola 18 oylik bo‘lsa ham birinchi tish chiqmagan bo‘lsa.",
        "К 18 месяцам не появилось ни одного зуба.",
        "No teeth have appeared by 18 months."
      ),
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────
  {
    id: 'pregnancy',
    icon: 'pregnancy',
    minutes: 3,
    title: t("Homiladorlikda tishlar", "Зубы во время беременности", "Teeth during pregnancy"),
    summary: t(
      "Xavfsiz davolash, milk va ko‘ngil aynishi haqida.",
      "О безопасном лечении, дёснах и токсикозе.",
      "Safe treatment, gums and morning sickness."
    ),
    intro: t(
      "Homiladorlik paytida gormonlar milkka ta’sir qiladi, shuning uchun og‘iz parvarishi ayniqsa muhim. Stomatologga borish homiladorlikda xavfsiz va tavsiya etiladi.",
      "Во время беременности гормоны влияют на дёсны, поэтому уход за полостью рта особенно важен. Посещать стоматолога во время беременности безопасно и рекомендуется.",
      "Pregnancy hormones affect the gums, so looking after your mouth is especially important. Seeing a dentist during pregnancy is safe and recommended."
    ),
    sections: [
      {
        title: t("Stomatolog qabulida", "На приёме у стоматолога", "At the dentist"),
        kind: 'bullets',
        items: [
          t(
            "Shifokorga homiladorligingiz va muddatingiz haqida ayting.",
            "Сообщите врачу о беременности и её сроке.",
            "Tell your dentist you are pregnant and how many weeks."
          ),
          t(
            "Muntazam ko‘rik va professional tozalash xavfsiz. Rejali davolash uchun ko‘pincha ikkinchi trimestr eng qulay vaqt.",
            "Плановый осмотр и профессиональная чистка безопасны. Для планового лечения чаще всего удобнее второй триместр.",
            "Check-ups and cleaning are safe. For planned treatment, the second trimester is often the most comfortable time."
          ),
          t(
            "Og‘riq yoki infeksiyani davolashni tug‘ruqqacha qoldirmang — davolanmagan infeksiya ona va bola uchun xavfliroq.",
            "Не откладывайте лечение боли или инфекции до родов — нелеченная инфекция опаснее для мамы и малыша.",
            "Don’t put off treating pain or infection until after the birth — an untreated infection is the bigger risk for you and your baby."
          ),
          t(
            "Rentgen zarur bo‘lsa, himoya choralari bilan bajariladi; shoshilinch bo‘lmasa, shifokor uni keyinga qoldirishi mumkin.",
            "Если нужен рентген, его делают с защитой; если он не срочный, врач может его отложить.",
            "If an X-ray is needed, it is taken with protection; if it isn’t urgent, your dentist may postpone it."
          ),
          t(
            "Har qanday dorini ichishdan oldin shifokor yoki farmatsevtdan so‘rang.",
            "Перед приёмом любых лекарств посоветуйтесь с врачом или фармацевтом.",
            "Check with your doctor or pharmacist before taking any medicine."
          ),
        ],
      },
      {
        title: t("Uyda parvarish", "Уход дома", "Care at home"),
        kind: 'bullets',
        items: [
          t(
            "Homiladorlik gingiviti: milk shishib, qonashi mumkin. Kuniga ikki marta yumshoq cho‘tka bilan tozalang va tishlar orasini har kuni tozalang.",
            "Гингивит беременных: дёсны могут отекать и кровоточить. Чистите зубы дважды в день мягкой щёткой и ежедневно очищайте промежутки.",
            "Pregnancy gingivitis can make gums swollen and prone to bleeding. Brush twice a day with a soft brush and clean between your teeth daily."
          ),
          t(
            "Qusgandan keyin darhol tish tozalamang — kislota emalni yumshatadi. Og‘izni suv bilan chayqang va taxminan bir soatdan keyin tozalang.",
            "После рвоты не чистите зубы сразу — кислота размягчает эмаль. Прополощите рот водой и почистите зубы примерно через час.",
            "After vomiting, don’t brush straight away — stomach acid softens the enamel. Rinse with water and brush about an hour later."
          ),
          t(
            "Tozalaganda ko‘ngil aynisa, kichik boshli cho‘tka va ta’mi yumshoq pastadan foydalaning, shoshilmang.",
            "Если при чистке тошнит, используйте щётку с маленькой головкой и пасту с мягким вкусом, не торопитесь.",
            "If brushing makes you gag, try a small-headed brush and a mild-tasting toothpaste, and take your time."
          ),
          t(
            "Shirinlikka ishtiyoq kuchli bo‘lsa, tez-tez shirin yemang; meva, qatiq, pishloqni tanlang va ko‘proq suv iching.",
            "Если тянет на сладкое, не перекусывайте сладким часто; выбирайте фрукты, йогурт, сыр и пейте больше воды.",
            "If you crave sweet things, avoid frequent sugary snacks; choose fruit, yoghurt or cheese and drink plenty of water."
          ),
          t(
            "Ba’zan milkda qizil, yumshoq bo‘rtma paydo bo‘ladi (homiladorlik epulisi). U odatda zararsiz va tug‘ruqdan keyin yo‘qoladi, lekin shifokorga ko‘rsating.",
            "Иногда на десне появляется красное мягкое образование (эпулис беременных). Обычно оно безвредно и проходит после родов, но покажите его врачу.",
            "Sometimes a red, soft lump appears on the gum (a pregnancy epulis). It is usually harmless and goes after the birth, but have it checked."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Tish og‘rig‘i, milk yoki yuz shishishi.",
        "Зубная боль, отёк десны или лица.",
        "Toothache, or swelling of the gum or face."
      ),
      t(
        "Milk kuchli qonasa yoki qonash 2 haftadan ortiq davom etsa.",
        "Сильная кровоточивость дёсен или кровоточивость дольше 2 недель.",
        "Heavy gum bleeding, or bleeding that lasts more than 2 weeks."
      ),
      t(
        "Milkdagi bo‘rtma kattalashsa, ko‘p qonasa yoki ovqatlanishga xalaqit bersa.",
        "Образование на десне растёт, сильно кровоточит или мешает есть.",
        "A gum lump grows, bleeds a lot or gets in the way of eating."
      ),
      t(
        "Tish qimirlay boshlasa.",
        "Зуб начал шататься.",
        "A tooth feels loose."
      ),
    ],
  },

  // 9 ─────────────────────────────────────────────────────────────
  {
    id: 'orthodontic',
    icon: 'braces',
    minutes: 4,
    title: t("Breket va elaynerlar parvarishi", "Уход за брекетами и элайнерами", "Braces and aligner care"),
    summary: t(
      "Tozalash, ovqatlanish va taqib yurish qoidalari.",
      "Чистка, питание и правила ношения.",
      "Cleaning, eating and wearing them right."
    ),
    intro: t(
      "Breket yoki elayner bilan ovqat qoldiqlari va blyashka osonroq to‘planadi. Yaxshi parvarish tishlarda oq dog‘lar va kariesning oldini oladi hamda davolashni rejadagidek yakunlashga yordam beradi.",
      "С брекетами и элайнерами остатки еды и налёт скапливаются легче. Хороший уход защищает от белых пятен и кариеса и помогает завершить лечение по плану.",
      "Food and plaque build up more easily around braces and aligners. Good care prevents white spots and decay, and helps your treatment finish on time."
    ),
    sections: [
      {
        title: t("Breketlar", "Брекеты", "Braces"),
        kind: 'bullets',
        items: [
          t(
            "Har ovqatdan keyin yoki kamida kuniga ikki marta ftorli pasta bilan tozalang: breketning yuqorisi, pasti va sim ostini.",
            "Чистите зубы после каждой еды или хотя бы дважды в день пастой с фтором: над брекетами, под ними и под дугой.",
            "Brush after every meal, or at least twice a day, with fluoride toothpaste: above and below each bracket and under the wire."
          ),
          t(
            "Breket va sim orasini tishlararo yoki ortodontik cho‘tka bilan tozalang. Ip uchun ip o‘tkazgich yoki irrigatordan foydalanish mumkin.",
            "Пространство между брекетами и дугой чистите межзубным или ортодонтическим ёршиком. Для нити используйте нитевдеватель или ирригатор.",
            "Clean between the brackets and wire with interdental or orthodontic brushes. A floss threader or water flosser helps with flossing."
          ),
          t(
            "Qattiq, yopishqoq va cho‘ziluvchan ovqatlardan saqlaning: yong‘oq, qattiq konfet, muz, popkorn, saqich, iris.",
            "Избегайте твёрдой, липкой и тягучей еды: орехов, леденцов, льда, попкорна, жвачки, ириса.",
            "Avoid hard, sticky and chewy foods: nuts, hard sweets, ice, popcorn, chewing gum and toffee."
          ),
          t(
            "Olma, sabzi kabi qattiq meva-sabzavotlarni mayda bo‘laklarga to‘g‘rab yeng.",
            "Твёрдые фрукты и овощи (яблоки, морковь) нарезайте мелкими кусочками.",
            "Cut hard fruit and vegetables like apples and carrots into small pieces."
          ),
          t(
            "Rezinkalarni shifokor aytganidek taqing. Kontakt sport turlarida himoya kapasini kiying.",
            "Носите резинки так, как сказал врач. В контактных видах спорта используйте защитную капу.",
            "Wear elastics exactly as instructed, and use a mouthguard for contact sports."
          ),
          t(
            "Breket qo‘yilgandan yoki sozlangandan keyin bir necha kun og‘riq bo‘lishi normal: yumshoq ovqat yeng, ishqalayotgan joyga ortodontik mum yopishtiring.",
            "Несколько дней после установки или активации брекетов зубы могут болеть — это нормально: ешьте мягкое, на натирающее место наклейте ортодонтический воск.",
            "Soreness for a few days after fitting or adjustment is normal: eat soft food and put orthodontic wax on anything that rubs."
          ),
        ],
      },
      {
        title: t("Elaynerlar", "Элайнеры", "Aligners"),
        kind: 'bullets',
        items: [
          t(
            "Kuniga 20–22 soat taqing — faqat ovqatlanish va tish tozalash uchun yeching.",
            "Носите 20–22 часа в сутки — снимайте только для еды и чистки зубов.",
            "Wear them 20–22 hours a day — take them out only to eat and to brush."
          ),
          t(
            "Elayner bilan faqat oddiy suv iching. Boshqa ichimliklar uchun uni yeching.",
            "В элайнерах пейте только простую воду. Для других напитков снимайте их.",
            "Drink only plain water with aligners in. Take them out for anything else."
          ),
          t(
            "Qayta taqishdan oldin tishlarni tozalang yoki hech bo‘lmasa og‘izni suv bilan chayqang.",
            "Перед тем как надеть их снова, почистите зубы или хотя бы прополощите рот водой.",
            "Brush your teeth — or at least rinse with water — before putting them back in."
          ),
          t(
            "Elaynerni sovuq yoki iliq suvda yumshoq cho‘tka bilan yuving. Issiq suv uni deformatsiya qiladi.",
            "Мойте элайнеры прохладной или тёплой водой мягкой щёткой. Горячая вода их деформирует.",
            "Clean aligners with a soft brush in cool or lukewarm water. Hot water can warp them."
          ),
          t(
            "Yechganda doim maxsus qutichaga soling — salfetkaga o‘ralgan elaynerlar ko‘pincha yo‘qoladi.",
            "Снятые элайнеры всегда убирайте в футляр — завёрнутые в салфетку часто теряются.",
            "Always keep them in their case when out — aligners wrapped in a napkin often get thrown away."
          ),
          t(
            "Keyingi to‘plamga shifokor belgilagan muddatda o‘ting.",
            "Переходите на следующую пару в срок, назначенный врачом.",
            "Switch to the next set on the schedule your orthodontist gave you."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Breket ko‘chsa yoki sim sanchilib qolsa — vaqtincha mum bilan yoping va ortodontga qo‘ng‘iroq qiling.",
        "Отклеился брекет или колет дуга — временно закройте воском и позвоните ортодонту.",
        "A bracket comes off or a wire is poking — cover it with wax for now and call your orthodontist."
      ),
      t(
        "Breketlar atrofida oq dog‘lar paydo bo‘lsa.",
        "Вокруг брекетов появились белые пятна.",
        "White spots appear around the brackets."
      ),
      t(
        "Elayner yorilsa, sinsa yoki tishga oturmay qolsa.",
        "Элайнер треснул, сломался или перестал садиться на зубы.",
        "An aligner cracks, breaks or no longer fits."
      ),
      t(
        "Og‘riq bir necha kundan keyin ham kuchli bo‘lsa yoki og‘izdagi yara 2 haftada bitmasa.",
        "Боль остаётся сильной через несколько дней или ранка во рту не заживает 2 недели.",
        "Pain is still strong after a few days, or a sore in your mouth hasn’t healed in 2 weeks."
      ),
    ],
  },

  // 10 ────────────────────────────────────────────────────────────
  {
    id: 'implants',
    icon: 'implant',
    minutes: 3,
    title: t("Implant va ko‘prik protez parvarishi", "Уход за имплантами и мостами", "Implant and bridge care"),
    summary: t(
      "Uzoq xizmat qilishi uchun kundalik parvarish.",
      "Ежедневный уход, чтобы они служили долго.",
      "Daily care to make them last."
    ),
    intro: t(
      "Implant va ko‘prik protezning o‘zi kariesga chalinmaydi, lekin ularning atrofidagi milk, suyak va tayanch tishlar kasallanishi mumkin. Kundalik tozalash va muntazam ko‘rik ularning uzoq xizmat qilishiga yordam beradi.",
      "Сами импланты и мосты кариесом не болеют, но десна, кость и опорные зубы вокруг них — могут. Ежедневная чистка и регулярные осмотры помогают им служить долго.",
      "Implants and bridges can’t decay themselves, but the gum, bone and supporting teeth around them can get diseased. Daily cleaning and regular check-ups help them last."
    ),
    sections: [
      {
        title: t("Kundalik parvarish", "Ежедневный уход", "Every day"),
        kind: 'bullets',
        items: [
          t(
            "Kuniga ikki marta yumshoq cho‘tka va ftorli pasta bilan tozalang. Kuchli abraziv, oqartiruvchi pastalardan qoching.",
            "Чистите дважды в день мягкой щёткой и пастой с фтором. Избегайте сильно абразивных отбеливающих паст.",
            "Brush twice a day with a soft brush and fluoride toothpaste. Avoid highly abrasive whitening pastes."
          ),
          t(
            "Ko‘prik ostini har kuni ip o‘tkazgich, maxsus qalin ip yoki tishlararo cho‘tka bilan tozalang.",
            "Каждый день очищайте пространство под мостом с помощью нитевдевателя, специальной толстой нити или межзубного ёршика.",
            "Clean under the bridge every day with a floss threader, special thick floss or an interdental brush."
          ),
          t(
            "Implant atrofini tishlararo cho‘tka bilan tozalang. Irrigator qo‘shimcha yordam berishi mumkin.",
            "Вокруг импланта используйте межзубные ёршики. Ирригатор может быть полезным дополнением.",
            "Clean around implants with interdental brushes. A water flosser can be a helpful extra."
          ),
          t(
            "Muz, yong‘oq po‘chog‘i kabi qattiq narsalarni tishlamang, tish bilan qadoq ochmang.",
            "Не грызите лёд, скорлупу орехов и не открывайте упаковки зубами.",
            "Don’t bite on ice or nutshells, or use your teeth to open packets."
          ),
          t(
            "Kechasi tish g‘ichirlatsangiz, stomatologdan tungi himoya kapasi haqida so‘rang.",
            "Если вы скрипите зубами во сне, спросите стоматолога о ночной защитной капе.",
            "If you grind your teeth at night, ask your dentist about a night guard."
          ),
          t(
            "Chekishni tashlang — u implant atrofidagi yallig‘lanish (periimplantit) xavfini oshiradi. Qandli diabet bo‘lsa, qand miqdorini nazorat qiling.",
            "Бросьте курить — курение повышает риск воспаления вокруг импланта (периимплантита). При диабете следите за уровнем сахара.",
            "Stop smoking — it raises the risk of inflammation around implants (peri-implantitis). If you have diabetes, keep it well controlled."
          ),
        ],
      },
      {
        title: t("Muntazam ko‘rik", "Регулярные осмотры", "Regular check-ups"),
        kind: 'bullets',
        items: [
          t(
            "Stomatolog aytgan muddatda — odatda har 6–12 oyda — ko‘rik va professional tozalashdan o‘ting.",
            "Проходите осмотр и профессиональную чистку с интервалом, который назначил врач, — обычно раз в 6–12 месяцев.",
            "Have check-ups and professional cleaning as often as your dentist advises — usually every 6–12 months."
          ),
          t(
            "Implant operatsiyasidan keyingi birinchi kunlarda jarrohning alohida ko‘rsatmalariga amal qiling.",
            "В первые дни после установки импланта следуйте отдельным рекомендациям хирурга.",
            "In the first days after implant surgery, follow your surgeon’s specific instructions."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Implant atrofida milk qonasa, shishsa yoki yiring chiqsa.",
        "Десна вокруг импланта кровоточит, отекает или выделяется гной.",
        "The gum around an implant bleeds, swells or has pus."
      ),
      t(
        "Implant, qoplama yoki ko‘prik qimirlasa.",
        "Имплант, коронка или мост шатаются.",
        "An implant, crown or bridge feels loose."
      ),
      t(
        "Chaynaganda og‘riq bo‘lsa.",
        "Больно жевать.",
        "It hurts to chew."
      ),
      t(
        "Ko‘prik ostidan yoqimsiz hid yoki ta’m kelsa.",
        "Из-под моста неприятный запах или привкус.",
        "There is a bad smell or taste from under the bridge."
      ),
      t(
        "Milk pastga tushib, metall qism ko‘rinib qolsa.",
        "Десна опустилась и стал виден металл.",
        "The gum shrinks back and metal becomes visible."
      ),
    ],
  },

  // 11 ────────────────────────────────────────────────────────────
  {
    id: 'breath',
    icon: 'breath',
    minutes: 3,
    title: t("Og‘izdan yoqimsiz hid", "Неприятный запах изо рта", "Bad breath"),
    summary: t(
      "Sabablari va hidni yo‘qotish yo‘llari.",
      "Причины и способы избавиться от запаха.",
      "What causes it and how to fix it."
    ),
    intro: t(
      "Ko‘p hollarda yoqimsiz hidning sababi og‘izning o‘zida: til, tishlar orasi va milkdagi bakteriyalar. Yaxshi xabar — ko‘pincha uni oddiy kundalik odatlar bilan bartaraf etish mumkin.",
      "В большинстве случаев причина запаха — в самой полости рта: бактерии на языке, между зубами и у дёсен. Хорошая новость — чаще всего с ним справляются простые ежедневные привычки.",
      "Most bad breath starts in the mouth itself: bacteria on the tongue, between the teeth and around the gums. The good news is that simple daily habits usually fix it."
    ),
    sections: [
      {
        title: t("Ko‘p uchraydigan sabablar", "Частые причины", "Common causes"),
        kind: 'bullets',
        items: [
          t(
            "Tishlar orasida qolgan ovqat va blyashka.",
            "Остатки пищи и налёт между зубами.",
            "Food and plaque left between the teeth."
          ),
          t(
            "Tilning orqa qismidagi karash (oq qatlam).",
            "Налёт на задней части языка.",
            "A coating on the back of the tongue."
          ),
          t(
            "Milk kasalligi va davolanmagan karies.",
            "Болезни дёсен и нелеченый кариес.",
            "Gum disease and untreated decay."
          ),
          t(
            "Og‘iz qurishi: kam suv ichish, og‘iz bilan nafas olish, ba’zi dorilar. Ertalabki hid ham shundan.",
            "Сухость во рту: мало воды, дыхание ртом, некоторые лекарства. Утренний запах — тоже отсюда.",
            "A dry mouth: not drinking enough, breathing through your mouth, some medicines. Morning breath is part of this."
          ),
          t(
            "Chekish va sarimsoq, piyoz kabi o‘tkir ovqatlar.",
            "Курение и острая пища — чеснок, лук.",
            "Smoking, and strong foods such as garlic and onion."
          ),
          t(
            "Uzoq och qolish yoki qattiq parhez.",
            "Длительный голод или строгие диеты.",
            "Skipping meals or strict diets."
          ),
          t(
            "Yaxshi tozalanmagan olinadigan protezlar.",
            "Плохо очищенные съёмные протезы.",
            "Removable dentures that aren’t cleaned well."
          ),
          t(
            "Kamroq — burun-tomoq, bodomcha bezlari, oshqozon kasalliklari yoki qandli diabet.",
            "Реже — болезни носа и горла, миндалин, желудка или сахарный диабет.",
            "Less often — nose, throat, tonsil or stomach problems, or diabetes."
          ),
        ],
      },
      {
        title: t("Nima yordam beradi", "Что помогает", "What helps"),
        kind: 'steps',
        items: [
          t(
            "Kuniga ikki marta ftorli pasta bilan tish tozalang.",
            "Чистите зубы дважды в день пастой с фтором.",
            "Brush twice a day with fluoride toothpaste."
          ),
          t(
            "Har kuni tishlar orasini ip yoki tishlararo cho‘tka bilan tozalang.",
            "Ежедневно очищайте промежутки нитью или ёршиком.",
            "Clean between your teeth every day with floss or interdental brushes."
          ),
          t(
            "Tilni orqadan oldinga qarab til tozalagich yoki cho‘tka bilan yengil tozalang.",
            "Мягко очищайте язык скребком или щёткой — от корня к кончику.",
            "Gently clean your tongue from back to front with a tongue scraper or brush."
          ),
          t(
            "Kun davomida yetarlicha suv iching. Shakarsiz saqich so‘lak ajralishini oshiradi.",
            "Пейте достаточно воды в течение дня. Жевательная резинка без сахара усиливает слюноотделение.",
            "Drink enough water through the day. Sugar-free gum gets saliva flowing."
          ),
          t(
            "Chekishni tashlang va ovqatlanishni o‘tkazib yubormang.",
            "Бросьте курить и не пропускайте приёмы пищи.",
            "Stop smoking and don’t skip meals."
          ),
          t(
            "Olinadigan protezni har kuni tozalang va kechasi yeching (agar shifokor boshqacha aytmagan bo‘lsa).",
            "Ежедневно чистите съёмный протез и снимайте его на ночь (если врач не сказал иначе).",
            "Clean removable dentures every day and take them out at night (unless your dentist says otherwise)."
          ),
          t(
            "Chayqash vositasi hidni faqat vaqtincha yashiradi — u tozalashning o‘rnini bosmaydi.",
            "Ополаскиватель лишь временно маскирует запах и не заменяет чистку.",
            "Mouthwash only masks the smell for a while — it doesn’t replace cleaning."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Yaxshi parvarishga qaramay hid bir necha hafta saqlansa — stomatologga ko‘rining. Og‘iz sog‘lom bo‘lsa, umumiy shifokorga murojaat qiling.",
        "Запах держится несколько недель, несмотря на хороший уход, — обратитесь к стоматологу. Если во рту всё в порядке — к терапевту.",
        "The smell lasts several weeks despite good cleaning — see a dentist. If your mouth is healthy, see your doctor."
      ),
      t(
        "Hid bilan birga milk qonasa, tishlar qimirlasa yoki og‘riq bo‘lsa.",
        "Вместе с запахом кровоточат дёсны, шатаются зубы или есть боль.",
        "Along with the smell, your gums bleed, teeth feel loose or something hurts."
      ),
      t(
        "Tomoq og‘rig‘i, isitma yoki burundan yiringli ajralma bo‘lsa.",
        "Есть боль в горле, температура или гнойные выделения из носа.",
        "You have a sore throat, a fever or discoloured discharge from your nose."
      ),
      t(
        "Og‘izda 3 haftadan ortiq bitmayotgan yara yoki oq dog‘ bo‘lsa.",
        "Во рту есть язвочка или белое пятно, которое не проходит больше 3 недель.",
        "You have a mouth ulcer or white patch that hasn’t healed in 3 weeks."
      ),
    ],
  },

  // 12 ────────────────────────────────────────────────────────────
  {
    id: 'trauma',
    icon: 'trauma',
    minutes: 3,
    title: t("Tish tushib ketsa yoki sinsa", "Если зуб выбит или сломан", "Knocked-out or broken tooth"),
    summary: t(
      "Shoshilinch birinchi yordam: har bir daqiqa muhim.",
      "Экстренная помощь: важна каждая минута.",
      "Emergency first aid: every minute counts."
    ),
    intro: t(
      "Doimiy tish urilib tushib ketsa, tez va to‘g‘ri harakat qilinsa, uni ko‘pincha saqlab qolish mumkin. Eng yaxshi natija tish 30–60 daqiqa ichida joyiga qo‘yilganda bo‘ladi.",
      "Выбитый постоянный зуб часто можно спасти, если действовать быстро и правильно. Лучший результат — когда зуб возвращают на место в течение 30–60 минут.",
      "A knocked-out adult tooth can often be saved if you act quickly and correctly. The best chance is when the tooth is back in place within 30–60 minutes."
    ),
    sections: [
      {
        title: t("Doimiy tish butunlay tushib ketsa", "Если выбит постоянный зуб", "If an adult tooth is knocked out"),
        kind: 'steps',
        items: [
          t(
            "Xotirjam bo‘ling va tishni toping.",
            "Сохраняйте спокойствие и найдите зуб.",
            "Stay calm and find the tooth."
          ),
          t(
            "Tishni faqat toj qismidan (oq, ko‘rinadigan qismi) ushlang. Ildizga tegmang.",
            "Держите зуб только за коронку (белую видимую часть). Не трогайте корень.",
            "Hold it by the crown (the white part you normally see). Don’t touch the root."
          ),
          t(
            "Iflos bo‘lsa, sovuq oqar suv yoki sut bilan qisqa (taxminan 10 soniya) chayqang. Ishqalamang, sovun ishlatmang, quritmang, salfetkaga o‘ramang.",
            "Если он грязный, коротко (около 10 секунд) ополосните его под холодной проточной водой или молоком. Не трите, не используйте мыло, не сушите, не заворачивайте в салфетку.",
            "If it’s dirty, rinse it briefly (about 10 seconds) under cold running water or in milk. Don’t scrub it, use soap, let it dry or wrap it in tissue."
          ),
          t(
            "Iloji bo‘lsa, tishni to‘g‘ri tomoni bilan teshigiga ehtiyotkorlik bilan qayta joylang va toza doka yoki ro‘molchani tishlab ushlab turing.",
            "Если можете, аккуратно вставьте зуб обратно в лунку правильной стороной и прикусите чистую марлю или платок, чтобы удержать его.",
            "If you can, gently push the tooth back into its socket the right way round, then bite on clean gauze or a handkerchief to hold it."
          ),
          t(
            "Joylab bo‘lmasa, tishni sutga soling. Sut bo‘lmasa — fiziologik eritmada yoki og‘izda, yonoq ichida saqlang (faqat tishni yutib yubormaydigan kattalar). Oddiy suvda saqlamang.",
            "Если вставить не получается, положите зуб в молоко. Если молока нет — в физраствор или держите во рту за щекой (только взрослым, которые не проглотят зуб). Не храните в простой воде.",
            "If you can’t, put the tooth in milk. If there’s no milk, use saline or keep it in the mouth inside the cheek (only for adults who won’t swallow it). Don’t store it in water."
          ),
          t(
            "Darhol stomatologga boring — iloji boricha 30–60 daqiqa ichida. Tishni o‘zingiz bilan oling.",
            "Немедленно к стоматологу — желательно в течение 30–60 минут. Возьмите зуб с собой.",
            "See a dentist immediately — ideally within 30–60 minutes — and take the tooth with you."
          ),
        ],
      },
      {
        title: t("Muhim", "Важно", "Also important"),
        kind: 'bullets',
        items: [
          t(
            "Sut tishi tushib ketsa, uni joyiga qo‘ymang — ostidagi doimiy tishga zarar yetishi mumkin. Lekin bolani baribir stomatologga ko‘rsating.",
            "Выбитый молочный зуб не вставляйте обратно — можно повредить зачаток постоянного. Но ребёнка всё равно покажите стоматологу.",
            "Don’t put a baby tooth back — it can damage the adult tooth underneath. Still take your child to the dentist."
          ),
          t(
            "Tish singan bo‘lsa, siniq bo‘laklarni topib, sut yoki suvda saqlang va o‘sha kuniyoq stomatologga boring.",
            "Если зуб откололся, найдите осколки, положите их в молоко или воду и в тот же день обратитесь к стоматологу.",
            "If a tooth is chipped or broken, keep any pieces in milk or water and see a dentist the same day."
          ),
          t(
            "Og‘izni iliq suv bilan chayqang, qonayotgan joyga toza doka bosing, shish uchun yonoqqa sovuq kompress qo‘ying.",
            "Прополощите рот тёплой водой, прижмите к кровоточащему месту чистую марлю, к щеке приложите холод от отёка.",
            "Rinse your mouth with warm water, press clean gauze on any bleeding and hold a cold pack to your cheek for swelling."
          ),
          t(
            "Jarohat iflos bo‘lsa, qoqsholga qarshi emlash holatingizni shifokor bilan aniqlang.",
            "Если рана загрязнена, уточните у врача, нужна ли прививка от столбняка.",
            "If the wound was dirty, check with a doctor whether you need a tetanus jab."
          ),
          t(
            "Kontakt sport turlarida himoya kapasi tish jarohatlarining oldini oladi.",
            "Защитная капа в контактных видах спорта предотвращает травмы зубов.",
            "A mouthguard for contact sports helps prevent these injuries."
          ),
        ],
      },
    ],
    redFlags: [
      t(
        "Hushdan ketish, qusish, kuchli bosh og‘rig‘i yoki gangish kabi bosh jarohati belgilari bo‘lsa — darhol tez yordam chaqiring.",
        "Есть признаки травмы головы: потеря сознания, рвота, сильная головная боль, спутанность — сразу вызывайте скорую.",
        "There are signs of a head injury — fainting, vomiting, a bad headache or confusion — call emergency services."
      ),
      t(
        "Qon ketishi bosib turishga qaramay to‘xtamasa.",
        "Кровотечение не останавливается, несмотря на давление.",
        "Bleeding won’t stop with pressure."
      ),
      t(
        "Jag‘ yopilmasa yoki tishlar avvalgidek bir-biriga to‘g‘ri kelmasa — jag‘ singan bo‘lishi mumkin.",
        "Челюсть не закрывается или зубы смыкаются не так, как раньше, — возможен перелом.",
        "Your jaw won’t close or your teeth don’t meet as before — the jaw may be broken."
      ),
      t(
        "Tish topilmasa va yo‘tal yoki nafas qisishi bo‘lsa — tish nafas yo‘liga tushgan bo‘lishi mumkin.",
        "Зуб не нашли, а есть кашель или одышка — зуб мог попасть в дыхательные пути.",
        "The tooth can’t be found and there is coughing or difficulty breathing — it may have been inhaled."
      ),
    ],
  },
];
