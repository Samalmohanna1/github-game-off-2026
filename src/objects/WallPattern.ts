import Phaser from 'phaser';
import type { Motif, WallPatternSpec } from '@/logic/wall-pattern';
import { WALL_PANEL } from '@/logic/wall-shape';

const TEXTURE = 'wall-pattern';
const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

// The wall's face (M10b review 3): one canvas texture the size of the wall
// at full scale, repainted with a fresh pattern for every wall. The wall and
// the image completion both show it through ImagePieces, so the hole is cut
// out of it and the completion fills the pattern back in.
export class WallPattern {
  private readonly texture: Phaser.Textures.CanvasTexture | null;

  constructor(scene: Phaser.Scene) {
    const existing = scene.textures.exists(TEXTURE) ? scene.textures.get(TEXTURE) : null;
    this.texture =
      existing instanceof Phaser.Textures.CanvasTexture
        ? existing
        : scene.textures.createCanvas(TEXTURE, Math.ceil(WALL_PANEL.width), Math.ceil(WALL_PANEL.height));
  }

  // The texture's key, or null if it couldn't be made (the wall is then plain).
  get key(): string | null {
    return this.texture === null ? null : TEXTURE;
  }

  // Each tile's ground, then its motif turned about its middle, in the colors
  // of the scheme. Tile edges land on whole pixels, so no seams show.
  paint(spec: WallPatternSpec, scheme: readonly number[]): void {
    if (this.texture === null) return;
    const context = this.texture.getContext();
    const color = (i: number) => css(scheme[i] ?? scheme[0] ?? 0);
    context.fillStyle = color(0);
    context.fillRect(0, 0, this.texture.width, this.texture.height);
    for (const tile of spec.tiles) {
      const [x0, x1] = [spec.left + tile.col * spec.size, spec.left + (tile.col + 1) * spec.size].map(Math.round);
      const [y0, y1] = [tile.row * spec.size, (tile.row + 1) * spec.size].map(Math.round);
      context.fillStyle = color(tile.ground);
      context.fillRect(x0!, y0!, x1! - x0!, y1! - y0!);
      if (tile.motif === null) continue;
      context.save();
      context.beginPath();
      context.rect(x0!, y0!, x1! - x0!, y1! - y0!);
      context.clip();
      context.translate((x0! + x1!) / 2, (y0! + y1!) / 2);
      context.rotate((tile.turn * Math.PI) / 2);
      context.fillStyle = color(tile.ink);
      drawMotif(context, tile.motif, spec.size, color(tile.ground));
      context.restore();
    }
    this.texture.refresh();
  }
}

// A motif in a tile `s` px square, centered on the origin, in the current
// fill; `ground` cuts a ring's middle.
function drawMotif(c: CanvasRenderingContext2D, motif: Motif, s: number, ground: string): void {
  const h = s / 2;
  const disc = (x: number, y: number, r: number, from = 0, to = 2 * Math.PI) => {
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, r, from, to);
    c.closePath();
    c.fill();
  };
  const polygon = (...points: [number, number][]) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
    c.closePath();
    c.fill();
  };
  switch (motif) {
    case 'quarter':
      disc(-h, -h, s, 0, Math.PI / 2);
      break;
    case 'half':
      disc(0, h, h, Math.PI, 2 * Math.PI);
      break;
    case 'circle':
      disc(0, 0, s * 0.36);
      break;
    case 'ring':
      disc(0, 0, s * 0.4);
      c.fillStyle = ground;
      disc(0, 0, s * 0.2);
      break;
    case 'triangle':
      polygon([-h, -h], [h, -h], [-h, h]);
      break;
    case 'split':
      c.fillRect(-h, -h, s, h);
      break;
    case 'stripes':
      for (let i = 0; i < 3; i++) c.fillRect(-h, -h + (i * s) / 3, s, s / 6);
      break;
    case 'diamond':
      polygon([0, -h * 0.72], [h * 0.72, 0], [0, h * 0.72], [-h * 0.72, 0]);
      break;
    case 'dots':
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        disc((x * s) / 4, (y * s) / 4, s * 0.12);
      }
      break;
  }
}
