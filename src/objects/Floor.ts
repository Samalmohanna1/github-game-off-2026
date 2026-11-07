import Phaser from 'phaser';
import { COLORS, FLOOR_LINE_WIDTH, WALL_START_SCALE } from '@/config';
import { STAGE_FRONT_SCALE, floorEdge, project } from '@/logic/perspective';

export class Floor extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    this.lineStyle(FLOOR_LINE_WIDTH, COLORS.floorLine);
    for (const side of [-1, 1] as const) {
      const near = project(floorEdge(side), STAGE_FRONT_SCALE);
      const far = project(floorEdge(side), WALL_START_SCALE);
      this.lineBetween(near.x, near.y, far.x, far.y);
    }
  }
}
