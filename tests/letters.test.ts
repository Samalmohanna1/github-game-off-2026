import { describe, expect, it } from 'vitest';
import { DIFFICULTY_TIERS, MAX_LETTERS, MAX_LETTERS_SHIFT_WALL, STRETCH_WEIGHTS } from '@/config';
import { KEYBOARD } from '@/data/keyboard';
import { planWall } from '@/logic/difficulty';
import {
  generateLetters,
  isAdjacent,
  onSeparateFingers,
  orderLetters,
  stretchScore,
  uppercasePositions,
} from '@/logic/letters';
import { isUppercaseLetter } from '@/logic/sequence';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const lower = (letters: readonly string[]) => letters.map((l) => l.toLowerCase());

describe('stretchScore', () => {
  it('scores three neighbors on one row by their spread alone', () => {
    // a-s-d: 2 key widths apart, one row, one hand, three fingers.
    expect(stretchScore(['a', 's', 'd'])).toBeCloseTo(2);
  });

  it('adds row spread for each extra keyboard row', () => {
    const oneRow = stretchScore(['q', 'p']);
    const twoRows = stretchScore(['q', 'l']);
    expect(twoRows - Math.hypot(8.25 - 0, 1)).toBeCloseTo(STRETCH_WEIGHTS.rowSpread);
    expect(oneRow).toBeCloseTo(9);
  });

  it('penalizes keys on the same finger', () => {
    // q, a and z are all the left pinky: 3 pairs.
    const spread = Math.hypot(0.75, 2);
    expect(stretchScore(['q', 'a', 'z'])).toBeCloseTo(spread + 2 * STRETCH_WEIGHTS.rowSpread + 3 * STRETCH_WEIGHTS.sameFinger);
  });

  it('penalizes more letters on one side than one hand can hold', () => {
    // Four left-hand letters on four different fingers, one row.
    const fourLeft = stretchScore(['q', 'w', 'e', 'r']);
    expect(fourLeft).toBeCloseTo(3 + STRETCH_WEIGHTS.crossReach);
  });

  it('rates the full stretch Q + P + Z as hard', () => {
    expect(stretchScore(['q', 'p', 'z'])).toBeGreaterThan(stretchScore(['f', 'g', 'h']));
  });

  it('ignores case', () => {
    expect(stretchScore(['Q', 'p', 'Z'])).toBe(stretchScore(['q', 'p', 'z']));
  });
});

describe('orderLetters', () => {
  it('never puts neighboring keys back to back when the tier forbids it', () => {
    for (const seed of SEEDS) {
      const order = orderLetters(['a', 's', 'k', 'l'], false, seeded(seed));
      expect(order).not.toBeNull();
      order!.slice(1).forEach((letter, i) => expect(isAdjacent(order![i]!, letter)).toBe(false));
    }
  });

  it('returns null when every order has neighbors back to back', () => {
    // s, d, e and w cluster so tightly that only d and w are not neighbors.
    expect(orderLetters(['s', 'd', 'e', 'w'], false, seeded(1))).toBeNull();
  });
});

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

  it('throws when the letters cannot be spread out', () => {
    expect(() => uppercasePositions(3, 3, Math.random)).toThrow();
  });
});

// PLAN.md M5 done-when: every tier's combos land in its score range, never
// repeat a letter, never put two capitals back to back, and never exceed the
// letter caps.
describe.each(DIFFICULTY_TIERS.map((tier) => [tier.name, tier] as const))('%s walls', (_name, tier) => {
  const walls = SEEDS.map((seed) => {
    const random = seeded(seed);
    const plan = planWall(tier.fromWall + (seed % 2), random);
    return { plan, combo: generateLetters(plan, random) };
  });

  it("score inside the planned stretch range (the tier's, or its Shift Wall one)", () => {
    for (const { plan, combo } of walls) {
      expect(combo.stretch).toBeGreaterThanOrEqual(plan.stretch[0]);
      expect(combo.stretch).toBeLessThanOrEqual(plan.stretch[1]);
    }
  });

  it('never repeat a letter', () => {
    for (const { combo } of walls) expect(new Set(lower(combo.letters)).size).toBe(combo.letters.length);
  });

  it('never put two capitals back to back, and use the planned number', () => {
    for (const { plan, combo } of walls) {
      expect(combo.letters.filter(isUppercaseLetter)).toHaveLength(plan.shiftLetters);
      combo.letters.slice(1).forEach((letter, i) => {
        expect(isUppercaseLetter(letter) && isUppercaseLetter(combo.letters[i]!)).toBe(false);
      });
    }
  });

  it('never exceed the letter caps', () => {
    for (const { plan, combo } of walls) {
      expect(combo.letters).toHaveLength(plan.letters);
      expect(combo.letters.length).toBeLessThanOrEqual(plan.shiftWall ? MAX_LETTERS_SHIFT_WALL : MAX_LETTERS);
    }
  });

  it.runIf(!tier.allowAdjacent)('never prompt neighboring keys back to back', () => {
    for (const { combo } of walls) {
      combo.letters.slice(1).forEach((letter, i) => expect(isAdjacent(combo.letters[i]!, letter)).toBe(false));
    }
  });

  it.runIf(!tier.allowSameFinger)('put every letter on its own finger', () => {
    for (const { combo } of walls) expect(onSeparateFingers(combo.letters)).toBe(true);
  });
});

describe('onSeparateFingers', () => {
  it('spots two keys under one finger, case or not', () => {
    expect(onSeparateFingers(['q', 'p', 'z'])).toBe(false); // q and z: left pinky
    expect(onSeparateFingers(['J', 'm'])).toBe(false); // right index
    expect(onSeparateFingers(['q', 'p', 'x'])).toBe(true);
  });

  it('leaves enough fingers for the largest combo', () => {
    expect(new Set(Object.values(KEYBOARD).map((key) => key.finger)).size).toBeGreaterThanOrEqual(MAX_LETTERS);
  });
});

describe('generateLetters', () => {
  const rules = { stretch: [0, 99] as const, allowAdjacent: true, allowSameFinger: true, shiftLetters: 0 };

  it('refuses more letters than the cap', () => {
    expect(() => generateLetters({ ...rules, letters: MAX_LETTERS + 1 }, seeded(1))).toThrow();
  });

  it('falls back to the closest combo when the range is out of reach', () => {
    const combo = generateLetters({ ...rules, letters: 3, stretch: [100, 200] }, seeded(1));
    expect(combo.letters).toHaveLength(3);
    expect(combo.stretch).toBeLessThan(100);
  });

  it('keeps one finger per letter even when falling back', () => {
    for (const seed of SEEDS) {
      const combo = generateLetters({ ...rules, letters: MAX_LETTERS, stretch: [100, 200], allowSameFinger: false }, seeded(seed));
      expect(onSeparateFingers(combo.letters)).toBe(true);
    }
  });
});
