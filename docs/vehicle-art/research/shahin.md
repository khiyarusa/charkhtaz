## Identity

| Field | Value | Confidence | Source |
| --- | --- | --- | --- |
| Exact model | Saipa Shahin 1.5 turbo, model code SP100 | confirmed | [Wikipedia — Saipa Shahin](https://en.wikipedia.org/wiki/Saipa_Shahin) |
| Model year | 2022 (Iranian 1401) | confirmed | [Khodrobank — Shahin](https://www.khodrobank.com/cars/%D8%B3%D8%A7%DB%8C%D9%BE%D8%A7/444/%D8%B3%D8%A7%DB%8C%D9%BE%D8%A7-%D8%B4%D8%A7%D9%87%DB%8C%D9%86) |
| Trim | roster's **"GLX" is not confirmed**; Saipa's published 5-speed trims for 1401 are **GL** and **G** | medium (see note) | [Otex — Shahin trims](https://otex.ir/blog/review-of-saipa-shahin-types-with-comparison-table) |
| Body style | 4-door, 5-seat compact sedan (C-segment) | confirmed | [Saipa owner's handbook](https://www.kianbattery.com/wp-content/uploads/2021/08/%D8%B4%D8%A7%D9%87%DB%8C%D9%86.pdf) |
| Market variant | Iran, front-engine front-wheel drive | confirmed | Wikipedia; handbook |
| Gearbox | 5-speed manual | confirmed | Wikipedia; handbook gear-ratio table |
| Engine | M15TC 1.5 L turbo I4, 110 hp / 178 N·m (marketing), 108 hp @ 5250 rpm in the handbook | confirmed | Wikipedia; handbook engine table |

**Trim caveat.** No source checked lists a Shahin "GLX". The published Shahin
line-up is GL (base, fabric, no sunroof) and G (sunroof, 6 airbags, larger display),
with the automatic **Plus** arriving for 1402. The roster's "GLX" should be read as
"5-speed manual, G/GL level"; the two differ in equipment, not in silhouette. If the
trim label matters for the garage card, use **G** — it is the better-equipped 5MT.

Confidence on the identity as a whole: **high** for model, year, body and gearbox;
**medium** for the trim name only.

## Dimensions

Full URLs are given on first use; where a later row says "same handbook", it refers
to that link.

| Parameter | Value | Repo (`src/vehicles/profiles.ts`) | Source | Confidence |
| --- | --- | --- | --- | --- |
| Overall length | 4446 mm | 4460 mm (**+14 mm disagreement**) | [Saipa owner's handbook, specifications chapter](https://www.kianbattery.com/wp-content/uploads/2021/08/%D8%B4%D8%A7%D9%87%DB%8C%D9%86.pdf) | confirmed |
| Wheelbase | 2650 mm | 2650 mm (agrees) | same handbook | confirmed |
| Height | 1490 mm | 1500 mm (**+10 mm disagreement**) | same handbook | confirmed |
| Width (without mirrors) | 1771 mm | 1770 mm (agrees within 1 mm) | same handbook | confirmed |
| Front track | 1518 mm | not stored | same handbook, plan-view diagram | confirmed (single source) |
| Rear track | 1490 mm | not stored | same handbook, plan-view diagram | confirmed (single source) |
| Tyre size | 185/65 R15 standard; 205/50 R16 listed as the alternate fitment | 185/65 R15 (agrees) | same handbook, tyre table | confirmed |
| Wheel diameter (overall, calculated) | 621.5 mm | radius 0.310 m → 620 mm (agrees within 1.5 mm) | calculated from 185/65 R15 | confirmed (calculation) |
| Ground clearance | **not published** | not stored | [handbook](https://www.kianbattery.com/wp-content/uploads/2021/08/%D8%B4%D8%A7%D9%87%DB%8C%D9%86.pdf) has no clearance row; no manufacturer figure found | unknown |

**Repo cross-check.** Wikipedia (which the repo used) gives 4460 × 1768 × 1501 mm;
Saipa's own handbook gives 4446 × 1771 × 1490 mm, and the Iranian market pages
(Khodrobank, Bama) repeat 4446/1771/1490. Against the repo's Wikipedia-derived set the
differences are 14 mm length, 1 mm width and 10 mm height — under 1 % and invisible
at gameplay scale, but the handbook is the manufacturer's number and should replace
the Wikipedia set the next time this profile is touched. Nothing else in the
dimension table disagrees.

Third-party databases list the tracks as 1510/1510 mm
([transport.kg](https://transport.kg/en/catalog/cars/saipa/shahin/specifications));
the handbook diagram's 1518/1490 is preferred because it is the manufacturer's
drawing and because a front track wider than the rear is the expected FWD set-up.

## Side-profile proportions

Normalised to overall length = 1.000, with `u = +0.500` at the front bumper,
`u = -0.500` at the rear bumper, `v = 0.000` at the sill and `v = 1.000` at the roof.

**Method.** Wheel centres are computed from the published length and overhangs, so
they are exact arithmetic. Shahin's overhangs are *not* published: their sum is fixed
at `4446 - 2650 = 1796 mm`, and the split is estimated by class analogy with the
Tara, whose overhangs are published (885/982 mm, i.e. 47.4 % front / 52.6 % rear).
That gives 858 mm front and 938 mm rear. This split is the largest single
uncertainty in this file (±45 mm each). Cabin breakpoints are estimated from the
side-view proportions and cross-checked against the repo's own silhouette; they are
**not** measurements. Vertical values use `v = (z - 335) / (1490 - 335)`, with the
sill at 335 mm above ground (estimated; see the note under the table).

| Quantity | Normalised value | In mm | How derived | Uncertainty |
| --- | --- | --- | --- | --- |
| Front overhang | **0.193** | 858 mm | `858 / 4446`; 858 from the class-analogue split | ±0.010 |
| Rear overhang | **0.211** | 938 mm | class-analogue split of the fixed 1796 mm | ±0.010 |
| Wheelbase / length | **0.596** | 2650 mm | `2650 / 4446 = 0.59604` — verified | exact |
| Front wheel-centre u | **+0.307** | — | `0.500 - 0.193` | ±0.010 |
| Rear wheel-centre u | **-0.289** | — | `-0.500 + 0.211` | ±0.010 |
| Wheelbase check | **0.596** | — | `0.307 - (-0.289) = 0.596` — equals wheelbase/length | exact |
| Wheel diameter / length | **0.140** | 621.5 mm | `621.5 / 4446` | ±0.001 |
| Wheel diameter / height | **0.417** | 621.5 mm | `621.5 / 1490` | ±0.002 |
| Roof peak u | **+0.02** | — | flat roof plateau spans about `-0.06 … +0.10` | ±0.03 |
| Roof peak v | **1.000** | 1490 mm | definition (`v = 1` at the roof) | exact |
| Beltline v | **0.58** | ≈1005 mm above ground | window-sill line estimated from photos | ±0.04 |
| Sill height | **v = 0.000** | 335 mm above ground | rocker underside; ground clearance is unpublished | ±25 mm |
| Bonnet leading-edge v (at the nose) | **0.36** | ≈750 mm above ground | estimated from the nose height in side view | ±0.04 |
| Windscreen base u | **+0.27** | 1200 mm ahead of centre | A-pillar foot, estimated | ±0.02 |
| Roof front u | **+0.13** | — | top of the A-pillar | ±0.02 |
| Roof rear u | **-0.22** | — | top of the C-pillar | ±0.02 |
| Rear-glass base u | **-0.32** | — | bottom of the rear screen at the boot lid | ±0.03 |
| Bonnet length | **0.230** | 1023 mm | `0.500 - 0.270` | ±0.02 |
| Boot length | **0.180** | 800 mm | `-0.320 - (-0.500)` | ±0.03 |

**Derivation notes.**

- *Overhangs and wheel centres* are the only values here with arithmetic behind
  them, and the wheelbase check closes exactly. If the real overhang split is later
  measured, only the two wheel-centre `u` values move.
- *Cabin extents* come from the side-view proportions of the production car
  (long roof, fast A-pillar, thick C-pillar) and are consistent with the repo's
  silhouette to within about 0.02 except at the rear, where the repo draws a much
  longer, shallower rear-glass run (see the cross-check below).
- The **rear-glass run** here is 0.10 L (about 445 mm horizontal with a 487 mm
  rise). The `CarArt` landmarks use a 0.18 L run on all four cars in this batch,
  which is what makes them read as fastbacks; 0.10 L is the sedan-like value used
  here.
- *Beltline, sill and bonnet edge* are vertical estimates read off photographs
  against the 1490 mm overall height; treat them as ±40 mm, not as CAD values.
- The **roof is a plateau**, not a point: from about `u = -0.06` to `u = +0.10` the
  profile is within 1 % of its maximum. Use `+0.02` as the single peak value only
  when a scalar is required.

**Repo cross-check (art data).** `CarArt` for the Shahin stores
`rearGlassBase 0.20` (→ `u = -0.30`), `roofRear 0.38` (→ `-0.12`),
`roofFront 0.64` (→ `+0.14`), `windshieldBase 0.76` (→ `+0.26`) and
`beltRatio 0.58`. The windscreen, roof front and glass base agree within 0.02; the
`beltRatio` matches the window-sill reading here. **`roofRear` does not:** `-0.12`
is 0.10 further forward than the `-0.22` estimated here, and the repo's rear-glass
run is 0.18 L instead of about 0.10 L. That is the shared template artefact flagged
above — the renderer will draw a fastback C-pillar rather than the Shahin's more
upright one.

## Identity checklist

- **Three-box sedan with a long, flat roof** that stays near maximum height from the
  A-pillar to just behind the B-pillar, then falls gently into a thick C-pillar.
  (interpretation, consistent with the silhouette)
- **Short front overhang, longer rear overhang** (0.193 vs 0.211 of length): the
  front wheel sits visibly closer to the nose than the rear wheel does to the tail.
  (derived from published length and wheelbase)
- **High beltline**: the side glass occupies only the upper ~40 % of the body side,
  so the car reads as solid rather than airy. (interpretation)
- **Rising shoulder crease** from the front wheel arch through the door handles,
  kicking up slightly over the rear arch. This is the line that catches light at
  small scale. (interpretation)
- **Wide, blocky tail lamps** that wrap a short distance onto the rear quarter and
  sit above a horizontal trim strip. (interpretation)
- **Swept-back projector headlamps** whose outer corner forms a thin wedge along
  the bonnet edge — the only headlamp cue visible in pure side view.
  (interpretation)
- **Body-coloured door handles**, with bright window-surround trim on the higher
  trim and black trim on the base. (interpretation — confirm against the exact car)
- **15-inch alloy wheels** (G/GL) with a multi-spoke face.
  (alloy confirmed by [Bama — Shahin GL](https://bama.ir/car-reviews/shahin/gl-specs-1454); spoke pattern interpretation)
- **No roof rails, no side cladding, no rear spoiler**; a whip antenna on the rear
  roof (the Plus later moves to a shark fin). (interpretation)
- **Four doors**, with the rear door cut just ahead of the rear wheel arch.
  (confirmed, body style)

## Wheel and rim

- **Diameter:** 15 inch (381 mm rim), overall tyre diameter 621.5 mm. Confirmed —
  handbook tyre table; alloy confirmed by Bama.
- **Rim:** aluminium alloy, silver. Rim width is not published in the sources
  checked (likely 6.0J) — **estimated/unknown**.
- **Spoke style:** multi-spoke, roughly 10 thin spokes with a flat face; the exact
  count is **not confirmed** in any text source and should be treated as an
  interpretation from press photography.
- **Colour:** silver, with dark grey behind the spokes (interpretation).
- **Tyre:** 185/65 R15, i.e. **65 % sidewall aspect** — a tall, soft sidewall that
  fills the arch. Confirmed.
- Optional/alternate fitment listed by Saipa: **205/50 R16** on a 16-inch rim
  (overall diameter 611.4 mm). Confirmed in the handbook; not the GL/G standard.

## Facelift and market notes

- **2020:** launch (as the production Shahin; the 2018 show car was called Roham).
  Body unchanged since.
- **2021:** CVT automatic added. No side-view change; the automatic has a different
  grille insert and, on some trims, 16-inch wheels.
- **1402 (2023):** **Shahin Plus** with the ME16 1.6 engine and 6-speed automatic.
  New front bumper/grille and interior; the doors, roof, glasshouse and rear quarter
  are carried over, so the side profile is unchanged. ESC/TCS became standard in
  winter 1402 on the manual cars as well.
- **Which variant the game should represent:** the **pre-Plus 2022 5-speed manual**
  (G or GL). It matches the roster's year and gearbox, it is the car the physics
  profile was written around, and it avoids the Plus's different nose and 16-inch
  wheels. If a single trim must be named, use **G**: it is the 5MT car with the alloy
  wheels the art already draws.
- The "GLX" label in the roster should be corrected to **G** (or "GL/G") in the
  garage copy at the next data pass; no silhouette change is implied.

## Sources

All URLs accessed 2026-11-12. No images were downloaded, traced or committed.

1. **Saipa (owner's handbook, PDF mirrored by kianbattery.com)** — "دفترچه راهنمای
   مشتری و ضوابط گارانتی خودرو شاهین". URL:
   https://www.kianbattery.com/wp-content/uploads/2021/08/%D8%B4%D8%A7%D9%87%DB%8C%D9%86.pdf
   Accessed 2026-11-12. Supports: length/width/height/wheelbase, front and rear
   track, tyre sizes, gear ratios, engine table. Confidence: high (manufacturer
   document; mirror, not saipa.ir). Reference-only: no.
2. **Khodrobank** — "سایپا شاهین | بررسی مشخصات شاهین". URL:
   https://www.khodrobank.com/cars/%D8%B3%D8%A7%DB%8C%D9%BE%D8%A7/444/%D8%B3%D8%A7%DB%8C%D9%BE%D8%A7-%D8%B4%D8%A7%D9%87%DB%8C%D9%86
   Accessed 2026-11-12. Supports: 4446 × 1771 × 1490, 2650 mm, 422 L boot, market
   context, 110 hp/178 N·m. Confidence: high. Reference-only: no.
3. **Wikipedia** — "Saipa Shahin". URL: https://en.wikipedia.org/wiki/Saipa_Shahin
   Accessed 2026-11-12. Supports: SP100 code, SP1 platform, production start 2020,
   M15TC engine, 4460 × 1768 × 1501 (the conflicting set). Confidence: medium
   (dimensions conflict with the handbook). Reference-only: no.
4. **Bama** — "مشخصات فنی شاهین GL دنده‌ای سال 1402 - 1405". URL:
   https://bama.ir/car-reviews/shahin/gl-specs-1454 Accessed 2026-11-12. Supports:
   GL trim exists with alloy wheels, 2650 mm wheelbase. Confidence: medium.
   Reference-only: no.
5. **Otex** — "بررسی تیپ های شاهین + جدول مقایسه". URL:
   https://otex.ir/blog/review-of-saipa-shahin-types-with-comparison-table
   Accessed 2026-11-12. Supports: Shahin line-up is G / GL / Plus automatic; no GLX.
   Confidence: medium (market publisher, consistent with Bama). Reference-only: no.
6. **transport.kg** — "Saipa Shahin I 1.5 MT 110 hp — specifications". URL:
   https://transport.kg/en/catalog/cars/saipa/shahin/specifications Accessed
   2026-11-12. Supports: an alternative 1510/1510 mm track figure (not used).
   Confidence: low. Reference-only: yes (recorded only to document the conflict).
