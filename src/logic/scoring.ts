import { GRADE_BONUS, GREAT_T, MAX_MULTIPLIER, PERFECT_T, STREAK_STEP, WALL_CLEAR_POINTS } from '@/config';

export type Grade = keyof typeof GRADE_BONUS;

export interface WallScore {
  readonly grade: Grade;
  readonly points: number;
  readonly multiplier: number;
}

export function gradeFor(t: number): Grade {
  if (t <= PERFECT_T) return 'perfect';
  if (t <= GREAT_T) return 'great';
  return 'closeCall';
}

// PLAN.md §6. A PERFECT is multiplied by 1 + STREAK_STEP for each PERFECT
// already in the streak (capped at MAX_MULTIPLIER), so the first is x1 and the
// second x1.5. Any other grade scores x1 and resets the streak.
export class ScoreKeeper {
  score = 0;
  wallsCleared = 0;
  streak = 0;

  // firstWall is 1 except for a dev-server run started further in.
  constructor(private readonly firstWall = 1) {}

  get wallNumber(): number {
    return this.firstWall + this.wallsCleared;
  }

  clearWall(t: number): WallScore {
    const grade = gradeFor(t);
    const multiplier = grade === 'perfect' ? Math.min(MAX_MULTIPLIER, 1 + STREAK_STEP * this.streak) : 1;
    const points = Math.round((WALL_CLEAR_POINTS + GRADE_BONUS[grade]) * multiplier);

    this.streak = grade === 'perfect' ? this.streak + 1 : 0;
    this.score += points;
    this.wallsCleared += 1;
    return { grade, points, multiplier };
  }
}
