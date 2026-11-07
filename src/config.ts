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
  chipShiftMark: 0xffffff,
  panel: 0xffffff,
  panelEdge: 0x6e5662,
  labelStroke: 0xffffff,
  splash: 0x3d8fd6,
  // Shift Wall warning. It's as bright as the wrong-key flash, so the arrow is
  // what tells the two apart, not the color.
  wallWarning: 0xa86400,
  shiftArrow: 0xffffff,
} as const;

// CSS strings because Phaser text styles take CSS colors. ink, muted, accent
// and danger sit on the stage, a white panel, or a timing label's white
// stroke; onChip sits on the chip colors. Every pair must reach 4.5:1
// (tests/config.test.ts).
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
// Monospace so the debug overlay's columns line up.
export const DEBUG_FONT_FAMILY = 'Consolas, Menlo, "Courier New", monospace';

// px. Nothing goes below 24 so all text counts as "large" for WCAG contrast.
export const FONT_SIZES = {
  title: 112,
  heading: 80,
  chip: 42,
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
  capsWarningY: 0.07,
  pauseHeadingY: 0.44,
  pausePromptY: 0.56,
} as const;

// Debug overlay (PLAN.md §8), toggled with F2: top-left corner, px.
export const DEBUG_OVERLAY = { x: 12, y: 12, padding: 10 } as const;

export const PAUSE_PANEL = { width: 560, height: 220 } as const; // px
export const PAUSE_DIM_ALPHA = 0.7; // stage-colored veil over the paused game
export const PANEL_EDGE_WIDTH = 3;

// Prompt tray chips, px. Held chips line up from the tray's left edge, the
// current prompt sits in the center, and slipped letters queue to its right.
export const CHIP = {
  size: 68,
  currentSize: 88,
  gap: 14,
  edgeInset: 40,
  radius: 12,
} as const;

// The outlined Shift arrow on capital chips, in the top-right corner. Size and
// inset are fractions of the chip, sized to clear even wide capitals (W, M).
export const SHIFT_MARK = { size: 0.25, inset: 0.07, lineWidth: 2 } as const;

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

export const WALL_START_SCALE = 0.35;
export const WALL_HEIGHT = 380; // px at full scale
export const WALL_EDGE_WIDTH = 4; // px at full scale
export const WALL_EASE_POWER = 2; // scale follows t^n, so higher n rushes harder at the end

export const WRONG_KEY_JUMP = 0.06; // added to t
export const WRONG_KEY_SHAKE_MS = 160;
export const WRONG_KEY_SHAKE_INTENSITY = 0.006; // fraction of the screen size
export const WALL_FLASH_MS = 120;
export const LOCK_RUSH_DURATION = 400; // ms
export const PROMPT_APPEAR_DELAY = 120; // ms after the previous letter is held

// Shift Wall (PLAN.md §5): at a random t in SHIFT_WALL_T_RANGE, once a letter
// is held, the wall flashes with an arrow for SHIFT_WALL_TELEGRAPH, then the
// hole slides SHIFT_WALL_SLIDE lanes in the arrow's direction.
export const SHIFT_WALL_TELEGRAPH = 300; // ms
export const SHIFT_WALL_T_RANGE: readonly [number, number] = [0.35, 0.6];
export const SHIFT_WALL_SLIDE: readonly [number, number] = [1, 2]; // lanes
export const SHIFT_WALL_SLIDE_MS = 220; // visual only: the hole's lane changes at once
// The warning arrow, px at full scale, centered over the hole in the band of
// wall above it.
export const SHIFT_ARROW = { length: 220, shaftThickness: 40, headLength: 90, headWidth: 120 } as const;

// Scoring (PLAN.md §6).
export const PERFECT_T = 0.5;
export const GREAT_T = 0.75;
export const WALL_CLEAR_POINTS = 100;
export const GRADE_BONUS = { perfect: 150, great: 75, closeCall: 25 } as const;
export const STREAK_STEP = 0.5; // multiplier added per PERFECT already in the streak
export const MAX_MULTIPLIER = 3;
export const BEST_SCORE_KEY = 'shape-shift.best';

// Pose lock: the wall rushes from its current depth to this scale over
// LOCK_RUSH_DURATION, passing in front of the figure and fading as it goes.
export const RUSH_END_SCALE = 1.8;

// The timing label over the figure, px and ms.
export const LABEL_Y = 300;
export const LABEL_POP_FROM = 0.5; // starting scale of the pop
export const LABEL_POP_MS = 180;
export const LABEL_HOLD_MS = 700;
export const LABEL_STROKE_WIDTH = 10;
export const LABEL_EDGE_MARGIN = 20;

// Fail (PLAN.md §7): the figure is shoved toward the camera and falls into
// the pool below the stage. Splash is a Week 1 placeholder of blue squares.
export const FAIL_SHOVE_MS = 450;
export const FAIL_FALL_DISTANCE = 220; // px
export const FAIL_SPIN_DEG = 70;
export const FAIL_SHOVE_SCALE = 1.2;
export const FAIL_SHAKE_MS = 300;
export const FAIL_SHAKE_INTENSITY = 0.012;
export const FAIL_TO_GAME_OVER_MS = 1400; // from the fail to the game-over screen
export const SPLASH = { drops: 14, dropSize: 10, minHeight: 60, maxHeight: 160, spread: 220, ms: 420 } as const;

export const RESTART_LOCKOUT = 1000; // ms

export const MIN_WALL_TIME = 3.5; // s
// PLAN.md §4: with an arrow and Shift on top, more keys than this at once
// ghost on many keyboards.
export const MAX_LETTERS = 5;
export const MAX_LETTERS_SHIFT_WALL = 4;

// Stretch score (PLAN.md §4) = the widest gap between two keys (key widths)
// + rowSpread per extra keyboard row used
// + crossReach per letter beyond HAND_CAPACITY on one side of the keyboard
// + sameFinger per pair of keys on the same touch-typing finger.
export const STRETCH_WEIGHTS = { rowSpread: 1.5, crossReach: 2, sameFinger: 2 } as const;
export const HAND_CAPACITY = 3; // letters one hand holds before the other must reach across
export const STRETCH_TRIES = 200; // random combos tried per wall before taking the closest
export const ADJACENT_KEY_DISTANCE = 1.3; // key widths; nearer keys count as "right next to"

// PLAN.md §5, one entry per band of walls. stretch ranges were set from the
// score distribution of every possible combo: each range catches at least 7%
// of random combos of its size, so STRETCH_TRIES essentially never misses.
// From fromWall 13 on, wall time drops by WALL_TIME_DECAY per wall (never
// below MIN_WALL_TIME) and the Shift Wall chance rises (M6 adds the slide).
export interface DifficultyTier {
  readonly fromWall: number;
  readonly name: string;
  readonly letters: number;
  readonly stretch: readonly [number, number];
  readonly allowAdjacent: boolean; // consecutive prompts may be neighboring keys
  readonly wallTime: number; // s
  readonly shiftLetters: readonly [number, number];
  readonly holeDistance: readonly [number, number]; // lanes from the figure
  readonly shiftWallChance: number;
}

export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  {
    fromWall: 1,
    name: 'Easy',
    letters: 3,
    stretch: [0, 5],
    allowAdjacent: true,
    wallTime: 8,
    shiftLetters: [0, 0],
    holeDistance: [1, 2],
    shiftWallChance: 0,
  },
  {
    fromWall: 4,
    name: 'Medium',
    letters: 4,
    stretch: [6, 9],
    allowAdjacent: false,
    wallTime: 7,
    shiftLetters: [0, 0],
    holeDistance: [1, 3],
    shiftWallChance: 0,
  },
  {
    fromWall: 7,
    name: 'Medium-high',
    letters: 4,
    stretch: [8.5, 11],
    allowAdjacent: false,
    wallTime: 6,
    shiftLetters: [1, 1],
    holeDistance: [1, 4],
    shiftWallChance: 0,
  },
  {
    fromWall: 10,
    name: 'Hard',
    letters: 5,
    stretch: [11, 14],
    allowAdjacent: false,
    wallTime: 5.5,
    shiftLetters: [1, 2],
    holeDistance: [2, 5],
    shiftWallChance: 0,
  },
  {
    fromWall: 13,
    name: 'Hard+',
    letters: 5,
    stretch: [12.5, 18],
    allowAdjacent: false,
    wallTime: 5.5,
    shiftLetters: [1, 2],
    holeDistance: [2, 6],
    shiftWallChance: 0.5,
  },
];

export const WALL_TIME_DECAY = 0.04; // Hard+: each wall is 4% shorter than the last
export const SHIFT_WALL_CHANCE_STEP = 0.05; // Hard+: added per wall after the first
export const SHIFT_WALL_CHANCE_MAX = 0.8;
