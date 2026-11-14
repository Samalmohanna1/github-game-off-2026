import { describe, expect, it } from 'vitest';
import { chamferedRect, spanAt } from '@/logic/convex';

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

  it('stays convex, so its inner grid clips cleanly', () => {
    const shape = chamferedRect(0, 0, 100, 50, { bottomRight: 20 });
    expect(spanAt(shape, 'y', 40)).toEqual([0, 90]);
    expect(spanAt(shape, 'x', 95)).toEqual([0, 35]);
  });
});

describe('spanAt', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 100 },
  ];

  it('spans the polygon across a vertical line', () => {
    expect(spanAt(triangle, 'x', 0)).toEqual([0, 100]);
    expect(spanAt(triangle, 'x', 50)).toEqual([25, 75]);
  });

  it('spans the polygon across a horizontal line', () => {
    expect(spanAt(triangle, 'y', 50)).toEqual([0, 100]);
    expect(spanAt(triangle, 'y', 25)).toEqual([0, 50]);
  });

  it('misses lines outside the polygon', () => {
    expect(spanAt(triangle, 'x', 120)).toBeNull();
    expect(spanAt(triangle, 'y', -5)).toBeNull();
  });

  it('works whichever way the corners run', () => {
    expect(spanAt([...triangle].reverse(), 'x', 50)).toEqual([25, 75]);
  });
});
