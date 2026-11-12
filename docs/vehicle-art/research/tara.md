## Identity

| Field | Value | Confidence | Source |
| --- | --- | --- | --- |
| Exact model | IKCO Tara 1.6 (TU5P), 6-speed automatic | confirmed | [IKCO Tara owner's manual, technical data](https://www.kianbattery.com/wp-content/uploads/2023/10/%D8%A7%D8%B7%D9%84%D8%A7%D8%B9%D8%A7%D8%AA-%D9%81%D9%86%DB%8C-%D8%AA%D8%A7%D8%B1%D8%A7.pdf) |
| Generation / platform | First generation, derived from the Peugeot 301 / Citroën C-Elysée (PSA PF1) | confirmed | [Wikipedia — Peugeot 301](https://en.wikipedia.org/wiki/Peugeot_301) |
| Model year | 2023 (Iranian 1402) | confirmed | [Hamrah Mechanic — Tara trims](https://www.hamrah-mechanic.com/mag/all-ikco-tara-types-in-market) |
| Trim | **automatic; either V2 (built 1400–1403) or V4 (from 1402)** — the roster does not say which | medium (two candidates) | Hamrah Mechanic |
| Body style | 4-door, 5-seat compact sedan | confirmed | owner's manual; [Iranecar — Tara V1 Plus](https://iranecar.com/services/vehicle-info/album/%D8%A7%DB%8C%D8%B1%D8%A7%D9%86-%D8%AE%D9%88%D8%AF%D8%B1%D9%88-%D8%AA%D8%A7%D8%B1%D8%A7-V1-%D9%BE%D9%84%D8%A7%D8%B3?vehicleId=6009) |
| Market variant | Iran, front-engine front-wheel drive | confirmed | owner's manual |
| Engine | TU5P 1.6 L 16V, 113 hp @ 5800 / 144 N·m @ 4000 in the owner's manual; the repo uses 110 hp / 150 N·m @ 4800 | confirmed (manual) / conflicting | owner's manual |
| Gearbox | 6-speed automatic | confirmed | owner's manual |

**Trim caveat.** The 2023 automatic was sold as **V2** (from late 1400, built to
1403) and **V4** (from 1402). They share the body, glasshouse and 16-inch wheels.
The visible differences are the **antenna** (whip on V2, shark fin on V4) and the
**rear lamp graphics** (triangular internal graphic on V2, a newer graphic on V4).
If the renderer wants the shark fin that `CarArt.detail.antenna` currently turns on,
the correct donor is **V4**; if it wants the whip antenna, **V2**. Everything else
in this file is identical for both.

Confidence on the identity as a whole: **high** for model, body, gearbox and
platform; **medium** for which automatic trim the roster intends.

## Dimensions

Full URLs are given on first use; where a later row says "owner's manual", it refers
to that link.

| Parameter | Value | Repo (`src/vehicles/extra-cars.ts`) | Source | Confidence |
| --- | --- | --- | --- | --- |
| Overall length | **4505 mm** (brochure) / **4519 mm** (owner's manual: 885 + 2652 + 982 mm) | 4505 mm (agrees with the brochure) | [owner's manual](https://www.kianbattery.com/wp-content/uploads/2023/10/%D8%A7%D8%B7%D9%84%D8%A7%D8%B9%D8%A7%D8%AA-%D9%81%D9%86%DB%8C-%D8%AA%D8%A7%D8%B1%D8%A7.pdf); [Iranecar](https://iranecar.com/services/vehicle-info/album/%D8%A7%DB%8C%D8%B1%D8%A7%D9%86-%D8%AE%D9%88%D8%AF%D8%B1%D9%88-%D8%AA%D8%A7%D8%B1%D8%A7-V1-%D9%BE%D9%84%D8%A7%D8%B3?vehicleId=6009) | confirmed (both figures published) |
| Wheelbase | 2652 mm | 2652 mm (agrees) | owner's manual | confirmed |
| Height | 1466 mm | 1466 mm (agrees) | owner's manual | confirmed |
| Width (without mirrors) | 1748 mm | 1748 mm (agrees) | owner's manual | confirmed |
| Width (with mirrors) | 1953 mm | not stored | owner's manual | confirmed |
| Front track | 1501 mm | not stored | owner's manual | confirmed |
| Rear track | 1478 mm | not stored | owner's manual | confirmed |
| Tyre size | **205/50 R16** on the automatic (manual also lists 195/55 R16); 185/65 R15 on the manual | 205/55 R16 (**disagreement**) | owner's manual, wheel and tyre table | confirmed (manual) |
| Wheel diameter (overall, calculated) | **611.4 mm** with 205/50 R16 (620.9 mm with 195/55 R16) | radius 0.316 m → 632 mm (**+21 mm / +3.4 % disagreement**) | calculated from the manual's tyre sizes | confirmed (calculation) |
| Ground clearance (minimum) | **113 mm** | not stored | owner's manual | confirmed |
| Ground clearance — conflicting figure | ≈145 mm | — | [Iranecar](https://iranecar.com/services/vehicle-info/album/%D8%A7%DB%8C%D8%B1%D8%A7%D9%86-%D8%AE%D9%88%D8%AF%D8%B1%D9%88-%D8%AA%D8%A7%D8%B1%D8%A7-V1-%D9%BE%D9%84%D8%A7%D8%B3?vehicleId=6009) | estimated (rounded "about 145") |

**Repo cross-check — two real disagreements.**

1. **Wheel radius.** The repo uses `wheelRadiusM: 0.316` (632 mm diameter), which is
   the size of a **205/55 R16**. The automatic's published fitment is **205/50 R16**
   (611.4 mm), so the drawn wheel is about 21 mm too tall in diameter (10 mm in
   radius, 3.4 %). On a 1466 mm-tall car that is visible as a tighter arch gap and a
   slightly over-large wheel. Fix the radius to **0.306 m** if 205/50 R16 is
   confirmed for the exact trim.
2. **Length.** 4505 mm is the brochure figure and is what the repo stores; the
   owner's manual's own overhang arithmetic gives **4519 mm** (885 + 2652 + 982).
   The 14 mm (0.3 %) difference is below drawing tolerance and does **not** justify
   changing the physics profile; it is recorded so the art file is not accused of
   contradicting the manual. Use 4505 for gameplay-facing data, 4519 when deriving
   normalised proportions (the effect on every `u` value is ≤ 0.003).

Ground clearance: the manual's 113 mm is a minimum figure (the load condition is not
stated); the "about 145 mm" in a dealer listing is probably an unladen measurement.
The manual value is used.

## Side-profile proportions

Normalised to overall length = 1.000, with `u = +0.500` at the front bumper,
`u = -0.500` at the rear bumper, `v = 0.000` at the sill and `v = 1.000` at the roof.

**Method.** This is the best-anchored car in the batch: the owner's manual publishes
the **front overhang (885 mm)** and **rear overhang (982 mm)** as well as the
wheelbase, so all four wheel-position values are arithmetic, not estimates. Cabin
breakpoints are estimated from the production car's side view. Vertical values use
`v = (z - 310) / (1466 - 310)`, with the sill at 310 mm above ground (estimated from
the published 113 mm clearance plus rocker thickness).

| Quantity | Normalised value | In mm | How derived | Uncertainty |
| --- | --- | --- | --- | --- |
| Front overhang | **0.196** | 885 mm | published; `885 / 4519` | ±0.002 |
| Rear overhang | **0.217** | 982 mm | published; `982 / 4519` | ±0.002 |
| Wheelbase / length | **0.587** | 2652 mm | `2652 / 4519 = 0.58685` — verified | exact |
| Front wheel-centre u | **+0.304** | — | `0.500 - 0.196` | ±0.002 |
| Rear wheel-centre u | **-0.283** | — | `-0.500 + 0.217` | ±0.002 |
| Wheelbase check | **0.587** | — | `0.304 - (-0.283) = 0.587` — equals wheelbase/length | exact |
| Wheel diameter / length | **0.135** | 611.4 mm | `611.4 / 4519` | ±0.001 |
| Wheel diameter / height | **0.417** | 611.4 mm | `611.4 / 1466` | ±0.002 |
| Roof peak u | **+0.03** | — | flat roof, plateau about `-0.05 … +0.13` | ±0.03 |
| Roof peak v | **1.000** | 1466 mm | definition (`v = 1` at the roof) | exact |
| Beltline v | **0.60** | ≈1004 mm above ground | window-sill line estimated from photos | ±0.04 |
| Sill height | **v = 0.000** | 310 mm above ground | rocker underside; minimum clearance 113 mm published | ±20 mm |
| Bonnet leading-edge v (at the nose) | **0.38** | ≈749 mm above ground | estimated from the nose height in side view | ±0.04 |
| Windscreen base u | **+0.28** | 1265 mm ahead of centre | A-pillar foot, estimated | ±0.02 |
| Roof front u | **+0.15** | — | top of the A-pillar | ±0.02 |
| Roof rear u | **-0.24** | — | top of the C-pillar | ±0.02 |
| Rear-glass base u | **-0.34** | — | bottom of the rear screen at the boot lid | ±0.03 |
| Bonnet length | **0.220** | 994 mm | `0.500 - 0.280` | ±0.02 |
| Boot length | **0.160** | 723 mm | `-0.340 - (-0.500)` | ±0.03 |

**Derivation notes.**

- *Overhangs and wheel centres* are the strongest in this batch — both overhangs are
  manufacturer figures and the three numbers sum to the manual's 4519 mm exactly.
  The long rear overhang (0.217 L, longer than the 206's 0.177 and the Tondar's
  0.198) is a real proportion cue: the Tara looks tail-heavy next to them.
- *Cabin extents* are estimated. The 301-derived body has a flat roof, a fairly
  upright A-pillar and a wide C-pillar; the boot is a true notchback deck, not a
  hatch. The **rear-glass run** is about 0.10 L (452 mm horizontal, 462 mm rise);
  the `CarArt` landmarks use 0.18 L on all four cars in this batch, which reads as a
  fastback.
- The **beltline** is high and the glass band sits in the upper ~40 % of the side;
  this is the main difference from the older 206 and the reason the two cars must
  not share a glasshouse template.

**Repo cross-check (art data).** `CarArt` stores `windshieldBase 0.78` (→ `+0.28`,
agrees), `roofFront 0.65` (→ `+0.15`, agrees), `roofRear 0.37` (→ `-0.13`) and
`rearGlassBase 0.19` (→ `-0.31`, within 0.03 of the `-0.34` estimated here). The
landmarks are therefore close, but the **rear-glass run is 0.18 L instead of about
0.10 L** — the same shared-template artefact seen on the Shahin and the 206. The
silhouette compounds it by running the rear glass down to `-0.44`, which gives a
271 mm boot lid; the production car's deck is closer to 700 mm. Recommend moving
the boot-lid crease forward to about `-0.34` and the roof rear back to `-0.24`,
keeping the deck flatter.

## Identity checklist

- **Notchback sedan on the 301 platform**, with a long 2652 mm wheelbase and a
  visibly long rear overhang (0.217 L). (derived from published figures)
- **Flat roof plateau** from about `u = -0.05` to `u = +0.13`, then a wide, gently
  sloped C-pillar. (interpretation)
- **High beltline**: the glass occupies the upper ~40 % of the side, with a chrome
  window surround on V2/V4. (chrome confirmed by Hamrah Mechanic; proportion
  interpretation)
- **Shoulder crease** running from the headlamp corner, through both door handles,
  to the tail lamp — the car's main horizontal line. (interpretation)
- **Rear door glass kicks up at the C-pillar** rather than ending in a straight
  horizontal cut. (interpretation)
- **Wide, triangular tail lamps** that wrap onto the rear quarter; V2 has a
  triangular internal graphic, V4 an updated graphic. (confirmed — Hamrah Mechanic)
- **Projector headlamps** with a slat grille; from the side only the outer corner
  and the lamp's upper edge show. (interpretation)
- **Chrome door handles** on V2/V4 (body-coloured on the manual V1). (confirmed —
  Hamrah Mechanic)
- **16-inch alloy wheels**, 205/50 R16, with a multi-spoke face. (size confirmed;
  spoke count interpretation)
- **Antenna is the trim tell**: whip on V2, shark fin on V4. If the art draws a
  shark fin, it is representing a V4. (confirmed — Hamrah Mechanic)

## Wheel and rim

- **Diameter:** 16 inch rim (406.4 mm), overall tyre diameter 611.4 mm with
  205/50 R16. Confirmed — owner's manual.
- **Rim:** aluminium alloy, **6.5J × 16**. Confirmed — owner's manual.
- **Tyre:** 205/50 R16, i.e. **50 % sidewall aspect** — a low, stiff sidewall with
  little bulge; visually very different from the 206's 65 % tyre. Confirmed.
- **Alternate fitment:** 195/55 R16 appears in the same manual table (overall
  diameter 620.9 mm). Confirmed in the manual; which trim gets it is not stated —
  **unknown**.
- **Spoke style:** multi-spoke alloy, silver with darker pockets between the spokes.
  The exact spoke count is **not confirmed** in any text source; treat it as an
  interpretation and keep the face simple at gameplay scale.
- **Colour:** silver. Interpretation.

## Facelift and market notes

- **2019–2020:** Tara unveiled (February 2020), developed from the Peugeot 301 after
  PSA left Iran; production and first deliveries in 1400 (2021).
- **Late 1400 (2022):** automatic **V2** arrives — 16-inch alloys, honeycomb grille,
  chrome door handles and chrome lower window trim, whip antenna, triangular tail
  lamp graphic.
- **1402 (2023):** automatic **V4** arrives — same body and wheels, but a **shark-fin
  antenna** and the newer tail lamp graphic; V1 Plus adds a 6-speed manual.
- **1403–1405:** V1 ends, V1 Plus continues, Tara Turbo (EF7P, 160 hp) arrives in
  1405 with the V4's exterior. Through all of this the **side view is unchanged**;
  only the antenna, lamp graphics, wheels and trim differ.
- **Which variant the game should represent:** a **2023 (1402) automatic**. Both V2
  and V4 were on sale that year, so the roster is ambiguous. Pick **V4** if the art
  keeps the shark fin (which `CarArt.detail.antenna: true` currently implies), or
  **V2** if a whip antenna is drawn. Do not model the 1405 Turbo: it has the same
  body but a different powertrain and would misrepresent the roster's 1.6.
- **Data note (out of art scope):** the repo's 205/55 R16 assumption is the one
  dimension that should be corrected if the wheel size is touched; see the
  dimensions table.

## Sources

All URLs accessed 2026-11-12. No images were downloaded, traced or committed.

1. **IKCO (Tara owner's manual / technical data, PDF mirrored by kianbattery.com)** —
   "اطلاعات فنی تارا". URL:
   https://www.kianbattery.com/wp-content/uploads/2023/10/%D8%A7%D8%B7%D9%84%D8%A7%D8%B9%D8%A7%D8%AA-%D9%81%D9%86%DB%8C-%D8%AA%D8%A7%D8%B1%D8%A7.pdf
   Accessed 2026-11-12. Supports: 4519 mm overall length, 885/982 mm overhangs,
   2652 mm wheelbase, 1466 mm height, 1748/1953 mm width, 1501/1478 mm tracks,
   113 mm minimum clearance, 6.5J × 16 wheels, 205/50 R16 and 195/55 R16 tyres,
   TU5P outputs. Confidence: high (manufacturer document; mirror, not ikco.ir).
   Reference-only: no.
2. **Hamrah Mechanic** — "معرفی و مقایسه انواع تارا: کدام مدل تارا بخریم؟". URL:
   https://www.hamrah-mechanic.com/mag/all-ikco-tara-types-in-market Accessed
   2026-11-12. Supports: V1/V1 Plus/V2/V4 line-up and dates, V2 vs V4 antenna and
   tail-lamp differences, 16-inch alloys and chrome trim on V2/V4. Confidence: high
   (detailed, consistent with the manual). Reference-only: no.
3. **Iranecar** — "ایران خودرو تارا V1 پلاس". URL:
   https://iranecar.com/services/vehicle-info/album/%D8%A7%DB%8C%D8%B1%D8%A7%D9%86-%D8%AE%D9%88%D8%AF%D8%B1%D9%88-%D8%AA%D8%A7%D8%B1%D8%A7-V1-%D9%BE%D9%84%D8%A7%D8%B3?vehicleId=6009
   Accessed 2026-11-12. Supports: 4505 × 1748 × 1466 mm, 2652 mm wheelbase, the
   "about 145 mm" clearance figure (not used). Confidence: medium.
   Reference-only: no.
4. **Wikipedia** — "Peugeot 301". URL: https://en.wikipedia.org/wiki/Peugeot_301
   Accessed 2026-11-12. Supports: Tara is the indigenised Peugeot 301; 301
   dimensions 4442 × 1748 × 1446, 2655 mm wheelbase (context for the longer Tara
   body). Confidence: high for the relationship, medium for the 301 figures.
   Reference-only: no.
