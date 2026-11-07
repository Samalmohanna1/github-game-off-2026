import { describe, expect, it } from 'vitest';
import { BEST_SCORE_KEY } from '@/config';
import { loadBest, recordBest, type ScoreStore } from '@/storage/best-score';

function memoryStore(initial?: string): ScoreStore & { data: Map<string, string> } {
  const data = new Map<string, string>(initial === undefined ? [] : [[BEST_SCORE_KEY, initial]]);
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const brokenStore: ScoreStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('best score', () => {
  it('starts at 0 with nothing saved', () => {
    expect(loadBest(memoryStore())).toBe(0);
  });

  it('keeps the higher of the saved best and the new score', () => {
    const store = memoryStore('500');
    expect(recordBest(300, store)).toBe(500);
    expect(recordBest(800, store)).toBe(800);
    expect(store.data.get(BEST_SCORE_KEY)).toBe('800');
  });

  it('treats a corrupt saved value as no best', () => {
    expect(loadBest(memoryStore('banana'))).toBe(0);
    expect(loadBest(memoryStore('-40'))).toBe(0);
  });

  it('survives storage that throws or is missing', () => {
    expect(loadBest(brokenStore)).toBe(0);
    expect(recordBest(250, brokenStore)).toBe(250);
    expect(recordBest(250, null)).toBe(250);
  });
});
