# ممیزی متن فارسی — CHARKHTAZ Copy Audit

**Type of review:** AI editorial pass. **No native Iranian editor has reviewed this document.**
Every proposal is a reasoned rewrite tied to a rule in
[`docs/PERSIAN_COPY_GUIDE.md`](PERSIAN_COPY_GUIDE.md); a Persian-speaking editor must sign off
before the copy ships.

**Snapshot:** working tree of 2026-11-12, `src/ui/app.ts` at roughly 70 KB / 1,420 lines.
That file changed twice during this pass (it grew from 40 KB to 70 KB with career, profile, upgrades
and rival racing) and was still being edited when the audit closed, so earlier drafts were discarded
and every row below was re-quoted and re-checked against the file at the end of the pass. If
`app.ts` has moved on, re-run the string check in *Evidence* before trusting a row.

**Scope:** player-facing Persian strings in `src/ui/app.ts`, `src/vehicles/profiles.ts`,
`src/tracks/definitions.ts`, `index.html`, `src/controls/pedals.ts`, `src/core/format.ts`,
`src/save/storage.ts`. One row (#45) quotes a model name from `src/vehicles/extra-cars.ts` because it
is what the garage renders for that car.
**Out of scope, reported in Appendix A:** `src/game/scene.ts`, `src/vehicles/extra-cars.ts`,
`src/vehicles/upgrades.ts`, `src/career/*`, and layout/CSS.

---

## Method and limits

- Read all seven files in scope; quoted strings as they appear in the source. Interpolated values are
  shown as they render (e.g. «۱۱۰ اسب» for `${faNum(car.specs.powerHp)} اسب`); `…` marks a value.
- Checked every "current" cell against the source by substring match (script, see *Evidence*).
- **Verified:** the literal text, its file, and the template around it.
- **Inferred, not measured:** how strings render in Vazirmatn on a phone, and how long a player needs
  to read a toast. No runtime or screenshot check was part of this pass.
- **Not done:** native-speaker judgement, screen-reader testing, translation memory.
- Documentation only: no code, test or config file was modified.

**Severity key**

| Sev | Meaning |
| --- | --- |
| **P1** | Wrong meaning, false claim, or a term that teaches the wrong thing |
| **P2** | Terminology drift, unit error, bidi/ZWNJ defect a player notices |
| **P3** | Polish: rhythm, length, punctuation, consistency |

---

## 1. What the audit found

| Finding | Count |
| --- | --- |
| Rows in the table below | 107 |
| P1 issues (meaning / claim / wrong term) | 10 |
| P2 issues (terminology, units, bidi, ZWNJ) | 71 |
| P3 issues (polish) | 26 |
| Distinct current strings quoted | 105 |
| Repeated templates identified | 12 |
| Strings that need a product decision (PD-01 … PD-11) | 11 |

Five patterns dominate:

1. **Measurements are mislabelled or truncated.** Torque is «نیوتون» (force, not N·m) in the hero and
   in both garage surfaces; weight is «کیلو»; engine speed is a bare «دور»; grip is a raw `1.14`.
2. **One concept, several names.** The sliders are «پدال» in settings and «اهرم» in the hero; the
   gearbox is «گیربکس» in the hero and «جعبه‌دنده» in the copy; the car is «ماشین» and «خودرو» on
   the same screen; retry is «دوباره» and «شروع دوباره».
3. **The UI still speaks developer.** «دستهٔ ارتقا»، «پروفایل فیزیک»، «داده‌های فیزیک»، «نمایش دیباگ»،
   «نویسه»، «آنچه می‌بینی نتیجهٔ همان اعداد است».
4. **Bidi is unmanaged.** Persian digits inside Latin model names (`۳۲۰i`, `۲۰۶`), a Latin track name
   after a Persian region, «+۵ ثانیه» and «+۱٬۲۰۰ اعتبار» with a leading plus, «۴/۸» with a slash.
5. **Copy carries hardcoded counts.** «هشت خودروی واقعی»، «ده رویداد»، «۳ حریف»، «دستهٔ ارتقا ۸» will
   drift the day the data changes.

---

## 2. The audit table

Format: **current** is what ships today, **improved** is the exact replacement.

### 2.1 Home, navigation and brand

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 1 | P2 | Home · hero kicker · app.ts | بازی مسابقه‌ای دوبعدی · ایران | slop: three nouns and a middot; «ایران» dangles with no verb or relation | مسابقهٔ دوبعدی در جاده‌های ایران |
| 2 | P1 | Home · hero lead · app.ts | سه اهرم آنالوگ، ماشین واقعی و جاده‌ای که بخشش نمی‌کند. | term: «اهرم» for a slider the settings call پدال; «ماشین» vs «خودرو»; «بخشش نمی‌کند» anthropomorphic | سه پدال آنالوگ، یک خودروی واقعی و جاده‌ای که خطا را جبران نمی‌کند. |
| 3 | P2 | Home · hero body · app.ts | آنچه می‌بینی نتیجهٔ همان اعداد است، نه یک انیمیشن آماده. | developer voice: «اعداد» means nothing to a player; «انیمیشن آماده» argues with an imaginary rival | هر چه می‌بینی، نتیجهٔ محاسبهٔ همان لحظه است. |
| 4 | P3 | Home · hero meta · app.ts | خودروی واقعی | repetition: the realism claim already appears in the hero lead, two lines above | خودرو |
| 5 | P2 | Home · hero meta · app.ts | دستهٔ ارتقا | jargon: «دسته» is a UI category word; the number counts upgrade groups | گروه‌های ارتقا |
| 6 | P2 | Nav · app.ts | کریر | term: transliterated "career" beside Persian «گاراژ»، «پروفایل»؛ the rest of the product names its screens in Persian | حرفه |
| 7 | P2 | Top bar · app.ts | CHARKHTAZ · RACE · SHIFT · CONQUER | slop: English marketing filler in a Persian-first UI; «CONQUER» is the empty superlative the voice bans | CHARKHTAZ |
| 8 | P2 | Home · section sub · app.ts | همه‌چیز آفلاین و روی همین دستگاه | formal/ZWNJ: «همه‌چیز» needs a half-space, «آفلاین» is a network word; the sentence promises a feature instead of stating one | همهٔ حالت‌ها بدون اینترنت، روی همین دستگاه. |
| 9 | P2 | Home · hero stat · app.ts | قدرت · ۱۱۰ اسب | unit: «اسب» alone is a horse; every full spec row says «اسب بخار» | قدرت · ۱۱۰ اسب بخار |
| 10 | P1 | Home · hero stat · app.ts | گشتاور · ۱۷۸ نیوتون | unit: torque is نیوتون‌متر; «نیوتون» is force, so the number is meaningless | گشتاور · ۱۷۸ نیوتون‌متر |
| 11 | P2 | Home · hero stat · app.ts | گیربکس · دستی | term: the rest of the build says «جعبه‌دنده»; the value drops the gear count that defines the car | جعبه‌دنده · دستی ۵سرعته |
| 12 | P2 | Home · panel · app.ts | ماشین انتخابی | consistency: the same screen says «خودرو» three times and «ماشین» twice | خودروی انتخابی |
| 13 | P2 | Home · panel · app.ts | رویداد بعدی کریر | term/repetition: «کریر» duplicated from the nav; the chapter line below already says which chapter | رویداد بعدی |
| 14 | P3 | Home · panel · app.ts | ارتقا و تیونینگ | redundancy: two words for one idea, one Persian and one transliterated | تیونینگ |
| 15 | P2 | Home · CTA · app.ts | شروع مسابقه | clarity: the button opens the track picker for the last mode, not necessarily a race | انتخاب مسیر |

### 2.2 Modes

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 16 | P2 | Mode desc · race · app.ts | با دو تا سه حریف واقعی روی همان فیزیک، از خط شروع تا خط پایان. | colloquial «دو تا سه» in UI; «حریف واقعی» overclaims AI drivers; «روی همان فیزیک» is developer speech; no verb for the player | با دو یا سه حریف، از خط شروع تا خط پایان. |
| 17 | P2 | Mode desc · time · app.ts | بدون حریف؛ فقط تو، زمان و شبح بهترین اجرای قبلی. | term: «شبح» is a literal ghost translation; Persian racing copy says «رد» or keeps «گوست» | بدون حریف؛ فقط تو، زمان و ردِ بهترین اجرای قبلی. |
| 18 | P2 | Mode desc · trial · app.ts | مسیر سخت با امتیاز، جریمه و مدال. مهارت مهم‌تر از سرعت خام است. | slop: «سرعت خام» is not a term; «مسیر سخت» says nothing about obstacles, which is the mode's whole identity | مسیر مانع با امتیاز، جریمه و مدال؛ مهارت مهم‌تر از سرعت است. |
| 19 | P2 | Mode desc · practice · app.ts | بدون فشار زمان و بدون جریمه؛ برای یاد گرفتن کلاچ و کنترل گاز. | repetition: «بدون… و بدون…»; «یاد گرفتن» where the mode is practice | بدون زمان و جریمه؛ برای تمرین کلاچ و کنترل گاز. |
| 20 | P3 | Mode label · app.ts | رکورد زمانی | literal: a calque of "time record"; the genre word is «زمان‌سنجی» | زمان‌سنجی |
| 21 | P2 | Mode label · app.ts | مسیر مانع | clarity: singular «مانع» for a mode built on a sequence of obstacles; the card also calls it «مسیر سخت», a third name for one mode | مسیر موانع |

### 2.3 Profile

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 22 | P2 | Profile · sub · app.ts | پیشرفت، دستاوردها و کلکسیون؛ همه محلی. | loanword «کلکسیون» beside Persian nouns; «همه محلی» is an adjective fragment | پیشرفت، دستاوردها و خودروها؛ همه روی همین دستگاه. |
| 23 | P3 | Profile · stat · app.ts | ۳ طلایی | clarity: a number and an adjective with no noun; reads as "three golden" | ۳ مدال طلایی |
| 24 | P2 | Profile · stat · app.ts | ۴/۸ | bidi/format: a slash between Persian numerals reads as a date or reverses in RTL | ۴ از ۸ |
| 25 | P2 | Profile · prompt · app.ts | نام راننده (حداکثر ۲۴ نویسه) | term: «نویسه» is a typography word (character/glyph); players count letters | نام راننده (حداکثر ۲۴ حرف) |
| 26 | P3 | Profile · default name · storage.ts | رانندهٔ مهمان | clarity: a compound default name that reads like a guest account; shorter is friendlier in the avatar and the standings | مهمان |
| 27 | P3 | Profile · hint · app.ts | تا سطح ۸: ۱٬۲۰۰ تجربه | order: the goal comes before the amount; Persian reads the number first when it is the point | ۱٬۲۰۰ تجربه تا سطح ۸ |

### 2.4 Career

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 28 | P2 | Career · sub · app.ts | ده رویداد، از اولین تعویض دنده تا فینال کمربندی. | hardcoded count («ده») while events are data; «فینال کمربندی» assumes the player knows the track | ۱۰ رویداد، از اولین تعویض دنده تا فینال. |
| 29 | P2 | Career · card · app.ts | امتیاز ۶۴۰ برای طلا | clarity: a bare number before its noun; it reads as "score 640" (a command) rather than a threshold | ۶۴۰ امتیاز برای مدال طلا |
| 30 | P3 | Career · card · app.ts | زمان طلا: ۱:۰۵.۲۰ · نقره: ۱:۱۲.۴۰ | repetition: «زمان» governs only the first medal; the second is a bare word | طلا ۱:۰۵.۲۰ · نقره ۱:۱۲.۴۰ |
| 31 | P3 | Career · button · app.ts | تکرار | clarity: «تکرار» can mean replay, retry or repeat the reward; the action re-runs the event | اجرای دوباره |
| 32 | P2 | Career · toast · app.ts | این رویداد هنوز قفل است | clarity: says no without the condition that unlocks it; the player has no next step | برای باز شدن این رویداد، رویداد قبلی را تمام کن. |
| 33 | P3 | Career · chip · app.ts | کامل | clarity: «کامل» reads as "complete/perfect"; the chip means the event is finished | تمام‌شده |
| 34 | P3 | Career · meta · app.ts | جایزه: ۱۲٬۰۰۰ اعتبار | punctuation: the colon adds a second separator in a row of four stats; the chip row already separates items | جایزه ۱۲٬۰۰۰ اعتبار |

### 2.5 Garage and purchase

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 35 | P2 | Garage · sub · app.ts | هشت خودروی واقعی؛ هرکدام شخصیت مکانیکی و شکل خودش را دارد. | hardcoded count («هشت») while the list is `ALL_CARS`; «شخصیت مکانیکی» is an abstraction | ۸ خودروی واقعی؛ هرکدام رفتار و شکل خودش را دارد. |
| 36 | P2 | Garage · card stat · app.ts | قدرت · ۱۱۰ اسب | unit: same truncation as the hero, now in a second component | قدرت · ۱۱۰ اسب بخار |
| 37 | P2 | Garage · spec · app.ts | وزن · ۱٬۲۹۰ کیلو | unit: «کیلو» is spoken shorthand; every other mass value is «کیلوگرم» | وزن · ۱٬۲۹۰ کیلوگرم |
| 38 | P2 | Garage · spec · app.ts | ترمز · ۵٬۲۰۰ نیوتون‌متر | clarity: the label names the system, the value is brake torque; a player reads it as "the brakes weigh 5200" | گشتاور ترمز · ۵٬۲۰۰ نیوتون‌متر |
| 39 | P2 | Garage · spec · app.ts | وضعیت · ۸۵٪ | clarity: "status" of what? Only body condition is shown | سلامت بدنه · ۸۵٪ |
| 40 | P1 | Garage · spec · app.ts | چسبندگی · ۱٫۱۴ | clarity: a raw friction coefficient on a 1.25 display scale; no player can interpret 1.14 | چسبندگی · بالا (needs PD-02) |
| 41 | P2 | Garage · button · app.ts | تعمیرگاه | clarity: a place, used as an action button; every other button is a verb | تعمیر |
| 42 | P2 | Garage · buy button · app.ts | خرید ۴۲٬۰۰۰ اعتباری | grammar/unit: «اعتباری» is an adjective ("credit-based"), not the currency name; reads as "buy 42,000 credit-ish" | خرید با ۴۲٬۰۰۰ اعتبار |
| 43 | P2 | Garage · toast · app.ts | اعتبار کافی نیست؛ اول مسابقه بده | colloquial: «مسابقه بده» is spoken slang for "run a race"; also no path to the mode | اعتبار کافی نیست؛ اول در مسابقه‌ها اعتبار جمع کن. |
| 44 | P2 | Garage · toast · app.ts | اول باید این خودرو را بخری | consistency: the upgrade screen says «اول خودرو را بخر» — two phrasings of one rule | اول این خودرو را بخر. |
| 45 | P1 | Garage · model name · extra-cars.ts | ۲۰۶ | bidi/name: Persian digits in a Latin model designator; the car is a 206 and that is how it is badged | 206 (needs PD-03) |

### 2.6 Upgrades

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 46 | P2 | Upgrades · sub · app.ts | قطعه‌ها روی همان پروفایل فیزیک اثر می‌گذارند؛ عدد تزئینی نیست. | developer voice: «پروفایل فیزیک» is an internal structure; the defensive half-sentence argues instead of explaining | هر قطعه روی شبیه‌سازی اثر می‌گذارد؛ اعداد نمایشی نیستند. |
| 47 | P2 | Upgrades · button · app.ts | بازگشت به کارخانه | clarity: reads as "go back to the factory" (navigation); the action removes installed parts | بازگرداندن قطعات به حالت کارخانه |
| 48 | P3 | Upgrades · button · app.ts | نصب و خرید | order: the player pays first, then the part is installed; the label reverses the sequence | خرید و نصب |
| 49 | P2 | Upgrades · toast · app.ts | این قطعه با این خودرو سازگار نیست | clarity: "not compatible" without the reason, although the code knows it and already writes a better message elsewhere | این قطعه برای این خودرو نیست؛ جعبهٔ آن خودکار است. |
| 50 | P2 | Upgrades · toast · app.ts | تنظیمات به حالت کارخانه برگشت | wrong noun: nothing in «تنظیمات» changed; the parts did | قطعات به حالت کارخانه برگشتند. |
| 51 | P2 | Upgrades · preview · app.ts | خودروی شما | address: the product otherwise speaks in the second person singular («تو») | خودروی تو |
| 52 | P3 | Upgrades · section sub · app.ts | رنگ و رینگ در گاراژ و مسیر اعمال می‌شود | formal: «اعمال می‌شود» is administrative; the player wants to know it will be visible | رنگ و رینگ در گاراژ و مسیر دیده می‌شود. |
| 53 | P3 | Upgrades · toast · app.ts | اول خودرو را بخر | consistency: see #44; keep one phrasing across garage and upgrades | اول این خودرو را بخر. |

### 2.7 Tracks

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 54 | P3 | Tracks · selection label · app.ts | مسیر انتخاب‌شده | clarity: heavy participle for a label; «انتخابی» is the natural form | مسیر انتخابی |
| 55 | P2 | Tracks · CTA · app.ts | شروع | clarity: a bare verb in a bar that also names the track; starting what? | شروع مسابقه |
| 56 | P2 | Track card · app.ts | البرز مرکزی · Jajrud Pass | bidi/necessity: a Latin name tails a Persian line and reorders around the middot; decorative for a Persian reader | البرز مرکزی |
| 57 | P1 | Jajrud · description · definitions.ts | آسفالت کوهستانی با شیب‌های طولانی، یک پرش سنگی و پیچ‌های تند. | claim: «پیچ‌های تند» promises cornering; the route has slopes, a rock, a ramp and a gap, no corners | آسفالت کوهستانی با شیب‌های طولانی، یک پرش سنگی و یک گودال. |
| 58 | P2 | Lut · description · definitions.ts | گاز زیاد روی ماسه فقط چرخ را می‌چرخاند | repetition: «چرخ را می‌چرخاند» says nothing; the phenomenon is wheelspin | روی ماسه، گاز زیاد چرخ‌ها را هرز می‌گرداند |
| 59 | P3 | Lut · description · definitions.ts | پرش‌های خشک | clarity: "dry jumps" is not something a driver can picture; the track has short jumps on sand | پرش‌های کوتاه |
| 60 | P2 | Hyrcanian · description · definitions.ts | گِل، ریشه و مه. چسبندگی کم است؛ کلاچ را آهسته رها کن و از چرخش بی‌مهار جلوگیری کن. | slop/formal: three-noun fragment stack; «از چرخش بی‌مهار جلوگیری کن» is bureaucratic for "don't spin the wheels" | گل و لای، ریشه و مه. چسبندگی کم است؛ کلاچ را آهسته رها کن تا چرخ‌ها هرز نچرخند. |
| 61 | P3 | Tehran · description · definitions.ts | آسفالت شهری، بلوک‌های بتنی و مسیر باریک بین توده‌های لاستیک. سرعت بالا، حاشیهٔ خطای کم. | slop: two fragment sentences; «توده‌های لاستیک» is a literal rendering of "tyre stacks" | آسفالت شهری، بلوک بتنی و مسیر باریک بین توده‌های لاستیک: سریع، با حاشیهٔ خطای کم. |
| 62 | P2 | Zagros · description · definitions.ts | شیب‌های سنگین سنگ و خاک. | repetition/wrong: "heavy slopes of stone and soil" stacks two materials after an adjective that already implies weight | شیب‌های تند سنگی و خاکی. |
| 63 | P2 | Kavir · description · definitions.ts | کم بودن سرعت یعنی سقوط در گودال، زیاد بودن یعنی فرود سخت. | slop: two nominal clauses ("being low… being high…") where a driver would name the speed and the result | سرعت کم، سقوط در گودال؛ سرعت زیاد، فرود سخت. |
| 64 | P2 | Tehran · name · definitions.ts | کمربندی جنوبی | clarity: which city's ring road? The region chip says تهران but results and pause show the name alone | کمربندی جنوبی تهران |
| 65 | P2 | Lut · name · definitions.ts | تلماسه‌های لوت | term: «تلماسه» is a geology term Iranians do not use for dunes; the common word is تپهٔ شنی | تپه‌های شنی لوت |
| 66 | P3 | Biomes · definitions.ts | شهری | consistency: an adjective among three nouns (کوهستان، کویر، جنگل); biome chips should all be places | شهر |

### 2.8 Settings

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 67 | P3 | Settings · sub · app.ts | کنترل، صدا و نمایش. تغییرات همان لحظه ذخیره می‌شوند. | consistency: singular «کنترل» where the screen has four control rows; «تغییرات» is plural bookkeeping | کنترل‌ها، صدا و نمایش. تغییرها همان لحظه ذخیره می‌شوند. |
| 68 | P2 | Settings · row · app.ts | چیدمان راست‌دست یا چپ‌دست | clarity: «راست‌دست» describes a person's handedness, not a layout; players wonder if it changes steering | پدال‌ها در سمت راست یا چپ صفحه |
| 69 | P2 | Settings · helper · app.ts | بزرگ‌تر برای انگشت‌های بزرگ‌تر | slop: circular — bigger is for bigger; nothing about what changes or when to use it | برای دست‌های بزرگ‌تر، پدال‌ها را بزرگ‌تر کن. |
| 70 | P2 | Settings · helper · app.ts | کمتر = دید بهتر جاده | punctuation: an equals sign as a sentence; also ambiguous whether "less" is less opacity or less transparency | کمترش کن تا جاده بهتر دیده شود. |
| 71 | P2 | Settings · helper · app.ts | بیشتر = حرکت کمتر انگشت، گاز بیشتر | punctuation/clarity: formula plus two competing "more"s; the slider direction is unreadable | حساس‌تر: با حرکت کم انگشت، گاز بیشتری می‌گیری. |
| 72 | P3 | Settings · row · app.ts | موتور، تایر، برخورد و رابط | clarity: «رابط» (interface) is a developer noun; add the head noun «صدا» once | صدای موتور، تایر، برخورد و منوها |
| 73 | P2 | Settings · row · app.ts | پیش‌فرض ۸۰٪ | clarity: a static default next to a live slider; after the player moves it, the note still says 80% | الان ۸۰٪ (needs code to read the value) |
| 74 | P2 | Settings · row · app.ts | حذف انیمیشن‌های غیرضروری رابط | slop: "unnecessary interface animations" dismisses the feature it describes; accessibility copy should say what improves | کم کردن انیمیشن‌های صفحه |
| 75 | P2 | Settings · row · app.ts | نمایش داده‌های فیزیک | term: "physics data" is the developer's name for the overlay; the accessible name below still says «دیباگ» | نمایش اطلاعات فنی |
| 76 | P2 | Settings · aria label · app.ts | نمایش دیباگ | consistency/a11y: visible label and accessible name describe different features; screen-reader users hear «دیباگ» | نمایش اطلاعات فنی |
| 77 | P1 | Settings · destructive · app.ts | پاک کردن همهٔ داده‌ها | term: «داده‌ها» is a database word for progress, credits and settings; the confirm dialog underneath already says it better | پاک کردن همهٔ پیشرفت و تنظیمات |
| 78 | P3 | Settings · footer · app.ts | نسخهٔ ۱٫۰ · ذخیره فقط روی همین دستگاه | clarity: «ذخیره» as a bare noun reads as a save button; the claim needs a subject | نسخهٔ ۱٫۰ · پیشرفت فقط روی همین دستگاه ذخیره می‌شود |

### 2.9 HUD, standings and toasts

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 79 | P2 | HUD · speed unit · app.ts | کیلومتر بر ساعت | layout: three words under a three-digit number; the garage and results use `km/h` for the same quantity (PD-01) | km/h (isolated) |
| 80 | P2 | HUD · rpm · app.ts | دور | clarity: «دور» alone is not a unit and collides with "lap"; the value is engine speed | دور بر دقیقه |
| 81 | P2 | HUD · start button · app.ts | استارت | term: loanword on the one button a stalled player must find fast; the rest of the HUD is Persian | روشن |
| 82 | P3 | HUD · pause aria · app.ts | توقف | clarity: "stop" vs "pause"; the control pauses, it does not end the run | توقف بازی |
| 83 | P3 | HUD · standings · app.ts | ۱۲ م | unit: «م» is a one-letter abbreviation while every other distance says «متر» | ۱۲ متر |
| 84 | P2 | Toast · manual start · app.ts | کلاچ را بالا بکش، دنده یک را بزن، بعد آرام رها کن | punctuation/term: three clauses in a comma splice, no threshold named, «دنده یک» breaks the ezafe pattern; 2.6 s is not enough to read it (PD-04) | کلاچ را تا انتها بالا بکش، دندهٔ ۱ را بزن، بعد آرام رها کن. |
| 85 | P2 | Toast · automatic start · app.ts | دنده روی D است؛ فقط گاز بده | bidi: a bare Latin letter between two Persian phrases can jump; otherwise good | دنده روی `<bdi>D</bdi>` است؛ فقط گاز بده. |
| 86 | P2 | Toast · gear refused · app.ts | برای تغییر دنده، کلاچ را تا انتها بگیر | punctuation/term: comma splice; «تغییر دنده» where the copy says «تعویض دنده» | برای تعویض دنده، کلاچ را کامل بگیر. |
| 87 | P3 | Toast · gear busy · app.ts | دنده در حال تعویض است | clarity: reports a state with no next step and no sense of duration | دنده در حال تعویض است؛ دست نگه دار. |
| 88 | P3 | Toast · gear unavailable · app.ts | این دنده در دسترس نیست | clarity: says no without saying why or what to do; the player will tap again | این دنده در دسترس نیست؛ دندهٔ نزدیک‌تر را بزن. |
| 89 | P1 | Hint · stall · app.ts | موتور خاموش شد — دکمهٔ استارت را بزن | punctuation/term: em dash plus the loanword «استارت» on the line that must be read fastest | موتور خاموش شد؛ دکمهٔ روشن را بزن. |
| 90 | P2 | Hint · neutral · app.ts | کلاچ را بگیر و دنده ۱ را انتخاب کن | consistency: «دنده ۱» here, «دنده یک» in the toast, «دندهٔ ۱» nowhere | کلاچ را بگیر و دندهٔ ۱ را انتخاب کن. |
| 91 | P2 | Toast · not owned · app.ts | این خودرو در گاراژ شما نیست | voice: passive location phrasing plus «شما» in a product that otherwise says «تو» | این خودرو را نداری. |

### 2.10 Pause and results

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 92 | P2 | Pause · heading · app.ts | توقف | clarity: a noun where a state belongs; reads like the button, not the state | بازی متوقف شد |
| 93 | P2 | Pause + Results · metric · app.ts | سرعت اوج | literal: a word-for-word rendering of "peak speed"; Persian says بیشترین سرعت | بیشترین سرعت |
| 94 | P2 | Pause · action · app.ts | انتخاب مسیر | clarity: leaves the run and discards it, with no warning (PD-10) | انتخاب مسیر دیگر (پایان اجرا) |
| 95 | P2 | Pause / Results · retry · app.ts | شروع دوباره | consistency: the results screen offers «دوباره» for the same action | شروع دوباره (both screens) |
| 96 | P2 | Results · metric · app.ts | امتیاز مسیر | clarity: reads as "the track's score", but it is the score of this run | امتیاز اجرا |
| 97 | P2 | Results · value · app.ts | +۵ ثانیه | bidi: a leading plus before a Persian number jumps sides in RTL; put the unit in words | ۵ ثانیه جریمه |
| 98 | P2 | Results · reward · app.ts | +۱٬۲۰۰ اعتبار · +۲۵۰ تجربه | bidi: two leading plus signs at the start of an RTL chip; the plus is decorative, not arithmetic | ۱٬۲۰۰ اعتبار · ۲۵۰ تجربه |
| 99 | P2 | Results · button · app.ts | دوباره | clarity: a single adverb as a button; ambiguous between "again" and "restart the whole event" | تلاش دوباره |
| 100 | P3 | Results · button · app.ts | مسیر دیگر | clarity: means "pick another track", not "another route on this track"; consistent wording would match the pause screen | انتخاب مسیر |

### 2.11 Errors, persistence, accessibility, shell

| # | Sev | Where | Current string (fa) | Problem | Improved (fa) |
| --- | --- | --- | --- | --- | --- |
| 101 | P2 | Respawn reason · app.ts | بازگشت دستی | clarity: names the trigger, not the destination; the toast does not say where the player reappears | بازگشت دستی به چک‌پوینت |
| 102 | P1 | Error · app.ts | Unknown car: ${id} | error state: an English developer string thrown at runtime; `getAnyCar` throws and the player gets a blank screen with no recovery path (PD-06) | این خودرو پیدا نشد؛ به گاراژ برگرد. |
| 103 | P1 | Error · app.ts | Missing element: ${selector} | error state: same class of failure; `qs` throws during screen construction, so the player sees a half-built page | بازی بارگذاری نشد؛ صفحه را دوباره باز کن. |
| 104 | P1 | Persistence · storage.ts | (no string) | empty state: a corrupt save is silently replaced by defaults and copied to `.corrupt`; the player loses progress with no message (PD-05) | ذخیرهٔ بازی خوانده نشد؛ با تنظیمات اولیه شروع شد. |
| 105 | P3 | Format · format.ts | — | clarity: an em dash as a value does not say whether the time is missing or the run was invalid | ثبت نشده |
| 106 | P2 | Pedals · a11y · pedals.ts | aria-valuenow="68" | a11y: the screen reader announces a Latin number inside a Persian UI, and there is no `aria-valuetext`; the visible value is «۶۸٪» | aria-valuetext="۶۸ درصد" |
| 107 | P2 | Shell · index.html | چرخ‌تاز CHARKHTAZ | bidi: two scripts in a tab title separated only by a space; the Latin name can precede the Persian one in some renderers | چرخ‌تاز: بازی دوبعدی مسابقه و مهارت |

---

## 3. Repeated templates

Twelve rhetorical patterns repeat. Repetition is not a bug in labels, but a repeated *sentence
shape* is what makes copy read machine-written.

| ID | Template | Instances | Why it reads generated | How to vary |
| --- | --- | --- | --- | --- |
| T1 | «بدون X و بدون Y؛ برای …» | practice card (#19), time card (#17) | two of four mode cards open with a negation, so the modes are defined by what they lack | Define each mode by what the player does: race = beat rivals, time = beat your ghost, trial = score without penalties, practice = learn the clutch |
| T2 | Setting line + «=» + benefit | 3 settings rows (#69–#71) | three consecutive rows with a formula make the screen read like a spec sheet | Convert all three to commands with a consequence: «کمترش کن تا…»، «حساس‌تر: …»، «بزرگ‌تر کن اگر…» |
| T3 | Three-adjective tagline with kasra | 3 of 8 cars (Shahin, Prado, BMW) | identical rhythm, so eight cars sound like one voice describing props | Give each car a tagline type: a number (BMW), a use case (Prado), a promise (Shahin), a warning (206) |
| T4 | Long description: enumeration → colon → advice | 8 of 8 cars (profiles.ts + extra-cars.ts) | every car description ends with the same colon-advice gesture, and the first sentence carries four facts | Cap the first sentence at 12 words; vary the advice opener per car |
| T5 | Track description: fragment stack + one imperative | 6 of 6 tracks (#57–#63) | same two-beat shape on every card, so players stop reading after the second | Rotate three shapes: hazard-first, number-first, action-first — no shape twice in a row |
| T6 | Latin name appended after a Persian region | 6 of 6 track cards (#56) | decorative bilingual pairing that reorders around the middot | Drop from the card; keep `nameEn` in data and in `title`/search only |
| T7 | «بازگشت» / «خانه» / «منو» for one destination | nav + page heads | the top bar now says «خانه» while older screens said «بازگشت»; the results screen says «خانه» | One verb per direction: «خانه» for the hub, «بازگشت» only one level up |
| T8 | Retry labelled three ways | «شروع دوباره» (#95), «دوباره» (#99), «تکرار» (#31) | three strings for one action across three screens | Pick one word per context: «تلاش دوباره» for a run, «اجرای دوباره» for an event |
| T9 | «سرعت اوج» in pause and results | 2 screens (#93) | same metric, same calque, twice per run | Use «بیشترین سرعت»; in pause, show live speed instead of the peak |
| T10 | Stat trio «قدرت / گشتاور / چسبندگی» on every card | 8 cards × 3 stats | identical order and units, so cars cannot be compared at a glance | Lead each card with the stat that defines the car; keep the rest secondary |
| T11 | Sentence opening with «برای …» | 2 (#86 and the upgrades hint «برای خرید این خودرو به گاراژ برو») | the same conditional opener carries two unrelated messages | One opens with the action, the other with the state |
| T12 | Source note: «X از Y؛ Z تخمین است.» | 3 of 8 cars reviewed (#41–#43) | identical hedging formula, slash lists, unverifiable «منابع مستقل» | One sentence of provenance, one of uncertainty, and the full source in `docs/VEHICLE_DATA_SOURCES.md`; vary the sentence, not the facts |

**Variation rule for track cards.** With six cards on one screen, no more than two may start with the
same grammatical shape. Rotate: (a) hazard first, (b) number first, (c) driver action first. The
hazard is what the player will hit; naming it first is also the most useful copy.

**Variation rule for mode cards.** Each card answers a different question — *who do I beat?* (race),
*what do I beat?* (time), *what do I score?* (trial), *what do I learn?* (practice). Write the
answer, not the negation of the other three.

---

## 4. Terminology drift

| Concept | Forms found | Where | Decision |
| --- | --- | --- | --- |
| the three sliders | «پدال» / «اهرم» | settings, hero | **پدال** |
| gearbox | «گیربکس» / «جعبه‌دنده» | hero, garage, upgrades category | **جعبه‌دنده** on labels; «گیربکس» only as an upgrade category name if it stays a proper term |
| vehicle | «ماشین» / «خودرو» | hero, home panel, garage | **خودرو** |
| power unit | «اسب» / «اسب بخار» | hero, cards, specs | **اسب بخار** |
| torque unit | «نیوتون» / «نیوتون‌متر» | hero, cards, specs | **نیوتون‌متر** |
| mass unit | «کیلو» / «کیلوگرم» | garage, upgrades | **کیلوگرم** |
| top speed | «سرعت اوج» / «حداکثر سرعت» | pause, results, garage | **بیشترین سرعت** live, **حداکثر سرعت** spec |
| gear change | «تغییر دنده» / «تعویض دنده» | toast, hints, copy | **تعویض دنده** |
| gear ordinal | «دنده یک» / «دنده ۱» / «دندهٔ ۱» | toast, hint | **دندهٔ ۱** |
| career | «کریر» / «حرفه» | nav, home panel, page | **حرفه** |
| retry | «دوباره» / «شروع دوباره» / «تکرار» | results, pause, career | one per context (see T8) |
| player address | «تو» / «شما» | hints, toasts, prompt | **تو** |
| debug overlay | «اطلاعات فیزیک» / «داده‌های فیزیک» / «دیباگ» | settings | **اطلاعات فنی** |

---

## 5. Strings that need a product decision

| ID | Decision needed | Why it blocks copy | Options |
| --- | --- | --- | --- |
| **PD-01** | `km/h` or «کیلومتر بر ساعت»? | Garage, pause and results use `km/h`; the HUD spells it out; the guide forbids mixing | Latin in dense specs, spelled in HUD labels, one per screen |
| **PD-02** | Show grip as a coefficient or a tier? | «۱٫۱۴» is a physics number, not a player value | Tier word («بالا») vs normalized ۰–۱۰۰ bar with the coefficient in debug only |
| **PD-03** | Latin or Persian digits in model names? | `320i` and `206` are written with Persian digits today, breaking bidi and the real badge | Latin (`320i`, `206`), Persian brand form allowed |
| **PD-04** | Toast lifetime vs instruction length | The manual-start instruction is about 50 characters shown for 2.6 s | Longer duration for tutorial toasts, or split into two toasts |
| **PD-05** | Silent save recovery | A corrupt save resets progress with no message | One-time toast: «ذخیرهٔ بازی خوانده نشد…» |
| **PD-06** | No player-facing error state | `getAnyCar`/`getTrack`/`qs` throw; the player sees a blank or partial screen | Minimal error screen with «بازگشت به خانه» |
| **PD-07** | Counts hardcoded in copy | «هشت خودروی واقعی»، «ده رویداد»، «دستهٔ ارتقا ۸» will be wrong after the next content drop | Interpolate `ALL_CARS.length`, `CAREER_EVENTS.length`, `UPGRADE_CATEGORIES.length` |
| **PD-08** | Is «کریر» the product's word? | It is transliterated, sits beside Persian screen names, and appears in three places | «حرفه» / «مسیر حرفه‌ای» / keep «کریر» as a genre loanword — but decide once |
| **PD-09** | Trial mode copy | «مسیر مانع» is the mode name, but the card says «مسیر سخت» and the score rule only appears as «امتیاز ۶۴۰ برای طلا» | A one-line rule on the card: score, penalties, medal thresholds |
| **PD-10** | Pause «انتخاب مسیر» abandons the run silently | The player can lose a run without knowing | Warn in the label or confirm on tap |
| **PD-11** | Default driver name «رانندهٔ مهمان» | It appears in the avatar, standings and profile | Shorter default («مهمان») or ask on first launch |

---

## Appendix A — out of scope, reported only

Player-facing strings outside the audited files. **No file was edited.**

| File | Current | Issue | Suggested |
| --- | --- | --- | --- |
| `src/game/scene.ts` | بازگشت به آخرین ایست | checkpoint called «ایست» | بازگشت به آخرین چک‌پوینت |
| `src/game/scene.ts` | واژگونی | no destination in the message | واژگونی؛ بازگشت به چک‌پوینت |
| `src/game/scene.ts` | گیر کردن | no destination in the message | گیر کردن؛ بازگشت به چک‌پوینت |
| `src/vehicles/extra-cars.ts` | ۲۰۶ تیپ ۲ با موتور ۱٫۴ لیتری هشت‌سوپاپ… | 90-word first sentence; «فرمانی که هرچه تندتر بروی دقیق‌تر می‌شود» claims steering feedback the 2D model does not simulate | split into three sentences; drop the steering claim |
| `src/vehicles/extra-cars.ts` | تارا نسخهٔ ایرانی پژو ۳۰۱ است | model comparison is fine, but the sentence runs 45 words and mixes «پیست» with a game that has no circuit | shorten; replace «پیست» with «مسیر» |
| `src/vehicles/extra-cars.ts` | در پیچ سنگین و کم‌فرمان | cornering claim, same 2D problem as #57 | «در سرازیری‌های تند، فرمان‌پذیری کمتری دارد» only if the simulation models it; otherwise drop |
| `src/vehicles/upgrades.ts` | دور بیشینه +۱۲۰ | «دور بیشینه» is a calque; also the unit is missing | «حداکثر دور +۱۲۰» |
| `src/vehicles/upgrades.ts` | کورس کمتر | «کورس» (travel) is workshop slang, unexplained in UI | «کمتر فرو می‌رود» |
| `src/vehicles/upgrades.ts` | این خودرو کلاچ پدالی ندارد؛ جعبهٔ خودکار است. | good message; only «پدالی» is redundant | «این خودرو کلاچ ندارد؛ جعبهٔ آن خودکار است.» |

Dead or unused copy observed while reading (not edited):

- `SURFACE_LABELS_FA` exists in `profiles.ts` but no screen imports it any more; surface names never
  reach the player.
- `formatSeconds()` is exported but unused; only `formatTime()` renders.
- `PAGE`-level `carSubtitle()` is now used, but its `· year · transmission` triple duplicates the trim
  line and `transmissionFa` on the same card (#21 in the earlier draft, still true).

---

## Evidence

- Every "current" string in the tables was checked against every `.ts` file under `src/` plus
  `index.html` by substring match, after stripping the `…` placeholders and digits. 103 of 107 rows
  matched literally; the four exceptions are template composites whose literal fragments are present
  (#27, #34, #42) and #104, which records an absence of copy in `storage.ts`, not a string.
- The audit was rebuilt after `src/ui/app.ts` changed during the pass (40 KB → 70 KB). Earlier drafts
  quoting the old screens were discarded rather than patched, because patched quotes drift.
- No code, test or configuration file was modified; the only files written are this audit and
  `docs/PERSIAN_COPY_GUIDE.md`.
- This is an **AI editorial pass**, not a native-speaker review, and must not be described as one.
