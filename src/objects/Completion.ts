import Phaser from 'phaser';
import {
  COLORS,
  FIGURE_EDGE_WIDTH,
  FIGURE_GRID,
  FIGURE_SEAM_WIDTH,
  FIGURE_SHADOW,
  FIGURE_WIDTH,
  WALL_COMPLETE,
} from '@/config';
import { BLOCK_IDS } from '@/data/poses';
import { blockAverages } from '@/logic/mosaic';
import { VANISHING_POINT } from '@/logic/perspective';
import { holeGrid, type Pose } from '@/logic/wall-gen';
import { WALL_PANEL, coverFit, cropOf, holeEdges, holeRects, wallLayout, type Rect, type WallLayout } from '@/logic/wall-shape';
import { ImagePieces } from '@/objects/ImagePieces';
import { fillSegments } from '@/objects/vectors';

// Each cell's color averages SAMPLE × SAMPLE points of the pattern under it.
const SAMPLE = 6;
let sampler: HTMLCanvasElement | null = null;

// The completion, the signature moment (M10b review). Once a cleared
// wall reaches the figure, at scale 1, its hole and the figure's pose line up
// cell for cell. Then the figure's pixels take the colors of the pattern's
// missing piece, row by row from the feet up, keeping the figure's cream
// seams; the pattern's own detail fills in over them, so the picture looks
// whole; and a lime trace of the silhouette fades. It is drawn over the
// figure, in the wall's space at full size, and leaves with the wall, so the
// figure itself never changes.
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

  // The wall's texture (null for a plain panel), the pose that cleared it and
  // the hole's lane. onWhole runs once the restored picture has held.
  play(textureKey: string | null, pose: Pose, holeLane: number, onWhole: () => void): void {
    this.reset();
    const layout = wallLayout(holeLane);
    const grid = holeGrid(pose);
    const colors = this.cellColors(textureKey, layout);
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
          onUpdate: () => this.drawPixels(pose, layout, colors, sweep.rows),
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

  // Each cell the pose covers, in the pattern's color under it, the rows from
  // the feet up to `rows` showing (the topmost one fading in), with the
  // figure's own cream seams and edges over them.
  private drawPixels(pose: Pose, layout: WallLayout, colors: readonly number[], rows: number): void {
    const g = this.pixels;
    const { cols, rows: gridRows } = FIGURE_GRID;
    const cell = layout.cell;
    g.clear();
    for (const id of BLOCK_IDS) {
      const r = pose[id];
      for (let row = r.row; row < r.row + r.rows; row++) {
        const shown = Phaser.Math.Clamp(rows - (gridRows - 1 - row), 0, 1);
        if (shown === 0) continue;
        for (let col = r.col; col < r.col + r.cols; col++) {
          g.fillStyle(colors[row * cols + col] ?? COLORS.wall, shown);
          g.fillRect(layout.gridLeft + col * cell, layout.gridTop + row * cell, cell, cell);
        }
      }
    }
    for (const id of BLOCK_IDS) {
      const r = pose[id];
      const [x, y, w, h] = [layout.gridLeft + r.col * cell, layout.gridTop + r.row * cell, r.cols * cell, r.rows * cell];
      g.lineStyle(FIGURE_SEAM_WIDTH, COLORS.figureEdge);
      for (let c = 1; c < r.cols; c++) g.lineBetween(x + c * cell, y, x + c * cell, y + h);
      for (let k = 1; k < r.rows; k++) g.lineBetween(x, y + k * cell, x + w, y + k * cell);
      g.lineStyle(FIGURE_EDGE_WIDTH, COLORS.figureEdge);
      g.strokeRect(x, y, w, h);
    }
  }

  // The average color of the pattern under each cell of the pose grid, row
  // by row; all plain panel color when there's no texture to read.
  private cellColors(textureKey: string | null, layout: WallLayout): number[] {
    const { cols, rows } = FIGURE_GRID;
    const plain = Array<number>(cols * rows).fill(COLORS.wall);
    if (textureKey === null) return plain;
    const frame = this.scene.textures.getFrame(textureKey);
    const source = this.scene.textures.get(textureKey).getSourceImage();
    if (!(source instanceof HTMLImageElement || source instanceof HTMLCanvasElement)) return plain;

    sampler ??= document.createElement('canvas');
    sampler.width = cols * SAMPLE;
    sampler.height = rows * SAMPLE;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    if (context === null) return plain;
    const grid = { x: layout.gridLeft, y: layout.gridTop, width: cols * layout.cell, height: rows * layout.cell };
    const crop = cropOf(grid, coverFit(frame.width, frame.height, WALL_PANEL));
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, sampler.width, sampler.height);
    return blockAverages(context.getImageData(0, 0, sampler.width, sampler.height).data, cols, rows, SAMPLE);
  }
}

// Rects grown by `by` on every side, but never below the floor.
function grown(rects: readonly Rect[], by: number, floor: number): Rect[] {
  return rects.map((r) => {
    const y = r.y - by;
    return { x: r.x - by, y, width: r.width + 2 * by, height: Math.min(r.y + r.height + by, floor) - y };
  });
}
