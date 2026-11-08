import Phaser from 'phaser';
import { COLORS, DEBUG_FONT_FAMILY, DEBUG_OVERLAY } from '@/config';
import { textStyle, toCss } from '@/scenes/text-styles';

export type DebugRow = readonly [label: string, value: string];

// PLAN.md §8, toggled with F2. The text sits on its own opaque panel so it
// reads over anything (AGENTS.md contrast rules).
export class DebugOverlay extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene) {
    super(scene, DEBUG_OVERLAY.x, DEBUG_OVERLAY.y, '', {
      ...textStyle('small', 'ink'),
      fontFamily: DEBUG_FONT_FAMILY,
      align: 'left',
      backgroundColor: toCss(COLORS.panel),
      padding: { x: DEBUG_OVERLAY.padding, y: DEBUG_OVERLAY.padding },
    });
    scene.add.existing(this);
  }

  show(rows: readonly DebugRow[]): void {
    const width = Math.max(...rows.map(([label]) => label.length));
    this.setText(rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`));
  }
}
