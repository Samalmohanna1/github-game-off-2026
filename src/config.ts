export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// The color system. Every color the game draws is named once in PALETTE, and
// components only use the roles in COLORS and TEXT_COLORS, never a raw value
// (tests/config.test.ts checks both). The base swatches were sampled from the
// design mocks (cream, near-black, dark green), sage and forest from the M10
// collage, and the yellow and coral accents from the mock's logo. The grid
// void (M10b) adds a near-black green for the void and an acid lime accent.
// The other entries are darker steps of those, so each can be used on cream,
// where the logo accents are too light to read.
export const PALETTE = {
  cream: 0xefdfca, // mock swatch: the runway, light text, the wall's frame
  creamDeep: 0xd3c5ae, // cream, darkened for the runway's seams and tile tones
  sage: 0x86a064, // the secondary environment color, and quiet labels
  forest: 0x4a6e43, // the void's grid, UI hairlines, and a wall with no image
  graphite: 0x4a433b, // the runway's outline, and quiet text on cream
  charcoal: 0x3b3a37, // the fine grid inside UI panels
  ink: 0x20201f, // mock swatch: UI surfaces and the figure
  greenDark: 0x17472d, // mock swatch: the glow along the horizon
  voidInk: 0x0b1510, // greenDark, taken almost to black: the void
  greenDeep: 0x2f7f3a, // deepened to hold 3:1 on cream: the lit lane tile
  lime: 0xb4ec4a, // the acid accent, used sparingly
  yellow: 0xffff7f, // mock logo
  ochre: 0x8f6a00, // yellow, darkened to hold 3:1 on cream
  coral: 0xff7f7f, // mock logo
  red: 0xd8453c, // coral, darkened to hold 3:1 on cream
  redDark: 0xa32a22, // coral, darkened for text
} as const;

// What each color means. The play screen (M10b) is a cream runway in a dark
// grid void. Graphics that carry meaning must hold 3:1 against what they sit
// on (tests/config.test.ts): the wall's cream frame and the hole's cream edge
// against the void and its glow, the runway's lines and tiles against the
// runway, and the key caps against their console. The wall's image can be any
// color, so its frame and hole edge carry its contrast where the void shows
// through; where the runway does, the image's own darks set the hole off.
// The figure's cream edge outlines it against the void and the wall, where
// its black can't. Lime is the accent, used sparingly: the HUD's edge
// accents, the held and current key caps, PERFECT, and the trace round a
// completed image. The two alert families stay: yellow means the hole is
// moving (Shift Walls), and coral means a mistake (a wrong key, a slip, a
// close call, Caps Lock).
export const COLORS = {
  // The title and game-over screens, until M11 restyles them.
  stage: PALETTE.cream,
  // The grid void behind the play screen: near-black, with a soft glow behind
  // the incoming wall and a faint perspective grid. All decoration.
  void: PALETTE.voidInk,
  voidGlow: PALETTE.greenDark,
  voidGrid: PALETTE.forest,
  // The runway.
  floor: PALETTE.cream,
  floorLine: PALETTE.graphite,
  floorSeam: PALETTE.creamDeep, // decorative tile seams
  laneLit: PALETTE.greenDeep,
  // The wall: an image panel (src/assets/walls/) in a cream frame.
  wall: PALETTE.forest, // the panel's face when no image has loaded
  wallFrame: PALETTE.cream,
  holeEdge: PALETTE.cream,
  completionTrace: PALETTE.lime, // round the silhouette as the image completes
  figure: PALETTE.ink,
  figureEdge: PALETTE.cream,
  figureShadow: PALETTE.ink,
  // Shift Wall warning. It's as bright as the wrong-key flash, so the arrow is
  // what tells the two apart, not the color.
  wallWarning: PALETTE.ochre,
  shiftArrow: PALETTE.yellow,
  wallFlash: PALETTE.red,
  // Angular UI panels, solid charcoal: the HUD, with a lime edge accent, and
  // the console the key caps sit in, with a thin sage border.
  panel: PALETTE.charcoal,
  panelEdge: PALETTE.sage,
  panelAccent: PALETTE.lime,
  // Key caps on the console: cream with charcoal letters, lime-edged once
  // held, framed in lime while current, coral when slipped.
  chipHeld: PALETTE.cream,
  chipHeldEdge: PALETTE.lime,
  chipCurrent: PALETTE.cream,
  chipSlipped: PALETTE.coral,
  chipShiftMark: PALETTE.ink,
  chipFocus: PALETTE.lime, // the frame round the current key cap
  // The next-letter preview is hollow rather than faded, so its letter keeps
  // full contrast while still reading as "not yet".
  chipNext: PALETTE.charcoal,
  chipNextEdge: PALETTE.cream,
  // Text drawn over the moving scene (the timing label, the SHIFT callout and
  // its arrow, the Caps Lock warning, the pause text) is bright, inside a thick
  // outline of this, so it reads over anything.
  textOutline: PALETTE.ink,
  debugPanel: PALETTE.cream,
  veil: PALETTE.voidInk, // over the paused game
} as const;

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

// CSS strings because Phaser text styles take CSS colors. ink, muted, accent
// and danger sit on the stage (the title and game-over screens); ink also sits
// on the chips and the debug panel. light sits on the UI panels (the HUD's
// numbers and captions) and on the hollow preview chip.
// light, good, alert and shift are the outlined text over the scene, measured
// against their outline (COLORS.textOutline). Every pair must reach 4.5:1
// (tests/config.test.ts).
export const TEXT_COLORS = {
  ink: css(PALETTE.ink),
  muted: css(PALETTE.graphite),
  accent: css(PALETTE.greenDark),
  danger: css(PALETTE.redDark),
  light: css(PALETTE.cream),
  good: css(PALETTE.lime),
  alert: css(PALETTE.coral),
  shift: css(PALETTE.yellow),
} as const;

// Anton for display text (titles, grades, big numbers) and IBM Plex Mono for
// the rest, as in the design mocks. Both are bundled from @fontsource (SIL
// OFL) and never fetched at runtime; the fallbacks only show if loading fails.
export const DISPLAY_FONT_FAMILY = 'Anton, Impact, "Arial Narrow", sans-serif';
export const FONT_FAMILY = '"IBM Plex Mono", Consolas, Menlo, monospace';
// Prompt letters need a capital I that can't be mistaken for a lowercase l;
// IBM Plex Mono's I has crossbars.
export const CHIP_FONT_FAMILY = FONT_FAMILY;
// Monospace so the debug overlay's columns line up.
export const DEBUG_FONT_FAMILY = FONT_FAMILY;
export const FONT_LOAD_TIMEOUT = 3000; // ms; past this, start with the fallbacks

// px. Nothing goes below 24 so all text counts as "large" for WCAG contrast.
export const FONT_SIZES = {
  title: 112,
  heading: 80,
  hud: 68,
  hudLabel: 24,
  chip: 42,
  body: 34,
  small: 24,
} as const;

// Which family each size uses. Anton has one weight, so it is never bolded.
// The HUD's captions are technical detail, so they set in IBM Plex Mono (M10b).
export const FONT_ROLES: Readonly<Record<keyof typeof FONT_SIZES, 'display' | 'mono'>> = {
  title: 'display',
  heading: 'display',
  hud: 'display',
  hudLabel: 'mono',
  chip: 'mono',
  body: 'mono',
  small: 'mono',
};

// Outlined text (outlinedStyle() in src/scenes/text-styles.ts): the stroke
// width per size, px. Half of it lies outside the letters.
export const TEXT_OUTLINE: Readonly<Record<keyof typeof FONT_SIZES, number>> = {
  title: 16,
  heading: 14,
  hud: 10,
  hudLabel: 6,
  chip: 8,
  body: 9,
  small: 7,
};

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
  shiftCalloutY: 0.12, // above the wall while it is far enough away to shift
  pauseHeadingY: 0.42,
  pausePromptY: 0.58,
} as const;

// Debug overlay (PLAN.md §8), toggled with F2: top-left corner, px.
export const DEBUG_OVERLAY = { x: 12, y: 12, padding: 10 } as const;

export const PAUSE_DIM_ALPHA = 0.7; // void-colored veil over the paused game

// Key caps in the console, px. The current prompt sits in the center; held
// letters line up to its left, the most recent nearest the center, and to its
// right come the next-letter preview and then slipped letters, in queue
// order. Letters flow right to left: a chip that changes place slides there
// over slideMs. A newly held chip pops from popScale; a newly slipped one
// wobbles. Each cap is a square with its top-left and bottom-right corners
// cut by `cut`. A held cap is edged in lime; the current one has a lime
// frame focusGap outside it.
export const CHIP = {
  size: 68,
  currentSize: 88,
  gap: 14,
  cut: 10,
  nextEdgeWidth: 3,
  heldEdgeWidth: 3,
  focusGap: 5,
  focusWidth: 3,
  slideMs: 140,
  popScale: 1.2,
  popMs: 220,
  wobble: { deg: 9, ms: 280, swings: 3 },
} as const;

// The console the key caps sit in, centered along the bottom, below the
// runway, and wide enough for MAX_LETTERS held caps beside the current one.
// px: padX past the outermost cap, cut on its top-left and bottom-right
// corners. The socket outlines the current cap's slot where its lime frame
// goes, so the slot shows while no letter is prompted.
export const CONSOLE = {
  height: 104,
  padX: 22,
  cut: 18,
  socketWidth: 1.5,
} as const;

// The angular UI panels (the HUD and the console): a solid charcoal face, and
// either a thin edge (the console) or a short lime accent bar accentWidth px
// thick along one side (the HUD; its length is per panel). px.
export const PANEL = {
  edgeWidth: 1.5,
  accentWidth: 5,
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
// The figure stands on the front-most whole row of floor tiles, so there's no
// spare floor between it and the camera (M10 review 6; 530, then 495, until
// then). Everything sized at its plane (CELL_SIZE, WALL_HEIGHT, the shadow,
// the Shift arrow) scales with its depth, so the figure still fits its lane.
export const FIGURE_FLOOR_Y = 560;
export const FLOOR_LINE_WIDTH = 2;

// Art (PLAN.md §10, M10b): a cream runway in a dark grid void, a wall that is
// an image panel with a cutout, and angular charcoal UI with lime accents.
// Clean edges and no texture: everything is drawn in code except the wall
// images.
// The grid void (GridVoid): a ground grid in the stage's perspective,
// continuing the runway's lanes and tile rows into the dark. Depths are
// 1/scale, as for the runway's tiles. Grid lines fade from fadeDepth[0] to
// nothing at fadeDepth[1], so they melt into the dark instead of meeting at a
// hard horizon; the lines toward the vanishing point fade in pieces fadeStep
// longer than the last. The grid drifts toward the camera one tile row every
// driftMs, and a slow wave of light runs through its rows the same way: one
// crest every wave.rows rows, passing a row every wave.ms, dimming the lines
// between crests by up to wave.dip of their alpha. A soft glow, glow.width by
// glow.height px at glow.alpha, sits glow.below px under the vanishing point,
// behind the incoming wall. The motion is still for reduced motion.
export const VOID = {
  fadeDepth: [1.4, 6.5] as readonly [number, number],
  fadeStep: 0.15,
  lineWidth: 1,
  lineAlpha: 0.3,
  driftMs: 9000,
  wave: { rows: 12, ms: 900, dip: 0.5 },
  glow: { below: 70, width: 1180, height: 460, alpha: 0.7 },
} as const;
// HUD: SCORE in the top-left corner and WALL in the top-right, each on an
// angular panel (PANEL) whose inner bottom corner is cut by `cut`, with its
// accent down the outer side from the top. The panel grows with its number
// from minWidth. A changed number counts up over countMs and pops from
// popScale. px and ms; label and value y are from the panel's top.
export const HUD = {
  marginX: 24,
  top: 16,
  height: 108,
  minWidth: 200,
  padX: 24,
  cut: 22,
  accentLength: 48,
  labelY: 10,
  valueY: 24,
  countMs: 380,
  popScale: 1.14,
  popMs: 220,
} as const;
// The runway: plain cream with thin cream-gray seams along the lanes and
// across it. Cross seams are evenly spaced in 1/scale, so they bunch up into
// the distance like real tiles, and are cut so the figure's plane runs
// through the middle of a row: the figure stands centered on its lane's tile
// (src/logic/perspective.ts). tileDepth is in 1/scale.
export const FLOOR = { seamWidth: 1, tileDepth: 0.2 } as const;
// The lined-up marker (M10b review): a deep green outline lineWidth px thick
// round the figure's tile, inset by `inset` of its size. Each time the figure
// lines up it flashes in as a filled pad, growing from `from` of its size over
// growMs, and the fill fades to leave the outline over settleMs. Just the
// outline for reduced motion.
export const LANE_LIT = { inset: 0.14, lineWidth: 3, from: 0.4, growMs: 160, settleMs: 420 } as const;

// The figure's pose grid (PLAN.md §3).
export const FIGURE_GRID = { cols: 6, rows: 8 } as const;
export const CELL_SIZE = 26; // px at full scale
export const FIGURE_WIDTH = FIGURE_GRID.cols * CELL_SIZE;
export const FIGURE_HEIGHT = FIGURE_GRID.rows * CELL_SIZE;
export const FIGURE_EDGE_WIDTH = 3; // px; the cream edge round each block
export const FIGURE_SEAM_WIDTH = 1.5; // px; the thinner seams between a block's cells
// The soft shadow under the figure's feet, px.
export const FIGURE_SHADOW = { width: 183, height: 24, alpha: 0.22 } as const;
export const FIGURE_SLIDE_MS = 90; // one lane, visual only: the lane changes instantly

export const LANE_COUNT = 7;
// The Shift Wall's target lane: its tile under the figure's row gets a thick
// ochre outline with chevrons pointing the way the hole went, until the figure
// is lined up with it. px.
export const LANE_TARGET = { edgeWidth: 5, chevronWidth: 12, chevronHeight: 22, chevronGap: 20, chevronLineWidth: 4 } as const;

// Set with the figure's depth, so the wall starts at the same place on screen
// wherever the figure stands (0.35 at FIGURE_FLOOR_Y 530).
export const WALL_START_SCALE = 0.32;
export const WALL_HEIGHT = 410; // px at full scale
export const WALL_EASE_POWER = 2; // scale follows t^n, so higher n rushes harder at the end
// The wall's look (M10b), px at full scale: a thin cream frame round the
// panel and a thinner cream edge round the hole, each centered on the edge it
// follows. Nothing else is drawn over the image.
export const WALL_FRAME_WIDTH = 3;
export const HOLE_EDGE_WIDTH = 2;
// A new wall fades in at the runway's far end over this, ms.
export const WALL_APPEAR_MS = 200;
// Image completion, the signature moment (M10b review). On a pose lock the
// wall rushes to the figure over LOCK_RUSH_DURATION, where its hole and the
// figure's pose line up exactly. Then the figure's pixels take the colors of
// the image's missing piece, row by row from the feet up, over pixelMs; the
// image's own detail fills in over them over restoreMs while a lime trace of
// the silhouette fades over traceMs; the whole picture holds for holdMs; and
// the wall leaves, growing to exitGrow and fading over exitMs. The figure
// itself never changes: the pixels are drawn over it, and go with the wall.
export const WALL_COMPLETE = {
  pixelMs: 150,
  restoreMs: 200,
  traceMs: 420,
  traceWidth: 2,
  holdMs: 260,
  exitMs: 260,
  exitGrow: 1.06,
} as const;

export const WRONG_KEY_JUMP = 0.03; // added to t
// A wrong key rattles the wall itself, side to side and dying away, rather
// than shaking the camera, so the tray the player is reading stays still.
export const WALL_RATTLE = { distance: 12, ms: 240, swings: 3 } as const; // px, ms, full swings
export const WALL_FLASH_MS = 120;
export const LOCK_RUSH_DURATION = 300; // ms, from the lock to the wall reaching the figure
export const PROMPT_APPEAR_DELAY = 120; // ms after the previous letter is held

// Shift Wall (PLAN.md §5): at a random t in SHIFT_WALL_T_RANGE, once a letter
// is held, the wall flashes with an arrow for SHIFT_WALL_TELEGRAPH, then the
// hole slides SHIFT_WALL_SLIDE lanes in the arrow's direction.
export const SHIFT_WALL_TELEGRAPH = 300; // ms
export const SHIFT_WALL_T_RANGE: readonly [number, number] = [0.3, 0.5];
// lanes; one, so a single Space press lines up again (1-2 before the
// M7 follow-up, when moving meant taking a hand off the letters)
export const SHIFT_WALL_SLIDE: readonly [number, number] = [1, 1];
export const SHIFT_WALL_SLIDE_MS = 220; // visual only: the hole's lane changes at once
// The wall stops approaching from the warning on, for the warning, the slide
// and time to line up again, then carries on. The SHIFT callout shows for as
// long as the wall holds.
export const SHIFT_WALL_PAUSE = 1000; // ms
// A short sideways camera nudge in the slide's direction as the hole moves.
export const SHIFT_JOLT = { distance: 16, ms: 90 } as const; // px, ms each way
// The callout's arrow beside the SHIFT text, px.
export const SHIFT_CALLOUT_ARROW = { gap: 24, length: 90, shaftThickness: 26, headLength: 44, headWidth: 64 } as const;
// The warning arrow, px at full scale, centered over the hole in the band of
// wall above it.
export const SHIFT_ARROW = { length: 236, shaftThickness: 42, headLength: 96, headWidth: 130 } as const;

// Scoring (PLAN.md §6).
export const PERFECT_T = 0.5;
export const GREAT_T = 0.75;
export const WALL_CLEAR_POINTS = 100;
export const GRADE_BONUS = { perfect: 150, great: 75, closeCall: 25 } as const;
export const STREAK_STEP = 0.5; // multiplier added per PERFECT already in the streak
export const MAX_MULTIPLIER = 3;
export const BEST_SCORE_KEY = 'shape-shift.best';

// Feel (PLAN.md §10, M8). Visual only: none of these touch the game state.
// A block that snaps into its pose lands squashed (wider and shorter by
// `squash`) and springs back to its true size.
export const BLOCK_SNAP = { squash: 0.25, ms: 240 } as const;
// A slipped block goes limp: it slumps back to neutral with a bounce, tilted
// away from where it was and settling upright.
export const BLOCK_LIMP = { ms: 450, tiltDeg: 14 } as const;
// CLOSE CALL: tweens (the rush and the label pop) run at `scale` speed for
// `ms` of real time.
export const CLOSE_CALL_SLOWMO = { scale: 0.3, ms: 650 } as const;

// Audio (PLAN.md §10, M9): every sound is synthesized with Web Audio, with no
// sound files. Gains are 0-1 under `master`; Hz for pitches, ms for times; pan
// runs -1 (left) to 1 (right).
export const AUDIO = {
  master: 0.5,
  // Countdown: silent until the wall is in CLOSE CALL range (past GREAT_T),
  // then a clock ticks and tocks, faster as t nears 1. It replaced an
  // approach rumble after the M9 playtest.
  tick: { gain: 0.22, fromT: GREAT_T, startMs: 420, endMs: 110, tickHz: 2000, tockHz: 1500, ms: 25 },
  // Each held letter clicks a step higher than the last.
  click: { gain: 0.3, baseHz: 660, stepSemitones: 2, ms: 50 },
  // A slip: a quick cartoon "bloop" deflating, with a wobble.
  slip: { gain: 0.35, fromHz: 700, toHz: 160, ms: 240, wobbleHz: 14, wobbleDepthHz: 30 },
  // PERFECT: a quick major arpeggio, the last note held.
  fanfare: { gain: 0.22, rootHz: 523.25, semitones: [0, 4, 7, 12], noteMs: 90, lastMs: 360 },
  // Shift Wall warning: rising chirps from the side the hole is moving to,
  // then a whoosh that way as it slides.
  shiftAlert: { gain: 0.28, fromHz: 520, toHz: 1040, chirps: 2, chirpMs: 90, gapMs: 120, pan: 0.7 },
  whoosh: { gain: 0.22, fromHz: 400, toHz: 2400, ms: 220, pan: 0.7 },
  // The wall hits the figure: a thump under a short smack, at once. The thump
  // stays above ~80 Hz so laptop speakers still play it. (A crowd "oooh" after
  // it was cut after the second M9 playtest.)
  hit: { gain: 0.8, fromHz: 300, toHz: 80, ms: 200, smackMs: 110, smackCutoffHz: 2500 },
  // The figure lands: a game-show "whomp whomp whooom". Brassy notes stepping
  // down from rootHz, each with a "wah" as its filter opens and closes; the
  // last one is long, wobbles and sags. Each note holds until holdShare of its
  // length, then fades. It replaced a water splash sound after the third M9
  // playtest.
  whomp: {
    gain: 0.35,
    rootHz: 196, // G3; 233 Hz (Bb3) played a bit high
    semitones: [0, -1, -2],
    noteMs: 260,
    gapMs: 320,
    lastMs: 950,
    holdShare: 0.6,
    sagSemitones: 2,
    wahLowHz: 250,
    wahHighHz: 1500,
    wahOpenMs: 110,
    vibratoHz: 5.5,
    vibratoDepthHz: 4,
  },
} as const;

// The timing label over the figure, px and ms.
export const LABEL_Y = 284; // keeps its place over the figure's head
export const LABEL_POP_FROM = 0.5; // starting scale of the pop
export const LABEL_POP_MS = 180;
export const LABEL_HOLD_MS = 700;
export const LABEL_EDGE_MARGIN = 20;

// Fail (PLAN.md §7, M10 review 5): the wall knocks the figure off its feet,
// toward the camera, onto the floor at the depth landScale over shoveMs. It
// hops, drifts and turns the way it falls (toward the stage's middle), its
// arms flailing flailDeg either way at flailHz. When it hits the floor its
// blocks come apart (src/logic/tumble.ts), each flying outward from the
// figure's middle at `scatter` px/s per px it sits from it, and bounce low,
// like wood rather than rubber: a bounce keeps `restitution` of the landing
// speed, `friction` of the sideways speed and `spinKeep` of the spin. A
// landing slower than restSpeed stops bouncing, and the block tips flat onto a
// side at settleRate (1/s), a long block onto a long side. Speeds are px/s in the figure's own
// space; angles are degrees, spinDeg deg/s.
export interface FailTumbleTuning {
  readonly hop: number;
  readonly push: number;
  readonly spinDeg: number;
  readonly gravity: number;
  readonly restitution: number;
  readonly friction: number;
  readonly spinKeep: number;
  readonly restSpeed: number;
  readonly settleRate: number;
  readonly scatter: number;
  readonly flailDeg: number;
  readonly flailHz: number;
}
export const FAIL_TUMBLE = {
  landScale: 1.08, // the figure stands at the front of the floor, so it can't come far
  shoveMs: 450,
  // A bounce rises about restitution^2 of the height it fell from, so the
  // knock lifts the figure high enough for wood-like bounces to show.
  hop: 770,
  push: 140,
  spinDeg: 200,
  gravity: 4250, // px/s^2
  restitution: 0.45,
  friction: 0.7,
  spinKeep: 0.5,
  restSpeed: 130,
  settleRate: 12,
  scatter: 1.5,
  flailDeg: 35,
  flailHz: 4.5,
} as const satisfies FailTumbleTuning & { readonly landScale: number; readonly shoveMs: number };
export const FAIL_SHAKE_MS = 300;
export const FAIL_SHAKE_INTENSITY = 0.012;
// From the fail to the game-over screen: 1400 until M10 review 5, raised so
// the fallen blocks lie still for a moment first.
export const FAIL_TO_GAME_OVER_MS = 1800;

export const RESTART_LOCKOUT = 1000; // ms

export const MIN_WALL_TIME = 3.5; // s
// PLAN.md §4: with Space and Shift on top, more keys than this at once
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

// PLAN.md §5, one entry per band of walls: walls 1-3, two walls each through
// wall 9, three walls each after that, then an open-ended last tier from wall
// 19. Each band adds one new demand (Shift Walls, a letter, a wider stretch, a
// capital or shared fingers) while the wall time eases down by half a second
// or less, so the curve climbs steadily instead of in cliffs. Shift Walls come
// first, on easy letters, so the mechanic is learned while the hands are free;
// the first wall of their band always shifts (difficulty.ts).
// stretch ranges were set from the score distribution of every combo the tier
// can draw (one finger per letter before the last tier): each range catches at
// least 7% of them, so STRETCH_TRIES essentially never misses.
// In the last tier, wall time drops by WALL_TIME_DECAY per wall (never below
// MIN_WALL_TIME) and the Shift Wall chance rises by SHIFT_WALL_CHANCE_STEP.
export interface DifficultyTier {
  readonly fromWall: number;
  readonly name: string;
  readonly letters: number;
  readonly stretch: readonly [number, number];
  // For Shift Wall rounds, when MAX_LETTERS_SHIFT_WALL trims the letter count:
  // the same share of combos, scored over the smaller combo size.
  readonly shiftWallStretch?: readonly [number, number];
  readonly allowAdjacent: boolean; // consecutive prompts may be neighboring keys
  readonly allowSameFinger: boolean; // two letters may share a touch-typing finger
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
    allowSameFinger: false,
    wallTime: 10,
    shiftLetters: [0, 0],
    holeDistance: [1, 2],
    shiftWallChance: 0,
  },
  {
    fromWall: 4,
    name: 'Shift Walls',
    letters: 3,
    stretch: [0, 5],
    allowAdjacent: true,
    allowSameFinger: false,
    wallTime: 10,
    shiftLetters: [0, 0],
    holeDistance: [1, 2],
    shiftWallChance: 0.3,
  },
  {
    fromWall: 6,
    name: 'Four letters',
    letters: 4,
    stretch: [6, 8.5],
    allowAdjacent: false,
    allowSameFinger: false,
    wallTime: 10,
    shiftLetters: [0, 0],
    holeDistance: [1, 3],
    shiftWallChance: 0.3,
  },
  {
    fromWall: 8,
    name: 'Wider stretch',
    letters: 4,
    stretch: [7.5, 10],
    allowAdjacent: false,
    allowSameFinger: false,
    wallTime: 9.5,
    shiftLetters: [0, 0],
    holeDistance: [1, 3],
    shiftWallChance: 0.3,
  },
  {
    fromWall: 10,
    name: 'Capitals',
    letters: 4,
    stretch: [7.5, 10],
    allowAdjacent: false,
    allowSameFinger: false,
    wallTime: 9.5,
    shiftLetters: [1, 1],
    holeDistance: [1, 3],
    shiftWallChance: 0.3,
  },
  {
    fromWall: 13,
    name: 'Five letters',
    letters: 5,
    stretch: [9.5, 11],
    shiftWallStretch: [7.5, 10],
    allowAdjacent: false,
    allowSameFinger: false,
    wallTime: 9,
    shiftLetters: [1, 1],
    holeDistance: [1, 4],
    shiftWallChance: 0.35,
  },
  {
    fromWall: 16,
    name: 'Two capitals',
    letters: 5,
    stretch: [9.5, 11],
    shiftWallStretch: [7.5, 10],
    allowAdjacent: false,
    allowSameFinger: false,
    wallTime: 9,
    shiftLetters: [1, 2],
    holeDistance: [2, 5],
    shiftWallChance: 0.35,
  },
  {
    fromWall: 19,
    name: 'Shared fingers',
    letters: 5,
    stretch: [11, 14.5],
    shiftWallStretch: [9, 11.5],
    allowAdjacent: false,
    allowSameFinger: true,
    wallTime: 8.5,
    shiftLetters: [1, 2],
    holeDistance: [2, 6],
    shiftWallChance: 0.4,
  },
];

export const WALL_TIME_DECAY = 0.04; // last tier: each wall is 4% shorter than the last
export const SHIFT_WALL_CHANCE_STEP = 0.05; // last tier: added per wall after the first
export const SHIFT_WALL_CHANCE_MAX = 0.8;
