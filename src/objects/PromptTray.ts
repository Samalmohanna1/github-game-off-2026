import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, STAGE_BOTTOM_Y, TRAY_EDGE_WIDTH, TRAY_HEIGHT } from '@/config';

export class PromptTray extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    this.fillStyle(COLORS.tray);
    this.fillRect(0, STAGE_BOTTOM_Y, GAME_WIDTH, TRAY_HEIGHT);
    this.lineStyle(TRAY_EDGE_WIDTH, COLORS.trayEdge);
    this.lineBetween(0, STAGE_BOTTOM_Y, GAME_WIDTH, STAGE_BOTTOM_Y);
  }
}
