export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  stage: 0xf7dde3,
} as const;

// CSS strings because Phaser text styles take CSS colors. Every pair must
// stay at or above 4.5:1 against COLORS.stage (tests/config.test.ts).
export const TEXT_COLORS = {
  ink: '#3b2a33',
  muted: '#6e5662',
  accent: '#1d4fb8',
  danger: '#b3243a',
} as const;

export const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

// px. Nothing goes below 24 so all text counts as "large" for WCAG contrast.
export const FONT_SIZES = {
  title: 112,
  heading: 80,
  body: 34,
  small: 24,
} as const;

// Fractions of GAME_HEIGHT.
export const SCREEN_LAYOUT = {
  titleY: 0.36,
  subtitleY: 0.5,
  promptY: 0.7,
  gameOverHeadingY: 0.2,
  gameOverStatsTopY: 0.38,
  gameOverStatsLineGap: 0.08,
  gameOverPromptY: 0.85,
  playPlaceholderY: 0.42,
  playHintY: 0.58,
} as const;

// Prompts pulse in size, not alpha, so their contrast never drops.
export const PROMPT_PULSE_SCALE = 1.06;
export const PROMPT_PULSE_MS = 700;

export const LANE_COUNT = 7;
export const WALL_START_SCALE = 0.35;

export const WRONG_KEY_JUMP = 0.06; // added to t
export const LOCK_RUSH_DURATION = 400; // ms
export const PROMPT_APPEAR_DELAY = 120; // ms after the previous letter is held

export const SHIFT_WALL_TELEGRAPH = 300; // ms
export const SHIFT_WALL_T_RANGE: readonly [number, number] = [0.35, 0.6];

export const PERFECT_T = 0.5;
export const GREAT_T = 0.75;

export const RESTART_LOCKOUT = 1000; // ms

export const MIN_WALL_TIME = 3.5; // s
export const MAX_LETTERS = 5;
export const MAX_LETTERS_SHIFT_WALL = 4;
