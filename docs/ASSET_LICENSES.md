# ASSET LICENCES · v0.2.0

Every shipped asset is listed here with its origin. Nothing in the game is ripped
from another game, a press kit or a stock library.

## Fonts

| Asset | Licence | Source |
| --- | --- | --- |
| Vazirmatn Regular / Medium / SemiBold / Bold / ExtraBold (woff2) | SIL Open Font License 1.1 | bundled from `@fontsource/vazirmatn`; licence text in `public/assets/fonts/OFL.txt` |

The fonts are served from the app bundle. No font CDN is used at runtime.

## Brand artwork

| Asset | Author | Licence |
| --- | --- | --- |
| `public/brand/pumpkin-emblem.svg` and variants | original vector work for this project | project licence (not yet chosen) |
| `public/brand/logo-horizontal*.svg`, `logo-stacked*.svg` | original, Vazirmatn embedded as a data URI | same |
| `public/brand/pumpkin-*.png`, `public/favicon.svg` | rendered from the SVG master | same |
| Android `ic_launcher*.png` | rendered from the SVG master | same |

The emblem is not traced from any existing logo, mascot or clip-art pack. The
wordmark uses the licensed font above; the letterforms remain Vazirmatn's.

## In-game artwork

All vehicle, environment, obstacle, effect and UI artwork is drawn at runtime by
`src/render/*` from data in `src/vehicles/*` and `src/tracks/*`. There are no
bitmap sprites, no traced press photographs and no manufacturer logos.

Vehicle names are factual identifiers. No endorsement is implied.

## Audio

All audio is synthesised at runtime with the Web Audio API (`src/audio/`):
oscillators, filtered noise buffers and gain envelopes generated in code. There
are no sampled recordings, no music files and no third-party sound libraries.

## Code

| Dependency | Licence |
| --- | --- |
| planck (planck.js) | MIT |
| Vite, TypeScript, Vitest, Playwright | MIT / Apache-2.0 as published by their maintainers |
| Capacitor | MIT |

No code was copied from another game. Public documentation and general techniques
(impulse solvers, slip-ratio tyre models, raycast suspension) were used as
references only.

## Reference material

Vehicle specifications were read from public pages cited in
`docs/VEHICLE_DATA_SOURCES.md` and `docs/vehicle-sources-extra.md`. References
were used for shape and dimension study only; no reference image is shipped.
