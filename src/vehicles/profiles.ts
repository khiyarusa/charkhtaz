import { clamp } from '../core/math';
import type { AutoSpec, ClutchSpec, EngineSpec, GearboxSpec, SurfaceSpec } from './types';

export type DrivetrainLayout = 'FWD' | 'RWD' | 'AWD';
export type TransmissionKind = 'manual' | 'automatic';

export interface CarNumbers {
  massKg: number;
  wheelbaseM: number;
  lengthM: number;
  heightM: number;
  widthM: number;
  cgHeightM: number;
  frontWeightPct: number;
  wheelRadiusM: number;
  /** Rotational inertia of one driven axle (both wheels), kg·m². */
  axleInertiaKgM2: number;
  tireGrip: number;
  cdA: number;
  brakeTorqueFrontNm: number;
  brakeTorqueRearNm: number;
  hasAbs: boolean;
  suspensionFrequencyHz: number;
  suspensionDamping: number;
  suspensionTravelM: number;
  /** Published/estimated top speed, used by HUD and AI targets. */
  topSpeedKph: number;
}

export interface CarArt {
  kind: 'sedan' | 'suv' | 'sport';
  bodyColor: string;
  bodyDark: string;
  bodyLight: string;
  accentColor: string;
  glassColor: string;
  rimStyle: 'mesh' | 'spoke' | 'rugged';
  /** Belt line height as a fraction of overall height. */
  beltRatio: number;
  roofRatio: number;
  hoodRatio: number;
  trunkRatio: number;
  /** Normalised cabin landmarks along the length (0 = rear bumper, 1 = front). */
  rearGlassBase: number;
  roofRear: number;
  roofFront: number;
  windshieldBase: number;
  plateFa: string;
}

export interface CarProfile {
  id: string;
  brandFa: string;
  brandEn: string;
  modelFa: string;
  modelEn: string;
  year: number;
  trim: string;
  marketFa: string;
  bodyStyleFa: string;
  layout: DrivetrainLayout;
  transmission: TransmissionKind;
  transmissionFa: string;
  priceCredits: number;
  taglineFa: string;
  descriptionFa: string;
  specs: {
    powerHp: number;
    torqueNm: number;
    torqueRpm: string;
    zeroTo100S: number | null;
    topSpeedKph: number;
    tireSize: string;
    sourceNoteFa: string;
  };
  numbers: CarNumbers;
  engine: EngineSpec;
  clutch: ClutchSpec | null;
  gearbox: GearboxSpec;
  auto: AutoSpec | null;
  art: CarArt;
}

export interface CarUpgrades {
  engine: number;
  tires: number;
  suspension: number;
  brakes: number;
  weight: number;
}

export type UpgradeKey = keyof CarUpgrades;

export interface CarSetup {
  /** −1 (soft) .. 1 (hard) tyre pressure: grip vs rolling resistance. */
  tirePressure: number;
  /** −1 .. 1 suspension stiffness. */
  suspensionBias: number;
  /** 0.45 .. 0.72 front brake share. */
  brakeBias: number;
  /** −1 .. 1 final-drive multiplier (short/long gearing). */
  finalDriveTrim: number;
  assistAutoClutch: boolean;
  assistTraction: boolean;
}

export interface CarCondition {
  /** 0..1 remaining tyre condition. */
  tires: number;
  /** 0..1 engine health. */
  engine: number;
  /** 0..1 body condition. */
  body: number;
}

export interface ResolvedCar {
  profile: CarProfile;
  numbers: CarNumbers;
  engine: EngineSpec;
  clutch: ClutchSpec | null;
  gearbox: GearboxSpec;
  auto: AutoSpec | null;
  setup: CarSetup;
  condition: CarCondition;
}

export const DEFAULT_UPGRADES: CarUpgrades = {
  engine: 0,
  tires: 0,
  suspension: 0,
  brakes: 0,
  weight: 0,
};

export const DEFAULT_SETUP: CarSetup = {
  tirePressure: 0,
  suspensionBias: 0,
  brakeBias: 0.58,
  finalDriveTrim: 0,
  assistAutoClutch: true,
  assistTraction: true,
};

export const DEFAULT_CONDITION: CarCondition = { tires: 1, engine: 1, body: 1 };

const SURFACE_ASPHALT_DRY: SurfaceSpec = {
  id: 'asphalt-dry',
  friction: 0.95,
  rollingResistance: 0.014,
};
export const BASE_SURFACE = SURFACE_ASPHALT_DRY;

export const CAR_PROFILES: readonly CarProfile[] = [
  {
    id: 'shahin-1401',
    brandFa: 'سایپا',
    brandEn: 'Saipa',
    modelFa: 'شاهین',
    modelEn: 'Shahin',
    year: 2022,
    trim: 'GLX · ۵ دنده دستی',
    marketFa: 'بازار ایران',
    bodyStyleFa: 'سدان کامپکت',
    layout: 'FWD',
    transmission: 'manual',
    transmissionFa: 'دستی ۵ سرعته',
    priceCredits: 0,
    taglineFa: 'سبک، چابک، شروعِ صادقانه',
    descriptionFa:
      'شاهینِ دستی با موتور ۱٫۵ لیتری توربو، ۱۱۰ اسب بخار و ۱۷۸ نیوتون‌متر گشتاور، ماشینِ آموزش و مهارت است: دیفرانسیل جلو، جعبهٔ پنج‌سرعته و کلاچ با نقطهٔ درگیری واضح. قدرت زیاد نیست، اما وزن سبک و نسبت‌های کوتاه باعث می‌شود خطِ گاز و کلاچ را دقیق یاد بگیری.',
    specs: {
      powerHp: 110,
      torqueNm: 178,
      torqueRpm: '۱۵۰۰–۴۵۰۰',
      zeroTo100S: 11.0,
      topSpeedKph: 190,
      tireSize: '185/65 R15',
      sourceNoteFa: 'قدرت/گشتاور/ابعاد از ویکی‌پدیای سایپا شاهین (M15TC)؛ شتاب و نسبت‌های نهایی تخمین مهندسی است.',
    },
    numbers: {
      massKg: 1290,
      wheelbaseM: 2.65,
      lengthM: 4.46,
      heightM: 1.5,
      widthM: 1.77,
      cgHeightM: 0.55,
      frontWeightPct: 60,
      wheelRadiusM: 0.31,
      axleInertiaKgM2: 2.2,
      tireGrip: 1.0,
      cdA: 0.68,
      brakeTorqueFrontNm: 2100,
      brakeTorqueRearNm: 1100,
      hasAbs: false,
      suspensionFrequencyHz: 2.35,
      suspensionDamping: 0.34,
      suspensionTravelM: 0.19,
      topSpeedKph: 190,
    },
    engine: {
      idleRpm: 800,
      stallRpm: 480,
      maxRpm: 6500,
      inertia: 0.22,
      torqueCurve: [
        { rpm: 800, nm: 120 },
        { rpm: 1500, nm: 178 },
        { rpm: 2500, nm: 178 },
        { rpm: 3500, nm: 178 },
        { rpm: 4500, nm: 174 },
        { rpm: 5500, nm: 148 },
        { rpm: 6200, nm: 128 },
        { rpm: 6500, nm: 108 },
      ],
      engineBrakeCoef: 0.012,
      constFrictionNm: 9,
      idleTorqueNm: 24,
      idleFadeRpm: 320,
      throttleTau: 0.09,
      overrevDamageRate: 0.22,
      overrevGrace: 1.02,
    },
    clutch: {
      maxTorqueNm: 215,
      biteStart: 0.3,
      biteEnd: 0.78,
      lockSlipRadS: 4.5,
    },
    gearbox: {
      gears: [3.545, 2.05, 1.36, 1.03, 0.82],
      reverse: 3.4,
      finalDrive: 4.05,
      shiftTimeS: 0.34,
      clutchThreshold: 0.55,
      drivelineEfficiency: 0.9,
    },
    auto: null,
    art: {
      kind: 'sedan',
      bodyColor: '#d8dde3',
      bodyDark: '#8d959e',
      bodyLight: '#f3f5f7',
      accentColor: '#b6462f',
      glassColor: '#26313c',
      rimStyle: 'spoke',
      beltRatio: 0.58,
      roofRatio: 0.95,
      hoodRatio: 0.72,
      trunkRatio: 0.68,
      rearGlassBase: 0.2,
      roofRear: 0.38,
      roofFront: 0.64,
      windshieldBase: 0.76,
      plateFa: 'ایران',
    },
  },
  {
    id: 'prado-150-2021',
    brandFa: 'تویوتا',
    brandEn: 'Toyota',
    modelFa: 'لندکروزر پرادو',
    modelEn: 'Land Cruiser Prado 150',
    year: 2021,
    trim: 'TX-L · ۶ دنده خودکار',
    marketFa: 'بین‌المللی',
    bodyStyleFa: 'شاسی‌بلند چهارچرخ‌محرک',
    layout: 'AWD',
    transmission: 'automatic',
    transmissionFa: 'خودکار ۶ سرعته',
    priceCredits: 42000,
    taglineFa: 'سنگین، مطمئن، فرمانروای خاک',
    descriptionFa:
      'پرادو یعنی وزن، گشتاور و کشش. موتور ۴٫۰ لیتری شش‌سیلندر با جعبهٔ خودکار شش‌سرعته و سامانهٔ چهارچرخ‌محرک، روی سنگ و شیب آرام و باوقار است؛ اما ترمزگیری و پیچیدن با این جرم، برنامهٔ متفاوتی می‌خواهد.',
    specs: {
      powerHp: 271,
      torqueNm: 381,
      torqueRpm: '۴۴۰۰',
      zeroTo100S: 9.9,
      topSpeedKph: 175,
      tireSize: '265/65 R17',
      sourceNoteFa: 'برگهٔ مشخصات تویوتا و منابع مستقل؛ برخی مقادیر دینامیکی تخمینی است.',
    },
    numbers: {
      massKg: 2450,
      wheelbaseM: 2.79,
      lengthM: 4.76,
      heightM: 1.89,
      widthM: 1.89,
      cgHeightM: 0.78,
      frontWeightPct: 53,
      wheelRadiusM: 0.4,
      axleInertiaKgM2: 5.4,
      tireGrip: 1.08,
      cdA: 1.32,
      brakeTorqueFrontNm: 5200,
      brakeTorqueRearNm: 3400,
      hasAbs: true,
      suspensionFrequencyHz: 1.95,
      suspensionDamping: 0.4,
      suspensionTravelM: 0.26,
      topSpeedKph: 175,
    },
    engine: {
      idleRpm: 650,
      stallRpm: 420,
      maxRpm: 6000,
      inertia: 0.36,
      torqueCurve: [
        { rpm: 700, nm: 260 },
        { rpm: 1200, nm: 300 },
        { rpm: 2000, nm: 340 },
        { rpm: 3000, nm: 365 },
        { rpm: 4400, nm: 381 },
        { rpm: 5000, nm: 350 },
        { rpm: 5600, nm: 345 },
        { rpm: 6000, nm: 300 },
      ],
      engineBrakeCoef: 0.02,
      constFrictionNm: 18,
      idleTorqueNm: 45,
      idleFadeRpm: 260,
      throttleTau: 0.16,
      overrevDamageRate: 0.14,
      overrevGrace: 1.03,
    },
    clutch: null,
    gearbox: {
      gears: [3.52, 2.042, 1.4, 1.0, 0.716, 0.586],
      reverse: 3.22,
      finalDrive: 3.909,
      shiftTimeS: 0.42,
      clutchThreshold: 0,
      drivelineEfficiency: 0.86,
    },
    auto: {
      upshiftRpm: 5450,
      downshiftRpm: 1600,
      kickdownRpm: 2600,
      kickdownThrottle: 0.82,
      shiftTimeS: 0.42,
      torqueCut: 0.82,
      converterStallRatio: 1.9,
      converterLockRpm: 1500,
      creepTorqueNm: 120,
    },
    art: {
      kind: 'suv',
      bodyColor: '#2f3b34',
      bodyDark: '#18211d',
      bodyLight: '#4c5c51',
      accentColor: '#c9a227',
      glassColor: '#1b2a2e',
      rimStyle: 'rugged',
      beltRatio: 0.6,
      roofRatio: 0.965,
      hoodRatio: 0.79,
      trunkRatio: 0.82,
      rearGlassBase: 0.13,
      roofRear: 0.3,
      roofFront: 0.7,
      windshieldBase: 0.81,
      plateFa: 'ایران',
    },
  },
  {
    id: 'bmw-320i-g20',
    brandFa: 'بی‌ام‌و',
    brandEn: 'BMW',
    modelFa: '۳۲۰i',
    modelEn: '320i G20',
    year: 2021,
    trim: 'Sport Line · ۸ دنده خودکار',
    marketFa: 'بین‌المللی',
    bodyStyleFa: 'سدان اسپرت',
    layout: 'RWD',
    transmission: 'automatic',
    transmissionFa: 'خودکار ۸ سرعته',
    priceCredits: 58000,
    taglineFa: 'تعادلِ عقب‌ران، دقتِ آلمانی',
    descriptionFa:
      '۳۲۰i با موتور توربو ۲٫۰ لیتری، دیفرانسیل عقب و جعبهٔ هشت‌سرعته، سریع‌ترین و دقیق‌ترین ماشین گاراژ است. گشتاور از ۱۳۵۰ دور در دسترس است؛ خروج از پیچ و شیب را با کنترل گاز ببر، نه با شتاب بی‌محابا.',
    specs: {
      powerHp: 184,
      torqueNm: 300,
      torqueRpm: '۱۳۵۰–۴۰۰۰',
      zeroTo100S: 7.2,
      topSpeedKph: 240,
      tireSize: '225/45 R18',
      sourceNoteFa: 'برگهٔ فنی BMW و منابع مستقل؛ مصرف/شتاب وابسته به شرایط است.',
    },
    numbers: {
      massKg: 1545,
      wheelbaseM: 2.851,
      lengthM: 4.709,
      heightM: 1.435,
      widthM: 1.827,
      cgHeightM: 0.52,
      frontWeightPct: 51,
      wheelRadiusM: 0.33,
      axleInertiaKgM2: 2.8,
      tireGrip: 1.14,
      cdA: 0.6,
      brakeTorqueFrontNm: 2950,
      brakeTorqueRearNm: 1750,
      hasAbs: true,
      suspensionFrequencyHz: 2.6,
      suspensionDamping: 0.38,
      suspensionTravelM: 0.17,
      topSpeedKph: 240,
    },
    engine: {
      idleRpm: 700,
      stallRpm: 430,
      maxRpm: 6800,
      inertia: 0.19,
      torqueCurve: [
        { rpm: 900, nm: 170 },
        { rpm: 1350, nm: 300 },
        { rpm: 4000, nm: 300 },
        { rpm: 5000, nm: 255 },
        { rpm: 6000, nm: 215 },
        { rpm: 6500, nm: 190 },
        { rpm: 6800, nm: 170 },
      ],
      engineBrakeCoef: 0.014,
      constFrictionNm: 10,
      idleTorqueNm: 22,
      idleFadeRpm: 300,
      throttleTau: 0.07,
      overrevDamageRate: 0.18,
      overrevGrace: 1.02,
    },
    clutch: null,
    gearbox: {
      gears: [5.25, 3.36, 2.17, 1.72, 1.31, 1.0, 0.82, 0.64],
      reverse: 3.57,
      finalDrive: 3.08,
      shiftTimeS: 0.2,
      clutchThreshold: 0,
      drivelineEfficiency: 0.9,
    },
    auto: {
      upshiftRpm: 6250,
      downshiftRpm: 1750,
      kickdownRpm: 2500,
      kickdownThrottle: 0.8,
      shiftTimeS: 0.2,
      torqueCut: 0.72,
      converterStallRatio: 1.7,
      converterLockRpm: 1400,
      creepTorqueNm: 55,
    },
    art: {
      kind: 'sport',
      bodyColor: '#2b4a6f',
      bodyDark: '#152941',
      bodyLight: '#4a6d94',
      accentColor: '#c8ccd2',
      glassColor: '#141f2b',
      rimStyle: 'mesh',
      beltRatio: 0.55,
      roofRatio: 0.93,
      hoodRatio: 0.69,
      trunkRatio: 0.72,
      rearGlassBase: 0.19,
      roofRear: 0.4,
      roofFront: 0.62,
      windshieldBase: 0.75,
      plateFa: 'ایران',
    },
  },
];

export function getCar(id: string): CarProfile {
  const car = CAR_PROFILES.find((c) => c.id === id);
  if (!car) throw new Error(`Unknown car: ${id}`);
  return car;
}

export const UPGRADE_LABELS_FA: Record<UpgradeKey, string> = {
  engine: 'موتور و نرم‌افزار',
  tires: 'لاستیک و چسبندگی',
  suspension: 'تعلیق و کمک‌فنر',
  brakes: 'ترمز و دیسک',
  weight: 'کاهش وزن',
};

export const UPGRADE_COSTS: Record<UpgradeKey, readonly number[]> = {
  engine: [1800, 3200, 5200],
  tires: [1200, 2400, 4000],
  suspension: [1400, 2600, 4200],
  brakes: [1100, 2200, 3600],
  weight: [1600, 3000, 5000],
};

/** Discount for upgraded parts is applied to the vehicle's resolved specs. */
export function resolveCar(
  profile: CarProfile,
  upgrades: CarUpgrades = DEFAULT_UPGRADES,
  setup: CarSetup = DEFAULT_SETUP,
  condition: CarCondition = DEFAULT_CONDITION,
): ResolvedCar {
  const engineLvl = clamp(upgrades.engine, 0, 3);
  const tireLvl = clamp(upgrades.tires, 0, 3);
  const suspLvl = clamp(upgrades.suspension, 0, 3);
  const brakeLvl = clamp(upgrades.brakes, 0, 3);
  const weightLvl = clamp(upgrades.weight, 0, 3);

  const torqueScale = 1 + 0.055 * engineLvl;
  const health = clamp(condition.engine, 0.35, 1);
  const engineHealthScale = 0.86 + 0.14 * health;
  const engine: EngineSpec = {
    ...profile.engine,
    inertia: profile.engine.inertia,
    torqueCurve: profile.engine.torqueCurve.map((p) => ({
      rpm: p.rpm,
      nm: p.nm * torqueScale * engineHealthScale,
    })),
    maxRpm: profile.engine.maxRpm + 120 * engineLvl,
  };

  const tirePressureGrip = 1 + 0.03 * clamp(setup.tirePressure, -1, 1);
  const tireConditionGrip = 0.82 + 0.18 * clamp(condition.tires, 0, 1);
  const grip =
    profile.numbers.tireGrip *
    (1 + 0.045 * tireLvl) *
    tirePressureGrip *
    tireConditionGrip;

  const massKg =
    (profile.numbers.massKg - 9 * weightLvl) *
    (profile.transmission === 'automatic' ? 1 : 1);
  const finalDrive =
    profile.gearbox.finalDrive * (1 + 0.06 * clamp(setup.finalDriveTrim, -1, 1));

  const numbers: CarNumbers = {
    ...profile.numbers,
    massKg,
    tireGrip: grip,
    suspensionFrequencyHz:
      profile.numbers.suspensionFrequencyHz * (1 + 0.09 * suspLvl) +
      0.25 * clamp(setup.suspensionBias, -1, 1),
    suspensionDamping: clamp(
      profile.numbers.suspensionDamping * (1 + 0.04 * suspLvl),
      0.2,
      0.6,
    ),
    brakeTorqueFrontNm:
      profile.numbers.brakeTorqueFrontNm *
      (1 + 0.12 * brakeLvl) *
      (0.25 + setup.brakeBias) *
      1.35,
    brakeTorqueRearNm:
      profile.numbers.brakeTorqueRearNm *
      (1 + 0.12 * brakeLvl) *
      (1.25 - setup.brakeBias) *
      1.35,
  };

  const gearbox: GearboxSpec = { ...profile.gearbox, finalDrive };
  const auto: AutoSpec | null = profile.auto
    ? {
        ...profile.auto,
        upshiftRpm: profile.auto.upshiftRpm + 90 * engineLvl,
        creepTorqueNm: profile.auto.creepTorqueNm * (1 - 0.2 * weightLvl),
      }
    : null;

  return {
    profile,
    numbers,
    engine,
    clutch: profile.clutch,
    gearbox,
    auto,
    setup,
    condition,
  };
}

/** Best-effort rpm for a given road speed in a gear (used by AI + HUD hints). */
export function rpmAt(
  speedMs: number,
  wheelRadiusM: number,
  totalRatio: number,
): number {
  return (Math.abs(speedMs) / wheelRadiusM) * totalRatio * (60 / (2 * Math.PI));
}

export const SURFACE_SPECS: Record<string, SurfaceSpec> = {
  'asphalt-dry': { id: 'asphalt-dry', friction: 0.95, rollingResistance: 0.014 },
  'asphalt-wet': { id: 'asphalt-wet', friction: 0.68, rollingResistance: 0.017 },
  dirt: { id: 'dirt', friction: 0.78, rollingResistance: 0.032 },
  gravel: { id: 'gravel', friction: 0.62, rollingResistance: 0.045 },
  sand: { id: 'sand', friction: 0.48, rollingResistance: 0.085 },
  mud: { id: 'mud', friction: 0.36, rollingResistance: 0.11 },
  rock: { id: 'rock', friction: 0.86, rollingResistance: 0.026 },
  wood: { id: 'wood', friction: 0.72, rollingResistance: 0.03 },
};

export const SURFACE_LABELS_FA: Record<string, string> = {
  'asphalt-dry': 'آسفالت خشک',
  'asphalt-wet': 'آسفالت خیس',
  dirt: 'خاک کوبیده',
  gravel: 'شن و ریگ',
  sand: 'ماسه',
  mud: 'گِل',
  rock: 'سنگ',
  wood: 'چوب',
};
