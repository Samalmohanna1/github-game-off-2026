import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, LANE_COUNT, LANE_MARKER_EDGE_WIDTH, LANE_MARKER_FRONT_Y, LANE_MARKER_GAP } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { project, scaleAtFloorY } from '@/logic/perspective';

const FRONT_SCALE = scaleAtFloorY(LANE_MARKER_FRONT_Y);

// Unlit strips are outlines and the lit one is filled, so the state reads
// from shape as well as color.
export class LaneMarkers extends Phaser.GameObjects.Graphics {
  private litLane: number | null = null;

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

  private redraw(): void {
    this.clear();
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const left = { x: laneLeftX(lane) + LANE_MARKER_GAP / 2, y: FIGURE_FLOOR_Y };
      const right = { x: laneLeftX(lane + 1) - LANE_MARKER_GAP / 2, y: FIGURE_FLOOR_Y };
      const quad = [left, right, project(right, FRONT_SCALE), project(left, FRONT_SCALE)].map(
        (p) => new Phaser.Math.Vector2(p.x, p.y),
      );

      if (lane === this.litLane) {
        this.fillStyle(COLORS.laneMarkerLit);
        this.fillPoints(quad, true);
      }
      this.lineStyle(LANE_MARKER_EDGE_WIDTH, lane === this.litLane ? COLORS.laneMarkerLit : COLORS.laneMarker);
      this.strokePoints(quad, true);
    }
  }
}
