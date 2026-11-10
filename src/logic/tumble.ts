import { CELL_SIZE, FIGURE_HEIGHT, FIGURE_WIDTH, type FailTumbleTuning } from '@/config';
import { NEUTRAL_POSE, type BlockId, type CellRect } from '@/data/poses';

// The fail's fall (PLAN.md §7, M10 review 5), in the figure's own space: px,
// y down, with the origin at the bottom center of the pose grid, where the
// figure stands, so the floor is y = 0. Angles are radians, clockwise, as
// Phaser draws them. Visual only: the fail itself is decided before this runs.

export interface Box {
  readonly x: number; // center
  readonly y: number;
  readonly halfW: number;
  readonly halfH: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

// Where a block on these cells sits in the figure's space.
export function blockBox(cell: CellRect): Box {
  return {
    x: (cell.col + cell.cols / 2) * CELL_SIZE - FIGURE_WIDTH / 2,
    y: (cell.row + cell.rows / 2) * CELL_SIZE - FIGURE_HEIGHT,
    halfW: (cell.cols * CELL_SIZE) / 2,
    halfH: (cell.rows * CELL_SIZE) / 2,
  };
}

// How far a box tilted to this angle reaches below its center.
export function reachBelow(box: { readonly halfW: number; readonly halfH: number }, angle: number): number {
  return Math.abs(box.halfW * Math.sin(angle)) + Math.abs(box.halfH * Math.cos(angle));
}

const QUARTER = Math.PI / 2;

// The nearest angle at which a box lies flat on one of its sides.
export function nearestFlat(angle: number): number {
  return Math.round(angle / QUARTER) * QUARTER;
}

// A long block only stays standing on its end when it lands within this share
// of the tilt that would tip it over: real ones rarely stay up, and an arm
// standing like a post reads as a mistake.
const STAND_MARGIN = 0.5;

// The side a box at rest settles onto. It rocks back onto the side it is
// nearest unless its middle has passed that side's edge, and then it tips
// over onto the next one, so a long block ends up lying on a long side unless
// it landed almost upright.
export function restingAngle(box: { readonly halfW: number; readonly halfH: number }, angle: number): number {
  const flat = nearestFlat(angle);
  const tilt = angle - flat;
  const upright = Math.abs(Math.round(flat / QUARTER)) % 2 === 0;
  const [base, height] = upright ? [box.halfW, box.halfH] : [box.halfH, box.halfW];
  const balance = Math.atan2(base, height) * (base < height ? STAND_MARGIN : 1);
  return Math.abs(tilt) < balance ? flat : flat + Math.sign(tilt) * QUARTER;
}

function rotate(x: number, y: number, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

export interface TumblePart extends Box {
  readonly angle: number; // its tilt as the fall starts
  // An arm swings back and forth about its shoulder while the figure is in
  // the air; the other blocks have no flail.
  readonly flail: { readonly pivot: Point; readonly phase: number } | null;
}

export interface PartPose {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
}

// The arms hang from the torso's top corners, so they flail from there.
const TORSO = blockBox(NEUTRAL_POSE.torso);
const SHOULDER = { y: TORSO.y - TORSO.halfH, left: TORSO.x - TORSO.halfW, right: TORSO.x + TORSO.halfW } as const;

// Where an arm meets its shoulder, on the arm's own center line, so it swings
// from the shoulder whether it hangs, is raised or points out.
function shoulderPivot(arm: Box, shoulderX: number): Point {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  if (arm.halfH >= arm.halfW) return { x: arm.x, y: clamp(SHOULDER.y, arm.y - arm.halfH, arm.y + arm.halfH) };
  return { x: clamp(shoulderX, arm.x - arm.halfW, arm.x + arm.halfW), y: arm.y };
}

// A block as the fall starts: sized by its cells, at the place and tilt a
// squash or slump left it. The two arms flail in turn.
export function tumblePart(id: BlockId, cell: CellRect, at: PartPose): TumblePart {
  const { halfW, halfH } = blockBox(cell);
  const box: Box = { x: at.x, y: at.y, halfW, halfH };
  const flail =
    id === 'armL'
      ? { pivot: shoulderPivot(box, SHOULDER.left), phase: 0 }
      : id === 'armR'
        ? { pivot: shoulderPivot(box, SHOULDER.right), phase: Math.PI }
        : null;
  return { ...box, angle: at.angle, flail };
}

// One block on its own, once the figure has hit the floor and come apart.
interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  // Once on the floor for good, the angle it settles to: no more bounces, it
  // tips flat and stops sliding. Null while it is still bouncing.
  restAngle: number | null;
  readonly halfW: number;
  readonly halfH: number;
}

// Fixed steps, so the fall plays the same at any frame rate.
const STEP = 1 / 240; // s
// A long frame (a stall, a hidden tab) moves the fall on by no more than this.
const MAX_ADVANCE = 0.05; // s
// How near flat and how slow a resting piece must be to count as still.
const STILL_ANGLE = 0.01; // rad
const STILL_SPEED = 1; // px/s

const DEG = Math.PI / 180;

// The figure is knocked off its feet in one piece: it hops, drifts and turns
// the way it falls, with its arms flailing. The moment any block touches the
// floor, the blocks come apart, each keeping the speed its spot on the turning
// figure had, plus a scatter outward from the figure's middle. Each one then
// bounces lower and lower, slides less each time, and once a landing is too
// soft to bounce, tips flat onto its nearest side and stops.
export class Tumble {
  private readonly center: Point;
  private readonly body: { x: number; y: number; vx: number; vy: number; angle: number; spin: number };
  private pieces: Piece[] | null = null;
  private time = 0;
  private carry = 0;

  constructor(
    private readonly parts: readonly TumblePart[],
    dir: -1 | 1,
    private readonly tuning: FailTumbleTuning,
  ) {
    let area = 0;
    let x = 0;
    let y = 0;
    for (const part of parts) {
      const a = part.halfW * part.halfH;
      area += a;
      x += part.x * a;
      y += part.y * a;
    }
    this.center = area > 0 ? { x: x / area, y: y / area } : { x: 0, y: 0 };
    this.body = { ...this.center, vx: dir * tuning.push, vy: -tuning.hop, angle: 0, spin: dir * tuning.spinDeg * DEG };
  }

  get landed(): boolean {
    return this.pieces !== null;
  }

  get settled(): boolean {
    return this.pieces?.every(isStill) ?? false;
  }

  // Moves the fall on; true when the figure hit the floor during this call.
  advance(seconds: number): boolean {
    const wasLanded = this.landed;
    this.carry += Math.min(seconds, MAX_ADVANCE);
    while (this.carry >= STEP) {
      this.carry -= STEP;
      this.step(STEP);
    }
    return !wasLanded && this.landed;
  }

  // Each part's place, in the order the parts were given.
  poses(): PartPose[] {
    if (this.pieces !== null) return this.pieces.map(({ x, y, angle }) => ({ x, y, angle }));
    return this.parts.map((part) => this.airbornePose(part));
  }

  private step(dt: number): void {
    if (this.pieces !== null) {
      for (const piece of this.pieces) stepPiece(piece, dt, this.tuning);
      return;
    }
    const body = this.body;
    body.vy += this.tuning.gravity * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.angle += body.spin * dt;
    this.time += dt;
    const touching = this.parts.some((part) => {
      const pose = this.airbornePose(part);
      return pose.y + reachBelow(part, pose.angle) >= 0;
    });
    if (touching) this.breakApart();
  }

  private airbornePose(part: TumblePart): PartPose {
    let local: Point = part;
    let angle = part.angle;
    if (part.flail !== null) {
      const { pivot, phase } = part.flail;
      const swing = this.tuning.flailDeg * DEG * Math.sin(2 * Math.PI * this.tuning.flailHz * this.time + phase);
      const r = rotate(part.x - pivot.x, part.y - pivot.y, swing);
      local = { x: pivot.x + r.x, y: pivot.y + r.y };
      angle += swing;
    }
    const r = rotate(local.x - this.center.x, local.y - this.center.y, this.body.angle);
    return { x: this.body.x + r.x, y: this.body.y + r.y, angle: angle + this.body.angle };
  }

  private breakApart(): void {
    const { x, y, vx, vy, spin } = this.body;
    const { scatter } = this.tuning;
    this.pieces = this.parts.map((part) => {
      const pose = this.airbornePose(part);
      const rx = pose.x - x;
      const ry = pose.y - y;
      return {
        ...pose,
        // The step that found the floor may have carried a block a little into it.
        y: Math.min(pose.y, -reachBelow(part, pose.angle)),
        vx: vx - spin * ry + scatter * rx,
        vy: vy + spin * rx,
        spin,
        restAngle: null,
        halfW: part.halfW,
        halfH: part.halfH,
      };
    });
  }
}

function stepPiece(piece: Piece, dt: number, tuning: FailTumbleTuning): void {
  if (piece.restAngle !== null) {
    const ease = 1 - Math.exp(-tuning.settleRate * dt);
    piece.angle += (piece.restAngle - piece.angle) * ease;
    piece.vx *= 1 - ease;
    piece.x += piece.vx * dt;
    piece.y = -reachBelow(piece, piece.angle);
    return;
  }
  piece.vy += tuning.gravity * dt;
  piece.x += piece.vx * dt;
  piece.y += piece.vy * dt;
  piece.angle += piece.spin * dt;
  const floor = -reachBelow(piece, piece.angle);
  if (piece.y < floor) return;
  piece.y = floor;
  if (piece.vy <= 0) return;
  if (piece.vy < tuning.restSpeed) {
    piece.restAngle = restingAngle(piece, piece.angle);
    piece.vy = 0;
    piece.spin = 0;
    return;
  }
  piece.vy *= -tuning.restitution;
  piece.vx *= tuning.friction;
  piece.spin *= tuning.spinKeep;
}

function isStill(piece: Piece): boolean {
  return (
    piece.restAngle !== null && Math.abs(piece.angle - piece.restAngle) < STILL_ANGLE && Math.abs(piece.vx) < STILL_SPEED
  );
}
