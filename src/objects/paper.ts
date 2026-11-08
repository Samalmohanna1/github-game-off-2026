import Phaser from 'phaser';
import { CARD, COLORS, GRAIN, TEAR } from '@/config';
import type { Random } from '@/logic/random';
import { tornRect } from '@/logic/torn';
import { pencil, toVectors } from '@/objects/pencil';

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
  const light = Phaser.Display.Color.IntegerToColor(COLORS.grainLight);
  for (let i = 0; i < GRAIN.size * GRAIN.size; i++) {
    const roll = Math.random();
    const speck = roll < GRAIN.darkShare ? dark : roll < GRAIN.darkShare + GRAIN.lightShare ? light : null;
    if (speck === null) continue;
    image.data.set([speck.red, speck.green, speck.blue, Math.round(Math.random() * GRAIN.maxAlpha * 255)], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  scene.textures.addCanvas(GRAIN_TEXTURE, canvas);
}

// A torn paper card centered on (0, 0), outlined in pencil like every other
// paper edge.
export function drawTornCard(g: Phaser.GameObjects.Graphics, width: number, height: number, random: Random): void {
  const outline = tornRect(width, height, TEAR.step, TEAR.jag, random);
  g.fillStyle(COLORS.panel);
  g.fillPoints(toVectors(outline), true);
  pencil(g, outline, true);
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
