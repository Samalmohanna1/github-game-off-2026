import Phaser from 'phaser';
import { BACKDROP, COLORS } from '@/config';
import { seededRandom } from '@/logic/random';
import { tornOutline } from '@/logic/torn';
import { toVectors } from '@/objects/paper';

// The paper collage behind the stage (M10, after the design mocks): a pale
// half-circle, torn green and paper scraps, a patch of grid paper and a few
// rows of halftone dots. Drawn once, from a fixed seed, and never redrawn.
export class Backdrop extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    const random = seededRandom(BACKDROP.seed);

    for (const { color, x, y, r } of BACKDROP.circles) {
      this.fillStyle(COLORS[color]);
      this.fillCircle(x, y, r);
    }

    for (const { color, points } of BACKDROP.torn) {
      const corners = points.map(([x, y]) => ({ x, y }));
      this.fillStyle(COLORS[color]);
      this.fillPoints(toVectors(tornOutline(corners, BACKDROP.tear.step, BACKDROP.tear.jag, random)), true);
    }

    const grid = BACKDROP.grid;
    this.fillStyle(COLORS.panel);
    this.fillRect(grid.x, grid.y, grid.width, grid.height);
    this.lineStyle(grid.lineWidth, COLORS.gridLine);
    for (let x = grid.x; x <= grid.x + grid.width; x += grid.cell) this.lineBetween(x, grid.y, x, grid.y + grid.height);
    for (let y = grid.y; y <= grid.y + grid.height; y += grid.cell) this.lineBetween(grid.x, y, grid.x + grid.width, y);

    const dots = BACKDROP.halftone;
    this.fillStyle(COLORS.grain, dots.alpha);
    for (let y = dots.y; y <= dots.y + dots.height; y += dots.spacing) {
      // Every other row shifts half a step, like a printed screen.
      const shift = ((y - dots.y) / dots.spacing) % 2 === 0 ? 0 : dots.spacing / 2;
      for (let x = dots.x + shift; x <= dots.x + dots.width; x += dots.spacing) this.fillCircle(x, y, dots.radius);
    }
  }
}
