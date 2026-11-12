## Identity

**Mazda MX-5 ND 2.0 — 2019, Skyactiv-G, 6-speed manual.**

| Item | Value | Confidence |
| --- | --- | --- |
| Make / model | Mazda MX-5 (Miata in North America, Roadster in Japan) | Confirmed — S3 |
| Generation / chassis | ND, fourth generation; **ND2** (the 2019 update, not the 2015–2018 ND1) | Confirmed — S3 |
| Model year | 2019 | Confirmed — S1, S3 |
| Body | 2-door soft-top roadster, 2 seats, front mid-engine, rear-wheel drive | Confirmed — S1, S3 |
| Trim | No single global trim name; the roster describes the 2.0 Skyactiv-G with the 6-speed manual. US equivalents: Club or Grand Touring | Confirmed — S1 |
| Engine | PE-VPS 2.0 L Skyactiv-G I4, 181 hp @ 7,000 rpm, 205 N·m @ 4,000 rpm, 7,500 rpm redline | Confirmed — S1, S3 |
| Gearbox | Skyactiv-MT 6-speed manual | Confirmed — S1 |
| Market variant | Global/US-EU spec, LHD; the 2019 US specification sheet is the dimensional reference here | Confirmed — S1 |

The ND2 identification matters: the 2019 update raised the 2.0 from 158 hp to 181 hp, added a dual-mass flywheel, a telescoping steering column, a standard reversing camera and — visibly — black 17-inch wheels and an optional burgundy soft top (S3). An ND1 silhouette is nearly identical, but the wheel finish and the model year claim would be wrong.

## Dimensions

S-numbers refer to the numbered list in **Sources**. Repo values are from `src/vehicles/extra-cars.ts` (`mx5-nd`) and `docs/vehicle-sources-extra.md`.

| Parameter | Value | Source | Confidence | Repo cross-check |
| --- | --- | --- | --- | --- |
| Overall length | 3,915 mm (154.1 in) | S1, S2, S3 | Confirmed | Agrees (3,915 mm) |
| Wheelbase | 2,310 mm (90.95 in) | S1, S2, S3 | Confirmed | Agrees (2,310 mm) |
| Height | 1,235 mm (European datum) / 1,240 mm (US 17-inch cars) | S1, S2 | Confirmed, market-dependent | Repo 1,235 mm — matches the European figure. A US 2.0 on 17s is 5 mm taller; the difference is measurement basis, not body change |
| Width (excl. mirrors) | 1,735 mm (68.3 in) | S1, S2 | Confirmed | Agrees (1,735 mm). **Disagreement:** Wikipedia gives 1,730 mm (S3); the US and UK specification sheets both say 1,735 mm, so 1,735 is used |
| Front track | 1,495 mm (58.9 in) | S1, S2 | Confirmed | Not stored in `CarNumbers` |
| Rear track | 1,505 mm (59.17 in) | S1, S2 | Confirmed | Not stored |
| Tyre size | 205/45 R17 on 17 × 7 alloy (2.0 cars) | S1, S2 | Confirmed | Agrees (205/45 R17) |
| Wheel diameter | 17 in rim = 431.8 mm; overall tyre diameter **616 mm** (431.8 + 2 × 205 × 0.45) | S1 + arithmetic | Confirmed | Agrees — repo `wheelRadiusM: 0.308` = 616 mm |
| Ground clearance | 135 mm (5.32 in, laden, 17-inch cars) / 125 mm (4.92 in, 16-inch Sport) | S1 | Confirmed | Not stored |
| Kerb mass | 1,061 kg (2,339 lb, manual) | S1, S3 | Confirmed | Agrees (1,061 kg) |

The MX-5 is the best-agreeing car in the batch: the repo's length, wheelbase, width, height, tyre, wheel radius and mass all match the manufacturer sheet within 1%. The only flag is the Wikipedia width (1,730 mm), which is 5 mm narrow and probably a rounded European figure.

## Side-profile proportions

Normalised to overall length **L = 1.000**, front bumper at **u = +0.500**, rear bumper at **u = −0.500**. Derived with L = 3,915 mm and WB = 2,310 mm.

| Quantity | Value | Derivation | Uncertainty |
| --- | --- | --- | --- |
| Front overhang | **0.201 L** (785 mm) | Not published by Mazda; inferred from the ND's short-nose layout and the 3,915 − 2,310 mm overhang total | ±0.010 (≈ ±40 mm) |
| Rear overhang | **0.209 L** (820 mm) | L − WB − front overhang = 3,915 − 2,310 − 785 | ±0.010 |
| Wheelbase / length | **0.590** (0.59004) | 2,310 / 3,915 | Exact |
| Front wheel-centre u | **+0.299** | 0.5 − 785/3,915 | ±0.010 |
| Rear wheel-centre u | **−0.291** | −0.5 + 820/3,915 | ±0.010 |
| Identity check | u_front − u_rear = 0.59004 = WB/L | — | Passes exactly |
| Wheel diameter / length | **0.157** | 616 / 3,915 | ±0.002 |
| Wheel diameter / height | **0.499** | 616 / 1,235 | ±0.005 |
| Roof peak u | **−0.03** | Soft top's highest point sits just behind the windscreen header, over the seats | ±0.02 |
| Roof height (v = 1.000) | 1,235 mm (soft top raised) | S1 | ±5 mm |
| Beltline v | **0.64** | Window sill ≈ 840 mm above ground, sill 140 mm, roof 1,235 mm: (840−140)/(1,235−140) | ±0.03 |
| Sill height | 140 mm above ground (v = 0.000 by definition) | Rocker bottom on a 135 mm-clearance roadster | ±20 mm |
| Bonnet leading edge v (at the nose) | **0.50** | Nose top ≈ 690 mm above ground, same v basis | ±0.03 |
| Windscreen base u | **+0.220** | Bonnet ≈ 1,095 mm from the nose; the screen base sits ahead of the front axle (+0.299) | ±0.012 |
| Roof front u (top of windscreen frame) | **+0.090** | A steeply raked screen over a very low body | ±0.012 |
| Roof rear u (rear of the soft top) | **−0.140** | The top's rear edge drops onto the deck behind the seats | ±0.015 |
| Rear-glass base u | **−0.335** | Where the soft-top rear window meets the rear deck | ±0.015 |
| Bonnet length | **0.280 L** (1,096 mm) | 0.5 − 0.220 | ±0.012 |
| Boot / rear-deck length | **0.165 L** (646 mm) | −0.335 + 0.5 | ±0.015 |

Method: length and wheelbase are published, so the wheelbase fraction and tyre fraction are exact. The overhang split is inferred — Mazda does not publish it — and is the least certain part of this section. The greenhouse landmarks are read from the car's extreme proportions (height/length = 0.316, the lowest of the four) and are estimates.

One convention note: with the roof up, the ND's v = 1.000 is the soft-top fabric, not a metal roof. With the roof down the highest body point becomes the windscreen header, roughly 0.86 of the roof-up height. Art should state which state it draws.

## Identity checklist

1. **Very short rear deck and short overhangs at both ends** — the cabin sits far back, the tail is clipped almost immediately behind the rear wheel. **[confirmed — S3 design; overhangs estimated]**
2. **Low beltline and shallow glasshouse** — the driver's elbow rests near the sill; the side glass is only ~300 mm tall. **[confirmed — S1 dimensions; interpretation of the glass depth]**
3. **Muscular arch blisters over both wheels**, flaring out of an otherwise smooth flank. The ND's signature side feature. **[confirmed — ND design feature]**
4. **Long bonnet with a central crease and a low, rounded nose.** **[confirmed — S3 proportions]**
5. **Steeply raked, thin windscreen frame**, black-finished, with the header close to the driver's head. **[confirmed — soft-top ND]**
6. **Soft-top stack / rear deck hump** behind the seats when the roof is lowered. **[interpretation]**
7. **Round-ish tail lamps** and a small lip spoiler on the boot lid. **[confirmed — repo `detail.spoiler: 'lip'`; ND tail-lamp shape]**
8. **17-inch multi-spoke alloys with 205/45 R17** — a big wheel in a small car (wheel diameter = 0.50 of height). **[confirmed size; spoke pattern interpretation]**
9. **Body-colour door mirrors on short stalks**, mounted on the door skin. **[confirmed]**
10. **Sill flare rising toward the rear wheel**, visually connecting the two arch blisters. **[interpretation]**

## Wheel and rim

| Item | Value | Confidence |
| --- | --- | --- |
| Rim diameter | 17 in (431.8 mm) | Confirmed — S1, S2 |
| Rim width | 7.0J | Confirmed — S1 ("17 x 7") |
| Construction | Aluminium alloy | Confirmed — S1 |
| Spoke style | Multi-spoke (10-spoke) | Medium — pattern is an interpretation from the ND wheel; no source read here states the spoke count |
| Colour / finish | Bright silver on European 2.0 cars; dark silver on US Grand Touring; **black** on US Club for 2019 | Medium — S1 (US finishes), S2 (UK/EU silver) |
| Tyre | 205/45 R17, 45% aspect | Confirmed — S1, S2 |
| Repo art tag | `rimStyle: 'mesh'` | Acceptable — the ND wheel is a fine multi-spoke, closer to "mesh" than "spoke" at game resolution |

The 2019 US Club's black wheels (S3) are a period-correct detail worth using if the game wants to date the car precisely; a silver finish is the safer global choice.

## Facelift and market notes

- **ND1: 2015–2018.** 2.0 engine rated 158 hp / 160 PS. Visually near-identical to the ND2.
- **ND2: from late 2018 for the 2019 model year** — the car in this roster. 181 hp, 7,500 rpm redline, dual-mass flywheel, telescoping steering column, standard reversing camera, black 17-inch wheels and an optional burgundy soft top (S3).
- **ND3: from 2024.** New headlamps with DRLs, new tail lamps, revised infotainment and steering, a new limited-slip differential. Front and rear ends change; the side view stays.
- **RF vs soft top:** the RF (retractable fastback) has a completely different rear deck and buttresses. This roster entry is the **soft top**; do not draw RF buttresses.
- **Market:** all 2019 US cars are 2.0; Europe also sold a 1.5 (131 hp) on 16-inch wheels with 195/50 R16. The roster's 205/45 R17 confirms the 2.0.
- Production of the 2.0 for Europe ended in 2024 on emissions grounds; the 2019 car is unaffected.

## Sources

1. **Mazda North American Operations** — *2019 Mazda MX-5 Miata specifications* (PDF). https://www.mazdausa.com/siteassets/pdf/owners-optimized/2019/mx-5-miata-st/2019_mazda_mx5_features_specs.pdf — accessed 2026-11-12. Supports: 154.1 in length, 68.3 in width, 48.64 / 48.8 in height, 90.95 in wheelbase, tracks 58.9 / 59.17 in, ground clearance 4.92 / 5.32 in, 17 × 7 wheels with 205/45 R17, 2,339 lb manual, 181 hp / 151 lb-ft, 7,500 rpm redline, 6MT ratios and 2.866 final drive. Confidence: high. Not reference-only.
2. **Mazda Motors UK** — *Mazda MX-5 prices and specifications* (PDF). https://media-assets.mazda.eu/raw/upload//mazdauk/globalassets/uk/pdfs/fy160/p3/mx5/mx-5-ps-guide-oct-22.10.25.pdf — accessed 2026-11-12. Supports: 3,915 / 1,735 / 1,225–1,230 mm, wheelbase 2,310 mm, tracks 1,495 / 1,505 mm, 17-inch wheels with 205/45 R17 on 184 ps cars. Confidence: high, but the document covers a later model year — **reference-only** for trim detail.
3. **Wikipedia** — *Mazda MX-5 (ND)*. https://en.wikipedia.org/wiki/Mazda_MX-5_(ND) — accessed 2026-11-12. Supports: 3,915 / 1,730 / 1,235 mm, wheelbase 2,310 mm; 2019 ND2 update (181 hp, 205 N·m, 7,500 rpm, dual-mass flywheel, telescoping column, black 17-inch wheels, burgundy top); ND3 2024 facelift; RF body differences. Confidence: medium-high (width conflicts by 5 mm with S1/S2). Reference-only.
4. **Car and Driver** — *2019 Mazda MX-5 Miata Club manual features and specs*. https://www.caranddriver.com/mazda/mx-5-miata/specs/2019/mazda_mx-5-miata_mazda-mx-5-miata-rf_2019 — accessed 2026-11-12. Supports: track 58.9 / 59.2 in, height 49 in, independent confirmation of the US dimensions. Confidence: high. Reference-only.
5. **Repository (internal)** — `src/vehicles/extra-cars.ts`, `docs/vehicle-sources-extra.md`. Local files, not web. Used for the cross-check column and the existing 6MT gear ratios.
