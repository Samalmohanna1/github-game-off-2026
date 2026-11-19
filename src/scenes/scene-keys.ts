export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Play: 'Play',
  GameOver: 'GameOver',
} as const;

// How the Play scene starts: the interactive tutorial (after the title), the
// count into the first wall (after the tutorial, or skipping it), or a run at
// once (Play again).
export type PlayMode = 'tutorial' | 'countdown' | 'run';

export interface PlayStart {
  readonly mode?: PlayMode;
}

export interface RunResult {
  wallsCleared: number;
  score: number;
  // Codes still held when the run ended; restart waits for them (PLAN.md §7).
  keysDown: readonly string[];
}
