import { BLUEPRINTS } from './blueprints';
import type { CarBlueprint } from './types';

const BY_ID = new Map(BLUEPRINTS.map((bp) => [bp.id, bp]));

/** The authored side elevation for a car. Throws for an unknown id. */
export function blueprintFor(id: string): CarBlueprint {
  const bp = BY_ID.get(id);
  if (!bp) throw new Error(`No vehicle art blueprint for "${id}"`);
  return bp;
}

export function hasBlueprint(id: string): boolean {
  return BY_ID.has(id);
}

export { BLUEPRINTS };
export type { CarBlueprint } from './types';
