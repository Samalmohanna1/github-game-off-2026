import Phaser from 'phaser';
import { COLORS, SPLASH } from '@/config';

const DROP_TEXTURE = 'splash-drop';

// One round drop at the column's size; the spray scales it down.
function dropTexture(scene: Phaser.Scene): string {
  if (!scene.textures.exists(DROP_TEXTURE)) {
    const r = SPLASH.column.radius;
    const g = scene.make.graphics({}, false);
    g.fillStyle(COLORS.splash).fillCircle(r, r, r);
    g.generateTexture(DROP_TEXTURE, r * 2, r * 2);
    g.destroy();
  }
  return DROP_TEXTURE;
}

type Burst = (typeof SPLASH)['column' | 'spray'];

function burst(scene: Phaser.Scene, x: number, y: number, depth: number, drops: Burst): void {
  const size = drops.radius / SPLASH.column.radius;
  const emitter = scene.add
    .particles(x, y, dropTexture(scene), {
      speed: { min: drops.speed[0], max: drops.speed[1] },
      angle: { min: drops.angle[0], max: drops.angle[1] },
      gravityY: SPLASH.gravity,
      lifespan: SPLASH.lifespan,
      scale: { start: size, end: size * SPLASH.endScale },
      emitting: false,
    })
    .setDepth(depth);
  emitter.explode(drops.drops);
  scene.time.delayedCall(SPLASH.lifespan, () => emitter.destroy());
}

// The fail splash (PLAN.md §7, M8): a column of big drops and a wide spray of
// small ones fly up from the water and fall back, and a ripple spreads out.
export function playSplash(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  burst(scene, x, y, depth, SPLASH.spray);
  burst(scene, x, y, depth, SPLASH.column);

  const { width, height, lineWidth, ms } = SPLASH.ripple;
  const ripple = scene.add.graphics({ x, y }).setDepth(depth);
  ripple.lineStyle(lineWidth, COLORS.splashRipple).strokeEllipse(0, 0, width, height);
  ripple.setScale(0.2);
  scene.tweens.add({
    targets: ripple,
    scale: 1,
    alpha: 0,
    duration: ms,
    ease: 'Quad.easeOut',
    onComplete: () => ripple.destroy(),
  });
}
