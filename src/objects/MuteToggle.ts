import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, MUTE_TOGGLE } from '@/config';
import { keyCapShape } from '@/objects/keycap';
import { toVectors } from '@/objects/vectors';
import { prefersReducedMotion } from '@/scenes/ui';

// The speaker, in fractions of the knob's size about its middle: a box and
// its cone, then either two sound waves or an X.
const SPEAKER: readonly [number, number][] = [
  [-0.3, -0.11],
  [-0.14, -0.11],
  [0.04, -0.27],
  [0.04, 0.27],
  [-0.14, 0.11],
  [-0.3, 0.11],
];
const WAVES = [0.14, 0.25]; // radii, from the cone's mouth
const WAVE_HALF_ANGLE = Math.PI / 4;
const CROSS = { left: 0.14, right: 0.32, half: 0.09 };

// The title's sound switch, in the top-right corner (a review asked for a
// toggle, and for no words): a key cap track with a cream knob on it,
// carrying a speaker. With sound, the track is lime and the knob sits at
// its right, the speaker giving off waves; muted, the track is dark in a
// cream edge and the knob sits at its left, the speaker crossed out. So
// color, place and icon all say which. A click slides the knob (no slide
// for reduced motion) and toggles Phaser's mute, which every sound and the
// music go through, for the rest of the visit.
export class MuteToggle extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Container;
  private readonly icon: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const { width, height, marginX, top, knob, knobEdgeWidth } = MUTE_TOGGLE;
    super(scene, GAME_WIDTH - marginX - width / 2, top + height / 2);
    scene.add.existing(this);
    this.track = new Phaser.GameObjects.Graphics(scene);
    const knobShape = new Phaser.GameObjects.Graphics(scene);
    knobShape.fillStyle(COLORS.muteKnobEdge);
    knobShape.fillPoints(toVectors(keyCapShape(knob, knob, knobEdgeWidth)), true);
    knobShape.fillStyle(COLORS.muteKnob);
    knobShape.fillPoints(toVectors(keyCapShape(knob, knob)), true);
    this.icon = new Phaser.GameObjects.Graphics(scene);
    this.knob = new Phaser.GameObjects.Container(scene, this.knobX(), 0, [knobShape, this.icon]);
    this.add([this.track, this.knob]);
    this.draw();

    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      scene.sound.mute = !scene.sound.mute;
      this.draw();
      scene.tweens.killTweensOf(this.knob);
      if (prefersReducedMotion()) this.knob.setX(this.knobX());
      else scene.tweens.add({ targets: this.knob, x: this.knobX(), duration: MUTE_TOGGLE.slideMs, ease: 'Quad.easeOut' });
    });
  }

  // The knob's middle: at the track's right end with sound, its left muted.
  private knobX(): number {
    const { width, knob, knobInset } = MUTE_TOGGLE;
    const reach = width / 2 - knobInset - knob / 2;
    return this.scene.sound.mute ? -reach : reach;
  }

  private draw(): void {
    const { width, height, knob, iconLineWidth, edgeWidth } = MUTE_TOGGLE;
    const muted = this.scene.sound.mute;
    const shape = toVectors(keyCapShape(width, height));
    this.track.clear();
    this.track.fillStyle(muted ? COLORS.muteOff : COLORS.muteOn);
    this.track.fillPoints(shape, true);
    if (muted) {
      this.track.lineStyle(edgeWidth, COLORS.muteOffEdge);
      this.track.strokePoints(shape, true, true);
    }

    const g = this.icon;
    g.clear();
    g.fillStyle(COLORS.muteIcon);
    g.fillPoints(toVectors(SPEAKER.map(([x, y]) => ({ x: x * knob, y: y * knob }))), true);
    g.lineStyle(iconLineWidth, COLORS.muteIcon);
    if (muted) {
      const { left, right, half } = CROSS;
      g.lineBetween(left * knob, -half * knob, right * knob, half * knob);
      g.lineBetween(left * knob, half * knob, right * knob, -half * knob);
      return;
    }
    const mouth = SPEAKER[2]?.[0] ?? 0;
    for (const radius of WAVES) {
      g.beginPath();
      g.arc(mouth * knob, 0, radius * knob, -WAVE_HALF_ANGLE, WAVE_HALF_ANGLE);
      g.strokePath();
    }
  }
}
