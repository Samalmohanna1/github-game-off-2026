import Phaser from 'phaser';
import { COLORS, SLASH, TRAY } from '@/config';
import type { Point } from '@/logic/perspective';
import { fillSlash } from '@/objects/slash';
import { toVectors } from '@/objects/vectors';

// The bar's step: how far its line runs across, and drops, between its two
// heights.
export const BAR_STEP = { across: TRAY.ramp, drop: TRAY.lowY - TRAY.highY } as const;

// How far the line's slashes reach left of its start, at their feet.
export const BAR_SLASHES_REACH = 2 * (SLASH.width + SLASH.gap);

// The bar's line (M10b review 2, after the mockup): a thin sage line through
// `points`, stepping between heights by BAR_STEP, with two lime slashes
// standing just before its start, centered on its height. The bar runs it
// along its foot; the game-over card uses it to part its results (M11
// review 2).
export function drawBarLine(g: Phaser.GameObjects.Graphics, points: readonly Point[]): void {
  const start = points[0];
  if (start === undefined) return;
  g.lineStyle(TRAY.lineWidth, COLORS.trayLine, TRAY.lineAlpha);
  g.strokePoints(toVectors(points));

  const slash = { y: start.y - SLASH.height / 2, width: SLASH.width, height: SLASH.height, lean: SLASH.lean, slices: 1 };
  const firstX = start.x - BAR_SLASHES_REACH + SLASH.lean;
  for (const x of [firstX, firstX + SLASH.width + SLASH.gap]) {
    fillSlash(g, { ...slash, x, top: COLORS.trayAccent, foot: COLORS.trayAccent });
  }
}
