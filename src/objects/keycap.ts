import Phaser from 'phaser';
import { CHIP, CHIP_FONT_FAMILY, COLORS, KEY_CAP } from '@/config';
import { keyCapRect } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';

// A key cap: a rect with its top-left and bottom-right corners cut, centered
// on 0, 0. `grow` pushes every edge out by that much, keeping the cuts
// parallel.
export function keyCapShape(width: number, height: number, grow = 0): Point[] {
  return keyCapRect(-width / 2, -height / 2, width, height, CHIP.cut, grow);
}

export interface EdgedKeyCap {
  readonly x: number; // the top-left corner
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly cut: number;
  readonly edgeWidth: number;
  readonly edge: number;
  readonly fill: number;
}

// A key cap shape in a closed edge (the buttons and the dark cards, M11
// review 2): the edge is the shape grown by edgeWidth and filled under it, so
// it closes at every corner, cuts included.
export function fillEdgedKeyCap(g: Phaser.GameObjects.Graphics, k: EdgedKeyCap): void {
  g.fillStyle(k.edge);
  g.fillPoints(toVectors(keyCapRect(k.x, k.y, k.width, k.height, k.cut, k.edgeWidth)), true);
  g.fillStyle(k.fill);
  g.fillPoints(toVectors(keyCapRect(k.x, k.y, k.width, k.height, k.cut)), true);
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
