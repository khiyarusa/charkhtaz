import './styles.css';
import './overhaul.css';
import {
  ALL_CARS,
  carDisplayName,
  getAnyCar,
} from '../vehicles/registry';
import {
  DEFAULT_CONDITION,
  DEFAULT_SETUP,
  DEFAULT_COSMETICS,
  PAINT_COLORS,
  resolveCar,
  type CarCondition,
  type CarCosmetics,
  type CarProfile,
  type CarUpgrades,
  type ResolvedCar,
} from '../vehicles/profiles';
import {
  PAINT_OPTIONS,
  RIM_OPTIONS,
  UPGRADE_CATEGORIES,
  UPGRADE_PARTS,
  emptyUpgrades,
  isUpgradeCompatible,
  nextUpgradeCost,
  performanceStats,
  sanitizeUpgrades,
  upgradeRefund,
  type UpgradeCategory,
} from '../vehicles/upgrades';
import { TRACKS, BIOME_LABELS_FA, getTrack } from '../tracks/definitions';
import type { TrackDefinition } from '../tracks/types';
import { GameScene, type GameMode, type OpponentSpec, type RaceResult } from '../game/scene';
import { PedalControls } from '../controls/pedals';
import {
  loadSave,
  saveGame,
  resetSave,
  conditionFor,
  cosmeticsFor,
  upgradesFor,
  levelFromXp,
  xpForLevel,
  type Medal,
  type SaveData,
} from '../save/storage';
import {
  CAREER_EVENTS,
  TRIAL_BRONZE,
  TRIAL_GOLD,
  TRIAL_SILVER,
  eventStates,
  getCareerEvent,
  medalAtLeast,
  medalForTime,
  medalThresholds,
  type CareerEvent,
} from '../career/career';
import {
  ACHIEVEMENTS,
  claimReward,
  computeReward,
  evaluateAchievements,
  medalLabel,
  type RewardBreakdown,
} from '../career/economy';
import { GameAudio } from '../audio';
import { faFixed, faGroup, faNum, formatTime, gearLabel } from '../core/format';
import { clamp01 } from '../core/math';
import { drawCarBody, drawWheel } from '../render/vehicle-art';
import { blueprintFor } from '../vehicles/art';
import { BIOME_PALETTES } from '../render/palettes';
import { GAME_VERSION } from '../core/build-info';

type ScreenName = 'home' | 'profile' | 'career' | 'garage' | 'upgrades' | 'tracks' | 'settings' | 'game';

const MODE_LABELS: Record<GameMode, string> = {
  race: 'مسابقهٔ سریع',
  time: 'رکورد زمانی',
  trial: 'مسیر مانع',
  practice: 'تمرین آزاد',
};

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  race: 'با دو تا سه حریف واقعی روی همان فیزیک، از خط شروع تا خط پایان.',
  time: 'بدون حریف؛ فقط تو، زمان و شبح بهترین اجرای قبلی.',
  trial: 'مسیر سخت با امتیاز، جریمه و مدال. مهارت مهم‌تر از سرعت خام است.',
  practice: 'بدون فشار زمان و بدون جریمه؛ برای یاد گرفتن کلاچ و کنترل گاز.',
};

const DRIVER_NAMES = ['آرش', 'نگار', 'سامان', 'هستی'];

function qs<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function carSubtitle(car: CarProfile): string {
  return `${car.brandFa} ${car.modelFa} · ${faNum(car.year)} · ${car.transmissionFa}`;
}

function paintFor(car: CarProfile, cosmetics: CarCosmetics): string {
  if (cosmetics.paint !== 'stock') return PAINT_COLORS[cosmetics.paint].body;
  return car.art.bodyColor;
}

export class App {
  private save: SaveData;
  private screen: ScreenName = 'home';
  private mode: GameMode = 'race';
  private selectedCarId: string;
  private selectedTrackId: string;
  private upgradeCategory: UpgradeCategory = 'engine';
  private activeEvent: CareerEvent | null = null;
  private scene: GameScene | null = null;
  private pedals: PedalControls | null = null;
  private readonly audio: GameAudio;
  private raf = 0;
  private lastFrame = 0;
  private hudEls: {
    timer: HTMLElement;
    speed: HTMLElement;
    gear: HTMLElement;
    rpmRing: HTMLElement;
    rpm: HTMLElement;
    hint: HTMLElement;
    count: HTMLElement;
    toast: HTMLElement;
    pips: HTMLElement;
    gearSelect: HTMLElement;
    position: HTMLElement;
  } | null = null;
  private pips: HTMLElement[] = [];
  private gearButtons: HTMLButtonElement[] = [];
  private countdownHideAt = 0;
  private toastTimer = 0;
  private standingsEl: HTMLElement | null = null;
  private resultHandled = false;
  private resizeHandler = () => this.scene?.resize();

  constructor(private readonly root: HTMLElement) {
    this.save = loadSave();
    this.selectedCarId = this.save.lastCarId;
    this.selectedTrackId = this.save.lastTrackId;
    this.audio = new GameAudio();
    this.audio.setMuted(!this.save.settings.audio);
    this.audio.setVolume(this.save.settings.volume);
    this.applyMotionPreference();
    const unlock = () => {
      void this.audio.unlock();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('keydown', this.onGlobalKey);
    this.showHome();
  }

  // --------------------------------------------------------------- common --
  private commit(next: SaveData): void {
    this.save = next;
    saveGame(next);
  }

  private topbar(): string {
    const level = levelFromXp(this.save.profile.xp);
    const navItem = (screen: ScreenName, label: string) =>
      `<button class="nav__item ${this.screen === screen ? 'is-active' : ''}" data-nav="${screen}">${label}</button>`;
    return `
      <header class="topbar">
        <button class="brand" data-nav="home" aria-label="چرخ‌تاز">
          <img class="brand__pumpkin" src="/brand/pumpkin-emblem.svg" alt="" />
          <span>
            <span class="brand__name">چرخ‌تاز</span>
            <span class="brand__latin">CHARKHTAZ · RACE · SHIFT · CONQUER</span>
          </span>
        </button>
        <nav class="nav">
          ${navItem('home', 'خانه')}
          ${navItem('career', 'کریر')}
          ${navItem('garage', 'گاراژ')}
          ${navItem('profile', 'پروفایل')}
          ${navItem('settings', 'تنظیمات')}
        </nav>
        <div class="topbar__right">
          <span class="chip chip--amber" title="اعتبار">${faGroup(this.save.credits)} اعتبار</span>
          <span class="chip">سطح ${faNum(level)}</span>
        </div>
      </header>
    `;
  }

  private shell(content: string): string {
    return `<div class="screen">${this.topbar()}<main class="page">${content}</main></div>`;
  }

  private bindCommon(): void {
    window.scrollTo(0, 0);
    this.root.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => this.navigate(el.dataset.nav as ScreenName));
    });
    this.root.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
      el.addEventListener('click', () => this.handleAction(el.dataset.action ?? '', el));
    });
  }

  private navigate(screen: ScreenName): void {
    if (screen === 'game') return;
    this.teardownGame();
    if (screen === 'home') this.showHome();
    else if (screen === 'profile') this.showProfile();
    else if (screen === 'career') this.showCareer();
    else if (screen === 'garage') this.showGarage();
    else if (screen === 'upgrades') this.showUpgrades();
    else if (screen === 'tracks') this.showTracks(this.mode);
    else if (screen === 'settings') this.showSettings();
  }

  private handleAction(action: string, el: HTMLElement): void {
    if (action === 'mode') {
      this.mode = (el.dataset.mode as GameMode) ?? 'race';
      this.showTracks(this.mode);
    } else if (action === 'start-selected') {
      this.startGame(this.mode);
    } else if (action === 'quick-race') {
      this.mode = 'race';
      this.showTracks('race');
    } else if (action === 'career') {
      this.showCareer();
    } else if (action === 'garage') {
      this.showGarage();
    } else if (action === 'upgrades') {
      this.showUpgrades();
    } else if (action === 'settings') {
      this.showSettings();
    } else if (action === 'profile') {
      this.showProfile();
    } else if (action === 'select-car') {
      this.selectCar(el.dataset.car ?? this.selectedCarId);
    } else if (action === 'buy-car') {
      this.buyCar(el.dataset.car ?? this.selectedCarId);
    } else if (action === 'buy-upgrade') {
      this.buyUpgrade(el.dataset.category as UpgradeCategory);
    } else if (action === 'unequip-upgrade') {
      this.removeUpgrade(el.dataset.category as UpgradeCategory);
    } else if (action === 'reset-upgrades') {
      this.resetUpgrades();
    } else if (action === 'repair') {
      this.repairCar();
    } else if (action === 'set-category') {
      this.upgradeCategory = (el.dataset.category as UpgradeCategory) ?? 'engine';
      this.showUpgrades();
    } else if (action === 'set-paint') {
      this.setCosmetics({ paint: el.dataset.paint as CarCosmetics['paint'] });
    } else if (action === 'set-rims') {
      this.setCosmetics({ rims: el.dataset.rims as CarCosmetics['rims'] });
    } else if (action === 'start-event') {
      this.startCareerEvent(el.dataset.event ?? '');
    } else if (action === 'test-drive') {
      this.mode = 'practice';
      this.startGame('practice', { carId: this.selectedCarId });
    } else if (action === 'edit-name') {
      this.editName();
    } else if (action === 'set-mode') {
      this.mode = (el.dataset.mode as GameMode) ?? 'race';
      this.showTracks(this.mode);
    } else if (action === 'reset-save') {
      if (window.confirm('همهٔ پیشرفت، اعتبار و تنظیمات پاک شود؟')) {
        resetSave();
        this.save = loadSave();
        this.showHome();
      }
    }
  }

  // ----------------------------------------------------------------- home --
  private showHome(): void {
    this.teardownGame();
    this.screen = 'home';
    const car = getAnyCar(this.selectedCarId);
    const upcoming = eventStates(this.save).find((s) => s.unlocked && !s.completed)?.event;
    this.root.innerHTML = `
      <div class="screen">
        ${this.topbar()}
        <main class="home">
          <section class="hero">
            <div class="hero__copy">
              <div class="hero__kicker">بازی مسابقه‌ای دوبعدی · ایران</div>
              <div class="hero__title-row">
                <img class="hero__pumpkin" src="/brand/pumpkin-emblem.svg" alt="نشان چرخ‌تاز" />
                <h1>چرخ‌تاز</h1>
              </div>
              <p>
                سه اهرم آنالوگ، ماشین واقعی و جاده‌ای که بخشش نمی‌کند. گاز، ترمز و کلاچ را
                با انگشت وزن کن؛ آنچه می‌بینی نتیجهٔ همان اعداد است، نه یک انیمیشن آماده.
              </p>
              <div class="hero__actions">
                <button class="btn btn--primary" data-action="quick-race">شروع مسابقه</button>
                <button class="btn btn--ghost" data-action="career">ادامهٔ کریر</button>
                <button class="btn btn--ghost" data-action="garage">گاراژ</button>
              </div>
              <div class="hero__meta">
                <div class="meta"><div class="meta__value">${faNum(ALL_CARS.length)}</div><div class="meta__label">خودروی واقعی</div></div>
                <div class="meta"><div class="meta__value">${faNum(TRACKS.length)}</div><div class="meta__label">مسیر</div></div>
                <div class="meta"><div class="meta__value">${faNum(8)}</div><div class="meta__label">دستهٔ ارتقا</div></div>
              </div>
            </div>
            <div class="hero__car">
              <canvas class="js-car-preview" width="700" height="300"></canvas>
              <div class="hero__car-name">
                <strong>${car.brandFa} ${car.modelFa}</strong>
                <span>${faNum(car.year)} · ${car.trim}</span>
              </div>
              <div class="hero__car-specs">
                <div><span>قدرت</span><strong>${faNum(car.specs.powerHp)} اسب</strong></div>
                <div><span>گشتاور</span><strong>${faNum(car.specs.torqueNm)} نیوتون</strong></div>
                <div><span>گیربکس</span><strong>${car.transmission === 'manual' ? 'دستی' : 'خودکار'}</strong></div>
              </div>
            </div>
          </section>

          <section class="profile-strip">
            <div class="avatar">${this.save.profile.name.slice(0, 2)}</div>
            <div class="profile-strip__info">
              <strong>${this.save.profile.name}</strong>
              <span>سطح ${faNum(levelFromXp(this.save.profile.xp))} · ${faGroup(this.save.credits)} اعتبار · ${faNum(this.save.ownedCars.length)} خودرو</span>
              <div class="xpbar"><i style="width:${this.xpPercent()}%"></i></div>
            </div>
            <button class="btn btn--ghost btn--sm" data-action="profile">پروفایل و دستاوردها</button>
          </section>

          <section>
            <div class="section-title"><h2>حالت بازی</h2><p>همه‌چیز آفلاین و روی همین دستگاه</p></div>
            <div class="mode-grid">
              ${(['race', 'time', 'trial', 'practice'] as GameMode[]).map((mode) => `
                <button class="mode" data-action="mode" data-mode="${mode}">
                  <span class="mode__icon">${icon(mode === 'race' ? 'flag' : mode === 'time' ? 'clock' : mode === 'trial' ? 'medal' : 'wheel')}</span>
                  <strong>${MODE_LABELS[mode]}</strong>
                  <span>${MODE_DESCRIPTIONS[mode]}</span>
                </button>`).join('')}
            </div>
          </section>

          <section class="home-grid">
            <div class="panel">
              <div class="section-title"><h2>رویداد بعدی کریر</h2><button class="btn btn--ghost btn--sm" data-action="career">همهٔ رویدادها</button></div>
              ${upcoming ? `
                <div class="event-card event-card--compact">
                  <div>
                    <div class="hint">${upcoming.chapterFa}</div>
                    <h3>${upcoming.titleFa}</h3>
                    <p>${upcoming.briefingFa}</p>
                  </div>
                  <button class="btn btn--primary btn--sm" data-action="start-event" data-event="${upcoming.id}">شروع</button>
                </div>` : `<p class="hint">همهٔ رویدادها تمام شده‌اند.</p>`}
            </div>
            <div class="panel">
              <div class="section-title"><h2>ماشین انتخابی</h2><button class="btn btn--ghost btn--sm" data-action="upgrades">ارتقا و تیونینگ</button></div>
              <div class="panel__car-row">
                <div>
                  <h3>${carDisplayName(car)}</h3>
                  <p class="hint">${carSubtitle(car)}</p>
                  <div class="chip-row">
                    <span class="chip">${car.layout}</span>
                    <span class="chip">${car.bodyStyleFa}</span>
                    <span class="chip chip--amber">${faGroup(this.save.credits)} اعتبار</span>
                  </div>
                </div>
                <button class="btn btn--ghost btn--sm" data-action="garage">تغییر خودرو</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;
    this.bindCommon();
    this.paintCarPreview(qs<HTMLCanvasElement>(this.root, '.js-car-preview'), car, this.selectedCarId);
  }

  // -------------------------------------------------------------- profile --
  private showProfile(): void {
    this.teardownGame();
    this.screen = 'profile';
    const level = levelFromXp(this.save.profile.xp);
    const nextXp = xpForLevel(level + 1);
    const unlocked = ACHIEVEMENTS.filter((a) => this.save.profile.achievements.includes(a.id));
    const medals = Object.values(this.save.career.medals);
    this.root.innerHTML = this.shell(`
      <div class="page__head">
        <div><h1>پروفایل راننده</h1><p>پیشرفت، دستاوردها و کلکسیون؛ همه محلی.</p></div>
        <button class="btn btn--ghost" data-action="home">خانه</button>
      </div>
      <section class="profile-hero">
        <div class="avatar avatar--xl">${this.save.profile.name.slice(0, 2)}</div>
        <div class="profile-hero__info">
          <div class="profile-hero__name">
            <h2>${this.save.profile.name}</h2>
            <button class="btn btn--ghost btn--sm" data-action="edit-name">تغییر نام</button>
          </div>
          <div class="hint">سطح ${faNum(level)} · ${faGroup(this.save.profile.xp)} تجربه</div>
          <div class="xpbar xpbar--large"><i style="width:${this.xpPercent()}%"></i></div>
          <div class="hint">تا سطح ${faNum(level + 1)}: ${faGroup(Math.max(0, nextXp - this.save.profile.xp))} تجربه</div>
        </div>
        <div class="profile-hero__stats">
          <div class="result"><div class="result__label">مسابقه‌ها</div><div class="result__value">${faNum(this.save.racesFinished)}</div></div>
          <div class="result"><div class="result__label">مدال‌ها</div><div class="result__value">${faNum(medals.filter((m) => m === 'gold').length)}<small> طلایی</small></div></div>
          <div class="result"><div class="result__label">اعتبار</div><div class="result__value">${faGroup(this.save.credits)}</div></div>
          <div class="result"><div class="result__label">خودرو</div><div class="result__value">${faNum(this.save.ownedCars.length)}/${faNum(ALL_CARS.length)}</div></div>
        </div>
      </section>

      <div class="section-title"><h2>دستاوردها</h2><p>${faNum(unlocked.length)} از ${faNum(ACHIEVEMENTS.length)}</p></div>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.map((a) => {
          const on = this.save.profile.achievements.includes(a.id);
          return `<div class="achievement ${on ? 'is-on' : ''}">
            <span class="achievement__mark">${on ? '✓' : '•'}</span>
            <div><strong>${a.titleFa}</strong><span>${a.descFa}</span></div>
          </div>`;
        }).join('')}
      </div>

      <div class="section-title"><h2>کلکسیون</h2><button class="btn btn--ghost btn--sm" data-action="garage">گاراژ</button></div>
      <div class="collection">
        ${ALL_CARS.map((car) => {
          const owned = this.save.ownedCars.includes(car.id);
          return `<div class="collection__item ${owned ? 'is-owned' : ''}">
            <strong>${carDisplayName(car)}</strong>
            <span>${owned ? carSubtitle(car) : `خرید: ${faGroup(car.priceCredits)} اعتبار`}</span>
          </div>`;
        }).join('')}
      </div>
    `);
    this.bindCommon();
  }

  private xpPercent(): number {
    const level = levelFromXp(this.save.profile.xp);
    const floor = xpForLevel(level);
    const ceil = xpForLevel(level + 1);
    return Math.max(2, Math.min(100, ((this.save.profile.xp - floor) / Math.max(1, ceil - floor)) * 100));
  }

  private editName(): void {
    const name = window.prompt('نام راننده (حداکثر ۲۴ نویسه)', this.save.profile.name);
    if (!name || !name.trim()) return;
    this.commit({ ...this.save, profile: { ...this.save.profile, name: name.trim().slice(0, 24) } });
    this.showProfile();
  }

  // --------------------------------------------------------------- career --
  private showCareer(): void {
    this.teardownGame();
    this.screen = 'career';
    const states = eventStates(this.save);
    const chapters = [...new Set(CAREER_EVENTS.map((e) => e.chapterFa))];
    this.root.innerHTML = this.shell(`
      <div class="page__head">
        <div><h1>کریر</h1><p>ده رویداد، از اولین تعویض دنده تا فینال کمربندی.</p></div>
        <button class="btn btn--ghost" data-action="home">خانه</button>
      </div>
      ${chapters.map((chapter) => `
        <div class="section-title"><h2>${chapter}</h2><p>${faNum(states.filter((s) => s.event.chapterFa === chapter && s.completed).length)} از ${faNum(states.filter((s) => s.event.chapterFa === chapter).length)}</p></div>
        <div class="career-list">
          ${states.filter((s) => s.event.chapterFa === chapter).map(({ event, unlocked, completed, medal }) => {
            const track = getTrack(event.trackId);
            const car = getAnyCar(event.carId);
            const thresholds = medalThresholds(track.lengthM, track.difficulty);
            return `<article class="event-card ${unlocked ? '' : 'is-locked'} ${completed ? 'is-complete' : ''}">
              <div class="event-card__head">
                <div>
                  <div class="hint">${event.chapterFa} · ${MODE_LABELS[event.mode]}</div>
                  <h3>${event.titleFa}</h3>
                  <p>${event.briefingFa}</p>
                </div>
                ${medal ? `<span class="medal medal--${medal}">${medalLabel(medal)}</span>` : completed ? '<span class="chip">کامل</span>' : unlocked ? '<span class="chip chip--amber">آماده</span>' : '<span class="chip">قفل</span>'}
              </div>
              <div class="event-card__meta">
                <span>${car.brandFa} ${car.modelFa}</span>
                <span>${track.nameFa}</span>
                <span>${faNum(event.opponents)} حریف</span>
                <span>جایزه: ${faGroup(event.rewards.credits)} اعتبار</span>
              </div>
              <div class="event-card__foot">
                <span class="hint">${event.mode === 'trial' ? `امتیاز: برنز ${faNum(TRIAL_BRONZE)} · نقره ${faNum(TRIAL_SILVER)} · طلا ${faNum(TRIAL_GOLD)}` : `زمان طلا: ${formatTime(thresholds.gold)} · نقره: ${formatTime(thresholds.silver)}`}</span>
                <button class="btn btn--primary btn--sm" data-action="start-event" data-event="${event.id}" ${unlocked ? '' : 'disabled'}>
                  ${completed ? 'تکرار' : unlocked ? 'شروع' : 'قفل'}
                </button>
              </div>
            </article>`;
          }).join('')}
        </div>`).join('')}
    `);
    this.bindCommon();
  }

  private startCareerEvent(id: string): void {
    const event = getCareerEvent(id);
    const state = eventStates(this.save).find((s) => s.event.id === id);
    if (!state?.unlocked) {
      this.toast('این رویداد هنوز قفل است');
      return;
    }
    this.activeEvent = event;
    this.selectedTrackId = event.trackId;
    this.selectedCarId = event.carId;
    this.mode = event.mode;
    this.startGame(event.mode, { carId: event.carId, trackId: event.trackId, event });
  }

  // --------------------------------------------------------------- garage --
  private showGarage(): void {
    this.teardownGame();
    this.screen = 'garage';
    const selected = getAnyCar(this.selectedCarId);
    const owned = this.save.ownedCars.includes(selected.id);
    const upgrades = sanitizeUpgrades(selected, upgradesFor(this.save, selected.id));
    const condition = conditionFor(this.save, selected.id);
    const cosmetics = cosmeticsFor(this.save, selected.id);
    const stats = performanceStats(selected, upgrades, DEFAULT_SETUP, condition);

    this.root.innerHTML = this.shell(`
      <div class="page__head">
        <div><h1>گاراژ</h1><p>هشت خودروی واقعی؛ هرکدام شخصیت مکانیکی و شکل خودش را دارد.</p></div>
        <button class="btn btn--ghost" data-action="home">خانه</button>
      </div>
      <div class="garage">
        ${ALL_CARS.map((car) => this.carCard(car)).join('')}
      </div>
      <section class="detail">
        <div class="detail__car">
          <canvas class="js-detail-car" width="900" height="340"></canvas>
          <div class="chip-row" style="margin-top:8px">
            <span class="chip">${selected.layout}</span>
            <span class="chip">${selected.bodyStyleFa}</span>
            <span class="chip">${selected.transmissionFa}</span>
            ${owned ? '' : `<span class="chip chip--amber">قیمت ${faGroup(selected.priceCredits)}</span>`}
          </div>
        </div>
        <div>
          <h2>${carDisplayName(selected)}</h2>
          <div class="hint">${carSubtitle(selected)} · ${selected.marketFa}</div>
          <p style="margin-top:12px">${selected.descriptionFa}</p>
          <div class="spec-grid" style="margin-top:16px">
            <div class="spec"><div class="spec__label">قدرت</div><div class="spec__value">${faNum(stats.powerHp)} اسب</div></div>
            <div class="spec"><div class="spec__label">گشتاور</div><div class="spec__value">${faNum(stats.torqueNm)} نیوتون</div></div>
            <div class="spec"><div class="spec__label">وزن</div><div class="spec__value">${faGroup(stats.massKg)} کیلو</div></div>
            <div class="spec"><div class="spec__label">چسبندگی</div><div class="spec__value">${faFixed(stats.grip, 2)}</div></div>
            <div class="spec"><div class="spec__label">ترمز</div><div class="spec__value">${faGroup(stats.brakingNm)} نیوتون‌متر</div></div>
            <div class="spec"><div class="spec__label">وضعیت</div><div class="spec__value">${faNum(Math.round(condition.body * 100))}٪</div></div>
          </div>
          <p class="hint" style="margin-top:12px;line-height:1.9">${selected.specs.sourceNoteFa}</p>
          <div class="button-row">
            ${owned
              ? `<button class="btn btn--primary" data-action="select-car" data-car="${selected.id}">انتخاب برای مسابقه</button>
                 <button class="btn btn--ghost" data-action="upgrades">ارتقا و تیونینگ</button>
                 <button class="btn btn--ghost" data-action="repair">تعمیرگاه</button>
                 <button class="btn btn--ghost" data-action="test-drive">تست رانندگی</button>`
              : `<button class="btn btn--primary" data-action="buy-car" data-car="${selected.id}">خرید ${faGroup(selected.priceCredits)} اعتباری</button>`}
          </div>
        </div>
      </section>
    `);
    this.bindCommon();
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('.js-car-mini')) {
      const id = canvas.dataset.car;
      if (id) this.paintCarPreview(canvas, getAnyCar(id), id);
    }
    this.paintCarPreview(qs<HTMLCanvasElement>(this.root, '.js-detail-car'), selected, selected.id);
    this.root.querySelectorAll<HTMLElement>('[data-pick-car]').forEach((el) => {
      el.addEventListener('click', () => this.selectCar(el.dataset.pickCar ?? ''));
    });
    void upgrades;
    void cosmetics;
  }

  private carCard(car: CarProfile): string {
    const selected = car.id === this.selectedCarId;
    const owned = this.save.ownedCars.includes(car.id);
    return `
      <button class="car-card ${selected ? 'is-selected' : ''} ${owned ? '' : 'is-locked'}" data-pick-car="${car.id}">
        <div class="car-card__head">
          <div>
            <div class="car-card__name">${car.brandFa} ${car.modelFa}</div>
            <div class="car-card__trim">${faNum(car.year)} · ${car.trim}</div>
          </div>
          <span class="badge">${owned ? car.layout : `${faGroup(car.priceCredits)}`}</span>
        </div>
        <canvas class="js-car-mini" data-car="${car.id}" width="620" height="210"></canvas>
        <div class="car-card__stats">
          ${this.statBar('قدرت', car.specs.powerHp / 400, `${faNum(car.specs.powerHp)} اسب`)}
          ${this.statBar('گشتاور', car.specs.torqueNm / 420, `${faNum(car.specs.torqueNm)} نیوتون`)}
          ${this.statBar('چسبندگی', car.numbers.tireGrip / 1.25, faFixed(car.numbers.tireGrip, 2))}
        </div>
      </button>
    `;
  }

  private statBar(label: string, ratio: number, value: string): string {
    const pct = Math.max(4, Math.min(100, ratio * 100));
    return `<div class="stat"><span>${label}</span><span class="stat__bar"><i style="width:${pct}%"></i></span><span class="stat__value">${value}</span></div>`;
  }

  private selectCar(id: string): void {
    const car = getAnyCar(id);
    if (!this.save.ownedCars.includes(car.id)) {
      this.toast('اول باید این خودرو را بخری');
      return;
    }
    this.selectedCarId = car.id;
    this.commit({ ...this.save, lastCarId: car.id });
    this.showGarage();
  }

  private buyCar(id: string): void {
    const car = getAnyCar(id);
    if (this.save.ownedCars.includes(car.id)) return;
    if (this.save.credits < car.priceCredits) {
      this.toast('اعتبار کافی نیست؛ اول مسابقه بده');
      return;
    }
    this.commit({
      ...this.save,
      credits: this.save.credits - car.priceCredits,
      ownedCars: [...this.save.ownedCars, car.id],
      lastCarId: car.id,
    });
    this.selectedCarId = id;
    this.toast(`${car.modelFa} به گاراژ اضافه شد`);
    this.showGarage();
  }

  private repairCar(): void {
    const id = this.selectedCarId;
    const car = getAnyCar(id);
    const condition = conditionFor(this.save, id);
    const cost = Math.round((1 - condition.body) * car.priceCredits * 0.02 + (1 - condition.engine) * 500 + 150);
    if (this.save.credits < cost) {
      this.toast('اعتبار کافی برای تعمیر نیست');
      return;
    }
    this.commit({
      ...this.save,
      credits: this.save.credits - cost,
      condition: { ...this.save.condition, [id]: { tires: 1, engine: 1, body: 1 } },
    });
    this.toast('خودرو تعمیر شد');
    this.showGarage();
  }

  // ------------------------------------------------------------- upgrades --
  private showUpgrades(): void {
    this.teardownGame();
    this.screen = 'upgrades';
    const car = getAnyCar(this.selectedCarId);
    const owned = this.save.ownedCars.includes(car.id);
    const levels = sanitizeUpgrades(car, upgradesFor(this.save, car.id));
    const condition = conditionFor(this.save, car.id);
    const cosmetics = cosmeticsFor(this.save, car.id);
    const stock = performanceStats(car, emptyUpgrades(), DEFAULT_SETUP, condition);
    const tuned = performanceStats(car, levels, DEFAULT_SETUP, condition);
    const category = this.upgradeCategory;
    const parts = UPGRADE_PARTS[category];
    const compatibility = isUpgradeCompatible(car, category);
    const nextCost = nextUpgradeCost(car, category, levels[category]);

    this.root.innerHTML = this.shell(`
      <div class="page__head">
        <div><h1>ارتقا و تیونینگ</h1><p>قطعه‌ها روی همان پروفایل فیزیک اثر می‌گذارند؛ عدد تزئینی نیست.</p></div>
        <div class="chip chip--amber">${faGroup(this.save.credits)} اعتبار</div>
      </div>
      <div class="upgrade-layout">
        <aside class="upgrade-side">
          <div class="upgrade-preview">
            <canvas class="js-upgrade-car" width="760" height="300"></canvas>
            <strong>${carDisplayName(car)}</strong>
            <span class="hint">${owned ? 'خودروی شما' : 'برای خرید این خودرو به گاراژ برو'}</span>
          </div>
          <div class="stat-compare">
            ${this.compareRow('قدرت', stock.powerHp, tuned.powerHp, 'اسب')}
            ${this.compareRow('گشتاور', stock.torqueNm, tuned.torqueNm, 'نیوتون')}
            ${this.compareRow('وزن', stock.massKg, tuned.massKg, 'کیلو', true)}
            ${this.compareRow('چسبندگی', stock.grip, tuned.grip, '', false, true)}
            ${this.compareRow('ترمز', stock.brakingNm, tuned.brakingNm, 'نیوتون‌متر')}
          </div>
          <div class="button-row">
            <button class="btn btn--ghost btn--sm" data-action="reset-upgrades">بازگشت به کارخانه</button>
            <button class="btn btn--ghost btn--sm" data-action="repair">تعمیر</button>
          </div>
        </aside>
        <div class="upgrade-main">
          <div class="category-tabs">
            ${UPGRADE_CATEGORIES.map((c) => `<button class="category-tab ${c.id === category ? 'is-active' : ''}" data-action="set-category" data-category="${c.id}">${c.labelFa}<small>${faNum(levels[c.id])}/۳</small></button>`).join('')}
          </div>
          <div class="panel">
            <div class="upgrade-head">
              <div><h2>${UPGRADE_CATEGORIES.find((c) => c.id === category)?.labelFa}</h2><p class="hint">${UPGRADE_CATEGORIES.find((c) => c.id === category)?.descFa}</p></div>
              ${compatibility.ok ? '' : `<span class="chip chip--danger">${compatibility.reasonFa}</span>`}
              ${levels[category] > 0 ? `<button class="btn btn--ghost btn--sm" data-action="unequip-upgrade" data-category="${category}">برداشتن آخرین قطعه · ${faGroup(upgradeRefund(car, category, levels[category]))} برگشت</button>` : ''}
            </div>
            <div class="part-list">
              ${parts.map((part) => {
                const installed = levels[category] >= part.tier;
                const isNext = levels[category] + 1 === part.tier;
                const price = nextUpgradeCost(car, category, part.tier - 1);
                return `<div class="part ${installed ? 'is-installed' : ''} ${isNext ? 'is-next' : ''}">
                  <div class="part__head">
                    <strong>${part.nameFa}</strong>
                    <span class="chip">${installed ? 'نصب‌شده' : isNext ? `${faGroup(price ?? 0)} اعتبار` : 'قفل'}</span>
                  </div>
                  <p>${part.descFa}</p>
                  <div class="chip-row">${part.effectsFa.map((e) => `<span class="chip">${e}</span>`).join('')}</div>
                  ${isNext ? `<button class="btn btn--primary btn--sm" data-action="buy-upgrade" data-category="${category}" ${!compatibility.ok || !owned ? 'disabled' : ''}>نصب و خرید</button>` : ''}
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="panel">
            <div class="section-title"><h2>ظاهر</h2><p>رنگ و رینگ در گاراژ و مسیر اعمال می‌شود</p></div>
            <div class="paint-row">
              ${PAINT_OPTIONS.map((p) => `<button class="paint ${cosmetics.paint === p.id ? 'is-active' : ''}" data-action="set-paint" data-paint="${p.id}" title="${p.labelFa}"><i style="background:${p.swatch}"></i><span>${p.labelFa}</span></button>`).join('')}
            </div>
            <div class="chip-row" style="margin-top:12px">
              ${RIM_OPTIONS.map((r) => `<button class="btn btn--ghost btn--sm ${cosmetics.rims === r.id ? 'is-active' : ''}" data-action="set-rims" data-rims="${r.id}">${r.labelFa}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `);
    this.bindCommon();
    this.paintCarPreview(qs<HTMLCanvasElement>(this.root, '.js-upgrade-car'), car, car.id, levels, condition, cosmetics);
  }

  private compareRow(label: string, before: number, after: number, unit: string, lowerBetter = false, decimal = false): string {
    const diff = after - before;
    const good = lowerBetter ? diff < -0.01 : diff > 0.01;
    const bad = lowerBetter ? diff > 0.01 : diff < -0.01;
    const fmt = (v: number) => (decimal ? faFixed(v, 2) : faGroup(v));
    return `<div class="compare">
      <span>${label}</span>
      <span>${fmt(before)}${unit ? ` ${unit}` : ''}</span>
      <span class="${good ? 'is-good' : bad ? 'is-bad' : ''}">${diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${decimal ? faFixed(diff, 2) : faGroup(diff)}`}</span>
    </div>`;
  }

  private buyUpgrade(category: UpgradeCategory): void {
    const car = getAnyCar(this.selectedCarId);
    if (!this.save.ownedCars.includes(car.id)) {
      this.toast('اول خودرو را بخر');
      return;
    }
    if (!isUpgradeCompatible(car, category).ok) {
      this.toast('این قطعه با این خودرو سازگار نیست');
      return;
    }
    const levels = sanitizeUpgrades(car, upgradesFor(this.save, car.id));
    const cost = nextUpgradeCost(car, category, levels[category]);
    if (cost === null) return;
    if (this.save.credits < cost) {
      this.toast('اعتبار کافی نیست');
      return;
    }
    levels[category] += 1;
    this.commit({
      ...this.save,
      credits: this.save.credits - cost,
      upgrades: { ...this.save.upgrades, [car.id]: levels },
    });
    this.toast('قطعه نصب شد');
    this.showUpgrades();
  }

  private resetUpgrades(): void {
    const car = getAnyCar(this.selectedCarId);
    this.commit({
      ...this.save,
      upgrades: { ...this.save.upgrades, [car.id]: emptyUpgrades() },
    });
    this.toast('تنظیمات به حالت کارخانه برگشت');
    this.showUpgrades();
  }

  /** Removes the newest installed part and returns half of its price. */
  private removeUpgrade(category: UpgradeCategory): void {
    const car = getAnyCar(this.selectedCarId);
    const levels = sanitizeUpgrades(car, upgradesFor(this.save, car.id));
    const level = levels[category];
    if (level <= 0) return;
    const refund = upgradeRefund(car, category, level);
    levels[category] = level - 1;
    this.commit({
      ...this.save,
      credits: this.save.credits + refund,
      upgrades: { ...this.save.upgrades, [car.id]: levels },
    });
    this.toast(`${UPGRADE_CATEGORIES.find((c) => c.id === category)?.labelFa ?? ''} برداشته شد · ${faGroup(refund)} اعتبار برگشت`);
    this.showUpgrades();
  }

  private setCosmetics(patch: Partial<CarCosmetics>): void {
    const car = getAnyCar(this.selectedCarId);
    const current = cosmeticsFor(this.save, car.id);
    const next = { ...DEFAULT_COSMETICS, ...current, ...patch };
    this.commit({
      ...this.save,
      cosmetics: { ...this.save.cosmetics, [car.id]: next },
    });
    this.showUpgrades();
  }

  // --------------------------------------------------------------- tracks --
  private showTracks(mode: GameMode): void {
    this.teardownGame();
    this.screen = 'tracks';
    this.mode = mode;
    this.activeEvent = null;
    const car = getAnyCar(this.selectedCarId);
    this.root.innerHTML = this.shell(`
      <div class="page__head">
        <div><h1>${MODE_LABELS[mode]}</h1><p>${MODE_DESCRIPTIONS[mode]}</p></div>
        <div class="chip chip--amber">${car.brandFa} ${car.modelFa}</div>
      </div>
      <div class="chip-row">
        ${(['race', 'time', 'trial', 'practice'] as GameMode[]).map((m) => `<button class="btn btn--sm ${m === mode ? 'btn--primary' : 'btn--ghost'}" data-action="set-mode" data-mode="${m}">${MODE_LABELS[m]}</button>`).join('')}
      </div>
      <div class="track-list">
        ${TRACKS.map((track) => this.trackCard(track, mode)).join('')}
      </div>
      <div class="panel start-bar">
        <div><div class="hint">مسیر انتخاب‌شده</div><strong>${getTrack(this.selectedTrackId).nameFa}</strong></div>
        <button class="btn btn--primary" data-action="start-selected">شروع</button>
      </div>
    `);
    this.bindCommon();
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('.js-track-profile')) {
      const id = canvas.dataset.track;
      if (id) this.paintTrackProfile(canvas, getTrack(id));
    }
    this.root.querySelectorAll<HTMLElement>('[data-track-select]').forEach((el) => {
      el.addEventListener('click', () => {
        this.selectedTrackId = el.dataset.trackSelect ?? this.selectedTrackId;
        this.commit({ ...this.save, lastTrackId: this.selectedTrackId });
        this.showTracks(mode);
      });
    });
  }

  private trackCard(track: TrackDefinition, mode: GameMode): string {
    const selected = track.id === this.selectedTrackId;
    const best = this.save.bestTimes[track.id];
    const score = this.save.bestScores[track.id];
    const thresholds = medalThresholds(track.lengthM, track.difficulty);
    const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < track.difficulty ? 'on' : ''}"></i>`).join('');
    return `<button class="track-card ${selected ? 'is-selected' : ''}" data-track-select="${track.id}">
      <div class="track-card__top">
        <div><div class="track-card__name">${track.nameFa}</div><div class="track-card__region">${track.regionFa} · ${track.nameEn}</div></div>
        <span class="biome-chip">${BIOME_LABELS_FA[track.biome]}</span>
      </div>
      <canvas class="js-track-profile" data-track="${track.id}" width="620" height="120"></canvas>
      <p>${track.descriptionFa}</p>
      <div class="track-card__foot">
        <span class="dots">${dots}</span>
        <span>${faNum(Math.round(track.lengthM))} متر</span>
        <span>${best ? `رکورد: ${formatTime(best)}` : 'بدون رکورد'}</span>
        <span>${mode === 'trial' ? (score ? `امتیاز: ${faNum(score)}` : `طلا: ${faNum(TRIAL_GOLD)} امتیاز`) : `طلا: ${formatTime(thresholds.gold)}`}</span>
      </div>
    </button>`;
  }

  // ------------------------------------------------------------- settings --
  private showSettings(): void {
    this.teardownGame();
    this.screen = 'settings';
    const s = this.save.settings;
    this.root.innerHTML = this.shell(`
      <div class="page__head"><div><h1>تنظیمات</h1><p>کنترل، صدا و نمایش. تغییرات همان لحظه ذخیره می‌شوند.</p></div><button class="btn btn--ghost" data-action="home">خانه</button></div>
      <div class="settings">
        <div class="row"><div class="row__label"><strong>جای پدال‌ها</strong><span>چیدمان راست‌دست یا چپ‌دست</span></div>
          <div class="segmented" data-setting="hand"><button data-value="right" class="${s.pedal.handedness === 'right' ? 'is-active' : ''}">راست</button><button data-value="left" class="${s.pedal.handedness === 'left' ? 'is-active' : ''}">چپ</button></div></div>
        <div class="row"><div class="row__label"><strong>اندازهٔ پدال‌ها</strong><span>بزرگ‌تر برای انگشت‌های بزرگ‌تر</span></div><input type="range" min="0.75" max="1.35" step="0.05" value="${s.pedal.scale}" data-setting="scale" /></div>
        <div class="row"><div class="row__label"><strong>شفافیت پدال‌ها</strong><span>کمتر = دید بهتر جاده</span></div><input type="range" min="0.4" max="1" step="0.02" value="${s.pedal.opacity}" data-setting="opacity" /></div>
        <div class="row"><div class="row__label"><strong>حساسیت</strong><span>بیشتر = حرکت کمتر انگشت، گاز بیشتر</span></div><input type="range" min="0.7" max="1.3" step="0.05" value="${s.pedal.sensitivity}" data-setting="sensitivity" /></div>
        <div class="row"><div class="row__label"><strong>سطح سختی</strong><span>قدرت حریف‌ها و ضریب پاداش</span></div>
          <div class="segmented" data-setting="difficulty">
            <button data-value="easy" class="${s.difficulty === 'easy' ? 'is-active' : ''}">آسان</button>
            <button data-value="normal" class="${s.difficulty === 'normal' ? 'is-active' : ''}">معمولی</button>
            <button data-value="hard" class="${s.difficulty === 'hard' ? 'is-active' : ''}">سخت</button>
          </div></div>
        <div class="row"><div class="row__label"><strong>صدا</strong><span>موتور، تایر، برخورد و رابط</span></div><button class="switch ${s.audio ? 'is-on' : ''}" data-setting="audio" aria-label="صدا"></button></div>
        <div class="row"><div class="row__label"><strong>بلندی صدا</strong><span>پیش‌فرض ۸۰٪</span></div><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-setting="volume" /></div>
        <div class="row"><div class="row__label"><strong>کاهش حرکت</strong><span>حذف انیمیشن‌های غیرضروری رابط</span></div><button class="switch ${s.reducedMotion ? 'is-on' : ''}" data-setting="motion" aria-label="کاهش حرکت"></button></div>
        <div class="row"><div class="row__label"><strong>نمایش داده‌های فیزیک</strong><span>برای عیب‌یابی، روی صفحهٔ مسابقه</span></div><button class="switch ${s.showDebug ? 'is-on' : ''}" data-setting="debug" aria-label="نمایش دیباگ"></button></div>
      </div>
      <div class="footer-actions">
        <span class="hint">نسخهٔ ${faNum(GAME_VERSION)} · ذخیره فقط روی همین دستگاه</span>
        <button class="btn btn--danger btn--sm" data-action="reset-save">پاک کردن همهٔ داده‌ها</button>
      </div>
    `);
    this.bindCommon();
    this.bindSettings();
  }

  private bindSettings(): void {
    const s = this.save.settings;
    this.root.querySelectorAll<HTMLElement>('[data-setting="hand"] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        s.pedal.handedness = btn.dataset.value === 'left' ? 'left' : 'right';
        this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
        this.showSettings();
      });
    });
    this.root.querySelectorAll<HTMLElement>('[data-setting="difficulty"] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        s.difficulty = value === 'easy' || value === 'hard' ? value : 'normal';
        this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
        this.showSettings();
      });
    });
    const bindRange = (key: 'scale' | 'opacity' | 'sensitivity' | 'volume') => {
      const input = qs<HTMLInputElement>(this.root, `input[data-setting="${key}"]`);
      input.addEventListener('input', () => {
        if (key === 'volume') {
          s.volume = Number(input.value);
          this.audio.setVolume(s.volume);
        } else {
          s.pedal[key] = Number(input.value);
        }
        this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
      });
    };
    bindRange('scale');
    bindRange('opacity');
    bindRange('sensitivity');
    bindRange('volume');
    qs<HTMLElement>(this.root, '[data-setting="audio"]').addEventListener('click', (e) => {
      s.audio = !s.audio;
      this.audio.setMuted(!s.audio);
      (e.currentTarget as HTMLElement).classList.toggle('is-on', s.audio);
      this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
    });
    qs<HTMLElement>(this.root, '[data-setting="motion"]').addEventListener('click', (e) => {
      s.reducedMotion = !s.reducedMotion;
      this.applyMotionPreference();
      (e.currentTarget as HTMLElement).classList.toggle('is-on', s.reducedMotion);
      this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
    });
    qs<HTMLElement>(this.root, '[data-setting="debug"]').addEventListener('click', (e) => {
      s.showDebug = !s.showDebug;
      (e.currentTarget as HTMLElement).classList.toggle('is-on', s.showDebug);
      this.commit({ ...this.save, settings: { ...s, pedal: { ...s.pedal } } });
    });
  }

  private applyMotionPreference(): void {
    document.documentElement.classList.toggle('reduce-motion', this.save.settings.reducedMotion);
  }

  // ----------------------------------------------------------------- game --
  private startGame(
    mode: GameMode,
    options: { carId?: string; trackId?: string; event?: CareerEvent } = {},
  ): void {
    this.teardownGame();
    this.screen = 'game';
    this.mode = mode;
    this.activeEvent = options.event ?? null;
    this.resultHandled = false;
    const carId = options.carId ?? this.selectedCarId;
    const car = getAnyCar(carId);
    if (!options.event && !this.save.ownedCars.includes(car.id)) {
      this.toast('این خودرو در گاراژ شما نیست');
      this.showGarage();
      return;
    }
    const track = getTrack(options.trackId ?? this.selectedTrackId);
    this.selectedCarId = car.id;
    this.selectedTrackId = track.id;
    const condition = conditionFor(this.save, car.id);
    const levels = sanitizeUpgrades(car, upgradesFor(this.save, car.id));
    const cosmetics = cosmeticsFor(this.save, car.id);
    const resolved = resolveCar(car, levels, DEFAULT_SETUP, condition, cosmetics);

    const count = options.event?.opponents ?? (mode === 'race' ? 2 : 0);
    const opponents: OpponentSpec[] = [];
    if (count > 0) {
      const skillBase =
        this.save.settings.difficulty === 'easy' ? 0.46 : this.save.settings.difficulty === 'hard' ? 0.72 : 0.6;
      const pool = ALL_CARS.filter((c) => c.id !== car.id).slice(0, Math.min(count, 3));
      pool.forEach((opponent, index) => {
        opponents.push({
          car: resolveCar(
            opponent,
            emptyUpgrades(),
            DEFAULT_SETUP,
            DEFAULT_CONDITION,
            DEFAULT_COSMETICS,
          ),
          skill: Math.min(0.92, skillBase + index * 0.08),
          offsetM: index === 0 ? -3 : 2.5 + index * 2.5,
          labelFa: DRIVER_NAMES[index % DRIVER_NAMES.length] ?? `حریف ${index + 1}`,
        });
      });
    }

    const ghost = mode === 'time' ? (this.save.ghosts[track.id] ?? []) : [];
    this.root.innerHTML = `
      <div class="game-shell">
        <canvas class="game-canvas"></canvas>
        <div class="hud">
          <div class="hud__top">
            <span class="timer js-timer">${formatTime(0)}</span>
            <span class="pips js-pips"></span>
            <span class="hud__position js-position">۱</span>
          </div>
          <button class="hud__pause js-pause" aria-label="توقف">${icon('pause')}</button>
          <div class="opponents js-standings"></div>
          <div class="speedo">
            <div class="speedo__ring js-rpm-ring" style="--rpm:0">
              <div class="speedo__value"><strong class="js-speed">۰</strong></div>
            </div>
            <div class="speedo__meta">
              <div class="speedo__unit">کیلومتر بر ساعت</div>
              <div class="speedo__gear"><b class="js-gear">N</b><span>دنده</span></div>
              <div class="speedo__rpm"><span class="js-rpm">۰</span> دور</div>
            </div>
          </div>
          <div class="hud__hint js-hint"></div>
          <div class="gear-select js-gear-select"></div>
          <button class="btn btn--primary btn--sm hud__start js-start is-hidden">استارت</button>
          <div class="toast js-toast"></div>
          <div class="countdown js-countdown"></div>
        </div>
        <div class="js-overlay"></div>
      </div>
    `;
    const canvas = qs<HTMLCanvasElement>(this.root, '.game-canvas');
    const hud = qs<HTMLElement>(this.root, '.hud');
    this.hudEls = {
      timer: qs(this.root, '.js-timer'),
      speed: qs(this.root, '.js-speed'),
      gear: qs(this.root, '.js-gear'),
      rpmRing: qs(this.root, '.js-rpm-ring'),
      rpm: qs(this.root, '.js-rpm'),
      hint: qs(this.root, '.js-hint'),
      count: qs(this.root, '.js-countdown'),
      toast: qs(this.root, '.js-toast'),
      pips: qs(this.root, '.js-pips'),
      gearSelect: qs(this.root, '.js-gear-select'),
      position: qs(this.root, '.js-position'),
    };
    this.standingsEl = qs(this.root, '.js-standings');
    this.buildPips(track.checkpointsX.length);

    this.pedals = new PedalControls(this.save.settings.pedal);
    this.pedals.setClutchVisible(car.transmission === 'manual');
    hud.append(this.pedals.root);

    this.scene = new GameScene(canvas, resolved, track, mode, {
      onFinish: (result) => this.handleResult(result),
      onCheckpoint: () => this.pulseCheckpoint(),
      onRespawn: (reason) => this.toast(reason),
      onCountdown: (value) => {
        if (value === 0) {
          this.hudEls!.count.innerHTML = '<span class="is-go">برو!</span>';
          this.countdownHideAt = performance.now() + 700;
        } else {
          this.hudEls!.count.innerHTML = `<span>${faNum(value)}</span>`;
        }
      },
      onEvent: (event) => {
        if (event.type === 'shift') this.audio.shift();
        else if (event.type === 'impact') this.audio.impact(event.value ?? 0.2);
        else if (event.type === 'checkpoint') this.audio.checkpoint();
        else if (event.type === 'finish') this.audio.finish();
      },
    }, opponents, ghost);
    this.scene.showDebug = this.save.settings.showDebug;
    this.scene.resize();
    this.hudEls!.count.innerHTML = '<span>۳</span>';
    this.buildGearSelector(resolved);
    qs<HTMLElement>(this.root, '.js-pause').addEventListener('click', () => this.openPause());
    qs<HTMLElement>(this.root, '.js-start').addEventListener('click', () => {
      this.scene?.vehicle.restartEngine();
      this.toast('موتور روشن شد');
    });
    this.audio.setVehicleCharacter(car.id === 'prado-150-2021' ? 'v6' : car.id === 'mx5-nd' ? 'flat4' : 'i4');
    void this.audio.unlock();
    this.scene.draw();
    this.lastFrame = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);
    const ghostBest = this.save.bestTimes[track.id];
    if (mode === 'time' && ghostBest !== undefined) {
      this.toast(`شبح رکورد ${formatTime(ghostBest)} روی مسیر است`);
    } else {
      this.toast(
        car.transmission === 'manual'
          ? 'کلاچ را بالا بکش، دنده یک را بزن، بعد آرام رها کن'
          : 'دنده روی D است؛ فقط گاز بده',
      );
    }
  }

  private buildPips(total: number): void {
    const pips = this.hudEls?.pips;
    if (!pips) return;
    pips.innerHTML = Array.from({ length: total }, () => '<i></i>').join('');
    this.pips = Array.from(pips.querySelectorAll('i'));
  }

  private buildGearSelector(car: ResolvedCar): void {
    const host = this.hudEls?.gearSelect;
    if (!host) return;
    this.gearButtons = [];
    const add = (label: string, gear: number) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        const result = this.scene?.requestGear(gear);
        if (result && !result.ok) {
          this.toast(result.reason === 'clutch' ? 'برای تغییر دنده، کلاچ را تا انتها بگیر' : result.reason === 'busy' ? 'دنده در حال تعویض است' : 'این دنده در دسترس نیست');
        }
      });
      host.append(btn);
      this.gearButtons.push(btn);
    };
    if (car.profile.transmission === 'manual') {
      add('R', -1);
      add('N', 0);
      for (let g = 1; g <= car.gearbox.gears.length; g++) add(faNum(g), g);
    } else {
      add('R', -1);
      add('N', 0);
      add('D', 1);
    }
  }

  private updateHud(): void {
    const scene = this.scene;
    const els = this.hudEls;
    if (!scene || !els) return;
    const tele = scene.vehicle.telemetry;
    const now = performance.now();
    els.timer.textContent = formatTime(scene.elapsedS);
    els.speed.textContent = faNum(Math.round(tele.speedKph));
    els.gear.textContent = gearLabel(tele.gear);
    const maxRpm = scene.vehicle.car.engine.maxRpm;
    els.rpmRing.style.setProperty('--rpm', String(Math.min(1, tele.rpm / maxRpm)));
    els.rpm.textContent = faNum(Math.round(tele.rpm / 100) * 100);
    els.position.textContent = scene.opponents.length > 0 ? faNum(scene.racePosition) : '—';

    for (let i = 0; i < this.pips.length; i++) {
      this.pips[i]!.classList.toggle('on', i < scene.checkpointsHit);
    }

    const manual = Boolean(scene.vehicle.manual);
    let hint = '';
    if (!tele.engineRunning) hint = 'موتور خاموش شد — دکمهٔ استارت را بزن';
    else if (manual && tele.gear === 0) hint = 'کلاچ را بگیر و دنده ۱ را انتخاب کن';
    els.hint.textContent = hint;
    els.hint.classList.toggle('is-hidden', hint === '' || scene.countdown > 0);
    this.root.querySelector<HTMLElement>('.js-start')?.classList.toggle('is-hidden', tele.engineRunning);

    const gearValues = manual
      ? [-1, 0, ...Array.from({ length: scene.vehicle.car.gearbox.gears.length }, (_, i) => i + 1)]
      : [-1, 0, 1];
    this.gearButtons.forEach((btn, i) => btn.classList.toggle('is-active', gearValues[i] === tele.gear));

    if (this.standingsEl && scene.opponents.length > 0) {
      this.standingsEl.innerHTML = scene.standings.map((row, index) => `
        <div class="opponent ${row.player ? 'is-player' : ''}">
          <span class="opponent__pos">${faNum(index + 1)}</span>
          <span class="opponent__name">${row.labelFa}</span>
          <span class="opponent__gap">${row.player ? 'شما' : row.gapM > 0 ? `${faNum(Math.round(row.gapM))} م` : 'هم‌ردیف'}</span>
        </div>`).join('');
    } else if (this.standingsEl) {
      this.standingsEl.innerHTML = '';
    }

    if (now > this.countdownHideAt && scene.countdown === 0 && els.count.textContent) {
      els.count.innerHTML = '';
    }
  }

  private frame = (now: number): void => {
    const scene = this.scene;
    if (!scene) return;
    const dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 1 / 60;
    this.lastFrame = now;
    const pedals = this.pedals;
    if (pedals) {
      scene.update(
        Math.min(dt, 0.06),
        { throttle: pedals.throttle, brake: pedals.brake, clutch: pedals.clutch },
        (d) => pedals.update(d),
      );
      const tele = scene.vehicle.telemetry;
      this.audio.update(Math.min(dt, 0.06), {
        rpm: tele.rpm,
        maxRpm: scene.vehicle.car.engine.maxRpm,
        throttle: tele.throttle,
        speedKph: tele.speedKph,
        wheelSlip: tele.wheelSlip,
        surfaceId: tele.wheels[1]?.surfaceId ?? 'asphalt-dry',
        engineRunning: tele.engineRunning,
        gear: tele.gear,
      });
    }
    scene.draw();
    this.updateHud();
    this.raf = requestAnimationFrame(this.frame);
  };

  private openPause(): void {
    const scene = this.scene;
    if (!scene) return;
    scene.setPaused(true);
    this.pedals?.reset();
    const overlay = qs<HTMLElement>(this.root, '.js-overlay');
    overlay.innerHTML = `
      <div class="overlay">
        <div class="modal">
          <h2>توقف</h2>
          <p>${scene.track.nameFa} · ${MODE_LABELS[scene.mode]}${this.activeEvent ? ` · ${this.activeEvent.titleFa}` : ''}</p>
          <div class="result-grid">
            <div class="result"><div class="result__label">زمان</div><div class="result__value">${formatTime(scene.elapsedS)}</div></div>
            <div class="result"><div class="result__label">سرعت اوج</div><div class="result__value">${faNum(Math.round(scene.vehicle.telemetry.speedKph))}<small> km/h</small></div></div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--primary" data-pause="resume">ادامه</button>
            <button class="btn btn--ghost" data-pause="restart">شروع دوباره</button>
            <button class="btn btn--ghost" data-pause="tracks">انتخاب مسیر</button>
            <button class="btn btn--ghost" data-pause="home">خانه</button>
          </div>
        </div>
      </div>`;
    overlay.querySelectorAll<HTMLElement>('[data-pause]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.pause;
        if (action === 'resume') {
          overlay.innerHTML = '';
          scene.setPaused(false);
          this.lastFrame = performance.now();
        } else if (action === 'restart') {
          this.startGame(this.mode, { carId: this.selectedCarId, trackId: this.selectedTrackId, event: this.activeEvent ?? undefined });
        } else if (action === 'tracks') {
          this.showTracks(this.mode);
        } else {
          this.showHome();
        }
      });
    });
  }

  private handleResult(result: RaceResult): void {
    if (this.resultHandled) return;
    this.resultHandled = true;
    const track = getTrack(result.trackId);
    const bestBefore = this.save.bestTimes[track.id];
    const isBest = result.mode !== 'practice' && (bestBefore === undefined || result.timeS < bestBefore);
    const reward = computeReward({
      mode: result.mode,
      timeS: result.timeS,
      penaltiesS: result.penaltiesS,
      damage: result.damage,
      position: result.position,
      totalRacers: result.totalRacers,
      medal: result.medal ?? undefined,
      difficulty: track.difficulty,
      challenge:
        this.save.settings.difficulty === 'easy' ? 0.85 : this.save.settings.difficulty === 'hard' ? 1.2 : 1,
    });

    let next = claimReward(this.save, result.runId, reward).save;
    if (isBest) next = { ...next, bestTimes: { ...next.bestTimes, [track.id]: result.timeS } };
    if (result.mode === 'trial' && result.score !== null) {
      const prev = next.bestScores[track.id] ?? 0;
      if (result.score > prev) next = { ...next, bestScores: { ...next.bestScores, [track.id]: result.score } };
    }
    if (result.mode === 'time' && result.ghost && isBest) {
      next = { ...next, ghosts: { ...next.ghosts, [track.id]: result.ghost } };
    }
    next = { ...next, racesFinished: next.racesFinished + 1 };

    // Persistent wear: damage from this run lowers the car's condition, which
    // the physics layer consumes (grip, engine health) until it is repaired.
    const wear = result.mode === 'practice' ? 0.45 : 1;
    const prevCondition = conditionFor(next, result.carId);
    next = {
      ...next,
      condition: {
        ...next.condition,
        [result.carId]: {
          tires: clamp01(prevCondition.tires * (1 - (0.02 + result.damage * 0.22) * wear)),
          engine: clamp01(prevCondition.engine * (1 - (0.008 + result.damage * 0.1) * wear)),
          body: clamp01(prevCondition.body * (1 - (0.015 + result.damage * 0.32) * wear)),
        },
      },
    };

    let careerMessage = '';
    if (this.activeEvent && this.activeEvent.id && result.mode !== 'practice') {
      const event = this.activeEvent;
      const already = next.career.completed.includes(event.id);
      const passed = medalAtLeast(result.medal ?? undefined, event.medalTarget);
      if (passed) {
        const firstClear = !already;
        const completed = firstClear ? [...next.career.completed, event.id] : next.career.completed;
        const medals = { ...next.career.medals, [event.id]: result.medal ?? 'bronze' } as Record<string, Medal>;
        next = {
          ...next,
          career: { completed, medals },
          credits: next.credits + (firstClear ? event.rewards.credits : 0),
          profile: { ...next.profile, xp: next.profile.xp + (firstClear ? event.rewards.xp : 0) },
        };
        next.profile.level = levelFromXp(next.profile.xp);
        careerMessage = firstClear
          ? `رویداد «${event.titleFa}» باز شد؛ ${faGroup(event.rewards.credits)} اعتبار اضافه شد.`
          : `رویداد «${event.titleFa}» دوباره با مدال ${medalLabel(result.medal ?? 'bronze')} تمام شد.`;
      } else {
        careerMessage = `برای عبور از این رویداد به مدال ${medalLabel(event.medalTarget)} نیاز داری.`;
      }
    }

    const achievements = evaluateAchievements(next, {
      result,
      position: result.position,
      medal: result.medal ?? undefined,
    });
    next = achievements.save;
    this.commit(next);

    const overlay = this.root.querySelector<HTMLElement>('.js-overlay');
    if (!overlay) return;
    const newAchievements = achievements.unlocked.map((a) => `<span class="chip chip--amber">${a.titleFa}</span>`).join('');
    overlay.innerHTML = `
      <div class="overlay">
        <div class="modal modal--result">
          <div class="result-head">
            <div>
              <div class="hint">${MODE_LABELS[result.mode]} · ${track.nameFa}</div>
              <h2>${result.mode === 'race' && result.position === 1 ? 'برد' : isBest ? 'رکورد جدید' : 'خط پایان'}</h2>
            </div>
            ${result.medal ? `<span class="medal medal--${result.medal}">${medalLabel(result.medal)}</span>` : ''}
          </div>
          <div class="result-grid">
            <div class="result ${isBest ? 'result--best' : ''}"><div class="result__label">زمان</div><div class="result__value">${formatTime(result.timeS)}</div></div>
            <div class="result"><div class="result__label">رده</div><div class="result__value">${faNum(result.position)}<small> از ${faNum(result.totalRacers)}</small></div></div>
            <div class="result"><div class="result__label">سرعت اوج</div><div class="result__value">${faNum(Math.round(result.topSpeedKph))}<small> km/h</small></div></div>
            <div class="result"><div class="result__label">آسیب</div><div class="result__value">${faNum(Math.round(result.damage * 100))}٪</div></div>
            ${result.score !== null ? `<div class="result"><div class="result__label">امتیاز مسیر</div><div class="result__value">${faNum(result.score)}</div></div>` : ''}
            ${result.penaltiesS > 0 ? `<div class="result"><div class="result__label">جریمه</div><div class="result__value">+${faNum(Math.round(result.penaltiesS))}<small> ثانیه</small></div></div>` : ''}
            ${bestBefore !== undefined ? `<div class="result"><div class="result__label">رکورد پیشین</div><div class="result__value">${formatTime(bestBefore)}</div></div>` : ''}
          </div>
          <div class="reward-box">
            <div class="reward-box__head"><strong>پاداش این اجرا</strong><span class="chip chip--amber">+${faGroup(reward.credits)} اعتبار · +${faGroup(reward.xp)} تجربه</span></div>
            <div class="reward-lines">${reward.linesFa.map((line) => `<span>${line}</span>`).join('')}</div>
            ${careerMessage ? `<p class="hint">${careerMessage}</p>` : ''}
            ${newAchievements ? `<div class="chip-row">${newAchievements}</div>` : ''}
          </div>
          <div class="modal__actions">
            <button class="btn btn--primary" data-result="retry">دوباره</button>
            <button class="btn btn--ghost" data-result="tracks">مسیر دیگر</button>
            <button class="btn btn--ghost" data-result="garage">گاراژ</button>
            <button class="btn btn--ghost" data-result="home">خانه</button>
          </div>
        </div>
      </div>`;
    overlay.querySelectorAll<HTMLElement>('[data-result]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.result;
        if (action === 'retry') this.startGame(this.mode, { carId: this.selectedCarId, trackId: this.selectedTrackId, event: this.activeEvent ?? undefined });
        else if (action === 'tracks') this.showTracks(this.mode);
        else if (action === 'garage') this.showGarage();
        else this.showHome();
      });
    });
  }

  private teardownGame(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.scene = null;
    this.pedals = null;
    this.hudEls = null;
    this.gearButtons = [];
    this.pips = [];
    this.standingsEl = null;
  }

  private onGlobalKey = (event: KeyboardEvent): void => {
    if (this.screen !== 'game' || !this.scene) return;
    if (event.code === 'Escape') {
      if (this.scene.paused) {
        const overlay = this.root.querySelector<HTMLElement>('.js-overlay');
        if (overlay) overlay.innerHTML = '';
        this.scene.setPaused(false);
        this.lastFrame = performance.now();
      } else {
        this.openPause();
      }
    } else if (event.code === 'KeyR' && !event.repeat) {
      if (!this.scene.finished) this.scene.respawn('بازگشت دستی');
    } else if (event.code === 'KeyE') {
      this.scene.vehicle.restartEngine();
    } else if (/^Digit[0-9]$/.test(event.code)) {
      this.scene.requestGear(Number(event.code.slice(5)));
    }
  };

  private toast(message: string): void {
    let el = this.hudEls?.toast;
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast toast--global';
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el?.classList.remove('is-visible'), 2600);
  }

  private pulseCheckpoint(): void {
    const el = this.hudEls?.timer;
    if (!el) return;
    el.classList.add('timer--penalty');
    window.setTimeout(() => el.classList.remove('timer--penalty'), 400);
  }

  // --------------------------------------------------------------- previews --
  private paintCarPreview(
    canvas: HTMLCanvasElement,
    car: CarProfile,
    carId?: string,
    upgrades?: CarUpgrades,
    condition?: CarCondition,
    cosmetics?: CarCosmetics,
    fill = 0.86,
  ): void {
    const id = carId ?? car.id;
    const resolved = resolveCar(
      car,
      sanitizeUpgrades(car, upgrades ?? upgradesFor(this.save, id)),
      DEFAULT_SETUP,
      condition ?? conditionFor(this.save, id),
      cosmetics ?? cosmeticsFor(this.save, id),
    );
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || canvas.width;
    const cssH = rect.height || canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const halfH = resolved.numbers.heightM * 0.28;
    const rest = Math.max(0.13, resolved.numbers.suspensionTravelM * 0.7);
    const clearance = Math.max(0.16, rest + resolved.numbers.wheelRadiusM - 0.28);
    const chassisCenterY = halfH + clearance;
    // The roof is `heightM` above the sill, and the sill sits a little above the
    // tyre contact patch, so the silhouette is ~heightM tall from the road.
    const carHeightM = resolved.numbers.heightM + 0.06;

    // Fit both axes: a long car must not spill out of a short panel.
    const ppm = Math.min(
      (cssW * 0.92) / resolved.numbers.lengthM,
      (cssH * 0.84) / carHeightM,
    );
    const groundY = cssH * 0.5 + (carHeightM * ppm) / 2 - cssH * 0.03;
    const wheelY = -(chassisCenterY - resolved.numbers.wheelRadiusM);

    // Studio floor: soft pool of light under the car.
    const pool = ctx.createRadialGradient(cssW / 2, groundY, 0, cssW / 2, groundY, cssW * 0.42);
    pool.addColorStop(0, 'rgba(217, 164, 65, 0.16)');
    pool.addColorStop(0.55, 'rgba(217, 164, 65, 0.04)');
    pool.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, groundY - cssH * 0.25, cssW, cssH * 0.5);

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cssW * 0.04, groundY);
    ctx.lineTo(cssW * 0.96, groundY);
    ctx.stroke();

    ctx.save();
    ctx.translate(cssW / 2, groundY - chassisCenterY * ppm);
    const wheels = [
      { xM: -resolved.numbers.wheelbaseM / 2, yM: wheelY, radiusM: resolved.numbers.wheelRadiusM },
      { xM: resolved.numbers.wheelbaseM / 2, yM: wheelY, radiusM: resolved.numbers.wheelRadiusM },
    ];
    const rimStyle = resolved.cosmetics.rims === 'stock' ? resolved.profile.art.rimStyle : resolved.cosmetics.rims === 'sport' ? 'rugged' : 'mesh';
    for (const w of wheels) {
      drawWheel(ctx, {
        x: w.xM * ppm,
        y: -w.yM * ppm,
        radiusPx: w.radiusM * ppm,
        angleRad: 0,
        index: 1,
        slip: 0,
        rimStyle,
        blueprint: blueprintFor(resolved.profile.id).wheel,
      });
    }
    drawCarBody(ctx, resolved, ppm, wheels, resolved.condition.body < 0.999 ? 1 - resolved.condition.body : 0, {
      lights: true,
    });
    ctx.restore();
  }

  private paintTrackProfile(canvas: HTMLCanvasElement, track: TrackDefinition): void {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || canvas.width;
    const cssH = rect.height || canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const palette = BIOME_PALETTES[track.biome];
    const pad = 6;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const run of track.runs) for (const p of run.points) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const spanY = Math.max(1, maxY - minY);
    const scaleX = (cssW - pad * 2) / Math.max(1, track.lengthM);
    const baseY = cssH - pad;
    const grad = ctx.createLinearGradient(0, 0, 0, cssH);
    grad.addColorStop(0, 'rgba(255,255,255,0.02)');
    grad.addColorStop(1, palette.haze);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);
    for (const run of track.runs) {
      ctx.beginPath();
      run.points.forEach((p, i) => {
        const x = pad + (p.x - track.startX) * scaleX;
        const y = baseY - ((p.y - minY) / spanY) * (cssH * 0.55);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.lineTo(pad + (run.points[run.points.length - 1]!.x - track.startX) * scaleX, cssH);
      ctx.lineTo(pad + (run.points[0]!.x - track.startX) * scaleX, cssH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(217,164,65,0.75)';
    for (const cx of track.checkpointsX) {
      const x = pad + (cx - track.startX) * scaleX;
      ctx.fillRect(x - 1, cssH - 8, 2, 6);
    }
  }
}

function icon(name: 'flag' | 'clock' | 'wheel' | 'pause' | 'medal' | 'profile'): string {
  switch (name) {
    case 'flag':
      return '<svg viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h11l-2 4 2 4H6"/></svg>';
    case 'clock':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
    case 'wheel':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 4v5M5.5 15l5-2M18.5 15l-5-2"/></svg>';
    case 'medal':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M8.5 13 6 21l6-2 6 2-2.5-8"/></svg>';
    case 'profile':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>';
    case 'pause':
      return '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="5" width="4" height="14" rx="1"/></svg>';
  }
}
