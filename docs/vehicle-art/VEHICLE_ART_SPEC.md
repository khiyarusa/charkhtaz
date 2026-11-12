# VEHICLE ART SPEC — Round 3

The target is a **model-specific side elevation** for every roster car, authored
from measured proportions and drawn by one canonical renderer in every screen.
It is not a shared body template with different colours.

## 1. Coordinate system

```
u — metres along the body. 0 = body centre, +u = nose.
    The nose is at +lengthM/2, the tail at −lengthM/2.
v — fraction of body height. 0 = sill, 1 = roof.
    The renderer anchors the sill at (tyre contact + 0.035 m) and maps
    v = 1 to (heightM − 0.04 m) above the ground.
```

**Axle frame.** The chassis origin is the axle midpoint, not the body centre.
`bodyShiftM(bp) = (frontOverhang − rearOverhang) / 2` converts body coordinates
into chassis coordinates. This is what allows a 206's short rear overhang and a
Prado's long one to sit around the same physical wheelbase.

**Wheels are authoritative.** Wheel centres and angles come from the Planck wheel
bodies (`Vehicle.renderPose(alpha)`). The body is drawn around them; no art code
moves a wheel.

## 2. Layer plan

Drawn back to front, all clipped to the painted shell where appropriate:

1. contact shadow under the shell;
2. painted shell with wheel arches punched out (even-odd fill);
3. inside the shell clip: sky reflection, horizon band, ground bounce, clear-coat
   shoulder, character lines, door cuts, rocker seam, fuel flap;
4. glasshouse: lens gradient, two reflection streaks, frit, rubber/chrome frame,
   B-pillar, quarter light where the model has one;
5. boot/tailgate crease and roof highlight;
6. handles, mirror, antenna, roof rails, spoiler, cladding, side step;
7. bumpers (banded, not boxes), head and tail lamps with housings, grille, plate —
   all clipped to the shell;
8. wheel-arch liner, flare and contact shading;
9. staged damage overlay (scratches → dents → cracked glass → broken lamp →
   hanging bumper → panel deformation).

Wheels are drawn by the caller before the shell so the arch cut-outs reveal them.

## 3. Per-car proportions used

| Car | L (m) | WB (m) | H (m) | fo / ro (m) | Belt v | Wheel dia. / H |
| --- | --- | --- | --- | --- | --- | --- |
| Shahin | 4.460 | 2.650 | 1.500 | 0.860 / 0.950 | 0.68 | 0.41 |
| Prado 150 | 4.760 | 2.790 | 1.890 | 0.870 / 1.100 | 0.62 | 0.42 |
| BMW 320i | 4.709 | 2.851 | 1.435 | 0.870 / 0.988 | 0.70 | 0.46 |
| Peugeot 206 | 3.835 | 2.445 | 1.432 | 0.712 / 0.678 | 0.68 | 0.42 |
| Tara | 4.505 | 2.652 | 1.466 | 0.878 / 0.975 | 0.68 | 0.43 |
| Tondar 90 | 4.250 | 2.630 | 1.525 | 0.777 / 0.843 | 0.68 | 0.41 |
| Corolla E210 | 4.630 | 2.700 | 1.435 | 0.935 / 0.995 | 0.69 | 0.44 |
| MX-5 ND | 3.915 | 2.310 | 1.235 | 0.785 / 0.820 | 0.67 | 0.50 |

Belt v is the renderer-frame value (see the ledger for the conversion from the
research basis). Full landmark tables are in `research/*.md`.

## 4. Identity checklist (must survive at 92 px/m)

Each blueprint carries its own `identity` array; the roster test requires at
least four entries per car. The essentials:

- **Shahin** — tall glasshouse, short deck, high belt, seven-spoke 15".
- **Prado** — upright screen, long flat roof, quarter light, roof rails, cladding,
  running board, six-spoke rugged 17".
- **320i** — Hofmeister kink, long bonnet, cab-rearward stance, shoulder line,
  18" V-spoke.
- **206** — three-door hatch, near-vertical tailgate, 680 mm rear overhang, round
  headlamp, 14" five-spoke.
- **Tara** — compact sedan, chrome window surround, straight belt, 16" eight-spoke.
- **Tondar** — tall boxy saloon, long rear door, steel wheels with covers.
- **Corolla** — fastback roofline, slender C-pillar, high rear shoulder.
- **MX-5** — low roadster, long bonnet, short deck, arch blister, 17" ten-spoke.

## 5. Materials

- **Paint** — five-stop vertical gradient (roof light → base → rocker dark) plus a
  sky reflection band, a horizon band and a clear-coat shoulder catch. The paint
  colour comes from the car profile or the player's cosmetic choice; the material
  treatment is identical across the fleet.
- **Glass** — blue-grey gradient with two diagonal reflections and a dark frit.
  Not opaque black.
- **Lamps** — lens gradient with a dark housing, projector, LED signature and an
  amber indicator; the tail lamp lights up with the brake pedal.
- **Chrome** — muted grey-white, never mirror-bright; used on window surrounds,
  handles and grille frames on trims that have it.
- **Plastic** — near-black with a soft top edge, used for cladding, side steps,
  bumpers and arch trim.

## 6. Wheel rules

- Radius comes from physics; the art never resizes a wheel to fit an arch.
- Rim ratio is authored per model (0.56 steel Tondar → 0.68 MX-5), matching the
  real rim/tyre diameter ratio.
- Six rim styles: `multi`, `mesh`, `spoke`, `rugged`, `aero`, `steel`. Each car's
  spoke count and style is authored, so the fleet does not share one wheel.
- Tread blocks rotate with the simulated angle; the caliper does not.

## 7. Technical requirements

- Runs offline; no external image, font or CDN.
- One canonical definition drives garage cards, detail view, upgrade preview,
  race, opponents and ghost. No second renderer.
- No per-frame allocation of gradients where avoidable; wheel/body drawing is a
  single pass per car.
- Detail layers clipped to the shell so no element can float outside the body.
- Damage never changes the base silhouette identity.

## 8. Known limits

- This is authored **vector** illustration, not hand-painted raster sprites. It
  has a lower detail ceiling than a painted sprite family; see
  `QA_REPORT.md` for what that costs at gameplay scale.
- No 3/4 views, no perspective camera, no 3D models.
