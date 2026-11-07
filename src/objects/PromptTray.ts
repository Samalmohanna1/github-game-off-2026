import Phaser from 'phaser';
import { CHIP, CHIP_FONT_FAMILY, COLORS, GAME_WIDTH, STAGE_BOTTOM_Y, TRAY_EDGE_WIDTH, TRAY_HEIGHT } from '@/config';
import type { SequenceView } from '@/logic/sequence';
import { textStyle } from '@/scenes/text-styles';

const MID_Y = STAGE_BOTTOM_Y + TRAY_HEIGHT / 2;
const STEP = CHIP.size + CHIP.gap;
const FIRST_HELD_X = CHIP.edgeInset + CHIP.size / 2;
const FIRST_SLIPPED_X = GAME_WIDTH / 2 + CHIP.currentSize / 2 + 2 * CHIP.gap + CHIP.size / 2;

const CHIP_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  ...textStyle('chip', 'onChip', true),
  fontFamily: CHIP_FONT_FAMILY,
};

// Letters keep their case: uppercase means "hold Shift" (AGENTS.md).
export class PromptTray extends Phaser.GameObjects.Container {
  private readonly chips: Phaser.GameObjects.Graphics;
  private letters: Phaser.GameObjects.Text[] = [];
  private shown = '';

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const background = new Phaser.GameObjects.Graphics(scene);
    background.fillStyle(COLORS.tray);
    background.fillRect(0, STAGE_BOTTOM_Y, GAME_WIDTH, TRAY_HEIGHT);
    background.lineStyle(TRAY_EDGE_WIDTH, COLORS.trayEdge);
    background.lineBetween(0, STAGE_BOTTOM_Y, GAME_WIDTH, STAGE_BOTTOM_Y);

    this.chips = new Phaser.GameObjects.Graphics(scene);
    this.add([background, this.chips]);
  }

  show(view: SequenceView): void {
    const key = JSON.stringify(view);
    if (key === this.shown) return;
    this.shown = key;

    this.chips.clear();
    for (const letter of this.letters) letter.destroy();
    this.letters = [];

    view.held.forEach((letter, i) => this.addChip(letter, FIRST_HELD_X + i * STEP, CHIP.size, COLORS.chipHeld));
    if (view.current !== null) this.addChip(view.current, GAME_WIDTH / 2, CHIP.currentSize, COLORS.chipCurrent);
    view.slipped.forEach((letter, i) => this.addChip(letter, FIRST_SLIPPED_X + i * STEP, CHIP.size, COLORS.chipSlipped));
  }

  private addChip(letter: string, x: number, size: number, color: number): void {
    this.chips.fillStyle(color);
    this.chips.fillRoundedRect(x - size / 2, MID_Y - size / 2, size, size, CHIP.radius);
    const text = new Phaser.GameObjects.Text(this.scene, x, MID_Y, letter, CHIP_TEXT_STYLE).setOrigin(0.5);
    this.add(text);
    this.letters.push(text);
  }
}
