import Phaser from 'phaser';
import type { Point } from '@/logic/perspective';

// Phaser's polygon fills and strokes take Vector2s.
export function toVectors(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
}
