import Phaser from 'phaser';
import { ART_SEED, COLORS, FLOOR, FLOOR_LINE_WIDTH, LANE_COUNT, WALL_START_SCALE } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { STAGE_FRONT_SCALE, crossSeamScales, floorEdge, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

// The runway (M10b): a clean cream plane in the grid void. Its tiles are each
// a touch lighter or darker, with thin pale seams along the lanes and across,
// and a thin charcoal outline. The cross seams put the figure in the middle of
// a row of tiles. A lime line just beyond the far edge marks where walls
// appear. Seeded, so the tiles keep their tones every run. Drawn once.
export class Floor extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const span = (p: Point): Point[] => [project(p, WALL_START_SCALE), project(p, STAGE_FRONT_SCALE)];
    const [farLeft, nearLeft] = span(floorEdge(-1));
    const [farRight, nearRight] = span(floorEdge(1));

    this.fillStyle(COLORS.floor);
    this.fillPoints(toVectors([farLeft!, farRight!, nearRight!, nearLeft!]), true);
    this.toneTiles();

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

    const spawnY = farLeft!.y - FLOOR_LINE_WIDTH / 2 - FLOOR.spawnGap - FLOOR.spawnLineWidth / 2;
    this.lineStyle(FLOOR.spawnLineWidth, COLORS.spawnLine);
    this.lineBetween(farLeft!.x, spawnY, farRight!.x, spawnY);
  }

  // Each tile gets a random share of the deeper cream, so the runway isn't
  // one flat sheet.
  private toneTiles(): void {
    const rng = new Phaser.Math.RandomDataGenerator([ART_SEED]);
    const rows = [WALL_START_SCALE, ...crossSeamScales(), STAGE_FRONT_SCALE];
    const at = (lane: number, scale: number) => project({ x: laneLeftX(lane), y: floorEdge(1).y }, scale);
    for (let row = 1; row < rows.length; row++) {
      const [far, near] = [rows[row - 1]!, rows[row]!];
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        this.fillStyle(COLORS.floorTone, rng.frac() * FLOOR.toneMax);
        this.fillPoints(toVectors([at(lane, far), at(lane + 1, far), at(lane + 1, near), at(lane, near)]), true);
      }
    }
  }
}
