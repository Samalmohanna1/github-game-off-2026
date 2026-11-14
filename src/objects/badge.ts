import Phaser from 'phaser';
import { BADGE, COLORS, SLASH } from '@/config';
import type { Point } from '@/logic/perspective';
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

// The badge's parallelogram, pushed out by `grow` on every side with its
// sides kept parallel: a slanted side moves out by `grow` across itself,
// which is further than that along the horizontal.
function outline(b: BadgeSpec, grow: number): Point[] {
  const lean = badgeLean(b.height);
  const [top, bottom] = [b.y - b.height / 2, b.y + b.height / 2];
  const left = (y: number) => b.x - b.width / 2 + (lean * (bottom - y)) / b.height;
  const right = (y: number) => b.x + b.width / 2 - (lean * (y - top)) / b.height;
  const side = (grow * Math.hypot(lean, b.height)) / b.height;
  const [t, f] = [top - grow, bottom + grow];
  return [
    { x: left(t) - side, y: t },
    { x: right(t) + side, y: t },
    { x: right(f) + side, y: f },
    { x: left(f) - side, y: f },
  ];
}

// A badge (M10b review 4), in the HUD's angular language: a parallelogram
// leaning like the HUD's slashes, filled solid, in a thick ink edge, so it and
// its text stand off any wall or background. The edge is a filled shape
// rather than a stroke, so it closes at every corner (M11 review).
export function drawBadge(g: Phaser.GameObjects.Graphics, b: BadgeSpec): void {
  g.fillStyle(COLORS.badgeEdge);
  g.fillPoints(toVectors(outline(b, BADGE.edgeWidth)), true);
  g.fillStyle(b.fill);
  g.fillPoints(toVectors(outline(b, 0)), true);
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
