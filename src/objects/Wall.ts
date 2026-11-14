import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FIGURE_FLOOR_Y,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  HOLE_EDGE,
  SHIFT_ARROW,
  SHIFT_WALL_SLIDE_MS,
  WALL_APPEAR_MS,
  WALL_COMPLETE,
  WALL_FLASH_MS,
  WALL_FRAME_WIDTH,
  WALL_HEIGHT,
  WALL_RATTLE,
} from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';
import type { HoleGrid } from '@/logic/wall-gen';
import {
  coverFit,
  cropOf,
  frameEdges,
  holeEdges,
  holeRects,
  solidRects,
  type Rect,
  type Segment,
  type WallLayout,
} from '@/logic/wall-shape';

const FLOOR = FIGURE_FLOOR_Y - VANISHING_POINT.y;
const TOP = FLOOR - WALL_HEIGHT;
const LEFT = -FLOOR_HALF_WIDTH;
const RIGHT = FLOOR_HALF_WIDTH;
const GRID_TOP = FLOOR - FIGURE_HEIGHT;
const ARROW_Y = (TOP + GRID_TOP) / 2;
const PANEL: Rect = { x: LEFT, y: TOP, width: RIGHT - LEFT, height: FLOOR - TOP };

// Pieces of one image, each cropped to a rect of the wall, so together they
// show the image only inside those rects. Every piece is the whole image,
// scaled to cover the wall and cropped, so neighboring pieces line up exactly.
class ImagePieces extends Phaser.GameObjects.Container {
  private readonly pool: Phaser.GameObjects.Image[] = [];

  show(key: string | null, rects: readonly Rect[]): void {
    const frame = key === null ? null : this.scene.textures.getFrame(key);
    const fit = frame === null ? null : coverFit(frame.width, frame.height, PANEL);
    this.pool.forEach((piece) => piece.setVisible(false));
    if (key === null || fit === null) return;
    rects.forEach((rect, i) => {
      const piece = this.pool[i] ?? this.addPiece(key);
      const crop = cropOf(rect, fit);
      piece.setTexture(key).setPosition(fit.x, fit.y).setScale(fit.scale);
      piece.setCrop(crop.x, crop.y, crop.width, crop.height).setVisible(true);
    });
  }

  private addPiece(key: string): Phaser.GameObjects.Image {
    const piece = new Phaser.GameObjects.Image(this.scene, 0, 0, key).setOrigin(0, 0);
    this.pool.push(piece);
    this.add(piece);
    return piece;
  }
}

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. The hole is cut
// from the same pose grid the figure uses (PLAN.md §3), at the hole's lane;
// during a Shift Wall slide that lane is fractional. It is redrawn only when
// something changes, never every frame.
// M10b: the wall is an image panel (src/assets/walls/) in a thin cream frame,
// or a plain forest panel when there's no image. The hole is really cut out of
// the image, so the runway and the void show through it, and its edge is a
// lime line on a wider ink one, so it reads over any image and whatever shows
// through it. On a pose lock the hole flashes lime and the image's missing
// piece fills it in, until the wall reaches the figure and the hole opens
// again for it to pass.
export class Wall extends Phaser.GameObjects.Container {
  private readonly image: ImagePieces;
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly piece: ImagePieces;
  private readonly pieceFace: Phaser.GameObjects.Graphics;
  private readonly flare: Phaser.GameObjects.Graphics;
  private readonly lines: Phaser.GameObjects.Graphics;
  private imageKey: string | null = null;
  private holeLane = 0;
  private grid: HoleGrid = [];
  private warningDir: -1 | 1 | null = null;
  private flashing = false;
  private flashTimer?: Phaser.Time.TimerEvent;
  private slide?: Phaser.Tweens.Tween;
  private rattling?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    super(scene, VANISHING_POINT.x, VANISHING_POINT.y);
    scene.add.existing(this);
    this.image = new ImagePieces(scene);
    this.face = new Phaser.GameObjects.Graphics(scene);
    this.piece = new ImagePieces(scene);
    this.pieceFace = new Phaser.GameObjects.Graphics(scene);
    this.flare = new Phaser.GameObjects.Graphics(scene);
    this.lines = new Phaser.GameObjects.Graphics(scene);
    this.add([this.image, this.face, this.piece, this.pieceFace, this.flare, this.lines]);
  }

  // A new wall: its hole, and the image it shows (null for a plain panel).
  setHole(lane: number, grid: HoleGrid, imageKey: string | null): void {
    this.slide?.stop();
    this.rattling?.stop();
    this.holeLane = lane;
    this.grid = grid;
    this.imageKey = imageKey !== null && this.scene.textures.exists(imageKey) ? imageKey : null;
    this.warningDir = null;
    this.reopen();
    this.redraw();
  }

  // A new wall fades in where the runway ends.
  appear(): void {
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: WALL_APPEAR_MS });
  }

  flash(): void {
    this.flashing = true;
    this.redraw();
    this.flashTimer?.remove();
    this.flashTimer = this.scene.time.delayedCall(WALL_FLASH_MS, () => {
      this.flashing = false;
      this.redraw();
    });
  }

  // Wrong key (M8): the wall shakes side to side, dying away. Only its
  // position moves, so the hole stays where the rules have it.
  rattle(): void {
    this.rattling?.stop();
    const { distance, ms, swings } = WALL_RATTLE;
    this.rattling = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      onUpdate: (tween) => {
        const p = tween.getValue() ?? 1;
        this.setX(VANISHING_POINT.x + distance * Math.sin(p * swings * 2 * Math.PI) * (1 - p));
      },
      onComplete: () => this.setX(VANISHING_POINT.x),
      onStop: () => this.setX(VANISHING_POINT.x),
    });
  }

  // Shift Wall warning (PLAN.md §5): the wall changes color and an arrow shows
  // which way the hole is about to slide.
  warn(dir: -1 | 1): void {
    this.warningDir = dir;
    this.redraw();
  }

  slideHoleTo(lane: number): void {
    this.warningDir = null;
    this.slide?.stop();
    this.slide = this.scene.tweens.addCounter({
      from: this.holeLane,
      to: lane,
      duration: SHIFT_WALL_SLIDE_MS,
      ease: 'Quad.easeInOut',
      onUpdate: (tween) => {
        this.holeLane = tween.getValue() ?? lane;
        this.redraw();
      },
    });
  }

  // Pose lock: the hole flashes lime, and the image's missing piece fades in
  // under the flash, completing the picture.
  complete(): void {
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
    const hole = holeRects(this.grid, this.layout());
    this.piece.show(this.imageKey, hole);
    this.pieceFace.clear();
    if (this.imageKey === null) fillRects(this.pieceFace, hole, COLORS.wall);
    this.flare.clear();
    fillRects(this.flare, hole, COLORS.wallComplete);

    this.piece.setAlpha(0);
    this.pieceFace.setAlpha(0);
    this.flare.setAlpha(WALL_COMPLETE.flashAlpha);
    this.scene.tweens.add({ targets: [this.piece, this.pieceFace], alpha: 1, duration: WALL_COMPLETE.fillMs });
    this.scene.tweens.add({ targets: this.flare, alpha: 0, duration: WALL_COMPLETE.flashMs, ease: 'Quad.easeOut' });
  }

  // The hole opens again, so the figure shows through as the wall passes it.
  reopen(): void {
    this.scene.tweens.killTweensOf([this.piece, this.pieceFace, this.flare]);
    this.piece.show(null, []);
    this.pieceFace.clear();
    this.flare.clear();
  }

  private layout(): WallLayout {
    const gridLeft = laneCenterX(this.holeLane) - VANISHING_POINT.x - FIGURE_WIDTH / 2;
    return { left: LEFT, right: RIGHT, top: TOP, floor: FLOOR, gridLeft, gridTop: GRID_TOP, cell: CELL_SIZE };
  }

  private redraw(): void {
    const layout = this.layout();
    const solid = solidRects(this.grid, layout);
    this.image.show(this.imageKey, solid);

    // An alert covers the image; with no image, the panel is plain.
    const alert = this.flashing ? COLORS.wallFlash : this.warningDir !== null ? COLORS.wallWarning : null;
    const face = alert ?? (this.imageKey === null ? COLORS.wall : null);
    this.face.clear();
    if (face !== null) fillRects(this.face, solid, face);

    this.lines.clear();
    edges(this.lines, frameEdges(layout), WALL_FRAME_WIDTH, COLORS.wallFrame);
    const hole = holeEdges(this.grid, layout);
    edges(this.lines, hole, HOLE_EDGE.shade, COLORS.holeEdgeShade);
    edges(this.lines, hole, HOLE_EDGE.lime, COLORS.holeEdge);
    if (this.warningDir !== null) this.drawArrow(layout.gridLeft + FIGURE_WIDTH / 2, this.warningDir);
  }

  // Over the hole, kept inside the wall when the hole is near an edge.
  private drawArrow(holeCenter: number, dir: -1 | 1): void {
    const { length, shaftThickness, headLength, headWidth } = SHIFT_ARROW;
    const center = Phaser.Math.Clamp(holeCenter, LEFT + length / 2 + WALL_FRAME_WIDTH, RIGHT - length / 2 - WALL_FRAME_WIDTH);
    const tail = center - (dir * length) / 2;
    const tip = center + (dir * length) / 2;
    const headBase = tip - dir * headLength;

    const g = this.lines;
    g.fillStyle(COLORS.shiftArrow);
    g.fillRect(Math.min(tail, headBase), ARROW_Y - shaftThickness / 2, Math.abs(headBase - tail), shaftThickness);
    g.fillTriangle(headBase, ARROW_Y - headWidth / 2, headBase, ARROW_Y + headWidth / 2, tip, ARROW_Y);
  }
}

function fillRects(g: Phaser.GameObjects.Graphics, rects: readonly Rect[], color: number): void {
  g.fillStyle(color);
  for (const r of rects) g.fillRect(r.x, r.y, r.width, r.height);
}

// Straight edges `width` thick, centered on each segment and run on by half
// the width at both ends, so edges meeting at a corner close it square. None
// reaches below the floor, where the wall stands on the runway.
function edges(g: Phaser.GameObjects.Graphics, segments: readonly Segment[], width: number, color: number): void {
  g.fillStyle(color);
  for (const s of segments) {
    const x = Math.min(s.x1, s.x2) - width / 2;
    const y = Math.min(s.y1, s.y2) - width / 2;
    const bottom = Math.min(Math.max(s.y1, s.y2) + width / 2, FLOOR);
    g.fillRect(x, y, Math.abs(s.x2 - s.x1) + width, bottom - y);
  }
}
