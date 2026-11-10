import Phaser from 'phaser';
import { ART_SEED, COLORS, FLOOR, FLOOR_LINE_WIDTH, LANE_COUNT, WALL_START_SCALE } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, STAGE_FRONT_SCALE, crossSeamScales, floorEdge, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

// The floor (M10): cream tiles, each a touch lighter or darker, thin pale
// seams along the lanes and across, green verges beyond its edges, and thin
// edge lines that frame the stage. The cross seams put the figure in the
// middle of a row of tiles. Seeded, so the tiles keep their tones every run.
// Drawn once.
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

    this.fillStyle(COLORS.floor);
    this.fillPoints(strip(floorEdge(-1), floorEdge(1)), true);
    this.toneTiles();
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
    for (const scale of crossSeamScales()) {
      const left = project(floorEdge(-1), scale);
      const right = project(floorEdge(1), scale);
      this.lineBetween(left.x, left.y, right.x, right.y);
    }

    const [farLeft, nearLeft] = span(floorEdge(-1));
    const [farRight, nearRight] = span(floorEdge(1));
    this.lineStyle(FLOOR_LINE_WIDTH, COLORS.floorLine);
    this.strokePoints(toVectors([nearLeft!, farLeft!, farRight!, nearRight!]));
  }

  // Each tile gets a random share of the deeper cream, so the floor isn't one
  // flat sheet.
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
