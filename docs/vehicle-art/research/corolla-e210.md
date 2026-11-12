## Identity

**Toyota Corolla E210 1.6 — 2020, XLI, CVT.**

| Item | Value | Confidence |
| --- | --- | --- |
| Make / model | Toyota Corolla, twelfth generation | Confirmed — S2 |
| Generation / chassis | E210 series, four-door saloon | Confirmed — S2 |
| Body variant | International "Prestige" saloon — the Camry-like front end sold in the Middle East, Europe, Africa and South America, not the US/Japan "Sporty" nose | Confirmed — S2 |
| Model year | 2020 (saloon production from January 2019; 2020 MY) | Confirmed — S2 |
| Trim | XLI — Gulf-market base-to-mid grade | Confirmed — S3, S5 |
| Engine | 1ZR-FE 1.6 L petrol I4, 121 hp, 154 N·m | Confirmed — S3 |
| Gearbox / drive | CVT automatic, front-wheel drive | Confirmed — S3 |
| Market variant | GCC (UAE/KSA/Qatar/Bahrain), LHD | Confirmed — S3, S5 |
| Assembly | Turkey (Sakarya) for European "Prestige" saloons; GCC cars are imported rather than locally built | High for Europe — S2; GCC sourcing not verified in this run |

XLI is a Gulf-market grade name; it does not exist in Europe or North America. Mechanically it is the base 1.6 with a CVT, 15-inch steel wheels and a high-aspect tyre — the least sporty, most common E210 saloon in the region.

## Dimensions

S-numbers refer to the numbered list in **Sources**. Repo values are from `src/vehicles/extra-cars.ts` (`corolla-e210`) and `docs/vehicle-sources-extra.md`.

| Parameter | Value | Source | Confidence | Repo cross-check |
| --- | --- | --- | --- | --- |
| Overall length | 4,630 mm (international saloon) | S2, S3 | Confirmed | Agrees (4,630 mm) |
| Wheelbase | 2,700 mm | S2, S3 | Confirmed | Agrees (2,700 mm) |
| Height | 1,435 mm | S2, S3 | Confirmed | Agrees (1,435 mm) |
| Width (excl. mirrors) | 1,780 mm | S2, S3 | Confirmed | Agrees (1,780 mm) |
| Front track | 1,532 mm (60.3 in) | S4 | High | Not stored in `CarNumbers` |
| Rear track | 1,534 mm (60.4 in) | S4 | High | Not stored |
| Tyre size | 195/65 R15 | S5, S6 | High | Repo lists 195/65 R15 but marks it an **estimate**; it is now supported by GCC XLI listings and Toyota Saudi's XLI spec |
| Wheel diameter | 15 in rim = 381 mm; overall tyre diameter **634.5 mm** (381 + 2 × 195 × 0.65) | S5 + arithmetic | Confirmed rim, calculated tyre | Agrees — repo `wheelRadiusM: 0.317` = 634 mm |
| Wheel type | Steel wheel with full-face wheel cover | S5, S6 | High | **Disagreement:** repo `rimStyle: 'mesh'` implies an alloy; the XLI runs steel wheels with covers |
| Ground clearance | 130 mm (5.1 in) | S4 | High (US-market measurement of the same body) | Not stored |
| Kerb mass | 1,285 kg | S3 | High (GCC trim) | Agrees (1,285 kg) |

Two notes on the repo cross-check:

- **Tyre size.** The repo's own source document admits 195/65 R15 was an estimate. The GCC XLI 1.6 is consistently listed on 195/65 R15 with 15-inch steel wheels, so this can be upgraded from estimate to high confidence without changing the value.
- **Wheel material.** This is a real art error, not a data error: XLI cars leave the factory on steel wheels with full covers. Drawing a mesh alloy changes the character of the car.

## Side-profile proportions

Normalised to overall length **L = 1.000**, front bumper at **u = +0.500**, rear bumper at **u = −0.500**. Derived with L = 4,630 mm and WB = 2,700 mm.

| Quantity | Value | Derivation | Uncertainty |
| --- | --- | --- | --- |
| Front overhang | **0.202 L** (935 mm) | Toyota UK technical specification lists 935 mm front overhang for the Corolla | ±0.004 (published) |
| Rear overhang | **0.215 L** (995 mm) | Toyota UK lists 995 mm for the saloon; also equals L − WB − front overhang. Cross-check: 935 + 995 = 1,930 mm, and 4,630 − 2,700 = 1,930 mm, so the column mapping is consistent | ±0.004 |
| Wheelbase / length | **0.583** (0.58315) | 2,700 / 4,630 | Exact |
| Front wheel-centre u | **+0.298** | 0.5 − 935/4,630 | ±0.004 |
| Rear wheel-centre u | **−0.285** | −0.5 + 995/4,630 | ±0.004 |
| Identity check | u_front − u_rear = 0.58315 = WB/L | — | Passes exactly |
| Wheel diameter / length | **0.137** | 634.5 / 4,630 | ±0.002 |
| Wheel diameter / height | **0.442** | 634.5 / 1,435 | ±0.005 |
| Roof peak u | **0.00** | Roof panel is flat from the B-pillar to the C-pillar; peak essentially at mid-wheelbase | ±0.02 |
| Roof height (v = 1.000) | 1,435 mm | S2, S3 | ±5 mm |
| Beltline v | **0.66** | Window sill ≈ 1,000 mm above ground, sill 170 mm, roof 1,435 mm: (1,000−170)/(1,435−170) | ±0.03 |
| Sill height | 170 mm above ground (v = 0.000 by definition) | Rocker bottom on a 130 mm-clearance sedan, allowing for the sill skirt | ±20 mm |
| Bonnet leading edge v (at the nose) | **0.49** | Nose top ≈ 790 mm above ground, same v basis | ±0.03 |
| Windscreen base u | **+0.270** | Bonnet ≈ 1,065 mm from the nose; the screen base sits just behind the front axle (+0.298) | ±0.010 |
| Roof front u (top of A-pillar) | **+0.125** | A-pillar rake ≈ 30° from vertical over a 1,435 mm body | ±0.012 |
| Roof rear u (top of C-pillar) | **−0.145** | Roof begins to fall at the C-pillar; the fastback line continues to the deck | ±0.012 |
| Rear-glass base u | **−0.335** | Base of the rear screen where the fastback meets the boot lid | ±0.012 |
| Bonnet length | **0.230 L** (1,065 mm) | 0.5 − 0.270 | ±0.010 |
| Boot / rear-deck length | **0.165 L** (764 mm) | −0.335 + 0.5 | ±0.012 |

Method: this is the best-anchored of the four cars — both overhangs are published, so wheel centres and wheelbase identity are arithmetic. The greenhouse values are derived from overall height and the E210's known 40 mm-lower windscreen base (S2) and are estimates to ±0.012 in u.

## Identity checklist

1. **Fastback roofline** — the roof continues to fall past the C-pillar into a short deck rather than breaking to a conventional three-box notch. **[confirmed — S2 design description]**
2. **Wide, rounded C-pillar** with a small, triangular rear quarter-light; the pillar tapers into the boot. **[confirmed — Prestige saloon body]**
3. **Low windscreen base**, 40 mm lower than the E170, giving a shallow, laid-back A-pillar. **[confirmed — S2]**
4. **Character line rising from the front wheel arch** through the door handles to the tail lamps. **[interpretation]**
5. **Short front overhang** — Toyota shortened it by 1.3 in versus the previous saloon. **[confirmed — S6; value 935 mm from S1]**
6. **Slim horizontal tail lamps** wrapping slightly onto the rear quarter, with a plain boot lid on XLI. **[confirmed — Prestige body; trim detail interpretation]**
7. **15-inch steel wheels with full-face covers** and 65-aspect tyres. **[confirmed — S5, S6]**
8. **Body-colour door handles and mirrors**, no wheel-arch cladding, no side steps. **[confirmed — XLI equipment]**
9. **Shark-fin antenna** on the rear roof. **[interpretation — repo `detail.antenna`; not verified for XLI]**
10. **Mirror mounted on the door skin** with a small sail panel, not on the A-pillar. **[interpretation]**

## Wheel and rim

| Item | Value | Confidence |
| --- | --- | --- |
| Rim diameter | 15 in (381 mm) | Confirmed — S3, S5 |
| Rim width | 6.0J (typical for 195/65 R15) | Unknown — not stated in any source read; do not treat as fact |
| Construction | Steel wheel with full-face wheel cover | High — S5, S6 |
| Spoke style | None — the cover is a flat, multi-slot disc | High |
| Colour | Silver cover | High |
| Tyre | 195/65 R15, 65% aspect | High — S5, S6 |
| Repo art tag | `rimStyle: 'mesh'` | Wrong for this trim; use a covered steel wheel |

This is the one car in the batch where the stock wheel is not an alloy. Getting it right matters: a base GCC Corolla on steel wheels reads completely differently from one on mesh alloys, and the XLI is the former.

## Facelift and market notes

- **Launch:** hatchback June 2018; saloon January 2019, sold as a 2020 model year in most markets. GCC launch July 2019 (S2).
- **2022 facelift (2023 MY):** new front bumper, headlamps and tail-lamp treatment, plus a revised hybrid system in some markets. **The side view — doors, roof, glass, shoulder line — is unchanged.** The UK dropped the saloon at the facelift.
- **Two saloon body styles exist and must not be mixed:** the "Prestige" saloon (Europe, Middle East, Africa, South America, Taiwan/Altis) and the "Sporty" saloon (North America, Japan, Australia, China/Levin). They differ in front and rear fascias, not in the side profile. The GCC XLI is a Prestige car (S2).
- **Grade:** XLI is the base petrol grade in the Gulf. It has the 1.6, CVT, 15-inch steel wheels, halogen headlamps and fabric seats. Higher GCC grades (GLI, XLE) add alloys and equipment but share the body.
- The game should represent the **pre-facelift 2020 GCC XLI**: Prestige body, steel wheels, no body kit. Do not borrow the US SE's 18-inch wheels or the facelift's lamps.

## Sources

1. **Toyota (UK)** — *Corolla technical specifications* (PDF, January 2021). https://media.toyota.co.uk/wp-content/uploads/sites/5/pdf/210127M-Corolla-Tech-Spec.pdf — accessed 2026-11-12. Supports: front overhang 935 mm; rear overhang 795 / 1,018 / 995 mm across hatch, Touring and saloon — 995 mm used for the saloon. Confidence: high. Not reference-only.
2. **Wikipedia** — *Toyota Corolla (E210)*. https://en.wikipedia.org/wiki/Toyota_Corolla_(E210) — accessed 2026-11-12. Supports: saloon 4,630 / 1,780 / 1,435 mm, wheelbase 2,700 mm; Prestige vs Sporty body split; windscreen base lowered 40 mm; 2022 facelift. Confidence: medium-high (figures corroborated by S3). Reference-only.
3. **DriveNinja** — *2020 Toyota Corolla 1.6L XLI specifications*. https://www.driveninja.com/make/mfr-toyota/model/mdl-toyota-corolla/trim-level/tl-toyota-corolla-e210-2020-16l-xli-16l-xli — accessed 2026-11-12. Supports: 4,630 / 1,780 / 1,435 mm, wheelbase 2,700 mm, 15-inch wheels, 1,285 kg, 121 hp, 154 N·m, CVT, FWD. Confidence: high for GCC trim data. Not reference-only (already cited in the repo).
4. **Car and Driver** — *2020 Toyota Corolla L CVT features and specs*. https://www.caranddriver.com/toyota/corolla/specs/2020/toyota_corolla_toyota-corolla_2020 — accessed 2026-11-12. Supports: front track 60.3 in (1,532 mm), rear track 60.4 in (1,534 mm), ground clearance 5.1 in (130 mm). Confidence: high, but measured on the US-market car of the same body. Reference-only.
5. **Toyota Saudi Arabia (ALJ)** — *Corolla full specifications*. https://www.toyota.com.sa/en/vehicles/corolla/full-specs — accessed 2026-11-12. Supports: XLI 1.6 on 195/65 R15 with steel wheels and full wheel caps. Confidence: high for the current XLI; **reference-only** because the page covers a later model year than 2020.
6. **Toyota USA Newsroom** — *2020 Toyota Corolla* press kit. https://pressroom.toyota.com/vehicle/2020-toyota-corolla — accessed 2026-11-12. Supports: front overhang shortened by 1.3 in and rear overhang extended versus the previous generation (design context). Confidence: high. Reference-only.
7. **Repository (internal)** — `src/vehicles/extra-cars.ts`, `docs/vehicle-sources-extra.md`. Local files, not web. Used for the cross-check column.
