# Vehicle physics — CHARKHTAZ

This document is the authority for how a car moves. If code and this document
disagree, the code is wrong until this document is updated with evidence.

## Units and axes

- SI everywhere: metres, kilograms, seconds, newtons, newton-metres, radians.
- World `+x` is forward (the direction the car faces), `+y` is up.
- Positive wheel angular speed rolls the car forward.
- Rendering converts metres to pixels; physics never sees pixels.

## Time step

- Fixed step **1/60 s**. `GameScene` accumulates real frame time and runs at most
  six steps per frame; a longer stall drops accumulated time instead of
  spiralling.
- All forces are computed per fixed step. Nothing is scaled by frame rate.
- The renderer draws the latest state; no interpolation yet (60 Hz physics on a
  60 Hz display). This is a known gap for 120 Hz screens and is listed in
  `docs/QA-VISUAL.md`.

## Bodies (Planck.js)

| Body | Shape | Notes |
| --- | --- | --- |
| Chassis | box `length × 0.56 × height` | single rigid body, carries the mass |
| Front wheel | circle `r` | dynamic, `friction 0`, bullet |
| Rear wheel | circle `r` | dynamic, `friction 0`, bullet |

Wheels are attached with `WheelJoint` along the local vertical axis. The joint
provides the axis constraint and free rotation; **the spring is ours**, because
Planck sizes a `WheelJoint` spring from the wheel body's mass (a wheel, not a
car) and a zero frequency makes its solver divide by zero. The joint therefore
runs at a tiny non-zero frequency (`0.05 Hz`) purely to keep the solver finite.

### Suspension

Per corner:

```
k = (mass/2 + wheelMass) · (2π f)²
c = 2 ζ √(k · (mass/2 + wheelMass))
F = k · compression − c · compressionRate
```

- `compression = restLength − distance(anchor, wheelCentre)` along the axis.
- Forces are applied to the chassis at the anchor and to the wheel at its centre.
- A bump stop multiplies `k` by 9 past full travel; a droop stop pulls the wheel
  up past 35 % negative travel.
- Force is clamped to `[−0.3k, 0.8k]` to keep landings finite.
- Static compression is `g / (2πf)²` ≈ 4.5 cm for the Shahin, which is why the
  car settles visibly when a run starts.

Tyre normal load is the spring force at that corner, capped at four times the
static axle load so a landing spike cannot invent infinite grip.

## Tyres

Longitudinal only — this is a side-view game and does not model lateral force.

```
κ = (ω·r − v) / max(|v|, 0.5)
F = μ · N · sin(C · atan(B · κ)),  B = 10, C = 1.65
```

- Peak force exactly 1.0 × μN at κ ≈ 0.14; sliding plateau ≈ 0.52 × μN.
- μ = surface friction × tyre grip × condition/upgrade multipliers.
- The force is applied at the contact point along the ground tangent, so it
  pitches the chassis and transfers load like a real contact patch.
- The wheel update is semi-implicit with a **positive damping floor** past the
  slip peak. Using the true negative slope there pumps energy into the wheel and
  made the free axle oscillate between 0 and 6 rad/s.
- Free (non-driven) wheels are solved as rolling: they track road speed and a
  brake becomes a contact-patch force capped by grip. Integrating the stiff
  wheel/road coupling explicitly cancelled the brake within one step.

### ABS

Cars with `hasAbs`:

1. command brake torque is capped at `μNr` per wheel (never more than grip);
2. a slip regulator bleeds residual torque when |κ| exceeds ~0.16.

Non-ABS cars can lock: the wheel is clamped at zero speed and the tyre returns
the sliding force for κ = −1. That is why the Shahin (no ABS) skids and the
Prado/BMW stop harder on loose surfaces.

## Torque path (single authority)

```
engine torque
  → clutch (manual) or torque converter (automatic)
  → gearbox ratio × final drive
  → open differential (torque split evenly across driven wheels)
  → tyre longitudinal force
  → chassis at the contact patch
```

Nothing else applies drive torque. The Planck joint motor is disabled; wheel
bodies receive angular velocity from the drivetrain model, not from contacts
(their fixture friction is zero to avoid counting longitudinal force twice).

### Manual

- Clutch capacity follows a smoothstep bite curve between `biteStart` and
  `biteEnd`; transmitted torque saturates at capacity.
- Engine, clutch and wheels are integrated together at eight sub-steps with an
  implicit viscous solve inside the bite zone, so lock-up is stable at 60 Hz.
- Gear changes require clutch pedal ≥ `clutchThreshold`; otherwise the box
  refuses with `reason: 'clutch'`.
- A downshift that would drag the engine past redline is allowed but flagged
  `overrev`; mechanical damage accumulates above the grace band. Fuel cut does
  not protect an engine being driven by the wheels.

### Automatic

- Torque converter pump torque is `C·ω²`, with `C` sized so full-throttle stall
  is ≈ 2 600 rpm for that engine's peak torque.
- Stator multiplication decays from `converterStallRatio` to 1 as the speed
  ratio approaches 0.85; above `converterLockRpm` the lock-up clutch closes.
- The shift schedule is throttle-aware (upshift threshold falls with part
  throttle; kickdown above `kickdownThrottle`), with a cooldown to stop hunting.
- Creep is a wheel-side torque at closed throttle below 2.2 m/s, **not** extra
  pump capacity — including it in capacity stalled the engine at idle.
- `R / N / D` are driver ranges; D selects 1st and the schedule does the rest.

## Surfaces

`asphalt-dry`, `asphalt-wet`, `dirt`, `gravel`, `sand`, `mud`, `rock`, `wood`.
Each has a friction coefficient and rolling resistance in
`src/vehicles/profiles.ts`. The terrain builder tags each contiguous ground run
with one surface; the contact manifold supplies the surface to the tyre model.

## Damage and recovery

- Impact severity is measured from relative normal velocity at `begin-contact`
  (above 5 m/s), accumulating body damage and camera shake.
- Damage currently reduces the reported body condition; it does **not** yet
  change handling or visuals. That is deliberate: an untested mechanic is worse
  than none, and this is tracked as a V1 gap.
- Respawn returns the car to the last checkpoint, restarts the engine, selects
  1st, and adds a 3 s penalty. Falling below the terrain bounds, flipping for
  2.2 s, or being stuck for 12 s with throttle applied triggers it.

## Honest 2D limitations

A side view cannot represent lateral cornering, steering into the screen, yaw,
four independent contact patches, or a full 3D chassis. It *does* represent
longitudinal acceleration, braking, wheelspin, lock-up, suspension travel,
pitch, slopes, jumps, landings and collisions. The game design is built around
what the simulation can defend; no marketing claim should say otherwise.

## Tuning constants worth knowing

| Constant | Value | Why |
| --- | --- | --- |
| `B`, `C` (tyre) | 10, 1.65 | peak at κ ≈ 0.14, slide ≈ 0.52 |
| slip speed floor | 0.5 m/s | keeps κ finite at standstill |
| damping slope floor | 0.45 | stops wheel-update oscillation |
| suspension force clamp | −0.3k … 0.8k | finite landings |
| load cap | 4 × static | no infinite grip on spikes |
| converter reference stall | 2 600 rpm | idle pump torque < idle torque |
| respawn penalty | 3 s | discourages reset-spam |
