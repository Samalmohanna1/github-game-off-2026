import Phaser from 'phaser';
import sleepysamUrl from '@/assets/sleepysam.png';
import { COLORS, GAME_WIDTH, SPLASH } from '@/config';
import { SceneKeys } from '@/scenes/scene-keys';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { onWindowKeys, prefersReducedMotion, rgb } from '@/scenes/ui';

const SLEEPYSAM = 'sleepysam';

// The studio's card before the title, at the user's request: Sleepy Sam,
// lying on his side in the middle of a charcoal screen, floats gently up
// and down (still for reduced motion), and A SLEEPYSAM GAME fades in below
// him. After SPLASH.leaveMs, or at once on a click or a key, it dissolves
// through the void's color into the title.
export class SplashScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super(SceneKeys.Splash);
  }

  preload(): void {
    this.load.image(SLEEPYSAM, sleepysamUrl);
  }

  create(): void {
    this.leaving = false;
    this.cameras.main.setBackgroundColor(COLORS.splash);
    const { imageY, imageScale, angleDeg, floatPx, floatMs, imageFadeMs, textY, textDelayMs, textFadeMs, leaveMs } = SPLASH;

    const sam = this.add.image(GAME_WIDTH / 2, imageY, SLEEPYSAM).setScale(imageScale).setAngle(angleDeg).setAlpha(0);
    this.tweens.add({ targets: sam, alpha: 1, duration: imageFadeMs });
    if (!prefersReducedMotion()) {
      sam.setY(imageY - floatPx);
      this.tweens.add({ targets: sam, y: imageY + floatPx, duration: floatMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }

    const words = centerGlyphs(this.add.text(GAME_WIDTH / 2, textY, 'A SLEEPYSAM GAME', textStyle('subheading', 'light')).setOrigin(0.5));
    words.setAlpha(0);
    this.tweens.add({ targets: words, alpha: 1, delay: textDelayMs, duration: textFadeMs });

    this.time.delayedCall(leaveMs, () => this.leave());
    this.input.once('pointerdown', () => this.leave());
    onWindowKeys(this, {
      down: (event) => {
        if (!event.repeat) this.leave();
      },
      up: () => {},
      blur: () => {},
    });
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    const camera = this.cameras.main;
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SceneKeys.Title));
    camera.fadeOut(SPLASH.fadeMs, ...rgb(COLORS.void));
  }
}
