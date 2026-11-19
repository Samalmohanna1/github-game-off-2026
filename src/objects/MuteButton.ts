import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, MUTE_BUTTON } from '@/config';
import { keyCapShape } from '@/objects/keycap';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';

// The speaker, in fractions of the key's size about its middle: a box and
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

const LABEL = { on: 'SOUND ON', off: 'SOUND OFF' } as const;

// The title's mute button (after the mock's asset sheet), in the top-right
// corner, its two states told apart by more than the icon (a review found
// them hard to tell apart): with sound, a bright cream key with a dark
// speaker and its waves, beside SOUND ON; muted, a dark key in a cream edge
// with a cream speaker and an X, beside SOUND OFF. A click on the key or its
// words toggles Phaser's mute, which every sound and the music go through,
// for the rest of the visit.
export class MuteButton extends Phaser.GameObjects.Container {
  private readonly key: Phaser.GameObjects.Graphics;
  private readonly icon: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const { size, marginX, top, labelGap } = MUTE_BUTTON;
    super(scene, GAME_WIDTH - marginX - size / 2, top + size / 2);
    scene.add.existing(this);
    this.key = new Phaser.GameObjects.Graphics(scene);
    this.icon = new Phaser.GameObjects.Graphics(scene);
    // Measured at its longer wording, so the hit area fits either.
    this.label = new Phaser.GameObjects.Text(scene, -size / 2 - labelGap, 0, LABEL.off, textStyle('small', 'light')).setOrigin(1, 0.5);
    const reach = size / 2 + labelGap + this.label.width;
    this.add([this.key, this.icon, this.label]);
    this.draw();

    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-reach, -size / 2, reach + size / 2, size),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      scene.sound.mute = !scene.sound.mute;
      this.draw();
    });
  }

  private draw(): void {
    const { size, iconLineWidth, edgeWidth } = MUTE_BUTTON;
    const muted = this.scene.sound.mute;
    const shape = toVectors(keyCapShape(size, size));
    this.key.clear();
    this.key.fillStyle(muted ? COLORS.mutedButton : COLORS.muteButton);
    this.key.fillPoints(shape, true);
    if (muted) {
      this.key.lineStyle(edgeWidth, COLORS.mutedEdge);
      this.key.strokePoints(shape, true, true);
    }
    this.label.setText(muted ? LABEL.off : LABEL.on);

    const ink = muted ? COLORS.mutedIcon : COLORS.muteIcon;
    const g = this.icon;
    g.clear();
    g.fillStyle(ink);
    g.fillPoints(toVectors(SPEAKER.map(([x, y]) => ({ x: x * size, y: y * size }))), true);
    g.lineStyle(iconLineWidth, ink);
    if (muted) {
      const { left, right, half } = CROSS;
      g.lineBetween(left * size, -half * size, right * size, half * size);
      g.lineBetween(left * size, half * size, right * size, -half * size);
      return;
    }
    const mouth = SPEAKER[2]?.[0] ?? 0;
    for (const radius of WAVES) {
      g.beginPath();
      g.arc(mouth * size, 0, radius * size, -WAVE_HALF_ANGLE, WAVE_HALF_ANGLE);
      g.strokePath();
    }
  }
}
