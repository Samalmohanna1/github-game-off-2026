import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, LANE_LIT, LANE_TARGET } from '@/config';
import { laneLeftX } from '@/logic/lanes';
import { FIGURE_TILE, project, type Point } from '@/logic/perspective';
import { prefersReducedMotion } from '@/scenes/ui';
import { toVectors } from '@/objects/vectors';

interface Target {
  readonly lane: number;
  readonly dir: -1 | 1;
}

// The floor tile each lane has in the figure's row. While the figure is lined
// up, its tile carries a thin deep green outline, inset a little; each time
// it lines up, that flashes in as a filled pad that grows into place and
// settles to the outline (M10b review). A Shift Wall's target lane gets a
// thick ochre outline with chevrons pointing the way the hole went, so the
// two differ by shape as well as color. Every other tile is plain floor.
export class LaneTiles extends Phaser.GameObjects.Graphics {
  private litLane: number | null = null;
  private target: Target | null = null;
  // How far the marker has grown into place, and how much of its fill is
  // left, 0-1.
  private readonly marker = { grown: 1, fill: 0 };

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
  }

  setLit(lane: number | null): void {
    if (lane === this.litLane) return;
    this.litLane = lane;
    const tweens = this.scene.tweens;
    tweens.killTweensOf(this.marker);
    Object.assign(this.marker, { grown: 1, fill: 0 });
    if (lane !== null && !prefersReducedMotion()) {
      Object.assign(this.marker, { grown: 0, fill: 1 });
      const redraw = () => this.redraw();
      tweens.add({ targets: this.marker, grown: 1, duration: LANE_LIT.growMs, ease: 'Back.easeOut', onUpdate: redraw });
      tweens.add({
        targets: this.marker,
        fill: 0,
        delay: LANE_LIT.growMs,
        duration: LANE_LIT.settleMs,
        ease: 'Quad.easeIn',
        onUpdate: redraw,
      });
    }
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
      const { grown, fill } = this.marker;
      const marker = toVectors(shrunk(tile(this.litLane), (1 - LANE_LIT.inset) * (LANE_LIT.from + (1 - LANE_LIT.from) * grown)));
      this.fillStyle(COLORS.laneLit, fill);
      this.fillPoints(marker, true);
      this.lineStyle(LANE_LIT.lineWidth, COLORS.laneLit);
      this.strokePoints(marker, true, true);
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
    const { x: cx, y: cy } = middle(quad);
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

function middle(quad: readonly Point[]): Point {
  return {
    x: quad.reduce((sum, p) => sum + p.x, 0) / quad.length,
    y: quad.reduce((sum, p) => sum + p.y, 0) / quad.length,
  };
}

// A quad scaled by `size` about its own middle.
function shrunk(quad: readonly Point[], size: number): Point[] {
  const { x: cx, y: cy } = middle(quad);
  return quad.map((p) => ({ x: cx + (p.x - cx) * size, y: cy + (p.y - cy) * size }));
}

// A lane's tile in the figure's row: from the lane's seams at the figure's
// plane, out to the row's back and front seams.
function tile(lane: number): Point[] {
  const left = { x: laneLeftX(lane), y: FIGURE_FLOOR_Y };
  const right = { x: laneLeftX(lane + 1), y: FIGURE_FLOOR_Y };
  const { back, front } = FIGURE_TILE;
  return [project(left, back), project(right, back), project(right, front), project(left, front)];
}
