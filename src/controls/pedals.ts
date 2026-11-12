import { clamp01 } from '../core/math';
import { faNum } from '../core/format';

export type PedalKind = 'throttle' | 'brake' | 'clutch';

export interface PedalSettings {
  handedness: 'right' | 'left';
  /** Control scale multiplier (0.75 – 1.35). */
  scale: number;
  /** Panel opacity (0.4 – 1). */
  opacity: number;
  /** 0.7 – 1.3; values above 1 make small movements count more. */
  sensitivity: number;
  /** Spring return rate, units per second, for each pedal. */
  spring: Record<PedalKind, number>;
}

export const DEFAULT_PEDAL_SETTINGS: PedalSettings = {
  handedness: 'right',
  scale: 1,
  opacity: 0.92,
  sensitivity: 1,
  spring: { throttle: 5.5, brake: 7.5, clutch: 3.2 },
};

interface PedalRuntime {
  kind: PedalKind;
  el: HTMLElement;
  track: HTMLElement;
  fill: HTMLElement;
  thumb: HTMLElement;
  valueEl: HTMLElement;
  value: number;
  pointerId: number | null;
  labelEl: HTMLElement;
}

const LABELS: Record<PedalKind, string> = {
  throttle: 'گاز',
  brake: 'ترمز',
  clutch: 'کلاچ',
};

/**
 * Three independent vertical analogue sliders.
 *
 * Each pedal owns its pointer id and captures it, so a thumb on the throttle
 * cannot steal the brake or clutch drag. Up = more pedal. Releasing the finger
 * springs the pedal back with a configurable rate; that decay feeds the
 * simulation directly (a fast clutch return is a fast clutch engagement).
 */
export class PedalControls {
  readonly root: HTMLElement;
  private readonly pedals: PedalRuntime[] = [];
  private settings: PedalSettings;
  private clutchVisible = true;
  private keys = new Set<string>();
  private onChange: (() => void) | null = null;

  constructor(settings: PedalSettings = DEFAULT_PEDAL_SETTINGS) {
    this.settings = { ...settings, spring: { ...settings.spring } };
    this.root = document.createElement('div');
    this.root.className = 'pedals';
    this.root.setAttribute('aria-label', 'کنترل پدال‌ها');

    for (const kind of ['throttle', 'brake', 'clutch'] as PedalKind[]) {
      const el = document.createElement('div');
      el.className = `pedal pedal--${kind}`;
      el.dataset.pedal = kind;

      const label = document.createElement('div');
      label.className = 'pedal__label';
      label.textContent = LABELS[kind];

      const track = document.createElement('div');
      track.className = 'pedal__track';
      track.setAttribute('role', 'slider');
      track.setAttribute('aria-label', LABELS[kind]);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', '0');
      track.tabIndex = 0;

      const fill = document.createElement('div');
      fill.className = 'pedal__fill';
      const thumb = document.createElement('div');
      thumb.className = 'pedal__thumb';
      const valueEl = document.createElement('div');
      valueEl.className = 'pedal__value';
      valueEl.textContent = '۰٪';

      track.append(fill, thumb, valueEl);
      el.append(label, track);
      this.root.append(el);

      const runtime: PedalRuntime = {
        kind,
        el,
        track,
        fill,
        thumb,
        valueEl,
        value: 0,
        pointerId: null,
        labelEl: label,
      };
      this.pedals.push(runtime);
      this.bind(runtime);
    }

    this.applySettings();
    this.bindKeyboard();
  }

  get throttle(): number {
    return this.get('throttle');
  }

  get brake(): number {
    return this.get('brake');
  }

  get clutch(): number {
    return this.get('clutch');
  }

  get(kind: PedalKind): number {
    return this.pedals.find((p) => p.kind === kind)?.value ?? 0;
  }

  setChangeHandler(fn: () => void): void {
    this.onChange = fn;
  }

  setSettings(settings: PedalSettings): void {
    this.settings = { ...settings, spring: { ...settings.spring } };
    this.applySettings();
  }

  setClutchVisible(visible: boolean): void {
    this.clutchVisible = visible;
    const clutch = this.pedals.find((p) => p.kind === 'clutch');
    if (clutch) clutch.el.classList.toggle('pedal--hidden', !visible);
    if (!visible) this.set('clutch', 0);
  }

  /** Reset all pedals (pause, focus loss, scene change). */
  reset(): void {
    for (const pedal of this.pedals) {
      pedal.pointerId = null;
      pedal.value = 0;
      this.paint(pedal);
    }
  }

  /** Spring return + keyboard decay. Call once per presented frame. */
  update(dt: number): void {
    for (const pedal of this.pedals) {
      if (pedal.kind === 'clutch' && !this.clutchVisible) continue;
      const keyHeld =
        (pedal.kind === 'throttle' && (this.keys.has('KeyW') || this.keys.has('ArrowUp'))) ||
        (pedal.kind === 'brake' && (this.keys.has('KeyS') || this.keys.has('ArrowDown'))) ||
        (pedal.kind === 'clutch' && this.keys.has('KeyC'));
      if (pedal.pointerId !== null || keyHeld) continue;
      if (pedal.value <= 0.0001) {
        if (pedal.value !== 0) {
          pedal.value = 0;
          this.paint(pedal);
        }
        continue;
      }
      const rate = this.settings.spring[pedal.kind];
      pedal.value = Math.max(0, pedal.value - rate * dt);
      this.paint(pedal);
    }
  }

  private bind(pedal: PedalRuntime): void {
    const positionToValue = (clientY: number): number => {
      const rect = pedal.track.getBoundingClientRect();
      const raw = 1 - (clientY - rect.top) / Math.max(rect.height, 1);
      const s = this.settings.sensitivity;
      const shaped = clamp01(0.5 + (raw - 0.5) * s);
      return clamp01(shaped);
    };

    pedal.track.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (pedal.kind === 'clutch' && !this.clutchVisible) return;
      pedal.pointerId = event.pointerId;
      pedal.track.setPointerCapture(event.pointerId);
      pedal.track.classList.add('is-active');
      this.set(pedal.kind, positionToValue(event.clientY));
      this.onChange?.();
    });

    pedal.track.addEventListener('pointermove', (event) => {
      if (pedal.pointerId !== event.pointerId) return;
      event.preventDefault();
      this.set(pedal.kind, positionToValue(event.clientY));
      this.onChange?.();
    });

    const release = (event: PointerEvent) => {
      if (pedal.pointerId !== event.pointerId) return;
      pedal.pointerId = null;
      pedal.track.classList.remove('is-active');
      if (pedal.track.hasPointerCapture(event.pointerId)) {
        pedal.track.releasePointerCapture(event.pointerId);
      }
      this.onChange?.();
    };
    pedal.track.addEventListener('pointerup', release);
    pedal.track.addEventListener('pointercancel', release);
    pedal.track.addEventListener('lostpointercapture', (event) => {
      if (pedal.pointerId === event.pointerId) {
        pedal.pointerId = null;
        pedal.track.classList.remove('is-active');
      }
    });

    // Keyboard fine control (desktop / QA).
    pedal.track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        this.set(pedal.kind, pedal.value + 0.05);
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        this.set(pedal.kind, pedal.value - 0.05);
        event.preventDefault();
      }
    });
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      if (['KeyW', 'KeyS', 'KeyC', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        this.keys.add(event.code);
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      for (const pedal of this.pedals) pedal.pointerId = null;
    });
  }

  private set(kind: PedalKind, value: number): void {
    const pedal = this.pedals.find((p) => p.kind === kind);
    if (!pedal) return;
    pedal.value = clamp01(value);
    this.paint(pedal);
  }

  private paint(pedal: PedalRuntime): void {
    const pct = Math.round(pedal.value * 100);
    pedal.el.style.setProperty('--v', String(pedal.value));
    pedal.track.setAttribute('aria-valuenow', String(pct));
    pedal.valueEl.textContent = `${faNum(pct)}٪`;
    // Throttle tint reinforces "more is more" without changing the geometry.
    pedal.el.classList.toggle('pedal--high', pedal.value > 0.85);
  }

  private applySettings(): void {
    this.root.dataset.hand = this.settings.handedness;
    this.root.style.setProperty('--pedal-scale', String(this.settings.scale));
    this.root.style.setProperty('--pedal-opacity', String(this.settings.opacity));
  }

  destroy(): void {
    this.root.remove();
  }
}
