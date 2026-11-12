# ART BIBLE · CHARKHTAZ v0.2

The brand is a **pumpkin**. It supersedes the earlier wheel-and-road mark. Every
screen, the app icon, the splash, documentation and marketing material use the
same family; no second identity ships.

## 1. The mark

The emblem is an original vector construction: a five-lobe pumpkin with a stem and
leaf, seated above a dashed road baseline, inside a graphite rounded badge.

| Property | Value |
| --- | --- |
| Badge | 512 × 512, corner radius 112, fill `#101318` |
| Inner ring | `#d9a441` at 20 % |
| Pumpkin body | vertical gradient `#ffc074 → #f0902a → #d9761a` |
| Grooves | `#b8560f` at 85 %, 8 px |
| Outline | `#101318`, 9 px |
| Stem | `#3f6b32`, leaf `#5f9247` |
| Road dashes | `#d9a441`, 12 px high, radius 6 |

Why the road baseline: it turns a vegetable silhouette into a racing mark without
adding a second object. Remove it and the mark reads as a Halloween sticker.

Legibility rules:

- At 32 px the mark must still read as a pumpkin with a stem. Grooves may
  disappear; the silhouette, stem and baseline may not.
- Never place the badge on a background within 12 % of its own value; use the
  light variant instead.
- Never recolour the pumpkin outside the palette below. Never use an emoji.

## 2. Files

| File | Use |
| --- | --- |
| `public/brand/pumpkin-emblem.svg` | primary badge (app, header, splash) |
| `public/brand/pumpkin-emblem-light.svg` | light surfaces |
| `public/brand/pumpkin-emblem-mono.svg` | single-colour, `currentColor` |
| `public/brand/logo-horizontal.svg` | emblem + Persian wordmark + Latin line |
| `public/brand/logo-horizontal-light.svg` | same on light ground |
| `public/brand/logo-stacked.svg` | stacked lockup |
| `public/brand/logo-stacked-light.svg` | stacked on light ground |
| `public/brand/pumpkin-{512,192,96,48,32}.png` | raster exports |
| `public/favicon.svg` | the badge, 64 px |

The lockups embed Vazirmatn ExtraBold as a data URI so the Persian wordmark keeps
its shaping when the file is opened outside the app. The Latin line is
letter-spaced caps (0.12 em) and always sits under the Persian word. The wordmark
is `چرخ‌تاز` — one word with a ZWNJ, never split into two spans for colour; use a
gradient clip instead (splitting breaks shaping and opens a visible gap).

## 3. Palette

| Token | Hex | Use |
| --- | --- | --- |
| graphite-900 | `#0d0f13` | page ground |
| graphite-800 | `#111419` | panels |
| graphite-700 | `#1b2027` | raised panels |
| pumpkin | `#f0902a` | brand, primary action |
| amber | `#d9a441` | accent, medals, focus |
| amber-soft | `#f0c785` | text on dark |
| ink | `#f2ede1` | primary text |
| muted | `#a9a294` | secondary text |
| danger | `#c4553f` | errors, damage |

Surface palettes live in `src/render/palettes.ts`; each biome overrides sky,
ridge and haze tones but keeps the brand colours for UI.

## 4. Vehicles

Each car is drawn from its **own** side profile and equipment block
(`CarArt.profile`, `CarArt.detail`). There is no shared body template: the
silhouette, cabin, lamps, grille, cladding and spoiler are per model.

Rules:

- Wheel centres come from the physics wheel bodies, never from a fixed offset.
  Wheels must sit inside their arches at rest, full compression, full droop and in
  the air.
- Wheel rotation is the physics angle. Tread blocks exist so rotation is visible.
- Glasshouse is derived from the roofline above the belt line, so a hatchback gets
  a tall rear screen and a roadster a short one.
- Lamps are anchored to the actual nose/tail height of the silhouette, never to a
  constant belt line (that mismatch used to leave a tail lamp floating over the
  boot).
- Damage is staged: scratches → dents → cracked screen and broken lamp → hanging
  bumper and panel deformation. No blur or dark overlay is used to hide a defect.
- Paint and rim options change the same drawing; the garage preview and the
  in-game sprite use the same function.

## 5. Environment

- Ground art and collision come from the same polyline. A decorative edge that
  disagrees with the collision surface is a bug.
- Each surface has a readable treatment: asphalt grain and lane paint, wet
  reflections, sand ripples, mud sheen and puddles, gravel stones, rock strata,
  wood planks and nails.
- Parallax layers: far ridge/skyline, mid layer, near layer, then haze. Rates
  differ by depth; no layer may scroll with the road.
- Contact shadows: a soft body shadow plus a darker patch under each tyre.

## 6. UI

- Dark graphite ground, amber accents, one rounded panel language, 14–18 px radii.
- Touch targets ≥ 44 px effective. Pedals are ≥ 64 px wide at default scale.
- Motion is short (≤ 220 ms) and never blocks input; `prefers-reduced-motion` and
  the in-app "کاهش حرکت" setting disable non-essential animation.
- Typography: Vazirmatn only. Persian digits everywhere except model names and
  technical notation.

## 7. Acceptance

A change is visually accepted only with a real screenshot at 1280 × 720 and at a
phone landscape viewport (2340 × 1080), inspected for clipping, alignment,
contact with the ground and colour consistency. "It looks fine in code" is not
acceptance.
