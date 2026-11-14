import Phaser from 'phaser';
import {
  COLORS,
  FIGURE_WIDTH,
  HOLE_EDGE_WIDTH,
  SHIFT_ARROW,
  SHIFT_WALL_SLIDE_MS,
  WALL_APPEAR_MS,
  WALL_FLASH_MS,
  WALL_FRAME_WIDTH,
  WALL_RATTLE,
} from '@/config';
import { VANISHING_POINT } from '@/logic/perspective';
import type { HoleGrid } from '@/logic/wall-gen';
import { frameEdges, holeEdges, solidRects, wallLayout, type Rect, type WallLayout } from '@/logic/wall-shape';
import { ImagePieces } from '@/objects/ImagePieces';
import { fillSegments } from '@/objects/vectors';

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. The hole is cut
// from the same pose grid the figure uses (PLAN.md §3), at the hole's lane;
// during a Shift Wall slide that lane is fractional. It is redrawn only when
// something changes, never every frame.
// M10b: the wall's face is a fresh geometric pattern (WallPattern, M10b
// review 3), shown through ImagePieces with the hole
// really cut out of it, so the runway and the void show through. A thin cream
// frame and a thinner cream edge round the hole are all that is drawn over
// it. If the pattern couldn't be drawn, it is a plain forest panel.
export class Wall extends Phaser.GameObjects.Container {
  private readonly image: ImagePieces;
  private readonly face: Phaser.GameObjects.Graphics;
  private readonly lines: Phaser.GameObjects.Graphics;
  private textureKey: string | null = null;
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
    this.lines = new Phaser.GameObjects.Graphics(scene);
    this.add([this.image, this.face, this.lines]);
  }

  // A new wall: its hole, and the texture it shows (null for a plain panel).
  setHole(lane: number, grid: HoleGrid, textureKey: string | null): void {
    this.slide?.stop();
    this.rattling?.stop();
    this.holeLane = lane;
    this.grid = grid;
    this.textureKey = textureKey;
    this.warningDir = null;
    this.redraw();
  }

  // A new wall fades in where the runway ends, at its starting size.
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

  private redraw(): void {
    const layout = wallLayout(this.holeLane);
    const solid = solidRects(this.grid, layout);
    this.image.show(this.textureKey, solid);

    // An alert covers the pattern; with no texture, the panel is plain.
    const alert = this.flashing ? COLORS.wallFlash : this.warningDir !== null ? COLORS.wallWarning : null;
    const face = alert ?? (this.textureKey === null ? COLORS.wall : null);
    this.face.clear();
    if (face !== null) fillRects(this.face, solid, face);

    this.lines.clear();
    fillSegments(this.lines, frameEdges(layout), WALL_FRAME_WIDTH, COLORS.wallFrame, layout.floor);
    fillSegments(this.lines, holeEdges(this.grid, layout), HOLE_EDGE_WIDTH, COLORS.holeEdge, layout.floor);
    if (this.warningDir !== null) this.drawArrow(layout.gridLeft + FIGURE_WIDTH / 2, layout, this.warningDir);
  }

  // In the band of wall above the hole, kept inside the wall when the hole is
  // near an edge.
  private drawArrow(holeCenter: number, layout: WallLayout, dir: -1 | 1): void {
    const { length, shaftThickness, headLength, headWidth } = SHIFT_ARROW;
    const center = Phaser.Math.Clamp(
      holeCenter,
      layout.left + length / 2 + WALL_FRAME_WIDTH,
      layout.right - length / 2 - WALL_FRAME_WIDTH,
    );
    const arrowY = (layout.top + layout.gridTop) / 2;
    const tail = center - (dir * length) / 2;
    const tip = center + (dir * length) / 2;
    const headBase = tip - dir * headLength;

    const g = this.lines;
    g.fillStyle(COLORS.shiftArrow);
    g.fillRect(Math.min(tail, headBase), arrowY - shaftThickness / 2, Math.abs(headBase - tail), shaftThickness);
    g.fillTriangle(headBase, arrowY - headWidth / 2, headBase, arrowY + headWidth / 2, tip, arrowY);
  }
}

function fillRects(g: Phaser.GameObjects.Graphics, rects: readonly Rect[], color: number): void {
  g.fillStyle(color);
  for (const r of rects) g.fillRect(r.x, r.y, r.width, r.height);
}
