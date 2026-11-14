import Phaser from 'phaser';
import { COLORS, FLOOR, LANE_COUNT, WALL_START_SCALE } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { STAGE_FRONT_SCALE, crossSeamScales, floorEdge, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

// The runway (M10b, after the mockup): a cream plane on the grid stage, its
// tile rows shading toward the deeper cream into the distance, with thin
// cream-gray seams along the lanes and across, and glowing lime lines down
// its sides. The cross seams put the figure in the middle of a row of tiles.
// Drawn once.
export class Floor extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const span = (p: Point): Point[] => [project(p, WALL_START_SCALE), project(p, STAGE_FRONT_SCALE)];
    const [farLeft, nearLeft] = span(floorEdge(-1));
    const [farRight, nearRight] = span(floorEdge(1));

    this.fillStyle(COLORS.floor);
    this.fillPoints(toVectors([farLeft!, farRight!, nearRight!, nearLeft!]), true);
    this.shadeRows();

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

    for (const [far, near] of [
      [farLeft!, nearLeft!],
      [farRight!, nearRight!],
    ] as const) {
      for (const { width, alpha } of FLOOR.edgeGlow) {
        this.lineStyle(width, COLORS.floorEdge, alpha);
        this.lineBetween(far.x, far.y, near.x, near.y);
      }
      this.lineStyle(FLOOR.edgeWidth, COLORS.floorEdge);
      this.lineBetween(far.x, far.y, near.x, near.y);
    }
  }

  // Each tile row takes more of the deeper cream the further back it lies,
  // so the runway reads as running into the distance.
  private shadeRows(): void {
    const rows = [WALL_START_SCALE, ...crossSeamScales(), STAGE_FRONT_SCALE];
    const at = (side: -1 | 1, scale: number) => project(floorEdge(side), scale);
    for (let row = 1; row < rows.length; row++) {
      const [far, near] = [rows[row - 1]!, rows[row]!];
      const back = (STAGE_FRONT_SCALE - far) / (STAGE_FRONT_SCALE - WALL_START_SCALE);
      this.fillStyle(COLORS.floorSeam, FLOOR.farShade * back * back);
      this.fillPoints(toVectors([at(-1, far), at(1, far), at(1, near), at(-1, near)]), true);
    }
  }
}
