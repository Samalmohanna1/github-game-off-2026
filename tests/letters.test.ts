import { describe, expect, it } from 'vitest';
import { randomLetters, uppercasePositions } from '@/logic/letters';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe('uppercasePositions', () => {
  it('returns the requested number of positions inside the combo', () => {
    for (const seed of SEEDS) {
      const positions = uppercasePositions(5, 2, seeded(seed));
      expect(positions).toHaveLength(2);
      for (const p of positions) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThan(5);
      }
    }
  });

  it('never puts two uppercase letters back to back', () => {
    for (const seed of SEEDS) {
      const positions = uppercasePositions(5, 3, seeded(seed));
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]! - positions[i - 1]!).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('throws when the letters cannot be spread out', () => {
    expect(() => uppercasePositions(3, 3)).toThrow();
  });
});

describe('randomLetters', () => {
  it('never repeats a letter in a combo', () => {
    for (const seed of SEEDS) {
      const letters = randomLetters(5, 2, seeded(seed)).map((l) => l.toLowerCase());
      expect(new Set(letters).size).toBe(5);
    }
  });

  it('uppercases exactly the requested number of letters', () => {
    for (const seed of SEEDS) {
      const letters = randomLetters(3, 1, seeded(seed));
      expect(letters.filter((l) => l === l.toUpperCase())).toHaveLength(1);
      for (const l of letters) expect(l).toMatch(/^[a-z]$/i);
    }
  });
});
