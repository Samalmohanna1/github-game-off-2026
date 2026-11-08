import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_TIERS,
  MAX_LETTERS,
  MAX_LETTERS_SHIFT_WALL,
  MIN_WALL_TIME,
  SHIFT_WALL_CHANCE_MAX,
  WALL_TIME_DECAY,
} from '@/config';
import { FIRST_SHIFT_WALL, planWall, shiftWallChanceFor, tierFor, wallTimeFor } from '@/logic/difficulty';
import { holeLaneCandidates } from '@/logic/lanes';
import { seeded } from './seeded';

const LANES = Array.from({ length: 7 }, (_, i) => i);

describe('the tier table (PLAN.md §5)', () => {
  it('starts at wall 1 and runs in wall order', () => {
    expect(DIFFICULTY_TIERS[0]!.fromWall).toBe(1);
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => expect(tier.fromWall).toBeGreaterThan(DIFFICULTY_TIERS[i]!.fromWall));
  });

  it('matches the plan for walls, letters and Shift letters', () => {
    expect(DIFFICULTY_TIERS.map((t) => [t.fromWall, t.letters, t.shiftLetters])).toEqual([
      [1, 3, [0, 0]],
      [4, 3, [0, 0]],
      [6, 4, [0, 0]],
      [8, 4, [0, 0]],
      [10, 4, [1, 1]],
      [13, 5, [1, 1]],
      [16, 5, [1, 2]],
      [19, 5, [1, 2]],
    ]);
  });

  it('adds at most one new demand per tier, so the curve has no cliffs', () => {
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => {
      const prev = DIFFICULTY_TIERS[i]!;
      // More letters or shared fingers score higher on their own, so a wider
      // stretch range only counts as a demand when neither changes.
      const sameScoring = tier.letters === prev.letters && tier.allowSameFinger === prev.allowSameFinger;
      const added = [
        tier.letters > prev.letters,
        sameScoring && tier.stretch[0] > prev.stretch[0],
        tier.shiftLetters[1] > prev.shiftLetters[1],
        tier.shiftWallChance > 0 && prev.shiftWallChance === 0,
        tier.allowSameFinger && !prev.allowSameFinger,
      ].filter(Boolean);
      expect(added.length, tier.name).toBeLessThanOrEqual(1);
    });
  });

  it('never gives a later tier a longer wall time', () => {
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => {
      expect(tier.wallTime).toBeLessThanOrEqual(DIFFICULTY_TIERS[i]!.wallTime);
    });
  });

  it('only lets letters sit next to each other on the 3-letter walls 1-5', () => {
    expect(DIFFICULTY_TIERS.map((t) => t.allowAdjacent)).toEqual([true, true, ...DIFFICULTY_TIERS.slice(2).map(() => false)]);
    for (const tier of DIFFICULTY_TIERS) expect(tier.allowAdjacent).toBe(tier.letters === 3);
  });

  it('keeps one finger per letter until the last tier', () => {
    expect(DIFFICULTY_TIERS.map((t) => t.allowSameFinger)).toEqual([...DIFFICULTY_TIERS.slice(1).map(() => false), true]);
  });

  it('never asks for more than MAX_LETTERS', () => {
    for (const tier of DIFFICULTY_TIERS) expect(tier.letters).toBeLessThanOrEqual(MAX_LETTERS);
  });

  it('never gets easier: stretch ranges, capitals, hole distance and Shift Wall chance never drop', () => {
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => {
      const prev = DIFFICULTY_TIERS[i]!;
      expect(tier.letters).toBeGreaterThanOrEqual(prev.letters);
      expect(tier.stretch[0]).toBeGreaterThanOrEqual(prev.stretch[0]);
      expect(tier.stretch[1]).toBeGreaterThanOrEqual(prev.stretch[1]);
      expect(tier.shiftLetters[1]).toBeGreaterThanOrEqual(prev.shiftLetters[1]);
      expect(tier.holeDistance[1]).toBeGreaterThanOrEqual(prev.holeDistance[1]);
      expect(tier.shiftWallChance).toBeGreaterThanOrEqual(prev.shiftWallChance);
    });
  });

  it('can always place the hole, from every lane, in every tier', () => {
    for (const tier of DIFFICULTY_TIERS) {
      for (const lane of LANES) expect(holeLaneCandidates(lane, tier.holeDistance).length).toBeGreaterThan(0);
    }
  });
});

describe('tierFor', () => {
  it('maps walls to their band', () => {
    expect([1, 3, 4, 5, 6, 8, 10, 12, 13, 16, 18, 19, 99].map((w) => tierFor(w).name)).toEqual([
      'Easy',
      'Easy',
      'Shift Walls',
      'Shift Walls',
      'Four letters',
      'Wider stretch',
      'Capitals',
      'Capitals',
      'Five letters',
      'Two capitals',
      'Two capitals',
      'Shared fingers',
      'Shared fingers',
    ]);
  });
});

describe('wallTimeFor', () => {
  it('uses each tier time before the last tier', () => {
    DIFFICULTY_TIERS.slice(0, -1).forEach((tier, i) => {
      const lastWall = DIFFICULTY_TIERS[i + 1]!.fromWall - 1;
      expect(wallTimeFor(tier.fromWall)).toBe(tier.wallTime);
      expect(wallTimeFor(lastWall)).toBe(tier.wallTime);
    });
  });

  it('drops by WALL_TIME_DECAY per wall in the last tier', () => {
    const last = DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1]!;
    expect(wallTimeFor(last.fromWall)).toBeCloseTo(last.wallTime * (1 - WALL_TIME_DECAY));
    expect(wallTimeFor(last.fromWall + 1)).toBeCloseTo(wallTimeFor(last.fromWall) * (1 - WALL_TIME_DECAY));
  });

  it('never goes under MIN_WALL_TIME and never gets longer', () => {
    for (let wall = 2; wall < 200; wall++) {
      expect(wallTimeFor(wall)).toBeGreaterThanOrEqual(MIN_WALL_TIME);
      expect(wallTimeFor(wall)).toBeLessThanOrEqual(wallTimeFor(wall - 1));
    }
    expect(wallTimeFor(200)).toBe(MIN_WALL_TIME);
  });
});

describe('shiftWallChanceFor', () => {
  it('is 0 before wall 4, 30% at wall 4, rising to a cap of 80%', () => {
    expect(shiftWallChanceFor(3)).toBe(0);
    expect(shiftWallChanceFor(4)).toBeCloseTo(0.3);
    expect(shiftWallChanceFor(20)).toBeGreaterThan(shiftWallChanceFor(19));
    expect(shiftWallChanceFor(100)).toBeCloseTo(SHIFT_WALL_CHANCE_MAX);
    for (let wall = 2; wall < 100; wall++) expect(shiftWallChanceFor(wall)).toBeGreaterThanOrEqual(shiftWallChanceFor(wall - 1));
  });
});

describe('planWall', () => {
  it('caps Shift Wall rounds at MAX_LETTERS_SHIFT_WALL letters', () => {
    const plans = Array.from({ length: 200 }, (_, i) => planWall(20, seeded(i + 1)));
    expect(plans.some((p) => p.shiftWall)).toBe(true);
    expect(plans.some((p) => !p.shiftWall)).toBe(true);
    for (const plan of plans) expect(plan.letters).toBe(plan.shiftWall ? MAX_LETTERS_SHIFT_WALL : 5);
  });

  it('never makes a Shift Wall before wall 4', () => {
    for (let wall = 1; wall <= 3; wall++) expect(planWall(wall, seeded(wall)).shiftWall).toBe(false);
  });

  it('always makes wall 4, the first that can shift, a Shift Wall, and only that one', () => {
    expect(FIRST_SHIFT_WALL).toBe(4);
    for (let i = 1; i <= 50; i++) expect(planWall(4, seeded(i)).shiftWall).toBe(true);
    expect(planWall(5, () => 0.99).shiftWall).toBe(false);
  });

  it('gives Shift Wall rounds a stretch range for the trimmed letter count', () => {
    for (const tier of DIFFICULTY_TIERS.filter((t) => t.letters > MAX_LETTERS_SHIFT_WALL)) {
      expect(tier.shiftWallStretch).toBeDefined();
      // Fewer letters score lower, so the range sits below the tier's own.
      expect(tier.shiftWallStretch![0]).toBeLessThan(tier.stretch[0]);
      expect(tier.shiftWallStretch![1]).toBeLessThan(tier.stretch[1]);
      const plan = planWall(tier.fromWall, seeded(1), true);
      expect(plan.stretch).toEqual(tier.shiftWallStretch);
      expect(planWall(tier.fromWall, () => 0.99).stretch).toEqual(tier.stretch);
    }
  });

  it('makes any wall a Shift Wall when forced (the dev ?shiftwall option), with the letter cap', () => {
    for (const wall of [1, 5, 12, 20]) {
      const plan = planWall(wall, seeded(wall), true);
      expect(plan.shiftWall).toBe(true);
      expect(plan.letters).toBeLessThanOrEqual(MAX_LETTERS_SHIFT_WALL);
    }
  });

  it("picks the Shift letter count inside the tier's range", () => {
    for (let i = 1; i <= 200; i++) {
      const plan = planWall(16, seeded(i));
      expect(plan.shiftLetters).toBeGreaterThanOrEqual(1);
      expect(plan.shiftLetters).toBeLessThanOrEqual(2);
    }
  });
});
