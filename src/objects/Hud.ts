import Phaser from 'phaser';
import { GAME_WIDTH, HUD } from '@/config';
import { drawTornCard } from '@/objects/paper';
import { textStyle } from '@/scenes/text-styles';

// SCORE top-left and WALL top-right (M10), each on a tilted paper card as in
// the design mocks. The cards are opaque, so the text never depends on the
// collage behind it.
export class Hud extends Phaser.GameObjects.Container {
  private readonly score: Phaser.GameObjects.Text;
  private readonly wall: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.score = this.addCard(HUD.margin + HUD.width / 2, -1, 'SCORE');
    this.wall = this.addCard(GAME_WIDTH - HUD.margin - HUD.width / 2, 1, 'WALL');
  }

  setScore(score: number): void {
    this.score.setText(score.toLocaleString('en-US'));
  }

  setWall(wall: number): void {
    this.wall.setText(String(wall));
  }

  private addCard(x: number, tilt: -1 | 1, label: string): Phaser.GameObjects.Text {
    const card = new Phaser.GameObjects.Container(this.scene, x, HUD.margin + HUD.height / 2).setAngle(tilt * HUD.tiltDeg);
    const paper = new Phaser.GameObjects.Graphics(this.scene);
    drawTornCard(paper, HUD.width, HUD.height, Math.random);
    const caption = new Phaser.GameObjects.Text(this.scene, 0, HUD.labelY, label, textStyle('small', 'muted', true));
    const value = new Phaser.GameObjects.Text(this.scene, 0, HUD.valueY, '0', textStyle('hud', 'ink'));
    card.add([paper, caption.setOrigin(0.5), value.setOrigin(0.5)]);
    this.add(card);
    return value;
  }
}
