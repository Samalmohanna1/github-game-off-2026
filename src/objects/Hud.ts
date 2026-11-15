import Phaser from 'phaser';
import { GAME_WIDTH, HUD } from '@/config';
import { cardSlant, drawCard } from '@/objects/card';
import { textStyle } from '@/scenes/text-styles';
import { formatNumber, prefersReducedMotion } from '@/scenes/ui';

type Side = 'left' | 'right';

// One corner's readout, after the mockup: a cream card, its outer corners cut
// and its inner edge slanting toward the middle of the screen, with a sage
// fold in that corner and lime slashes beside it. A caption in IBM Plex Mono
// over a big number in Anton, both dark. The card grows inward with its
// number. A new number counts up (if asked to) and pops.
class Readout {
  private readonly card: Phaser.GameObjects.Graphics;
  private readonly caption: Phaser.GameObjects.Text;
  private readonly value: Phaser.GameObjects.Text;
  private target = 0;
  private counter?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    hud: Phaser.GameObjects.Container,
    private readonly side: Side,
    caption: string,
    private readonly countUp: boolean,
  ) {
    const align = side === 'left' ? 0 : 1;
    this.card = new Phaser.GameObjects.Graphics(scene);
    this.caption = new Phaser.GameObjects.Text(scene, 0, HUD.top + HUD.labelY, caption, textStyle('hudLabel', 'ink', true));
    this.value = new Phaser.GameObjects.Text(scene, 0, HUD.top + HUD.valueY, formatNumber(0), textStyle('hud', 'ink'));
    this.caption.setOrigin(align, 0);
    this.value.setOrigin(align, 0);
    hud.add([this.card, this.caption, this.value]);
    this.layOut();
  }

  set(target: number): void {
    if (target === this.target) return;
    const from = this.target;
    this.target = target;
    this.value.setText(formatNumber(target));
    this.layOut();

    this.counter?.stop();
    if (this.countUp) {
      this.value.setText(formatNumber(from));
      this.counter = this.scene.tweens.addCounter({
        from,
        to: target,
        duration: HUD.countMs,
        ease: 'Quad.easeOut',
        onUpdate: (tween) => this.value.setText(formatNumber(Math.round(tween.getValue() ?? target))),
      });
    }
    if (prefersReducedMotion()) return;
    this.scene.tweens.killTweensOf(this.value);
    this.value.setScale(HUD.popScale);
    this.scene.tweens.add({ targets: this.value, scale: 1, duration: HUD.popMs, ease: 'Back.easeOut' });
  }

  // Sized for the number it's heading to, so it doesn't jitter as it counts.
  // The slanted side faces the middle of the screen.
  private layOut(): void {
    const { marginX, top, height } = HUD;
    const content = Math.max(this.value.width, this.caption.width);
    const width = Math.max(HUD.minWidth, content + 2 * HUD.padX + cardSlant(height));
    const left = this.side === 'left';
    this.card.clear();
    drawCard(this.card, {
      x: left ? marginX : GAME_WIDTH - marginX - width,
      y: top,
      width,
      height,
      slant: left ? 'right' : 'left',
    });

    const textX = left ? marginX + HUD.padX : GAME_WIDTH - marginX - HUD.padX;
    this.caption.setX(textX);
    this.value.setX(textX);
  }
}

// SCORE top-left and WALL top-right (M10b, after the mockup): cream cards
// with lime slashes, in the dark above the play area, where nothing that
// moves ever reaches.
export class Hud extends Phaser.GameObjects.Container {
  private readonly score: Readout;
  private readonly wall: Readout;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.score = new Readout(scene, this, 'left', 'SCORE', true);
    this.wall = new Readout(scene, this, 'right', 'WALL', false);
  }

  setScore(score: number): void {
    this.score.set(score);
  }

  setWall(wall: number): void {
    this.wall.set(wall);
  }
}
