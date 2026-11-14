import Phaser from 'phaser';
import { BADGE, COLORS, SLASH } from '@/config';
import { fillSlash } from '@/objects/slash';
import { toVectors } from '@/objects/vectors';

export interface BadgeSpec {
  readonly x: number; // its middle
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: number;
}

// How far a badge `height` px tall leans across it, so every badge keeps one
// angle.
export function badgeLean(height: number): number {
  return (BADGE.slant * height) / BADGE.height;
}

// A badge (M10b review 4), in the HUD's angular language: a parallelogram
// leaning like the HUD's slashes, filled solid, in a thick ink edge, so it and
// its text stand off any wall or background.
export function drawBadge(g: Phaser.GameObjects.Graphics, b: BadgeSpec): void {
  const lean = badgeLean(b.height);
  const [left, right, top, bottom] = [b.x - b.width / 2, b.x + b.width / 2, b.y - b.height / 2, b.y + b.height / 2];
  const shape = toVectors([
    { x: left + lean, y: top },
    { x: right, y: top },
    { x: right - lean, y: bottom },
    { x: left, y: bottom },
  ]);
  g.lineStyle(BADGE.edgeWidth, COLORS.badgeEdge);
  g.strokePoints(shape, true, true);
  g.fillStyle(b.fill);
  g.fillPoints(shape, true);
}

// Two slashes in `color` beside a badge's right edge, leaning with it.
export function drawBadgeSlashes(g: Phaser.GameObjects.Graphics, b: BadgeSpec, color: number): void {
  const first = b.x + b.width / 2 + BADGE.slashGap;
  for (const x of [first, first + SLASH.width + SLASH.gap]) {
    fillSlash(g, {
      x,
      y: b.y - b.height / 2,
      width: SLASH.width,
      height: b.height,
      lean: badgeLean(b.height),
      top: color,
      foot: color,
      slices: 1,
    });
  }
}

// How far a badge with its slashes reaches right of its middle.
export function badgeReach(width: number): number {
  return width / 2 + BADGE.slashGap + 2 * SLASH.width + SLASH.gap;
}
