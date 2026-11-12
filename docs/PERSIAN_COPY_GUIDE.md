# راهنمای نگارش فارسی چرخ‌تاز — CHARKHTAZ Persian Copy Guide

**Status:** AI editorial pass, v1. Written from the strings that exist in the repository on
2026-11-12. This document has **not** been reviewed by a native Iranian editor; treat it as a
proposal with rationale, not as a signed-off standard. Before public release, one Persian-speaking
editor should read the shipped screens once and initial this file.

**Scope:** every player-facing Persian string in the game — home, garage, tracks, settings, HUD,
pause, results, toasts, hints, error and empty states, plus the Persian content fields in
`src/vehicles/profiles.ts` and `src/tracks/definitions.ts`.

**Language of this document:** English prose so the whole team (code, design, review) can argue
with it; every rule is demonstrated with the actual Persian copy. Copy that ships is Persian only.

**Companion document:** [`docs/COPY-AUDIT.md`](COPY-AUDIT.md) — the string-by-string audit this
guide is derived from.

---

## 1. Brand voice

### 1.1 Who is talking

A mechanic who races on weekends and explains what he did with his hands. He knows what a bite
point feels like, he has stalled at a start line, and he does not need to sell you the car. He
speaks to one driver, in the second person singular (**تو**), never in the plural
(**شما**) and never in the royal **ما**.

The voice is **confident, technical, friendly — never childish**.

- Confident: states what happens and what to do. No hedging, no "try to maybe".
- Technical: uses the real part name and the real unit. If the value is a coefficient, either
  explain it or do not show it.
- Friendly: talks like a person at the pit wall. Short sentences, one idea each.
- Never childish: no diminutives, no cutesy onomatopoeia, no "آماده‌ای؟! بریم!" energy, no
  mascots talking in the HUD.

### 1.2 Tone dial per surface

| Surface | Sentences | Verb form | Attitude | Max length |
| --- | --- | --- | --- | --- |
| Hero / marketing | 1–2 | imperative or present | concrete promise, no adjectives stacked | 18 words |
| Button / label | fragment | noun or imperative | zero personality, maximum clarity | 3 words |
| Mode or track description | 2–3 | present + one imperative | coach, names the hazard, gives one tactic | 22 words |
| Tutorial hint / toast | 1 | imperative | one action only, never two | 12 words |
| Settings helper | 1 | imperative or conditional | consequence, not a comparison formula | 10 words |
| Error | 1–2 | past + next step | factual, never blames the player | 14 words |
| Results | fragment | noun | report, do not celebrate for the player | 3 words |

### 1.3 Sentence mechanics

1. **One action per sentence.** If a line contains two imperatives, split it or drop one.
2. **Verb first in instructions.** «کلاچ را بگیر و دندهٔ ۱ را بزن» beats «برای گرفتن دنده، ابتدا
   کلاچ…».
3. **Concrete noun beats abstraction.** «نقطهٔ درگیری» not «حسِ کلاچ»; «چسبندگی» not «حس جاده».
4. **Numbers instead of adjectives.** «۱۷۸ نیوتون‌متر» not «گشتاور فراوان».
5. **No more than one comma-clause per line in the HUD.** The HUD is read at 120 km/h.
6. **Present tense for what the game does**, past tense only for what just happened
   («موتور خاموش شد»).

### 1.4 Banned vocabulary

These are the patterns that make Persian game copy read like translated marketing. They are
banned in player-facing strings, not in design docs.

| Pattern | Why | Say instead |
| --- | --- | --- |
| «تجربهٔ بی‌نظیر»، «هیجان‌انگیز»، «فراموش‌نشدنی» | empty superlative, proves nothing | the actual mechanic or number |
| «بهترین»، «قوی‌ترین»، «بی‌رقیب» | unverifiable claim | the measured value, or the class it wins in |
| «دنیای…»، «سفرِ…»، «ماجراجویی» | trailer language | the road and the hazard |
| «حسِ واقعی»، «فیزیک واقعی» as a slogan | every game says it | what the simulation actually does |
| «انیمیشن آماده»، «دکمه‌های جادویی» و دیگر strawmen | argues with an imaginary rival | state the design fact once |
| «فرمانروای خاک»، «پادشاه جاده» | epithet stacking, reads as a toy package | what the car is good at |
| «حالا آماده‌ای؟»، «بریم!» | childish hype | the countdown, then «برو!» |
| «لطفاً صبر کنید»، «در حال بارگذاری…» in a modal | over-formal service desk | «چند لحظه…» or a progress value |
| «کاربر»، «بازیکن عزیز» | bureaucratic distance | «تو» |
| Emoji, «!!», ALL-CAPS Latin | breaks the instrument-panel tone | nothing |
| «پیچ»، «کورنر»، «درفت» as a challenge | **false claim**: the game is 2D side-view, there is no lateral cornering | «شیب»، «پرش»، «گودال»، «دست‌انداز» |

The last row is not a style preference. `AGENTS.md` non-negotiable #1 forbids claims of lateral
cornering; copy that promises «پیچ‌های تند» or «خروج از پیچ» breaks the product's honesty rule.

---

## 2. Automotive terminology

One term per concept, everywhere: hero, garage, specs, hints, results. The middle column is the
only approved form in UI. The right column lists what is currently in the repo and must go.

### 2.1 Controls and drivetrain

| Concept | Canonical UI term | Not this |
| --- | --- | --- |
| throttle | **گاز** (label), «پدال گاز» in full sentences | «اهرم گاز»، «دریچهٔ گاز» in UI |
| brake | **ترمز** | «بریک»، «ترمزگیری» as a noun label |
| clutch | **کلاچ** | «کلاج» |
| three sliders, collectively | **پدال‌ها** / «سه پدال آنالوگ» | «اهرم‌ها» (an arm is not a pedal) |
| gear | **دنده** | «گیر» |
| gearbox | **جعبه‌دنده** | «گیربکس» (fine in speech, not on a spec label) |
| manual / automatic | **دستی** / **خودکار** | «منوال»، «اتومات» on labels |
| gear number | **دندهٔ ۱** … **دندهٔ ۵** | «دنده یک»، «دنده 1» |
| neutral / reverse | **N** / **R** on the HUD, «دندهٔ خلاص» / «دندهٔ عقب» in prose | «دندهٔ معکوس» (too formal) |
| differential | **دیفرانسیل** | «دیفر» |
| drivetrain layout | **دیفرانسیل جلو** / **دیفرانسیل عقب** / **چهارچرخ‌محرک** | bare `FWD` / `RWD` / `AWD` with no gloss |
| ABS | **ترمز ABS** (first mention: «ترمز ضدقفل (ABS)») | «ABS» alone as a sentence |

### 2.2 Engine, load, grip

| Concept | Canonical UI term | Not this |
| --- | --- | --- |
| engine speed | **دور موتور** | «دور» alone, «RPM» |
| idle | **دور آرام** | «آیدل» |
| redline / max rpm | **حداکثر دور موتور** | «دور» alone (not a unit; the value is engine speed) |
| torque | **گشتاور** — unit **نیوتون‌متر** | «نیوتون» for torque (that is force, not torque) |
| power | **قدرت** — unit **اسب بخار** | «اسب» on a spec row (ambiguous: horse) |
| turbo | **توربو** | «توربوشارژر» in UI |
| under load | **زیرِ بار** | «تحت بار» |
| grip | **چسبندگی** | «گریپ»، «چنگ» |
| wheelspin | **هرزگردی** / «چرخ‌ها هرز می‌چرخند» | «چرخ را می‌چرخاند» (tautology) |
| slip | **لغزش** | «اسلیپ» |
| bite point | **نقطهٔ درگیری** | «نقطهٔ کلاچ» (**wrong term, used in practice mode today**) |
| stall | **خاموش شدن موتور** | «خفه کردن» |
| shift | **تعویض دنده** | «شیفت» |
| suspension / damper | **تعلیق** / **کمک‌فنر** | «سیستم تعلیق» as a label |
| half-engaged clutch | **کلاچ نیمه‌درگیر** | «کلاچ نیمه» |

### 2.3 Track and race vocabulary

| Concept | Canonical UI term | Not this |
| --- | --- | --- |
| checkpoint | **چک‌پوینت** | «ایست» (means a stop, not a checkpoint) |
| respawn | **بازگشت به چک‌پوینت** | «ری‌اسپاون»، «ریسپاون» |
| best time | **رکورد** | «بهترین زمان» mixed with «رکورد» in the same screen |
| penalty | **جریمه** + seconds | «پنالتی» |
| hazard: jump | **پرش** | «جامپ» |
| hazard: gap / pit | **گودال** | «گپ» |
| hazard: bump / whoops | **دست‌انداز** | «ووپس» |
| hazard: slope | **سربالایی** / **سرازیری** / **شیب** | — |
| surface | **سطح** + its name from `SURFACE_LABELS_FA` | «زمین» |
| lap | *does not exist* — all routes are point-to-point | «دور» as a race unit |

Competitive framing rule: `GameScene` now fields AI rivals in race mode and in career events
(`OpponentSpec`; the count comes from the mode or the event), so «حریف» is allowed where the scene
actually spawns one. It
must not promise human opponents or «مسابقه با دیگران»: there is no network code. Time trial and
practice stay solo, and «بدون حریف» belongs on the time-trial card only, never on race or trial. The
2D rule still stands — no cornering, no drifting, no lateral claims anywhere.

### 2.4 Numbers as terminology

- Write «۰ تا ۱۰۰» with Persian digits; label it fully as **شتاب ۰ تا ۱۰۰** — the bare label is
  ambiguous on a card that also shows top speed.
- Torque and power always carry a unit on the first appearance in a screen; later repetitions may
  drop it only inside a stat bar with a visible header.
- Never show a raw physics coefficient as a player value. Grip `1.14` means nothing to a player;
  show a tier («بالا») or a normalized ۰–۱۰۰ bar and keep the coefficient in the debug overlay.

---

## 3. Half-space (نیم‌فاصله, U+200C)

The half-space is a letter-level rule, not a decoration. Three failure modes are all wrong:
`می شود` (space), `میشود` (joined), `می‌شود` (correct). Same for ZWJ and kashida: never.

### 3.1 When a half-space is required

| Context | Rule | Correct | Wrong |
| --- | --- | --- | --- |
| `می` / `نمی` prefix | always ZWNJ before the verb | می‌سازند، نمی‌کند، می‌چرخند | می سازند، نمیسازند |
| plural `ها` after a joining letter | ZWNJ | حالت‌ها، داده‌ها، پدال‌ها | حالتها، داده ها |
| plural `ها` after a non-joining letter (ا د ذ ر ز ژ و) | **no ZWNJ needed** | مسیرها، خودروها، دریاها | مسیر‌ها (over-corrected) |
| `تر` / `ترین` | ZWNJ | بزرگ‌تر، دقیق‌ترین | بزرگتر، دقیق ترین |
| `ای` suffix after silent `ه` | ZWNJ | مسابقه‌ای، دقیقه‌ای | مسابقه ای، مسابقهای |
| compound nouns | ZWNJ inside the compound | چرخ‌تاز، جعبه‌دنده، نیمه‌درگیر، چهارچرخ‌محرک، شاسی‌بلند، راست‌دست، بی‌محابا | چرخ تاز، جعبه دنده، نیمه درگیر |
| number + counted noun as one unit | ZWNJ when the noun is a suffix-like compound | ۵سرعته، ۶سرعته | ۵ سرعته |

### 3.2 Repo status

Correct today: «چرخ‌تاز»، «می‌سازند»، «نمی‌کند»، «داده‌ها»، «حالت‌ها»، «بزرگ‌تر»، «مسابقه‌ای»،
«جعبه‌دنده»، «نیمه‌درگیر»، «چهارچرخ‌محرک»، «بی‌محابا»، «نقطهٔ درگیری».

To fix (all string edits in data modules, no logic change): «دستی ۵ سرعته» و «خودکار ۶ سرعته» → «دستی ۵سرعته» / «خودکار
۶سرعته»؛ «۶ دنده خودکار» in trim strings → drop the gearbox from the trim entirely (it is repeated
by `transmissionFa`).

### 3.3 Ezafe (کسرهٔ اضافه)

- Write the ezafe with the hamza form when the word ends in silent `ه`: **نقطهٔ درگیری**,
  **مسابقهٔ سریع**, **جعبهٔ پنج‌سرعته**. Never `نقطهه`، `نقطه ی`، `مسابقه ی`.
- Do **not** print the kasra diacritic (ـِ) in UI copy. It is a reading aid for dictionaries and
  poetry. The current hero line «سه اهرمِ آنالوگ» prints it while every other ezafe in the app does
  not — inconsistent, remove it.
- The only exception is a genuine ambiguity such as «زیرِ بار», where `زیر بار` can be misread;
  prefer rephrasing («وقتی موتور زیر بار است») over adding a diacritic.

---

## 4. Digits, numbers, units

1. **Persian digits everywhere** in player-facing text: `۰۱۲۳۴۵۶۷۸۹` (U+06F0–U+06F9). That includes
   years (۲۰۲۲), counts (۳ خودرو), percentages (۴۰٪), version numbers and countdowns.
2. **Latin digits are allowed only inside identifiers**: model designators (`320i`, `Prado 150`,
   `G20`), trim codes (`GLX`, `TX-L`, `Sport Line`), tyre sizes (`185/65 R15`), gear letters
   (`D`, `N`, `R`), standards and codes (`ABS`, `M15TC`), and Latin units (`km/h`).
   **Never mix**: `۳۲۰i` is wrong — the model is `320i`.
3. **Decimal separator** in prose: `٫` (U+066B) — «۱٫۵ لیتر»، «۰٫۳۴ ثانیه».
4. **Timecode** keeps `:` and `.` — «۱:۲۳.۴۵». This is deliberate (`formatTime` documents it: the
   Persian decimal separator looks like a slash at HUD size). Do not "fix" the timecode, and do not
   use `.` as a decimal anywhere else.
5. **Thousands separator**: `٬` (U+066C) — «۶٬۵۰۰ دور بر دقیقه»، «۴۲٬۰۰۰». `faGroup` already does this.
6. **Space between number and unit**, never a hyphen: «۱۷۸ نیوتون‌متر»، «۱۹۰ کیلومتر بر ساعت»،
   «۱٬۲۹۰ کیلوگرم». Prefer a non-breaking space (U+00A0) so the unit never wraps alone.
7. **Unit spelling**: spell out in labels and prose («کیلومتر بر ساعت»، «کیلومتر»، «ثانیه»،
   «کیلوگرم»); `km/h` is acceptable only where a Latin unit is already part of the row and the
   same screen does not also spell it out. Today the garage mixes both — see PD-01.
8. **Percent**: `٪` directly after the number, no space, Persian digits: «۴۰٪». Not `%`, not `۴۰ %`.
9. **Ranges**: en dash without spaces for spec ranges («۱۵۰۰–۴۵۰۰»), the word «تا» in prose
   («از ۱۵۰۰ تا ۴۵۰۰ دور»).
10. **Counts of zero**: «بدون رکورد» is better than «۰ رکورد».
11. **No number without a noun** in a label: «۳» alone in a stat block needs its label
    («۳ خودرو»); the current hero meta solves this with a label underneath — keep that pattern.

---

## 5. Punctuation and typography

| Mark | Use | Notes |
| --- | --- | --- |
| `،` | comma | Persian comma (U+060C), not `,` |
| `؛` | semicolon | joins a cause and its consequence: «چسبندگی کم است؛ آرام گاز بده» |
| `:` | colon | only before a list or a value; no space before, one after |
| `؟` | question mark | Persian form, even in mixed text |
| `«…»` | quotation | Persian guillemets for UI terms quoted in prose, never `"…"` |
| `…` | ellipsis | one character; only for truncation or genuine pause, never as decoration |
| `—` | em dash | **avoid in UI.** It is a translation artifact; use `؛`, `،` or a new sentence |
| `!` | exclamation | **maximum one in the entire product**: the countdown's «برو!». Nothing else. |
| `()` | parentheses | ASCII is fine, but any Latin inside must be bidi-isolated (§6) |
| `/` | slash | not between two Persian numbers («۳/۴» reads as a date); write «۳ از ۴» |

Rules:

1. No space before `، ؛ : ؟ !`; exactly one space after.
2. No doubled punctuation: `!!`, `؟!`, `....` are all out.
3. Do not end a UI label with a full stop. End a helper sentence with one.
4. Do not use `=` as a comparison in UI («کمتر = دید بهتر جاده»). Write the consequence:
   «کمترش کن تا جاده بهتر دیده شود».
5. End prose sentences with the normal full stop `.`; never use `۔` (Arabic full stop) or three
dots. Inside a sentence, do not use `.` as a decimal — that is `٫` (§4).
6. Numbers next to punctuation need no space: «۴۰٪، بدون آسیب».
7. Buttons: no punctuation at all, except `؟` in a question button (none today).

---

## 6. Mixed Latin: brand names, model names, bidi

### 6.1 What stays Latin

Brand and model names are proper nouns. Do not translate, do not transliterate into Persian
digits, do not "localize" the letters:

- Brands: `BMW`, `Toyota`, `Saipa`, `CHARKHTAZ`
- Models and trims: `320i`, `G20`, `Land Cruiser Prado 150`, `Shahin`, `GLX`, `TX-L`, `Sport Line`
- Technical marks: `ABS`, `D` / `N` / `R`, `km/h`, `M15TC`, tyre sizes like `225/45 R18`

A Persian brand form is allowed **instead of**, never **next to**, the Latin one on the same
screen: «بی‌ام‌و ۳۲۰i» or «BMW 320i», not «بی‌ام‌و BMW ۳۲۰i». Pick per screen and keep it.

### 6.2 Bidi rules

1. **A Latin run next to Persian punctuation drifts.** Wrap it: `<bdi>320i</bdi>`,
   `<span dir="ltr">185/65 R15</span>`, or insert LRM (U+200E) before and after the run in plain
   text contexts (attributes, `title`, toasts built by string concatenation).
2. **Parentheses around Latin** must be inside the isolated run: `(<bdi>M15TC</bdi>)`, otherwise the
   opening and closing parenthesis can swap sides.
3. **Leading Latin in an RTL line** is the worst case: `GLX · ۵ دنده دستی` starts a line with Latin,
   then a Persian number, then Persian text. Keep the Latin code last in the segment, or isolate it.
4. **Gear letters inside a sentence** need isolation: «دنده روی <bdi>D</bdi> است».
5. **A Latin unit after a Persian number** is a classic reorder: «۱۹۰ km/h» can render as
   «km/h ۱۹۰». Either isolate the unit or spell it in Persian.
6. **Slash between Persian digits** is banned (§5); it also reorders.
7. **A plus sign before a Persian number** («+۵ ثانیه») jumps to the wrong side in RTL. Write
   «۵ ثانیه جریمه» or isolate `+۵`.
8. **Numbers at the end of an RTL sentence** followed by a full stop render acceptably; do not add
   LRM there — over-isolation produces invisible-character bugs in copy review diffs.

### 6.3 Latin taglines

The top bar currently reads `CHARKHTAZ · RACE · SHIFT · CONQUER`. This is English marketing filler
inside a Persian-first product, and `CONQUER` contradicts the "no empty superlatives" voice. Ship
the brand mark alone, or `CHARKHTAZ` plus the Persian name. A slogan is not a feature.

---

## 7. Do / Don't

| # | Don't | Do | Why |
| --- | --- | --- | --- |
| 1 | «تجربهٔ رانندگی بی‌نظیر» | «سه پدال آنالوگ: گاز، ترمز، کلاچ.» | name the mechanic, not the feeling |
| 2 | «ماشینِ آموزش و مهارت» | «برای شروع ساخته شده: سبک، ۱۱۰ اسب بخار، کلاچ با نقطهٔ درگیری واضح.» | abstractions do not inform |
| 3 | «گاز زیاد روی ماسه فقط چرخ را می‌چرخاند» | «روی ماسه، گاز زیاد چرخ‌ها را هرز می‌گرداند» | tautology → real term |
| 4 | «کمتر = دید بهتر جاده» | «کمترش کن تا جاده بهتر دیده شود» | no formulas in UI |
| 5 | «برای تغییر دنده، کلاچ را تا انتها بگیر» | «برای تعویض دنده، کلاچ را کامل بگیر.» | verb + full stop, one action |
| 6 | «موتور خاموش شد — دکمهٔ استارت را بزن» | «موتور خاموش شد؛ دکمهٔ روشن را بزن.» | em dash → `؛`; «استارت» → Persian |
| 7 | «پیچ‌های تند» | «شیب‌های تند» | no lateral cornering in a 2D side view |
| 8 | «+۵ ثانیه» | «۵ ثانیه جریمه» | a leading plus reorders in RTL; the unit belongs in words |
| 9 | «داده‌ها فقط روی همین دستگاه ذخیره می‌شوند.» | «پیشرفت فقط روی همین دستگاه ذخیره می‌شود.» | player word, not database word |
| 10 | «ایست‌ها: ۲/۴» | «چک‌پوینت: ۲ از ۴» | canonical term + no numeric slash |
| 11 | «فرمانروای خاک» | «سنگین و پرگشتاور؛ برای خاک ساخته شده» | epithet → fact |
| 12 | «حالا آماده‌ای؟» | «۳، ۲، ۱، برو!» | the countdown is the hype |

---

## 8. Ten rewritten examples

Each row is a string that ships today, the replacement, and the rule it demonstrates. The full
audit in `docs/COPY-AUDIT.md` contains the rest.

**1 — Hero paragraph** (`src/ui/app.ts`)
Before: «سه اهرم آنالوگ، ماشین واقعی و جاده‌ای که بخشش نمی‌کند. گاز، ترمز و کلاچ را با انگشت
وزن کن؛ آنچه می‌بینی نتیجهٔ همان اعداد است، نه یک انیمیشن آماده.»
After: «سه پدال آنالوگ، یک خودروی واقعی و جاده‌ای که خطا را جبران نمی‌کند. گاز، ترمز و کلاچ را با
انگشت وزن کن؛ هر چه می‌بینی، نتیجهٔ محاسبهٔ همان لحظه است.»
Why: «اهرم» is the wrong object, «ماشین» is the only «ماشین» on a screen that otherwise says «خودرو»,
and «اعداد / انیمیشن آماده» is developer talk that argues with a rival instead of describing the game.

**2 — Race mode card** (`src/ui/app.ts`)
Before: «با دو تا سه حریف واقعی روی همان فیزیک، از خط شروع تا خط پایان.»
After: «با دو یا سه حریف، از خط شروع تا خط پایان.»
Why: «دو تا سه» is spoken counting in a UI label; «حریف واقعی» overclaims AI drivers; «روی همان
فیزیک» is an implementation note. What remains is the promise the mode can keep.

**3 — Car tagline** (`src/vehicles/profiles.ts`, BMW 320i)
Before: «تعادلِ عقب‌ران، دقتِ آلمانی»
After: «عقب‌ران؛ گشتاور از ۱۳۵۰ دور»
Why: «دقت آلمانی» is a cliché and «تعادل» claims a lateral balance the 2D model never simulates;
the replacement keeps the rear-drive character and replaces the claim with a number the player can
feel from the first metre.

**4 — Garage spec label** (`src/ui/app.ts`)
Before: «وزن: ۱٬۲۹۰ کیلو»
After: «وزن: ۱٬۲۹۰ کیلوگرم»
Why: «کیلو» is spoken shorthand in a spec grid; the same screen's other units are written in full,
and a unit that changes shape between screens reads as a typo.

**5 — Track description** (`src/tracks/definitions.ts`, Lut)
Before: «ماسهٔ نرم، تپه‌های بلند و پرش‌های خشک. گاز زیاد روی ماسه فقط چرخ را می‌چرخاند؛ نرم و پیوسته
گاز بده.»
After: «ماسهٔ نرم، تپه‌های بلند و پرش‌ها. روی ماسه، گاز زیاد چرخ‌ها را هرز می‌گرداند؛ نرم و پیوسته
گاز بده.»
Why: three-item fragment stack trimmed to two nouns, tautology replaced with the real term
«هرزگردی», one tactic kept.

**6 — Settings helper** (`src/ui/app.ts`, sensitivity)
Before: «بیشتر = حرکت کمتر انگشت، گاز بیشتر»
After: «حساس‌تر: با حرکت کم انگشت، گاز بیشتری می‌گیری.»
Why: the `=` formula becomes a consequence in the second person; it also fixes the ambiguity of
"more" (more sensitivity, not more gas).

**7 — Manual-start toast** (`src/ui/app.ts`)
Before: «کلاچ را بالا بکش، دنده یک را بزن، بعد آرام رها کن»
After: «کلاچ را تا انتها بالا بکش، دندهٔ ۱ را بزن، بعد آرام رها کن.»
Why: «تا انتها» is the actual threshold the code checks, «دندهٔ ۱» matches the ezafe + Persian digit
pattern used on the gear selector, and the sentence gets its full stop.

**8 — Stall hint** (`src/ui/app.ts`)
Before: «موتور خاموش شد — دکمهٔ استارت را بزن»
After: «موتور خاموش شد؛ دکمهٔ روشن را بزن.»
Why: `؛` instead of the em dash, and «روشن» instead of the loanword «استارت» on a label the player
must find under pressure.

**9 — Pause modal header** (`src/ui/app.ts`)
Before: «توقف»
After: «بازی متوقف شد»
Why: the heading is a state, not an action; «توقف» is also the aria-label of the pause button, so the
player reads the same word twice for two different things.

**10 — Results metric** (`src/ui/app.ts`)
Before: «امتیاز مسیر»
After: «امتیاز اجرا»
Why: the metric scores this run, not the track; «مسیر» makes it sound like a property of the road
that the player cannot change.

---

## 9. Pre-merge checklist

Copy is done when all of these are true:

- [ ] Every number is Persian, except identifiers in §6.1.
- [ ] Units are spelled per §4 and the same screen does not mix `km/h` with «کیلومتر بر ساعت».
- [ ] No `=`، no `—`، no `!!`، no emoji, at most one `!` in the whole build.
- [ ] Every `می`/`نمی`, `ها`, `تر`, `ترین`, and compound has the half-space decided, not typed by feel.
- [ ] Ezafe on silent `ه` uses `ٔ`; no kasra diacritics.
- [ ] Every Latin run that touches punctuation or a number is isolated (`<bdi>`/LRM).
- [ ] Terminology matches §2 — no «گیربکس» on a spec label, no «نقطهٔ کلاچ», no «ایست» for checkpoint.
- [ ] No sentence promises opponents, cornering, or 3D behaviour.
- [ ] The same concept is not named twice on one screen (trim vs `transmissionFa`, «قدرت» twice).
- [ ] Every destructive action states its consequence, and a confirmation exists (see PD-10).

## 10. Open questions for product

1. **Naming.** «کریر» is transliterated and sits beside Persian screen names; the trial mode has
   three names («مسیر مانع»، «مسیر سخت»، the English `trial`). Pick one of each.
2. **Unit policy.** `km/h` or «کیلومتر بر ساعت» in dense specs. One of them must lose.
3. **Grip stat.** Show a tier instead of the 1.14 coefficient?
4. **Model names.** `320i` and `206` are written with Persian digits today; confirm Latin.
5. **Trial rules.** The card says «امتیاز ۶۴۰ برای طلا» but not how points are earned or lost.
6. **Pause exit.** «انتخاب مسیر» ends the run without warning. Copy or a dialog must say so.
