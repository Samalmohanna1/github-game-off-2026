import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, LANE_TARGET } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { FIGURE_TILE, project, type Point } from '@/logic/perspective';
import { toVectors } from '@/objects/vectors';

interface Target {
  readonly lane: number;
  readonly dir: -1 | 1;
}

// The floor tile each lane has in the figure's row. The lined-up lane's tile
// lights up deep green (filled, so the state reads by shape as well as
// color). A Shift Wall's target lane gets a thick ochre outline with chevrons
// pointing the way the hole went. Every other tile is plain floor.
export class LaneTiles extends Phaser.GameObjects.Graphics {
  private litLane: number | null = null;
  private target: Target | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
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
    if (this.litLane !== null) {
      this.fillStyle(COLORS.laneLit);
      this.fillPoints(toVectors(tile(this.litLane)), true);
    }
    if (this.target !== null) {
      const quad = tile(this.target.lane);
      this.lineStyle(LANE_TARGET.edgeWidth, COLORS.wallWarning);
      this.strokePoints(toVectors(quad), true);
      this.drawChevrons(quad, this.target.dir);
    }
  }

  // Two open chevrons (> > or < <) centered in the tile.
  private drawChevrons(quad: readonly Point[], dir: -1 | 1): void {
    const cx = quad.reduce((sum, p) => sum + p.x, 0) / quad.length;
    const cy = quad.reduce((sum, p) => sum + p.y, 0) / quad.length;
    const { chevronWidth: w, chevronHeight: h, chevronGap: gap, chevronLineWidth } = LANE_TARGET;
    this.lineStyle(chevronLineWidth, COLORS.wallWarning);
    for (const offset of [-gap / 2, gap / 2]) {
      const x = cx + offset;
      const chevron = [
        { x: x - (dir * w) / 2, y: cy - h / 2 },
        { x: x + (dir * w) / 2, y: cy },
        { x: x - (dir * w) / 2, y: cy + h / 2 },
      ];
      this.strokePoints(toVectors(chevron));
    }
  }
}

// A lane's tile in the figure's row: from the lane's seams at the figure's
// plane, out to the row's back and front seams.
function tile(lane: number): Point[] {
  const left = { x: laneLeftX(lane), y: FIGURE_FLOOR_Y };
  const right = { x: laneLeftX(lane + 1), y: FIGURE_FLOOR_Y };
  const { back, front } = FIGURE_TILE;
  return [project(left, back), project(right, back), project(right, front), project(left, front)];
}
