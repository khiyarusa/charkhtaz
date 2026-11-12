import { CAR_PROFILES, getCar, type CarProfile } from './profiles';
import { EXTRA_CARS, EXTRA_SILHOUETTES } from './extra-cars';

/**
 * The complete playable roster.
 *
 * The extra cars carry per-model silhouette outlines so the renderer draws a
 * 206 like a hatchback and an MX-5 like a low roadster instead of reusing a
 * generic category template.
 */
function withSilhouette(car: CarProfile): CarProfile {
  const outline = EXTRA_SILHOUETTES[car.id];
  if (!outline || outline.length < 6) return car;
  return { ...car, art: { ...car.art, profile: outline } };
}

export const ALL_CARS: readonly CarProfile[] = [...CAR_PROFILES, ...EXTRA_CARS].map(withSilhouette);

export function getAnyCar(id: string): CarProfile {
  const car = ALL_CARS.find((c) => c.id === id);
  if (!car) throw new Error(`Unknown car: ${id}`);
  return car;
}

export function isRosterCar(id: string): boolean {
  return ALL_CARS.some((c) => c.id === id);
}

export function carDisplayName(car: CarProfile): string {
  return `${car.brandFa} ${car.modelFa}`.trim();
}

export function carInitials(car: CarProfile): string {
  return `${car.brandFa.charAt(0)}${car.modelFa.charAt(0)}`;
}

/** Kept for callers that only know the original three. */
export { getCar };
