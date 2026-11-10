import { describe, expect, it } from 'vitest';
import { FIGURE_FLOOR_Y, FLOOR, GAME_WIDTH, LANE_TARGET, STAGE_BOTTOM_Y, WALL_START_SCALE } from '@/config';
import {
  FIGURE_TILE,
  STAGE_FRONT_SCALE,
  VANISHING_POINT,
  crossSeamScales,
  floorEdge,
  project,
} from '@/logic/perspective';

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

describe('floor tiles', () => {
  const floorY = (scale: number) => project(floorEdge(1), scale).y;

  it("centers the figure's tile on the figure's plane, in depth", () => {
    expect(1 / FIGURE_TILE.back - 1).toBeCloseTo(1 - 1 / FIGURE_TILE.front);
    expect(1 / FIGURE_TILE.back - 1 / FIGURE_TILE.front).toBeCloseTo(FLOOR.tileDepth);
  });

  it("keeps the figure's whole tile on the stage, above the tray", () => {
    expect(floorY(FIGURE_TILE.front)).toBeLessThanOrEqual(STAGE_BOTTOM_Y);
    expect(FIGURE_TILE.back).toBeGreaterThan(WALL_START_SCALE);
  });

  it("puts a seam on both edges of the figure's tile", () => {
    const seams = crossSeamScales();
    for (const edge of [FIGURE_TILE.back, FIGURE_TILE.front]) {
      expect(seams.some((s) => Math.abs(s - edge) < 1e-9)).toBe(true);
    }
  });

  it('spaces the seams evenly in depth, far to near, between the far end and the stage front', () => {
    const seams = crossSeamScales();
    expect(seams.length).toBeGreaterThan(2);
    for (const s of seams) {
      expect(s).toBeGreaterThan(WALL_START_SCALE);
      expect(s).toBeLessThan(STAGE_FRONT_SCALE);
    }
    for (let i = 1; i < seams.length; i++) {
      expect(1 / seams[i - 1]! - 1 / seams[i]!).toBeCloseTo(FLOOR.tileDepth);
    }
    expect(1 / WALL_START_SCALE - 1 / seams[0]!).toBeLessThanOrEqual(FLOOR.tileDepth);
  });

  it("fits the Shift Wall target's chevrons inside the figure's tile", () => {
    expect(LANE_TARGET.chevronHeight).toBeLessThan(floorY(FIGURE_TILE.front) - floorY(FIGURE_TILE.back));
  });
});
