import { describe, expect, it } from 'vitest';
import { chamferedRect, keyCapRect } from '@/logic/convex';

describe('chamferedRect', () => {
  it('is a plain rectangle with no cuts', () => {
    expect(chamferedRect(10, 20, 30, 40)).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ]);
  });

  it('cuts only the corners asked for, at 45 degrees', () => {
    const shape = chamferedRect(0, 0, 100, 50, { topLeft: 10, bottomRight: 20 });
    expect(shape).toHaveLength(6);
    expect(shape).toContainEqual({ x: 10, y: 0 });
    expect(shape).toContainEqual({ x: 0, y: 10 });
    expect(shape).toContainEqual({ x: 100, y: 30 });
    expect(shape).toContainEqual({ x: 80, y: 50 });
  });
});

describe('keyCapRect', () => {
  it('cuts the top-left and bottom-right corners only', () => {
    expect(keyCapRect(0, 0, 100, 50, 10)).toEqual(chamferedRect(0, 0, 100, 50, { topLeft: 10, bottomRight: 10 }));
  });

  // A 45-degree cut through (a, b) lies on x + y = a + b; two parallel cuts
  // stand |k1 - k2| / sqrt 2 apart.
  it('grows every edge, the cuts included, by the same distance', () => {
    const [cut, grow] = [16, 5];
    const shape = keyCapRect(0, 0, 100, 50, cut);
    const grown = keyCapRect(0, 0, 100, 50, cut, grow);
    expect(Math.min(...grown.map((p) => p.x))).toBe(-grow);
    expect(Math.max(...grown.map((p) => p.y))).toBe(50 + grow);
    const cutLine = (points: readonly { x: number; y: number }[]) => points[0]!.x + points[0]!.y;
    expect((cutLine(shape) - cutLine(grown)) / Math.SQRT2).toBeCloseTo(grow);
  });
});
