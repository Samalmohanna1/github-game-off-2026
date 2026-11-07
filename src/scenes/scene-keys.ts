export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Play: 'Play',
  GameOver: 'GameOver',
} as const;

export interface RunResult {
  wallsCleared: number;
  score: number;
  endedOnWall: number;
  // Codes still held when the run ended; restart waits for them (PLAN.md §7).
  keysDown: readonly string[];
}
