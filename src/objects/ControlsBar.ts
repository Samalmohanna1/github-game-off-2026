import Phaser from 'phaser';
import { CHIP_FONT_FAMILY, COLORS, CONTROLS, GAME_WIDTH } from '@/config';
import { BAR_ROW_Y, drawBar, keyCapShape } from '@/objects/PromptTray';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';

export interface ControlGroup {
  readonly keys: readonly string[];
  readonly caption: string;
}

// The title's controls (M11), in the bar where the letters come up in play:
// each group's keys as cream key caps, like the prompt's, then its caption in
// cream, the groups in one row across the middle of the bar.
export class ControlsBar extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, groups: readonly ControlGroup[]) {
    super(scene);
    scene.add.existing(this);
    const bar = new Phaser.GameObjects.Graphics(scene);
    drawBar(bar, false);
    const caps = new Phaser.GameObjects.Graphics(scene);
    this.add([bar, caps]);

    const keyStyle = { ...textStyle('small', 'ink', true), fontFamily: CHIP_FONT_FAMILY };
    const rows = groups.map((group) => ({
      keys: group.keys.map((key) => new Phaser.GameObjects.Text(scene, 0, BAR_ROW_Y, key, keyStyle).setOrigin(0.5)),
      caption: new Phaser.GameObjects.Text(scene, 0, BAR_ROW_Y, group.caption, textStyle('small', 'light')).setOrigin(0, 0.5),
    }));
    const capWidth = (key: Phaser.GameObjects.Text) => Math.max(CONTROLS.capHeight, key.width + 2 * CONTROLS.padX);
    const rowWidth = (row: (typeof rows)[number]) =>
      row.keys.reduce((sum, key) => sum + capWidth(key) + CONTROLS.capGap, 0) - CONTROLS.capGap + CONTROLS.captionGap + row.caption.width;
    const total = rows.reduce((sum, row) => sum + rowWidth(row), 0) + (rows.length - 1) * CONTROLS.groupGap;

    let x = (GAME_WIDTH - total) / 2;
    caps.fillStyle(COLORS.chipCurrent);
    for (const row of rows) {
      for (const key of row.keys) {
        const width = capWidth(key);
        const middle = x + width / 2;
        caps.fillPoints(toVectors(keyCapShape(width, CONTROLS.capHeight).map((p) => ({ x: p.x + middle, y: p.y + BAR_ROW_Y }))), true);
        key.setX(middle);
        x += width + CONTROLS.capGap;
      }
      x += CONTROLS.captionGap - CONTROLS.capGap;
      row.caption.setX(x);
      x += row.caption.width + CONTROLS.groupGap;
      this.add([...row.keys, row.caption]);
    }
  }
}
