import Phaser from 'phaser';
import { COLORS, SPLASH } from '@/config';

// Week 1 placeholder for the pool splash (PLAN.md §7): blue squares fly up
// and fall back. Week 2 replaces it with water particles.
export function playSplash(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  for (let i = 0; i < SPLASH.drops; i++) {
    const drop = scene.add.rectangle(x, y, SPLASH.dropSize, SPLASH.dropSize, COLORS.splash).setDepth(depth);
    scene.tweens.add({
      targets: drop,
      x: x + Phaser.Math.FloatBetween(-SPLASH.spread / 2, SPLASH.spread / 2),
      duration: SPLASH.ms * 2,
    });
    scene.tweens.add({
      targets: drop,
      y: y - Phaser.Math.FloatBetween(SPLASH.minHeight, SPLASH.maxHeight),
      duration: SPLASH.ms,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => drop.destroy(),
    });
  }
}
