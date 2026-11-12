## Identity

| Field | Value | Confidence | Source |
| --- | --- | --- | --- |
| Exact model | Renault Tondar 90 (L90), Iranian-built first-generation Logan | confirmed | [Wikipedia — Dacia Logan](https://en.wikipedia.org/wiki/Dacia_Logan) |
| Generation / platform | Logan I (L90), Dacia B0 platform | confirmed | Wikipedia — Dacia Logan |
| Model year | **2014** per the roster (Iranian 1393) — but **`src/vehicles/extra-cars.ts` stores 2010** | conflicting (see note) | roster; [Bama — Tondar 90 E2](https://bama.ir/car-reviews/renault/tondar90-specs-1106-e2) |
| Trim | E2, the volume trim (E0/E1 below it, Plus above) | confirmed | Bama — Tondar 90 E2 |
| Body style | 4-door, 5-seat subcompact sedan | confirmed | Bama; Wikipedia |
| Market variant | Iran (IKCO / Pars Khodro), front-engine front-wheel drive | confirmed | Wikipedia |
| Engine | K4M 1.6 L 16V, 105 hp @ 5750 / 140 N·m @ 3750 | confirmed | Bama; Wikipedia engine table |
| Gearbox | 5-speed manual (JH3; JHQ from 2014) | confirmed | Bama; Wikipedia |

**Year caveat.** The roster says 2014 and the repo says 2010. Both are within the
E2's production span (1386–1399, i.e. 2007–2021) and **the body is identical across
that whole period** — the Iranian car kept the original Logan front and rear until
the 2017 Tondar 90 Plus. The art is therefore unaffected; one of the two labels
should still be corrected so the garage card and the source table agree. 2014 is
also the year Renault moved Iranian cars from the JH3 to the **JHQ** gearbox
(Wikipedia), so a 2014 car may not have the JH3 ratios the physics profile models —
a data question, not an art question.

Confidence on the identity as a whole: **high** for model, body, trim and engine;
**medium** only on the year label because the repo and the roster disagree.

## Dimensions

Full URLs are given on first use; where a later row says "same spec sheet", it refers
to that link.

| Parameter | Value | Repo (`src/vehicles/extra-cars.ts`) | Source | Confidence |
| --- | --- | --- | --- | --- |
| Overall length | 4250 mm (Iranian spec) | 4250 mm (agrees) | [Renault Pars spec sheet, reprinted](https://iran-khodro.blogsky.com/1391/04/01/post-177); Bama | confirmed |
| Wheelbase | 2630 mm | 2630 mm (agrees) | same spec sheet; Bama | confirmed |
| Height | 1525 mm | 1525 mm (agrees) | same spec sheet; Bama | confirmed |
| Width (without mirrors) | 1740 mm | 1739 mm (agrees within 1 mm) | same spec sheet; Bama | confirmed |
| Width (with mirrors) | 1975 mm | not stored | Renault Pars spec sheet | confirmed |
| Front track | 1466 mm | not stored | [drive.place — Logan I](https://dacia.drive.place/logan/i/group_sedan/367484) | estimated (third-party database) |
| Rear track | 1456 mm | not stored | same | estimated (third-party database) |
| Tyre size | 185/65 R15 | 185/65 R15 (agrees) | Bama — Tondar 90 E2 (front and rear) | confirmed |
| Wheel diameter (overall, calculated) | 621.5 mm | radius 0.311 m → 622 mm (agrees within 1 mm) | calculated from 185/65 R15 | confirmed (calculation) |
| Ground clearance | 155 mm | not stored | Renault Pars spec sheet; drive.place | estimated (two agreeing sources, neither the current manufacturer) |

**Repo cross-check.** This is the cleanest match in the batch: length, wheelbase,
height, tyre and wheel radius all agree, and the width is 1 mm out. The only real
disagreement is the **model year (2010 vs 2014)**, which is a label issue, not a
geometry issue.

Two external disagreements are recorded for completeness. European Dacia Logan I
figures are 4288 mm long and 1534 mm high (Wikipedia); the Iranian car is 4250 /
1525 because of its locally produced bumpers and trim. Both sets are correct for
their respective cars — **use the Iranian figures**. The track widths are only
available from third-party databases (1466/1456); a second database quotes
1480/1470 ([encycarpedia](https://www.encycarpedia.com/us/dacia/05-logan-1-6-sedan),
seen only as a search result), so treat the track as ±15 mm.

## Side-profile proportions

Normalised to overall length = 1.000, with `u = +0.500` at the front bumper,
`u = -0.500` at the rear bumper, `v = 0.000` at the sill and `v = 1.000` at the roof.

**Method.** The Renault Pars spec sheet publishes the **front overhang (777 mm)** and
**rear overhang (843 mm)**, and the three numbers sum to 4250 mm exactly, so all
wheel positions are arithmetic. Cabin breakpoints are estimated from the production
car's side view. Vertical values use `v = (z - 350) / (1525 - 350)`, with the sill at
350 mm above ground (estimated from the published 155 mm clearance plus a deep
rocker section).

| Quantity | Normalised value | In mm | How derived | Uncertainty |
| --- | --- | --- | --- | --- |
| Front overhang | **0.183** | 777 mm | published; `777 / 4250` | ±0.002 |
| Rear overhang | **0.198** | 843 mm | published; `843 / 4250` | ±0.002 |
| Wheelbase / length | **0.619** | 2630 mm | `2630 / 4250 = 0.61882` — verified | exact |
| Front wheel-centre u | **+0.317** | — | `0.500 - 0.183` | ±0.002 |
| Rear wheel-centre u | **-0.302** | — | `-0.500 + 0.198` | ±0.002 |
| Wheelbase check | **0.619** | — | `0.317 - (-0.302) = 0.619` — equals wheelbase/length | exact |
| Wheel diameter / length | **0.146** | 621.5 mm | `621.5 / 4250` | ±0.001 |
| Wheel diameter / height | **0.408** | 621.5 mm | `621.5 / 1525` | ±0.002 |
| Roof peak u | **+0.02** | — | long flat roof, plateau about `-0.14 … +0.13` | ±0.03 |
| Roof peak v | **1.000** | 1525 mm | definition (`v = 1` at the roof) | exact |
| Beltline v | **0.59** | ≈1043 mm above ground | window-sill line estimated from photos | ±0.04 |
| Sill height | **v = 0.000** | 350 mm above ground | rocker underside; 155 mm clearance published | ±20 mm |
| Bonnet leading-edge v (at the nose) | **0.38** | ≈797 mm above ground | estimated from the nose height in side view | ±0.04 |
| Windscreen base u | **+0.29** | 1232 mm ahead of centre | A-pillar foot, estimated | ±0.02 |
| Roof front u | **+0.16** | — | top of the A-pillar | ±0.02 |
| Roof rear u | **-0.23** | — | top of the C-pillar | ±0.02 |
| Rear-glass base u | **-0.33** | — | bottom of the rear screen at the boot lid | ±0.03 |
| Bonnet length | **0.210** | 893 mm | `0.500 - 0.290` | ±0.02 |
| Boot length | **0.170** | 723 mm | `-0.330 - (-0.500)` | ±0.03 |

**Derivation notes.**

- *Overhangs and wheel centres* are manufacturer figures and close exactly. The
  0.183 L front overhang is the shortest of the four Iranian cars: the Tondar's nose
  sits almost on top of the front wheel, which is a big part of its boxy,
  wheels-at-the-corners look.
- *Cabin extents* are estimated. The Logan has a long, flat roof, a very upright
  windscreen (about 53° from horizontal) and an upright rear window — its glasshouse
  is taller and more slab-sided than the Tara's or the Shahin's.
- The **rear-glass run** is about 0.10 L (425 mm horizontal, 482 mm rise). The
  `CarArt` landmarks use 0.18 L on all four cars in this batch, which reads as a
  fastback and is wrong for this car in particular.
- The high roof (1525 mm on a 2630 mm wheelbase) is the Tondar's defining
  proportion: it is 59 mm taller than the Tara on a 22 mm shorter wheelbase.

**Repo cross-check (art data).** `CarArt` stores `windshieldBase 0.77` (→ `+0.27`,
vs `+0.29`), `roofFront 0.64` (→ `+0.14`, vs `+0.16`), `roofRear 0.35` (→ `-0.15`)
and `rearGlassBase 0.17` (→ `-0.33`, agrees). The glass base is right; the
**roof rear is 0.08 too far forward**, and the resulting rear-glass run is 0.18 L
instead of about 0.10 L — the shared template artefact also visible on the Shahin,
206 and Tara. Correcting `roofRear` to about `-0.23` is enough to fix the C-pillar.

## Identity checklist

- **Tall, boxy three-box sedan**: 1525 mm high on a 2630 mm wheelbase, with a flat
  roof and a deep glasshouse. (derived from published figures)
- **Short front overhang (0.183 L)** — the nose is almost directly above the front
  wheel; the rear overhang is only slightly longer (0.198 L). (derived)
- **Upright windscreen and rear window** (~53° from horizontal) and a tall,
  slab-sided glasshouse — the cabin is tall relative to the car, unlike the 206's.
  (interpretation)
- **Flat, slab sides** with one straight shoulder line and almost no surfacing —
  the body reads as a rectangle with rounded corners. (interpretation)
- **Simple rounded-rectangular headlamps** that wrap only slightly around the
  corner; a wide black slat grille with the Renault diamond in the centre.
  (interpretation)
- **Tall, blocky corner tail lamps** standing vertically at the rear corners, not
  wide horizontal units. (interpretation)
- **Simple bumpers with a black lower valance**; body-coloured on most E2 cars,
  black on the base E0/E1 — confirm against the reference car. (interpretation; the
  E2's position in the range is confirmed by Bama)
- **15-inch steel wheels with full covers** — alloys were only an option from 1398
  (2019), so a 2014 E2 has steel. (steel confirmed — Bama notes the alloy option's
  date; the full-face cover is an interpretation)
- **Whip antenna on the front roof**, no roof rails, no side cladding.
  (interpretation)
- **No rear spoiler and no chrome window trim** on E2. (interpretation)

## Wheel and rim

- **Diameter:** 15 inch rim (381 mm), overall tyre diameter 621.5 mm. Confirmed —
  Bama tyre listing.
- **Rim:** steel, with a full-face plastic cover. Confirmed that the E2 runs steel
  wheels; **rim width is not published** in the sources checked (likely 6J) —
  unknown.
- **Spoke style:** the stock cover is a simple multi-slot design; the exact pattern
  is **not confirmed** and should be treated as an interpretation.
- **Colour:** silver cover over a black steel rim. Interpretation.
- **Tyre:** 185/65 R15 — **65 % sidewall aspect**, tall and soft, which suits the
  car's ride-oriented set-up and fills the arch. Confirmed.

## Facelift and market notes

- **2007:** Tondar 90 (L90) launched in Iran, built by Pars Khodro and IKCO under
  Renault Pars. It is the **pre-facelift** Logan: rounded headlamps, black slat
  grille, original bumpers.
- **2008:** Dacia facelifted the Logan in Europe, but the Iranian base car **kept the
  original front and rear**; the facelift only reached Iran with the 2017 Plus
  (below). Wikipedia notes that the facelifted version was sold alongside the
  original as the **Tondar 90+**, which confirms the split.
- **2013:** Euro IV compliance and a 4-speed automatic added; the manual E2 stays
  the volume model.
- **2014:** JHQ gearbox replaces the JH3 on Iranian cars (Wikipedia). This is the
  roster's model year; the body is unchanged.
- **January 2017 (Bahman 1395):** **Tondar 90 Plus** goes on sale — new front and rear
  lamps, new bumpers and grille, body-coloured mirrors and mouldings, a new boot lid
  with a chrome strip, and a **40 mm longer body (4290 mm)**. This is the facelift
  that a side view must *not* use for a 2014 car.
- **2019 (1398):** aluminium wheels become an option. **2021:** production ends.
- **Which variant the game should represent:** the **2014 E2 pre-Plus**, 4250 mm,
  steel wheels, original rounded lamps. It matches the roster's year and trim, and
  it is visually distinct from the Tara and Shahin in exactly the way the garage
  needs: taller, slabbier, older.

## Sources

All URLs accessed 2026-11-12. No images were downloaded, traced or committed.

1. **Bama** — "مشخصات فنی رنو تندر 90 E2 سال 1386 - 1399". URL:
   https://bama.ir/car-reviews/renault/tondar90-specs-1106-e2 Accessed 2026-11-12.
   Supports: E2 trim, 4250 × 1740 × 1525 mm, 2630 mm wheelbase, 185/65 R15,
   105 hp/140 N·m, JH3 gearbox, alloy optional from 1398. Confidence: high.
   Reference-only: no.
2. **Renault Pars spec sheet, reprinted by iran-khodro.blogsky.com** — Tondar 90
   dimensions page. URL:
   https://iran-khodro.blogsky.com/1391/04/01/post-177 Accessed 2026-11-12.
   Supports: front overhang 777 mm, rear overhang 843 mm, 155 mm ground clearance,
   1975 mm width with mirrors, 4250 mm length. Confidence: medium-high (the numbers
   are a verbatim Renault Pars table, but the host is a blog). Reference-only: no.
3. **Wikipedia** — "Dacia Logan". URL: https://en.wikipedia.org/wiki/Dacia_Logan
   Accessed 2026-11-12. Supports: L90 generation, Dacia B0 platform, European
   4288 × 1740 × 1534 mm, K4M engine, 2014 JHQ gearbox change, Tondar 90+ sold
   alongside the original. Confidence: high for the model history, medium for the
   European dimensions (a different car). Reference-only: no.
4. **Zoomit** — "تندر 90 پلاس به بازار می‌آید؛ تفاوت های تندر جدید با نسخه قدیمی",
   5 Bahman 1395 (January 2017). URL:
   https://www.zoomit.ir/car/151509-tondar-90-plus-added-option Accessed 2026-11-12.
   Supports: Plus facelift content, 4290 mm length vs 4250 mm, unchanged width and
   height, new lamps/bumpers/grille/mirrors. Confidence: high. Reference-only: no.
5. **drive.place** — "Dacia Logan I 1.4 MT — specifications". URL:
   https://dacia.drive.place/logan/i/group_sedan/367484 Accessed 2026-11-12.
   Supports: 1466/1456 mm tracks, 155 mm clearance, 4250 × 1735 × 1525 mm.
   Confidence: medium (third-party database). Reference-only: no.
