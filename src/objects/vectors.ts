import Phaser from 'phaser';
import type { Point } from '@/logic/perspective';
import type { Segment } from '@/logic/wall-shape';

// Phaser's polygon fills and strokes take Vector2s.
export function toVectors(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
}

// Straight axis-aligned edges `width` thick, centered on each segment and run
// on by half the width at both ends, so edges meeting at a corner close it
// square. None reaches below maxY (the wall's edges stop at its floor).
export function fillSegments(
  g: Phaser.GameObjects.Graphics,
  segments: readonly Segment[],
  width: number,
  color: number,
  maxY = Infinity,
): void {
  g.fillStyle(color);
  for (const s of segments) {
    const x = Math.min(s.x1, s.x2) - width / 2;
    const y = Math.min(s.y1, s.y2) - width / 2;
    const bottom = Math.min(Math.max(s.y1, s.y2) + width / 2, maxY);
    g.fillRect(x, y, Math.abs(s.x2 - s.x1) + width, bottom - y);
  }
}
