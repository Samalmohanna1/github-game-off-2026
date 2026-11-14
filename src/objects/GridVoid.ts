import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FLOOR, GAME_HEIGHT, GAME_WIDTH, HORIZON_Y, VOID, WALL_START_SCALE } from '@/config';
import { FALLING_SQUARES, FLOOR_STREAKS, WALL_CELLS, type SquareTone } from '@/data/void-art';
import { cycleProgress, fadeEnvelope } from '@/logic/fall';
import { LANE_WIDTH } from '@/logic/lanes';
import { VANISHING_POINT, project, type Point } from '@/logic/perspective';
import { prefersReducedMotion } from '@/scenes/ui';

// A point on the floor at lateral offset x (px at the figure's plane) and
// depth (1/scale): the same perspective as the runway.
const ground = (x: number, depth: number): Point =>
  project({ x: VANISHING_POINT.x + x, y: FIGURE_FLOOR_Y }, 1 / depth);

const HALF_WIDTH = GAME_WIDTH / 2;
// The floor runs from the foot of the screen back to the back wall, which
// stands at the runway's far end, where the walls appear.
const NEAR_DEPTH = (FIGURE_FLOOR_Y - HORIZON_Y) / (GAME_HEIGHT - HORIZON_Y);
const BACK_DEPTH = 1 / WALL_START_SCALE;
const SEAM_Y = ground(0, BACK_DEPTH).y;
// The back wall's grid squares, so its columns carry on the floor's lanes.
const CELL = LANE_WIDTH / BACK_DEPTH;
// Floor lines run along the runway's lane seams and on out (line k at
// k + 1/2 lane widths from the middle), and across at its tile rows.
const lineX = (k: number) => (k + 0.5) * LANE_WIDTH;
const LAST_LINE = Math.ceil(HALF_WIDTH / CELL) + 1;
const GLOW_TEXTURE = 'void-glow';
const GLOW_TEXTURE_SIZE = 256;

const lerp = (a: number, b: number, t: number) => a + (b - a) * Phaser.Math.Clamp(t, 0, 1);
// How far back a floor depth is, 0 at the foot of the screen, 1 at the seam.
const backness = (depth: number) => (depth - NEAR_DEPTH) / (BACK_DEPTH - NEAR_DEPTH);
const floorAlpha = (depth: number) => lerp(VOID.floorAlpha[0], VOID.floorAlpha[1], backness(depth));
// How high up the back wall, 0 at the seam, 1 at the top of the screen.
const wallAlpha = (y: number) => lerp(VOID.wallAlpha[0], VOID.wallAlpha[1], (SEAM_Y - y) / SEAM_Y);
const TONE_COLOR: Readonly<Record<SquareTone, number>> = {
  dim: COLORS.squareDim,
  mid: COLORS.squareMid,
  bright: COLORS.squareBright,
};

// The background (M10b, after the mockup): a dark grid stage. A glossy floor
// grid in the stage's perspective runs back to a gridded back wall at the
// runway's far end, where the walls appear, and the two meet at a glowing
// lime seam, with light rising toward it. A fixed composition
// (src/data/void-art.ts) frames the play: lit cells on the back wall that
// breathe in a wave across it, squares that fall slowly to the seam and fade
// (M10b review 3), and streaks of light running down the floor. The floor
// drifts toward the camera with a wave of light through its rows. Every cycle
// is steady and set by hand, never random. All still for reduced motion.
export class GridVoid extends Phaser.GameObjects.Container {
  private readonly moving: Phaser.GameObjects.Graphics;
  private readonly still = prefersReducedMotion();

  constructor(scene: Phaser.Scene) {
    super(scene);
    const light = new Phaser.GameObjects.Graphics(scene);
    drawLight(light);
    const { width, height, alpha } = VOID.glow;
    const glow = new Phaser.GameObjects.Image(scene, VANISHING_POINT.x, SEAM_Y, glowTexture(scene));
    glow.setDisplaySize(width, height).setAlpha(alpha);
    const grid = new Phaser.GameObjects.Graphics(scene);
    drawBackWall(grid);
    drawFloorLines(grid);
    this.moving = new Phaser.GameObjects.Graphics(scene);
    const seam = new Phaser.GameObjects.Graphics(scene);
    drawSeam(seam);
    this.add([light, glow, grid, this.moving, seam]);
    scene.add.existing(this);
    this.drawMoving(0);
  }

  preUpdate(time: number): void {
    if (!this.still) this.drawMoving(time);
  }

  private drawMoving(time: number): void {
    const g = this.moving;
    g.clear();
    this.drawRows(time);
    const { fromY, fadeIn, fadeOut, trail, trailAlpha } = VOID.fall;
    // Where each thing is in its cycle; for reduced motion, held still at a
    // point where it is fully visible.
    const progress = (ms: number, phase: number) =>
      this.still ? fadeIn + (1 - fadeIn - fadeOut) * phase : cycleProgress(time, ms, phase);
    const vertical = (color: number, x: number, y: number, w: number, h: number, top: number, foot: number) => {
      g.fillGradientStyle(color, color, color, color, top, top, foot, foot);
      g.fillRect(x, y, w, h);
    };

    // Streaks of light running down the floor from the seam.
    for (const { x, width, height, travel, ms, phase } of FLOOR_STREAKS) {
      const p = progress(ms, phase);
      const a = VOID.streakAlpha * fadeEnvelope(p, fadeIn, fadeOut);
      const foot = SEAM_Y + 4 + p * travel;
      const top = Math.max(SEAM_Y + 1, foot - height);
      vertical(COLORS.seam, x - width / 2, top, width, foot - top, 0, a);
      g.fillStyle(COLORS.seam, Math.min(1, a * 1.6));
      g.fillRect(x - width / 2, foot - 1, width, 2);
    }

    // The back wall's lit cells breathe in one wave sweeping across it.
    for (const { column, row, tone } of WALL_CELLS) {
      const x = VANISHING_POINT.x + (column - 0.5) * CELL;
      const y = SEAM_Y - (row + 1) * CELL;
      const sweep = 2 * Math.PI * (time / VOID.breatheMs - x / VOID.sweepPx);
      const breath = this.still ? 1 - VOID.breathe / 2 : 1 - VOID.breathe * (0.5 + 0.5 * Math.sin(sweep));
      g.fillStyle(TONE_COLOR[tone], VOID.tones[tone] * 0.5 * breath);
      g.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    }

    // Squares falling down their columns to the seam, each with a faint trail,
    // and some mirrored in the glossy floor, meeting their reflection there.
    for (const { x, size, tone, ms, phase, reflect } of FALLING_SQUARES) {
      const p = progress(ms, phase);
      const a = VOID.tones[tone] * fadeEnvelope(p, fadeIn, fadeOut);
      const color = TONE_COLOR[tone];
      const y = fromY + p * (SEAM_Y - size / 2 - fromY);
      const left = x - size / 2;
      vertical(color, left, y - size / 2 - trail * size, size, trail * size, 0, a * trailAlpha);
      g.fillStyle(color, a);
      g.fillRect(left, y - size / 2, size, size);
      if (reflect === true) {
        const mirror = 2 * SEAM_Y - y;
        vertical(color, left, mirror - size / 2, size, VOID.reflectLength, a * VOID.reflectAlpha * p, 0);
      }
    }
  }

  // The lines across the floor, at the runway's tile rows, drifted toward
  // the camera, each dimmed by the wave between its crests.
  private drawRows(time: number): void {
    const g = this.moving;
    const travel = this.still ? 0 : time / VOID.driftMs;
    const depthOf = (row: number) => 1 + (row + 0.5 - travel) * FLOOR.tileDepth;
    const { rows: crestEvery, ms: msPerRow, dip } = VOID.wave;
    for (let row = Math.ceil((NEAR_DEPTH - 1) / FLOOR.tileDepth - 0.5 + travel); depthOf(row) < BACK_DEPTH; row++) {
      const depth = depthOf(row);
      const along = (depth - 1) / FLOOR.tileDepth + time / msPerRow;
      const wave = this.still ? 1 : 1 - dip * (0.5 - 0.5 * Math.cos((2 * Math.PI * along) / crestEvery));
      const y = ground(0, depth).y;
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, floorAlpha(depth) * wave);
      g.lineBetween(0, y, GAME_WIDTH, y);
    }
  }
}

// Light rising toward the seam, down the back wall and up the floor.
function drawLight(g: Phaser.GameObjects.Graphics): void {
  const { void: dark, voidGlow: glow } = COLORS;
  const a = VOID.lightAlpha;
  g.fillStyle(dark);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillGradientStyle(glow, glow, glow, glow, 0, 0, a, a);
  g.fillRect(0, 0, GAME_WIDTH, SEAM_Y);
  g.fillGradientStyle(glow, glow, glow, glow, a * 0.8, a * 0.8, 0, 0);
  g.fillRect(0, SEAM_Y, GAME_WIDTH, GAME_HEIGHT - SEAM_Y);
}

// The back wall's square grid, dimming upward, with a dot at each crossing.
function drawBackWall(g: Phaser.GameObjects.Graphics): void {
  for (let y = SEAM_Y - CELL; y > -CELL; y -= CELL) {
    g.lineStyle(VOID.lineWidth, COLORS.voidGrid, wallAlpha(y));
    g.lineBetween(0, y, GAME_WIDTH, y);
  }
  for (let k = -LAST_LINE; k <= LAST_LINE; k++) {
    const x = VANISHING_POINT.x + (k + 0.5) * CELL;
    for (let y = SEAM_Y; y > 0; y -= CELL) {
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, wallAlpha(y - CELL / 2));
      g.lineBetween(x, y, x, y - CELL);
      if (y === SEAM_Y) continue;
      const d = VOID.dotSize;
      g.fillStyle(COLORS.seam, VOID.dotAlpha * (wallAlpha(y) / VOID.wallAlpha[0]));
      g.fillRect(x - d / 2, y - d / 2, d, d);
    }
  }
}

// The floor's lines toward the vanishing point, from where each leaves the
// screen back to the seam, in pieces that brighten toward it.
function drawFloorLines(g: Phaser.GameObjects.Graphics): void {
  const step = 1 + VOID.fadeStep;
  const outermost = Math.ceil((HALF_WIDTH * BACK_DEPTH) / LANE_WIDTH);
  for (let k = -outermost - 1; k <= outermost; k++) {
    const x = lineX(k);
    for (let near = Math.max(NEAR_DEPTH, Math.abs(x) / HALF_WIDTH); near < BACK_DEPTH; near *= step) {
      const far = Math.min(near * step, BACK_DEPTH);
      const [a, b] = [ground(x, near), ground(x, far)];
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, floorAlpha((near + far) / 2));
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
}

// The glowing seam where floor meets back wall: a soft bloom and a lime line.
function drawSeam(g: Phaser.GameObjects.Graphics): void {
  const c = COLORS.seam;
  const a = VOID.bloomAlpha;
  g.fillGradientStyle(c, c, c, c, 0, 0, a, a);
  g.fillRect(0, SEAM_Y - VOID.bloomAbove, GAME_WIDTH, VOID.bloomAbove);
  g.fillGradientStyle(c, c, c, c, a, a, 0, 0);
  g.fillRect(0, SEAM_Y, GAME_WIDTH, VOID.bloomBelow);
  g.fillStyle(c);
  g.fillRect(0, SEAM_Y - VOID.seamWidth / 2, GAME_WIDTH, VOID.seamWidth);
}

// A round glow, its color fading smoothly to nothing at the edge, made once
// per game and stretched into the ellipse behind the wall.
function glowTexture(scene: Phaser.Scene): string {
  if (scene.textures.exists(GLOW_TEXTURE)) return GLOW_TEXTURE;
  const texture = scene.textures.createCanvas(GLOW_TEXTURE, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
  if (texture === null) return GLOW_TEXTURE;
  const r = GLOW_TEXTURE_SIZE / 2;
  const context = texture.getContext();
  const color = Phaser.Display.Color.IntegerToColor(COLORS.voidGlow);
  const rgba = (a: number) => `rgba(${color.red}, ${color.green}, ${color.blue}, ${a})`;
  const gradient = context.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, rgba(1));
  gradient.addColorStop(0.45, rgba(0.55));
  gradient.addColorStop(1, rgba(0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
  texture.refresh();
  return GLOW_TEXTURE;
}
