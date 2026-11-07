import { LANE_COUNT, SHIFT_WALL_PAUSE, SHIFT_WALL_SLIDE, SHIFT_WALL_TELEGRAPH, SHIFT_WALL_T_RANGE } from '@/config';
import { holeLaneCandidates } from '@/logic/lanes';
import { pick, type Random } from '@/logic/random';

export type ShiftWallEvent =
  | { readonly type: 'warn'; readonly toLane: number; readonly dir: -1 | 1 }
  | { readonly type: 'slide'; readonly toLane: number };

// PLAN.md §5: once per Shift Wall, at a random t in SHIFT_WALL_T_RANGE but not
// before at least one letter is held, the wall warns for SHIFT_WALL_TELEGRAPH
// and then the hole slides SHIFT_WALL_SLIDE lanes, staying on the stage. The
// hole's target is chosen when the warning starts so the arrow can point at it.
// From the warning on, the wall holds still for SHIFT_WALL_PAUSE.
export class ShiftWall {
  readonly triggerT: number;
  private phase: 'waiting' | 'warning' | 'done';
  private toLane = 0;
  private warningLeft = 0;
  private pauseLeft = 0;

  constructor(
    enabled: boolean,
    private readonly holeLane: number,
    private readonly random: Random = Math.random,
  ) {
    const [lo, hi] = SHIFT_WALL_T_RANGE;
    this.triggerT = lo + random() * (hi - lo);
    this.phase = enabled ? 'waiting' : 'done';
  }

  get warning(): boolean {
    return this.phase === 'warning';
  }

  // True while the wall should stop approaching.
  get holding(): boolean {
    return this.pauseLeft > 0;
  }

  update(t: number, heldLetters: number, dtMs: number): ShiftWallEvent | null {
    if (this.phase === 'waiting' && t >= this.triggerT && heldLetters > 0) {
      this.phase = 'warning';
      this.warningLeft = SHIFT_WALL_TELEGRAPH;
      this.pauseLeft = SHIFT_WALL_PAUSE;
      this.toLane = pickSlideLane(this.holeLane, this.random);
      return { type: 'warn', toLane: this.toLane, dir: this.toLane > this.holeLane ? 1 : -1 };
    }
    this.pauseLeft = Math.max(0, this.pauseLeft - dtMs);
    if (this.phase === 'warning') {
      this.warningLeft -= dtMs;
      if (this.warningLeft <= 0) {
        this.phase = 'done';
        return { type: 'slide', toLane: this.toLane };
      }
    }
    return null;
  }
}

export function pickSlideLane(holeLane: number, random: Random): number {
  const lane = pick(holeLaneCandidates(holeLane, SHIFT_WALL_SLIDE), random);
  if (lane === undefined) throw new Error(`No lane to slide to from ${holeLane} of ${LANE_COUNT}`);
  return lane;
}
