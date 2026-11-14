import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FLOOR, GAME_HEIGHT, GAME_WIDTH, HORIZON_Y, LANE_COUNT, VOID } from '@/config';
import { LANE_WIDTH } from '@/logic/lanes';
import { VANISHING_POINT, project, type Point } from '@/logic/perspective';
import { randomInt } from '@/logic/random';
import { prefersReducedMotion } from '@/scenes/ui';
import { toVectors } from '@/objects/vectors';

// A point on the ground at lateral offset x (px at the figure's plane) and
// depth (1/scale): the same perspective as the runway.
const ground = (x: number, depth: number): Point =>
  project({ x: VANISHING_POINT.x + x, y: FIGURE_FLOOR_Y }, 1 / depth);

// The ground's nearest visible depth, at the bottom of the screen.
const NEAR_DEPTH = (FIGURE_FLOOR_Y - HORIZON_Y) / (GAME_HEIGHT - HORIZON_Y);
const [FADE_FROM, FAR_DEPTH] = VOID.fadeDepth;
const HALF_WIDTH = GAME_WIDTH / 2;
// Lines run along the runway's lane seams and on out to the sides (line k at
// k + 1/2 lane widths from the middle), and across at its tile rows (row m),
// so the runway sits in the grid. Line RUNWAY_EDGE is the runway's right edge.
const lineX = (k: number) => (k + 0.5) * LANE_WIDTH;
const RUNWAY_EDGE = (LANE_COUNT - 1) / 2;
// The outermost line still on screen before the grid fades out.
const LAST_LINE = Math.floor((FAR_DEPTH * HALF_WIDTH) / LANE_WIDTH);

// Lines fade out with depth, so they never bunch into a solid band at the
// horizon.
function fade(depth: number): number {
  return Phaser.Math.Clamp((FAR_DEPTH - depth) / (FAR_DEPTH - FADE_FROM), 0, 1);
}

// A cell spans lines k and k + 1; a pixel sits on line k.
interface Glint {
  readonly kind: 'cell' | 'pixel';
  readonly line: number;
  readonly row: number;
  readonly born: number; // ms, scene time
  readonly life: number; // ms
}

// The background (M10b): a dark void, lit faintly along the horizon, with a
// ground grid in the stage's perspective that drifts slowly toward the camera.
// A few of its squares fade in and out, and a few lime pixels glow at its
// crossings, all beside the runway. Everything that moves is still for
// reduced motion.
export class GridVoid extends Phaser.GameObjects.Container {
  private readonly moving: Phaser.GameObjects.Graphics;
  private readonly still = prefersReducedMotion();
  private glints: Glint[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene);
    const base = new Phaser.GameObjects.Graphics(scene);
    this.moving = new Phaser.GameObjects.Graphics(scene);
    this.add([base, this.moving]);
    scene.add.existing(this);

    drawSky(base);
    drawLinesToHorizon(base);
    base.lineStyle(VOID.horizonWidth, COLORS.horizon, VOID.horizonAlpha);
    base.lineBetween(0, HORIZON_Y, GAME_WIDTH, HORIZON_Y);

    const now = scene.time.now;
    for (let i = 0; i < VOID.cells; i++) this.glints.push(this.spawn('cell', now, true));
    for (let i = 0; i < VOID.pixels; i++) this.glints.push(this.spawn('pixel', now, true));
    this.drawMoving(now);
  }

  preUpdate(time: number): void {
    if (!this.still) this.drawMoving(time);
  }

  // How many rows the grid has drifted toward the camera.
  private travel(time: number): number {
    return this.still ? 0 : time / VOID.driftMs;
  }

  private rowDepth(row: number, time: number): number {
    return 1 + (row + 0.5 - this.travel(time)) * FLOOR.tileDepth;
  }

  private rowAt(depth: number, time: number): number {
    return (depth - 1) / FLOOR.tileDepth - 0.5 + this.travel(time);
  }

  private drawMoving(time: number): void {
    const g = this.moving;
    g.clear();
    for (let row = Math.ceil(this.rowAt(NEAR_DEPTH, time)); this.rowDepth(row, time) < FAR_DEPTH; row++) {
      const depth = this.rowDepth(row, time);
      const y = ground(0, depth).y;
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, VOID.lineAlpha * fade(depth));
      g.lineBetween(0, y, GAME_WIDTH, y);
    }

    this.glints = this.glints.map((glint) => (time - glint.born >= glint.life ? this.spawn(glint.kind, time) : glint));
    for (const glint of this.glints) {
      // Rises and falls once over its life; held halfway for reduced motion.
      const glow = this.still ? 0.5 : Math.sin((Math.PI * (time - glint.born)) / glint.life);
      const near = this.rowDepth(glint.row, time);
      if (glint.kind === 'cell') {
        const far = this.rowDepth(glint.row + 1, time);
        const [x1, x2] = [lineX(glint.line), lineX(glint.line + 1)];
        g.fillStyle(COLORS.voidCell, VOID.cellAlpha * glow * fade(near));
        g.fillPoints(toVectors([ground(x1, far), ground(x2, far), ground(x2, near), ground(x1, near)]), true);
      } else {
        const at = ground(lineX(glint.line), near);
        const size = VOID.pixelSize / near;
        g.fillStyle(COLORS.voidPixel, VOID.pixelAlpha * glow * fade(near));
        g.fillRect(at.x - size / 2, at.y - size / 2, size, size);
      }
    }
  }

  // A new glint beside the runway, on screen, at a depth where the grid is
  // clear. `midLife` starts it partway through, so the first ones don't all
  // rise together.
  private spawn(kind: Glint['kind'], time: number, midLife = false): Glint {
    const [nearest, furthest] = VOID.glintDepth;
    const row = randomInt(Math.ceil(this.rowAt(nearest, time)), Math.floor(this.rowAt(furthest, time)), Math.random);
    // Counted on the right; a cell starts on the runway's edge line, a pixel
    // one line out, so neither is under the runway.
    const first = kind === 'cell' ? RUNWAY_EDGE : RUNWAY_EDGE + 1;
    const onScreen = Math.floor((HALF_WIDTH * this.rowDepth(row, time)) / LANE_WIDTH - 0.5) - (kind === 'cell' ? 1 : 0);
    const right = randomInt(first, Math.max(first, onScreen), Math.random);
    // Mirrored, line k becomes line -k - 1, and a cell's left line is its right one.
    const left = kind === 'cell' ? -right - 2 : -right - 1;
    const life = randomInt(VOID.lifeMs[0], VOID.lifeMs[1], Math.random);
    return {
      kind,
      line: Math.random() < 0.5 ? left : right,
      row,
      life,
      born: midLife ? time - Math.random() * life : time,
    };
  }
}

// The sky darkens upward from a glow over the horizon, and the ground darkens
// toward the camera from a glow under it.
function drawSky(g: Phaser.GameObjects.Graphics): void {
  const { void: dark, voidGlow: glow } = COLORS;
  g.fillStyle(dark);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillGradientStyle(dark, dark, glow, glow, 1);
  g.fillRect(0, HORIZON_Y - VOID.glowAbove, GAME_WIDTH, VOID.glowAbove);
  g.fillGradientStyle(glow, glow, dark, dark, 1);
  g.fillRect(0, HORIZON_Y, GAME_WIDTH, VOID.glowBelow);
}

// The lines toward the vanishing point never move, so they're drawn once, in
// short pieces that fade with depth, from where each leaves the screen. The
// runway covers the ones under it; their stretch past its far end shows
// behind the wall.
function drawLinesToHorizon(g: Phaser.GameObjects.Graphics): void {
  const step = 1 + VOID.fadeStep;
  for (let k = -LAST_LINE - 1; k <= LAST_LINE; k++) {
    const x = lineX(k);
    for (let near = Math.max(NEAR_DEPTH, Math.abs(x) / HALF_WIDTH); near < FAR_DEPTH; near *= step) {
      const far = Math.min(near * step, FAR_DEPTH);
      const [a, b] = [ground(x, near), ground(x, far)];
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, VOID.lineAlpha * fade((near + far) / 2));
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
}
