export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Play: 'Play',
  GameOver: 'GameOver',
} as const;

export interface RunResult {
  wallsCleared: number;
  score: number;
  best: number;
  endedOnWall: number;
}
