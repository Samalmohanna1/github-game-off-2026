import Phaser from 'phaser';
import { CARD, COLORS, GRAIN, PANEL_EDGE_WIDTH, TEAR } from '@/config';
import type { Point } from '@/logic/perspective';
import type { Random } from '@/logic/random';
import { tornRect } from '@/logic/torn';

// The paper look of the design mocks (M10), drawn in code: no image files.

export const GRAIN_TEXTURE = 'paper-grain';

// Sparse dark and light specks on a transparent tile. Textures belong to the
// game, so this runs once (BootScene) and every scene can tile it.
export function makeGrainTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GRAIN_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = GRAIN.size;
  canvas.height = GRAIN.size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const image = ctx.createImageData(GRAIN.size, GRAIN.size);
  const dark = Phaser.Display.Color.IntegerToColor(COLORS.grain);
  const light = Phaser.Display.Color.IntegerToColor(COLORS.panel);
  for (let i = 0; i < GRAIN.size * GRAIN.size; i++) {
    const roll = Math.random();
    const speck = roll < GRAIN.darkShare ? dark : roll < GRAIN.darkShare + GRAIN.lightShare ? light : null;
    if (speck === null) continue;
    image.data.set([speck.red, speck.green, speck.blue, Math.round(Math.random() * GRAIN.maxAlpha * 255)], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  scene.textures.addCanvas(GRAIN_TEXTURE, canvas);
}

export function toVectors(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
}

// A torn paper card centered on (0, 0), optionally edged.
export function drawTornCard(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  random: Random,
  edge: number | null = null,
): void {
  const points = toVectors(tornRect(width, height, TEAR.step, TEAR.jag, random));
  g.fillStyle(COLORS.panel);
  g.fillPoints(points, true);
  if (edge !== null) {
    g.lineStyle(PANEL_EDGE_WIDTH, edge);
    g.strokePoints(points, true);
  }
}

// One line of text on a torn paper card that fits it, centered on (x, y).
export function paperLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Container {
  const text = new Phaser.GameObjects.Text(scene, 0, 0, label, style).setOrigin(0.5);
  const card = new Phaser.GameObjects.Graphics(scene);
  drawTornCard(card, text.width + 2 * CARD.padX, text.height + 2 * CARD.padY, Math.random);
  return scene.add.container(x, y, [card, text]);
}
