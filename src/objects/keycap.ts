import Phaser from 'phaser';
import { CHIP, CHIP_FONT_FAMILY, COLORS, KEY_CAP } from '@/config';
import { chamferedRect } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';

// A key cap: a rect with its top-left and bottom-right corners cut, centered
// on 0, 0. `grow` pushes every edge out by that much, keeping the cuts
// parallel.
export function keyCapShape(width: number, height: number, grow = 0): Point[] {
  // An edge pushed out by g lengthens a 45-degree cut by g * (2 - sqrt 2).
  const cut = CHIP.cut + grow * (2 - Math.SQRT2);
  const [w, h] = [width + 2 * grow, height + 2 * grow];
  return chamferedRect(-w / 2, -h / 2, w, h, { topLeft: cut, bottomRight: cut });
}

// A labeled key cap (M11, the how-to screen's keys), cream with dark
// letters like the bar's, KEY_CAP.height tall and at least as wide, its left
// edge at x and its middle on y. Returns its width.
export function addKeyCap(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, label: string): number {
  const style = { ...textStyle('small', 'ink', true), fontFamily: CHIP_FONT_FAMILY };
  const text = centerGlyphs(new Phaser.GameObjects.Text(scene, 0, y, label, style).setOrigin(0.5));
  const width = Math.max(KEY_CAP.height, text.width + 2 * KEY_CAP.padX);
  const middle = x + width / 2;
  const cap = new Phaser.GameObjects.Graphics(scene);
  cap.fillStyle(COLORS.chipCurrent);
  cap.fillPoints(toVectors(keyCapShape(width, KEY_CAP.height).map((p) => ({ x: p.x + middle, y: p.y + y }))), true);
  text.setX(middle);
  parent.add([cap, text]);
  return width;
}
