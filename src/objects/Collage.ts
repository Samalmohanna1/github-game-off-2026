import Phaser from 'phaser';
import { ART_SEED, COLORS, GAME_HEIGHT, GAME_WIDTH, TEAR } from '@/config';
import { COLLAGE, type Grid, type Sheet } from '@/data/collage';
import { spanAt } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import type { Random } from '@/logic/random';
import { tornPiece } from '@/logic/torn';
import { toVectors } from '@/objects/vectors';

// The background (M10): the cream stage with the collage's paper at its
// edges (src/data/collage.ts). Seeded, so it tears the same way every run.
// Drawn once.
export class Collage extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    const rng = new Phaser.Math.RandomDataGenerator([ART_SEED]);
    const random: Random = () => rng.frac();

    this.fillStyle(COLORS.stage);
    this.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (const piece of COLLAGE) {
      if (piece.kind === 'disc') {
        this.fillStyle(COLORS[piece.color]);
        this.fillCircle(piece.x, piece.y, piece.r);
      } else {
        this.drawSheet(piece, random);
      }
    }
  }

  // A torn edge shows the paper's pale core: the outline is filled in the core
  // color, then the sheet over it with its torn edges pulled in a little.
  private drawSheet(sheet: Sheet, random: Random): void {
    const torn = sheet.torn ?? [];
    const { outer, inner } = tornPiece(sheet.corners, torn, TEAR, random);
    if (torn.length > 0) {
      this.fillStyle(COLORS.collageCore);
      this.fillPoints(toVectors(outer), true);
    }
    this.fillStyle(COLORS[sheet.color]);
    this.fillPoints(toVectors(inner), true);
    if (sheet.grid !== undefined) this.drawGrid(sheet.corners, sheet.grid);
  }

  private drawGrid(corners: readonly Point[], { spacing, lineWidth, color, alpha }: Grid): void {
    this.lineStyle(lineWidth, COLORS[color], alpha);
    for (const axis of ['x', 'y'] as const) {
      const values = corners.map((p) => p[axis]);
      for (let at = Math.ceil(Math.min(...values) / spacing) * spacing; at <= Math.max(...values); at += spacing) {
        const span = spanAt(corners, axis, at);
        if (span === null) continue;
        if (axis === 'x') this.lineBetween(at, span[0], at, span[1]);
        else this.lineBetween(span[0], at, span[1], at);
      }
    }
  }
}
