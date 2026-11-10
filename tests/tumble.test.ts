import { describe, expect, it } from 'vitest';
import { AUDIO, CELL_SIZE, FAIL_TO_GAME_OVER_MS, FAIL_TUMBLE, FIGURE_HEIGHT, FIGURE_WIDTH, STAGE_BOTTOM_Y } from '@/config';
import { ALT_POSES, BLOCK_IDS, NEUTRAL_POSE, type BlockId, type CellRect } from '@/data/poses';
import { project, floorEdge } from '@/logic/perspective';
import {
  Tumble,
  blockBox,
  nearestFlat,
  reachBelow,
  restingAngle,
  tumblePart,
  type TumblePart,
} from '@/logic/tumble';

const FRAME = 1 / 60; // s
const SIM_STEP = 1 / 240; // s, the sim's own fixed step
const QUARTER = Math.PI / 2;

function partsFor(pose: Readonly<Record<BlockId, CellRect>>): TumblePart[] {
  return BLOCK_IDS.map((id) => tumblePart(id, pose[id], { ...blockBox(pose[id]), angle: 0 }));
}

const STANDING = partsFor(NEUTRAL_POSE);

// Runs a fall frame by frame until every block is still, or `seconds` pass;
// returns when it settled, or -1.
function run(tumble: Tumble, seconds: number, onFrame: () => void = () => {}): number {
  for (let time = FRAME; time <= seconds + 1e-9; time += FRAME) {
    tumble.advance(FRAME);
    onFrame();
    if (tumble.settled) return time;
  }
  return -1;
}

// Every pose the figure can be in when the wall reaches it: each block in its
// neutral or any alt pose.
function everyPose(): Record<BlockId, CellRect>[] {
  const poses: Record<BlockId, CellRect>[] = [{ ...NEUTRAL_POSE }];
  for (const id of BLOCK_IDS) {
    const next: Record<BlockId, CellRect>[] = [];
    for (const pose of poses) for (const cell of ALT_POSES[id]) next.push({ ...pose, [id]: cell });
    poses.push(...next);
  }
  return poses;
}

describe('block geometry', () => {
  it('stands the figure on the floor, centered on its grid', () => {
    const legs = blockBox(NEUTRAL_POSE.legs);
    expect(legs.y + legs.halfH).toBeCloseTo(0);
    const head = blockBox(NEUTRAL_POSE.head);
    expect(head.y - head.halfH).toBeCloseTo(-FIGURE_HEIGHT);
    expect(head.x).toBeCloseTo(0);
    expect(blockBox({ col: 0, row: 0, cols: 1, rows: 1 }).x).toBeCloseTo(CELL_SIZE / 2 - FIGURE_WIDTH / 2);
  });

  it('reaches down by its half height upright, and its half width on its side', () => {
    const box = { halfW: 10, halfH: 30 };
    expect(reachBelow(box, 0)).toBeCloseTo(30);
    expect(reachBelow(box, QUARTER)).toBeCloseTo(10);
    expect(reachBelow(box, Math.PI / 4)).toBeCloseTo(40 * Math.SQRT1_2);
  });

  it('finds the nearest side to lie on', () => {
    expect(nearestFlat(0.3)).toBeCloseTo(0);
    expect(nearestFlat(1.2)).toBeCloseTo(QUARTER);
    expect(nearestFlat(-2)).toBeCloseTo(-QUARTER);
  });

  it('rocks a block back onto its side, but tips a long one over rather than stand it on its end', () => {
    const arm = { halfW: CELL_SIZE / 2, halfH: (3 * CELL_SIZE) / 2 };
    expect(restingAngle(arm, 0.05)).toBeCloseTo(0);
    expect(restingAngle(arm, 0.4)).toBeCloseTo(QUARTER);
    expect(restingAngle(arm, -0.4)).toBeCloseTo(-QUARTER);
    // Lying on its long side, it rocks back even from almost halfway over.
    expect(restingAngle(arm, QUARTER - 0.7)).toBeCloseTo(QUARTER);
    const head = { halfW: CELL_SIZE, halfH: CELL_SIZE };
    expect(restingAngle(head, 0.7)).toBeCloseTo(0);
  });

  it('flails the arms from the shoulders, and nothing else', () => {
    const parts = Object.fromEntries(BLOCK_IDS.map((id, i) => [id, STANDING[i]]));
    expect(parts.head?.flail).toBeNull();
    expect(parts.torso?.flail).toBeNull();
    expect(parts.legs?.flail).toBeNull();
    const torso = blockBox(NEUTRAL_POSE.torso);
    const armL = parts.armL;
    expect(armL?.flail?.pivot.y).toBeCloseTo(torso.y - torso.halfH);
    expect(armL?.flail?.pivot.x).toBeCloseTo(armL?.x ?? NaN);
    expect(parts.armR?.flail?.phase).not.toBe(armL?.flail?.phase);
  });
});

describe('the fail tumble (M10 review 5)', () => {
  it('starts with every block where it stood', () => {
    const tumble = new Tumble(STANDING, 1, FAIL_TUMBLE);
    tumble.poses().forEach((pose, i) => {
      expect(pose.x).toBeCloseTo(STANDING[i]?.x ?? NaN);
      expect(pose.y).toBeCloseTo(STANDING[i]?.y ?? NaN);
      expect(pose.angle).toBeCloseTo(0);
    });
  });

  it('lands once, after the hit sound has ended, so the hit and the whomp stay apart', () => {
    const tumble = new Tumble(STANDING, 1, FAIL_TUMBLE);
    const landings: number[] = [];
    for (let time = FRAME; time < 3; time += FRAME) if (tumble.advance(FRAME)) landings.push(time);
    expect(landings).toHaveLength(1);
    expect((landings[0] ?? 0) * 1000).toBeGreaterThan(AUDIO.hit.ms);
  });

  it('falls the way it is pushed, mirrored either way', () => {
    const right = new Tumble(STANDING, 1, FAIL_TUMBLE);
    const left = new Tumble(STANDING, -1, FAIL_TUMBLE);
    run(right, 3);
    run(left, 3);
    const meanX = (tumble: Tumble) => tumble.poses().reduce((sum, p) => sum + p.x, 0) / BLOCK_IDS.length;
    expect(meanX(right)).toBeGreaterThan(CELL_SIZE);
    expect(meanX(left)).toBeCloseTo(-meanX(right));
  });

  it('bounces its blocks visibly but low, each bounce lower than the one before', () => {
    const tumble = new Tumble(STANDING, 1, FAIL_TUMBLE);
    // Per block: the highest it rises each time it leaves the floor after landing.
    const hops: number[][] = STANDING.map(() => []);
    const onFloor = STANDING.map(() => false);
    // Watched every step of the sim, so no touch of the floor is missed.
    for (let time = 0; time < 3; time += SIM_STEP) {
      tumble.advance(SIM_STEP);
      if (!tumble.landed) continue;
      tumble.poses().forEach((pose, i) => {
        const part = STANDING[i];
        const list = hops[i];
        if (part === undefined || list === undefined) return;
        const height = -(pose.y + reachBelow(part, pose.angle));
        if (height < 0.01) onFloor[i] = true;
        else if (onFloor[i]) {
          onFloor[i] = false;
          list.push(height);
        } else if (list.length > 0) list[list.length - 1] = Math.max(list.at(-1) ?? 0, height);
      });
    }
    const firstHops = hops.map((list) => list[0] ?? 0);
    expect(Math.max(...firstHops)).toBeGreaterThan(CELL_SIZE);
    expect(Math.max(...firstHops)).toBeLessThan(FIGURE_HEIGHT / 3);
    for (const list of hops) {
      for (let k = 1; k < list.length; k++) expect(list[k]).toBeLessThan(list[k - 1] ?? Infinity);
    }
  });

  it('keeps the arms still in the air for reduced motion, and swings them otherwise', () => {
    const armL = BLOCK_IDS.indexOf('armL');
    const torso = BLOCK_IDS.indexOf('torso');
    const gap = (tumble: Tumble) => {
      const poses = tumble.poses();
      const a = poses[armL];
      const t = poses[torso];
      return a === undefined || t === undefined ? NaN : Math.hypot(a.x - t.x, a.y - t.y) + Math.abs(a.angle - t.angle);
    };
    const still = new Tumble(STANDING, 1, { ...FAIL_TUMBLE, flailDeg: 0 });
    const flailing = new Tumble(STANDING, 1, FAIL_TUMBLE);
    const start = gap(still);
    for (const tumble of [still, flailing]) tumble.advance(0.04);
    expect(still.landed).toBe(false);
    expect(gap(still)).toBeCloseTo(start);
    expect(gap(flailing)).not.toBeCloseTo(start);
  });

  it('plays the same at any frame rate', () => {
    const slow = new Tumble(STANDING, 1, FAIL_TUMBLE);
    const fast = new Tumble(STANDING, 1, FAIL_TUMBLE);
    for (let i = 0; i < 60; i++) slow.advance(1 / 30);
    for (let i = 0; i < 288; i++) fast.advance(1 / 144);
    fast.poses().forEach((pose, i) => {
      const other = slow.poses()[i];
      expect(pose.x).toBeCloseTo(other?.x ?? NaN, 0);
      expect(pose.y).toBeCloseTo(other?.y ?? NaN, 0);
    });
  });

  it('moves on only a little after a long stall', () => {
    const tumble = new Tumble(STANDING, 1, FAIL_TUMBLE);
    tumble.advance(10);
    expect(tumble.landed).toBe(false);
  });

  it('lands on the stage, in front of the tray', () => {
    expect(FAIL_TUMBLE.landScale).toBeGreaterThan(1);
    expect(project(floorEdge(1), FAIL_TUMBLE.landScale).y).toBeLessThan(STAGE_BOTTOM_Y);
  });

  // Every pose, both ways, with and without the flail.
  it('never sinks into the floor, and leaves every block still and flat before the game-over screen', () => {
    for (const pose of everyPose()) {
      const parts = partsFor(pose);
      for (const dir of [-1, 1] as const) {
        for (const flailDeg of [FAIL_TUMBLE.flailDeg, 0]) {
          const tumble = new Tumble(parts, dir, { ...FAIL_TUMBLE, flailDeg });
          let sank = false;
          const settledAt = run(tumble, FAIL_TO_GAME_OVER_MS / 1000, () => {
            tumble.poses().forEach((p, i) => {
              const part = parts[i];
              if (part !== undefined && p.y + reachBelow(part, p.angle) > 1e-6) sank = true;
            });
          });
          expect(sank).toBe(false);
          expect(settledAt).toBeGreaterThan(0);
          for (const p of tumble.poses()) expect(Math.abs(p.angle - nearestFlat(p.angle))).toBeLessThan(0.01);
        }
      }
    }
  });
});
