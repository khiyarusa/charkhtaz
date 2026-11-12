import './styles.css';
import {
  CAR_PROFILES,
  DEFAULT_SETUP,
  DEFAULT_CONDITION,
  DEFAULT_UPGRADES,
  getCar,
  resolveCar,
  SURFACE_LABELS_FA,
  type CarProfile,
  type ResolvedCar,
} from '../vehicles/profiles';
import { TRACKS, BIOME_LABELS_FA, getTrack } from '../tracks/definitions';
import type { TrackDefinition } from '../tracks/types';
import { GameScene, type GameMode, type RaceResult } from '../game/scene';
import { PedalControls, type PedalSettings } from '../controls/pedals';
import { loadSave, saveGame, resetSave, type SaveData } from '../save/storage';
import { faFixed, faGroup, faNum, formatTime, gearLabel } from '../core/format';
import { drawCarBody, drawWheel } from '../render/vehicle-art';
import { BIOME_PALETTES } from '../render/palettes';
import { GAME_VERSION } from '../core/build-info';

type ScreenName = 'home' | 'garage' | 'tracks' | 'settings' | 'game';

const MODE_LABELS: Record<GameMode, string> = {
  race: 'مسابقهٔ سریع',
  time: 'رکورد زمانی',
  practice: 'تمرین آزاد',
};

function qs<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function carSubtitle(car: CarProfile): string {
  return `${car.brandFa} ${car.modelFa} · ${faNum(car.year)} · ${car.transmissionFa}`;
}

export class App {
  private save: SaveData;
  private screen: ScreenName = 'home';
  private mode: GameMode = 'race';
  private selectedCarId: string;
  private selectedTrackId: string;
  private scene: GameScene | null = null;
  private pedals: PedalControls | null = null;
  private raf = 0;
  private lastFrame = 0;
  private hudEls: {
    timer: HTMLElement;
    speed: HTMLElement;
    gear: HTMLElement;
    rpmRing: HTMLElement;
    rpmValue: HTMLElement;
    hint: HTMLElement;
    count: HTMLElement;
    toast: HTMLElement;
    pips: HTMLElement;
    gearSelect: HTMLElement;
    clutchHint: HTMLElement;
  } | null = null;
  private pips: HTMLElement[] = [];
  private countdownHideAt = 0;
  private toastTimer = 0;
  private gearButtons: HTMLButtonElement[] = [];
  private resizeHandler = () => this.scene?.resize();

  constructor(private readonly root: HTMLElement) {
    this.save = loadSave();
    this.selectedCarId = this.save.lastCarId;
    this.selectedTrackId = this.save.lastTrackId;
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('keydown', this.onGlobalKey);
    this.showHome();
  }

  // ------------------------------------------------------------------ home --
  private showHome(): void {
    this.teardownGame();
    this.screen = 'home';
    const car = getCar(this.selectedCarId);
    const track = getTrack(this.selectedTrackId);
    this.root.innerHTML = `
      <div class="screen">
        ${this.topbar()}
        <main class="home">
          <section class="hero">
            <div>
              <div class="hero__kicker">بازی مسابقه‌ای دوبعدی · ایران</div>
              <h1>چرخ<span>‌تاز</span></h1>
              <p>
                سه اهرمِ آنالوگ، یک ماشین واقعی و جاده‌ای که بخشش نمی‌کند.
                گاز، ترمز و کلاچ را با انگشت وزن کن؛ چسبندگی، دور موتور و
                کلاچ، نتیجه را می‌سازند — نه دکمه‌های جادویی.
              </p>
              <div class="hero__actions">
                <button class="btn btn--primary" data-action="start-race">مسابقهٔ سریع</button>
                <button class="btn btn--ghost" data-action="garage">گاراژ</button>
                <button class="btn btn--ghost" data-action="settings">تنظیمات</button>
              </div>
              <div class="hero__meta">
                <div class="meta"><div class="meta__value">${faNum(CAR_PROFILES.length)}</div><div class="meta__label">خودروی واقعی</div></div>
                <div class="meta"><div class="meta__value">${faNum(TRACKS.length)}</div><div class="meta__label">مسیر</div></div>
                <div class="meta"><div class="meta__value">${faNum(3)}</div><div class="meta__label">اهرم آنالوگ</div></div>
              </div>
            </div>
            <div class="hero__car">
              <canvas class="js-car-preview" width="640" height="280"></canvas>
              <div class="hero__car-name">
                <strong>${car.brandFa} ${car.modelFa}</strong>
                <span>${faNum(car.year)} · ${car.trim}</span>
              </div>
              <div class="hero__car-specs">
                <div><span>قدرت</span><strong>${faNum(car.specs.powerHp)} اسب</strong></div>
                <div><span>گشتاور</span><strong>${faNum(car.specs.torqueNm)} نیوتون</strong></div>
                <div><span>گیربکس</span><strong>${car.transmission === 'manual' ? 'دستی' : 'خودکار'}</strong></div>
              </div>
              <div class="hint" style="margin-top:6px">${car.taglineFa}</div>
            </div>
          </section>

          <section>
            <div class="section-title">
              <h2>حالت بازی</h2>
              <p>همهٔ حالت‌ها آفلاین اجرا می‌شوند</p>
            </div>
            <div class="mode-grid">
              <button class="mode" data-action="mode" data-mode="race">
                <span class="mode__icon">${icon('flag')}</span>
                <strong>مسابقهٔ سریع</strong>
                <span>یک مسیر، یک ماشین، بهترین زمان تو. از خط شروع تا خط پایان.</span>
              </button>
              <button class="mode" data-action="mode" data-mode="time">
                <span class="mode__icon">${icon('clock')}</span>
                <strong>رکورد زمانی</strong>
                <span>بدون حریف، فقط تو و زمان. رکورد هر مسیر ذخیره می‌شود.</span>
              </button>
              <button class="mode" data-action="mode" data-mode="practice">
                <span class="mode__icon">${icon('wheel')}</span>
                <strong>تمرین آزاد</strong>
                <span>بدون فشار زمان؛ برای یاد گرفتن نقطهٔ کلاچ و کنترل گاز.</span>
              </button>
            </div>
          </section>

          <section>
            <div class="section-title">
              <h2>مسیر پیشنهادی</h2>
              <button class="btn btn--ghost btn--sm" data-action="tracks">همهٔ مسیرها</button>
            </div>
            <div class="panel" style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
              <div>
                <div class="chip chip--amber">${BIOME_LABELS_FA[track.biome]} · ${track.regionFa}</div>
                <h3 style="margin:12px 0 6px;font-size:22px">${track.nameFa}</h3>
                <p style="margin:0;color:var(--muted);font-size:13px;line-height:1.9;max-width:52ch">${track.descriptionFa}</p>
              </div>
              <div style="display:grid;gap:8px;min-width:190px">
                <div class="spec"><div class="spec__label">طول مسیر</div><div class="spec__value">${faNum(Math.round(track.lengthM))} متر</div></div>
                <button class="btn btn--primary btn--block" data-action="start-selected">شروع در این مسیر</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;
    this.bindCommon();
    this.paintCarPreview(qs<HTMLCanvasElement>(this.root, '.js-car-preview'), car);
  }

  // ---------------------------------------------------------------- garage --
  private showGarage(): void {
    this.teardownGame();
    this.screen = 'garage';
    const selected = getCar(this.selectedCarId);
    this.root.innerHTML = `
      <div class="screen">
        ${this.topbar()}
        <main class="page">
          <div class="page__head">
            <div>
              <h1>گاراژ</h1>
              <p>سه خودروی واقعی با مشخصات و شخصیت مکانیکی متفاوت.</p>
            </div>
            <button class="btn btn--ghost" data-action="home">بازگشت</button>
          </div>
          <div class="garage">
            ${CAR_PROFILES.map((car) => this.carCard(car)).join('')}
          </div>
          <section class="detail" id="car-detail">
            ${this.carDetail(selected)}
          </section>
        </main>
      </div>
    `;
    this.bindCommon();
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('.js-car-mini')) {
      const id = canvas.dataset.car;
      if (id) this.paintCarPreview(canvas, getCar(id), 0.82);
    }
    this.root.querySelectorAll<HTMLElement>('[data-car-select]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.carSelect;
        if (!id) return;
        this.selectedCarId = id;
        this.save.lastCarId = id;
        saveGame(this.save);
        this.showGarage();
      });
    });
    this.paintCarPreview(qs<HTMLCanvasElement>(this.root, '.js-detail-car'), selected, 0.9);
  }

  private carCard(car: CarProfile): string {
    const selected = car.id === this.selectedCarId;
    return `
      <button class="car-card ${selected ? 'is-selected' : ''}" data-car-select="${car.id}">
        <div class="car-card__head">
          <div>
            <div class="car-card__name">${car.brandFa} ${car.modelFa}</div>
            <div class="car-card__trim">${faNum(car.year)} · ${car.trim}</div>
          </div>
          <span class="badge">${car.layout}</span>
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
    return `
      <div class="stat">
        <span>${label}</span>
        <span class="stat__bar"><i style="width:${pct}%"></i></span>
        <span class="stat__value">${value}</span>
      </div>
    `;
  }

  private carDetail(car: CarProfile): string {
    return `
      <div class="detail__car">
        <canvas class="js-detail-car" width="820" height="330"></canvas>
      </div>
      <div>
        <h2>${car.brandFa} ${car.modelFa}</h2>
        <div class="hint">${faNum(car.year)} · ${car.trim} · ${car.marketFa}</div>
        <p style="margin-top:12px">${car.descriptionFa}</p>
        <div class="spec-grid" style="margin-top:16px">
          <div class="spec"><div class="spec__label">موتور</div><div class="spec__value">${faFixed(car.engine.torqueCurve[car.engine.torqueCurve.length - 1]!.rpm / 1000, 1)} هزار دور</div></div>
          <div class="spec"><div class="spec__label">قدرت</div><div class="spec__value">${faNum(car.specs.powerHp)} اسب بخار</div></div>
          <div class="spec"><div class="spec__label">گشتاور</div><div class="spec__value">${faNum(car.specs.torqueNm)} نیوتون‌متر</div></div>
          <div class="spec"><div class="spec__label">جعبه‌دنده</div><div class="spec__value">${car.transmissionFa}</div></div>
          <div class="spec"><div class="spec__label">وزن</div><div class="spec__value">${faGroup(car.numbers.massKg)} کیلوگرم</div></div>
          <div class="spec"><div class="spec__label">لاستیک</div><div class="spec__value">${car.specs.tireSize}</div></div>
          <div class="spec"><div class="spec__label">۰ تا ۱۰۰</div><div class="spec__value">${car.specs.zeroTo100S ? `${faFixed(car.specs.zeroTo100S, 1)} ثانیه` : '—'}</div></div>
          <div class="spec"><div class="spec__label">حداکثر سرعت</div><div class="spec__value">${faNum(car.specs.topSpeedKph)} km/h</div></div>
        </div>
        <p class="hint" style="margin-top:14px;line-height:1.9">${car.specs.sourceNoteFa}</p>
        <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn--primary" data-action="quick-with-car">مسابقه با این خودرو</button>
          <button class="btn btn--ghost" data-action="home">بازگشت</button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------- tracks --
  private showTracks(mode: GameMode): void {
    this.teardownGame();
    this.screen = 'tracks';
    this.mode = mode;
    this.root.innerHTML = `
      <div class="screen">
        ${this.topbar()}
        <main class="page">
          <div class="page__head">
            <div>
              <h1>${MODE_LABELS[mode]}</h1>
              <p>یک مسیر انتخاب کن. همهٔ مسیرها با فیزیک واقعی و سطوح مختلف ساخته شده‌اند.</p>
            </div>
            <button class="btn btn--ghost" data-action="home">بازگشت</button>
          </div>
          <div class="track-list">
            ${TRACKS.map((track) => this.trackCard(track)).join('')}
          </div>
          <div class="panel" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <div class="hint">مسیر انتخاب‌شده</div>
              <div style="font-size:19px;font-weight:700;margin-top:3px">${getTrack(this.selectedTrackId).nameFa}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn--ghost" data-action="garage">تغییر خودرو</button>
              <button class="btn btn--primary" data-action="start-selected">شروع</button>
            </div>
          </div>
        </main>
      </div>
    `;
    this.bindCommon();
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('.js-track-profile')) {
      const id = canvas.dataset.track;
      if (id) this.paintTrackProfile(canvas, getTrack(id));
    }
    this.root.querySelectorAll<HTMLElement>('[data-track-select]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.trackSelect;
        if (!id) return;
        this.selectedTrackId = id;
        this.save.lastTrackId = id;
        saveGame(this.save);
        this.showTracks(mode);
      });
    });
  }

  private trackCard(track: TrackDefinition): string {
    const selected = track.id === this.selectedTrackId;
    const best = this.save.bestTimes[track.id];
    const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < track.difficulty ? 'on' : ''}"></i>`).join('');
    return `
      <button class="track-card ${selected ? 'is-selected' : ''}" data-track-select="${track.id}">
        <div class="track-card__top">
          <div>
            <div class="track-card__name">${track.nameFa}</div>
            <div class="track-card__region">${track.regionFa} · ${track.nameEn}</div>
          </div>
          <span class="biome-chip">${BIOME_LABELS_FA[track.biome]}</span>
        </div>
        <canvas class="js-track-profile" data-track="${track.id}" width="620" height="120"></canvas>
        <p>${track.descriptionFa}</p>
        <div class="track-card__foot">
          <span class="dots" title="سختی">${dots}</span>
          <span>${faNum(Math.round(track.lengthM))} متر</span>
          <span>${best ? `رکورد: ${formatTime(best)}` : 'بدون رکورد'}</span>
        </div>
      </button>
    `;
  }

  // -------------------------------------------------------------- settings --
  private showSettings(): void {
    this.teardownGame();
    this.screen = 'settings';
    const s = this.save.settings;
    this.root.innerHTML = `
      <div class="screen">
        ${this.topbar()}
        <main class="page">
          <div class="page__head">
            <div><h1>تنظیمات</h1><p>کنترل‌ها، صدا و گزینه‌های نمایش.</p></div>
            <button class="btn btn--ghost" data-action="home">بازگشت</button>
          </div>
          <div class="settings">
            <div class="row">
              <div class="row__label"><strong>جای پدال‌ها</strong><span>چیدمان راست‌دست یا چپ‌دست</span></div>
              <div class="segmented" data-setting="hand">
                <button data-value="right" class="${s.pedal.handedness === 'right' ? 'is-active' : ''}">راست</button>
                <button data-value="left" class="${s.pedal.handedness === 'left' ? 'is-active' : ''}">چپ</button>
              </div>
            </div>
            <div class="row">
              <div class="row__label"><strong>اندازهٔ پدال‌ها</strong><span>بزرگ‌تر برای انگشت‌های بزرگ‌تر</span></div>
              <input type="range" min="0.75" max="1.35" step="0.05" value="${s.pedal.scale}" data-setting="scale" />
            </div>
            <div class="row">
              <div class="row__label"><strong>شفافیت پدال‌ها</strong><span>کمتر = دید بهتر جاده</span></div>
              <input type="range" min="0.4" max="1" step="0.02" value="${s.pedal.opacity}" data-setting="opacity" />
            </div>
            <div class="row">
              <div class="row__label"><strong>حساسیت</strong><span>بیشتر = حرکت کمتر انگشت، گاز بیشتر</span></div>
              <input type="range" min="0.7" max="1.3" step="0.05" value="${s.pedal.sensitivity}" data-setting="sensitivity" />
            </div>
            <div class="row">
              <div class="row__label"><strong>صدا</strong><span>موتور، تایر و برخورد</span></div>
              <button class="switch ${s.audio ? 'is-on' : ''}" data-setting="audio" aria-label="صدا"></button>
            </div>
            <div class="row">
              <div class="row__label"><strong>نمایش اطلاعات فیزیک</strong><span>برای بررسی و عیب‌یابی</span></div>
              <button class="switch ${s.showDebug ? 'is-on' : ''}" data-setting="debug" aria-label="نمایش دیباگ"></button>
            </div>
          </div>
          <div class="footer-actions">
            <span class="hint">نسخهٔ ${faNum(GAME_VERSION)} · داده‌ها فقط روی همین دستگاه ذخیره می‌شوند.</span>
            <button class="btn btn--danger btn--sm" data-action="reset-save">پاک کردن ذخیره‌ها</button>
          </div>
        </main>
      </div>
    `;
    this.bindCommon();
    this.bindSettings();
  }

  private bindSettings(): void {
    const s = this.save.settings;
    this.root.querySelectorAll<HTMLElement>('[data-setting="hand"] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        s.pedal.handedness = btn.dataset.value === 'left' ? 'left' : 'right';
        saveGame(this.save);
        this.showSettings();
      });
    });
    const bindRange = (key: 'scale' | 'opacity' | 'sensitivity') => {
      const input = qs<HTMLInputElement>(this.root, `input[data-setting="${key}"]`);
      input.addEventListener('input', () => {
        s.pedal[key] = Number(input.value);
        saveGame(this.save);
      });
    };
    bindRange('scale');
    bindRange('opacity');
    bindRange('sensitivity');

    qs<HTMLElement>(this.root, '[data-setting="audio"]').addEventListener('click', (e) => {
      s.audio = !s.audio;
      (e.currentTarget as HTMLElement).classList.toggle('is-on', s.audio);
      saveGame(this.save);
    });
    qs<HTMLElement>(this.root, '[data-setting="debug"]').addEventListener('click', (e) => {
      s.showDebug = !s.showDebug;
      (e.currentTarget as HTMLElement).classList.toggle('is-on', s.showDebug);
      saveGame(this.save);
    });
  }

  // ------------------------------------------------------------------ game --
  private startGame(mode: GameMode): void {
    this.teardownGame();
    this.screen = 'game';
    this.mode = mode;
    const profile = getCar(this.selectedCarId);
    const track = getTrack(this.selectedTrackId);
    const car = resolveCar(profile, DEFAULT_UPGRADES, DEFAULT_SETUP, DEFAULT_CONDITION);

    this.root.innerHTML = `
      <div class="game-shell">
        <canvas class="game-canvas"></canvas>
        <div class="hud">
          <div class="hud__top">
            <span class="timer js-timer">${formatTime(0)}</span>
            <span class="pips js-pips"></span>
          </div>
          <button class="hud__pause js-pause" aria-label="توقف">
            ${icon('pause')}
          </button>
          <div class="speedo">
            <div class="speedo__ring js-rpm-ring" style="--rpm:0">
              <div class="speedo__value">
                <strong class="js-speed">۰</strong>
                <span>کیلومتر بر ساعت</span>
              </div>
            </div>
            <div class="gearbox">
              <div class="gearbox__gear js-gear">N</div>
              <div class="gearbox__label">دنده</div>
              <div class="gearbox__rpm"><span class="js-rpm">۰</span> دور</div>
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
      rpmValue: qs(this.root, '.js-rpm'),
      hint: qs(this.root, '.js-hint'),
      count: qs(this.root, '.js-countdown'),
      toast: qs(this.root, '.js-toast'),
      pips: qs(this.root, '.js-pips'),
      gearSelect: qs(this.root, '.js-gear-select'),
      clutchHint: qs(this.root, '.js-hint'),
    };
    this.buildPips(track.checkpointsX.length);

    this.pedals = new PedalControls(this.save.settings.pedal);
    this.pedals.setClutchVisible(profile.transmission === 'manual');
    this.pedals.setChangeHandler(() => {});
    hud.append(this.pedals.root);

    this.scene = new GameScene(canvas, car, track, mode, {
      onFinish: (result) => this.showResults(result),
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
    });
    this.scene.showDebug = this.save.settings.showDebug;
    this.scene.resize();
    if (import.meta.env.DEV) {
      (window as unknown as { __charkhtaz?: unknown }).__charkhtaz = { scene: this.scene };
    }

    this.buildGearSelector(car);
    this.hudEls.count.innerHTML = '<span>۳</span>';
    qs<HTMLElement>(this.root, '.js-pause').addEventListener('click', () => this.openPause());
    qs<HTMLElement>(this.root, '.js-start').addEventListener('click', () => {
      this.scene?.vehicle.restartEngine();
      this.toast('موتور روشن شد');
    });
    this.scene.draw();
    this.lastFrame = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);

    this.toast(
      profile.transmission === 'manual'
        ? 'کلاچ را بالا بکش، دنده یک را بزن، بعد آرام رها کن'
        : 'دنده روی D است؛ فقط گاز بده',
    );
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
          this.toast(
            result.reason === 'clutch'
              ? 'برای تغییر دنده، کلاچ را تا انتها بگیر'
              : result.reason === 'busy'
                ? 'دنده در حال تعویض است'
                : 'این دنده در دسترس نیست',
          );
        }
      });
      host.append(btn);
      this.gearButtons.push(btn);
      return btn;
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

    els.timer.textContent = formatTime(scene.elapsedS + 0);
    els.speed.textContent = faNum(Math.round(tele.speedKph));
    els.gear.textContent = gearLabel(tele.gear);
    const maxRpm = scene.vehicle.car.engine.maxRpm;
    els.rpmRing.style.setProperty('--rpm', String(Math.min(1, tele.rpm / maxRpm)));
    els.rpmValue.textContent = faNum(Math.round(tele.rpm / 100) * 100);

    for (let i = 0; i < this.pips.length; i++) {
      this.pips[i]!.classList.toggle('on', i < scene.checkpointsHit);
    }

    const manual = Boolean(scene.vehicle.manual);
    let hint = '';
    if (!tele.engineRunning) hint = 'موتور خاموش شد — دکمهٔ استارت را بزن';
    else if (manual && tele.gear === 0) hint = 'کلاچ را بگیر و دنده ۱ را انتخاب کن';
    else if (manual && Math.abs(tele.clutchPedal) < 0.05 && tele.gear === 1 && tele.speedKph < 2 && tele.rpm < 600)
      hint = 'کلاچ را آرام رها کن؛ اگر موتور لرزید، کمی گاز بده';
    els.hint.textContent = hint;
    els.hint.classList.toggle('is-hidden', hint === '' || scene.countdown > 0);
    const startBtn = this.root.querySelector<HTMLElement>('.js-start');
    startBtn?.classList.toggle('is-hidden', tele.engineRunning);

    // Gear buttons reflect the engaged gear.
    const gearValues = manual
      ? [-1, 0, ...Array.from({ length: scene.vehicle.car.gearbox.gears.length }, (_, i) => i + 1)]
      : [-1, 0, 1];
    this.gearButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', gearValues[i] === tele.gear);
    });

    if (now > this.countdownHideAt && scene.countdown === 0) {
      if (els.count.textContent) els.count.innerHTML = '';
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
          <p>مسیر ${scene.track.nameFa} · ${MODE_LABELS[scene.mode]}</p>
          <div class="result-grid">
            <div class="result"><div class="result__label">زمان</div><div class="result__value">${formatTime(scene.elapsedS)}</div></div>
            <div class="result"><div class="result__label">سرعت اوج</div><div class="result__value">${faNum(Math.round(scene.vehicle.telemetry.speedKph))}<small> km/h</small></div></div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--primary" data-pause="resume">ادامه</button>
            <button class="btn btn--ghost" data-pause="restart">شروع دوباره</button>
            <button class="btn btn--ghost" data-pause="garage">گاراژ</button>
            <button class="btn btn--ghost" data-pause="home">منو</button>
          </div>
        </div>
      </div>
    `;
    overlay.querySelectorAll<HTMLElement>('[data-pause]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.pause;
        if (action === 'resume') {
          overlay.innerHTML = '';
          scene.setPaused(false);
          this.lastFrame = performance.now();
        } else if (action === 'restart') {
          this.startGame(this.mode);
        } else if (action === 'garage') {
          this.showGarage();
        } else {
          this.showHome();
        }
      });
    });
  }

  private showResults(result: RaceResult): void {
    const overlay = this.root.querySelector<HTMLElement>('.js-overlay');
    if (!overlay) return;
    const key = result.trackId;
    const previous = this.save.bestTimes[key];
    const isBest =
      result.mode !== 'practice' && (previous === undefined || result.timeS < previous);
    if (isBest) {
      this.save.bestTimes[key] = result.timeS;
    }
    this.save.racesFinished += 1;
    saveGame(this.save);

    overlay.innerHTML = `
      <div class="overlay">
        <div class="modal">
          <div>
            <div class="hint">${MODE_LABELS[result.mode]} · ${getTrack(result.trackId).nameFa}</div>
            <h2 style="margin-top:6px">${isBest ? 'رکورد جدید!' : 'خط پایان'}</h2>
          </div>
          <div class="result-grid">
            <div class="result ${isBest ? 'result--best' : ''}">
              <div class="result__label">زمان</div>
              <div class="result__value">${formatTime(result.timeS)}</div>
            </div>
            <div class="result">
              <div class="result__label">سرعت اوج</div>
              <div class="result__value">${faNum(Math.round(result.topSpeedKph))}<small> km/h</small></div>
            </div>
            <div class="result">
              <div class="result__label">ایست‌ها</div>
              <div class="result__value">${faNum(result.checkpointsHit)}/${faNum(result.totalCheckpoints)}</div>
            </div>
            <div class="result">
              <div class="result__label">آسیب بدنه</div>
              <div class="result__value">${faNum(Math.round(result.damage * 100))}٪</div>
            </div>
            ${result.penaltiesS > 0 ? `<div class="result"><div class="result__label">جریمهٔ بازگشت</div><div class="result__value">+${faNum(Math.round(result.penaltiesS))}<small> ثانیه</small></div></div>` : ''}
            ${previous !== undefined ? `<div class="result"><div class="result__label">رکورد قبلی</div><div class="result__value">${formatTime(previous)}</div></div>` : ''}
          </div>
          <div class="modal__actions">
            <button class="btn btn--primary" data-result="retry">دوباره</button>
            <button class="btn btn--ghost" data-result="tracks">انتخاب مسیر</button>
            <button class="btn btn--ghost" data-result="home">منو</button>
          </div>
        </div>
      </div>
    `;
    overlay.querySelectorAll<HTMLElement>('[data-result]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.result;
        if (action === 'retry') this.startGame(this.mode);
        else if (action === 'tracks') this.showTracks(this.mode);
        else this.showHome();
      });
    });
  }

  // ----------------------------------------------------------------- common --
  private bindCommon(): void {
    this.root.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        if (action === 'home') this.showHome();
        else if (action === 'garage') this.showGarage();
        else if (action === 'tracks') this.showTracks(this.mode);
        else if (action === 'settings') this.showSettings();
        else if (action === 'mode') this.showTracks((el.dataset.mode as GameMode) ?? 'race');
        else if (action === 'start-race') this.showTracks('race');
        else if (action === 'start-selected') this.startGame(this.mode);
        else if (action === 'quick-with-car') this.showTracks('race');
        else if (action === 'reset-save') {
          resetSave();
          this.save = loadSave();
          this.showSettings();
        }
      });
    });
  }

  private topbar(): string {
    const nav =
      this.screen === 'game'
        ? ''
        : `
        <div class="topbar__right">
          <button class="btn btn--ghost btn--sm" data-action="garage">گاراژ</button>
          <button class="btn btn--ghost btn--sm" data-action="tracks">مسیرها</button>
          <button class="btn btn--ghost btn--sm" data-action="settings">تنظیمات</button>
        </div>`;
    return `
      <header class="topbar">
        <div class="brand">
          <div class="brand__mark">چ</div>
          <div>
            <div class="brand__name">چرخ‌تاز</div>
            <div class="brand__latin">CHARKHTAZ · RACE · SHIFT · CONQUER</div>
          </div>
        </div>
        ${nav}
      </header>
    `;
  }

  private toast(message: string): void {
    const el = this.hudEls?.toast;
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  private pulseCheckpoint(): void {
    const el = this.hudEls?.timer;
    if (!el) return;
    el.classList.add('timer--penalty');
    window.setTimeout(() => el.classList.remove('timer--penalty'), 400);
  }

  private teardownGame(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.scene = null;
    this.pedals = null;
    this.hudEls = null;
    this.gearButtons = [];
    this.pips = [];
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
      const n = Number(event.code.slice(5));
      if (n === 0) this.scene.requestGear(0);
      else this.scene.requestGear(n);
    }
  };

  // ---------------------------------------------------------------- preview --
  private paintCarPreview(canvas: HTMLCanvasElement, car: CarProfile, fill = 0.86): void {
    const resolved = resolveCar(car, DEFAULT_UPGRADES, DEFAULT_SETUP, DEFAULT_CONDITION);
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

    const ppm = (cssW * fill) / resolved.numbers.lengthM;
    const halfH = resolved.numbers.heightM * 0.28;
    const rest = Math.max(0.13, resolved.numbers.suspensionTravelM * 0.7);
    const clearance = Math.max(0.16, rest + resolved.numbers.wheelRadiusM - 0.28);
    const chassisCenterY = halfH + clearance;
    const wheelY = -(chassisCenterY - resolved.numbers.wheelRadiusM);

    // Ground line.
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const groundY = cssH * 0.9;
    ctx.beginPath();
    ctx.moveTo(cssW * 0.06, groundY);
    ctx.lineTo(cssW * 0.94, groundY);
    ctx.stroke();

    ctx.save();
    ctx.translate(cssW / 2, groundY - chassisCenterY * ppm);
    const wheels = [
      { xM: -resolved.numbers.wheelbaseM / 2, yM: wheelY, radiusM: resolved.numbers.wheelRadiusM },
      { xM: resolved.numbers.wheelbaseM / 2, yM: wheelY, radiusM: resolved.numbers.wheelRadiusM },
    ];
    for (const w of wheels) {
      drawWheel(ctx, {
        x: w.xM * ppm,
        y: -w.yM * ppm,
        radiusPx: w.radiusM * ppm,
        angleRad: 0,
        index: 1,
        slip: 0,
      });
    }
    drawCarBody(ctx, resolved, ppm, wheels);
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
    for (const run of track.runs) {
      for (const p of run.points) {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    const spanY = Math.max(1, maxY - minY);
    const scaleX = (cssW - pad * 2) / Math.max(1, track.lengthM);
    const baseY = cssH - pad;

    // Sky tint.
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
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
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

    // Checkpoint ticks.
    ctx.fillStyle = 'rgba(217,164,65,0.75)';
    for (const cx of track.checkpointsX) {
      const x = pad + (cx - track.startX) * scaleX;
      ctx.fillRect(x - 1, cssH - 8, 2, 6);
    }
    void minY;
    void SURFACE_LABELS_FA;
  }
}

function icon(name: 'flag' | 'clock' | 'wheel' | 'pause'): string {
  switch (name) {
    case 'flag':
      return '<svg viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h11l-2 4 2 4H6"/></svg>';
    case 'clock':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
    case 'wheel':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 4v5M5.5 15l5-2M18.5 15l-5-2"/></svg>';
    case 'pause':
      return '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="5" width="4" height="14" rx="1"/></svg>';
  }
}
