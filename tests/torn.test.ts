import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/logic/random';
import { tornLine, tornOutline, tornRect } from '@/logic/torn';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

// Distance from p to the infinite line through a and b.
function offLine(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / length;
}

describe('tornLine', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 200, y: 0 };

  it('starts exactly at a, leaves b out, and steps about `step` apart', () => {
    const points = tornLine(a, b, 20, 4, seededRandom(1));
    expect(points[0]).toEqual(a);
    expect(points).toHaveLength(10);
    points.forEach((p, i) => expect(p.x).toBeCloseTo(i * 20));
  });

  it('never strays more than `jag` from the straight cut', () => {
    for (const seed of SEEDS) {
      for (const p of tornLine(a, b, 15, 5, seededRandom(seed))) expect(Math.abs(p.y)).toBeLessThanOrEqual(5);
    }
  });

  it('is a straight line with no jag', () => {
    for (const p of tornLine(a, b, 15, 0, seededRandom(3))) expect(p.y).toBeCloseTo(0);
  });
});

describe('tornOutline and tornRect', () => {
  it('keeps every corner in place and every point near its side', () => {
    const corners = [
      { x: 0, y: 0 },
      { x: 300, y: 40 },
      { x: 260, y: 200 },
    ];
    for (const seed of SEEDS) {
      const points = tornOutline(corners, 18, 6, seededRandom(seed));
      for (const corner of corners) expect(points).toContainEqual(corner);
      for (const p of points) {
        const nearest = Math.min(...corners.map((c, i) => offLine(p, c, corners[(i + 1) % corners.length]!)));
        expect(nearest).toBeLessThanOrEqual(6 + 1e-9);
      }
    }
  });

  it('centers a torn rectangle on the origin, within its jag', () => {
    for (const seed of SEEDS) {
      for (const p of tornRect(200, 100, 16, 4, seededRandom(seed))) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(104);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(54);
      }
    }
  });

  it('tears the same way for the same seed', () => {
    expect(tornRect(200, 100, 16, 4, seededRandom(9))).toEqual(tornRect(200, 100, 16, 4, seededRandom(9)));
  });
});
