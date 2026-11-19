import Phaser from 'phaser';
import { BADGE, COLORS, GAME_WIDTH, LABEL_POP_FROM, LABEL_POP_MS, READY_COUNT } from '@/config';
import { READY_LABELS, readyStep } from '@/logic/ready-count';
import { drawBadge } from '@/objects/badge';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// The count into the first wall after the tutorial (READY_COUNT): READY?,
// then 3, 2, 1, each popping in on a lime badge where the first wall will
// appear, like the timing label's. onStep runs as each label shows (its
// index in READY_LABELS), and onDone once the count is over.
export class ReadyCount extends Phaser.GameObjects.Container {
  private readonly badge: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private elapsed = 0;
  private shown = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly onStep: (step: number) => void,
    private readonly onDone: () => void,
  ) {
    super(scene, GAME_WIDTH / 2, READY_COUNT.y);
    scene.add.existing(this);
    this.badge = new Phaser.GameObjects.Graphics(scene);
    this.label = new Phaser.GameObjects.Text(scene, 0, 0, '', textStyle('heading', 'ink')).setOrigin(0.5);
    this.add([this.badge, this.label]);
    this.advance(0);
  }

  advance(deltaMs: number): void {
    this.elapsed += deltaMs;
    const step = readyStep(this.elapsed);
    if (step === this.shown) return;
    this.shown = step;
    const text = READY_LABELS[step];
    if (text === undefined) {
      this.setVisible(false);
      this.onDone();
      return;
    }
    this.showLabel(text);
    this.onStep(step);
  }

  private showLabel(text: string): void {
    centerGlyphs(this.label.setText(text));
    this.badge.clear();
    drawBadge(this.badge, {
      x: 0,
      y: 0,
      width: this.label.width + 2 * BADGE.padX + BADGE.slant,
      height: BADGE.height,
      fill: COLORS.readyBadge,
    });
    this.setScale(1);
    if (prefersReducedMotion()) return;
    this.setScale(LABEL_POP_FROM);
    this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
  }
}
