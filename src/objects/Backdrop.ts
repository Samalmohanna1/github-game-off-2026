import Phaser from 'phaser';
import { BACKDROP, COLORS, OUTLINE_WIDTH } from '@/config';
import { prefersReducedMotion } from '@/scenes/ui';

// The backdrop (M10): one pale disc behind the far end of the stage, framing
// where every wall comes from like a stage light. The floor hides its lower
// half. It breathes and drifts very slowly, and stays still for reduced
// motion.
export class Backdrop extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(BACKDROP.x, BACKDROP.y);
    this.fillStyle(COLORS.backdropDisc);
    this.fillCircle(0, 0, BACKDROP.r);
    this.lineStyle(OUTLINE_WIDTH, COLORS.outline);
    this.strokeCircle(0, 0, BACKDROP.r);

    if (prefersReducedMotion()) return;
    const drift = { duration: 0, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 };
    scene.tweens.add({ ...drift, targets: this, scale: BACKDROP.breatheScale, duration: BACKDROP.breatheMs });
    scene.tweens.add({ ...drift, targets: this, x: BACKDROP.x + BACKDROP.driftX, duration: BACKDROP.driftMs });
  }
}
