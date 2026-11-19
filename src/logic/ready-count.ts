import { READY_COUNT } from '@/config';

// The count into the first wall after the tutorial: READY?, then 3, 2, 1.
export const READY_LABELS = ['READY?', '3', '2', '1'] as const;

export function readyCountMs(): number {
  return READY_COUNT.readyMs + (READY_LABELS.length - 1) * READY_COUNT.stepMs;
}

// Which label shows `elapsedMs` into the count, as its index in
// READY_LABELS, or READY_LABELS.length once the count is over.
export function readyStep(elapsedMs: number): number {
  if (elapsedMs < READY_COUNT.readyMs) return 0;
  const numbers = Math.floor((elapsedMs - READY_COUNT.readyMs) / READY_COUNT.stepMs);
  return Math.min(READY_LABELS.length, 1 + numbers);
}
