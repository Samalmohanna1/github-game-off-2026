import { describe, expect, it } from 'vitest';
import { sketch } from '@/logic/sketch';

const LINE = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

describe('sketch (pencil lines)', () => {
  it('never moves a point more than the jitter, on either axis', () => {
    for (const seed of [0, 1, 2, 3]) {
      const points = sketch(LINE, false, 10, 1.5, seed);
      points.forEach((p, i) => {
        expect(Math.abs(p.x - i * 10)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(1.5);
      });
    }
  });

  it('includes both ends of an open line, and steps about `step` apart', () => {
    expect(sketch(LINE, false, 10, 0)).toHaveLength(11);
    expect(sketch(LINE, false, 10, 0).at(-1)).toEqual({ x: 100, y: 0 });
  });

  it('wobbles the same way every time it is drawn', () => {
    expect(sketch(LINE, false, 10, 2, 5)).toEqual(sketch(LINE, false, 10, 2, 5));
    expect(sketch(LINE, false, 10, 2, 5)).not.toEqual(sketch(LINE, false, 10, 2, 6));
  });

  it('meets at a shared end, so separate segments join up', () => {
    const a = sketch(
      [
        { x: 0, y: 0 },
        { x: 24, y: 0 },
      ],
      false,
      10,
      2,
    );
    const b = sketch(
      [
        { x: 24, y: 0 },
        { x: 24, y: 24 },
      ],
      false,
      10,
      2,
    );
    expect(a.at(-1)).toEqual(b[0]);
  });

  it('wobbles by position relative to its anchor, so a moving shape keeps its wobble', () => {
    const here = sketch(LINE, false, 10, 2, 0, { x: 0, y: 0 });
    const moved = sketch(
      LINE.map((p) => ({ x: p.x + 37, y: p.y })),
      false,
      10,
      2,
      0,
      { x: 37, y: 0 },
    );
    moved.forEach((p, i) => expect(p.x - 37).toBeCloseTo(here[i]!.x));
  });

  it('closes a shape without repeating its first point', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(sketch(square, true, 10, 0)).toEqual(square);
  });
});
