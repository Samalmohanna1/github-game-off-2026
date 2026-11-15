import Phaser from 'phaser';
import {
  COLORS,
  FIGURE_EDGE_WIDTH,
  FIGURE_GRID,
  FIGURE_SHADOW,
  FIGURE_WIDTH,
  WALL_COMPLETE,
} from '@/config';
import { BLOCK_IDS } from '@/data/poses';
import { VANISHING_POINT } from '@/logic/perspective';
import { holeGrid, type Pose } from '@/logic/wall-gen';
import { holeEdges, holeRects, wallLayout, type Rect, type WallLayout } from '@/logic/wall-shape';
import { ImagePieces } from '@/objects/ImagePieces';
import { fillSegments } from '@/objects/vectors';

// The completion, the signature moment (M10b review). Once a cleared
// wall reaches the figure, at scale 1, its hole and the figure's pose line up
// cell for cell. Then the figure's cells light up lime, row by row from the
// feet up, with dark seams between them like the panel's pixels (M10b review
// 4); the panel fills back in over them, so the wall looks whole; and a lime
// trace of the silhouette fades. It is drawn over the figure, in the wall's
// space at full size, and leaves with the wall, so the figure itself never
// changes.
export class Completion extends Phaser.GameObjects.Container {
  private readonly pixels: Phaser.GameObjects.Graphics;
  private readonly detail: ImagePieces;
  private readonly trace: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, VANISHING_POINT.x, VANISHING_POINT.y);
    scene.add.existing(this);
    this.pixels = new Phaser.GameObjects.Graphics(scene);
    this.detail = new ImagePieces(scene);
    this.trace = new Phaser.GameObjects.Graphics(scene);
    this.add([this.pixels, this.detail, this.trace]);
    this.reset();
  }

  // The wall's texture (null for a plain wall), the pose that cleared it and
  // the hole's lane. onWhole runs once the restored panel has held.
  play(textureKey: string | null, pose: Pose, holeLane: number, onWhole: () => void): void {
    this.reset();
    const layout = wallLayout(holeLane);
    const grid = holeGrid(pose);
    // Grown past the hole's edge, so the detail also covers the figure's
    // edge and the hole's, plus the strip of wall the figure's shadow
    // reaches up over; it is the same texture as the wall's there.
    const shadow = {
      x: layout.gridLeft + FIGURE_WIDTH / 2 - FIGURE_SHADOW.width / 2,
      y: layout.floor - FIGURE_SHADOW.height / 2,
      width: FIGURE_SHADOW.width,
      height: FIGURE_SHADOW.height / 2,
    };
    this.detail.show(textureKey, [...grown(holeRects(grid, layout), FIGURE_EDGE_WIDTH, layout.floor), shadow]);
    this.detail.setAlpha(0);
    fillSegments(this.trace, holeEdges(grid, layout, true), WALL_COMPLETE.traceWidth, COLORS.completionTrace);
    this.trace.setAlpha(0);
    this.setVisible(true);

    const sweep = { rows: 0 };
    const tweens = this.scene.tweens;
    tweens.chain({
      tweens: [
        {
          targets: sweep,
          rows: FIGURE_GRID.rows,
          duration: WALL_COMPLETE.pixelMs,
          onUpdate: () => this.drawPixels(pose, layout, sweep.rows),
        },
        {
          targets: this.detail,
          alpha: 1,
          duration: WALL_COMPLETE.restoreMs,
          completeDelay: WALL_COMPLETE.holdMs,
          onStart: () => {
            this.trace.setAlpha(1);
            tweens.add({ targets: this.trace, alpha: 0, duration: WALL_COMPLETE.traceMs, ease: 'Quad.easeIn' });
          },
        },
      ],
      onComplete: onWhole,
    });
  }

  reset(): void {
    this.scene.tweens.killTweensOf([this, this.detail, this.trace]);
    this.pixels.clear();
    this.trace.clear();
    this.detail.show(null, []);
    this.setVisible(false).setAlpha(1).setScale(1);
  }

  // Each cell the pose covers, lit, the rows from the feet up to `rows`
  // showing (the topmost one fading in). A cell is a dark square with a lime
  // one inside it, so neighbors part by a dark seam as thick as the figure's
  // edge, and it covers the figure's own cream seams.
  private drawPixels(pose: Pose, layout: WallLayout, rows: number): void {
    const g = this.pixels;
    const cell = layout.cell;
    const inset = FIGURE_EDGE_WIDTH / 2;
    g.clear();
    for (const id of BLOCK_IDS) {
      const r = pose[id];
      for (let row = r.row; row < r.row + r.rows; row++) {
        const shown = Phaser.Math.Clamp(rows - (FIGURE_GRID.rows - 1 - row), 0, 1);
        if (shown === 0) continue;
        for (let col = r.col; col < r.col + r.cols; col++) {
          const [x, y] = [layout.gridLeft + col * cell, layout.gridTop + row * cell];
          g.fillStyle(COLORS.completionSeam, shown);
          g.fillRect(x, y, cell, cell);
          g.fillStyle(COLORS.completionCell, shown);
          g.fillRect(x + inset, y + inset, cell - 2 * inset, cell - 2 * inset);
        }
      }
    }
  }
}

// Rects grown by `by` on every side, but never below the floor.
function grown(rects: readonly Rect[], by: number, floor: number): Rect[] {
  return rects.map((r) => {
    const y = r.y - by;
    return { x: r.x - by, y, width: r.width + 2 * by, height: Math.min(r.y + r.height + by, floor) - y };
  });
}
