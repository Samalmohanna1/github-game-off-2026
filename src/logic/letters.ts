const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

// Indices for `upper` uppercase letters among `count`, never two adjacent
// (PLAN.md §4: back-to-back Shift presses can trigger Windows Sticky Keys).
// Choosing from count - upper + 1 slots and spreading them out keeps a gap.
export function uppercasePositions(count: number, upper: number, random: () => number = Math.random): number[] {
  const slots = count - upper + 1;
  if (upper < 0 || upper > slots) {
    throw new Error(`Can't fit ${upper} non-adjacent uppercase letters in ${count}`);
  }
  const pool = Array.from({ length: slots }, (_, i) => i);
  const picked: number[] = [];
  for (let i = 0; i < upper; i++) picked.push(...pool.splice(Math.floor(random() * pool.length), 1));
  return picked.sort((a, b) => a - b).map((slot, i) => slot + i);
}

// Stand-in until M5's stretch-scored generator: distinct random letters.
export function randomLetters(count: number, upper: number, random: () => number = Math.random): string[] {
  const pool = [...ALPHABET];
  const letters: string[] = [];
  for (let i = 0; i < count; i++) letters.push(...pool.splice(Math.floor(random() * pool.length), 1));
  for (const i of uppercasePositions(count, upper, random)) letters[i] = letters[i]!.toUpperCase();
  return letters;
}
