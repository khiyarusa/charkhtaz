# چرخ‌تاز · CHARKHTAZ

**RACE • SHIFT • CONQUER**

Persian-first, 2D side-view physics racing & obstacle-trial game for Android and Web.

> **وضعیت:** 🔨 در حال ساخت — داربست اولیهٔ پروژه
> **Status:** Work in progress — initial scaffold. This is not a finished game yet.
> The complete V1 specification lives in [`docs/SPEC-V1.md`](docs/SPEC-V1.md).

## What CHARKHTAZ is

- A **true 2D rigid-body** racing game: chassis, wheels, suspension, clutch, gearbox and tire traction are simulated — not animated along a curve.
- **Persian-first UI**: genuine RTL, bundled Vazirmatn fonts, Persian HUD and menus.
- **Signature controls**: three vertical analogue sliders — گاز (throttle), ترمز (brake), کلاچ (clutch) — multi-touch, continuous 0–1 input feeding the actual simulation.
- **Real vehicles**: real production models with researched year/trim data (`docs/research/vehicle-data.md`) and faithful side profiles.
- **Iranian-inspired routes**: mountain, desert and forest/mud environments.
- **Offline-first**: no runtime CDN, no account, no ads in V1.

## Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript (strict) |
| Build | Vite |
| Physics | Planck.js (2D rigid body) |
| Renderer | under evaluation (Phaser AE vs Phaser 4) → `docs/research/engine-decision.md` |
| Tests | Vitest |
| App packaging | Capacitor → Android |
| CI/CD | GitHub Actions |

## Development

```bash
npm install
npm run dev        # dev server
npm test           # unit tests (physics, controls, save)
npm run build      # type-check + production build
```

## Repository layout

Module ownership is defined in [`AGENTS.md`](AGENTS.md). In brief:
`src/core`, `src/physics`, `src/vehicles`, `src/controls`, `src/tracks`,
`src/obstacles`, `src/racing`, `src/career`, `src/ui`, `src/audio`,
`src/assets`, `src/save`, `public/assets/*`, `docs/*`.

## License

All rights reserved for now. Code and asset licensing will be decided and
documented in `ASSET_LICENSES.md` / `THIRD_PARTY_NOTICES.md` before any
public release.

## Brand note

«چرخ‌تاز» and «CHARKHTAZ» are working brand names. Trademark, app-store
name and domain clearance must be verified before commercial release.
