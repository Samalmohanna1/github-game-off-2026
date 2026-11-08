import Phaser from 'phaser';
import { COLORS, FLOOR, FLOOR_LINE_WIDTH, LANE_COUNT, WALL_START_SCALE } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, STAGE_FRONT_SCALE, floorEdge, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/paper';

// The cream floor of the design mocks (M10): green verges beyond its edges,
// gray tile seams along the lanes and across, and the dark green edge lines
// that frame the stage. Drawn once.
export class Floor extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const span = (p: Point): Point[] => [project(p, WALL_START_SCALE), project(p, STAGE_FRONT_SCALE)];
    const strip = (inner: Point, outer: Point) => toVectors([...span(inner), ...span(outer).reverse()]);
    const outward = (side: -1 | 1, share: number): Point => ({
      x: floorEdge(side).x + side * share * FLOOR.vergeWidth * FLOOR_HALF_WIDTH,
      y: floorEdge(side).y,
    });

    for (const side of [-1, 1] as const) {
      this.fillStyle(COLORS.verge);
      this.fillPoints(strip(floorEdge(side), outward(side, 1)), true);
      this.fillStyle(COLORS.vergeOuter);
      this.fillPoints(strip(outward(side, 1 - FLOOR.vergeOuterShare), outward(side, 1)), true);
    }

    this.lineStyle(FLOOR.seamWidth, COLORS.floorSeam);
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const [far, near] = span({ x: laneLeftX(lane), y: floorEdge(1).y });
      this.lineBetween(far!.x, far!.y, near!.x, near!.y);
    }
    // Evenly spaced in 1/scale, which is even in depth.
    for (let depth = 1 / WALL_START_SCALE - FLOOR.tileDepth; depth > 1 / STAGE_FRONT_SCALE; depth -= FLOOR.tileDepth) {
      const left = project(floorEdge(-1), 1 / depth);
      const right = project(floorEdge(1), 1 / depth);
      this.lineBetween(left.x, left.y, right.x, right.y);
    }

    this.lineStyle(FLOOR_LINE_WIDTH, COLORS.floorLine);
    for (const side of [-1, 1] as const) {
      const [far, near] = span(floorEdge(side));
      this.lineBetween(far!.x, far!.y, near!.x, near!.y);
    }
    const [farLeft] = span(floorEdge(-1));
    const [farRight] = span(floorEdge(1));
    this.lineBetween(farLeft!.x, farLeft!.y, farRight!.x, farRight!.y);
  }
}
