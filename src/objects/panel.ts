import Phaser from 'phaser';
import { COLORS, PANEL } from '@/config';
import { spanAt } from '@/logic/convex';
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

// One of the angular UI panels (M10b), the HUD's and the console's: a
// near-black face with a fine grid inside, a thin edge, and a short lime
// accent bar laid just inside one side. Keep the accent off the panel's cut
// corners.
export function drawPanel(g: Phaser.GameObjects.Graphics, shape: readonly Point[], accent: Accent): void {
  g.fillStyle(COLORS.panel);
  g.fillPoints(toVectors(shape), true);

  const xs = shape.map((p) => p.x);
  const ys = shape.map((p) => p.y);
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  g.lineStyle(1, COLORS.panelGrid, PANEL.gridAlpha);
  for (let x = left + PANEL.gridSpacing; x < right; x += PANEL.gridSpacing) {
    const span = spanAt(shape, 'x', x);
    if (span !== null) g.lineBetween(x, span[0], x, span[1]);
  }
  for (let y = top + PANEL.gridSpacing; y < bottom; y += PANEL.gridSpacing) {
    const span = spanAt(shape, 'y', y);
    if (span !== null) g.lineBetween(span[0], y, span[1], y);
  }

  g.lineStyle(PANEL.edgeWidth, COLORS.panelEdge);
  g.strokePoints(toVectors(shape), true, true);

  const { length } = accent;
  const thick = PANEL.accentWidth;
  g.fillStyle(COLORS.panelAccent);
  if (accent.side === 'top') g.fillRect(accent.fromEnd ? right - length : left, top, length, thick);
  else g.fillRect(accent.side === 'left' ? left : right - thick, accent.fromEnd ? bottom - length : top, thick, length);
}
