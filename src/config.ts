export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Non-text graphics that carry meaning (wall and hole, floor, tray edge, lane
// markers, figure) must stay at or above 3:1 against COLORS.stage, and the
// figure also against the wall it passes in front of (tests/config.test.ts).
export const COLORS = {
  stage: 0xf7dde3,
  floorLine: 0x6e5662,
  wall: 0x6b7a8f,
  wallEdge: 0x3b4656,
  tray: 0xffffff,
  trayEdge: 0x6e5662,
  laneMarker: 0x6e5662,
  laneMarkerLit: 0x1f8a4c,
  figure: 0x241c29,
  figureEdge: 0xf7dde3,
  wallFlash: 0xd6374a,
  chipHeld: 0x1a7a43,
  chipCurrent: 0x1d4fb8,
  chipSlipped: 0xb3243a,
  panel: 0xffffff,
  panelEdge: 0x6e5662,
} as const;

// CSS strings because Phaser text styles take CSS colors. ink, muted, accent
// and danger sit on the stage or a white panel; onChip sits on the chip
// colors. Every pair must reach 4.5:1 (tests/config.test.ts).
export const TEXT_COLORS = {
  ink: '#3b2a33',
  muted: '#6e5662',
  accent: '#1d4fb8',
  danger: '#b3243a',
  onChip: '#ffffff',
} as const;

export const FONT_FAMILY = 'Arial, Helvetica, sans-serif';
// Prompt letters need a capital I that can't be mistaken for a lowercase l;
// Verdana and Tahoma give the I crossbars, Arial does not.
export const CHIP_FONT_FAMILY = 'Verdana, Tahoma, sans-serif';

// px. Nothing goes below 24 so all text counts as "large" for WCAG contrast.
export const FONT_SIZES = {
  title: 112,
  heading: 80,
  chip: 44,
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
  playHintY: 0.07,
  pauseHeadingY: 0.44,
  pausePromptY: 0.56,
} as const;

export const PAUSE_PANEL = { width: 560, height: 220 } as const; // px
export const PAUSE_DIM_ALPHA = 0.7; // stage-colored veil over the paused game
export const PANEL_EDGE_WIDTH = 3;

// Prompt tray chips, px. Held chips line up from the tray's left edge, the
// current prompt sits in the center, and slipped letters queue to its right.
export const CHIP = {
  size: 64,
  currentSize: 84,
  gap: 14,
  edgeInset: 40,
  radius: 12,
} as const;

// Prompts pulse in size, not alpha, so their contrast never drops.
export const PROMPT_PULSE_SCALE = 1.06;
export const PROMPT_PULSE_MS = 700;

// Stage geometry, px. Everything shares one vanishing point at
// (GAME_WIDTH / 2, HORIZON_Y). The figure stands on FIGURE_FLOOR_Y, and the
// floor's edges run from the stage's bottom corners toward the vanishing point.
export const TRAY_HEIGHT = 110;
export const STAGE_BOTTOM_Y = GAME_HEIGHT - TRAY_HEIGHT;
export const HORIZON_Y = 140;
export const FIGURE_FLOOR_Y = 560;
export const FLOOR_LINE_WIDTH = 3;
export const TRAY_EDGE_WIDTH = 3;

// The figure's pose grid (PLAN.md §3).
export const FIGURE_GRID = { cols: 6, rows: 8 } as const;
export const CELL_SIZE = 24; // px at full scale
export const FIGURE_WIDTH = FIGURE_GRID.cols * CELL_SIZE;
export const FIGURE_HEIGHT = FIGURE_GRID.rows * CELL_SIZE;
export const FIGURE_EDGE_WIDTH = 2; // px; the gap line that separates the blocks
export const FIGURE_SLIDE_MS = 90; // one lane, visual only: the lane changes instantly

export const LANE_COUNT = 7;
export const LANE_MARKER_FRONT_Y = 600; // px; strips run from FIGURE_FLOOR_Y down to here
export const LANE_MARKER_GAP = 12; // px between strips, at the figure's plane
export const LANE_MARKER_EDGE_WIDTH = 2;
// Walls 1-3 in PLAN.md §5: the hole spawns 1-2 lanes away from the figure.
export const HOLE_DISTANCE: readonly [number, number] = [1, 2];

export const WALL_START_SCALE = 0.35;
export const WALL_HEIGHT = 380; // px at full scale
export const WALL_EDGE_WIDTH = 4; // px at full scale
export const WALL_TIME = 8.0; // s; walls 1-3 in PLAN.md §5
export const WALL_EASE_POWER = 2; // scale follows t^n, so higher n rushes harder at the end

export const WRONG_KEY_JUMP = 0.06; // added to t
export const WRONG_KEY_SHAKE_MS = 160;
export const WRONG_KEY_SHAKE_INTENSITY = 0.006; // fraction of the screen size
export const WALL_FLASH_MS = 120;
export const LOCK_RUSH_DURATION = 400; // ms
export const PROMPT_APPEAR_DELAY = 120; // ms after the previous letter is held

// Stand-in letters until M5's generator: each wall gets this many distinct
// letters, this many of them uppercase so the Shift rule can be played.
export const PLACEHOLDER_LETTER_COUNT = 3;
export const PLACEHOLDER_SHIFT_LETTERS = 1;

export const SHIFT_WALL_TELEGRAPH = 300; // ms
export const SHIFT_WALL_T_RANGE: readonly [number, number] = [0.35, 0.6];

export const PERFECT_T = 0.5;
export const GREAT_T = 0.75;

export const RESTART_LOCKOUT = 1000; // ms

export const MIN_WALL_TIME = 3.5; // s
export const MAX_LETTERS = 5;
export const MAX_LETTERS_SHIFT_WALL = 4;
