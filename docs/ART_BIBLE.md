# Art bible — CHARKHTAZ

## 1. Brand

**چرخ‌تاز / CHARKHTAZ** — a confident, mechanical, Iranian-rooted racing brand.
The name is a working brand: trademark, store name and commercial clearance are
**not** verified and must be reviewed before any commercial release.

- Persian wordmark: «چرخ‌تاز» set in Vazirmatn ExtraBold, never rasterised text.
- Latin lockup: `CHARKHTAZ · RACE · SHIFT · CONQUER` with wide tracking.
- Motif: wheel + road dashes, drawn geometrically. The favicon and launcher mark
  use the same circle-and-spokes construction.
- Voice: precise, dry, confident. No exclamation-mark marketing copy.

## 2. Palette

| Token | Hex | Use |
| --- | --- | --- |
| graphite | `#0d0f13` | page background |
| panel | `#171b21` | cards, HUD plates |
| ink | `#f2efe6` | primary text |
| muted | `#98a0aa` | secondary text |
| amber | `#d9a441` | accent, primary action, throttle |
| red | `#b6462f` | brake, danger, taillights |
| green | `#2f7d5b` | clutch, start banner |
| asphalt | `#3c4045` | road body |
| sand | `#c9a06a` | desert ground |
| mud | `#3f3224` | forest ground |

Biome palettes live in `src/render/palettes.ts`; they are the only place raw
scene colours should be added.

## 3. Camera and scale

- Strict side elevation. No perspective, no 3/4 views, no 3D.
- Cars are drawn from the same side and the same scale in menus and gameplay.
- World is metres; the renderer picks **34–68 px/m** from viewport height
  (≈ 12.5 m visible vertically on a 720 px landscape screen).
- Camera looks slightly ahead of the car (up to 9 m) and zooms out ~12 % at top
  speed. Cars sit around 56 % of screen height.
- Parallax layers: skyline/ridges 0.10–0.26, treeline 0.32, near scenery 0.48.
  The road is the only layer at 1.0.

## 4. Vehicle art rules

- Wheel centres are **physical**: the renderer reads the wheel body positions and
  draws each wheel there, then cuts matching arches out of the shell with an
  even-odd fill. Wheels can never float or drift from the chassis.
- Body silhouette is built from a per-kind profile (`sedan`, `suv`, `sport`) in
  normalised `u` (length) and `v` (sill → roof) coordinates. Proportions come
  from the real car's length/height/wheelbase, not from a generic template.
- Layers: paint gradient, shoulder highlight, glass with pillar, door seams,
  handles, mirror, head/tail lights, grille, plate, bumper, fender flare,
  running board, roof rails. No manufacturer logos.
- Wheels: tyre → brake disc → rim → spokes → hub. Rotation is the simulated
  wheel angle, so a spinning wheel reads correctly in a screenshot.
- Palette per car comes from `CarArt` so a new car only needs data, not code.

## 5. Environment rules

- Terrain is drawn from the **same polyline** that Planck collides with; there
  are no invisible walls and no decorative ground that differs from collision.
- Surface identity is readable at a glance: asphalt has lane dashes, sand has
  ripples, mud has dark puddles, gravel/dirt have speckle, rock has grain.
- Delineator posts every 18 m give a constant speed cue; checkpoints are amber
  flags; start and finish are gantries with Persian text.
- Props are deterministic (`hash01`) so a screenshot is reproducible.

## 6. UI rules

- Genuine RTL (`dir="rtl"`), Vazirmatn bundled locally in five weights.
- Persian digits everywhere; Latin only for units/model names.
- Minimum touch target 44 px; the three pedal sliders are 74 × 230 px by default
  and scale 0.75–1.35.
- HUD hierarchy: timer top centre, pause top corner, speed + gear bottom left,
  pedals bottom right (switchable handedness), gear selector bottom centre.
- No text baked into images; every label is real DOM or canvas text with the
  bundled font.

## 7. Asset status (honest)

| Asset family | Status |
| --- | --- |
| Logo / favicon | Geometric SVG mark — done |
| Cars | Procedural layered 2D art — playable, silhouette still approximate |
| Terrain / parallax | Procedural — done for 4 biomes |
| Obstacles | Procedural rock, log, tyre stack, plank, concrete — done |
| Particles | Dust, smoke, mud, sparks — done |
| UI | Persian RTL design system — done |
| Audio | **Not implemented** |
| Raster/atlas art pipeline | **Not implemented** — no external sprites are shipped |

Any future raster asset must be original or licensed for redistribution, with
provenance recorded in `ASSET_LICENSES.md`. Copyrighted press photos may be used
as internal reference only, never committed or shipped.

## 8. Acceptance criteria

A car asset is acceptable when:

1. wheelbase, overall length and height match the data sheet within 3 %;
2. wheels sit in their arches at rest and through full suspension travel;
3. the silhouette is identifiable as the correct body style in a 250 px-wide
   screenshot;
4. palette, outline weight and lighting match the rest of the fleet;
5. it renders at 60 fps on the target device with the full scene.
