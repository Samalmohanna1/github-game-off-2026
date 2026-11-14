import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, HUD, SLASH } from '@/config';
import type { Point } from '@/logic/perspective';
import { fillSlash } from '@/objects/slash';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

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
    this.value = new Phaser.GameObjects.Text(scene, 0, HUD.top + HUD.valueY, format(0), textStyle('hud', 'ink'));
    this.caption.setOrigin(align, 0);
    this.value.setOrigin(align, 0);
    hud.add([this.card, this.caption, this.value]);
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
  // Drawn as the left card, mirrored for the right one.
  private layOut(): void {
    const { marginX: x, top: y, height: h, cut, slant } = HUD;
    const content = Math.max(this.value.width, this.caption.width);
    const w = Math.max(HUD.minWidth, content + 2 * HUD.padX + slant);
    const flip = (p: Point): Point => (this.side === 'left' ? p : { x: GAME_WIDTH - p.x, y: p.y });
    // The slanted inner edge's x at height y.
    const edge = (at: number) => x + w - (slant * (at - y)) / h;

    const g = this.card;
    g.clear();
    g.fillStyle(COLORS.hudCard);
    g.fillPoints(
      toVectors(
        [
          { x: x + cut, y },
          { x: x + w, y },
          { x: x + w - slant, y: y + h },
          { x: x + cut, y: y + h },
          { x, y: y + h - cut },
          { x, y: y + cut },
        ].map(flip),
      ),
      true,
    );
    const foldTop = y + h * HUD.foldFrom;
    g.fillStyle(COLORS.hudFold, HUD.foldAlpha);
    g.fillPoints(
      toVectors(
        [
          { x: edge(foldTop) - HUD.foldWidth, y: foldTop },
          { x: edge(foldTop), y: foldTop },
          { x: edge(y + h), y: y + h },
          { x: edge(y + h) - HUD.foldWidth, y: y + h },
        ].map(flip),
      ),
      true,
    );

    const lean = this.side === 'left' ? slant : -slant;
    const slashAt = (offset: number, width: number) =>
      this.side === 'left' ? x + w + offset : GAME_WIDTH - (x + w + offset) - width;
    const slash = { y, height: h, lean, slices: HUD.slashSlices };
    fillSlash(g, { ...slash, x: slashAt(HUD.slashGap, SLASH.width), width: SLASH.width, top: COLORS.hudSlash, foot: COLORS.hudSlashEnd });
    const thin = SLASH.width / 3;
    const thinAt = slashAt(HUD.slashGap + SLASH.width + SLASH.gap, thin);
    fillSlash(g, { ...slash, x: thinAt, width: thin, top: COLORS.hudSlashEnd, foot: COLORS.void });

    const textX = this.side === 'left' ? x + HUD.padX : GAME_WIDTH - x - HUD.padX;
    this.caption.setX(textX);
    this.value.setX(textX);
  }
}

function format(n: number): string {
  return n.toLocaleString('en-US');
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
