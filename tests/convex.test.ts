import { describe, expect, it } from 'vitest';
import { chamferedRect } from '@/logic/convex';

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
