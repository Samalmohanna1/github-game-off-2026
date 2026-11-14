import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FLOOR, GAME_HEIGHT, GAME_WIDTH, HORIZON_Y, VOID } from '@/config';
import { LANE_WIDTH } from '@/logic/lanes';
import { VANISHING_POINT, project, type Point } from '@/logic/perspective';
import { prefersReducedMotion } from '@/scenes/ui';

// A point on the ground at lateral offset x (px at the figure's plane) and
// depth (1/scale): the same perspective as the runway.
const ground = (x: number, depth: number): Point =>
  project({ x: VANISHING_POINT.x + x, y: FIGURE_FLOOR_Y }, 1 / depth);

// The ground's nearest visible depth, at the bottom of the screen.
const NEAR_DEPTH = (FIGURE_FLOOR_Y - HORIZON_Y) / (GAME_HEIGHT - HORIZON_Y);
const [FADE_FROM, FAR_DEPTH] = VOID.fadeDepth;
const HALF_WIDTH = GAME_WIDTH / 2;
// Lines run along the runway's lane seams and on out to the sides (line k at
// k + 1/2 lane widths from the middle), and across at its tile rows, so the
// runway sits in the grid.
const lineX = (k: number) => (k + 0.5) * LANE_WIDTH;
// The outermost line still on screen before the grid fades out.
const LAST_LINE = Math.floor((FAR_DEPTH * HALF_WIDTH) / LANE_WIDTH);
const GLOW_TEXTURE = 'void-glow';
const GLOW_TEXTURE_SIZE = 256;

// Lines fade out smoothly with depth, into the dark, well before they bunch
// up, so there is no hard horizon.
function fade(depth: number): number {
  return 1 - Phaser.Math.SmoothStep(depth, FADE_FROM, FAR_DEPTH);
}

// The background (M10b, refined at its review): a dark void with a soft glow
// behind the incoming wall, and a faint ground grid in the stage's
// perspective that melts into the dark. The grid drifts slowly toward the
// camera, and a gentle wave of light runs through its rows the same way:
// one even, continuous motion, still for reduced motion. Nothing else moves.
export class GridVoid extends Phaser.GameObjects.Container {
  private readonly rows: Phaser.GameObjects.Graphics;
  private readonly still = prefersReducedMotion();

  constructor(scene: Phaser.Scene) {
    super(scene);
    const dark = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.void).setOrigin(0, 0);
    const { below, width, height, alpha } = VOID.glow;
    const glow = new Phaser.GameObjects.Image(scene, VANISHING_POINT.x, HORIZON_Y + below, glowTexture(scene));
    glow.setDisplaySize(width, height).setAlpha(alpha);
    const lines = new Phaser.GameObjects.Graphics(scene);
    drawLinesToHorizon(lines);
    this.rows = new Phaser.GameObjects.Graphics(scene);
    this.add([dark, glow, lines, this.rows]);
    scene.add.existing(this);
    this.drawRows(0);
  }

  preUpdate(time: number): void {
    if (!this.still) this.drawRows(time);
  }

  // The lines across the ground, at the runway's tile rows, drifted toward
  // the camera, each dimmed by the wave between its crests.
  private drawRows(time: number): void {
    const g = this.rows;
    g.clear();
    const travel = time / VOID.driftMs;
    const depthOf = (row: number) => 1 + (row + 0.5 - travel) * FLOOR.tileDepth;
    const { rows: crestEvery, ms: msPerRow, dip } = VOID.wave;
    for (let row = Math.ceil((NEAR_DEPTH - 1) / FLOOR.tileDepth - 0.5 + travel); depthOf(row) < FAR_DEPTH; row++) {
      const depth = depthOf(row);
      const along = (depth - 1) / FLOOR.tileDepth + time / msPerRow;
      const wave = this.still ? 1 : 1 - dip * (0.5 - 0.5 * Math.cos((2 * Math.PI * along) / crestEvery));
      const y = ground(0, depth).y;
      g.lineStyle(VOID.lineWidth, COLORS.voidGrid, VOID.lineAlpha * fade(depth) * wave);
      g.lineBetween(0, y, GAME_WIDTH, y);
    }
  }
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

// The lines toward the vanishing point never move, so they're drawn once, in
// short pieces that fade with depth, from where each leaves the screen. The
// runway covers the ones under it.
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
