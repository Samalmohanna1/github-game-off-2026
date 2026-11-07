import { WALL_EASE_POWER, WALL_START_SCALE, WRONG_KEY_JUMP } from '@/config';

// t is linear in time (elapsed / wall time), so the timing thresholds and
// WRONG_KEY_JUMP mean fractions of the wall's time. The ease-in only shapes
// how the wall looks as it approaches.
export function advanceT(t: number, dtSeconds: number, wallTimeSeconds: number): number {
  return Math.min(1, t + dtSeconds / wallTimeSeconds);
}

export function jumpT(t: number): number {
  return Math.min(1, t + WRONG_KEY_JUMP);
}

export function easeIn(t: number): number {
  return t ** WALL_EASE_POWER;
}

export function wallScale(t: number): number {
  return WALL_START_SCALE + (1 - WALL_START_SCALE) * easeIn(t);
}
