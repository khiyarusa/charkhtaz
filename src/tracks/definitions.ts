import { TrackBuilder } from './builder';
import type { TrackDefinition } from './types';

/**
 * Six hand-authored routes across four Iranian-inspired biomes.
 *
 * These are original, fictionalised routes inspired by Iranian landscapes —
 * they are not surveyed reproductions of real roads.
 */

const jajrudPass = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'asphalt-dry');
  b.flat(60);
  b.hill(55, 7);
  b.slope(3.5, 40);
  b.flat(30, 'asphalt-wet');
  b.rock(0.7, b.cursorX + 12);
  b.flat(24);
  b.ramp(16, 3.4);
  b.gap(10);
  b.flat(46);
  b.slope(-4.5, 50, 'gravel');
  b.whoops(4, 34, 0.5);
  b.flat(30);
  b.hill(44, 5);
  b.flat(26);
  b.tires(0.6, b.cursorX + 16);
  b.flat(40);
  b.hill(38, -3);
  b.flat(55);
  b.scenery(10, 600, ['rock', 'shrub', 'sign', 'bush']);
  return b.build({
    id: 'jajrud-pass',
    nameFa: 'گردنهٔ جاجرود',
    nameEn: 'Jajrud Pass',
    regionFa: 'البرز مرکزی',
    descriptionFa:
      'آسفالت کوهستانی با شیب‌های طولانی، یک پرش سنگی و پیچ‌های تند. ترمز دیرهنگام، پایانِ کار است.',
    biome: 'mountain',
    difficulty: 3,
    seed: 1101,
    checkpointEveryM: 120,
  });
};

const lutDunes = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'sand');
  b.flat(55, 'asphalt-dry');
  b.patch(28, 'sand');
  b.hill(60, 4.5, 'sand');
  b.dip(40, 2.5, 'sand');
  b.flat(30, 'gravel');
  b.rock(0.9, b.cursorX + 14);
  b.flat(20);
  b.whoops(3, 30, 0.65, 'sand');
  b.flat(24);
  b.ramp(18, 2.6, 'gravel');
  b.gap(11);
  b.flat(40, 'sand');
  b.hill(50, 6, 'sand');
  b.flat(30);
  b.log(0.3, b.cursorX + 10);
  b.flat(60);
  b.scenery(0, 520, ['rock', 'bush', 'sign']);
  return b.build({
    id: 'lut-dunes',
    nameFa: 'تلماسه‌های لوت',
    nameEn: 'Lut Dunes',
    regionFa: 'کویر لوت',
    descriptionFa:
      'ماسهٔ نرم، تپه‌های بلند و پرش‌های خشک. گاز زیاد روی ماسه فقط چرخ را می‌چرخاند؛ نرم و پیوسته گاز بده.',
    biome: 'desert',
    difficulty: 4,
    seed: 2202,
    checkpointEveryM: 110,
  });
};

const hyrcanianMud = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'dirt');
  b.flat(50, 'asphalt-dry');
  b.patch(40, 'mud');
  b.hill(55, 3.5, 'mud');
  b.flat(26, 'dirt');
  b.log(0.32, b.cursorX + 12);
  b.flat(20, 'mud');
  b.whoops(5, 38, 0.45, 'dirt');
  b.flat(24);
  b.rock(0.65, b.cursorX + 12);
  b.flat(30, 'mud');
  b.ramp(14, 2.2, 'dirt');
  b.gap(7);
  b.flat(46, 'dirt');
  b.hill(40, 4.5, 'mud');
  b.flat(40);
  b.scenery(0, 480, ['tree', 'tree', 'bush', 'grass', 'rock']);
  return b.build({
    id: 'hyrcanian-mud',
    nameFa: 'جنگل هیرکانی',
    nameEn: 'Hyrcanian Forest',
    regionFa: 'شمال ایران',
    descriptionFa:
      'گِل، ریشه و مه. چسبندگی کم است؛ کلاچ را آهسته رها کن و از چرخش بی‌مهار جلوگیری کن.',
    biome: 'forest',
    difficulty: 4,
    seed: 3303,
    checkpointEveryM: 100,
  });
};

const tehranIndustrial = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'asphalt-dry');
  b.flat(55);
  b.slope(0, 30);
  b.block(0.6, 1.1, b.cursorX + 20);
  b.flat(30);
  b.patch(25, 'asphalt-wet');
  b.hill(40, 2.2);
  b.flat(35);
  b.ramp(12, 1.8, 'asphalt-dry');
  b.gap(6);
  b.flat(30);
  b.tires(0.65, b.cursorX + 14);
  b.flat(20);
  b.tires(0.65, b.cursorX + 10);
  b.flat(40);
  b.hill(30, 3);
  b.flat(50);
  b.scenery(0, 480, ['pole', 'sign', 'crack', 'bush']);
  return b.build({
    id: 'tehran-industrial',
    nameFa: 'کمربندی جنوبی',
    nameEn: 'Southern Ring',
    regionFa: 'تهران',
    descriptionFa:
      'آسفالت شهری، بلوک‌های بتنی و مسیر باریک بین توده‌های لاستیک. سرعت بالا، حاشیهٔ خطای کم.',
    biome: 'urban',
    difficulty: 2,
    seed: 4404,
    checkpointEveryM: 100,
  });
};

const zagrosClimb = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'rock');
  b.flat(40, 'dirt');
  b.slope(9, 45, 'rock');
  b.flat(20, 'rock');
  b.rock(1.0, b.cursorX + 12);
  b.flat(20, 'dirt');
  b.slope(11, 40, 'rock');
  b.flat(20);
  b.whoops(6, 30, 0.4, 'rock');
  b.flat(20);
  b.rock(0.85, b.cursorX + 10);
  b.flat(16);
  b.rock(0.7, b.cursorX + 8);
  b.flat(25);
  b.slope(-12, 55, 'dirt');
  b.flat(45);
  b.scenery(0, 420, ['rock', 'rock', 'sign', 'shrub']);
  return b.build({
    id: 'zagros-climb',
    nameFa: 'صعود زاگرس',
    nameEn: 'Zagros Climb',
    regionFa: 'زاگرس',
    descriptionFa:
      'شیب‌های سنگین سنگ و خاک. دندهٔ یک، کلاچ نیمه‌درگیر و گاز ثابت؛ بدون توقف، بدون هرزگردی.',
    biome: 'mountain',
    difficulty: 5,
    seed: 5505,
    checkpointEveryM: 90,
  });
};

const kavirDash = (): TrackDefinition => {
  const b = new TrackBuilder(0, 0, 'asphalt-dry');
  b.flat(70);
  b.ramp(20, 3.0);
  b.gap(14);
  b.flat(50, 'gravel');
  b.ramp(18, 2.4);
  b.gap(16);
  b.flat(45, 'sand');
  b.hill(50, 3.2, 'gravel');
  b.flat(30);
  b.whoops(2, 24, 1.1, 'sand');
  b.flat(30);
  b.ramp(22, 3.6);
  b.gap(20);
  b.flat(70, 'gravel');
  b.scenery(0, 560, ['rock', 'sign', 'bush']);
  return b.build({
    id: 'kavir-dash',
    nameFa: 'دشت کویر',
    nameEn: 'Kavir Dash',
    regionFa: 'کویر مرکزی',
    descriptionFa:
      'سه پرش بلند پشت‌سرهم. سرعت ورودی را بسنج؛ کم بودن سرعت یعنی سقوط در گودال، زیاد بودن یعنی فرود سخت.',
    biome: 'desert',
    difficulty: 5,
    seed: 6606,
    checkpointEveryM: 120,
  });
};

export const TRACKS: readonly TrackDefinition[] = [
  tehranIndustrial(),
  jajrudPass(),
  hyrcanianMud(),
  lutDunes(),
  zagrosClimb(),
  kavirDash(),
];

export function getTrack(id: string): TrackDefinition {
  const t = TRACKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown track: ${id}`);
  return t;
}

export const BIOME_LABELS_FA: Record<TrackDefinition['biome'], string> = {
  mountain: 'کوهستان',
  desert: 'کویر',
  forest: 'جنگل',
  urban: 'شهری',
};
