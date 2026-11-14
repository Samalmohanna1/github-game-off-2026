import { describe, expect, it } from 'vitest';
import { spanAt } from '@/logic/convex';

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
