# Skills, agents and tools actually used · v0.2.0

This page records what was used for the v0.2.0 overhaul. A skill named without an
artefact is not proof of use, so each row points at the evidence.

## Tools

| Tool | Use | Evidence |
| --- | --- | --- |
| Shell + ripgrep + Node | repository audit, build, tests | `dist/`, test output |
| Playwright (Edge/Chromium) | live UI capture, multi-touch via CDP, frame pacing, ghost recording | `tools/qa.mjs`, `tools/ghost-shot.mjs`, `docs/visual-qa/v0.2.0/report.json` |
| Playwright + inline SVG | brand rendering at 512/96/32 px and icon export | `tools/render-svg.mjs`, `tools/brand-icons.mjs`, `docs/visual-qa/brand/*.png` |
| Image inspection (vision) | reviewed every screenshot and the brand at multiple sizes; two emblem concepts were rejected | `docs/QA-VISUAL.md` |
| Vitest | 77 behaviour tests | `src/**/*.test.ts` |

## Local skills and references applied

| Area | Practice applied | Where it shows |
| --- | --- | --- |
| Codebase audit before editing | read every module, ran baseline typecheck/tests, recorded the failing/working set | this session's baseline; `QA-REGRESSION.md` |
| Behaviour-first tests | tests assert physics outcomes, not function existence (drop settling, shift speed, refunds, route completion) | `render-interpolation.test.ts`, `completion.test.ts`, `roster.test.ts` |
| Design system discipline | one panel language, tokens in `styles.css`, no per-screen bespoke styles | `src/ui/styles.css`, `overhaul.css` |
| Brand system | emblem family, lockups, variants, icon sizes, embedded font for correct shaping | `ART_BIBLE.md`, `public/brand/` |
| Game-feel iteration | capture → inspect → fix → recapture, with defects logged and closed | `QA-VISUAL.md` |
| 2D physics debugging | reproduce with a headless simulation, read numbers, change one variable at a time | suspension, shift schedule and obstacle-height fixes |
| Documentation honesty | claims tied to a test, a measurement or a screenshot; limits written down | `REQUIREMENT-CLOSURE.md` |

## Agent cluster

No external agent cluster was available in this environment. The work was done by
a single integrator with two narrow, independent review passes (visual and
language). Where a specialist would have been used, the equivalent evidence was
produced directly:

| Recommended role | What happened here |
| --- | --- |
| Vehicle art specialist | parametric per-model art was implemented and reviewed by screenshot |
| Environment/FX artist | biome and surface passes implemented in the renderer |
| Simulation engineer | dedicated headless probes for suspension, shifting and route completion |
| UI/Persian editor | full string inventory reviewed; guide updated; native-speaker sign-off still pending |
| Gameplay engineer | upgrades, economy, AI, ghost, career, trials |
| Audio engineer | procedural graph with unit-tested parameter mapping |
| QA/release engineer | Playwright QA harness, build evidence, CI checks |

## Limitations of this record

- No Android emulator or physical device was available, so device QA is marked
  pending rather than passed.
- No external asset-generation service was used; all art is code or hand-authored
  SVG.
