import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, MUTE_BUTTON } from '@/config';
import { keyCapShape } from '@/objects/keycap';
import { toVectors } from '@/objects/vectors';

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

// The title's mute button (after the mock's asset sheet): a cream key cap in
// the top-right corner with a dark speaker on it, sound waves while the
// game is heard and an X while it's muted. A click toggles Phaser's mute,
// which every sound and the music go through, for the rest of the visit.
export class MuteButton extends Phaser.GameObjects.Container {
  private readonly icon: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const { size, marginX, top } = MUTE_BUTTON;
    super(scene, GAME_WIDTH - marginX - size / 2, top + size / 2);
    scene.add.existing(this);
    const key = new Phaser.GameObjects.Graphics(scene);
    key.fillStyle(COLORS.muteButton);
    key.fillPoints(toVectors(keyCapShape(size, size)), true);
    this.icon = new Phaser.GameObjects.Graphics(scene);
    this.add([key, this.icon]);
    this.drawIcon();

    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      scene.sound.mute = !scene.sound.mute;
      this.drawIcon();
    });
  }

  private drawIcon(): void {
    const s = MUTE_BUTTON.size;
    const g = this.icon;
    g.clear();
    g.fillStyle(COLORS.muteIcon);
    g.fillPoints(toVectors(SPEAKER.map(([x, y]) => ({ x: x * s, y: y * s }))), true);
    g.lineStyle(MUTE_BUTTON.iconLineWidth, COLORS.muteIcon);
    if (this.scene.sound.mute) {
      const { left, right, half } = CROSS;
      g.lineBetween(left * s, -half * s, right * s, half * s);
      g.lineBetween(left * s, half * s, right * s, -half * s);
      return;
    }
    const mouth = SPEAKER[2]?.[0] ?? 0;
    for (const radius of WAVES) {
      g.beginPath();
      g.arc(mouth * s, 0, radius * s, -WAVE_HALF_ANGLE, WAVE_HALF_ANGLE);
      g.strokePath();
    }
  }
}
