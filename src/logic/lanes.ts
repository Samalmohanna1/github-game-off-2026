import { LANE_COUNT } from '@/config';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';
import { pick, type Random } from '@/logic/random';

export const CENTER_LANE = Math.floor(LANE_COUNT / 2);
export const LANE_WIDTH = (2 * FLOOR_HALF_WIDTH) / LANE_COUNT; // px at the figure's plane

export function moveLane(lane: number, dir: -1 | 1): number {
  return Math.min(LANE_COUNT - 1, Math.max(0, lane + dir));
}

// Space: one lane right, wrapping from the last lane back to the first, so a
// thumb can reach any lane without the hands leaving the letters.
export function cycleLane(lane: number): number {
  return (lane + 1) % LANE_COUNT;
}

export function isAligned(figureLane: number, holeLane: number): boolean {
  return figureLane === holeLane;
}

// Left edge of a lane at the figure's plane; laneLeftX(LANE_COUNT) is the right
// edge of the last lane.
export function laneLeftX(lane: number): number {
  return VANISHING_POINT.x - FLOOR_HALF_WIDTH + lane * LANE_WIDTH;
}

export function laneCenterX(lane: number): number {
  return laneLeftX(lane) + LANE_WIDTH / 2;
}

export function holeLaneCandidates(figureLane: number, [minDist, maxDist]: readonly [number, number]): number[] {
  const lanes: number[] = [];
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const dist = Math.abs(lane - figureLane);
    if (dist >= minDist && dist <= maxDist) lanes.push(lane);
  }
  return lanes;
}

export function pickHoleLane(
  figureLane: number,
  distance: readonly [number, number],
  random: Random = Math.random,
): number {
  const lane = pick(holeLaneCandidates(figureLane, distance), random);
  if (lane === undefined) {
    throw new Error(`No lane is ${distance[0]}-${distance[1]} lanes from lane ${figureLane}`);
  }
  return lane;
}
