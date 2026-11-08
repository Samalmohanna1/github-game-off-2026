import Phaser from 'phaser';
import {
  COLORS,
  FIGURE_FLOOR_Y,
  LANE_COUNT,
  LANE_MARKER_EDGE_WIDTH,
  LANE_MARKER_FRONT_Y,
  LANE_MARKER_GAP,
  LANE_TARGET,
} from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { project, scaleAtFloorY, type Point } from '@/logic/perspective';
import { pencil, toVectors } from '@/objects/pencil';

const FRONT_SCALE = scaleAtFloorY(LANE_MARKER_FRONT_Y);

interface Target {
  readonly lane: number;
  readonly dir: -1 | 1;
}

// Unlit strips are pencil outlines and the lit one is filled, so the state
// reads from shape as well as color. A Shift Wall's target lane gets a thick
// ochre outline and chevrons pointing the way the hole went.
export class LaneMarkers extends Phaser.GameObjects.Graphics {
  private litLane: number | null = null;
  private target: Target | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.redraw();
  }

  setLit(lane: number | null): void {
    if (lane === this.litLane) return;
    this.litLane = lane;
    this.redraw();
  }

  setTarget(target: Target | null): void {
    if (target?.lane === this.target?.lane && target?.dir === this.target?.dir) return;
    this.target = target;
    this.redraw();
  }

  private redraw(): void {
    this.clear();
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const left = { x: laneLeftX(lane) + LANE_MARKER_GAP / 2, y: FIGURE_FLOOR_Y };
      const right = { x: laneLeftX(lane + 1) - LANE_MARKER_GAP / 2, y: FIGURE_FLOOR_Y };
      const quad = [left, right, project(right, FRONT_SCALE), project(left, FRONT_SCALE)];

      if (lane === this.target?.lane) {
        pencil(this, quad, true, { color: COLORS.wallWarning, width: LANE_TARGET.edgeWidth });
        this.drawChevrons(quad, this.target.dir);
        continue;
      }
      if (lane === this.litLane) {
        this.fillStyle(COLORS.laneMarkerLit);
        this.fillPoints(toVectors(quad), true);
      }
      pencil(this, quad, true, { color: COLORS.laneMarker, width: LANE_MARKER_EDGE_WIDTH });
    }
  }

  // Two open chevrons (> > or < <) centered in the strip.
  private drawChevrons(quad: readonly Point[], dir: -1 | 1): void {
    const cx = quad.reduce((sum, p) => sum + p.x, 0) / quad.length;
    const cy = quad.reduce((sum, p) => sum + p.y, 0) / quad.length;
    const { chevronWidth: w, chevronHeight: h, chevronGap: gap, chevronLineWidth } = LANE_TARGET;
    for (const offset of [-gap / 2, gap / 2]) {
      const x = cx + offset;
      const chevron = [
        { x: x - (dir * w) / 2, y: cy - h / 2 },
        { x: x + (dir * w) / 2, y: cy },
        { x: x - (dir * w) / 2, y: cy + h / 2 },
      ];
      pencil(this, chevron, false, { color: COLORS.wallWarning, width: chevronLineWidth });
    }
  }
}
