## Identity

**Toyota Land Cruiser Prado 150 — 4.0 V6 TX-L, 2021, 6-speed automatic.**

| Item | Value | Confidence |
| --- | --- | --- |
| Make / model | Toyota Land Cruiser Prado (J150 / LC150, fourth generation) | Confirmed — S1, S4 |
| Body | 5-door wagon, body-on-frame, 7 seats (GCC TX-L) | Confirmed — S2 |
| Model year | 2021 (GCC) | Confirmed — S2 |
| Grade | TX-L (Gulf-market grade; Japan also used the TX-L name, with the 2.7 petrol or 2.8 diesel) | Confirmed — S2, S4 |
| Engine | 1GR-FE 4.0 L V6 petrol, 271 hp @ 5,600 rpm, 381 N·m @ 4,400 rpm | Confirmed — S2 |
| Gearbox | 6-speed automatic, full-time 4WD with Torsen centre LSD | Confirmed — S1, S2 |
| Market variant | GCC (UAE/KSA/Qatar), LHD, rear-door-mounted spare wheel | Confirmed — S2 (spare carrier), S1 (exterior-spare length) |
| Model code | GRJ150L 4.0 V6 5-door; the 2023 GCC TX-L brochure states **GRJ150L-GKTEKV** | High for the family, medium for the exact 2021 suffix — S2 |

The 4.0 V6 TX-L is a Gulf-market combination. Japan sold the TX-L grade with the 2.7 petrol or 2.8 diesel and Australia used the GX / GXL / VX / Kakadu names, so a 4.0 V6 TX-L is a GCC specification. That matters for the side view because GCC cars carry the spare wheel on the tailgate (S2), which adds roughly 250 mm behind the rear bumper relative to the underfloor-spare body used in Europe.

## Dimensions

S-numbers refer to the numbered list in **Sources**. Repo values are from `src/vehicles/profiles.ts` (`prado-150-2021`) and `docs/VEHICLE_DATA_SOURCES.md`.

| Parameter | Value | Source | Confidence | Repo cross-check |
| --- | --- | --- | --- | --- |
| Overall length | 5,010 mm (exterior spare, 5-door) | S1, S2 | Confirmed | **Disagreement:** repo 4,760 mm. That figure is Toyota's own J150 length for the underfloor-spare body (S5); Wikipedia lists 4,825 / 4,930 / 4,995 mm for the three spare-wheel arrangements (S4) |
| Wheelbase | 2,790 mm | S1, S2, S4 | Confirmed | Agrees (2,790 mm) |
| Height | 1,845 mm (GCC, no roof rails) / 1,880 mm (SA, roof rails) / 1,890 mm (VX-L) | S1, S2 | Confirmed, variant-dependent | Repo 1,890 mm — top of the range, not wrong, but the TX-L with rails is 1,880 mm |
| Width (excl. mirrors) | 1,885 mm | S1, S2, S4 | Confirmed | Repo 1,890 mm (+5 mm, negligible) |
| Front track | 1,585 mm | S1 | Confirmed | Not stored in `CarNumbers` |
| Rear track | 1,585 mm | S1 | Confirmed | Not stored in `CarNumbers` |
| Tyre size | 265/65 R17 on 7.5J alloy (TX 4.0) | S1 | Confirmed | Agrees (265/65 R17) |
| Wheel diameter | 17 in rim = 431.8 mm; overall tyre diameter **776 mm** (calculated: 431.8 + 2 × 265 × 0.65) | S1 + arithmetic | Confirmed rim, calculated tyre | **Disagreement:** repo `wheelRadiusM: 0.40` = 800 mm diameter, i.e. 24 mm (3.1%) larger than a 265/65 R17. 800 mm corresponds to 265/65 R18, not R17 |
| Ground clearance | 215 mm | S2 | Confirmed (GCC) | Not stored |
| Approach / departure | 31° / 25° | S1 | Confirmed | Not stored |
| Kerb mass | 2,360–2,420 kg (SA 2021 range) | S1 | Confirmed | Repo 2,450 kg — within 30 kg of the heaviest SA figure; acceptable as an estimate |

Notes on the two disagreements:

- **Length.** 4,760 mm is a real Prado 150 dimension, but for the underfloor-spare body. The GCC TX-L that this roster entry describes has a tailgate-carried spare and measures 4,950–5,010 mm in period listings, with 5,010 mm in Toyota's own 2021 SA sheet and in the GCC dealer brochure. All side-profile numbers below use **5,010 mm**. If the repo keeps 4,760 mm, the derived values change as noted at the end of the next section.
- **Wheel radius.** Either the tyre string or the radius is wrong. For art, 0.388 m is the correct nominal radius for 265/65 R17; 0.400 m should only be used if the drawn tyre is 265/65 R18.

## Side-profile proportions

Normalised to overall length **L = 1.000**, front bumper at **u = +0.500**, rear bumper at **u = −0.500** (CHARKHTAZ convention). Derived with L = 5,010 mm and WB = 2,790 mm.

| Quantity | Value | Derivation | Uncertainty |
| --- | --- | --- | --- |
| Front overhang | **0.195 L** (975 mm) | Toyota UK LC150 brochure gives 975 mm front overhang for the 5-door (S3) | ±0.008 (the brochure also lists a 970/1,075 mm rear overhang for a different spare carrier, so the split is not perfectly pinned) |
| Rear overhang | **0.249 L** (1,245 mm) | L − WB − front overhang = 5,010 − 2,790 − 975 | ±0.010, driven by the spare-wheel carrier |
| Wheelbase / length | **0.557** (0.55689) | 2,790 / 5,010 | Exact |
| Front wheel-centre u | **+0.305** | 0.5 − 975/5,010 | ±0.008 |
| Rear wheel-centre u | **−0.252** | −0.5 + 1,245/5,010 | ±0.010 |
| Identity check | u_front − u_rear = 0.55689 = WB/L | — | Passes exactly |
| Wheel diameter / length | **0.155** | 776 / 5,010 | ±0.002 |
| Wheel diameter / height | **0.411** | 776 / 1,890 | ±0.005 |
| Roof peak u | **+0.02** | Flat roof; visual centre of the roof panel is just ahead of the B-pillar midpoint | ±0.03 |
| Roof height (v = 1.000) | 1,880 mm (body roof, rails excluded) | S1 | ±10 mm |
| Beltline v | **0.53** | Window sill ≈ 1,190 mm above ground, sill line 400 mm, roof 1,880 mm: (1,190−400)/(1,880−400) | ±0.03 |
| Sill height | 400 mm above ground (v = 0.000 by definition) | Rocker bottom estimated from the 215 mm underbody clearance plus the rocker step | ±40 mm |
| Bonnet leading edge v (at the nose) | **0.45** | Nose top ≈ 1,060 mm above ground, same v basis | ±0.03 |
| Windscreen base u | **+0.300** | Bonnet ≈ 1,000 mm from the nose; the screen base sits just behind the front axle (+0.305) | ±0.012 |
| Roof front u (top of A-pillar) | **+0.160** | A-pillar rake ≈ 30° from vertical over a 1,880 mm tall body | ±0.015 |
| Roof rear u (top of D-pillar) | **−0.200** | Roof runs flat to the last pillar, then the tailgate drops | ±0.015 |
| Rear-glass base u | **−0.375** | Near-vertical tailgate glass, base just above the tailgate shut line | ±0.015 |
| Bonnet length | **0.200 L** (1,002 mm) | 0.5 − 0.300 | ±0.012 |
| Tailgate / rear-deck length | **0.125 L** (626 mm) | −0.375 + 0.5 | ±0.015 |

Method: the wheel positions are arithmetic from published length, wheelbase and one published overhang, so they are the hardest numbers in this section. Everything above the sill line (beltline, roof, screen) is read off the car's known height and its boxy proportions, not measured from a photograph; treat those as informed estimates with the stated tolerance.

**If the repo keeps L = 4,760 mm:** front overhang 0.205, rear 0.209, WB/L 0.586, u_front +0.295, u_rear −0.291, tyre/L 0.163. The car reads 5% shorter and the rear overhang loses the spare-wheel mass that gives the Prado its silhouette.

## Identity checklist

1. **Near-vertical A-pillar with a tall, rectangular glasshouse** — the defining J150 cue against car-based SUVs. **[confirmed]**
2. **Full-length roof rails** standing ~30 mm proud of the roof. **[confirmed — TX-L standard, S2]**
3. **Side steps / running boards** under the doors, body-colour or black. **[confirmed — TX-L standard, S2]**
4. **Squared wheel arches with black plastic cladding** and a large gap between tyre and arch lip. **[confirmed — S2 cladding/moulding list]**
5. **Tailgate-mounted spare wheel in a hard cover**, offset toward the kerb; it extends the body ~250 mm past the rear bumper. **[confirmed for GCC — S2]**
6. **Vertical tailgate glass and a straight, vertical rear-door cut line**, with the door hinged on the right for LHD. **[confirmed — S1/S2 body layout; left/right side interpretation]**
7. **Beltline rising gently from the A-pillar to the rear quarter**, with a chrome window surround. **[interpretation]**
8. **17-inch six-spoke silver alloys with 65-aspect tyres**, so the sidewall is visibly taller than the rim. **[confirmed size; spoke pattern interpretation]**
9. **Mirrors mounted on the door skin**, with a small quarter-light ahead of the front door. **[interpretation]**
10. **High, flat bonnet whose leading edge sits just below the beltline** (v ≈ 0.45 versus 0.53). **[interpretation]**

## Wheel and rim

| Item | Value | Confidence |
| --- | --- | --- |
| Rim diameter | 17 in (431.8 mm) | Confirmed — S1 |
| Rim width | 7.5J | Confirmed — S1 |
| Construction | Light-alloy | Confirmed — S1 ("Alloy") |
| Spoke style | 6-spoke, silver | Medium — Toyota's 17" alloy for this body is listed as 6-spoke (S3); TX-L fitment not independently confirmed |
| Colour | Silver | Medium — S3 |
| Tyre | 265/65 R17, 65% aspect, Bridgestone on GCC cars | Confirmed size — S1; brand from a 2023 GCC sheet (S2), reference-only |
| Repo art tag | `rimStyle: 'rugged'` | Acceptable as a style hint, but the TX-L wheel is a passenger-type six-spoke alloy, not a beadlock |

## Facelift and market notes

- **2009** J150 launch. **2013** first facelift (new front panels, LED headlamps on high grades). **2017** second facelift (LED headlamps and Toyota Safety Sense standard, new bonnet/grille). **2020–21** running update: 2.8 diesel revised to 150 kW / 500 N·m and a new front-end treatment on GCC and Japanese cars. The 2021 GCC car is the facelifted body. All of these are front-end changes — **the side view is essentially unchanged**, apart from wheel designs and black-painted side steps. The precise 2020/21 front-end change date is medium confidence; the side-view conclusions do not depend on it.
- **MY2021 GCC TX-L** is the right car for this roster entry: 1GR-FE 4.0 V6, 6AT, tailgate spare, 17-inch wheels, roof rails, side steps, 7 seats. The 2023 GCC TX-L moved to 265/55 R19 (S2) and must not be used for a 2021 car.
- **Spare-wheel configuration is the single biggest side-view variable.** Underfloor spare (Europe): 4,760 mm and a clean tailgate. Tailgate spare (GCC): 5,010 mm and a spare wheel standing proud of the body. The game should draw the GCC car, because that is what a TX-L is.
- J150 production ended in October 2023 (replaced by the J250). Do not mix J250 dimensions (4,925 mm, 2,850 mm wheelbase) into this car.

## Sources

1. **Toyota South Africa Motors** — *Land Cruiser Prado specifications* (PDF, dated 2021/07). https://nd-mediagallery2-public-production.s3.amazonaws.com/82aeb5ec87afa926b582610d5411a6f2/lc_prado_spec_sheet.pdf — accessed 2026-11-12. Supports: 5,010 / 1,885 / 1,880–1,890 / 2,790 mm, tracks 1,585 mm, tyre 265/65 R17 on TX 4.0, kerb 2,360–2,420 kg, approach/departure 31°/25°. Confidence: high. Not reference-only.
2. **Sahara Motors (UAE distributor)** — *2023 Land Cruiser Prado TXL V6 4.0L brochure* (PDF). https://www.saharamotorsuae.com/uploads/pdf/24082380938Prado%20TXl%20Brochure.pdf — accessed 2026-11-12. Supports: GCC TX-L equipment (roof rails, side steps, rear-door spare carrier), 5,010 / 1,885 / 1,845 mm, 215 mm ground clearance, 265/55 R19, model code GRJ150L-GKTEKV. Confidence: high for equipment, but it is a **2023** document — reference-only for the 2021 car.
3. **Toyota (UK)** — *Land Cruiser LC150 brochure* (PDF). https://www.toyota.co.uk/content/dam/toyota/nmsc/united-kingdom/new-cars/commercial-vehicles/LC150.pdf — accessed 2026-11-12. Supports: front overhang 975 mm; 17" 6-spoke alloy on lower grades; 19" on Invincible. Confidence: medium (the overhang line came from the specification table in search extraction; the table did not machine-read cleanly). Reference-only.
4. **Wikipedia** — *Toyota Land Cruiser Prado*. https://en.wikipedia.org/wiki/Toyota_Land_Cruiser_Prado — accessed 2026-11-12. Supports: J150 production 2009–2023; length 4,825 / 4,930 / 4,995 mm by spare-wheel arrangement; height 1,845–1,890 mm; wheelbase 2,790 mm; facelift dates (2013, 2017, 2020). Confidence: medium (community-edited, but the figures agree with Toyota documents above). Reference-only.
5. **Toyota Motor Corporation** — *75 Years of Toyota, Vehicle Lineage: Land Cruiser Prado (150)*. https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60001931 — accessed 2026-11-12. Supports: length 4,760 mm for the J150 — the origin of the repo's figure. Confidence: high. Not reference-only.
6. **Repository (internal)** — `src/vehicles/profiles.ts`, `docs/VEHICLE_DATA_SOURCES.md`. Local files, not web. Used for the cross-check column.
