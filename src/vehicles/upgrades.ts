import type { CarProfile, CarUpgrades, ResolvedCar } from './profiles';
import {
  DEFAULT_CONDITION,
  DEFAULT_COSMETICS,
  DEFAULT_SETUP,
  PAINT_COLORS,
  UPGRADE_COSTS,
  UPGRADE_LABELS_FA,
  resolveCar,
  type CarCondition,
  type CarCosmetics,
  type CarSetup,
  type PaintId,
  type RimId,
} from './profiles';

export type UpgradeCategory = keyof CarUpgrades;

export interface UpgradeCategoryDef {
  id: UpgradeCategory;
  labelFa: string;
  descFa: string;
}

export const UPGRADE_CATEGORIES: readonly UpgradeCategoryDef[] = [
  { id: 'engine', labelFa: 'موتور', descFa: 'نرم‌افزار، ورودی هوا و خروجی اگزوز؛ گشتاور و پاسخ گاز.' },
  { id: 'transmission', labelFa: 'گیربکس', descFa: 'نسبت‌ها و سرعت تعویض؛ کوتاه‌تر برای شتاب، بلندتر برای سرعت.' },
  { id: 'clutch', labelFa: 'کلاچ', descFa: 'ظرفیت گشتاور و پنجرهٔ درگیری؛ فقط خودروی دستی.' },
  { id: 'tires', labelFa: 'لاستیک', descFa: 'ترکیب و چسبندگی؛ روی آسفالت خشک بیشترین اثر را دارد.' },
  { id: 'suspension', labelFa: 'تعلیق', descFa: 'فنر و میرایی؛ فرود پایدارتر، اما روی ناهموار سخت‌تر.' },
  { id: 'brakes', labelFa: 'ترمز', descFa: 'گشتاور ترمز و پایداری در ترمزهای پیوسته.' },
  { id: 'weight', labelFa: 'وزن', descFa: 'حذف تجهیزات اضافه؛ شتاب و ترمز بهتر، کابین خشن‌تر.' },
  { id: 'differential', labelFa: 'دیفرانسیل', descFa: 'قفل‌شونده‌تر؛ انتقال بهتر نیرو به هر دو چرخ محرک.' },
];

export interface UpgradePartDef {
  tier: 1 | 2 | 3;
  nameFa: string;
  descFa: string;
  effectsFa: string[];
}

export const UPGRADE_PARTS: Record<UpgradeCategory, readonly UpgradePartDef[]> = {
  engine: [
    { tier: 1, nameFa: 'نرم‌افزار مرحلهٔ ۱', descFa: 'بازنگری جرقه و سوخت؛ گشتاور میانی کمی بیشتر می‌شود.', effectsFa: ['گشتاور +۵٪', 'پاسخ گاز سریع‌تر'] },
    { tier: 2, nameFa: 'ورودی و اگزوز', descFa: 'مسیر هوا و خروج دود بازتر؛ قدرت در دور بالا.', effectsFa: ['گشتاور +۱۱٪', 'دور بیشینه +۱۲۰'] },
    { tier: 3, nameFa: 'پکیج کامل موتور', descFa: 'هماهنگی کامل موتور و نرم‌افزار برای بیشترین خروجی مطمئن.', effectsFa: ['گشتاور +۱۷٪', 'دور بیشینه +۳۶۰'] },
  ],
  transmission: [
    { tier: 1, nameFa: 'روغن و بوش', descFa: 'تعویض سریع‌تر و دقیق‌تر، بدون تغییر نسبت‌ها.', effectsFa: ['زمان تعویض −۸٪'] },
    { tier: 2, nameFa: 'نسبت‌های کوتاه', descFa: 'شتاب بهتر در دنده‌های پایین؛ سرعت نهایی کمی کمتر.', effectsFa: ['زمان تعویض −۱۶٪'] },
    { tier: 3, nameFa: 'گیربکس مسابقه', descFa: 'تعویض سریع و نسبت‌های هماهنگ با موتور تیون‌شده.', effectsFa: ['زمان تعویض −۲۴٪'] },
  ],
  clutch: [
    { tier: 1, nameFa: 'صفحهٔ تقویت‌شده', descFa: 'تحمل گشتاور بیشتر بدون لرزش.', effectsFa: ['ظرفیت +۱۲٪', 'پنجرهٔ درگیری بازتر'] },
    { tier: 2, nameFa: 'کلاچ مسابقه', descFa: 'درگیری محکم‌تر برای پرتاب‌های سریع.', effectsFa: ['ظرفیت +۲۴٪'] },
    { tier: 3, nameFa: 'کلاچ چندصفحه‌ای', descFa: 'ظرفیت بالا برای موتورهای تیون‌شده.', effectsFa: ['ظرفیت +۳۶٪'] },
  ],
  tires: [
    { tier: 1, nameFa: 'لاستیک جاده‌ای نو', descFa: 'ترکیب تازه با چسبندگی پایدار.', effectsFa: ['چسبندگی +۴٫۵٪'] },
    { tier: 2, nameFa: 'لاستیک اسپرت', descFa: 'دیوارهٔ سخت‌تر و آج کم‌عمق‌تر.', effectsFa: ['چسبندگی +۹٪'] },
    { tier: 3, nameFa: 'لاستیک نیمه‌اسلیک', descFa: 'چسبندگی خشک بالا؛ روی گِل و ماسه ضعیف‌تر.', effectsFa: ['چسبندگی +۱۳٫۵٪'] },
  ],
  suspension: [
    { tier: 1, nameFa: 'کمک‌فنر تازه', descFa: 'کنترل بهتر بدنه بدون سخت شدن زیاد.', effectsFa: ['فرکانس +۹٪'] },
    { tier: 2, nameFa: 'کیت اسپرت', descFa: 'فنر کوتاه‌تر و میرایی دقیق‌تر.', effectsFa: ['فرکانس +۱۸٪', 'کورس کمتر'] },
    { tier: 3, nameFa: 'تعلیق قابل تنظیم', descFa: 'بهترین کنترل فرود؛ روی سنگ و شخم سخت‌تر.', effectsFa: ['فرکانس +۲۷٪', 'میرایی +۱۲٪'] },
  ],
  brakes: [
    { tier: 1, nameFa: 'لنت و دیسک نو', descFa: 'ترمز قوی‌تر و پایداری بیشتر در گرمای متوسط.', effectsFa: ['گشتاور ترمز +۱۲٪'] },
    { tier: 2, nameFa: 'دیسک تهویه‌دار', descFa: 'افت کمتر در ترمزهای پشت‌سرهم.', effectsFa: ['گشتاور ترمز +۲۴٪'] },
    { tier: 3, nameFa: 'ترمز مسابقه', descFa: 'حداکثر توان ترمز با کنترل ABS موجود.', effectsFa: ['گشتاور ترمز +۳۶٪'] },
  ],
  weight: [
    { tier: 1, nameFa: 'حذف تجهیزات اضافه', descFa: 'صندلی عقب و عایق‌های غیرضروری.', effectsFa: ['وزن −۹ کیلوگرم'] },
    { tier: 2, nameFa: 'پنل‌های سبک', descFa: 'کاپوت و درها سبک‌تر؛ صدای کابین بیشتر.', effectsFa: ['وزن −۱۸ کیلوگرم'] },
    { tier: 3, nameFa: 'پکیج کاهش وزن', descFa: 'شیشه و تجهیزات سبک؛ بیشترین اثر روی شتاب.', effectsFa: ['وزن −۲۷ کیلوگرم'] },
  ],
  differential: [
    { tier: 1, nameFa: 'دیفرانسیل LSD', descFa: 'نیرو بهتر بین دو چرخ محرک تقسیم می‌شود.', effectsFa: ['چسبندگی محرک +۱٫۸٪'] },
    { tier: 2, nameFa: 'LSD صفحه‌ای', descFa: 'قفل‌شونده‌تر در خروج از پیچ و شیب.', effectsFa: ['چسبندگی محرک +۳٫۶٪'] },
    { tier: 3, nameFa: 'دیفرانسیل قفل‌شونده', descFa: 'حداکثر انتقال نیرو؛ در سرعت بالا کمی ناپایدار.', effectsFa: ['چسبندگی محرک +۵٫۴٪'] },
  ],
};

export interface UpgradeCompatibility {
  ok: boolean;
  reasonFa?: string;
}

export function isUpgradeCompatible(
  car: CarProfile,
  category: UpgradeCategory,
): UpgradeCompatibility {
  if (category === 'clutch' && car.transmission !== 'manual') {
    return { ok: false, reasonFa: 'این خودرو کلاچ پدالی ندارد؛ جعبهٔ خودکار است.' };
  }
  if (category === 'transmission' && car.auto?.kind === 'cvt') {
    return { ok: false, reasonFa: 'جعبهٔ CVT نسبت ثابت ندارد؛ کیت نسبت‌ها روی آن بسته نمی‌شود.' };
  }
  return { ok: true };
}

export function partPrice(
  category: UpgradeCategory,
  tier: number,
  car: CarProfile,
): number {
  const costs = UPGRADE_COSTS[category];
  const base = costs[Math.min(Math.max(tier, 1), costs.length) - 1] ?? costs[0] ?? 0;
  const carFactor = 1 + Math.min(1.4, car.priceCredits / 120000);
  return Math.round((base * carFactor) / 100) * 100;
}

export function nextUpgradeCost(
  car: CarProfile,
  category: UpgradeCategory,
  currentLevel: number,
): number | null {
  if (currentLevel >= 3) return null;
  return partPrice(category, currentLevel + 1, car);
}

/** Half of the installed tier's price is returned when a part is removed. */
export function upgradeRefund(
  car: CarProfile,
  category: UpgradeCategory,
  currentLevel: number,
): number {
  if (currentLevel <= 0) return 0;
  return Math.round(partPrice(category, currentLevel, car) * 0.5);
}

export function emptyUpgrades(): CarUpgrades {
  return {
    engine: 0,
    transmission: 0,
    clutch: 0,
    tires: 0,
    suspension: 0,
    brakes: 0,
    weight: 0,
    differential: 0,
  };
}

/** Clamp levels and zero out parts the car cannot physically take. */
export function sanitizeUpgrades(
  car: CarProfile,
  raw: Partial<CarUpgrades> | undefined,
): CarUpgrades {
  const out = emptyUpgrades();
  if (!raw) return out;
  for (const def of UPGRADE_CATEGORIES) {
    const level = Math.min(3, Math.max(0, Math.floor(Number(raw[def.id] ?? 0)) || 0));
    out[def.id] = isUpgradeCompatible(car, def.id).ok ? level : 0;
  }
  return out;
}

export interface PerformanceStats {
  powerHp: number;
  torqueNm: number;
  massKg: number;
  grip: number;
  brakingNm: number;
  acceleration: number;
  topSpeedKph: number;
}

export function performanceStats(
  car: CarProfile,
  upgrades: CarUpgrades,
  setup: CarSetup = DEFAULT_SETUP,
  condition: CarCondition = DEFAULT_CONDITION,
): PerformanceStats {
  const resolved = resolveCar(car, upgrades, setup, condition);
  // Both figures come from the tuned torque curve the engine actually consumes,
  // so the garage numbers cannot drift away from the simulation.
  const torqueNm = resolved.engine.torqueCurve.reduce((m, p) => Math.max(m, p.nm), 0);
  const peakPowerHp = resolved.engine.torqueCurve.reduce(
    (m, p) => Math.max(m, (p.nm * p.rpm) / 7127),
    0,
  );
  const powerHp = Math.round(peakPowerHp);
  const massKg = Math.round(resolved.numbers.massKg);
  const grip = resolved.numbers.tireGrip;
  const brakingNm = Math.round(
    resolved.numbers.brakeTorqueFrontNm + resolved.numbers.brakeTorqueRearNm,
  );
  const acceleration = (torqueNm * car.gearbox.gears[0]! * car.gearbox.finalDrive) / massKg;
  return {
    powerHp,
    torqueNm: Math.round(torqueNm),
    massKg,
    grip,
    brakingNm,
    acceleration,
    topSpeedKph: car.specs.topSpeedKph,
  };
}

/** Installed tier names for the garage/upgrade header. */
export function installedSummary(
  car: CarProfile,
  upgrades: CarUpgrades,
): { labelFa: string; level: number }[] {
  return UPGRADE_CATEGORIES.map((def) => ({
    labelFa: def.labelFa,
    level: upgrades[def.id],
  }));
}

export function upgradeLabel(category: UpgradeCategory): string {
  return UPGRADE_LABELS_FA[category];
}

export interface PaintOption {
  id: PaintId;
  labelFa: string;
  swatch: string;
  price: number;
}

export const PAINT_OPTIONS: readonly PaintOption[] = [
  { id: 'stock', labelFa: 'رنگ کارخانه', swatch: '#8d959e', price: 0 },
  { id: 'amber', labelFa: 'کهربایی', swatch: PAINT_COLORS.amber.body, price: 0 },
  { id: 'graphite', labelFa: 'گرافیتی', swatch: PAINT_COLORS.graphite.body, price: 0 },
  { id: 'cream', labelFa: 'شیری', swatch: PAINT_COLORS.cream.body, price: 0 },
  { id: 'racing', labelFa: 'قرمز مسابقه', swatch: PAINT_COLORS.racing.body, price: 0 },
];

export interface RimOption {
  id: RimId;
  labelFa: string;
  price: number;
}

export const RIM_OPTIONS: readonly RimOption[] = [
  { id: 'stock', labelFa: 'رینگ کارخانه', price: 0 },
  { id: 'sport', labelFa: 'رینگ اسپرت', price: 0 },
  { id: 'mesh', labelFa: 'رینگ مش', price: 0 },
];

export function resolveWith(
  car: CarProfile,
  upgrades: CarUpgrades,
  condition: CarCondition,
  cosmetics: CarCosmetics = DEFAULT_COSMETICS,
): ResolvedCar {
  return resolveCar(car, upgrades, DEFAULT_SETUP, condition, cosmetics);
}
