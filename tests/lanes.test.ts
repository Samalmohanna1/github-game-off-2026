import { describe, expect, it } from 'vitest';
import { FIGURE_WIDTH, HOLE_DISTANCE, LANE_COUNT, LANE_MARKER_GAP } from '@/config';
import {
  CENTER_LANE,
  LANE_WIDTH,
  holeLaneCandidates,
  isAligned,
  laneCenterX,
  laneLeftX,
  moveLane,
  pickHoleLane,
} from '@/logic/lanes';
import { VANISHING_POINT, floorEdge } from '@/logic/perspective';

const LAST_LANE = LANE_COUNT - 1;
const ALL_LANES = Array.from({ length: LANE_COUNT }, (_, i) => i);

describe('moveLane', () => {
  it('moves one lane per tap', () => {
    expect(moveLane(CENTER_LANE, -1)).toBe(CENTER_LANE - 1);
    expect(moveLane(CENTER_LANE, 1)).toBe(CENTER_LANE + 1);
  });

  it('never leaves the stage', () => {
    expect(moveLane(0, -1)).toBe(0);
    expect(moveLane(LAST_LANE, 1)).toBe(LAST_LANE);
  });
});

describe('isAligned', () => {
  it('is true only when the figure is in the hole lane', () => {
    expect(isAligned(2, 2)).toBe(true);
    expect(isAligned(2, 3)).toBe(false);
  });
});

describe('lane geometry', () => {
  it('splits the floor exactly into LANE_COUNT lanes', () => {
    expect(laneLeftX(0)).toBeCloseTo(floorEdge(-1).x);
    expect(laneLeftX(LANE_COUNT)).toBeCloseTo(floorEdge(1).x);
  });

  it('puts the center lane under the vanishing point', () => {
    expect(laneCenterX(CENTER_LANE)).toBeCloseTo(VANISHING_POINT.x);
  });

  it('spaces lane centers evenly', () => {
    for (const lane of ALL_LANES.slice(1)) {
      expect(laneCenterX(lane) - laneCenterX(lane - 1)).toBeCloseTo(LANE_WIDTH);
    }
  });

  it('fits the figure inside one lane marker', () => {
    expect(FIGURE_WIDTH).toBeLessThanOrEqual(LANE_WIDTH - LANE_MARKER_GAP);
  });
});

describe('hole lane', () => {
  it('lists lanes within the distance range on both sides', () => {
    expect(holeLaneCandidates(CENTER_LANE, [1, 2])).toEqual([1, 2, 4, 5]);
    expect(holeLaneCandidates(0, [1, 2])).toEqual([1, 2]);
    expect(holeLaneCandidates(LAST_LANE, [1, 2])).toEqual([LAST_LANE - 2, LAST_LANE - 1]);
  });

  it('picks with the given random source', () => {
    expect(pickHoleLane(CENTER_LANE, [1, 2], () => 0)).toBe(1);
    expect(pickHoleLane(CENTER_LANE, [1, 2], () => 0.999)).toBe(5);
  });

  it('always lands in range and on the stage, from every lane', () => {
    for (const figureLane of ALL_LANES) {
      for (let i = 0; i < 20; i++) {
        const hole = pickHoleLane(figureLane, HOLE_DISTANCE, () => i / 20);
        const dist = Math.abs(hole - figureLane);
        expect(hole).toBeGreaterThanOrEqual(0);
        expect(hole).toBeLessThanOrEqual(LAST_LANE);
        expect(dist).toBeGreaterThanOrEqual(HOLE_DISTANCE[0]);
        expect(dist).toBeLessThanOrEqual(HOLE_DISTANCE[1]);
      }
    }
  });

  it('never spawns the hole in the figure lane while the minimum distance is above 0', () => {
    expect(HOLE_DISTANCE[0]).toBeGreaterThan(0);
  });

  it('throws when no lane is far enough away', () => {
    expect(() => pickHoleLane(CENTER_LANE, [LANE_COUNT, LANE_COUNT + 1])).toThrow();
  });
});
