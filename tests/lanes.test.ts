import { describe, expect, it } from 'vitest';
import { DIFFICULTY_TIERS, FIGURE_WIDTH, LANE_COUNT } from '@/config';
import {
  CENTER_LANE,
  LANE_WIDTH,
  fallDirection,
  holeLaneCandidates,
  isAligned,
  laneCenterX,
  laneLeftX,
  pickHoleLane,
  stepToward,
} from '@/logic/lanes';
import { VANISHING_POINT, floorEdge } from '@/logic/perspective';

const LAST_LANE = LANE_COUNT - 1;
const ALL_LANES = Array.from({ length: LANE_COUNT }, (_, i) => i);

describe('fallDirection', () => {
  it('topples the figure toward the middle of the stage', () => {
    expect(fallDirection(0)).toBe(1);
    expect(fallDirection(CENTER_LANE - 1)).toBe(1);
    expect(fallDirection(CENTER_LANE + 1)).toBe(-1);
    expect(fallDirection(LAST_LANE)).toBe(-1);
  });

  it('topples either way from the center lane', () => {
    expect(fallDirection(CENTER_LANE, () => 0.2)).toBe(-1);
    expect(fallDirection(CENTER_LANE, () => 0.8)).toBe(1);
  });
});

describe('stepToward (Space)', () => {
  it('moves one lane toward the hole, on either side', () => {
    expect(stepToward(CENTER_LANE, LAST_LANE)).toBe(CENTER_LANE + 1);
    expect(stepToward(CENTER_LANE, 0)).toBe(CENTER_LANE - 1);
  });

  it('stays put once lined up', () => {
    expect(stepToward(CENTER_LANE, CENTER_LANE)).toBe(CENTER_LANE);
  });

  it('lines up from every lane in exactly as many presses as lanes apart', () => {
    for (const from of ALL_LANES) {
      for (const hole of ALL_LANES) {
        let lane = from;
        let presses = 0;
        while (!isAligned(lane, hole)) {
          lane = stepToward(lane, hole);
          presses += 1;
          expect(lane).toBeGreaterThanOrEqual(0);
          expect(lane).toBeLessThanOrEqual(LAST_LANE);
        }
        expect(presses).toBe(Math.abs(hole - from));
      }
    }
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

  it('fits the figure inside one lane', () => {
    expect(FIGURE_WIDTH).toBeLessThan(LANE_WIDTH);
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

  it.each(DIFFICULTY_TIERS.map((tier) => [tier.name, tier.holeDistance] as const))(
    '%s: always lands in range and on the stage, from every lane',
    (_name, distance) => {
      for (const figureLane of ALL_LANES) {
        for (let i = 0; i < 20; i++) {
          const hole = pickHoleLane(figureLane, distance, () => i / 20);
          const dist = Math.abs(hole - figureLane);
          expect(hole).toBeGreaterThanOrEqual(0);
          expect(hole).toBeLessThanOrEqual(LAST_LANE);
          expect(dist).toBeGreaterThanOrEqual(distance[0]);
          expect(dist).toBeLessThanOrEqual(distance[1]);
        }
      }
    },
  );

  it('never spawns the hole in the figure lane, so every wall needs lining up', () => {
    for (const tier of DIFFICULTY_TIERS) expect(tier.holeDistance[0]).toBeGreaterThan(0);
  });

  it('throws when no lane is far enough away', () => {
    expect(() => pickHoleLane(CENTER_LANE, [LANE_COUNT, LANE_COUNT + 1])).toThrow();
  });
});
