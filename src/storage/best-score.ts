import { BEST_SCORE_KEY } from '@/config';

export type ScoreStore = Pick<Storage, 'getItem' | 'setItem'>;

// localStorage can be missing, blocked (private windows, embedded iframes) or
// full, so every access is guarded and a failure just means no saved best.
function browserStore(): ScoreStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadBest(store: ScoreStore | null = browserStore()): number {
  try {
    const best = Number(store?.getItem(BEST_SCORE_KEY));
    return Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  } catch {
    return 0;
  }
}

// Saves the score if it beats the stored best; returns the best either way.
export function recordBest(score: number, store: ScoreStore | null = browserStore()): number {
  const best = Math.max(loadBest(store), score);
  try {
    store?.setItem(BEST_SCORE_KEY, String(best));
  } catch {
    // Storage is blocked or full; the best just isn't kept.
  }
  return best;
}
