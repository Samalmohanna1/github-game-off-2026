import Phaser from 'phaser';
import { COLORS, PENCIL } from '@/config';
import type { Point } from '@/logic/perspective';
import { sketch } from '@/logic/sketch';

export function toVectors(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
}

export interface PencilOptions {
  readonly color?: number;
  readonly width?: number;
  // Different seeds wobble differently; the same seed wobbles the same way.
  readonly seed?: number;
  // The wobble follows positions relative to this point, so a shape that
  // moves keeps its wobble (src/logic/sketch.ts).
  readonly anchor?: Point;
}

// Every outline in the game (M10): a firm pencil stroke plus a fainter ghost
// stroke beside it, both wobbling a little off the true line, the same way on
// every redraw.
export function pencil(
  g: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  closed: boolean,
  { color = COLORS.pencil, width = PENCIL.width, seed = 0, anchor }: PencilOptions = {},
): void {
  g.lineStyle(width, color);
  g.strokePoints(toVectors(sketch(points, closed, PENCIL.step, PENCIL.jitter, seed, anchor)), closed);
  g.lineStyle(width * (PENCIL.ghostWidth / PENCIL.width), color, PENCIL.ghostAlpha);
  g.strokePoints(toVectors(sketch(points, closed, PENCIL.step, PENCIL.ghostJitter, seed + 2, anchor)), closed);
}

// A circle as a polygon, for pencilling round shapes.
export function circlePoints(radius: number, sides = 72): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}
