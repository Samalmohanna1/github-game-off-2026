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
  cream: 0xefdfca, // mock swatch: the runway, the cards, the key caps
  creamDeep: 0xd3c5ae, // cream, darkened for the runway's seams
  sage: 0x86a064, // the secondary environment color: the cards' fold, the bar's line
  forest: 0x4a6e43, // the void's grid, and the wall panel's
  ink: 0x20201f, // mock swatch: the figure and dark text
  greenDark: 0x17472d, // mock swatch: the void's light toward the seam, the wall panel's foot
  voidInk: 0x0b1510, // greenDark, taken almost to black: the void, the bar, the wall panel
  greenDeep: 0x2f7f3a, // deepened to hold 3:1 on cream: the lit lane tile, lit squares
  lime: 0xb4ec4a, // the acid accent: the seam, edges, slashes, held keys, the wall's neon
  // Cream and lime, faded toward the bar (65% over voidInk): the bar's waiting
  // and held key caps, dimmer than the current one but holding AAA for their
  // dark letters (5.7:1 and 5.4:1).
  creamFaded: 0x9f9889,
  limeFaded: 0x79a136,
  yellow: 0xffff7f, // mock logo
  ochre: 0x8f6a00, // yellow, darkened to hold 3:1 on cream
  coral: 0xff7f7f, // mock logo
  red: 0xd8453c, // coral, darkened to hold 3:1 on cream
  charcoal: 0x101010, // a neutral near-black: the studio splash before the title
} as const;

// What each color means. Every screen (M10b, M11) is set in a dark grid stage:
// a glossy floor grid meeting a gridded back wall at a glowing lime seam,
// where the walls are born. In play a cream runway runs down it. Graphics that
// carry meaning must hold 3:1 against what they sit on (tests/config.test.ts):
// the wall's lime frame and the hole's lime edge against the void and its
// glow, the wall panel against the runway it hides, the runway's tiles
// against the runway, and the key caps against the bar. The figure's cream
// edge outlines it against the void and the wall, where its black can't.
// Lime is the accent: the seam, the runway's edges, the wall's neon, the
// cards' and the bar's slashes, the lit squares, held keys, PERFECT, a
// completion, and the buttons. The two alert families stay: yellow
// means the hole is moving (Shift Walls), and coral means a mistake (a wrong
// key, a slip, a close call, Caps Lock).
export const COLORS = {
  // The grid stage behind every screen (GridVoid). All decoration.
  void: PALETTE.voidInk,
  voidGlow: PALETTE.greenDark, // the light rising toward the seam
  voidGrid: PALETTE.forest,
  seam: PALETTE.lime, // where the floor meets the back wall, and its bloom
  squareDim: PALETTE.forest,
  squareMid: PALETTE.greenDeep,
  squareBright: PALETTE.lime,
  // The runway.
  floor: PALETTE.cream,
  floorEdge: PALETTE.lime, // the glowing lines down its sides
  floorSeam: PALETTE.creamDeep, // decorative tile seams
  laneLit: PALETTE.greenDeep,
  // The wall (M10b review 4): a dark glass display panel (WALL_DISPLAY),
  // shading from near-black to dark green, with a cell grid, lime dots at its
  // crossings and scanlines, in a neon lime frame that glows inward, with the
  // hole edged in the same lime. A completion lights the figure's cells lime,
  // with dark seams between them like a display's pixels.
  wall: PALETTE.greenDark, // the panel's face if its texture can't be made
  panelTop: PALETTE.voidInk,
  panelFoot: PALETTE.greenDark,
  panelGrid: PALETTE.forest,
  panelDot: PALETTE.lime,
  panelScan: PALETTE.voidInk,
  panelGlow: PALETTE.lime,
  wallFrame: PALETTE.lime,
  holeEdge: PALETTE.lime,
  completionCell: PALETTE.lime,
  completionSeam: PALETTE.voidInk,
  completionTrace: PALETTE.lime, // round the silhouette as the panel fills back in
  figure: PALETTE.ink,
  figureEdge: PALETTE.cream,
  figureShadow: PALETTE.ink,
  // Shift Wall warning. It's as bright as the wrong-key flash, so the arrow is
  // what tells the two apart, not the color.
  wallWarning: PALETTE.ochre,
  shiftArrow: PALETTE.yellow,
  wallFlash: PALETTE.red,
  // Cards (CARD), after the mockup's HUD: cream with a slanted edge and a
  // lime slash beside it that fades to deep green. The HUD, the title's logo
  // and the screens' headings.
  card: PALETTE.cream,
  cardSlash: PALETTE.lime,
  cardSlashEnd: PALETTE.greenDeep,
  // The bar along the bottom: a dark band with a thin stepped line, lime
  // slashes, and a square per letter of the wall, lit once held. The line and
  // its slashes also part the game-over card's results.
  tray: PALETTE.voidInk,
  trayLine: PALETTE.sage,
  trayAccent: PALETTE.lime,
  trayDim: PALETTE.forest,
  // Key caps in the bar, all with dark letters (a review asked for a clearer
  // bar): the current one bright cream in a lime frame; the next and the
  // slipped ones waiting their turn faded white; held ones faded green. A
  // dropped letter's cap flashes a red edge as it shakes, then settles. The
  // fades are colors, never opacity, so every letter keeps AAA.
  chipCurrent: PALETTE.cream,
  chipNext: PALETTE.creamFaded,
  chipHeld: PALETTE.limeFaded,
  chipSlipped: PALETTE.creamFaded,
  chipDropEdge: PALETTE.red,
  chipShiftMark: PALETTE.ink,
  chipFocus: PALETTE.lime, // the frame round the current key cap
  // Text drawn over the moving scene (the timing label, the SHIFT callout and
  // its arrow, the Caps Lock warning, the pause text) is bright, inside a thick
  // outline of this, so it reads over anything.
  textOutline: PALETTE.ink,
  // Badges (BADGE), each in a thick ink edge that sets it off the runway and
  // the wall alike: the timing label in its grade's color with the points on
  // an ink tab, and the SHIFT callout in yellow, all with dark text.
  badgeEdge: PALETTE.voidInk,
  badgeTab: PALETTE.ink,
  gradePerfect: PALETTE.lime,
  gradeGreat: PALETTE.cream,
  gradeCloseCall: PALETTE.coral,
  // READY? and 3, 2, 1 before the first wall, lime like the screens' prompts.
  readyBadge: PALETTE.lime,
  calloutCard: PALETTE.yellow,
  calloutInk: PALETTE.ink,
  // The screens' buttons (Click to play, Start, Click to resume, Play again;
  // M11 review 2): lime key cap shapes with dark text, in a cream edge that
  // sets them off the dark stage.
  button: PALETTE.lime,
  buttonEdge: PALETTE.cream,
  // Dark cards (M11 review): the title's lockup, the how-to steps and the
  // game-over results, as dark as the bar, in a lime edge (every dark card
  // since M11 review 5; the how-to's were sage), with cream words and lime
  // numbers or captions. A lime rule sits under GAME OVER, as in the user's
  // mock (M11 review 4).
  darkCard: PALETTE.voidInk,
  darkCardEdge: PALETTE.lime,
  gameOverRule: PALETTE.lime,
  debugPanel: PALETTE.cream,
  veil: PALETTE.voidInk, // over the paused game
  // The studio's splash before the title: charcoal, as the user asked (ink
  // until a review asked for darker).
  splash: PALETTE.charcoal,
  // The title's sound switch: a dark track in a cream edge showing both
  // options, the one in force lit (a cream knob with a dark speaker), the
  // other faded (its speaker in faded white).
  muteTrack: PALETTE.voidInk,
  muteTrackEdge: PALETTE.cream,
  muteKnob: PALETTE.cream,
  muteIcon: PALETTE.ink,
  muteIconFaded: PALETTE.creamFaded,
} as const;

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

// CSS strings because Phaser text styles take CSS colors. ink sits on the
// chips, the debug panel, the cards, the badges and the buttons; light on the
// hollow preview chip, the badges' ink tabs, the dark cards and the void
// (GAME OVER, the screens' hints); good on the dark cards (the how-to steps'
// numbers, the game-over captions). light, good and
// alert are also the outlined text over the scene (the Caps Lock warning),
// measured against their outline (COLORS.textOutline). Every pair must
// reach 4.5:1 (tests/config.test.ts).
export const TEXT_COLORS = {
  ink: css(PALETTE.ink),
  light: css(PALETTE.cream),
  good: css(PALETTE.lime),
  alert: css(PALETTE.coral),
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
  lockup: 214,
  lockupSub: 92,
  title: 112,
  heading: 80,
  subheading: 48,
  hud: 60,
  hudLabel: 24,
  chip: 42,
  body: 34,
  small: 24,
} as const;

// Which family each size uses. Anton has one weight, so it is never bolded.
// The HUD's captions are technical detail, so they set in IBM Plex Mono (M10b).
export const FONT_ROLES: Readonly<Record<keyof typeof FONT_SIZES, 'display' | 'mono'>> = {
  lockup: 'display',
  lockupSub: 'display',
  title: 'display',
  heading: 'display',
  subheading: 'display',
  hud: 'display',
  hudLabel: 'mono',
  chip: 'mono',
  body: 'mono',
  small: 'mono',
};

// Outlined text (outlinedStyle() in src/scenes/text-styles.ts): the stroke
// width per size, px. Half of it lies outside the letters.
export const TEXT_OUTLINE: Readonly<Record<keyof typeof FONT_SIZES, number>> = {
  lockup: 24,
  lockupSub: 10,
  title: 16,
  heading: 14,
  subheading: 10,
  hud: 10,
  hudLabel: 6,
  chip: 8,
  body: 9,
  small: 7,
};

// Fractions of GAME_HEIGHT.
export const SCREEN_LAYOUT = {
  capsWarningY: 0.07,
  shiftCalloutY: 0.12, // above the wall while it is far enough away to shift
} as const;

// Debug overlay (PLAN.md §8), toggled with F2: top-left corner, px.
export const DEBUG_OVERLAY = { x: 12, y: 12, padding: 10 } as const;

// The screens (M11), in the play screen's language: cards, buttons, dark
// cards and the bar's line on the grid stage. px; scales are depths on the
// stage.
// Buttons (PromptButton, M11 review 2): lime key cap shapes `height` px tall,
// padX each side of their Anton text, the top-left and bottom-right corners
// cut by `cut`, in a cream edge edgeWidth px thick all round, pulsing in size
// (PROMPT_PULSE_*). Every screen sets its button gapAbove px below what comes
// before it, and a hint's middle hintBelow px below the button's.
export const PROMPT_BUTTON = { height: 78, padX: 30, cut: 16, edgeWidth: 5, gapAbove: 56, hintBelow: 72 } as const;
// A hint over the cream runway (the tutorial's Start) sits on a small dark
// card, `height` px tall, padX each side of its words, its corners cut by
// `cut`, edged like the dark cards (DARK_CARD).
export const HINT_CARD = { height: 44, padX: 18, cut: 10 } as const;
// Headings (HOW TO PLAY, PAUSED): Anton on a card slanting both ways, one
// size on every screen (M11 review 2), `height` px tall with padX beside the
// word.
export const HEADING_CARD = { height: 96, padX: 40 } as const;
// Dark cards (drawDarkCard(): the title, the how-to steps, the game-over
// results): cut like the key caps by `cut`, in an edge edgeWidth px thick.
export const DARK_CARD = { cut: 20, edgeWidth: 2 } as const;
// Title (M11 review 5, Option 2 of the user's title concepts, TitleLockup and
// src/logic/title-lockup.ts): SHAPE large (FONT_SIZES.lockup) in cream over
// SHIFT (FONT_SIZES.lockupSub) in lime (M11 review 6), in Anton, leaning
// `lean` px across per px up (the badges' lean, BADGE.slant / BADGE.height),
// on a dark card padX and padY round the lockup's reach, lit like a wall
// (M11 review 6): the wall panel's glow inside its edge (WALL_DISPLAY) and a
// lime bloom outside it, blurred `bloom.blur` px, at most `bloom.alpha`.
// SHIFT sits lineGap below SHAPE with its right edge on the E's leaning
// right edge. The bar's line (drawBarLine(), motifScale times the bar's
// size) starts with its slashes under the S, reaching as far left as the S
// does, steps down to the height of the top of SHIFT's S's lower tail
// (sTerminal, in ems above the baseline, read from Anton's outline), runs
// lowRun px on, and stops stepGap short of SHIFT. The card and the Click to
// play button below it are centered on the screen as one block.
export const TITLE = {
  lean: 24 / 92,
  lineGap: 14,
  padX: 48,
  padY: 40,
  stepGap: 22,
  lowRun: 28,
  motifScale: 1.5,
  sTerminal: 658 / 2048,
  bloom: { blur: 24, alpha: 0.35 },
} as const;
// The interactive tutorial (the Play scene's tutorial mode, after the title):
// one step at a time on a dark card by what it is about
// (src/logic/tutorial-layout.ts), card.width wide (step 1's, beside the
// runway, sideWidth), marginX from the screen's side when at one. Step 1's
// top is lineUpTop, beside the runway's far end where the wall waits; step
// 2's foot is holdGap above the letter bar; step 3's top is scoreTop,
// between the HUD's cards. Inside, padX from its left: the step's number,
// its name and any keys centered on titleY (numberGap and keyGap apart),
// then its text from textY down, wrapped to the card (lineHeight a line),
// with room between the two (a review asked for more), and padBottom under
// it. Each card fades out over fadeMs before the next fades in.
// The Enter-to-skip hint sits on skipY, right-aligned marginX from the edge,
// its key skipGap before its words. In step 3 the Start button waits
// continueLockoutMs, long enough for the cleared wall's completion to play
// out, then for every key to be let go (RestartGate); the HUD fades in over
// hudFadeMs as it starts, and the Caps Lock warning moves from the top
// band, which step 3's card takes, to capsWarningY, under the card. ms and
// px.
export const TUTORIAL = {
  card: { width: 600, sideWidth: 400, padX: 26, titleY: 36, textY: 76, lineHeight: 31, padBottom: 16 },
  marginX: 24,
  lineUpTop: 104,
  holdGap: 10,
  scoreTop: 12,
  fadeMs: 200,
  numberGap: 14,
  keyGap: 18,
  skipY: 52,
  skipGap: 12,
  continueLockoutMs: 1600,
  hudFadeMs: 300,
  capsWarningY: 163,
} as const;
// After the tutorial: READY? for readyMs, then 3, 2, 1, stepMs each, then the
// first wall comes and the music starts with it. One step is a beat of the
// track's 90 BPM, so the track comes in on the beat. The count sits on a
// badge (BADGE) centered on y, where the first wall will appear. ms and px.
export const READY_COUNT = { readyMs: 1333, stepMs: 667, y: 214 } as const;
// Labeled key caps (keycap.ts): height px tall, padX each side of their
// label.
export const KEY_CAP = { height: 50, padX: 14 } as const;
// The splash before the title (SplashScene): Sleepy Sam turned angleDeg to
// lie on his side, at imageScale, centered on imageY, fading in over imageFadeMs and
// floating floatPx up and down, floatMs each way; A SLEEPYSAM GAME (in the
// subheading size) centered on textY, fading in over textFadeMs after textDelayMs. It leaves after
// leaveMs (or on a click or a key), dissolving through the void's color
// over fadeMs each way into the title. px, degrees and ms.
export const SPLASH = {
  imageY: 320,
  imageScale: 0.7,
  angleDeg: -90,
  floatPx: 10,
  floatMs: 1400,
  imageFadeMs: 400,
  textY: 430,
  textDelayMs: 600,
  textFadeMs: 900,
  leaveMs: 4600,
  fadeMs: 400,
} as const;
// The title's sound switch (MuteToggle): a key cap track `width` by
// `height`, marginX from the right edge and `top` from the top (the HUD's
// corner), in a cream edge edgeWidth px thick, with two slots `knob` px
// across, knobInset from its ends: the knob over the one in force, sliding
// over slideMs, its speaker (and the other slot's) drawn in lines
// iconLineWidth px thick.
export const MUTE_TOGGLE = {
  width: 92,
  height: 48,
  marginX: 24,
  top: 18,
  edgeWidth: 2.5,
  knob: 38,
  knobInset: 5,
  slideMs: 140,
  iconLineWidth: 2.5,
} as const;
// Pause: a veil over the game, the PAUSED heading centered on headingY, and
// the Click to resume button below it.
export const PAUSE = { veilAlpha: 0.8, headingY: 260 } as const;
// Game over (M11 review 4), after the user's mock: one dark card in a lime
// edge, cardHeight tall and at least minCardWidth wide (wider for a long
// score), centered on the screen with Play again and its hint below it, the
// three centered down the screen as one block. Inside, every row sits padX
// in from the card's left, centered on its y from the card's top: GAME OVER,
// a lime rule ruleWidth thick across the card on ruleY, the SCORE caption
// and this run's score, the bar's line on barY (the slashes, then a run of
// barRun px before it steps down), and the WALLS CLEARED caption and the
// count, set at the HUD's number size so the rows have room to breathe.
export const GAME_OVER = {
  cardHeight: 464,
  minCardWidth: 520,
  padX: 44,
  rows: { headingY: 67, ruleY: 122, scoreCaptionY: 156, scoreY: 227, barY: 311, wallsCaptionY: 358, wallsY: 407 },
  ruleWidth: 2,
  barRun: 56,
} as const;

// Key caps in the bar, px. The current prompt sits in the center; held
// letters line up to its left, the most recent nearest the center, and to its
// right come the next-letter preview and then slipped letters, in queue
// order, `gap` apart. Letters flow right to left: a chip that changes place
// slides there over slideMs. A newly held chip pops from popScale. A dropped
// (slipped) one, once at its new place in line, shows its held green in a red
// edge (drop.edgeWidth) and shakes drop.px either way, drop.swings times over
// drop.shakeMs, then settles to the faded white of a letter waiting its turn
// over drop.settleMs (just the edge and the fade, for reduced motion). Each
// cap is a square with its top-left and bottom-right corners cut by `cut`;
// the current one has a lime frame focusGap outside it.
export const CHIP = {
  size: 68,
  currentSize: 88,
  gap: 20,
  cut: 10,
  focusGap: 4,
  focusWidth: 2.5,
  slideMs: 140,
  popScale: 1.2,
  popMs: 220,
  drop: { edgeWidth: 4, px: 7, swings: 4, shakeMs: 360, settleMs: 300 },
} as const;

// The bar along the bottom (PromptTray), below the runway, after the mockup:
// a dark band whose key caps sit in a row rowY px below its top, wide enough
// for MAX_LETTERS held caps beside the current one, plus padX. A thin line
// runs along its foot, low (lowY from the bar's top) under the caps, stepping
// up over `ramp` px to highY beyond them, from lineFromX on the left to
// lineEndInset from the right edge (drawBarLine(), which the game-over card
// shares), with lime slashes (SLASH) at its left end; at its right end, one
// square per letter of the wall, lit as each is held. A faint
// socket marks the current cap's slot. A faint tint of the void's light runs
// tintHeight px down from its top, at most tintAlpha. px.
export const TRAY = {
  tintHeight: 44,
  tintAlpha: 0.7,
  rowY: 50,
  padX: 22,
  lineWidth: 1.5,
  lineAlpha: 0.75,
  lowY: 104,
  highY: 88,
  ramp: 14,
  lineFromX: 88,
  lineEndInset: 24,
  squares: { size: 13, gap: 8, rightX: 24, y: 66 },
  socketWidth: 1.5,
  socketAlpha: 0.45,
} as const;

// The "//" slashes of the HUD and the bar: parallelograms `width` px wide,
// `gap` apart, leaning `lean` px over a height of `height` px.
export const SLASH = { width: 9, gap: 7, lean: 14, height: 26 } as const;

// The outlined Shift arrow on capital chips, in the top-right corner. Size and
// inset are fractions of the chip, sized to clear even wide capitals (W, M).
export const SHIFT_MARK = { size: 0.25, inset: 0.07, lineWidth: 2 } as const;

// Buttons pulse in size, not alpha, so their contrast never drops.
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

// Art (PLAN.md §10, M10b): a cream runway on a dark grid stage, a wall that is
// a dark glass display panel in neon lime with a cutout, cream HUD cards and
// a line-art bar with lime accents. Everything is drawn in code.
// The grid stage (GridVoid), after the mockup: the floor's grid runs in the
// stage's perspective, continuing the runway's lanes and tile rows back to a
// back wall at the runway's far end, where the walls appear, and the back
// wall's square grid carries the same lanes up the screen. They meet at a
// glowing lime seam. Depths are 1/scale, as for the runway's tiles.
// - Floor lines brighten from floorAlpha[0] at the screen's foot to [1] at the
//   seam, the lines toward the vanishing point in pieces fadeStep longer than
//   the last; back wall lines dim from wallAlpha[0] at the seam to [1] at the
//   top, with lime dots dotSize px at their crossings (at most dotAlpha).
// - Light rises toward the seam (voidGlow, at most lightAlpha), with a round
//   glow behind the wall; the seam is a lime line seamWidth px thick in a
//   bloom bloomAbove px above it and bloomBelow px below, at most bloomAlpha.
// - The floor drifts toward the camera one tile row every driftMs, with a slow
//   wave of light through its rows: a crest every wave.rows rows, passing a
//   row every wave.ms, dimming the rows between by up to wave.dip.
// - The composition (src/data/void-art.ts) is fixed. The back wall's lit
//   cells breathe, their alpha swinging by `breathe` of itself over
//   breatheMs in a wave that sweeps across the screen (one cycle per
//   sweepPx). The squares fall (M10b review 3): each runs down its column
//   from fall.fromY to the seam over its own cycle, fading in over the first
//   fall.fadeIn of it and out over the last fall.fadeOut, with a trail
//   fall.trail times its size above it at most fall.trailAlpha. Each tone
//   has its alpha; a reflecting square shows on the floor, mirrored in the
//   seam, reflectLength px long at reflectAlpha, so square and reflection
//   meet there as both fade. The floor's streaks run down from the seam and
//   fade the same way, lime at most streakAlpha.
// Still for reduced motion.
export const VOID = {
  floorAlpha: [0.16, 0.55] as readonly [number, number],
  wallAlpha: [0.42, 0.05] as readonly [number, number],
  dotSize: 2,
  dotAlpha: 0.55,
  lineWidth: 1,
  fadeStep: 0.15,
  lightAlpha: 0.85,
  glow: { width: 1100, height: 380, alpha: 0.45 },
  seamWidth: 2,
  bloomAbove: 50,
  bloomBelow: 36,
  bloomAlpha: 0.2,
  driftMs: 9000,
  wave: { rows: 12, ms: 900, dip: 0.45 },
  breathe: 0.35,
  breatheMs: 5200,
  sweepPx: 520,
  fall: { fromY: 26, fadeIn: 0.18, fadeOut: 0.32, trail: 3, trailAlpha: 0.3 },
  tones: { dim: 0.32, mid: 0.7, bright: 0.95 },
  reflectLength: 70,
  reflectAlpha: 0.22,
  streakAlpha: 0.3,
} as const;
// Cards (drawCard() in src/objects/card.ts), after the mockup's HUD: cream,
// the straight side's corners cut by `cut`, the slanted side running `slant`
// px inward over the card's height, and SLASH-shaped lime slashes beside it,
// slashGap px out, the first full height and fading to deep green toward its
// foot. These are for a card `height` px tall (the HUD's); a taller or
// shorter card scales them all, so every slant keeps one angle. (Until M11
// review 2 a sage fold lay inside the slanted side's foot.)
export const CARD = {
  height: 108,
  cut: 9,
  slant: 52,
  slashGap: 9,
  slashSlices: 12,
} as const;
// HUD: SCORE top-left and WALL top-right on cards (CARD), their slanted sides
// facing the middle. The card grows with its number from minWidth. A changed
// number counts up over countMs and pops from popScale. px and ms; label and
// value y are from the card's top.
export const HUD = {
  marginX: 24,
  top: 18,
  height: CARD.height,
  minWidth: 236,
  padX: 26,
  labelY: 8,
  valueY: 28,
  countMs: 380,
  popScale: 1.14,
  popMs: 220,
} as const;
// The runway: cream with thin cream-gray seams along the lanes and across it,
// its tile rows shading toward the deeper cream into the distance (up to
// farShade at the far end), and glowing lime lines down its sides: a line
// edgeWidth px thick in a glow of wider, fainter strokes (edgeGlow). Cross
// seams are evenly spaced in 1/scale, so they bunch up into the distance like
// real tiles, and are cut so the figure's plane runs through the middle of a
// row: the figure stands centered on its lane's tile
// (src/logic/perspective.ts). tileDepth is in 1/scale.
export const FLOOR = {
  seamWidth: 1,
  tileDepth: 0.2,
  farShade: 0.55,
  edgeWidth: 2.5,
  edgeGlow: [
    { width: 16, alpha: 0.08 },
    { width: 8, alpha: 0.18 },
  ],
} as const;
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
// The wall's face (M10b review 4, the display panel picked from the wall
// directions in design-mocks/): dark glass shading from panelTop to panelFoot,
// lined on the figure's own cells (CELL_SIZE), so its grid runs along the
// hole's edges and follows the hole when a Shift Wall slides it. Grid lines
// gridWidth px at gridAlpha, lime dots dotSize px square at their crossings
// at dotAlpha, a scanline every scanEvery px at scanAlpha, and a lime glow
// glowDepth px deep inside every edge, at most glowAlpha (lowered in M11
// review 6; the title card glows the same). px at full scale.
export const WALL_DISPLAY = {
  gridWidth: 1,
  gridAlpha: 0.55,
  dotSize: 3,
  dotAlpha: 0.45,
  scanEvery: 3,
  scanAlpha: 0.3,
  glowDepth: 18,
  glowAlpha: 0.25,
} as const;
// The wall's neon (M10b review 4), px at full scale: a lime frame round the
// panel and an equally thick lime edge round the hole, each centered on the
// edge it follows. Nothing else is drawn over the panel.
export const WALL_FRAME_WIDTH = 3;
export const HOLE_EDGE_WIDTH = 3;
// A new wall fades in at the runway's far end over this, ms.
export const WALL_APPEAR_MS = 200;
// The completion, the signature moment (M10b review). On a pose lock the
// wall rushes to the figure over LOCK_RUSH_DURATION, where its hole and the
// figure's pose line up exactly. Then the figure's cells light up lime, row
// by row from the feet up, over pixelMs, like the panel's own pixels; the
// panel fills back in over them over restoreMs while a lime trace of the
// silhouette fades over traceMs; the whole panel holds for holdMs; and the
// wall leaves, growing to exitGrow and fading over exitMs. The figure itself
// never changes: the pixels are drawn over it, and go with the wall.
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

// Audio (PLAN.md §10, M9): every sound effect is synthesized with Web Audio,
// and the music is the one sound file. Gains are 0-1 under `master`; Hz for
// pitches, ms for times; pan runs -1 (left) to 1 (right). A sound's `wave` is
// an oscillator type, or 'pulse' for a chiptune pulse wave of `pulseDuty`.
export const AUDIO = {
  master: 0.5,
  // The music plays through each run and stops, fading over stopMs, as the
  // wall hits. The track is mastered loud (about -9 LUFS, peaking at full
  // scale), so it sits well under the effects: 0.3 under master is about
  // -25 LUFS, peaking near the key click.
  music: { gain: 0.3, stopMs: 100 },
  // Game over: the same track "after the show", slowed (rate, which lowers
  // it about 4 semitones), muffled (a lowpass at cutoffHz), with an echo
  // (each repeat echo.ms after the last, at echo.feedback of its level). It
  // fades in over fadeInMs as the screen shows, under the end of the whomp,
  // and stops (stopMs) on restart. Picked from rendered options.
  gameOverMusic: { gain: 0.24, rate: 0.8, cutoffHz: 1200, echo: { ms: 300, feedback: 0.35 }, fadeInMs: 1000 },
  // The title and tutorial music, "Standby", picked from rendered options:
  // an ambient loop drawn in code, in the track's key and tempo but with none
  // of its notes or sounds (its chords and bells are in src/data/standby.ts).
  // It is rendered once at boot, then looped, at about -27 LUFS, a little
  // under the game music; it fades in over fadeInMs. Each pad chord note is
  // detuned saws, and it and the bass swell (src/logic/standby-schedule.ts):
  // in from leadInMs before their chord over attackMs, out over releaseMs
  // from leadInMs before it ends. The pad's lowpass breathes cutoffHz ±
  // breatheHz over breatheBars. A bell is sine partials as [ratio, level],
  // dying away over decayMs. `reverb` and `echo` are send levels; the echo
  // repeats every echo.beats at echo.feedback, into the reverb at
  // echo.reverb, and the reverb is reverb.seconds of decaying noise mixed in
  // at reverb.wet.
  standby: {
    gain: 0.61,
    fadeInMs: 1000,
    bpm: 90,
    chordBars: 2,
    pad: {
      level: 0.22,
      detuneCents: [-14, -5, 5, 14],
      pans: [-0.35, -0.12, 0.12, 0.35],
      leadInMs: 600,
      attackMs: 1200,
      releaseMs: 1400,
      cutoffHz: 750,
      breatheHz: 450,
      breatheBars: 2,
      reverb: 0.5,
    },
    bass: { level: 0.14, octaveLevel: 0.2, leadInMs: 300, attackMs: 600, releaseMs: 900 },
    bells: {
      level: 0.18,
      partials: [
        [1, 1],
        [2, 0.3],
        [2.76, 0.12],
        [5.4, 0.04],
      ],
      attackMs: 4,
      decayMs: 1800,
      pan: 0.3,
      reverb: 0.6,
      echo: 0.55,
    },
    echo: { beats: 0.75, feedback: 0.4, reverb: 0.5 },
    reverb: { seconds: 3, wet: 0.35 },
  },
  // The music's key, measured from the track: C minor (it leans on C, Eb, F,
  // G and Bb, at 90 BPM). The effects heard over it keep to its pentatonic
  // scale, in semitones above C, so they sit in the music.
  key: { rootHz: 261.63, scale: [0, 3, 5, 7, 10] },
  pulseDuty: 0.25,
  // Countdown: silent until the wall is in CLOSE CALL range (past GREAT_T),
  // then a clock ticks and tocks, faster as t nears 1. It replaced an
  // approach rumble after the M9 playtest. Tick C7, tock G6.
  tick: { gain: 0.22, fromT: GREAT_T, startMs: 420, endMs: 110, tickHz: 2093, tockHz: 1568, ms: 25 },
  // Each held letter clicks a step higher than the last, up the key's scale
  // from C5. A pulse is brighter than the triangle it replaced, so it is a
  // little quieter (0.3 before).
  click: { gain: 0.22, baseHz: 523.25, wave: 'pulse', ms: 50 },
  // A slip: a quick cartoon "bloop" deflating, with a wobble.
  slip: { gain: 0.35, fromHz: 700, toHz: 160, ms: 240, wobbleHz: 14, wobbleDepthHz: 30 },
  // PERFECT: a quick C minor arpeggio up to the octave, the last note held.
  // Its notes are 32nds at the music's 90 BPM. (A C major arpeggio, 90 ms
  // apart, until the music came: its E clashed with the track's Eb.)
  fanfare: { gain: 0.22, rootHz: 523.25, semitones: [0, 3, 7, 12], wave: 'pulse', noteMs: 83, lastMs: 360 },
  // The count into the first wall: a short beep on each of 3, 2, 1 (G5) and a
  // longer, higher one (C6) as the wall appears, on the pulse wave.
  ready: { gain: 0.22, wave: 'pulse', hz: 783.99, ms: 120, goHz: 1046.5, goMs: 320 },
  // Shift Wall warning: rising chirps from the side the hole is moving to,
  // C5 to C6, then a whoosh that way as it slides.
  shiftAlert: { gain: 0.28, fromHz: 523.25, toHz: 1046.5, chirps: 2, chirpMs: 90, gapMs: 120, pan: 0.7 },
  whoosh: { gain: 0.22, fromHz: 400, toHz: 2400, ms: 220, pan: 0.7 },
  // The wall hits the figure, at once: a thump on the chip bass voice under a
  // short smack of crunchy 8-bit noise (white noise held smackCrushHz times a
  // second). The thump stays above ~80 Hz so laptop speakers still play it.
  // (A sine thump and a smooth noise smack until the music came; a crowd
  // "oooh" after it was cut after the second M9 playtest.)
  hit: { gain: 0.9, wave: 'triangle', fromHz: 300, toHz: 80, ms: 200, smackGain: 0.45, smackMs: 110, smackCrushHz: 8820 },
  // The figure lands: "whomp whomp whooom", in the chip voices and the
  // music's key: G3, Eb3, C3 (semitones from rootHz) on the pulse wave, each
  // over the triangle an octave down. Each note bends down into its pitch
  // from bendSemitones above over bendMs, holds until holdShare of its
  // length, then fades; the last one is long, wobbles (vibratoDepth of its
  // pitch) and sags. Picked from rendered options. (Until then a sawtooth
  // "sad trombone", G3, F#3, F3, each note with a filter "wah"; it replaced a
  // water splash sound after the third M9 playtest.)
  whomp: {
    gain: 0.3,
    wave: 'pulse',
    subWave: 'triangle',
    rootHz: 196,
    semitones: [0, -4, -7],
    noteMs: 260,
    gapMs: 320,
    lastMs: 950,
    holdShare: 0.55,
    bendSemitones: 1,
    bendMs: 60,
    sagSemitones: 2,
    vibratoHz: 6,
    vibratoDepth: 0.025,
  },
} as const;

// The timing label over the figure, px and ms.
export const LABEL_Y = 270; // keeps its place over the figure's head
// Badges (M10b review 4, when outlined text was lost against busy walls):
// the timing label and the SHIFT callout sit on parallelograms `height` px
// tall leaning `slant` px across it, padX each side of their text, in an ink
// edge edgeWidth px thick all round. The timing label's points sit on an ink
// tab tabHeight px tall (tabPadX each side), tucked tabOverlap px under its
// card, and its grade's two slashes stand slashGap px off its right edge.
// Their text is centered on its letters (centerGlyphs()). px.
export const BADGE = {
  height: 92,
  slant: 24,
  padX: 24,
  edgeWidth: 4,
  tabHeight: 46,
  tabPadX: 16,
  tabOverlap: 4,
  slashGap: 10,
} as const;
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
