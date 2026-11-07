// Every random choice takes its source as a parameter, so tests can pass a
// seeded one and get repeatable walls.
export type Random = () => number;

export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pick<T>(items: readonly T[], random: Random): T | undefined {
  return items[Math.floor(random() * items.length)];
}

// Inclusive at both ends.
export function randomInt(min: number, max: number, random: Random): number {
  return min + Math.floor(random() * (max - min + 1));
}
