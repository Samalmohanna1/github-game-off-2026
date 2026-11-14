import Phaser from 'phaser';
import { COLORS, FLOOR, FLOOR_LINE_WIDTH, LANE_COUNT, WALL_START_SCALE } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { STAGE_FRONT_SCALE, crossSeamScales, floorEdge, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

// The runway (M10b): a clean, plain cream plane in the grid void, with thin
// cream-gray seams along the lanes and across, and a thin charcoal outline.
// The cross seams put the figure in the middle of a row of tiles. Drawn once.
export class Floor extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const span = (p: Point): Point[] => [project(p, WALL_START_SCALE), project(p, STAGE_FRONT_SCALE)];
    const [farLeft, nearLeft] = span(floorEdge(-1));
    const [farRight, nearRight] = span(floorEdge(1));

    this.fillStyle(COLORS.floor);
    this.fillPoints(toVectors([farLeft!, farRight!, nearRight!, nearLeft!]), true);

    this.lineStyle(FLOOR.seamWidth, COLORS.floorSeam);
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const [far, near] = span({ x: laneLeftX(lane), y: floorEdge(1).y });
      this.lineBetween(far!.x, far!.y, near!.x, near!.y);
    }
    for (const scale of crossSeamScales()) {
      const left = project(floorEdge(-1), scale);
      const right = project(floorEdge(1), scale);
      this.lineBetween(left.x, left.y, right.x, right.y);
    }

    this.lineStyle(FLOOR_LINE_WIDTH, COLORS.floorLine);
    this.strokePoints(toVectors([nearLeft!, farLeft!, farRight!, nearRight!]));
  }
}
