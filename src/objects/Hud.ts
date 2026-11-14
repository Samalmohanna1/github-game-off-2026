import Phaser from 'phaser';
import { GAME_WIDTH, HUD } from '@/config';
import { chamferedRect } from '@/logic/convex';
import { drawPanel } from '@/objects/panel';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

type Side = 'left' | 'right';

// One corner's readout: a caption in IBM Plex Mono over a big number in
// Anton, on an angular panel whose inner bottom corner is cut. The panel grows
// inward with its number. A new number counts up (if asked to) and pops.
class Readout {
  private readonly panel: Phaser.GameObjects.Graphics;
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
    this.panel = new Phaser.GameObjects.Graphics(scene);
    this.caption = new Phaser.GameObjects.Text(scene, 0, HUD.top + HUD.labelY, caption, textStyle('hudLabel', 'label'));
    this.value = new Phaser.GameObjects.Text(scene, 0, HUD.top + HUD.valueY, format(0), textStyle('hud', 'light'));
    this.caption.setOrigin(align, 0);
    this.value.setOrigin(align, 0);
    hud.add([this.panel, this.caption, this.value]);
    this.layOut();
  }

  set(target: number): void {
    if (target === this.target) return;
    const from = this.target;
    this.target = target;
    this.value.setText(format(target));
    this.layOut();

    this.counter?.stop();
    if (this.countUp) {
      this.value.setText(format(from));
      this.counter = this.scene.tweens.addCounter({
        from,
        to: target,
        duration: HUD.countMs,
        ease: 'Quad.easeOut',
        onUpdate: (tween) => this.value.setText(format(Math.round(tween.getValue() ?? target))),
      });
    }
    if (prefersReducedMotion()) return;
    this.scene.tweens.killTweensOf(this.value);
    this.value.setScale(HUD.popScale);
    this.scene.tweens.add({ targets: this.value, scale: 1, duration: HUD.popMs, ease: 'Back.easeOut' });
  }

  // Sized for the number it's heading to, so it doesn't jitter as it counts.
  private layOut(): void {
    const content = Math.max(this.value.width, this.caption.width);
    const width = Math.max(HUD.minWidth, content + 2 * HUD.padX);
    const x = this.side === 'left' ? HUD.marginX : GAME_WIDTH - HUD.marginX - width;
    const cuts = this.side === 'left' ? { bottomRight: HUD.cut } : { bottomLeft: HUD.cut };
    this.panel.clear();
    const accent = { side: this.side, fromEnd: false, length: HUD.accentLength };
    drawPanel(this.panel, chamferedRect(x, HUD.top, width, HUD.height, cuts), accent);
    const textX = this.side === 'left' ? x + HUD.padX : x + width - HUD.padX;
    this.caption.setX(textX);
    this.value.setX(textX);
  }
}

function format(n: number): string {
  return n.toLocaleString('en-US');
}

// SCORE top-left and WALL top-right (M10b): angular near-black panels with a
// lime accent and a fine inner grid, in the void above the horizon, where
// nothing that moves ever reaches.
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
