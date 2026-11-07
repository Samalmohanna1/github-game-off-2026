import { describe, expect, it } from 'vitest';
import { FIGURE_FLOOR_Y, GAME_WIDTH, STAGE_BOTTOM_Y, WALL_START_SCALE } from '@/config';
import { STAGE_FRONT_SCALE, VANISHING_POINT, floorEdge, project } from '@/logic/perspective';

describe('project', () => {
  const p = { x: 300, y: 500 };

  it('leaves the figure plane (scale 1) unchanged', () => {
    expect(project(p, 1)).toEqual(p);
  });

  it('keeps the vanishing point fixed at every depth', () => {
    for (const s of [0, WALL_START_SCALE, 1, STAGE_FRONT_SCALE]) {
      expect(project(VANISHING_POINT, s)).toEqual(VANISHING_POINT);
    }
  });

  it('pulls points toward the vanishing point as they get farther away', () => {
    const near = project(p, 1);
    const far = project(p, WALL_START_SCALE);
    const dist = (q: { x: number; y: number }) => Math.hypot(q.x - VANISHING_POINT.x, q.y - VANISHING_POINT.y);
    expect(dist(far)).toBeCloseTo(dist(near) * WALL_START_SCALE);
  });
});

describe('floor', () => {
  it('stands the figure on the floor line at scale 1', () => {
    expect(floorEdge(-1).y).toBe(FIGURE_FLOOR_Y);
    expect(floorEdge(1).y).toBe(FIGURE_FLOOR_Y);
  });

  it('runs its edges out to the bottom corners of the stage', () => {
    const left = project(floorEdge(-1), STAGE_FRONT_SCALE);
    const right = project(floorEdge(1), STAGE_FRONT_SCALE);
    expect(left.x).toBeCloseTo(0);
    expect(left.y).toBeCloseTo(STAGE_BOTTOM_Y);
    expect(right.x).toBeCloseTo(GAME_WIDTH);
    expect(right.y).toBeCloseTo(STAGE_BOTTOM_Y);
  });

  it('places the stage front nearer the camera than the figure', () => {
    expect(STAGE_FRONT_SCALE).toBeGreaterThan(1);
  });
});
