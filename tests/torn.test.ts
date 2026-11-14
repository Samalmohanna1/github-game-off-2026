import { describe, expect, it } from 'vitest';
import { tornLine, tornPiece } from '@/logic/torn';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

// Signed distance from p to the line through a and b: positive on the left of
// a -> b as drawn on screen (y down).
function side(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  return ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / length;
}

describe('tornLine', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 200, y: 0 };

  it('starts exactly at a, leaves b out, and steps about `step` apart', () => {
    const points = tornLine(a, b, 20, 4, seeded(1));
    expect(points[0]).toEqual(a);
    expect(points).toHaveLength(10);
    points.forEach((p, i) => expect(p.x).toBeCloseTo(i * 20));
  });

  it('never strays more than `jag` from the straight cut', () => {
    for (const seed of SEEDS) {
      for (const p of tornLine(a, b, 15, 5, seeded(seed))) expect(Math.abs(p.y)).toBeLessThanOrEqual(5);
    }
  });

  it('is a straight line with no jag', () => {
    for (const p of tornLine(a, b, 15, 0, seeded(3))) expect(p.y).toBeCloseTo(0);
  });
});

describe('tornPiece', () => {
  // Clockwise on screen: the inside is below the top edge.
  const square = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ];
  const tear = { step: 12, jag: 3, rim: 5 };

  it('keeps clean cuts to their corners, inside and out', () => {
    const { outer, inner } = tornPiece(square, [], tear, seeded(1));
    expect(outer).toEqual(square);
    expect(inner).toEqual(square);
  });

  it("tears a torn edge within its jag, and moves the inner tear one rim's width inside", () => {
    for (const seed of SEEDS) {
      const { outer, inner } = tornPiece(square, [0], tear, seeded(seed));
      // Along the top edge, between its corners; the next edge's corner stays put.
      const top = (points: { x: number; y: number }[]) => points.filter((p) => p.y < 50 && p.x > 0 && p.x < 200);
      for (const p of top(outer)) expect(Math.abs(p.y)).toBeLessThanOrEqual(tear.jag);
      for (const p of top(inner)) {
        expect(p.y).toBeGreaterThanOrEqual(tear.rim - tear.jag);
        expect(p.y).toBeLessThanOrEqual(tear.rim + tear.jag);
      }
    }
  });

  it('moves the inner tear inside whichever way the corners run', () => {
    const counterClockwise = [...square].reverse();
    const { inner } = tornPiece(counterClockwise, [1], tear, seeded(2));
    // Edge 1 now runs along the right side, from (200, 200) up to (200, 0).
    const right = inner.filter((p) => p.x > 150 && p.y > 20 && p.y < 180);
    expect(right.length).toBeGreaterThan(0);
    for (const p of right) expect(side(p, { x: 200, y: 200 }, { x: 200, y: 0 })).toBeLessThan(0);
  });

  it('tears the same way for the same seed', () => {
    expect(tornPiece(square, [0, 2], tear, seeded(9))).toEqual(tornPiece(square, [0, 2], tear, seeded(9)));
  });
});
