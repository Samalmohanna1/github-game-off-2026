import Phaser from 'phaser';
import { CHIP, COLORS, GAME_WIDTH, MUTE_TOGGLE } from '@/config';
import { keyCapShape } from '@/objects/keycap';
import { drawFocusRing, type Focusable } from '@/objects/MenuFocus';
import { toVectors } from '@/objects/vectors';
import { prefersReducedMotion } from '@/scenes/ui';

// The speaker, in fractions of a slot's size about its middle: a box and its
// cone, then either two sound waves or an X.
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

// The speaker at (x, 0), `slot` px across: crossed out when `muted`, else
// giving off waves.
function drawSpeaker(g: Phaser.GameObjects.Graphics, x: number, slot: number, muted: boolean, color: number): void {
  g.fillStyle(color);
  g.fillPoints(toVectors(SPEAKER.map(([u, v]) => ({ x: x + u * slot, y: v * slot }))), true);
  g.lineStyle(MUTE_TOGGLE.iconLineWidth, color);
  if (muted) {
    const { left, right, half } = CROSS;
    g.lineBetween(x + left * slot, -half * slot, x + right * slot, half * slot);
    g.lineBetween(x + left * slot, half * slot, x + right * slot, -half * slot);
    return;
  }
  const mouth = x + (SPEAKER[2]?.[0] ?? 0) * slot;
  for (const radius of WAVES) {
    g.beginPath();
    g.arc(mouth, 0, radius * slot, -WAVE_HALF_ANGLE, WAVE_HALF_ANGLE);
    g.strokePath();
  }
}

// The title's sound switch, in the top-right corner, showing both of its
// options (a review asked for that): a dark key cap track in a cream edge
// with two slots, muted on the left (a speaker crossed out) and sound on the
// right (a speaker giving off waves). The option in force is lit: a cream
// knob over its slot, its speaker dark; the other is only its speaker, in
// faded white on the track. A click, or Space or Enter with the focus on it
// (MenuFocus), slides the knob to the other slot (no slide for reduced
// motion) and toggles Phaser's mute, which every sound and the music go
// through, for the rest of the visit. (Before: a single knob on a track that
// turned lime, and before that a key labeled SOUND ON / OFF.)
export class MuteToggle extends Phaser.GameObjects.Container implements Focusable {
  private readonly knob: Phaser.GameObjects.Container;
  private readonly knobIcon: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  // Kept here, not read back from Phaser: its mute is a gain change that
  // the audio thread applies a moment later, so reading it right after a
  // click gave the old state and showed the switch a click behind the sound.
  private muted: boolean;

  constructor(scene: Phaser.Scene) {
    const { width, height, marginX, top, knob, edgeWidth } = MUTE_TOGGLE;
    super(scene, GAME_WIDTH - marginX - width / 2, top + height / 2);
    scene.add.existing(this);
    this.muted = scene.sound.mute;

    const track = new Phaser.GameObjects.Graphics(scene);
    const shape = toVectors(keyCapShape(width, height));
    track.fillStyle(COLORS.muteTrack);
    track.fillPoints(shape, true);
    track.lineStyle(edgeWidth, COLORS.muteTrackEdge);
    track.strokePoints(shape, true, true);
    // Both options, faded; the knob covers the one in force.
    drawSpeaker(track, slotX(true), knob, true, COLORS.muteIconFaded);
    drawSpeaker(track, slotX(false), knob, false, COLORS.muteIconFaded);

    const knobShape = new Phaser.GameObjects.Graphics(scene);
    knobShape.fillStyle(COLORS.muteKnob);
    knobShape.fillPoints(toVectors(keyCapShape(knob, knob)), true);
    this.knobIcon = new Phaser.GameObjects.Graphics(scene);
    this.knob = new Phaser.GameObjects.Container(scene, slotX(this.muted), 0, [knobShape, this.knobIcon]);
    this.ring = new Phaser.GameObjects.Graphics(scene).setVisible(false);
    drawFocusRing(this.ring, width, height, CHIP.cut, edgeWidth);
    this.add([this.ring, track, this.knob]);
    this.drawKnobIcon();

    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.press());
  }

  setFocusRing(on: boolean): void {
    this.ring.setVisible(on);
  }

  // Flips the sound on or off.
  press(): void {
    this.muted = !this.muted;
    this.scene.sound.mute = this.muted;
    this.drawKnobIcon();
    const x = slotX(this.muted);
    this.scene.tweens.killTweensOf(this.knob);
    if (prefersReducedMotion()) this.knob.setX(x);
    else this.scene.tweens.add({ targets: this.knob, x, duration: MUTE_TOGGLE.slideMs, ease: 'Quad.easeOut' });
  }

  private drawKnobIcon(): void {
    this.knobIcon.clear();
    drawSpeaker(this.knobIcon, 0, MUTE_TOGGLE.knob, this.muted, COLORS.muteIcon);
  }
}

// A slot's middle: muted on the left, sound on the right.
function slotX(muted: boolean): number {
  const { width, knob, knobInset } = MUTE_TOGGLE;
  const reach = width / 2 - knobInset - knob / 2;
  return muted ? -reach : reach;
}
