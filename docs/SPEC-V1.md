# CHARKHTAZ — AUTONOMOUS MASTER BUILD, VISUAL QA & ANDROID RELEASE PROMPT

**Product:** چرخ‌تاز / CHARKHTAZ  
**Tagline:** RACE • SHIFT • CONQUER  
**Target:** A polished Persian-first Android 2D physics racing and obstacle-trial game  
**Primary coding model:** GLM-5.3-Flash  
**Execution:** Autonomous implementation, asset production, real-runtime visual QA, iterative correction, GitHub CI/CD, Android build and release

---

## 0. MISSION — EXECUTE, DO NOT MERELY PLAN

You are the autonomous lead of a professional 2D game studio. Build and ship a complete, cohesive, playable first release of **CHARKHTAZ (چرخ‌تاز)**. Do not deliver only a plan, prototype, scaffold, mockup, menu, or technical demo. Implement the complete V1 scope in this document, run it, inspect real screenshots, fix defects, test the Android package, push the finished work to the exact GitHub repository supplied by the user, build Android artifacts through GitHub Actions, and publish an accurately labelled GitHub Release when release gates pass.

### Canonical repository — critical

The user will send the new GitHub repository URL in the message immediately before this prompt. Extract and use that exact URL. Do not ask for it again. Verify owner, repository name, remote, branch, permissions, and authentication before making changes.

**CHARKHTAZ is a new, independent project.** Never modify, delete, rename, migrate over, or reuse the previous `khiyarusa/farman` project or its local folder. Do not use its 3D code, assets, build outputs, repository history, or branding. The old project must remain untouched. If the supplied URL is missing, is the old FARMAN repository, or otherwise cannot be confirmed as the new independent CHARKHTAZ repository, stop before any write/push and report the exact issue. If the new repository is empty, initialize it there. If it already contains CHARKHTAZ work, inspect and preserve it.

Use the exact repository. Do not create a substitute repository or silently change the remote. Do not force-push, rewrite shared history, delete branches/tags, or bypass branch protections. Use a safe feature branch if appropriate, make focused commits, push regular milestones, and preserve the default branch conventions.

The user authorizes normal project work, local builds, commits, pushes, GitHub Actions, screenshot uploads, and releases. Never reveal, print, commit, or upload tokens, secrets, private keys, keystores, passwords, `.env` files, personal data, or unrelated local files. Never spend money, buy credits, subscribe to tools, or bypass paywalls without explicit authorization. Prefer excellent free/open-source tools and legally usable assets; do not lower quality merely to save effort.

**Do not stop after planning.** Make reasonable decisions autonomously, document assumptions, and continue through full V1 delivery. Ask only if blocked by missing repository access, unavailable credentials, a genuinely irreversible action, a paid purchase, or an unresolved legal permission. Never claim success without verification.

---

## 1. PRODUCT IDENTITY AND DESIGN LOCK

### 1.1 Identity

- Persian title: **چرخ‌تاز**
- Latin title: **CHARKHTAZ**
- Working tagline: **RACE • SHIFT • CONQUER**
- Brand character: confident, mechanical, fast, precise, premium, Iranian-rooted.
- Suggested visual palette: deep graphite, asphalt charcoal, warm metal, off-white, and one restrained amber or racing-red accent. Establish a complete brand system, not random colors.
- Create an original, legible logo and Android icon. A wheel/road/motion motif or a custom Persian «چ»/«ت» mark may be explored. Do not use generated text baked into raster imagery; render actual Persian text through the UI system.
- The name is a working brand; document that trademark, app-store name, domain, and commercial clearance must be verified before commercial release.

### 1.2 Game definition

CHARKHTAZ is a **2D side-view physics racing and obstacle-trial game**. It uses real 2D rigid-body simulation and detailed 2D illustrated assets. The visual presentation may have depth through layered parallax, atmospheric perspective, lighting, shadows, particles, and carefully composed backgrounds. It is **not a 3D game** and must not drift back into 3D modeling, 3D vehicles, or 3D physics.

Core fantasy: the player wins through driving skill. Throttle control, braking, clutch timing, gear selection, traction, suspension, engine RPM, and vehicle setup matter. Each car must have a mechanically distinct character.

### 1.3 Locked product decisions

- Platform: Android first; Web preview/build for development and automation.
- Packaging: Web game → Capacitor Android → APK/AAB via GitHub Actions.
- Game logic and visuals: truly 2D.
- Camera: side-on / side-scrolling; vehicles and track are viewed from the side.
- Presentation: high-detail realistic/semi-realistic 2D illustration, not pixel art, not toy-like cartoon art, not primitive vector cars.
- Language: Persian by default, real RTL throughout.
- Font: bundle Vazirmatn locally, including the needed weights; no runtime font CDN.
- Modes: Career, Quick Race, Time Trial with Ghost, Obstacle Trials, and Practice.
- Offline-first: all core play must work without internet.
- World: curated Iranian-inspired regions, not a giant empty open world.
- Vehicles: real production car names, years, trims, silhouettes, and verified technical profiles; include Iranian-market vehicles and international vehicles.
- Controls: three prominent, independently draggable **vertical analogue sliders** for accelerator, brake, and (manual cars only) clutch. These are mandatory core controls, never replace them with ordinary tap buttons.
- Scope: complete and polished V1, with no placeholder systems represented as finished.

### 1.4 Core game loop

Choose a car → select a mode and track → race or solve a physical obstacle route → earn a result/reward → unlock or improve cars/parts → tune vehicle → race again.

Keep progression rewarding but fair. No forced ads, pay-to-win, loot boxes, mandatory accounts, or online dependency in V1.

---

## 2. V1 CONTENT — COMPLETE BUT CONTROLLED SCOPE

Deliver a cohesive V1 containing at least:

- 3 genuinely distinct real-world vehicles with accurate names, year/trim selection, faithful side profiles, and separate technical profiles. Include at least one Iranian-market manual FWD car, one international automatic car, and one technically distinct car (e.g. RWD or a different transmission/drivetrain). Research exact variants; do not guess.
- 3 visually distinct Iranian-inspired environments/biomes (for example: mountain/rock, desert/sand, and forest/mud or a carefully chosen urban-industrial route).
- At least 6 complete, replayable tracks/challenges with start, finish, checkpoints, collision boundaries, route metrics, and tested physics.
- At least 8 meaningful obstacle/surface types: rocks, steep slopes, gaps, ramps, moving/unstable bridges, logs, mud, sand, loose gravel, breakable/shiftable objects, or equivalent. Each must have real collision/gameplay behavior; decorative-only obstacles do not count.
- Career progression, Quick Race, Time Trial/Ghost, Obstacle Trials, and Practice.
- At least 2 AI opponents in suitable race events. Opponents must follow the actual track and obey coherent vehicle/traction limits. No teleporting, impossible speed boosts, or hidden rubber-banding.
- A complete garage, vehicle selection/specification panel, tuning/service interface, race results, settings, tutorial, pause, save/load, and Persian HUD.
- Original or properly licensed sound for engines, tires, impacts, UI, and environment.
- A complete local save system with versioned migration and safe recovery.
- Android installable build, GitHub CI, real runtime screenshots, visual QA report, and release evidence.

A smaller amount of excellent content is better than many broken cars/tracks, but the minimum above is the V1 delivery target, not permission to stop early. Never use placeholder cars, placeholder buttons, empty menu pages, fake AI opponents, or non-functional upgrades in the final release.

---

## 3. NON-NEGOTIABLE CONTROL DESIGN — THREE VERTICAL SLIDERS

The accelerator, brake, and clutch controls are a signature part of CHARKHTAZ. They must feel precise, smooth, responsive, tactile, and comfortable on a landscape phone. **Do not replace them with tap buttons, binary keys, or a single combined control.**

### 3.1 Slider interaction contract

Implement three separate vertical drag controls with continuous floating-point values from 0.0 to 1.0. They must support multi-touch with independent pointer IDs and pointer capture. A finger controlling the throttle must not interfere with the brake or clutch pointer.

- Moving a slider thumb **upward increases that pedal's input**.
- Moving it downward decreases the input.
- Show the physical slider travel, thumb, fill level, label, and current percentage clearly.
- Provide configurable size, position, opacity, sensitivity, handedness, and layout presets.
- The controls must not block the gameplay view unnecessarily.
- Handle touch cancellation, focus loss, Android pause/resume, and pointer release safely.
- Use deterministic, smooth input filtering without adding noticeable lag.
- Provide a deliberate spring-return behavior when the finger is released. The return curve/rate must be configurable and part of the simulation input, not just a visual tween. Do not leave throttle or brake stuck after a touch is lost.
- Allow a configurable clutch release profile so the player can learn controlled engagement; an abrupt release must remain possible and must have physically derived consequences.
- Support left- and right-handed layouts and test actual multi-touch on Android.

### 3.2 Accelerator slider

- Bottom = 0% throttle; top = 100% throttle.
- The slider directly drives a continuous throttle demand, not a binary state.
- A fast upward drag creates a fast throttle ramp. Engine torque follows the engine's throttle response and current RPM/load.
- On a suitable high-grip surface, full throttle may produce strong acceleration without artificial wheelspin.
- On low grip, in a low gear, with high torque, the driven wheels may exceed available traction and spin. Show wheel speed/slip, dust/smoke where appropriate, and a measurable effect on acceleration.
- Manual cars may raise engine RPM while the clutch is disengaged. Releasing the clutch with high RPM can create wheelspin, driveline shock, or engine stall depending on gear, speed, load, and grip.
- Do not arbitrarily damage an engine merely because throttle was raised quickly.

### 3.3 Brake slider

- Bottom = 0% brake; top = 100% brake.
- It controls continuous service-brake demand.
- A rapid move to high brake demand causes a correspondingly strong braking request and physically plausible longitudinal weight transfer/body pitch.
- Whether a wheel locks depends on tire grip, load, surface, brake capability, and the vehicle's ABS configuration.
- If ABS is equipped and enabled, implement a credible wheel-slip modulation/anti-lock effect; without ABS, lockup/skid can occur when limits are exceeded.
- Hard braking on gravel, sand, or wet surfaces must differ from dry asphalt.
- Brake heating/fade may be included only if the model is implemented and tested. Do not invent damage for every hard brake event.

### 3.4 Clutch slider — manual vehicles only

- Bottom = 0% pedal depression: clutch released / fully engaged.
- Top = 100% pedal depression: clutch pedal fully pressed / drivetrain disengaged.
- The clutch slider is continuous. Implement a clutch engagement curve/bite point, not a simple on/off switch.
- Moving up rapidly disengages the clutch and interrupts engine-to-wheel torque; this also reduces engine braking and changes engine load/RPM behavior.
- Moving down engages the clutch. The rate of downward movement is critical: gradual engagement allows controlled launch; abrupt release under high RPM/low gear/high load may cause torque shock, wheelspin, or stall as physically determined.
- Touch release triggers the configured clutch spring-return curve. A fast return is a real rapid clutch engagement in the simulation, not an animation-only effect.
- Gear selection in manual mode must require sufficient clutch disengagement or produce a documented, plausible refusal/shift penalty if a synchronized/manual system is modeled. Do not silently shift gears without clutch merely because a button was tapped.
- Provide an optional beginner assist that helps launch/anti-stall without replacing the true manual simulation. Label it clearly and allow it to be disabled.

### 3.5 Automatic vehicles

- Hide/disable the clutch slider for true automatic/CVT/DCT vehicles; do not pretend an automatic car has a manual clutch pedal.
- Show the correct transmission selector and mode for the exact car.
- Full throttle may cause kickdown, ratio changes, engine RPM response, and wheelspin according to the selected transmission and traction.
- CVT must not behave like a stepped automatic unless that exact model has simulated steps.

### 3.6 Control verification

Create automated and manual test scenarios for:

1. Throttle held at 20%, 50%, and 100%.
2. A fast throttle ramp on dry high-grip ground.
3. A fast throttle ramp on loose/wet low-grip ground.
4. Brake held at 20%, 50%, and 100%.
5. Emergency brake input with ABS and without ABS.
6. Clutch held fully depressed while shifting.
7. Slow clutch engagement at correct RPM.
8. Abrupt clutch release at low RPM/high load.
9. Abrupt clutch release at high RPM/low gear.
10. Simultaneous multi-touch on all three sliders.
11. Pointer cancellation and app background/resume.
12. Slider use with both handedness layouts.

Record input values and rates of change. Consequences must emerge from engine, transmission, wheel, tire, surface, and body physics—not scripted “punishment” timers.

---

## 4. VEHICLES — REAL NAMES, FAITHFUL 2D SHAPES, VERIFIED DATA

### 4.1 Real production vehicles only

Use actual production model names and exact year/trim/market variants. Include well-known Iranian-market cars and internationally recognized vehicles. Do not create fake names such as “Sport X” and present them as real vehicles. Do not mix specifications between years/trims.

Research each selected vehicle from credible sources: manufacturer brochures/spec sheets, official technical documents, reputable automotive databases, and multiple corroborating sources where possible. Record source URLs, retrieval date, year/trim match, and confidence in `docs/VEHICLE_DATA_SOURCES.md`.

At minimum verify:

- Engine displacement/configuration and fuel/aspiration where relevant.
- Power and torque, including RPM points if available.
- Gearbox type and exact gear ratios where reliably published.
- Final drive if available.
- Drivetrain layout.
- Curb mass and approximate axle weight distribution if available.
- Wheelbase, track, tire/wheel size, and approximate dimensions.
- Brakes and driver aids where relevant.

Use defensible estimates only when exact data is unavailable. Mark each estimated value and explain the method. Never invent specifications or state that an estimate is factory-confirmed.

### 4.2 Visual accuracy

Each vehicle must be recognizable as the exact real model and generation. Use accurate side-profile references from consistent viewpoints. Match silhouette, wheelbase, roofline, hood/trunk, greenhouse/windows, wheel arches, bumpers, lights, mirrors, door cut-lines, handles, trim, and wheel position. A generic rounded car silhouette with a label is unacceptable.

Use an **orthographic side elevation / true side-on profile** for the in-game vehicle sprites. The camera angle must be consistent across the fleet so vehicles can race together. Create high-resolution source art with transparent background, then optimize runtime assets.

Build vehicles as separate layers/assets:

- Main body shell (with correctly shaped wheel openings).
- Front wheel and rear wheel sprites, independently rotated by physics.
- Optional hub/brake details.
- Windows/glass highlights if separate layering improves quality.
- Lights and indicators where relevant.
- Shadow/contact shadow.
- Optional body damage variants and dust/mud overlays.
- Separate suspension elements only if they can be rendered coherently.

Define physical wheel centers, sprite pivot points, scale, body origin, and collision shapes from a measured asset manifest. The visual wheel centers must align with the physical wheel bodies at rest and under suspension travel. No floating wheels, wrong scale, sprite jitter, visible seams, or body/wheel misalignment.

### 4.3 Licensing and trademarks

Internet research and reference images may be used to understand proportions and specifications. Do **not** rip, scrape, copy, or redistribute copyrighted game sprites, commercial 3D models, paid textures, watermarked images, or assets whose license does not permit the intended use. Use original commissioned/AI-generated artwork, public-domain assets, or assets with explicit compatible redistribution rights. Record all provenance and license terms.

Real model names may be used as factual vehicle identifiers subject to legal review. Do not reproduce official manufacturer logos, badges, wordmarks, or imply manufacturer endorsement unless permission/license is verified. If an accurate body design or brand mark raises unresolved legal concerns, retain factual model data for internal simulation and flag commercial release clearance; do not fabricate a license.

---

## 5. VEHICLE PHYSICS — TRUE 2D RIGID-BODY SIMULATION

Do not animate a car sprite along a curve and call it physics. The chassis, front/rear wheels, suspension, contact, collisions, and obstacles must be represented in the 2D physics world.

### 5.1 Physics model

Preferred foundation: **Planck.js 1.5.x** (package name `planck`, MIT, TypeScript declarations). Verify the exact version and API against the installed package and official documentation before coding. Use Planck for rigid bodies, contacts, joints, collision queries, and a stable fixed-step 2D world.

Use two independently simulated wheel bodies attached to the chassis using appropriate WheelJoints or a measured custom suspension constraint. Verify spring frequency/damping, travel, limits, anchors, and torque behavior using the exact installed API. Do not assume a WheelJoint alone implements the entire tire/powertrain simulation.

Add a custom vehicle dynamics layer for:

- Engine angular speed and torque curve.
- Clutch slip and engagement/bite point.
- Gearbox ratios, neutral, reverse, and shift logic.
- Differential/drivetrain torque delivery.
- Wheel rotational inertia and angular speed.
- Tire longitudinal slip and friction-limited contact force.
- Rolling resistance and engine braking.
- Brake torque and optional ABS.
- Suspension tuning per axle.
- Chassis weight transfer/pitch behavior within a 2D model.

Use one coherent physics authority. Do not apply motor force twice (for example, once through a joint motor and again through a custom force). Document exactly how torque reaches each driven wheel and how tire contact transfers force to the chassis.

### 5.2 Important 2D limitation

This is a side-view 2D game. It can simulate longitudinal acceleration/braking, wheel rotation, suspension travel, ground contact, slopes, jumps, landing, traction, and pitch/roll in the image plane. It cannot reproduce real 3D lateral cornering, steering into/out of the screen, full yaw dynamics, or all four independent tire contact patches. Do not claim it does. Use the game's obstacle/racing design to focus on the dimensions a side-view game can represent honestly.

### 5.3 Physics implementation requirements

- Fixed time step (target 60 Hz; benchmark 120 Hz only if stable/performance permits).
- Accumulator-based simulation and render interpolation.
- Bounded catch-up steps to avoid spiral-of-death after frame stalls.
- Explicit world-unit scale (meters) and pixel conversion.
- Consistent gravity, collision filtering, restitution, friction, damping, and solver settings.
- CCD or sub-stepping for fast wheels/vehicle collisions where needed.
- Stable chassis mass/inertia/center of mass.
- No arbitrary per-frame force scaling dependent on FPS.
- Deterministic seeded track/AI scenarios where practical.
- Debug overlay for RPM, gear, throttle, brake, clutch, clutch slip, wheel angular velocity, tire slip, contact normal/force, suspension travel, chassis velocity, and collision state.
- No non-finite physics state, exploding joints, tunneling through common obstacles, or unbounded force accumulation.

### 5.4 Transmission behavior

**Manual:** true clutch coupling, neutral, reverse, gear ratios, RPM changes, shift timing, engine braking, stall conditions, and plausible rev-matching consequences. A gear change should require clutch operation in the intended control mode. An incorrectly timed downshift can over-rev the engine if vehicle/gear speed demands it; do not create arbitrary failures.

**Torque-converter automatic:** torque converter coupling/slip and load/speed/throttle-based shifts where applicable.

**CVT:** continuous ratio adjustment and engine RPM strategy, not fake stepped shifting unless supported by the exact model.

**DCT:** gear/clutch behavior and shift delay appropriate to the exact profile, only to the level that can be implemented and tested honestly.

### 5.5 Surface model

At minimum provide separate friction/rolling-resistance behavior for:

- Dry asphalt.
- Wet asphalt.
- Packed dirt.
- Loose gravel.
- Sand.
- Mud.
- Rock/uneven ground.

Each surface must visibly differ and affect wheel slip, acceleration, braking, and obstacle traversal. Avoid arbitrary friction values without testing; expose tunable data and record tuning rationale.

### 5.6 Damage and recovery

Implement a focused, credible V1 damage model: collision severity, chassis impact response, visual damage where available, tire/vehicle condition, and recovery/respawn with a time penalty. Add mechanical wear only when causal and testable. Never destroy the engine simply because a slider moved quickly. A restart/recovery option must prevent soft-locks and let the player continue.

---

## 6. GAME MODES, TRACKS, AND OPPONENTS

### 6.1 Modes

1. **Career:** structured progression across regions and events, unlocks, rewards, vehicle ownership, and performance goals.
2. **Quick Race:** choose vehicle, track, difficulty, opponent count, and start.
3. **Time Trial:** exact timing, checkpoints, best lap/run, and a Ghost replay of the player's previous best.
4. **Obstacle Trials:** precision-focused physical courses; balance, traction, clutch, throttle, braking, and landing are scored.
5. **Practice:** free driving on unlocked test routes with no forced timer.

### 6.2 Tracks and Iranian identity

Build a curated set of Iranian-inspired environments. Do not use generic fantasy roads. Use plausible terrain, vegetation, architecture, road materials, roadside props, Persian signs/typography, and color palettes:

- Mountain/rock route: steep climbs, descents, rocks, uneven ground, bridges, and slopes represented in the side profile.
- Desert route: sand, dunes, gravel, dips, long jumps, and heat atmosphere.
- Forest/mud route: mud, wet surfaces, logs, roots, rough terrain, and mist if performance permits.
- Optional urban/industrial route if it adds meaningful racing variety.

These are inspired environments, not claims of exact geographic mapping unless sourced. Keep a consistent fictionalized route identity with Iranian cultural/architectural cues.

### 6.3 Track data

Create tracks from reusable data-driven segments/curves and obstacle definitions. Support checkpoints, start/finish, collision geometry, surface zones, camera bounds, spawn points, AI racing line, and reset points. Track art and collision must match precisely. No invisible unfair collision walls or visual gaps that do not match the physics surface.

### 6.4 AI opponents

AI racers must use the same underlying vehicle physics and powertrain constraints. Their controller may automate pedal/gear/clutch inputs, but it cannot teleport, ignore grip, exceed the vehicle's actual performance without a documented difficulty tuning rule, or pass through obstacles. Implement a track-following controller with look-ahead, speed targets, braking points, slope/obstacle awareness, recovery behavior, and race positioning. Tune difficulty through reaction quality and setup, not dishonest rubber-banding.

### 6.5 Race results

Track finish time, position, checkpoints, penalties, damage, clean driving, and optional performance bonuses. Make scoring transparent and repeatable. Restart and retry must be reliable.

---

## 7. ART DIRECTION AND 2D ASSET PRODUCTION

### 7.1 Visual target

High-detail, polished, realistic/semi-realistic illustrated 2D art with a coherent art direction. Aim for a premium automotive racing game. It must not look like a generic AI collage, a cheap mobile game, primitive vector placeholders, or pixel art.

Use one consistent side-on camera, scale, perspective, outline/edge treatment, color grade, lighting logic, and material rendering across every vehicle and track.

### 7.2 Asset requirements

Create original/high-quality:

- Vehicle sprite families and separate rotating wheels.
- Track surface/terrain segments and collision-aligned shapes.
- Layered parallax backgrounds and sky/atmosphere.
- Obstacles, bridges, ramps, rocks, logs, signs, vegetation, structures, and roadside details.
- Dust, tire smoke, mud, sparks, impact, landing, and speed effects.
- UI panels, icons, buttons, sliders, gear selector, gauges, map, badges, and app icon.

Do not use one sprite stretched across incompatible vehicle models. Do not use AI-generated sheets with inconsistent wheels, perspective, or body geometry. Normalize pivots, resolution, transparent margins, naming, atlas layout, and color space. Keep source art at high resolution and generate optimized runtime assets.

### 7.3 Image-generation and art tools

Discover all available local or connected image-generation, sprite, illustration, vector, and asset tools. Use them when they improve quality and are available without unauthorized spending. Use high-quality reference-guided workflows, not random prompt-only generation. For every vehicle, create a reference sheet with exact model/generation/trim, side profile, proportions, palette, wheel centers, and distinguishing features. Generate or draw the body, wheels, and details as a consistent family.

If generated artwork cannot achieve recognizable vehicle fidelity, use a different available tool/workflow or construct/refine the artwork manually/vector/raster from licensed references. Do not accept bad assets just because they were generated quickly.

### 7.4 Visual family and references

Create `ART_BIBLE.md` before final asset production. It must define:

- Brand system and logo usage.
- Target reference boards for vehicles, tracks, obstacles, effects, and UI.
- Camera and world scale.
- Sprite dimensions, pivot rules, wheel-center convention, naming, atlas rules, and export settings.
- Palette/material standards for asphalt, soil, sand, mud, metal, glass, rubber, paint, vegetation, and sky.
- Lighting/shadow and parallax rules.
- Minimum acceptance criteria for each asset family.

### 7.5 No 3D drift

Do not use Babylon.js, Three.js, Rapier 3D, Unity 3D, Godot 3D, or a 3D vehicle model as the core rendering/physics approach. Do not spend time building 3D vehicles and trying to render them as an easier shortcut. A 2D side profile may use layered sprites and parallax depth, but all gameplay physics remains 2D.

---

## 8. PERSIAN UI — REAL RTL, PROFESSIONAL AND CLEAN

The game itself must be Persian-first. All player-facing menus, settings, vehicle labels, mission text, tutorial, HUD labels, dialogs, results, and instructions must be Persian by default. English may appear only where it is a proper model/brand name or unavoidable technical notation.

- Use local bundled Vazirmatn fonts with appropriate weights.
- Genuine RTL reading/order/alignment, not merely `text-align:right`.
- Correct Persian shaping/joining, digits, punctuation, mixed Latin vehicle names, and bidi handling.
- No broken glyphs, clipped text, reversed numbers, bad line breaks, or mirrored units.
- Define one clear typography and spacing scale.
- Use concise Persian automotive terminology and consistent labels.
- Professional visual hierarchy, clear buttons, cards, tabs, panels, dialogs, toggles, and sliders.
- Keep the driving scene visible; controls must be large enough for fingers without covering critical road visibility.
- Add settings for UI scale, control scale, opacity, left/right layout, audio, graphics, and available assists.
- Test at several phone aspect ratios and in both handedness layouts.

The three vertical pedal sliders must look premium and be immediately understandable. The thumb/fill position must accurately show the current analog input. Touch hit areas must be larger than decorative graphics.

---

## 9. AUDIO AND GAME FEEL

Use vehicle-appropriate engine audio layers mapped to RPM, throttle/load, acceleration, and deceleration. Each car must sound distinct enough to identify. Add tire rolling, surface-specific rolling noise, wheelspin/squeal, clutch/gear feedback, impacts, landing, UI, and environmental ambience.

Use licensed recordings, public-domain audio, or original synthesized audio. Do not rip audio from commercial games or videos. Record source/license and attribution. A temporary synthesized prototype sound is acceptable only in early testing; do not present one generic oscillator loop as finished V1 audio.

Game-feel additions should support readability and impact: restrained camera shake, landing compression, dust bursts, wheel spin effects, subtle hit-stop where appropriate, and satisfying UI feedback. Do not let effects obscure physics or controls.

---

## 10. TECHNICAL STACK — VERIFY BEFORE LOCKING

### 10.1 Engine selection

**Evaluate Phaser AE first** because its official documentation explicitly positions it as an AI-first game engine with a compact kernel and expansion-pack architecture. Current official reference: `https://www.phaser.io/kernel`. Check current release, API, pack availability, terms, browser support, WebGL2 fallback, touch input, offline bundling, and compatibility with Planck and Capacitor.

Phaser AE is modular and some packs may be paid. Use only free/licensed packs unless the user explicitly authorizes a purchase. Do not make the game depend on a paid pack, remote account, license server, or runtime CDN. Vendor/bundle the source and assets required for offline play as permitted by the pack's license.

**Fallback:** if Phaser AE's current release, API maturity, Planck integration, local bundling, or Android WebView behavior cannot pass a small technical validation, use stable **Phaser 4.2.1** (verify latest stable compatible release before pinning) with TypeScript/Vite. The `awesome-gamedev-agent-skills` Router currently has a Phaser 4 engine skill; do not mistakenly apply Phaser 4 API examples to Phaser AE. Document the selected engine and proof.

Official references:
- Phaser AE kernel: `https://www.phaser.io/kernel`
- Phaser AE pricing/licensing: `https://phaser.io/pricing`
- Phaser 4 releases: `https://phaser.io/download/phaser4`
- Phaser 4.2.1 release reference: `https://phaser.io/download/release/v4.2.1`

### 10.2 Physics and app stack

- TypeScript, strict mode.
- Vite or the selected engine's official build tooling.
- Planck.js (`planck` npm package), latest stable compatible 1.5.x or later after validation; MIT. Verify installed API and WheelJoint semantics.
- Capacitor Android for packaging.
- GitHub Actions for test/build/artifacts/release.
- Playwright for browser smoke tests and deterministic screenshot automation where compatible.
- Android SDK/Gradle/JDK compatible with selected Capacitor release.

Official references:
- Planck.js: `https://github.com/piqnt/planck.js`
- Planck API: `https://piqnt.com/planck.js/docs/`
- npm package: `https://www.npmjs.com/package/planck`
- Capacitor Android: `https://capacitorjs.com/docs/android`

Do not pin old versions based on this prompt alone. Check current official docs and peer dependencies, then pin exact compatible versions and commit the lockfile. Never use a runtime CDN for core engine, physics, fonts, game assets, or audio.

### 10.3 Technical validation gate

Before full implementation, make a small but real technical spike inside the new repository:

- One chassis body and two wheel bodies.
- Two independent suspension joints.
- A short uneven track with at least two surfaces.
- Engine torque, clutch slider, manual gear changes, and wheel rotational dynamics.
- Three independent vertical touch sliders (throttle, brake, clutch) with multi-touch and release curves.
- Real wheelspin under a reproducible low-grip/high-torque condition.
- A browser run and an Android WebView test.

Use this to decide Phaser AE vs Phaser 4 and verify Planck. The spike is a gate, not the final delivery; after it passes, continue building the entire V1. If a physics approach is unstable, correct it before content production rather than hiding the failure with animation.

---

## 11. SKILLS, RESEARCH, TOOLS, AND AGENT CLUSTER

Use tools and skills in practice. Do not merely list their names in the report.

### 11.1 Required game-development Skills

Repository: `https://github.com/gamedev-skills/awesome-gamedev-agent-skills`

- Inspect its current README, install instructions, Router, engine support, and license.
- Install/use its Router in the actual agent environment.
- Load the minimal relevant Skills before each workstream; do not load every Skill into every prompt.
- Prioritize `create-game-assets`, `physics-tuning`, `input-systems`, `game-feel`, `game-ui-ux`, `camera-systems`, `performance-optimization`, `audio-design`, `level-design`, `save-systems`, and `game-ai` where relevant.
- Use the Phaser 4 skill only if Phaser 4 is selected. If Phaser AE is selected, use its own official documentation and create a concise local `.agents/skills/phaser-ae/` guide based on the pinned AE API. Never mix AE and Phaser 4 APIs.
- Read only relevant Skill bodies and references on demand. Preserve token/context budget.

Install command, if compatible with the installed Node/tooling version: `npx skills add gamedev-skills/awesome-gamedev-agent-skills`. Check the required Node version before running; do not blindly update the user's global environment.

### 11.2 ForgeSkills

Repository: `https://github.com/sekaikx/ForgeSkills`

Inspect README, license, limits, scripts, and relevant Skills. Use only the genuinely applicable parts such as:

- `gamedev-art-direction`
- `gamedev-reference-reconstruction`
- `gamedev-visual-iteration`
- `gamedev-game-testing`
- `gamedev-verification`
- `gamedev-debugging`
- `gamedev-performance`
- `gamedev-animation`
- `gamedev-vfx-impact`
- `gamedev-audio-wire`

ForgeSkills contains 3D-oriented material and is not a dedicated 2D sprite engine. Do not force Blender/3D modeling Skills into this 2D project. Reuse its measurement, reference matching, visual iteration, debugging, and verification procedures where they fit. State honestly which tools were executed and which were not.

### 11.3 Internet research and reusable solutions

You are encouraged to research broadly and use high-quality public techniques, references, examples, open-source libraries, tutorials, technical articles, and reusable code when this improves the game. Prefer primary documentation, active repositories, reproducible examples, and clear licenses. Verify compatibility with the chosen engine and current version.

- Use open-source code only under compatible licenses; preserve license notices and attribution.
- Do not copy proprietary commercial game code/assets, rip game sprites, scrape paid libraries, bypass access controls, or remove watermarks.
- Never use unknown remote scripts in production.
- Do not paste unreviewed code wholesale. Understand, adapt, test, and document it.
- Record source URL, license, version/commit, modifications, and attribution in `ASSET_LICENSES.md` or `THIRD_PARTY_NOTICES.md`.
- No paid services/credits without explicit user permission.

### 11.4 Image/asset tool discovery

Inspect the available tools and local software for image generation, image editing, sprite creation, raster/vector editing, sound generation, and reference comparison. Use them where helpful. If a tool is unavailable, choose a reproducible local/open-source workflow. Do not claim to have used a tool that was not available.

### 11.5 Agent Cluster

If the environment supports Agent Cluster/subagents, use it for independent work. Suggested roles:

1. Lead Architect/Integrator — owns interfaces, priorities, merges, and final acceptance.
2. Vehicle Dynamics Engineer — Planck model, engine, clutch, gearbox, tires, and physical tests.
3. 2D Vehicle Artist — exact side-profile vehicle reference sheets, body/wheel sprite families, pivots, and animation.
4. Track/Gameplay Engineer — tracks, obstacles, race modes, AI opponents, and progression.
5. UI/UX and Persian Specialist — brand, menus, vertical sliders, HUD, RTL, and typography.
6. QA/Android/Release Engineer — automation, screenshots, performance, GitHub Actions, APK/AAB, and release.

Parallelize research and tasks with bounded file ownership. Do not let multiple agents edit the same physics core, project configuration, or shared files simultaneously. The lead owns integration and resolves conflicts. Run heavy rendering/build processes sequentially when local resources are constrained. Agent Cluster is orchestration, not proof of quality; inspect every merge.

Record real usage in `docs/qa/SKILL_AND_AGENT_USAGE.md`.

---

## 12. PROJECT STRUCTURE AND DOCUMENTATION

Create a maintainable modular architecture. Suggested modules (adapt to selected engine, but preserve clear ownership):

- `src/core/` — lifecycle, game state, event system, configuration, timing.
- `src/physics/` — Planck world, contacts, fixed timestep, collision filters.
- `src/vehicles/` — profiles, engine, clutch, transmission, differential, tires, suspension, brakes, damage.
- `src/controls/` — three vertical sliders, multi-touch, input actions, gear selector, settings.
- `src/tracks/` — track data, surfaces, segments, checkpoints, camera bounds.
- `src/obstacles/` — physical obstacle classes and interactions.
- `src/racing/` — race state, positions, start/finish, scoring, AI, ghost replay.
- `src/career/` — progression, events, rewards, unlocks.
- `src/ui/` — Persian RTL screens, design system, HUD, localization.
- `src/audio/` — engine/tire/effects/music buses.
- `src/assets/` — loading manifests and validation.
- `src/save/` — versioned local persistence and migrations.
- `public/assets/vehicles/`, `tracks/`, `obstacles/`, `effects/`, `ui/`, `audio/`, `fonts/`.
- `.github/workflows/` — CI, Android build, release.
- `docs/visual-qa/` — actual screenshots and visual reports.
- `docs/qa/` — automated/manual reports.

Required documentation:

- `README.md`
- `GDD.md`
- `TDD.md`
- `ART_BIBLE.md`
- `VEHICLE_PHYSICS.md`
- `VEHICLE_DATA_SOURCES.md`
- `ASSET_LICENSES.md`
- `AGENTS.md`
- `TECHNICAL_IMPLEMENTATION_PLAN.md`
- `docs/qa/TEST_PLAN.md`
- `docs/qa/SKILL_AND_AGENT_USAGE.md`
- `docs/visual-qa/INDEX.md`

Keep them accurate. Do not mark planned systems as implemented.

---

## 13. VISUAL QA — REAL SCREENSHOTS, INDEPENDENT REVIEW, ITERATION

A code build passing is not visual completion. You must run the actual game and capture genuine runtime images. Do not substitute concept art, generated mockups, Blender renders, or hand-edited marketing images for in-game evidence.

### 13.1 Required screenshots

Capture at least:

1. Splash/brand and main menu.
2. Career/event selection.
3. Garage and each vehicle.
4. Vehicle specs and setup.
5. Gameplay with manual car and all three sliders visible.
6. Gameplay during clutch disengagement and engagement.
7. Gameplay with automatic car (no clutch control shown).
8. A visible gear/RPM/speed HUD state.
9. Wheelspin/low-grip scene.
10. Hard braking scene showing plausible body/vehicle response.
11. Jump and landing.
12. Obstacle collision/bridge/rock interaction.
13. AI race with opponents.
14. Time Trial/Ghost.
15. Results and progression.
16. Settings/control customization in Persian RTL.
17. At least one close-up of the most detailed vehicle sprite.
18. At least one screenshot for each distinct track environment.

Capture at realistic Android landscape resolutions and at least one desktop/web development size. Use Playwright for deterministic web capture and Android emulator/device via ADB for app screenshots where available. Clearly label web/emulator/physical-device origin.

### 13.2 Visual inspection

Pass screenshots as actual image inputs to a vision-capable reviewer. A file path in text is not proof that the model viewed the image. Use a separate reviewer/subagent when available; the builder must not be the sole judge of its own work.

Review:

- Exact vehicle silhouette, model recognition, proportions, wheel centers, body/wheel alignment.
- Asset family consistency, palette, perspective, resolution, and edge quality.
- Track art/collision alignment, obstacle readability, and parallax depth.
- Composition and camera framing.
- Dust, tire, impact, and landing effects.
- Persian shaping, RTL, typography, spacing, UI scale, and control clarity.
- Slider fill/thumb accuracy and visible analog state.
- Sprite seams, clipping, jitter, flicker, collision artifacts, overlap, and unreadable HUD.

Score categories from 1–10 only as diagnostics. For every score below 8, list concrete issues and required corrections. Do not award 10/10 without evidence.

### 13.3 Required iteration loop

For the logo/menu, garage, vehicle sprites, main race screen, obstacle scenes, and control HUD, run this loop at least twice or until all acceptance checks pass:

`Capture → Inspect → Rank defects → Fix a focused cause → Rebuild → Capture again → Compare`

Change one major visual cause at a time when possible. Save before/after comparisons. Keep a discrepancy list between real vehicle reference and in-game side sprite. Do not repeatedly regenerate assets without comparing them.

### 13.4 GitHub evidence

Commit screenshots and reports to:

`docs/visual-qa/<version-or-commit>/screenshots/`

Include an index, capture resolution/device, build commit, mode/track/car, and concise captions. Save `VISUAL_QA_REPORT.md`, before/after comparisons, and remaining defects. Upload a compressed screenshot bundle and QA report as GitHub Actions artifacts when practical. Never include secrets, private desktop content, or huge raw caches.

---

## 14. TESTING AND QUALITY GATES

### 14.1 Automated tests

Implement focused, high-value tests for:

- Engine torque curve interpolation and RPM update.
- Clutch slip, bite point, engagement-rate behavior, and stall logic.
- Manual gear selection/interlocks and over-rev detection.
- Automatic shift/kickdown/CVT strategy where applicable.
- Wheel angular dynamics and traction/friction limits.
- Brake response and ABS behavior where equipped.
- Fixed-step physics stability and collision scenarios.
- Slider value, pointer capture, multi-touch independence, and spring return.
- Race timing, checkpoints, position, penalties, and Ghost recording/replay.
- AI track following and collision/obstacle responses.
- Save validation, migrations, and recovery from corrupted data.
- Persian UI smoke tests and key RTL layout assertions.

Use deterministic seeds and repeatable test scenarios. Favor meaningful assertions over large numbers of low-value tests.

### 14.2 Manual and visual tests

Play each required mode from start to finish. Drive each car. Test all sliders together on an actual touch device/emulator. Test pause/resume, screen changes, settings persistence, save/load, retries, race completion, and offline launch. Confirm all visible controls work.

### 14.3 Performance

Target stable 60 FPS on capable mid-range devices. Provide a robust 30 FPS fallback/profile for weaker devices. Measure on the actual target phone when available; otherwise clearly mark physical-device testing as pending and report emulator/browser results separately.

Record average FPS, p95/p99 frame time, physics-step time, memory, asset-loading peaks, startup time, and stutter. Keep asset sizes, atlas pages, overdraw, draw calls, and allocations under control. Do not claim performance passes without measurements.

### 14.4 Release gates

A V1 release candidate must satisfy all of these:

- Installable Android package launches and runs.
- All five modes are functional to their defined V1 extent.
- At least three genuinely distinct real vehicles are complete and documented.
- Three vertical sliders work as continuous multi-touch controls; no ordinary-button substitute.
- Manual clutch/gear mechanics and automatic transmission behave distinctly and coherently.
- Wheel/suspension, traction, jumping, landing, collisions, and surfaces work in repeatable scenarios.
- At least six tracks and eight meaningful obstacle/surface types are playable.
- AI opponents race without teleporting or ignoring physics.
- Persian RTL and Vazirmatn pass visual review.
- No critical crash, soft lock, broken save, placeholder asset, or dead menu control.
- Visual screenshots and QA reports are committed.
- Web and Android CI pass.
- Asset/code licenses and credits are recorded.
- Known limitations and device-test status are explicit.

If a gate is blocked, fix it. If a true external blocker prevents it, do not hide it or publish a stable release.

---

## 15. GITHUB, ANDROID BUILD, AND RELEASE

Create GitHub Actions workflows for:

1. TypeScript checks, lint, formatting, and focused tests.
2. Web production build.
3. Asset-manifest and missing-file validation.
4. Capacitor sync.
5. Android Gradle build (APK and AAB where configured).
6. Artifact upload for APK/AAB, test results, and visual QA report.
7. Tag-triggered release workflow.

Use official current actions and compatible Node/JDK/Android SDK/Gradle versions. Pin action versions responsibly. Commit lockfiles. Cache safely. Keep core game runtime assets local; no CDN dependency.

### Android signing

Inspect available GitHub Secrets without printing values. If production signing credentials exist, use them securely. If no keystore/signing secrets exist, build an installable debug APK and label it **TEST/DEBUG**. Do not call it a production-signed release. A Preview/Pre-release may be created if the artifact is useful and gates otherwise pass, with exact signing status clearly stated. Never create or commit a keystore/password.

### Versioning and release

- Keep `package.json`, app metadata, Android `versionName`/`versionCode`, tags, workflow outputs, README, and release notes synchronized.
- Use semantic versions and monotonically increasing Android versionCode.
- After all gates pass, commit and push final changes to the exact canonical repo.
- Inspect actual GitHub Actions results and logs; fix failures and rerun.
- Create a GitHub Release with accurate notes, build commit, tested scope, APK/AAB artifacts, checksums, screenshots, and QA report.
- Use a Preview/Pre-release label if physical-device testing or signing remains pending. Never claim production-ready without proof.
- Do not bypass branch protection or force-merge.

---

## 16. EXECUTION PLAN — CONTINUE THROUGH ALL STAGES

### Stage A — Repository and tool audit

Inspect the exact new repository, local environment, Node/npm, Git, GitHub CLI, Android SDK/JDK/Gradle, browser, ADB/emulator/device, available Skills/MCP/image/audio tools, and local resource limits. Preserve the old FARMAN project untouched.

### Stage B — Research and technical spike

Read official engine/physics/Capacitor docs and relevant Skills. Compare Phaser AE vs Phaser 4 with a real minimal spike. Validate Planck WheelJoint and custom vehicle torque flow. Validate vertical sliders and Android touch. Record engine decision, package versions, risks, and benchmark.

### Stage C — Durable design and architecture

Complete GDD/TDD/ART_BIBLE/VEHICLE_PHYSICS and `AGENTS.md`. Define vehicle profiles, input contracts, track schema, sprite manifests, units, save schema, acceptance tests, and module boundaries.

### Stage D — Vehicle physics first

Build and verify one complete manual vehicle with three vertical sliders and a small test track. Then add one automatic vehicle. Do not proceed to mass content production until launch, clutch, gear change, traction, braking, suspension, jump, landing, and mobile touch pass.

### Stage E — Full V1 implementation

Build the vehicle roster, all tracks/obstacles, modes, AI opponents, garage, progression, save system, Persian UI, effects, audio, and settings. No dead buttons or empty screens.

### Stage F — Final art production

Build reference-guided, model-accurate 2D sprite families, tracks, backgrounds, obstacles, and effects. Normalize and validate assets. Remove every placeholder. Run visual iteration and performance optimization.

### Stage G — QA and Android validation

Run automated/manual tests, actual screenshots, separate visual review, performance measurements, and Android emulator/physical-device tests. Fix defects and repeat capture.

### Stage H — Commit, push, Actions, release

Commit all code/docs/assets/evidence, push to exact repo, run Actions, inspect logs, fix failures, produce APK/AAB, and publish a correctly labelled Release only if gates pass.

Do not finish after Stage B or D. Those are gates, not final deliverables.

---

## 17. FINAL REPORT — EVIDENCE ONLY

When finished, report:

1. Exact canonical repository URL, branch, latest commit hash.
2. GitHub Actions workflow URLs and actual results.
3. Release URL/tag and whether it is stable, preview, debug, or signed.
4. APK and AAB download URLs and SHA-256 checksums.
5. Exact vehicle names/year/trims implemented and data-source status.
6. Implemented modes, tracks, obstacle types, transmissions, and control behavior.
7. Screenshot/visual QA directory and report links.
8. Before/after iteration summary.
9. Actual test totals/results.
10. Device/emulator used and performance measurements.
11. Skills/agents/tools actually used (not merely considered).
12. Asset/license/attribution status.
13. Remaining bugs, incomplete features, and physical-device checks.

Distinguish implemented, tested, emulator-verified, and physical-device-verified. A successful build does not mean a feature is verified. Never invent metrics, screenshots, commits, Actions statuses, or release links.

---

## 18. FINAL DIRECTIVE

Build **CHARKHTAZ** as a polished, premium-feeling, Persian-first 2D physics racing game. The three vertical analogue sliders — accelerator, brake, and manual clutch — are a defining mechanic. Their movement, movement speed, touch release, and spring return must feed the actual simulation. A sudden throttle input, sudden brake input, clutch press, and sudden clutch engagement must each produce different outcomes caused by the modeled mechanics and current conditions.

Use real vehicle names and researched model/year/trim data. Make every car's side silhouette faithful to its real counterpart. Use excellent original or properly licensed 2D art. Use the relevant Skills, open-source techniques, current documentation, and permitted internet resources. Use Agent Cluster when available with disciplined ownership. Do not cheap out with primitive shapes, generic cars, dead menus, fake physics, placeholder sounds, or unverified claims.

Build the complete V1, run it, inspect real screenshots, fix what looks or behaves wrong, commit screenshots and reports to GitHub, test Android, build APK/AAB, and publish a verified release or an accurately labelled preview.

**Do not modify the old FARMAN project. Do not turn CHARKHTAZ into 3D. Do not replace the three sliders with buttons. Do not deliver only a plan. Deliver the playable game and evidence.**

Begin by auditing the new GitHub URL in the immediately preceding user message, then execute the entire workflow.