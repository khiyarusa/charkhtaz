## Identity

| Field | Value | Confidence | Source |
| --- | --- | --- | --- |
| Exact model | Peugeot 206 1.4, Iranian-market "Type 2" (تیپ ۲) | confirmed | [Khodrobank — 206 Type 2](https://www.khodrobank.com/cars/%D9%BE%DA%98%D9%88/58/%D9%BE%DA%98%D9%88-206-%D8%AA%DB%8C%D9%BE-2) |
| Generation / chassis | 206 first generation, project code **T1**; Iranian 5-door hatchback | confirmed | [Wikipedia — Peugeot 206](https://en.wikipedia.org/wiki/Peugeot_206) |
| Model year | 2008 (Iranian 1387) | medium — roster year, inside the Type 2's production run | [Khodrobank](https://www.khodrobank.com/cars/%D9%BE%DA%98%D9%88/58/%D9%BE%DA%98%D9%88-206-%D8%AA%DB%8C%D9%BE-2) |
| Trim | Type 2 — the base 1.4 hatch; fender badge reads **EL 1.4** | confirmed | [Hamrah Mechanic — 206 trims](https://www.hamrah-mechanic.com/mag/all-tipe-peugeot-206) |
| Body style | 5-door hatchback, 5 seats | confirmed | Hamrah Mechanic (the 5-door was the version built in Iran from 1380); Khodrobank |
| Market variant | Iran, IKCO assembly; front-engine front-wheel drive | confirmed | Wikipedia; Khodrobank |
| Engine / gearbox | TU3 1360 cc 8-valve, 75 hp / 118 N·m, 5-speed manual | confirmed | Khodrobank; Hamrah Mechanic |

**Trim caveat.** "Type 2" is an Iranian market designation, not a Peugeot code. The
Type 2 ran from 1381 (2002) into the late 1390s, so 2008 is a mid-run car. In 2008
the Type 2 was the entry model: steel wheels, black door handles and black side
mouldings, manual mirrors, manual rear windows, drum rear brakes, and **no ABS or
airbags** (both only became standard on this trim from 1390 / 2011). It is not the
same car as the 206 SD sedan, the 206 Type 5 (1.6) or the later 207i.

Confidence on the identity as a whole: **high**. The only soft point is the exact
calendar-year mapping (Iranian 1387 vs the 2008 model year used by the roster),
which does not affect the body.

## Dimensions

Full URLs are given on first use; where a later row says "same IKCO data sheet", it
refers to that link.

| Parameter | Value | Repo (`src/vehicles/extra-cars.ts`) | Source | Confidence |
| --- | --- | --- | --- | --- |
| Overall length | 3835 mm | 3835 mm (agrees) | [IKCO 206 technical data, dimensions page](https://www.kianbattery.com/wp-content/uploads/2023/10/%D8%A7%D8%B7%D9%84%D8%A7%D8%B9%D8%A7%D8%AA-%D9%81%D9%86%DB%8C-%D9%BE%DA%98%D9%88-206.pdf) | confirmed |
| Wheelbase | 2443 mm | 2445 mm (**+2 mm disagreement**) | same IKCO data sheet | confirmed |
| Height | 1426 mm | 1432 mm (**+6 mm disagreement**) | same IKCO data sheet; IKCO product page | confirmed |
| Width (without mirrors) | 1652 mm | 1652 mm (agrees) | same IKCO data sheet | confirmed |
| Front track | 1437 mm | not stored | same IKCO data sheet | confirmed |
| Rear track | 1428 mm | not stored | same IKCO data sheet | confirmed |
| Tyre size | 185/65 R14 | 185/65 R14 (agrees) | same IKCO data sheet; Khodrobank | confirmed |
| Wheel diameter (overall, calculated) | 596.1 mm | radius 0.298 m → 596 mm (agrees) | calculated from 185/65 R14 | confirmed (calculation) |
| Ground clearance | 119 mm | not stored | [autoevolution — 206 5 Doors](https://www.autoevolution.com/cars/peugeot-206-5-doors-2002.html) | estimated (third-party database) |

**Repo cross-check.** Length, width, tyre and wheel radius agree exactly. The
wheelbase is 2 mm and the height 6 mm off; both are within the spread of the
sources themselves (Khodrobank's text quotes 3822 mm length and 1432 mm height in
one paragraph and 3835/1426 in its table). The IKCO technical data sheet is
preferred because it is the manufacturer's own document and its figures are
internally consistent. **No material disagreement.**

Two other published numbers deserve a note. Khodrobank's article text quotes
3822 mm length ("according to the manufacturer"), while its table and the IKCO
sheet say 3835 mm; 3835 is used. The IKCO sheet's front-overhang field is garbled in
the PDF text layer (it shows 874 mm, which cannot be right for a 3835 mm car with a
2443 mm wheelbase and a 680 mm rear overhang); the front overhang is therefore
derived, see below.

## Side-profile proportions

Normalised to overall length = 1.000, with `u = +0.500` at the front bumper,
`u = -0.500` at the rear bumper, `v = 0.000` at the sill and `v = 1.000` at the roof.

**Method.** Overhangs and wheel centres are computed from the published length,
wheelbase and the IKCO sheet's **680 mm rear overhang**. The front overhang is then
`3835 - 2443 - 680 = 712 mm`, which closes the length exactly. Cabin breakpoints are
estimated from the production car's side-view proportions and cross-checked against
the repo silhouette; they are **not** measurements. Vertical values use
`v = (z - 300) / (1426 - 300)`, with the sill at 300 mm above ground (estimated from
the 119 mm published clearance plus rocker thickness).

| Quantity | Normalised value | In mm | How derived | Uncertainty |
| --- | --- | --- | --- | --- |
| Front overhang | **0.186** | 712 mm | `(3835 - 2443 - 680) / 3835` — derived, closes the length | ±0.005 |
| Rear overhang | **0.177** | 680 mm | IKCO technical data sheet | ±0.003 |
| Wheelbase / length | **0.637** | 2443 mm | `2443 / 3835 = 0.63703` — verified | exact |
| Front wheel-centre u | **+0.314** | — | `0.500 - 0.186` | ±0.005 |
| Rear wheel-centre u | **-0.323** | — | `-0.500 + 0.177` | ±0.005 |
| Wheelbase check | **0.637** | — | `0.314 - (-0.323) = 0.637` — equals wheelbase/length | exact |
| Wheel diameter / length | **0.155** | 596.1 mm | `596.1 / 3835` | ±0.001 |
| Wheel diameter / height | **0.418** | 596.1 mm | `596.1 / 1426` | ±0.002 |
| Roof peak u | **-0.02** | — | domed roof, plateau about `-0.10 … +0.05` | ±0.04 |
| Roof peak v | **1.000** | 1426 mm | definition (`v = 1` at the roof) | exact |
| Beltline v | **0.60** | ≈976 mm above ground | window-sill line estimated from photos | ±0.04 |
| Sill height | **v = 0.000** | 300 mm above ground | rocker underside; clearance 119 mm published | ±20 mm |
| Bonnet leading-edge v (at the nose) | **0.35** | ≈694 mm above ground | estimated from the nose height in side view | ±0.04 |
| Windscreen base u | **+0.26** | 996 mm ahead of centre | A-pillar foot, estimated | ±0.02 |
| Roof front u | **+0.05** | — | top of the A-pillar | ±0.02 |
| Roof rear u | **-0.30** | — | top of the tailgate / roof spoiler | ±0.03 |
| Rear-glass base u | **-0.44** | — | bottom of the tailgate glass, just above the bumper | ±0.03 |
| Bonnet length | **0.240** | 920 mm | `0.500 - 0.260` | ±0.02 |
| Tailgate length (horizontal projection) | **0.060** | 230 mm | `-0.440 - (-0.500)`; the glass itself runs ≈690 mm along its slope | ±0.03 |

**Derivation notes.**

- *Overhangs and wheel centres* are the strongest numbers in this file: the rear
  overhang is published and the length closes to the millimetre. The 206 is the
  shortest car in the roster with the **largest wheelbase fraction (0.637)** — that
  is its defining proportion and must not be softened.
- *Cabin extents* are estimated. The 206's windscreen is very raked (about 30° from
  horizontal), the roof is domed, and the tailgate is much more upright than a
  fastback's. The **rear-glass run** is about 0.14 L — longer than a sedan's
  because this is a hatchback, but much shorter than the 0.18 L the repo uses.
- *Beltline* is high relative to the car's height, which gives the 206 its solid,
  planted look rather than that of a tall bubble.

**Repo cross-check (art data).** `CarArt` stores `windshieldBase 0.76` (→ `u =
+0.26`, agrees), `roofFront 0.63` (→ `+0.13`, **0.08 too far back**),
`roofRear 0.36` (→ `-0.14`, **0.16 too far forward**) and `rearGlassBase 0.18`
(→ `-0.32`, **0.12 too far forward**). The silhouette in `EXTRA_SILHOUETTES` follows
the same fastback reading: it runs from the roof peak at `-0.05` down to `-0.45` in
one long slope. On the production 206 the roof ends roughly above the rear axle and
the tailgate drops much more steeply. **This is the one art correction I would flag
for this car:** pull the roof rear back to about `-0.30` and the glass base to about
`-0.44`, otherwise the car reads as a 406 Coupé-style fastback rather than a 206.

## Identity checklist

- **Short, tall hatchback with wheels at the corners**: front overhang 0.186 L,
  rear 0.177 L, wheelbase 0.637 L. This stance is the silhouette. (derived)
- **Domed roof peaking just behind the B-pillar**, then a short roof and a
  quick drop into the tailgate. (interpretation)
- **Very raked windscreen** (≈30° from horizontal) and side glass in the upper 40 %
  of the body side. (interpretation)
- **"Egg-shaped" side glass**: the lower glass line dips slightly between the wheel
  arches instead of running dead straight. (interpretation)
- **Black plastic side mouldings along both doors** and **black door handles** —
  Type 2 signature, and a strong dark line at gameplay scale. (confirmed —
  Hamrah Mechanic trim table)
- **Black mirror bases with manual, body-coloured or black caps** (Type 2 has manual
  mirrors; Type 3 is the one with body-coloured caps). (confirmed — Hamrah Mechanic)
- **Swept-back "feline" headlamps** that wrap around the front corner; in side view
  they read as a long, thin wedge above the bumper. (interpretation)
- **Small tail-lamp sliver at the rear corner**, mounted in a near-vertical tailgate;
  the lamp is not a wide wrap-around unit. (interpretation)
- **Tailgate spoiler**: a small lip at the top of the glass, integrated into the
  roofline. (interpretation)
- **14-inch steel wheels with full covers** — not alloys. (steel confirmed —
  Hamrah Mechanic: "رینگ فولادی"; the full-face cover is an interpretation)
- **No roof rails, no side cladding, no chrome window trim.** (interpretation)

## Wheel and rim

- **Diameter:** 14 inch rim (355.6 mm), overall tyre diameter 596.1 mm. Confirmed —
  IKCO technical data sheet.
- **Rim:** steel, **5.5J × 14, ET34**. Confirmed — IKCO technical data sheet.
- **Cover:** full-face plastic wheel cover (قالپاق), silver-grey. Confirmed that the
  Type 2 runs steel wheels; the cover pattern is an interpretation.
- **Spoke style:** the stock cover has a multi-slot, roughly 7-spoke look; the exact
  count is **not confirmed** in any text source, so treat the pattern as an
  interpretation and keep it simple at gameplay scale.
- **Colour:** silver cover over a black steel rim. Interpretation.
- **Tyre:** 185/65 R14 — **65 % sidewall aspect**, a tall sidewall with a visible
  bulge. Confirmed. (European base 1.4 cars used 175/65 R14; the Iranian car does
  not.)

## Facelift and market notes

- **1998:** launch. **2003:** global facelift — clear headlamp lenses, revised rear
  lamp clusters, new side repeaters and bumper details. A 2008 car is a
  post-facelift car and should have the clear lamps.
- **2001–2024:** Iranian production. The 5-door hatch was the body built in Iran.
  Local changes over the run were incremental: "crystal" headlamps, and on late
  cars 207-style rear lamps and a revised rear bumper (Khodrobank notes both). A
  2008 car predates those late changes — keep the original 2003-style tail lamps.
- **2011 (1390):** ABS and front airbags became standard on the Type 2 because of
  Iranian safety regulation. This matters for the physics profile, not the art:
  `src/vehicles/extra-cars.ts` sets `hasAbs: true` for the 2008 Type 2, which is
  **not correct for a 2008 car** (out of scope for this research, flagged for a
  separate data pass).
- **Which variant the game should represent:** the **2008 Type 2 5-door**, steel
  wheels and black trim. It is the car the roster names, the lightest car in the
  garage, and the one whose high beltline and short tailgate give the cleanest
  silhouette contrast against the Tara and Shahin. Do not substitute the 206 SD
  sedan or the 207i — both are different bodies.

## Sources

All URLs accessed 2026-11-12. No images were downloaded, traced or committed.

1. **IKCO (technical data sheet, PDF mirrored by kianbattery.com)** — "اطلاعات فنی
   پژو 206". URL:
   https://www.kianbattery.com/wp-content/uploads/2023/10/%D8%A7%D8%B7%D9%84%D8%A7%D8%B9%D8%A7%D8%AA-%D9%81%D9%86%DB%8C-%D9%BE%DA%98%D9%88-206.pdf
   Accessed 2026-11-12. Supports: 3835 × 1652 × 1426 mm, 2443 mm wheelbase, tracks
   1437/1428, rear overhang 680 mm, 185/65 R14 on 5.5J × 14 ET34, TU3 outputs.
   Confidence: high (manufacturer document; mirror, not ikco.ir). Reference-only:
   no.
2. **Khodrobank** — "۲۰۶ تیپ ۲ | بررسی مشخصات ۲۰۶ تیپ ۲". URL:
   https://www.khodrobank.com/cars/%D9%BE%DA%98%D9%88/58/%D9%BE%DA%98%D9%88-206-%D8%AA%DB%8C%D9%BE-2
   Accessed 2026-11-12. Supports: Type 2 identity, 75 hp/118 N·m, 5-speed manual,
   14.1 s, 170 km/h, market context, the 3822/1432 alternate figures. Confidence:
   high on identity, medium on the conflicting dimensions. Reference-only: no.
3. **Hamrah Mechanic** — "بررسی تفاوت تیپ های پژو 206". URL:
   https://www.hamrah-mechanic.com/mag/all-tipe-peugeot-206 Accessed 2026-11-12.
   Supports: Type 2 = 5-door, steel wheels, black handles and side mouldings,
   manual mirrors, no ABS/airbags before 1390, "EL 1.4" fender badge. Confidence:
   high (consistent with the accessory market and period road tests).
   Reference-only: no.
4. **Wikipedia** — "Peugeot 206". URL: https://en.wikipedia.org/wiki/Peugeot_206
   Accessed 2026-11-12. Supports: T1 project code, 2003 facelift content,
   2442 mm wheelbase and 1428 mm height (rounded alternatives), Iranian production
   dates. Confidence: medium (aggregated). Reference-only: no.
5. **autoevolution** — "PEUGEOT 206 5 Doors (2002–2010)". URL:
   https://www.autoevolution.com/cars/peugeot-206-5-doors-2002.html Accessed
   2026-11-12. Supports: 119 mm ground clearance, an alternative track reading of
   1440/1430 mm, European 175/65 R14 tyre. Confidence: medium (third-party
   database). Reference-only: no (clearance only).
