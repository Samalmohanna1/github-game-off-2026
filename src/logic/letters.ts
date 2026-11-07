import { ADJACENT_KEY_DISTANCE, HAND_CAPACITY, MAX_LETTERS, STRETCH_TRIES, STRETCH_WEIGHTS } from '@/config';
import { KEYBOARD, type KeyPosition } from '@/data/keyboard';
import { pick, shuffled, type Random } from '@/logic/random';

const ALPHABET = [...'abcdefghijklmnopqrstuvwxyz'];

// What a wall asks of the letter generator (one row of PLAN.md §5).
export interface LetterRules {
  readonly letters: number;
  readonly stretch: readonly [number, number];
  readonly allowAdjacent: boolean;
  readonly shiftLetters: number;
}

export interface LetterCombo {
  // In prompt order, with the Shift letters uppercased.
  readonly letters: readonly string[];
  readonly stretch: number;
}

function keyOf(letter: string): KeyPosition {
  const key = KEYBOARD[letter.toLowerCase()];
  if (key === undefined) throw new Error(`Not a letter: ${letter}`);
  return key;
}

export function keyDistance(a: string, b: string): number {
  const ka = keyOf(a);
  const kb = keyOf(b);
  return Math.hypot(ka.x - kb.x, ka.row - kb.row);
}

export function isAdjacent(a: string, b: string): boolean {
  return keyDistance(a, b) <= ADJACENT_KEY_DISTANCE;
}

// PLAN.md §4; the weights are in STRETCH_WEIGHTS. Case is ignored: Shift's
// difficulty comes from the tier's Shift letter count, not from here.
export function stretchScore(letters: readonly string[]): number {
  const keys = letters.map(keyOf);
  let spread = 0;
  let sameFinger = 0;
  keys.forEach((a, i) =>
    keys.slice(i + 1).forEach((b) => {
      spread = Math.max(spread, Math.hypot(a.x - b.x, a.row - b.row));
      if (a.finger === b.finger) sameFinger += 1;
    }),
  );
  const extraRows = new Set(keys.map((k) => k.row)).size - 1;
  const left = keys.filter((k) => k.hand === 'left').length;
  const right = keys.length - left;
  const reachAcross = Math.max(0, left - HAND_CAPACITY) + Math.max(0, right - HAND_CAPACITY);
  return (
    spread +
    STRETCH_WEIGHTS.rowSpread * extraRows +
    STRETCH_WEIGHTS.crossReach * reachAcross +
    STRETCH_WEIGHTS.sameFinger * sameFinger
  );
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((p) => [item, ...p]));
}

function adjacentSteps(order: readonly string[]): number {
  return order.slice(1).filter((letter, i) => isAdjacent(order[i]!, letter)).length;
}

function leastAdjacentOrder(combo: readonly string[]): string[] {
  return permutations(combo).sort((a, b) => adjacentSteps(a) - adjacentSteps(b))[0] ?? [...combo];
}

// PLAN.md §4: each new prompt isn't right next to the last one, unless the
// tier allows it. Null when no order manages that.
export function orderLetters(combo: readonly string[], allowAdjacent: boolean, random: Random): string[] | null {
  if (allowAdjacent) return [...combo];
  return pick(permutations(combo).filter((order) => adjacentSteps(order) === 0), random) ?? null;
}

// Indices for `upper` uppercase letters among `count`, never two adjacent
// (PLAN.md §4: back-to-back Shift presses can trigger Windows Sticky Keys).
// Choosing from count - upper + 1 slots and spreading them out keeps a gap.
export function uppercasePositions(count: number, upper: number, random: Random): number[] {
  const slots = count - upper + 1;
  if (upper < 0 || upper > slots) {
    throw new Error(`Can't fit ${upper} non-adjacent uppercase letters in ${count}`);
  }
  const pool = Array.from({ length: slots }, (_, i) => i);
  const picked: number[] = [];
  for (let i = 0; i < upper; i++) picked.push(...pool.splice(Math.floor(random() * pool.length), 1));
  return picked.sort((a, b) => a - b).map((slot, i) => slot + i);
}

function gapToRange(score: number, [lo, hi]: readonly [number, number]): number {
  return score < lo ? lo - score : score > hi ? score - hi : 0;
}

// PLAN.md §4: random combos of distinct letters, rejected until one scores in
// the tier's range and can be ordered; after STRETCH_TRIES, the closest wins.
export function generateLetters(rules: LetterRules, random: Random = Math.random): LetterCombo {
  if (rules.letters > MAX_LETTERS) throw new Error(`${rules.letters} letters is over the ${MAX_LETTERS} cap`);

  let closest: { combo: string[]; stretch: number; gap: number } | null = null;
  let chosen: string[] | null = null;
  for (let i = 0; i < STRETCH_TRIES && chosen === null; i++) {
    const combo = shuffled(ALPHABET, random).slice(0, rules.letters);
    const stretch = stretchScore(combo);
    const gap = gapToRange(stretch, rules.stretch);
    if (closest === null || gap < closest.gap) closest = { combo, stretch, gap };
    if (gap === 0) chosen = orderLetters(combo, rules.allowAdjacent, random);
  }

  // STRETCH_TRIES is at least 1, so there is always a closest combo.
  const best = closest!;
  const letters = chosen ?? orderLetters(best.combo, rules.allowAdjacent, random) ?? leastAdjacentOrder(best.combo);
  for (const i of uppercasePositions(letters.length, rules.shiftLetters, random)) letters[i] = letters[i]!.toUpperCase();
  return { letters, stretch: stretchScore(letters) };
}
