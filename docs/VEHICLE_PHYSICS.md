# VEHICLE PHYSICS · v0.2

Planck.js is the single physics authority. World units are metres; the renderer
owns pixels. The simulation runs at a fixed 60 Hz step with a bounded accumulator
(max 6 steps per frame) and renders an interpolated pose.

## 1. Assembly

- One dynamic chassis body (box fixture, `bullet: true`, angular damping 0.55).
- Two dynamic wheel bodies on `WheelJoint`s. The joint motor is **off**: wheel
  torque reaches the ground only through the tyre model.
- The suspension is solved by `Vehicle`, not by the joint spring, because Planck
  sizes a wheel-joint spring from the wheel's mass rather than the car's.

### Collision filters

| Fixture | Category | Mask | Why |
| --- | --- | --- | --- |
| Ground (chains) | `0x0001` | all | terrain |
| Chassis | `0x0002` | ground + obstacles | the body may rest on its roof, but its box is raised above the wheel tops so it cannot catch kerbs |
| Wheel | `0x0004` | ground + obstacles | the only part that rolls on the road |
| Obstacle | `0x0008` | all | rocks, logs, blocks, planks |

The chassis fixture is `Box(0.94·halfLength, 0.58·halfHeight)` offset upward by
`0.4·halfHeight`. Its lower edge sits above the wheel tops, so normal driving
never drags the body, while an inverted car still lands on something solid.

## 2. Suspension

Per corner, from the car's corner mass:

```
ω  = 2π · suspensionFrequencyHz
k  = cornerMass · ω²
c  = 2 · dampingRatio · √(k · cornerMass)
```

Every step, `solveSuspension()` measures the distance from the chassis anchor to
the wheel body along the suspension axis:

- **Compression** = `restLength − distance`, clamped to `[−0.4·travel, travel]`.
- The spring force is `k · compression − c · rate`, with a progressive rate (×3)
  over the last 25 % of travel, capped at 5× the static corner load.
- The force is applied to the **chassis only**, at the anchor.
- **Bump stop:** if the wheel is closer than `restLength − travel`, the chassis's
  closing velocity along the axis is projected out (velocity-level stop, no
  teleport, no energy injection).
- **Droop stop:** if the wheel is farther than `restLength + 0.4·travel`, the wheel
  is pulled back to the limit and its outward velocity is removed.

This replaced a force pair applied to both bodies, which was numerically unstable
at 60 Hz (a 25 kg wheel against a 1.3 t chassis, with stops 6–9× stiffer than the
base spring). The symptom was cars launching off small kerbs and oscillating after
landings; `src/game/render-interpolation.test.ts` now asserts a 2 m drop settles
with at most two rebounds.

Tyre normal load is the solved spring force, clamped to 4× the static corner load,
and is zero while the wheel is airborne.

## 3. Tyres and surfaces

Longitudinal force comes from a slip-ratio curve with a peak at ~0.16 slip. Each
surface supplies `friction` and `rollingResistance`:

| Surface | μ | Rolling |
| --- | --- | --- |
| asphalt dry | 0.95 | 0.014 |
| asphalt wet | 0.68 | 0.017 |
| dirt | 0.78 | 0.032 |
| gravel | 0.62 | 0.045 |
| sand | 0.48 | 0.085 |
| mud | 0.36 | 0.11 |
| rock | 0.86 | 0.026 |
| wood | 0.72 | 0.030 |

ABS cars cap commanded brake torque at the grip the tyre can hold; non-ABS cars
can lock a wheel.

## 4. Torque path

```
engine torque
  → clutch (manual, bite curve + capacity) or torque converter (automatic)
  → gearbox ratio × final drive
  → open differential (per driven wheel)
  → tyre longitudinal force at the contact patch
  → chassis
```

Manual: implicit clutch solve with Coulomb saturation; shifting is refused unless
the clutch pedal is past the gearbox threshold.

Automatic: pump torque rises with engine speed squared and collapses as the speed
ratio approaches 1; the stator multiplies torque up to `converterStallRatio`; the
lock-up clutch closes above `converterLockRpm` and 0.85 speed ratio. The shift
schedule reads the **driven-wheel** speed (the real gearbox input), not the road
speed, and adds a wheelspin escape (short-shift when slip > 0.3 and the engine is
above 84 % of its shift point), limiter protection and a kickdown with a
predicted-rpm safety check. This is the documented fix for the automatic that
used to hold first gear under wheelspin.

CVT cars (Corolla E210) use the same converter model with `kind: 'cvt'`; ratio
kits are refused on them by the upgrade compatibility matrix.

## 5. Attitude assist

A 2D side-view car has no steering axis, so a free rigid body ends most jumps on
its roof. While fewer than two wheels are grounded, a capped PD torque levels the
car and stops wheelies:

```
error  = shortestSignedAngle(−angle) with a 0.5 rad deadband
torque = I · (2.8 · error − 1.9 · ω),  |torque| ≤ 7·I,  |ω| ≤ 5 rad/s
```

It is explicitly a game-feel aid, not a physical claim. On the ground the
suspension and tyres own the attitude.

## 6. Obstacle passability

Because the wheels are tied to the chassis horizontally, an obstacle taller than
the wheel radius is a wall, not a bump. The authors therefore cap obstacle heights
in `TrackBuilder`:

- rock ≤ 0.24 m, tyre stack ≤ 0.24 m, block ≤ 0.22 m, log radius ≤ 0.22 m;
- blocks get chamfered top edges in collision so a tyre can ride up;
- `gap()` authors a shallow ditch (≤ 0.85 m deep) instead of a bottomless hole.

This keeps every route completable, which `src/tracks/completion.test.ts` verifies
by driving all six routes with the autonomous controller and the scene's recovery
rules.

## 7. Fixed step and interpolation

`GameScene.update` accumulates real time, runs 0…6 fixed steps, and stores
`alpha = accumulator / dt`. `Vehicle.renderPose(alpha)` interpolates chassis and
wheel transforms between the previous and current physics poses. The camera
follows the same interpolated pose, so a 120 Hz display does not show a 60 Hz
camera stepping under a smooth car. Interpolation never writes back into physics.

## 8. Known limits

- No lateral dynamics, steering, yaw, tyre temperature or load sensitivity beyond
  the normal-load term.
- Damage is a scalar with staged visuals, not deformable geometry.
- Obstacles are static; there is no debris simulation.
- The attitude assist means a deliberate mid-air roll is not possible.
