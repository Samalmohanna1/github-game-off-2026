import Phaser from 'phaser';
import { COLORS, PANEL } from '@/config';
import type { Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

// Which side of the panel's box carries the lime accent bar, whether it runs
// from that side's far end (right or bottom) rather than its near one, and
// how long it is, px.
export interface Accent {
  readonly side: 'top' | 'left' | 'right';
  readonly fromEnd: boolean;
  readonly length: number;
}

// One of the angular UI panels (M10b): a solid charcoal face, with either a
// thin sage edge (`edged`) or a short lime accent bar laid just inside one
// side. Keep the accent off the panel's cut corners.
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  shape: readonly Point[],
  { edged = false, accent }: { readonly edged?: boolean; readonly accent?: Accent },
): void {
  g.fillStyle(COLORS.panel);
  g.fillPoints(toVectors(shape), true);
  if (edged) {
    g.lineStyle(PANEL.edgeWidth, COLORS.panelEdge);
    g.strokePoints(toVectors(shape), true, true);
  }
  if (accent === undefined) return;

  const xs = shape.map((p) => p.x);
  const ys = shape.map((p) => p.y);
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const { length } = accent;
  const thick = PANEL.accentWidth;
  g.fillStyle(COLORS.panelAccent);
  if (accent.side === 'top') g.fillRect(accent.fromEnd ? right - length : left, top, length, thick);
  else g.fillRect(accent.side === 'left' ? left : right - thick, accent.fromEnd ? bottom - length : top, thick, length);
}
