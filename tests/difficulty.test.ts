import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_TIERS,
  MAX_LETTERS,
  MAX_LETTERS_SHIFT_WALL,
  MIN_WALL_TIME,
  SHIFT_WALL_CHANCE_MAX,
  WALL_TIME_DECAY,
} from '@/config';
import { planWall, shiftWallChanceFor, tierFor, wallTimeFor } from '@/logic/difficulty';
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
      [4, 4, [0, 0]],
      [7, 4, [1, 1]],
      [10, 5, [1, 2]],
      [13, 5, [1, 2]],
    ]);
  });

  it('never gives a later tier a longer wall time', () => {
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => {
      expect(tier.wallTime).toBeLessThanOrEqual(DIFFICULTY_TIERS[i]!.wallTime);
    });
  });

  it('only lets letters sit next to each other on walls 1-3', () => {
    expect(DIFFICULTY_TIERS.map((t) => t.allowAdjacent)).toEqual([true, false, false, false, false]);
  });

  it('keeps one finger per letter until wall 13', () => {
    expect(DIFFICULTY_TIERS.map((t) => t.allowSameFinger)).toEqual([false, false, false, false, true]);
  });

  it('never asks for more than MAX_LETTERS', () => {
    for (const tier of DIFFICULTY_TIERS) expect(tier.letters).toBeLessThanOrEqual(MAX_LETTERS);
  });

  it('gets harder: stretch ranges rise tier by tier', () => {
    DIFFICULTY_TIERS.slice(1).forEach((tier, i) => {
      expect(tier.stretch[0]).toBeGreaterThan(DIFFICULTY_TIERS[i]!.stretch[0]);
      expect(tier.stretch[1]).toBeGreaterThan(DIFFICULTY_TIERS[i]!.stretch[1]);
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
    expect([1, 3, 4, 6, 7, 9, 10, 12, 13, 99].map((w) => tierFor(w).name)).toEqual([
      'Easy',
      'Easy',
      'Medium',
      'Medium',
      'Medium-high',
      'Medium-high',
      'Hard',
      'Hard',
      'Hard+',
      'Hard+',
    ]);
  });
});

describe('wallTimeFor', () => {
  it('uses each tier time up to wall 12', () => {
    for (const tier of DIFFICULTY_TIERS.slice(0, -1)) {
      expect(wallTimeFor(tier.fromWall)).toBe(tier.wallTime);
      expect(wallTimeFor(tier.fromWall + 2)).toBe(tier.wallTime);
    }
  });

  it('drops by WALL_TIME_DECAY per wall from wall 13', () => {
    const hardPlus = DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1]!;
    expect(wallTimeFor(13)).toBeCloseTo(hardPlus.wallTime * (1 - WALL_TIME_DECAY));
    expect(wallTimeFor(14)).toBeCloseTo(wallTimeFor(13) * (1 - WALL_TIME_DECAY));
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
  it('is 0 before wall 13, 50% at wall 13, rising to a cap of 80%', () => {
    expect(shiftWallChanceFor(12)).toBe(0);
    expect(shiftWallChanceFor(13)).toBeCloseTo(0.5);
    expect(shiftWallChanceFor(14)).toBeGreaterThan(shiftWallChanceFor(13));
    expect(shiftWallChanceFor(100)).toBeCloseTo(SHIFT_WALL_CHANCE_MAX);
  });
});

describe('planWall', () => {
  it('caps Shift Wall rounds at MAX_LETTERS_SHIFT_WALL letters', () => {
    const plans = Array.from({ length: 200 }, (_, i) => planWall(20, seeded(i + 1)));
    expect(plans.some((p) => p.shiftWall)).toBe(true);
    expect(plans.some((p) => !p.shiftWall)).toBe(true);
    for (const plan of plans) expect(plan.letters).toBe(plan.shiftWall ? MAX_LETTERS_SHIFT_WALL : 5);
  });

  it("never makes a Shift Wall before wall 13", () => {
    for (let wall = 1; wall <= 12; wall++) expect(planWall(wall, seeded(wall)).shiftWall).toBe(false);
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
      const plan = planWall(11, seeded(i));
      expect(plan.shiftLetters).toBeGreaterThanOrEqual(1);
      expect(plan.shiftLetters).toBeLessThanOrEqual(2);
    }
  });
});
