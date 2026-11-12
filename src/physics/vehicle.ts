import { Box, Circle, Vec2, WheelJoint, type Body, type Contact, type World } from 'planck';
import { clamp, clamp01 } from '../core/math';
import type { ResolvedCar } from '../vehicles/profiles';
import { AutoDrivetrain } from '../vehicles/auto';
import { ManualDrivetrain, type DrivenWheelState } from '../vehicles/drivetrain';
import { slipRatio, stepFreeWheel, stepWheelWithBrake } from '../vehicles/tire';
import type { ShiftResult, SurfaceSpec } from '../vehicles/types';
import { fixtureSurface } from './terrain';

export interface PedalInputs {
  throttle: number;
  brake: number;
  clutch: number;
}

export interface WheelTelemetry {
  side: 'front' | 'rear';
  driven: boolean;
  omegaRadS: number;
  slip: number;
  loadN: number;
  grounded: boolean;
  surfaceId: string;
  /** Spin angle for rendering, radians. */
  angleRad: number;
  /** Suspension travel from rest, metres (positive = compressed). */
  compressionM: number;
}

export interface VehicleTelemetry {
  speedKph: number;
  rpm: number;
  gear: number;
  engineRunning: boolean;
  shifting: boolean;
  clutchPedal: number;
  throttle: number;
  brake: number;
  wheels: WheelTelemetry[];
  damage: number;
  airborne: boolean;
  pitchRad: number;
  distanceM: number;
  /** Mean driven-wheel slip ratio. */
  wheelSlip: number;
  /** Lateral/longitudinal acceleration estimate, m/s². */
  accelMs2: number;
  impact: number;
}

interface WheelRuntime {
  side: 'front' | 'rear';
  driven: boolean;
  body: Body;
  joint: WheelJoint;
  radiusM: number;
  restLengthM: number;
  anchorX: number;
  omegaRadS: number;
  loadN: number;
  surface: SurfaceSpec;
  grounded: boolean;
  contactPoint: Vec2;
  contactNormal: Vec2;
  forceN: number;
  brakeTorqueNm: number;
  absScale: number;
  /** Suspension spring rate for this corner, N/m. */
  springK: number;
  /** Suspension damper rate for this corner, N·s/m. */
  damperC: number;
  /** Current spring force, N (positive = separating chassis and wheel). */
  springForceN: number;
}

const AIR: SurfaceSpec = { id: 'air', friction: 0, rollingResistance: 0 };
const GRAVITY = 9.81;

/**
 * The player's (or AI's) car: a real 2D rigid-body chassis with two
 * independently simulated wheel bodies on Planck wheel joints.
 *
 * Force path (single authority, documented in docs/VEHICLE_PHYSICS.md):
 *   engine torque → clutch/converter → gearbox ratio → differential
 *   → tyre longitudinal force at the contact patch → chassis.
 * The wheel bodies carry suspension loads and collide with obstacles; their
 * tyres are modelled by the custom friction curve, so fixture friction is 0 to
 * avoid counting longitudinal force twice.
 */
export class Vehicle {
  readonly chassis: Body;
  readonly wheels: WheelRuntime[] = [];
  readonly car: ResolvedCar;
  readonly manual: ManualDrivetrain | null;
  readonly auto: AutoDrivetrain | null;

  private readonly world: World;
  private readonly startX: number;
  private readonly bodyHalfHeight: number;
  private readonly bodyHalfLength: number;
  private readonly startY: number;
  /** Chassis centre above ground at rest, metres. */
  private readonly centerOffsetY: number;
  private readonly anchorLocalY: number;
  private pedalState: PedalInputs = { throttle: 0, brake: 0, clutch: 0 };
  private lastSpeedMs = 0;
  private accelMs2 = 0;
  private damageAcc = 0;
  private impactAcc = 0;
  private lastImpact = 0;
  private elapsedS = 0;
  private readonly drivenIndices: number[] = [];

  constructor(
    world: World,
    car: ResolvedCar,
    startX: number,
    groundY: number,
  ) {
    this.world = world;
    this.car = car;
    this.startX = startX;
    this.startY = groundY;

    const n = car.numbers;
    const halfH = Math.max(0.32, n.heightM * 0.28);
    const halfL = n.lengthM * 0.47;
    this.bodyHalfHeight = halfH;
    this.bodyHalfLength = halfL;

    const radius = n.wheelRadiusM;
    const restLength = Math.max(0.13, n.suspensionTravelM * 0.7);
    const clearance = restLength + radius - 0.28;
    this.centerOffsetY = Math.max(0.16, clearance) + halfH;
    const centerY = groundY + this.centerOffsetY;

    this.chassis = world.createBody({
      type: 'dynamic',
      position: Vec2(startX, centerY),
      linearDamping: 0.01,
      angularDamping: 0.15,
      bullet: true,
    });
    this.chassis.createFixture(new Box(halfL, halfH), {
      density: n.massKg / (4 * halfL * halfH),
      friction: 0.35,
      restitution: 0.04,
    });

    const frontX = n.wheelbaseM / 2;
    const rearX = -n.wheelbaseM / 2;
    this.anchorLocalY = -halfH + 0.28;
    const anchorY = this.anchorLocalY;

    const layout = car.profile.layout;
    const axles: { side: 'front' | 'rear'; x: number; driven: boolean }[] = [
      { side: 'front', x: frontX, driven: layout === 'FWD' || layout === 'AWD' },
      { side: 'rear', x: rearX, driven: layout === 'RWD' || layout === 'AWD' },
    ];

    const wheelMass = n.axleInertiaKgM2 / (radius * radius);

    for (const axle of axles) {
      const wheelBody = world.createBody({
        type: 'dynamic',
        position: Vec2(startX + axle.x, centerY + anchorY - restLength),
        angularDamping: 0,
        linearDamping: 0,
        bullet: true,
      });
      wheelBody.createFixture(new Circle(radius), {
        density: wheelMass / (Math.PI * radius * radius),
        friction: 0,
        restitution: 0.02,
      });

      // The world anchor is the suspension top mount; planck derives the
      // local anchors, and the wheel's spawn position sets the rest length.
      const joint = world.createJoint(
        new WheelJoint(
          {
            enableMotor: false,
            // The spring is applied by this class: planck sizes a WheelJoint
            // spring from the wheel body's mass, which is a wheel, not a car.
            // A tiny non-zero frequency keeps planck's spring solver finite.
            frequencyHz: 0.05,
            dampingRatio: 0.7,
          },
          this.chassis,
          wheelBody,
          Vec2(startX + axle.x, centerY + anchorY),
          Vec2(0, 1),
        ),
      )!;

      this.wheels.push({
        side: axle.side,
        driven: axle.driven,
        body: wheelBody,
        joint,
        radiusM: radius,
        restLengthM: restLength,
        anchorX: axle.x,
        omegaRadS: 0,
        loadN: 0,
        surface: AIR,
        grounded: false,
        contactPoint: Vec2(startX + axle.x, groundY),
        contactNormal: Vec2(0, 1),
        forceN: 0,
        brakeTorqueNm: 0,
        absScale: 1,
        springK: 0,
        damperC: 0,
        springForceN: 0,
      });
    }

    this.wheels.forEach((w, i) => {
      if (w.driven) this.drivenIndices.push(i);
      const cornerMass = n.massKg / 2 + wheelMass;
      const omega = 2 * Math.PI * n.suspensionFrequencyHz;
      w.springK = cornerMass * omega * omega;
      w.damperC = 2 * n.suspensionDamping * Math.sqrt(w.springK * cornerMass);
    });

    if (car.profile.transmission === 'manual' && car.clutch) {
      this.manual = new ManualDrivetrain(car.engine, car.clutch, car.gearbox, {
        wheelRadiusM: radius,
        wheelInertia: n.axleInertiaKgM2 / 2,
      });
      this.auto = null;
      this.manual.gearbox.forceGear(0);
    } else if (car.auto) {
      this.auto = new AutoDrivetrain(car.engine, car.gearbox, car.auto, {
        wheelRadiusM: radius,
        wheelInertia: n.axleInertiaKgM2 / 2,
      });
      this.manual = null;
    } else {
      throw new Error(`Car ${car.profile.id} has neither a manual clutch nor an automatic spec`);
    }

    world.on('begin-contact', this.onBeginContact);
  }

  get pedals(): PedalInputs {
    return this.pedalState;
  }

  get engineRpm(): number {
    return (this.manual ?? this.auto)!.engine.currentRpm;
  }

  get gear(): number {
    return (this.manual ?? this.auto)!.gearbox.currentGear;
  }

  /** Apply one fixed step of controls and forces. Call `world.step` afterwards. */
  update(dt: number, pedals: PedalInputs): void {
    this.elapsedS += dt;
    this.pedalState = {
      throttle: clamp01(pedals.throttle),
      brake: clamp01(pedals.brake),
      clutch: clamp01(pedals.clutch),
    };

    this.applySuspension(dt);
    this.scanContacts();

    const velocity = this.chassis.getLinearVelocity();
    this.lastSpeedMs = velocity.x;
    const speed = velocity.x;

    const n = this.car.numbers;
    const mass = n.massKg;
    const absEnabled = n.hasAbs;
    const brakes = this.pedalState.brake;

    const wheelsByIndex: DrivenWheelState[] = [];
    const brakeTorques: number[] = [];
    for (const index of this.drivenIndices) {
      const w = this.wheels[index]!;
      wheelsByIndex.push({
        omegaRadS: w.omegaRadS,
        loadN: w.loadN,
        surface: w.grounded ? w.surface : AIR,
        tireGrip: n.tireGrip,
        forceN: 0,
      });
      brakeTorques.push(this.brakeTorqueFor(w, brakes));
    }

    let throttle = this.pedalState.throttle;
    if (this.car.setup.assistTraction && Math.abs(speed) < 12) {
      const slip = this.meanSlip();
      if (slip > 0.22) throttle *= clamp(1 - (slip - 0.22) * 1.8, 0.45, 1);
    }

    if (this.manual) {
      this.manual.step(
        dt,
        throttle,
        this.pedalState.clutch,
        speed,
        wheelsByIndex,
        brakeTorques,
      );
    } else if (this.auto) {
      this.auto.step(dt, throttle, speed, wheelsByIndex, brakeTorques);
    }

    // Driven wheels: state comes from the drivetrain.
    for (let i = 0; i < this.drivenIndices.length; i++) {
      const wheel = this.wheels[this.drivenIndices[i]!]!;
      const state = wheelsByIndex[i]!;
      wheel.omegaRadS = state.omegaRadS;
      wheel.forceN = state.forceN;
      wheel.brakeTorqueNm = this.brakeTorqueFor(wheel, brakes);
      this.updateAbs(wheel, absEnabled);
    }

    // Free-rolling wheels: own brake + rolling resistance via the same tyre model.
    for (let i = 0; i < this.wheels.length; i++) {
      if (this.drivenIndices.includes(i)) continue;
      const wheel = this.wheels[i]!;
      wheel.brakeTorqueNm = this.brakeTorqueFor(wheel, brakes);
      const result = stepFreeWheel(
        wheel.omegaRadS,
        wheel.brakeTorqueNm,
        wheel.loadN,
        wheel.grounded ? wheel.surface : AIR,
        wheel.radiusM,
        n.axleInertiaKgM2 / 2,
        speed,
        dt,
        n.tireGrip,
      );
      wheel.omegaRadS = result.omegaRadS;
      wheel.forceN = result.forceN;
      this.updateAbs(wheel, absEnabled);
    }

    // Ground forces on the chassis at the contact patch.
    for (const wheel of this.wheels) {
      const tangent = Vec2(-wheel.contactNormal.y, wheel.contactNormal.x);
      if (tangent.x < 0) {
        tangent.x = -tangent.x;
        tangent.y = -tangent.y;
      }
      if (!wheel.grounded) continue;
      const force = wheel.forceN;
      if (!Number.isFinite(force) || force === 0) continue;
      const point = wheel.contactPoint;
      this.chassis.applyForce(Vec2(tangent.x * force, tangent.y * force), point, true);

      // Rolling resistance opposes motion.
      const roll = wheel.surface.rollingResistance * wheel.loadN;
      if (roll !== 0 && Math.abs(speed) > 0.05) {
        const dir = -Math.sign(speed);
        this.chassis.applyForce(Vec2(dir * roll, 0), point, true);
      }
    }

    // Aerodynamic drag.
    const drag = 0.5 * 1.225 * n.cdA * speed * Math.abs(speed);
    if (Number.isFinite(drag)) {
      this.chassis.applyForce(Vec2(-drag, 0), this.chassis.getWorldCenter(), true);
    }

    // Wheel bodies spin with the simulated omega (visual + collision reality).
    for (const wheel of this.wheels) {
      if (Number.isFinite(wheel.omegaRadS)) {
        wheel.body.setAngularVelocity(wheel.omegaRadS);
      }
    }

    this.accelMs2 = (speed - this.lastSpeedMs) / Math.max(dt, 1e-4);
    this.lastSpeedMs = speed;
    this.lastImpact = 0;
  }

  /** Call after `world.step` to decay transient impact state. */
  afterStep(dt: number): void {
    this.impactAcc = Math.max(0, this.impactAcc - dt);
  }

  /**
   * Service-brake torque at one wheel. ABS cars cannot command more brake
   * torque than the tyre can hold, so the wheel keeps rolling near peak slip
   * instead of locking instantly; non-ABS cars can and do lock.
   */
  private brakeTorqueFor(wheel: WheelRuntime, pedal: number): number {
    const n = this.car.numbers;
    const axle = wheel.side === 'front' ? n.brakeTorqueFrontNm : n.brakeTorqueRearNm;
    let torque = (axle * clamp01(pedal)) / 2;
    if (n.hasAbs) {
      const gripTorque =
        n.tireGrip * wheel.surface.friction * Math.max(wheel.loadN, 0) * wheel.radiusM;
      torque = Math.min(torque, gripTorque * 0.98);
    }
    return torque * wheel.absScale;
  }

  private updateAbs(wheel: WheelRuntime, enabled: boolean): void {
    if (!enabled) {
      wheel.absScale = 1;
      return;
    }
    const slip = Math.abs(
      slipRatio(wheel.omegaRadS, wheel.radiusM, this.lastSpeedMs, 1.2),
    );
    // Simple slip regulator: bleed brake torque while the wheel is past the
    // peak of the friction curve, restore it as the wheel recovers.
    const target = 0.16;
    const correction = clamp(1 - (slip - target) * 4, 0.12, 1);
    wheel.absScale += (correction - wheel.absScale) * 0.35;
  }

  private scanContacts(): void {
    for (const w of this.wheels) {
      w.grounded = false;
      w.loadN = 0;
      w.surface = AIR;
      w.contactNormal = Vec2(0, 1);
      w.absScale = w.absScale || 1;
    }

    for (let c = this.world.getContactList(); c; c = c.getNext()) {
      if (!c.isTouching()) continue;
      const wheelIndex = this.wheelIndexForBody(c.getFixtureA().getBody());
      const otherWheel = this.wheelIndexForBody(c.getFixtureB().getBody());
      if ((wheelIndex < 0 && otherWheel < 0) || (wheelIndex >= 0 && otherWheel >= 0)) {
        continue;
      }

      const wheelIsA = wheelIndex >= 0;
      const index = wheelIsA ? wheelIndex : otherWheel;
      const wheel = this.wheels[index]!;
      const otherFixture = wheelIsA ? c.getFixtureB() : c.getFixtureA();

      const wm = c.getWorldManifold(null);
      if (!wm || wm.pointCount === 0) continue;
      let nx = wm.normal.x;
      let ny = wm.normal.y;
      if (wheelIsA) {
        nx = -nx;
        ny = -ny;
      }
      const len = Math.hypot(nx, ny) || 1;
      wheel.grounded = true;
      wheel.contactNormal = Vec2(nx / len, ny / len);
      wheel.contactPoint = Vec2(wm.points[0]!.x, wm.points[0]!.y);
      const surface = fixtureSurface(otherFixture);
      if (surface) wheel.surface = surface;

      wheel.loadN = 0;
    }

    // Tyre normal load is the suspension force at that corner, capped at a
    // sane multiple of the static axle load so a landing spike cannot create
    // an infinite friction force.
    const staticLoad = (this.car.numbers.massKg * GRAVITY) / 2;
    for (const wheel of this.wheels) {
      wheel.loadN = wheel.grounded
        ? clamp(Math.max(0, wheel.springForceN), 0, staticLoad * 4)
        : 0;
    }
  }

  /**
   * Mass-based spring/damper at each corner, applied between the chassis
   * anchor and the wheel body along the suspension axis. A bump stop adds
   * stiffness past full compression; a droop stop keeps the wheel from
   * hanging below its extended length.
   */
  private applySuspension(dt: number): void {
    const anchorLocalY = -this.bodyHalfHeight + 0.28;
    const travel = this.car.numbers.suspensionTravelM;
    const axis = this.chassis.getWorldVector(Vec2(0, 1));
    const chassisCentre = this.chassis.getWorldCenter();
    const chassisVelocity = this.chassis.getLinearVelocity();
    const chassisOmega = this.chassis.getAngularVelocity();

    for (const wheel of this.wheels) {
      const anchor = this.chassis.getWorldPoint(Vec2(wheel.anchorX, anchorLocalY));
      const wheelCentre = wheel.body.getPosition();
      const dx = anchor.x - wheelCentre.x;
      const dy = anchor.y - wheelCentre.y;
      const distance = dx * axis.x + dy * axis.y;
      const compression = wheel.restLengthM - distance;

      // Velocity of the chassis at the anchor, then relative velocity along
      // the suspension axis (positive = extending).
      const rx = anchor.x - chassisCentre.x;
      const ry = anchor.y - chassisCentre.y;
      const vax = chassisVelocity.x - chassisOmega * ry;
      const vay = chassisVelocity.y + chassisOmega * rx;
      const wv = wheel.body.getLinearVelocity();
      const rate = (vax - wv.x) * axis.x + (vay - wv.y) * axis.y;

      let force = wheel.springK * compression - wheel.damperC * rate;

      const bump = compression - travel;
      if (bump > 0) force += wheel.springK * 9 * bump;
      const droop = -compression - travel * 0.35;
      if (droop > 0) force -= wheel.springK * 6 * droop;

      force = clamp(force, -wheel.springK * 0.3, wheel.springK * 0.8);
      wheel.springForceN = force;

      this.chassis.applyForce(Vec2(axis.x * force, axis.y * force), anchor, true);
      wheel.body.applyForce(Vec2(-axis.x * force, -axis.y * force), wheelCentre, true);
    }

    const staticLoad = (this.car.numbers.massKg * GRAVITY) / 2;
    for (const w of this.wheels) {
      if (!w.grounded) w.loadN = 0;
      else w.loadN = clamp(Math.max(0, w.springForceN), 0, staticLoad * 4);
    }
  }

  private wheelIndexForBody(body: Body): number {
    for (let i = 0; i < this.wheels.length; i++) {
      if (this.wheels[i]!.body === body) return i;
    }
    return -1;
  }

  private meanSlip(): number {
    let sum = 0;
    let count = 0;
    for (const wheel of this.wheels) {
      if (!wheel.grounded) continue;
      sum += Math.abs(slipRatio(wheel.omegaRadS, wheel.radiusM, this.lastSpeedMs, 1.2));
      count++;
    }
    return count === 0 ? 0 : sum / count;
  }

  private onBeginContact = (contact: Contact): void => {
    const a = contact.getFixtureA().getBody();
    const b = contact.getFixtureB().getBody();
    const involvesCar = a === this.chassis || b === this.chassis;
    if (!involvesCar) return;
    const wm = contact.getWorldManifold(null);
    if (!wm) return;
    const va = a.getLinearVelocity();
    const vb = b.getLinearVelocity();
    const rel =
      Math.abs((vb.x - va.x) * wm.normal.x + (vb.y - va.y) * wm.normal.y);
    if (rel > 5) {
      this.damageAcc = Math.min(1, this.damageAcc + (rel - 5) * 0.012);
      this.impactAcc = Math.max(this.impactAcc, clamp01((rel - 4) / 18));
      this.lastImpact = Math.max(this.lastImpact, rel);
    }
  };

  requestGear(gear: number): ShiftResult {
    if (!this.manual) {
      if (gear === -1 || gear === 0 || gear === 1) {
        this.auto!.selectRange(gear as -1 | 0 | 1);
        return { ok: true };
      }
      return { ok: false, reason: 'invalid' };
    }
    const front = this.wheels[0]!;
    return this.manual.gearbox.requestShift(
      gear,
      this.pedalState.clutch,
      this.car.engine.maxRpm,
      front.omegaRadS,
    );
  }

  restartEngine(): void {
    (this.manual ?? this.auto)!.engine.restart();
  }

  /** Put the car back on the route at x, upright. */
  respawnAt(x: number, groundY: number): void {
    const y = groundY + this.centerOffsetY;
    this.chassis.setTransform(Vec2(x, y), 0);
    this.chassis.setLinearVelocity(Vec2(0, 0));
    this.chassis.setAngularVelocity(0);
    for (const wheel of this.wheels) {
      // Below the chassis anchor by the rest length, exactly as at spawn.
      // Placing the wheel above the anchor leaves it in droop with zero load,
      // so the car can spin its wheels but never move.
      wheel.body.setTransform(
        Vec2(x + wheel.anchorX, y + this.anchorLocalY - wheel.restLengthM),
        0,
      );
      wheel.body.setLinearVelocity(Vec2(0, 0));
      wheel.body.setAngularVelocity(0);
      wheel.omegaRadS = 0;
      wheel.loadN = 0;
    }
  }

  get startedAtX(): number {
    return this.startX;
  }

  get telemetry(): VehicleTelemetry {
    const velocity = this.chassis.getLinearVelocity();
    const front = this.wheels[0]!;
    const rear = this.wheels[1]!;
    const suspensionTravel = (w: WheelRuntime) => {
      const anchor = this.chassis.getWorldPoint(Vec2(w.anchorX, -this.bodyHalfHeight + 0.28));
      return anchor.y - w.body.getPosition().y - w.restLengthM;
    };
    const meanSlip =
      (Math.abs(slipRatio(front.omegaRadS, front.radiusM, velocity.x, 1.2)) +
        Math.abs(slipRatio(rear.omegaRadS, rear.radiusM, velocity.x, 1.2))) /
      2;

    return {
      speedKph: Math.hypot(velocity.x, velocity.y) * 3.6,
      rpm: this.engineRpm,
      gear: this.gear,
      engineRunning: (this.manual ?? this.auto)!.engine.isRunning,
      shifting: (this.manual ?? this.auto)!.gearbox.isShifting,
      clutchPedal: this.pedalState.clutch,
      throttle: this.pedalState.throttle,
      brake: this.pedalState.brake,
      wheels: this.wheels.map((w) => ({
        side: w.side,
        driven: w.driven,
        omegaRadS: w.omegaRadS,
        slip: slipRatio(w.omegaRadS, w.radiusM, velocity.x, 1.2),
        loadN: w.loadN,
        grounded: w.grounded,
        surfaceId: w.surface.id,
        angleRad: w.body.getAngle(),
        compressionM: suspensionTravel(w),
      })),
      damage: clamp01(1 - this.car.condition.body * (1 - this.damageAcc)),
      airborne: !front.grounded && !rear.grounded,
      pitchRad: this.chassis.getAngle(),
      distanceM: this.chassis.getPosition().x - this.startX,
      wheelSlip: meanSlip,
      accelMs2: this.accelMs2,
      impact: this.lastImpact,
    };
  }

  get speedMs(): number {
    return this.lastSpeedMs;
  }

  /** Distance travelled along x (metres). */
  get x(): number {
    return this.chassis.getPosition().x;
  }

  get y(): number {
    return this.chassis.getPosition().y;
  }

  get impactLevel(): number {
    return Math.max(this.impactAcc, this.lastImpact / 10);
  }

  get elapsed(): number {
    return this.elapsedS;
  }

  get spawnGroundY(): number {
    return this.startY;
  }

  dispose(): void {
    this.world.off('begin-contact', this.onBeginContact);
  }
}

