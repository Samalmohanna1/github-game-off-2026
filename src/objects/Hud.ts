import Phaser from 'phaser';
import { GAME_WIDTH, HUD } from '@/config';
import { textStyle } from '@/scenes/text-styles';

// SCORE top-left and WALL top-right (M10), in Anton, on the collage's pale
// sheets in the top corners. Nothing that moves ever reaches the corners.
export class Hud extends Phaser.GameObjects.Container {
  private readonly score: Phaser.GameObjects.Text;
  private readonly wall: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.score = this.addReadout(HUD.marginX, 0, 'SCORE');
    this.wall = this.addReadout(GAME_WIDTH - HUD.marginX, 1, 'WALL');
  }

  setScore(score: number): void {
    this.score.setText(score.toLocaleString('en-US'));
  }

  setWall(wall: number): void {
    this.wall.setText(String(wall));
  }

  // align 0 hangs the readout right of x, 1 left of it.
  private addReadout(x: number, align: 0 | 1, label: string): Phaser.GameObjects.Text {
    const caption = new Phaser.GameObjects.Text(this.scene, x, HUD.labelY, label, textStyle('hudLabel', 'ink'));
    const value = new Phaser.GameObjects.Text(this.scene, x, HUD.valueY, '0', textStyle('hud', 'ink'));
    this.add([caption.setOrigin(align, 0), value.setOrigin(align, 0)]);
    return value;
  }
}
