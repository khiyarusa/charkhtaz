# UPGRADE SYSTEM · v0.2

The upgrade section is a real tuning system: every part changes the same
`ResolvedCar` object the physics engine consumes. There are no UI-only stats.

## 1. Data flow

```
CarProfile (authored data)
  + CarUpgrades (saved levels 0..3 per category)
  + CarSetup (brake bias, tyre pressure, suspension bias, final-drive trim)
  + CarCondition (tyres / engine / body 0..1)
  + CarCosmetics (paint, rims)
        ↓ resolveCar()
ResolvedCar → Vehicle → Planck world
        ↓ performanceStats()
garage / upgrade numbers  (derived from the same resolved curves)
```

`performanceStats()` no longer carries a second power formula: peak power is
computed from the tuned torque curve (`Nm × rpm / 7127`), so the number shown is
the number the engine model produces. A regression test pins every roster car to
its published figure within 1 hp.

## 2. Categories and effects

| Category | Saved key | Physical effect |
| --- | --- | --- |
| Engine | `engine` | torque curve × (1 + 0.055·level), max rpm +120·level, automatic shift point +90·level |
| Gearbox | `transmission` | shift time × (1 − 0.08·level) |
| Clutch | `clutch` | capacity × (1 + 0.12·level), wider bite window (manual only) |
| Tyres | `tires` | grip × (1 + 0.045·level) on every surface |
| Suspension | `suspension` | spring frequency +9 %/level, damping +4 %/level |
| Brakes | `brakes` | brake torque +12 %/level, front and rear |
| Weight | `weight` | mass −9 kg/level, creep torque −20 %/level |
| Differential | `differential` | driven-axle grip +1.8 %/level |

Trade-offs are real and stated in the part copy: the semi-slick tyre gains dry
grip but is worse in mud and sand; a stiffer suspension lands better but is
harsher on rough ground; weight reduction reduces creep and comfort.

## 3. Compatibility

`isUpgradeCompatible(car, category)` is the single authority:

- **Clutch** is refused on every automatic car ("این خودرو کلاچ پدالی ندارد").
- **Gearbox** is refused on a CVT car (`auto.kind === 'cvt'`, the Corolla E210):
  a belt CVT has no fixed ratios to replace.
- Everything else is available to every car.

Saved levels are sanitised on load: incompatible categories are forced to 0, so a
save written by an older build cannot equip an impossible part.

## 4. Prices, refunds and economy

- Tier price = category base × car factor (`1 + min(1.4, price/120000)`), rounded
  to 100.
- Installing costs the next tier's price.
- Removing the newest part refunds **half** of that tier's price. The refund is
  deterministic and cannot exceed what was paid, so buy/remove cannot be farmed.
- "Reset to stock" clears all categories for the car. It is free and does not
  refund, which is stated in the UI.

Upgrade levels, condition and cosmetics are stored per car id in the version 3
save and survive reloads.

## 5. Cosmetic parts

Paint (5 options) and rims (3 options) are free, applied immediately, and change
the actual drawing in both the garage preview and the race. They are labelled as
appearance, never as performance.

## 6. Tests

`src/vehicles/upgrades.test.ts` and `src/vehicles/roster.test.ts` cover:

- clutch refused on automatic, allowed on manual;
- gearbox refused on CVT, allowed on a torque-converter automatic;
- sanitising out-of-range and incompatible levels;
- torque, grip, braking and mass changing in the resolved profile;
- peak power derived from the tuned curve and matching the published figure;
- refund equals half the installed tier and zero at stock;
- resolved profiles stay drivable (positive shift time, same curve length).
