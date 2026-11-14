import {
  DIFFICULTY_TIERS,
  MAX_LETTERS,
  MAX_LETTERS_SHIFT_WALL,
  MIN_WALL_TIME,
  SHIFT_WALL_CHANCE_MAX,
  SHIFT_WALL_CHANCE_STEP,
  WALL_TIME_DECAY,
  type DifficultyTier,
} from '@/config';
import type { LetterRules } from '@/logic/letters';
import { randomInt, type Random } from '@/logic/random';

// Everything one wall needs from the difficulty curve (PLAN.md §5).
export interface WallPlan extends LetterRules {
  readonly wall: number;
  readonly tier: string;
  readonly wallTime: number; // s
  readonly holeDistance: readonly [number, number];
  readonly shiftWall: boolean;
}

const LAST_TIER = DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1]!;

// The first wall that can be a Shift Wall always is one, so every run meets the
// mechanic on easy letters before it turns up at random.
export const FIRST_SHIFT_WALL = DIFFICULTY_TIERS.find((tier) => tier.shiftWallChance > 0)?.fromWall ?? null;

export function tierFor(wall: number): DifficultyTier {
  return [...DIFFICULTY_TIERS].reverse().find((tier) => wall >= tier.fromWall) ?? DIFFICULTY_TIERS[0]!;
}

// Walls into the open-ended last tier: 1 on its first wall, 0 before it.
function wallsIntoLastTier(wall: number): number {
  return Math.max(0, wall - LAST_TIER.fromWall + 1);
}

// The last tier shortens every wall by WALL_TIME_DECAY from the one before,
// starting from the previous tier's time and never below MIN_WALL_TIME.
export function wallTimeFor(wall: number): number {
  const tier = tierFor(wall);
  if (tier !== LAST_TIER) return tier.wallTime;
  return Math.max(MIN_WALL_TIME, tier.wallTime * (1 - WALL_TIME_DECAY) ** wallsIntoLastTier(wall));
}

export function shiftWallChanceFor(wall: number): number {
  const tier = tierFor(wall);
  if (tier !== LAST_TIER) return tier.shiftWallChance;
  return Math.min(SHIFT_WALL_CHANCE_MAX, tier.shiftWallChance + SHIFT_WALL_CHANCE_STEP * (wallsIntoLastTier(wall) - 1));
}

// forceShiftWall is the dev server's ?shiftwall option.
export function planWall(wall: number, random: Random = Math.random, forceShiftWall = false): WallPlan {
  const tier = tierFor(wall);
  const shiftWall = random() < shiftWallChanceFor(wall) || wall === FIRST_SHIFT_WALL || forceShiftWall;
  // PLAN.md §4: at most 5 letters, and 4 on Shift Wall rounds, since Space
  // and Shift go on top and many keyboards ghost past 7 keys.
  const letters = Math.min(tier.letters, shiftWall ? MAX_LETTERS_SHIFT_WALL : MAX_LETTERS);
  return {
    wall,
    tier: tier.name,
    letters,
    // A range scored over 5 letters would only take the most cramped 4.
    stretch: letters < tier.letters ? (tier.shiftWallStretch ?? tier.stretch) : tier.stretch,
    allowAdjacent: tier.allowAdjacent,
    allowSameFinger: tier.allowSameFinger,
    shiftLetters: randomInt(tier.shiftLetters[0], tier.shiftLetters[1], random),
    wallTime: wallTimeFor(wall),
    holeDistance: tier.holeDistance,
    shiftWall,
  };
}
