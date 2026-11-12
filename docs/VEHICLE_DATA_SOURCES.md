# Vehicle data sources

Retrieved **2026-11-12**. Every value below is either cited or explicitly marked
as an engineering estimate. Estimates are not factory data and must not be
presented as such.

## Roster index (v0.2, eight cars)

| # | Car | Year / trim | Layout, gearbox | Confidence | Detail |
| --- | --- | --- | --- | --- | --- |
| 1 | Saipa Shahin 1.5T | 2022 · GLX | FWD, 5-speed manual | high on published figures, estimates labelled | this file |
| 2 | Toyota Land Cruiser Prado 150 4.0 V6 | 2021 · TX-L | AWD, 6-speed automatic | mixed | this file |
| 3 | BMW 320i G20 | 2021 · Sport Line | RWD, 8-speed automatic | high on published figures | this file |
| 4 | Peugeot 206 1.4 | 2008 · Type 2 | FWD, 5-speed manual | high | [`vehicle-sources-extra.md`](vehicle-sources-extra.md) |
| 5 | IKCO Tara 1.6 | 2023 · automatic | FWD, 6-speed automatic | mixed (two conflicting sources recorded) | same |
| 6 | Renault Tondar 90 (L90) | 2014 · E2 | FWD, 5-speed manual | high | same |
| 7 | Toyota Corolla E210 1.6 | 2020 · XLI, CVT | FWD, CVT | mixed | same |
| 8 | Mazda MX-5 ND 2.0 | 2019 · Skyactiv-G | RWD, 6-speed manual | high | same |

**v0.2 data change:** the torque curves of the Shahin and the 320i were trimmed at
the top end (Shahin 5 500 rpm: 148 → 142 N·m; BMW 6 000 rpm: 215 → 219 N·m) so the
peak power computed from the curve matches the published figure. `roster.test.ts`
now asserts published power ±1 hp and peak torque ±2 N·m for every car, so a
future data edit cannot silently disagree with the garage.

## Selection

| Car | Why it is in the roster | Layout / gearbox |
| --- | --- | --- |
| Saipa Shahin 1.5 turbo (2022, Iran) | Iranian-market manual FWD car — the teaching car | FWD, 5-speed manual |
| Toyota Land Cruiser Prado 150 4.0 V6 (2021) | Heavy automatic 4WD — weight, grip and momentum | AWD, 6-speed automatic |
| BMW 320i G20 (2021) | Rear-drive sports sedan — traction-limited launch | RWD, 8-speed automatic |
| Peugeot 206 1.4 (2008, Iran) | Light Iranian-market hatchback — momentum discipline | FWD, 5-speed manual |
| IKCO Tara 1.6 (2023, Iran) | Iranian automatic sedan — torque-converter driving | FWD, 6-speed automatic |
| Renault Tondar 90 (2014, Iran) | Common Iranian sedan, different gearing and mass | FWD, 5-speed manual |
| Toyota Corolla E210 1.6 (2020) | International FWD automatic with a CVT | FWD, CVT |
| Mazda MX-5 ND 2.0 (2019) | Light rear-drive roadster — the handling extreme | RWD, 6-speed manual |

## Saipa Shahin

Sources:
- [Saipa Shahin — Wikipedia](https://en.wikipedia.org/wiki/Saipa_Shahin)

| Parameter | Value used | Source / confidence |
| --- | --- | --- |
| Engine | 1.5 L M15TC turbo I4, petrol | Wikipedia — **confirmed** |
| Power | 110 hp (82 kW) | Wikipedia — **confirmed** |
| Torque | 178 N·m | Wikipedia — **confirmed** |
| Gearbox | 5-speed manual | Wikipedia — **confirmed** |
| Layout | FWD | Wikipedia — **confirmed** |
| Wheelbase | 2 650 mm | Wikipedia — **confirmed** |
| Length / width / height | 4 460 / 1 768 / 1 501 mm | Wikipedia — **confirmed** |
| Curb mass | 1 290 kg | Wikipedia gives 1 260–1 330 kg; midpoint — **estimate** |
| Top speed | 190 km/h (manual) | Wikipedia — **confirmed** |
| 0–100 km/h | 11.0 s | Not published in the cited source — **engineering estimate** |
| Gear ratios, final drive | 3.545/2.05/1.36/1.03/0.82, 4.05 | Not published in the cited source — **estimate** |
| Brake torque, inertia, CdA | 2 100/1 100 N·m per axle, 2.2 kg·m², 0.68 | **Engineering estimate**, tuned to the sim |

Conflicting secondary source: some marketplace pages list 145 N·m for a
naturally aspirated variant. The M15TC turbo figure (178 N·m) is used because
the Wikipedia engine table is explicit about the turbo engine and matches the
manual gearbox in this build.

## Toyota Land Cruiser Prado 150 4.0 V6

Sources:
- [Toyota Land Cruiser Prado — Wikipedia](https://en.wikipedia.org/wiki/Toyota_Land_Cruiser_Prado)
- [Prado 2021 4.0 V6 VX1 — YallaMotor](https://ksa.yallamotor.com/tools/compare/toyota-land-cruiser-prado-2021-20486-vs-toyota-land-cruiser-prado-2018-11914)

| Parameter | Value used | Source / confidence |
| --- | --- | --- |
| Engine | 4.0 L V6 petrol | YallaMotor — **confirmed** |
| Power | 271 hp | YallaMotor / Wikipedia — **confirmed** |
| Torque | 381 N·m | YallaMotor / Wikipedia — **confirmed** |
| Gearbox | 6-speed automatic | YallaMotor — **confirmed** |
| Layout | Full-time 4WD | YallaMotor — **confirmed** |
| 0–100 km/h | 9.9 s | Toyota quotes 9.9 s for the 2.8 diesel; the petrol figure is close but **not confirmed** for this exact trim — **estimate** |
| Mass | 2 450 kg | **Estimate** for a 4.0 V6 Prado; exact kerb mass depends on trim |
| Top speed | 175 km/h | **Estimate** (governed); YallaMotor lists 200 km/h for a regional trim |
| Wheelbase / L / W / H | 2 790 / 4 760 / 1 890 / 1 890 mm | Wikipedia — **confirmed** (rounded) |
| Gear ratios, final drive | 3.52 … 0.586, 3.909 | **Estimate** from published Toyota ratios for the 6-speed |
| Brake torque, inertia, CdA | 5 200/3 400 N·m per axle, 5.4 kg·m², 1.32 | **Engineering estimate** |

## BMW 320i G20

Sources:
- [BMW 3 Series (G20) — Wikipedia](https://en.wikipedia.org/wiki/BMW_3_Series_(G20))

| Parameter | Value used | Source / confidence |
| --- | --- | --- |
| Engine | 2.0 L B48 turbo I4 | Wikipedia — **confirmed** |
| Power | 184 hp at 5 000–6 500 rpm | Wikipedia — **confirmed** |
| Torque | 300 N·m at 1 350–4 000 rpm | Wikipedia — **confirmed** |
| Gearbox | 8-speed automatic (ZF 8HP) | Wikipedia — **confirmed** |
| Layout | RWD | Wikipedia — **confirmed** |
| 0–100 km/h | 7.2 s | Wikipedia table — **confirmed** |
| Wheelbase / L / W / H | 2 851 / 4 709 / 1 827 / 1 442 mm | Wikipedia — **confirmed** |
| Top speed | 240 km/h | BMW published figure for the 320i; **confidence medium** (governed) |
| Mass | 1 545 kg | Within Wikipedia's 1 450–1 965 kg range; exact 320i kerb mass **estimate** |
| Gear ratios, final drive | 5.25 … 0.64, 3.08 | **Estimate** from ZF 8HP ratios |
| Brake torque, inertia, CdA | 2 950/1 750 N·m per axle, 2.8 kg·m², 0.60 | **Engineering estimate** |

## What is deliberately not claimed

- No manufacturer logos, badges or wordmarks are reproduced. Cars are identified
  by factual model names only.
- No lap times, power figures or 0–100 values are presented as manufacturer
  confirmation unless the source column says **confirmed**.
- Commercial release requires trademark and design clearance; that review has
  not been performed.
- The vehicle silhouettes are original procedural 2D art, not traced copies of
  copyrighted press images.
