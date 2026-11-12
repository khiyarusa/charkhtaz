# VEHICLE REFERENCE LEDGER — Round 3

Per-car sources behind the art blueprints. Detailed notes, quotation and confidence
per row live in `docs/vehicle-art/research/<car>.md`; this ledger is the index and
the decision record.

Accessed 2026-11-12. No image is shipped or redistributed: every source is
**reference-only** and used for dimensions, proportions and visible design cues.

| Car | Research file | Front / rear overhang used | Confidence | Notes |
| --- | --- | --- | --- | --- |
| Saipa Shahin 1.5T 2022 GLX | `research/shahin.md` | 0.860 / 0.950 m | **estimated split** | Overhang sum is fixed by the published length and wheelbase; the split is a class analogue of the Tara (published 885/982). Saipa handbook gives 4,446 × 1,771 × 1,490 mm; the simulation uses 4,460 × 1,500 (difference < 1 %). |
| Toyota Prado 150 4.0 V6 2021 TX-L | `research/prado-150.md` | 0.870 / 1.100 m | estimated for the simulation length | Toyota's 5-door body is 4,825 mm without the spare carrier and 5,010 mm with it; the repo simulates 4,760 mm. Overhangs are normalised so wheels, body and collider agree. |
| BMW 320i G20 2021 Sport Line | `research/bmw-320i-g20.md` | 0.870 / 0.988 m | **published split inferred, ±35 mm** | 4,709 / 2,851 / 1,435 mm confirmed. Front overhang is inferred (BMW does not publish it); rear is the remainder. Beltline 1,020 mm, 18" style 780 wheels, 225/45 R18. |
| Peugeot 206 1.4 2008 Type 2 | `research/peugeot-206.md` | 0.712 / 0.678 m | **rear published, front derived** | IKCO sheet gives 680 mm rear overhang; the front closes the 3,835 mm length. 2,443 mm wheelbase (repo stores 2,445). |
| IKCO Tara 1.6 2023 automatic | `research/tara.md` | 0.878 / 0.975 m | **both published** | Owner's manual gives 885 / 982 mm for a 4,519 mm body; scaled to the repo's 4,505 mm. Best-anchored car in the batch. |
| Renault Tondar 90 2014 E2 | `research/tondar-90.md` | 0.777 / 0.843 m | **both published** | Renault Pars sheet; sums to 4,250 mm exactly. |
| Toyota Corolla E210 1.6 2020 XLI | `research/corolla-e210.md` | 0.935 / 0.995 m | **both published** | Toyota UK technical data; sums to 4,630 mm exactly. |
| Mazda MX-5 ND 2.0 2019 | `research/mx5-nd.md` | 0.785 / 0.820 m | estimated split, ±40 mm | Mazda does not publish overhangs; the split follows the ND's short-nose layout and closes 3,915 mm. |

## Cross-checks that changed the art

- **Beltline heights.** The research files express `v` from a sill roughly
  0.14–0.40 m above the ground. The renderer anchors `v = 0` at the tyre contact
  plus 35 mm, so every beltline was converted before use
  (`v = (z − 0.035) / (heightM − 0.04)`). This moved the windows up by 0.03–0.06
  and is the main reason the greenhouses now read correctly.
- **Cabin landmarks.** Screen base, roof front, roof rear and rear-glass base are
  taken from each research file (e.g. BMW screen base +0.245 L, roof front
  +0.115 L, rear glass −0.315 L). Earlier blueprints had the windscreen too far
  back on every car.
- **Prado length.** The published 5,010 mm includes the spare-wheel carrier. The
  art is normalised to the simulated 4,760 mm; the 4,825 mm five-door figure
  without the carrier is the closest true body length. Recorded as a limitation,
  not hidden.
- **Shahin length/height.** Repo values (4,460 × 1,500) are within 1 % of the
  Saipa handbook (4,446 × 1,490). Left unchanged to avoid touching physics data.

## What is not claimed

- No manufacturer logo, badge or wordmark is reproduced.
- No press photograph, brochure image or third-party sprite is shipped.
- No measurement is presented as factory data when the research marked it
  estimated.
- Commercial trademark/design clearance has **not** been obtained.
