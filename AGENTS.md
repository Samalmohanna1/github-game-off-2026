# AGENTS.md

Project context and working rules for every agent and contributor in this repo.
This file is the source of truth for architecture, coding standards, validation,
and Git workflow. Follow these requirements on every change. Re-read this guide
when in doubt; keep shared instructions here and keep CLAUDE.md as a pointer.

---

## What this is

SHAPE SHIFT is a browser game for GitHub Game Off 2026, whose theme is
**SHIFT**. It is a keyboard take on Japan's "Human Tetris". A wall with a hole
cut in it comes toward the player. They slide a block figure under the hole
with Space, which steps it one lane toward the hole, then hold a growing set of letter keys (Shift for capitals) to pose
the figure so it fits through. If it doesn't fit, the wall knocks the figure
over. It ships on itch.io as an HTML5 game, played on a desktop
keyboard.

Current state: **Week 2**, built one milestone at a time (PLAN.md §10). The
Week 1 prototype (M0–M7), the M8 feel pass, the M9 synthesized audio, the
M10 art for the play screen and the M10b grid void restyle are done. The
palette and fonts come from design mocks kept outside the repo
(`../design-mocks/`). Everything is drawn in code except the wall images,
which are files dropped into `src/assets/walls/` (none ship yet). The title
and game-over screens get their layouts from the mocks in M11.

Scenes, one per screen:

| Scene | Status | Contents |
|---|---|---|
| `BootScene` | Final (M10b) | Loads the wall images (`WALL_IMAGES`, leaving out any that fail), waits for the bundled fonts (`loadFonts()`, giving up after `FONT_LOAD_TIMEOUT`), then hands off to Title. |
| `TitleScene` | Interim | Game name, one-line how-to, "Click to play". The click gives the page keyboard focus inside the itch.io iframe. It already uses the M10 palette and fonts; its layout from the mocks comes in M11. |
| `PlayScene` | Interim (M10b) | The full Week 1 loop, driven by the difficulty curve (`planWall()` per wall: letter count, stretch range, Shift letters, wall time, hole distance, Shift Wall roll). A wall approaches with a hole cut from the poses (`wall-gen.ts`). Space lines the figure up, one lane toward the hole per press (during a Shift Wall's warning, toward the lane it is about to slide to); the arrow keys don't move it; the tray then prompts the wall's stretch-scored letters one at a time, and each held letter snaps its block into the target pose. Slips, wrong keys and the Shift rule follow PLAN.md §2. On a Shift Wall (wall 4+), the wall stops behind a SHIFT callout, turns orange with an arrow, and the hole slides 1 lane with a sideways jolt while the new lane's tile is marked on the floor; then the wall carries on; held letters stay, and new ones wait until the figure lines up again. All letters held while lined up locks the pose: the hole flashes lime and the wall's image completes, the wall rushes past, opening its hole again as it reaches the figure while a lime pulse marks the pass, a PERFECT / GREAT / CLOSE CALL label pops over the figure, and the next wall fades in. Held blocks land with a squash, slipped ones slump back limp, a wrong key rattles the wall, and a CLOSE CALL plays the rush in slow motion. If the wall arrives first, it knocks the figure over: it topples toward the camera with its arms flailing, and its blocks come apart and bounce to a stop on the floor before the run ends. Synthesized sounds (M9) play over all of it: the countdown tick in CLOSE CALL range, clicks, slips, the PERFECT fanfare, the Shift Wall alert and whoosh, and the fail's hit and "whomp whomp whooom". Capital chips carry a Shift mark, a warning shows while Caps Lock is on, and losing focus pauses behind a "Click to resume" veil. F2 toggles the debug overlay. Everything is drawn in the M10b art, a minimal sci-fi grid void: a near-black void lit along a clear horizon, with a perspective ground grid that drifts toward the camera, squares that fade in and out and a few lime pixels; a clean cream runway of faintly varied tiles with thin seams and a charcoal outline, where the figure stands centered on its lane's tile and the lined-up tile lights up; walls that are image panels in a cream frame with a see-through cutout edged in lime on ink (plain forest green with no image); black blocks with cream seams between their cells and a cream edge; a centered console of angular key caps; SCORE and WALL on angular near-black panels with lime accents in the top corners; and every label over the scene in bright letters inside a thick dark outline. No texture anywhere. |
| `GameOverScene` | Interim | Walls cleared, score, best (saved in `localStorage`) and the wall reached. Restart follows PLAN.md §7: input is ignored for `RESTART_LOCKOUT`, then every key must be up ("Let go of every key" shows meanwhile) before a key or click restarts. |

Shared scene helpers live in `src/scenes/` (`ui.ts`, `text-styles.ts`,
`scene-keys.ts`). Game objects live in `src/objects/`: `GridVoid`, `Floor`,
`LaneTiles`, `Wall`, `Figure`, `PassPulse`, `PromptTray`, `Hud`,
`TimingLabel`, `ShiftCallout`, `PauseOverlay` and `DebugOverlay`, plus the
`drawPanel()` helper for the angular UI panels. The wall images live in
`src/assets/walls/`. The best score lives in `src/storage/`. Keyboard input lives in `src/input/`:
`KeyboardInput` (native listeners, one per Play scene) and
`preventPageScroll()` (game-wide, from `main.ts`).

The stage uses a single vanishing point, so a depth is just a scale toward it
(`project()` in `src/logic/perspective.ts`). Scale 1 is the figure's plane.
The wall is drawn once at full size around the vanishing point, and setting
its scale places it at any depth.

## Companion docs (source of truth)

- **[PLAN.md](./PLAN.md)**: the game design and build plan. It covers the core
  loop, input rules, stage layout, letter generation, difficulty, scoring,
  tuning constants and milestones. Read the current milestone and every
  section it touches before starting it. Design changes need the user's
  approval first.
- **[README.md](./README.md)**: setup, commands, tests, build and the itch.io
  upload.
- **[CLAUDE.md](./CLAUDE.md)**: a pointer to this file for Claude Code, which
  loads CLAUDE.md automatically. Don't put rules in it.

Keep AGENTS.md, PLAN.md, and README.md **in sync with reality**. When a change
makes any of them stale (new scene or game object, new dependency, removed
file, changed command, new tuning constant group, new deploy step), updating
the doc is **part of that change, not a follow-up**.

---

## Stack & architecture

- **Engine:** Phaser 4 with the WebGL renderer, 1280×720, `Phaser.Scale.FIT`,
  centered. The game is a single canvas; `index.html` only hosts it. Any UI
  framework or second engine needs justification before adding.
- **Build:** Vite, with `base: './'` so `dist/` runs from any subfolder
  (itch.io serves games from one).
- **Tests:** Vitest, for game rules and config. See Testing.
- **TypeScript strict** (TypeScript 7). `tsconfig.json` also turns on
  `noUncheckedIndexedAccess`, `noUnusedLocals` and `noUnusedParameters`.
- `@/` path alias maps to `src/`. It is defined twice and the two must match:
  `paths` in `tsconfig.json` and `resolve.alias` in `vite.config.ts`.
- **Pure logic.** Game rules (the prompt / held / slip sequence, letter
  generator, difficulty curve, wall generation, scoring) live in `src/logic/`
  as plain TypeScript with no Phaser imports. `src/data/` and `src/config.ts`
  are pure too, and none of them may import from `scenes/`, `objects/` or
  `input/`. Scenes and game objects only draw the state and pass input in.
  `tests/purity.test.ts` enforces this.
- **Tuning lives in `src/config.ts`.** Every tunable number goes there:
  timings, sizes, layout, colors, difficulty. Scenes and objects never
  hard-code values. Values derived from config (`GAME_WIDTH / 2`) are fine.
- **Keyboard input follows PLAN.md §2 exactly.** Letters come from native
  `keydown` / `keyup` listeners on `window`, not Phaser key objects.
  `event.key` decides the letter and its case at press time, `event.code`
  tracks which keys are held, `event.repeat` is ignored, and arrows and Space
  get `preventDefault()` on every screen (`src/input/prevent-page-scroll.ts`).
  Space is the only move; the arrows no longer move the figure, but still
  never scroll the host page, and like other non-letters never count as a
  wrong key.
- **Art:** drawn in code with Phaser shapes and Graphics, except the wall
  images. M10b is a minimal sci-fi grid void with an editorial edge (PLAN.md
  §1, §3): a dark perspective grid, a cream runway, walls that are image
  panels with their hole cut out, and angular near-black UI with lime
  accents. Clean edges and no texture. The figure stays the same five blocks
  and pose data, styled as in M10, and is never restyled without the user
  asking. Decoration has to earn its place and keep clear of play: the
  background stays atmospheric and must never compete with the wall, the
  figure or the prompts. (M10 was an editorial collage with torn paper at
  the background's edges and a paper-grain filter, both dropped in M10b.)
- **Wall images** are files in `src/assets/walls/` (PNG, JPEG or WebP).
  `src/data/wall-images.ts` finds them with Vite's `import.meta.glob`, so
  adding one needs no code change; BootScene loads them, and the walls deal
  them from a `ShuffleBag`. Never generate or ship substitute wall imagery:
  the user supplies the images, and with none the walls are plain panels.
- **Fonts:** Anton and IBM Plex Mono, bundled from `@fontsource` (latin
  subsets, imported in `src/main.ts`). Never load fonts from the network.

### Project layout

```text
index.html                 # host page; #game is the Phaser parent
package.json               # scripts + exactly pinned dependencies
tsconfig.json              # strict TS, @/ paths
vite.config.ts             # base './', @/ alias, Vitest config
.gitattributes             # LF line endings in the repo
AGENTS.md                  # this file
CLAUDE.md                  # pointer to AGENTS.md for Claude Code
PLAN.md                    # game design + milestones
README.md                  # setup, commands, deploy
src/
  main.ts                  # Phaser game config + scene list
  config.ts                # every tunable number (PLAN.md §8), palette and fonts
  assets/
    walls/                 # the wall images, any PNG/JPEG/WebP; README.md says how to add one
  audio/
    Synth.ts               # Web Audio sounds, no files: tick, click, slip, fanfare, Shift alert, hit, whomp
  data/                    # PURE: static game data
    keyboard.ts            # QWERTY row/x (with stagger), hand, finger per letter
    poses.ts               # block ids, neutral pose and alt poses on the grid
    wall-images.ts         # every image in assets/walls/, found by import.meta.glob, as load keys + URLs
  input/
    KeyboardInput.ts       # native key/blur events -> Space, letters, pause, Caps Lock
    prevent-page-scroll.ts # arrows/Space never scroll the host page
  logic/                   # PURE: no Phaser imports
    approach.ts            # t clock, wrong-key jump, ease-in, wall scale
    lanes.ts               # Space's step toward the hole, alignment, hole lane, lane x, fall direction
    dev-options.ts         # dev-server URL options: ?wall=N, ?shiftwall
    difficulty.ts          # wall # -> tier, wall time, Shift Wall roll, WallPlan
    letters.ts             # stretchScore, combo generator, ordering, capitals
    random.ts              # injectable random helpers (shuffle, pick, int)
    shuffle-bag.ts         # deals items shuffled, each once before repeats, never twice in a row (wall images)
    convex.ts              # chamfered rects (the UI's angular shapes), and where a line crosses a convex polygon
    perspective.ts         # vanishing point, project(), floor edges, tile seams + the figure's tile
    wall-shape.ts          # the wall's solid and hole rects, hole and frame edges, an image's cover fit and crops
    restart.ts             # game-over lockout + "release every key" gate
    scoring.ts             # grades, wall points, PERFECT streak multiplier
    sequence.ts            # prompt / held / slip queue state machine + lock
    shift-wall.ts          # Shift Wall trigger, warning timer, slide target, wall hold
    countdown.ts           # countdown tick timing: silent until CLOSE CALL range, then speeding up
    sound-levels.ts        # click, fanfare and whomp pitches
    wall-gen.ts            # blocks + alt poses per wall, hole grid
    tumble.ts              # the fail's fall: the figure topples, its blocks come apart and bounce to rest
  objects/
    GridVoid.ts            # the dark void: horizon glow + line, drifting perspective grid, fading squares, lime pixels
    Floor.ts               # the cream runway: varied tiles, thin seams, charcoal outline, lime spawn line
    Hud.ts                 # SCORE and WALL on angular panels in the top corners; count-up + pop
    LaneTiles.ts           # the figure's row of floor tiles: lit = lined up, target = Shift Wall's new lane
    panel.ts               # drawPanel(): an angular near-black UI panel with inner grid, edge and lime accent
    vectors.ts             # points -> Phaser Vector2s for polygon fills and strokes
    Wall.ts                # image panel with a see-through cutout edged in lime; flash + rattle, Shift warning + slide, completion
    Figure.ts              # five black blocks with cell seams + shadow; squash on snap, limp slump on slip, topple on a fail
    PassPulse.ts           # the lime frame that grows and fades round the figure as a cleared wall passes
    PromptTray.ts          # the console: held / current (in its socket) / next preview / slipped key caps
    PauseOverlay.ts        # veil + outlined "Click to resume", shown on blur
    ShiftCallout.ts        # outlined SHIFT + arrow while a Shift Wall holds
    TimingLabel.ts         # outlined PERFECT / GREAT / CLOSE CALL + points
    DebugOverlay.ts        # F2 panel: state, t, lanes, prompt, queue, held, stretch
  scenes/
    BootScene.ts           # loads the wall images, waits for fonts, hands off to Title
    fonts.ts               # loads the bundled font faces before any text is drawn
    TitleScene.ts          # "Click to play" (gets keyboard focus)
    PlayScene.ts           # the game: draws state, passes input in
    GameOverScene.ts       # run stats, best score, gated restart
    scene-keys.ts          # scene keys + RunResult handed to GameOver
    text-styles.ts         # Phaser text styles built from config tokens, plain and outlined
    ui.ts                  # pulsing prompt, reduced motion, window key events
  storage/
    best-score.ts          # best score in localStorage, every access guarded
tests/
  approach.test.ts         # t advance, wrong-key jump, ease-in, wall scale
  best-score.test.ts       # best score kept; corrupt or blocked storage
  config.test.ts           # config invariants + text and graphics contrast
  convex.test.ts           # chamfered rects; line spans across a convex polygon, either winding
  dev-options.test.ts      # ?wall / ?shiftwall parsing and fallbacks
  difficulty.test.ts       # tier table, wall time decay, Shift Wall chance, caps
  keyboard.test.ts         # all 26 letters, hand split, stagger, fingers
  lanes.test.ts            # Space steps toward the hole, hole lane, lane geometry, fall direction
  letters.test.ts          # stretchScore; per tier: range, no repeats, capitals, caps, fingers
  perspective.test.ts      # projection, floor geometry, tile seams centered on the figure
  poses.test.ts            # neutral pose fits the grid, no overlaps
  purity.test.ts           # pure modules never import Phaser
  restart.test.ts          # lockout, release-every-key, click
  scoring.test.ts          # grades, points, streak multiplier and cap, start wall
  seeded.ts                # deterministic random for repeatable tests
  sequence.test.ts         # PLAN.md §2 input rules, incl. the M3 cases + lock
  shift-wall.test.ts       # trigger, warning, hold, slide range, M6 line-up case
  shuffle-bag.test.ts      # each item once per round, no back-to-back repeats, empty and lone bags
  countdown.test.ts        # silent before CLOSE CALL range, speeds up, no catch-up bursts
  sound-levels.test.ts     # click steps, fanfare rises an octave, whomp steps down
  tumble.test.ts           # the fall lands after the hit, bounces low, never sinks, settles flat in time
  wall-gen.test.ts         # valid poses for every block set, one-piece holes, hole grid
  wall-shape.test.ts       # solid + hole rects tile the wall, edges skip the floor, cover fit and crops
```

Everything in PLAN.md §9's layout now exists, plus the F2 debug overlay. Add
new files to this tree when they land.

Where things go: rules, and the pure math they depend on (the `t` clock,
perspective, the fail's tumble, the wall's shape) → `src/logic/`. Static game data such as the keyboard map and
pose tables → `src/data/`. Numbers you'd tweak while tuning →
`src/config.ts`. Wall images → `src/assets/walls/`. Browser storage →
`src/storage/`, with every access guarded.
Anything that draws or listens → `scenes/`, `objects/` or `input/`.

---

## Coding conventions

Apply these standards to every code, configuration, script, and documentation
change. Follow the existing architecture, naming, formatting, and tooling;
resolve conflicts before proceeding instead of silently bypassing a rule. Keep
changes focused, maintainable, typed, accessible, and appropriately validated.

- **TypeScript strict.** No `any` / `@ts-ignore` unless there's a written
  justification on the same line. The build fails on type errors; don't paper
  over them. Validate at boundaries (browser events, `localStorage`, data
  passed between scenes); trust internal types.
- **No comments unless the WHY is non-obvious** — a hidden constraint, a
  workaround, surprising behavior. Don't explain WHAT the code does. Units on
  tuning constants (`// ms`) count as a WHY. No `TODO`s without an owner.
- **DRY.** Extract a shared helper or game object _before_ the second copy
  exists, not before the first caller does. Shared helpers exist because they
  have ≥2 callers.
- **Single responsibility.** One scene per screen. One game-object class per
  thing on screen (`Wall`, `Figure`, `LaneTiles`, `PromptTray`). Keep scenes
  thin: they wire logic state to game objects and input to logic.
- **Tokens, not raw values.** Colors, font sizes, layout and timings come
  from `src/config.ts`. If a value isn't there yet and will recur, add it there
  first, then use it. Raw hex or magic numbers in scenes are a smell; they
  defeat tuning and the Week 2 re-skin.
- **Naming:** kebab-case files for non-class modules (`scene-keys.ts`,
  `wall-gen.ts`); **PascalCase** files for classes (scenes, game objects,
  `KeyboardInput.ts`) and for types; camelCase for functions/variables;
  SCREAMING_SNAKE for constants and the tuning values in `config.ts`. Test
  files take their module's name (`tests/wall-gen.test.ts`). Descriptive names.
- **Imports:** absolute via the `@/` alias for internal modules
  (`@/config`, `@/scenes/scene-keys`), tests included; group framework
  (`phaser`) → external → internal.
- **No dead code.** No commented-out blocks, no scaffolding for unagreed
  features. Prefer deletion over deprecation.
- **No emojis** in code, comments, or commit messages unless explicitly asked.

## Dependency policy

Keep dependencies minimal. **Do not add libraries unless the current milestone
explicitly requires them.** Justify any new dependency in your message _before_
installing. Versions are pinned exactly in `package.json`.

Current intentional deps:

- `phaser`: the game engine (the only runtime dependency).
- `typescript`: type checking (`npm run check`, and the first step of
  `npm run build`).
- `vite`: dev server and production build.
- `vitest`: unit tests for game rules and config.
- `@types/node`: Node types for `vite.config.ts` and for tests that read
  source files (`tests/purity.test.ts`).

---

## Development

Requires Node `^22.12`, `^24` or `>=26` (the range Vitest 5 supports).

```
npm run dev      # Vite dev server at http://localhost:5173
```

The user playtests in their own browser, so agents don't start the dev server
unless the user asks for a visual check (see Testing). When an agent does
start it, run it as a background process and stop it when finished. On
Windows, stopping the shell can leave Vite's `node.exe` holding port 5173:
find it with `netstat -ano | findstr :5173` and end it with
`taskkill /PID <pid> /F`.

## Framework documentation

- Phaser 4: https://docs.phaser.io/ (guides and API reference). Most Phaser 3
  tutorials still apply, but check the v3 → v4 breaking changes before copying
  v3 code.
- Phaser also ships topic guides matched to the installed version in
  `node_modules/phaser/skills/<topic>/SKILL.md`. Consult the relevant one
  before related work:
  - Scenes and the scene flow: `scenes`
  - Drawing the stage, wall, figure and tray: `graphics-and-shapes`,
    `text-and-bitmaptext`
  - Motion and timing: `tweens`, `time-and-timers`
  - Canvas size and scaling: `scale-and-responsive`
  - Week 2 feel and art: `particles`, `cameras`, `audio-and-sound`,
    `loading-assets`
  - Anything adapted from a v3 example: `v3-to-v4-migration`
  - Keyboard: `input-keyboard-mouse-touch`, but letter input follows
    PLAN.md §2 (native listeners), not Phaser key objects.
- Vite: https://vite.dev/guide/
- Vitest: https://vitest.dev/

---

## Testing

The meaningful gates are **"are the game rules right"** (unit tests on pure
logic) and **"does it type-check and build clean"**. How the game feels is
judged by the user's playtests, not automated checks.

Definition of done for any milestone:

1. `npm run check` passes — zero type errors.
2. `npm test` passes. New or changed rules in `src/logic/` come with unit
   tests; PLAN.md §10 lists the cases some milestones must cover.
3. `npm run build` succeeds.
4. **Visual checks only when explicitly requested by the user.** Do not start
   the dev server, take or review screenshots, or drive a browser by default.
   Instead, tell the user how to playtest the milestone and what to look for.

Tests run in Node (`environment: 'node'`) and never import Phaser. Don't fake
unit tests for scenes or game objects; their job is drawing, which the
playtest covers.

## Design system & UX standards

- **Pull colors, type, sizes and layout from `src/config.ts`** rather than
  inventing inline values. `config.ts` is the single re-skin point.
- **One color system.** Every color is named once in `PALETTE`: the design
  mocks' swatches (cream, near-black, dark green), sage and forest from the
  M10 collage, the M10b void's near-black green and acid lime, the yellow and
  coral of the mock's logo, and darker steps of each for use on cream.
  Components use only the roles in `COLORS` and `TEXT_COLORS`, never a
  palette entry or a raw hex directly; `tests/config.test.ts` fails if a role
  isn't a palette color. Green is the signature: the void, the grid and the
  HUD are greens and near-blacks, and lime is the accent, used sparingly
  (the hole's edge, the spawn line, UI accents, held chips, PERFECT, the
  success flashes). The alerts are two families: yellow/ochre means the
  hole is moving (Shift Walls), coral/red means a mistake (wrong key, slip,
  CLOSE CALL, Caps Lock). Add a new color to `PALETTE` first, then give it a
  role.
- **Visual hierarchy (M10b).** In order: the wall's image and its cutout,
  the figure, the letter console, the HUD, then the background. The grid
  void is atmosphere only: no floating walls, architecture, collage pieces
  or large shapes, and its motion stays slow and faint. Nothing that plays
  or reads is decorated over: text over the scene is outlined instead
  (below).
- **Clean lines.** Every edge is a thin, plain straight line in its own
  role color: the runway's charcoal outline, the wall's cream frame, the
  target tile. The hole's edge is the one two-tone line, lime on a wider
  ink, because the hole is the main thing the player reads and can sit over
  any image and in front of either the void or the runway.
- **No texture (M10b).** The paper-grain filter and the torn paper are
  gone; surfaces are flat colors or the wall's image. The figure, text, the
  console and the chips stay clean, and the cutout is open, showing what is
  behind the wall.
- **Angular UI (M10b).** The HUD and the console are `drawPanel()` panels:
  a near-black face with a fine charcoal grid, a thin forest edge, a short
  lime accent bar, and 45-degree cut corners (`chamferedRect()`), set
  asymmetrically. Key caps share the cut corners.
- **Typography:** each size in `FONT_SIZES` has a role (`FONT_ROLES`): display
  sizes (title, heading, the HUD's numbers) set in Anton, which has one weight and
  is never bolded; the rest (the HUD's captions, the prompt letters and other
  technical detail) set in IBM Plex Mono, normal or bold. Prompt
  letters use `CHIP_FONT_FAMILY` (IBM Plex Mono), whose capital I has
  crossbars and can't be mistaken for a lowercase l; any future prompt font
  must keep I and l distinct.
- **Contrast: WCAG AAA preferred, AA required.** Aim for AAA — **7:1 normal
  text, 4.5:1 large text** (≥24px, or ≥18.66px bold). A color between AA and
  AAA may ship, but no text goes below **AA — 4.5:1 normal, 3:1 large**.
  Meaningful non-text graphics (the wall and its hole, the runway's lines,
  the lit tile and the target tile on the runway; held, current and slipped
  chips and the current chip's frame) need 3:1. The wall's image can be any
  color, so its cream frame (against the void and the horizon's glow) and its
  hole's edge carry its contrast: the hole shows the void and the runway, so
  its lime reads on the one and its ink on the other. The UI panels are
  close to the void, so their forest edge and lime accent set them apart.
  Lime is too light to read on cream, so a deeper green lights the lined-up
  lane's tile; the black figure is only 1.5:1 on a dark wall and less on the
  void, so its cream edge outlines it there.
  **Verify pairs, don't eyeball them**: `tests/config.test.ts` measures every
  meaningful graphic color against what it sits on, measures each text color
  against every background it is drawn on (`TEXT_ON` in that test; add new
  pairs there), and keeps every font size at 24px or more. Text that fades or
  flashes must still meet AA at its faintest frame. Text drawn over the moving
  scene (the timing label, the SHIFT callout, the Caps Lock warning, the pause
  text) is bright inside a thick `COLORS.textOutline` stroke
  (`outlinedStyle()`, `TEXT_OUTLINE`), and is measured against that outline;
  the rest sits on a chip or a UI panel (the HUD's numbers and captions).
  Record every pair below AAA, with its measured ratio, in the list below.
  - Pairs below AAA: none.
- **Keyboard first.** The game is played entirely on the keyboard, except the
  title's "Click to play", which PLAN.md §2 requires so the itch.io iframe gets
  keyboard focus. Game over restarts on any key or a click. During play, a
  warning shows while Caps Lock is on (PLAN.md §2).
- **Don't rely on color alone.** Held, current and slipped letters also differ
  by position in the tray (left, center, right; PLAN.md §3), and the next-letter
  preview is hollow where the others are filled. Show "not yet" with style,
  never with opacity: a faded chip would drop its letter below AA. Don't rely on case
  alone either: capital chips carry a drawn Shift mark (`SHIFT_MARK`). The
  Shift Wall warning is as bright as the wrong-key flash, so its arrow, not
  its amber, is what sets it apart.
- **Desktop only.** The game needs a physical keyboard. It renders at 1280×720
  and scales to fit (`Phaser.Scale.FIT`), so the HUD, the console, the runway's
  perspective and the centered figure all scale together and keep their
  places at any window size; there is no separate mobile or touch layout.
- **Motion.** Honor `prefers-reduced-motion`: the pulsing prompts and the
  grid void stay still, and the wrong-key wall rattle, the block squash, the
  limp slump, the fail's arm flail, the chips' slides, pops and wobbles, the
  HUD's pop and the pass pulse's growth are skipped under it
  (`prefersReducedMotion()` in `src/scenes/ui.ts`). Fades are not motion and
  stay. Feedback that carries meaning keeps a still alternative, such as the
  wall flash, and blocks still land in their poses at once.
- **Performance budget.** One bundle (Phaser plus game code), no third-party
  scripts, and no requests at runtime beyond the game's own files (the
  bundled fonts and wall images). The best score is the only thing stored,
  in `localStorage`, wrapped in try/catch (PLAN.md §6).

---

## Git & workflow

- **Never use worktrees.** Do all work on branches in the existing checkout,
  following the Git workflow in this file.
- **Never work on `main`.** Before the first file edit of any task, run
  `git status --short --branch` and `git branch --show-current`. Preserve
  unrelated work; never stage, discard, or overwrite someone else's changes.
- **One branch per logical change; one PR per branch.** For new work, fetch
  `origin` and branch from current `origin/main` when that remote is configured;
  otherwise branch from local `main`. Continue on the existing feature branch
  for follow-up work in the same change. Do not rebase or rewrite shared history
  without explicit authorization.
- **Branch naming:** semantic prefix + kebab-case slug, slash-separated:
  `feature/`, `fix/`, `chore/`, `refactor/`, `style/`, `test/`, `debug/`.
- **Commits:** small, focused, conventional prefix (`feat:`, `fix:`,
  `refactor:`, `chore:`, `docs:`). Don't bundle unrelated changes. Explain the
  _why_ in the body when it isn't obvious. Create new commits for follow-ups;
  never amend pushed commits.
- **No co-author or AI attribution.** Never add `Co-Authored-By` trailers,
  generated-by signatures, or AI-attribution text to commits or PRs. Use only
  the user's configured Git author identity; do not override or change it.
- **Review before committing.** Stage only the intended files or hunks. Inspect
  the complete staged diff and run `git diff --cached --check` before committing.
  Do not commit secrets, local environment files, temporary validation pages,
  debug output, or unrelated generated artifacts. Keep required generated
  outputs in sync with their source.
- **Checks are required.** Run the applicable validation below and report the
  results accurately. Do not bypass hooks, disable checks, or conceal failures
  to obtain a passing commit.
- **Don't push or merge yourself.** After checks pass, stage and commit. The
  user reviews and pushes / opens the PR unless they explicitly request more.
- **Surface the PR description in chat when a branch is ready** — full Summary +
  Test plan, ready to paste.
- **Match scope to the task.** Bug fixes don't carry cleanup; refactors don't
  sneak in features. Surface adjacent issues as a separate change.
- **Confirm before destructive ops** (`reset --hard`, force-push, `branch -D`,
  `clean -f`). Read-only investigation never needs confirmation. Never use
  `--no-verify` to bypass hooks.

## Deploy

- **Host:** itch.io, as an HTML5 game. Upload a zip of the contents of `dist/`
  (with `index.html` at the zip root) and set the embed size to 1280×720. Steps
  are in [README → Deploy](./README.md#deploy-itchio).
- **Source:** `origin` is https://github.com/Samalmohanna1/github-game-off-2026,
  the public repo for the Game Off entry.
- No CI and no automatic deploys. Uploads are manual.
- The build is fully static. Keep `base: './'` so asset paths stay relative.
  `dist/` must be served over HTTP; browsers block its module script on
  `file://`.
- Week 2 adds a fullscreen button and a check in Chrome, Firefox and Safari
  before shipping (PLAN.md §10).

---

## Milestones

Work through **PLAN.md §10** one milestone at a time.

- **Do not work ahead of the current milestone.** Don't pull a "while I'm in
  here" task from a later milestone without asking.
- Re-read the milestone and the PLAN.md sections it touches before starting it.
- When a milestone meets its "done when" check (its ✅ line), **stop**. Tell the
  user how to playtest it and what to look for, then wait for their go-ahead
  before starting the next one.
- If something in PLAN.md is unclear, or seems wrong once it's running, ask
  before changing the design. Implementation details are the agent's call.
- Mark milestones done in PLAN.md as they ship (`**M0: Scaffold** (done)`).

### Pre-completion checklist (run before finishing ANY milestone)

1. `npm run check` passes — zero errors.
2. `npm test` passes.
3. `npm run build` succeeds — no crash.
4. Run visual checks only if explicitly requested; otherwise record that they
   were not run.
5. No stray debug logging or dead code. The F2 debug overlay (M7) is a
   feature, not stray logging.
6. Docs updated (PLAN.md milestone status; README / this file if touched).
7. Commit (do **not** push). Surface the PR description in chat, with the
   playtest steps.

---

## Domain glossary

- **Wall** — the panel that comes toward the player. One wall is one round;
  walls are numbered from 1 (the wall #).
- **Hole** — the cut-out in the wall: the union of every block's target
  rectangle, placed at the hole's lane (`src/logic/wall-gen.ts`). Wall-gen
  changes one block per letter, never lets blocks overlap, and always makes
  a one-piece silhouette (M10): when no pose of the shuffled blocks makes one,
  the letters go to the next set of blocks that can. The hole is open (M10
  review 5): the runway and the void show through it, and the figure does
  once the wall has passed it. Its edge is lime on a wider ink line (M10b),
  except along the floor, where it opens. (From the first M10 review to the
  fourth it was filled with cream while the wall was behind the figure.)
- **Wall image** — the picture a wall shows (M10b), one of the files in
  `src/assets/walls/`, dealt by a `ShuffleBag` so each shows once before any
  repeats. It is scaled to cover the wall and cropped evenly, and drawn as
  cropped pieces of the wall's solid part (`src/logic/wall-shape.ts`), so the
  hole is truly cut out of it. With no images, the wall is a plain forest
  panel.
- **Completion** — on a pose lock, the hole flashes lime and the wall
  image's missing piece fades in to fill it (`Wall.complete()`): the figure's
  pose completed the picture. As the rushing wall reaches the figure's
  plane the hole opens again (`Wall.reopen()`), and the **pass pulse** (a
  lime frame round the figure's grid, `PassPulse`) grows and fades.
- **Lane** — one of `LANE_COUNT` (7) columns across the stage. The figure and
  the hole each sit in one lane. The figure starts a run in the center lane and
  keeps its lane between walls (`src/logic/lanes.ts`). Space is the only way
  to move: it steps one lane toward the hole (`stepToward()`), or during a
  Shift Wall's warning toward the lane the hole is about to slide to
  (`ShiftWall.upcomingLane`), and does nothing once lined up. (← / → also
  moved the figure, stopping at the edges, until after M10.)
- **Lane tile** — each lane's floor tile in the row the figure stands in
  (`LaneTiles`). The floor's cross seams are cut so the figure's plane runs
  through the middle of that row (`FIGURE_TILE` in
  `src/logic/perspective.ts`), so the figure stands centered on its tile. The
  figure's tile lights up deep green (filled) when the player is lined up. On
  a Shift Wall, the hole's new lane is the **target lane**: its tile gets a
  thick amber outline with chevrons pointing the way the hole went
  (`LANE_TARGET`), so it reads by shape as well as color.
- **Lined up** (aligned) — the figure's lane equals the hole's lane
  (`isAligned()`). Letters only appear while lined up.
- **Hole distance** — how many lanes from the figure a new wall's hole spawns,
  set per tier (`holeDistance` in `DIFFICULTY_TIERS`, PLAN.md §5). It is never
  0, so every wall needs lining up.
- **`t`** (progress) — the wall's approach from 0 (far away) to 1 (at the
  figure). `t` is linear in time; an ease-in (`WALL_EASE_POWER`) shapes only
  the wall's scale, so it seems to speed up. Timing thresholds and
  `WRONG_KEY_JUMP` are fractions of the wall time. Reaching 1 before the pose
  locks is a fail (`src/logic/approach.ts`).
- **Wall time** — seconds a wall takes to go from `t` = 0 to 1. Each tier sets
  it; in the last tier (wall 19+) it drops `WALL_TIME_DECAY` (4%) per wall, never below
  `MIN_WALL_TIME` (`wallTimeFor()` in `src/logic/difficulty.ts`).
- **Vanishing point** — where the floor lines meet, at
  (`GAME_WIDTH / 2`, `HORIZON_Y`). Every depth is a scale toward it
  (`src/logic/perspective.ts`).
- **Figure plane** — the depth where the figure stands, on `FIGURE_FLOOR_Y`.
  It is scale 1: the wall reaches full size there. Since M10 review 6 the
  figure stands on the front-most whole row of floor tiles (560), with no
  spare floor between it and the camera. What is sized at its plane
  (`CELL_SIZE`, `WALL_HEIGHT`, the shadow, the Shift arrow) scales with its
  depth, so the figure always fits its lane, and `WALL_START_SCALE` is set
  with it so the wall starts at the same place on screen. (Review 5 moved
  the figure away from the camera, 530 to 495, reading "further back" the
  wrong way; review 6 brought it forward.)
- **Figure** — the player's five blocks: `head`, `torso`, `armL`, `armR`,
  `legs`. Each block is black, with thin cream seams between its cells for a
  pixel look and a cream edge all round, over a soft shadow (M10). Review 4
  made the blocks solid; review 5 brought the seams back.
- **Pose** — a block's rectangle(s) in grid cells. Each block has a neutral
  pose and 2–4 alt poses; the **target pose** is the alt pose a wall asks for
  (`src/data/poses.ts`). Holding a block's letter snaps it to its target, and a
  slip snaps it back to neutral.
- **Prompt** — the letter currently asked for, shown as the cream chip in the
  console's center socket, in a lime frame. Letters appear one at a time: the next one shows
  `PROMPT_APPEAR_DELAY` after the previous hold, and only while lined up and
  not paused.
- **Next-letter preview** — while lined up, the fresh letter after the current
  one waits just right of center as a hollow, cream-outlined chip (`view().next`
  in `src/logic/sequence.ts`), then slides to the center when it becomes
  current. Letters further back stay hidden, and a slipped next letter shows as
  coral instead.
- **Prompt tray** (the console, M10b) — an angular near-black panel centered
  along the bottom, below the runway (`PromptTray`), with a socket in its
  center for the current prompt. Its chips are angular key caps with black
  letters, and letters flow right to left: the next-letter preview and
  slipped letters waiting their turn (coral) right of center in queue order,
  the current prompt (cream, in the socket), and held letters (lime) left of
  center, the latest nearest it. A chip that changes place slides there; a
  newly held one pops and a newly slipped one wobbles. Capital letters carry
  a ⇧ Shift mark in the chip's top-right corner. (Until M10b it was a plain
  black strip, with held letters lined up from its left edge.)
- **Caps Lock warning** — outlined coral text at the top of the screen,
  between SCORE and WALL, while Caps Lock is on. The state is read from every key event with `getModifierState`.
- **Held** — a prompted letter that was pressed correctly and is still down;
  its block sits in the target pose (from M4). Held keys are tracked by
  `event.code`.
- **Slip** — letting go of a held letter before the pose locks. Its block
  goes limp, slumping back to neutral with a bounce (`BLOCK_LIMP`, M8), and
  the letter goes to the end of the queue.
- **Queue** — the letters still to be prompted, including slipped ones; its
  head is the current prompt (`LetterSequence` in `src/logic/sequence.ts`).
- **Wrong key** — any letter that isn't the current prompt and isn't held,
  including a slipped letter pressed early, any letter while no prompt is
  showing (not lined up, or during the appear delay), and an uppercase prompt
  pressed without Shift. The wall jumps forward by `WRONG_KEY_JUMP` and
  flashes, and the wall rattles (`WALL_RATTLE`) unless the player prefers
  reduced motion.
  Letters pressed with Ctrl, Cmd or Alt are shortcuts and are ignored.
- **Stale key** — a letter still held from the previous wall. It is ignored
  until released, so it can't slip or count on the new wall.
- **Pose lock** — every letter held while lined up, outside a Shift Wall's
  warning. The pose freezes, the wall rushes past (`LOCK_RUSH_DURATION`,
  scaling to `RUSH_END_SCALE` and moving in front of the figure once past it),
  and input is ignored until the next wall.
  It is decided from game state (`maybeLock()` in `PlayScene`), never from pixels.
- **Fail** — `t` reaches 1 before the pose locks. The wall knocks the figure
  off its feet, toward the camera along the floor (`FAIL_TUMBLE`, M10 review
  5). It topples toward the middle of the stage (`fallDirection()`), its arms
  flailing from the shoulders (still for reduced motion). When it hits the
  floor its blocks come apart, bounce low like wood, and tip flat onto a side
  (`Tumble` in `src/logic/tumble.ts`); the whomp and a screen shake start as
  it lands. The game-over screen shows `FAIL_TO_GAME_OVER_MS` after the fail.
  (A splash into a pool, with water particles and a ripple, was cut in M10
  review 5.)
- **Restart gate** — after a fail, input is ignored for `RESTART_LOCKOUT`, then
  every key held from the run must be released before a fresh key or a click
  restarts (`src/logic/restart.ts`).
- **Shift Wall** — from wall 4, partway through the approach, the hole slides
  `SHIFT_WALL_SLIDE` (1) lane, staying on the stage. It fires once, at a
  random `t` in `SHIFT_WALL_T_RANGE` but not before a letter is held, or
  earlier, as soon as only one letter is left to hold. While it warns, the pose
  can't lock (`ShiftWall.letsPoseLock`), so a quick player can't finish before
  the shift and every Shift Wall really shifts. First the
  wall turns `wallWarning` orange with an arrow pointing the way it will go for
  `SHIFT_WALL_TELEGRAPH`, then the hole slides (`src/logic/shift-wall.ts`).
  From the warning on, the wall holds still for `SHIFT_WALL_PAUSE`
  (`ShiftWall.holding`): `t` stops advancing, though a wrong key still jumps
  it. While it holds, the `ShiftCallout` ("SHIFT" plus an arrow) shows above
  the wall. The target lane is marked from the warning until the figure is
  lined up with the moved hole, and the camera jolts `SHIFT_JOLT` the slide's
  way (skipped for reduced motion). Held letters stay held; new letters wait
  until the figure lines up again, and show at once when it does. Wall 4 is
  always one (`FIRST_SHIFT_WALL` in `src/logic/difficulty.ts`), so every run
  meets the mechanic on easy letters. After that the chance is 30%, steps up
  in later tiers, and in the last tier rises
  `SHIFT_WALL_CHANCE_STEP` per wall to `SHIFT_WALL_CHANCE_MAX`. Shift Wall
  rounds ask for at most
  `MAX_LETTERS_SHIFT_WALL` letters, scored against the tier's
  `shiftWallStretch`: a range set for 5 letters would only accept the most
  cramped 4.
- **Stretch score** — how awkward a letter combo is to hold
  (`stretchScore()` in `src/logic/letters.ts`): the widest gap between two
  keys in key widths, plus `STRETCH_WEIGHTS` points per extra keyboard row, per
  letter beyond `HAND_CAPACITY` on one side, and per pair on the same finger.
  For scale: a-s-d is 2, f-g-h is 4, Q-P-Z is 12.5.
- **Tier** — a band of walls with its own letter count, stretch-score range,
  neighbor rule, finger rule, wall time, Shift letters, hole distance and Shift
  Wall chance (`DIFFICULTY_TIERS` in config, PLAN.md §5). There are eight:
  walls 1–3, then two walls each through wall 9, three walls each after that,
  and an open-ended last tier from wall 19. Each one adds at most one new
  demand, in this order: Shift Walls, a letter, a wider stretch, a capital, a
  letter, a capital, shared fingers. `tests/difficulty.test.ts` enforces that,
  so the curve has no cliffs. Each wall's letters are random distinct combos, retried
  until the score lands in the tier's range (and, from wall 6, until they can
  be ordered with no neighboring keys back to back).
- **One finger per letter** — before the last tier (walls 1–18), no two
  letters share a touch-typing finger (`allowSameFinger: false`,
  `onSeparateFingers()`). Pairs like C + D or J + M force a finger off its key
  into a cramped grip, while spread alone (Q + P) is easy because each hand
  takes one side. The last tier ("Shared fingers") allows them, and the
  same-finger penalty in the stretch score prices them in. The tier ranges
  before it are set from the scores of these combos only.
- **PERFECT / GREAT / CLOSE CALL** — the timing grade at pose lock:
  `t ≤ PERFECT_T`, `t ≤ GREAT_T`, or later. A wall scores
  `WALL_CLEAR_POINTS` plus the grade's bonus (`src/logic/scoring.ts`). A
  CLOSE CALL plays the rush in slow motion (`CLOSE_CALL_SLOWMO`).
- **Streak** — consecutive PERFECTs. A PERFECT's whole score is multiplied by
  1 + `STREAK_STEP` × the PERFECTs already in the streak, capped at
  `MAX_MULTIPLIER`, so the first PERFECT is ×1 and the second ×1.5. Any other
  grade scores ×1 and resets the streak (PLAN.md §6).
- **Sounds** (M9) — all synthesized in `src/audio/Synth.ts` from `AUDIO` in
  config, with no sound files:
  - The **countdown**: silent until the wall is in CLOSE CALL range (past
    `GREAT_T`), then a tick-tock that speeds up as `t` nears 1 (`Countdown`
    in `src/logic/countdown.ts`, one per wall).
  - A click per held letter, rising a step each time.
  - A "bloop" on a slip, but not for the forced slips of a blur pause.
  - A fanfare on PERFECT.
  - A Shift Wall alert panned to the side the hole is going, then a whoosh
    that way as it slides.
  - On a fail: a hit at once, then a game-show "whomp whomp whooom" as the
    figure lands: brassy notes stepping down, each with a "wah" as its filter
    opens and closes, the last one long, wobbling and sagging. It runs on
    under the game-over screen and ends before restart is allowed. (A crowd
    "oooh" and a water splash sound were tried and cut.)

  The synth uses Phaser's audio context and master node, so audio unlocks on
  the first click and suspends while the window is blurred. Sounds are
  skipped while the context isn't running, so none queue up.
- **HUD** (M10b) — SCORE top-left and the WALL number top-right (`Hud`), each
  on an angular near-black panel with a lime accent and a fine inner grid,
  above the horizon: a sage caption in IBM Plex Mono over the cream number in
  Anton. The panel grows with its number; a new score counts up, and each
  number pops when it changes. The mocks show a run timer top-right; the game
  has none, so the wall number takes its place.
- **Grid void** — the background (`GridVoid`, M10b): near-black green, lit
  along a clear horizon line, with a ground grid in the stage's perspective
  that continues the runway's lanes and tile rows and fades with depth. It
  drifts toward the camera one tile row every `VOID.driftMs`, a few of its
  squares fade in and out and a few lime pixels glow at its crossings, all
  beside the runway; still for reduced motion. (Until M10b the background was
  a cream **collage** with torn paper at its edges.)
- **Runway** — the cream floor the figure stands on (`Floor`), a clean plane
  in the void with faintly varied tiles, thin seams and a charcoal outline.
  A lime **spawn line** beyond its far edge marks where walls fade in. (M10
  had green verges beside it, and a paper-grain filter on it.)
- **Outlined text** — bright letters inside a thick dark stroke
  (`outlinedStyle()`, `TEXT_OUTLINE`), for text over the moving scene: the
  timing label (PERFECT lime, GREAT cream, CLOSE CALL coral), the SHIFT
  callout and its arrow (yellow), the Caps Lock warning and the pause text.
- **Key ghosting** — keyboards failing to register many keys held at once. It
  is why a wall asks for at most 5 letters, and 4 on Shift Walls.
- **Sticky Keys** — the Windows pop-up after 5 quick Shift presses. It is why
  two uppercase letters never come back to back.
- **Debug overlay** — F2 during play toggles a panel in the top-left corner
  (`DebugOverlay`). It shows the phase and flags, the wall #, tier and wall
  time, `t` and the grade a lock would get now, figure vs hole lane, the
  current prompt, the whole queue (including letters not shown yet), held
  letters with their key codes, the stretch score against the tier range, the
  Shift Wall trigger, and the score and streak. F2 never counts as a wrong key,
  and the overlay stays on across walls and restarts.
- **Dev URL options** — playtest shortcuts read from the page URL, honored
  only when `import.meta.env.DEV` is true (`npm run dev`), so a published
  build always plays a normal run (`src/logic/dev-options.ts`). `?wall=N`
  starts every run, restarts included, at wall N (`ScoreKeeper(firstWall)`;
  walls cleared still counts only real clears). `?shiftwall` makes every wall
  a Shift Wall, with the Shift Wall letter cap. While one is on, the debug
  overlay adds a "dev url" row.

## Copy & terminology

- User-visible strings use plain, external-facing language. Internal data terms
  (variables, props, types, file/route/field names) are **not** user copy and
  stay as-is. The game-show call-outs (PERFECT, GREAT, CLOSE CALL) are part of
  the voice.
- Write for a first-time player with no prior context.
- Placeholder copy stays clearly placeholder until the real screen is built
  (the Play screen's "Placeholder: click to end the run"). Don't invent authoritative-looking
  facts (counts, dates, names) beyond what PLAN.md states.
- A letter's case is gameplay, not style: uppercase means "hold Shift". Never
  change the case of a prompt letter for display.

---

## Rules for agents (summary)

- Do NOT add features, services, or dependencies not described here or required
  by the current milestone.
- Do NOT change the game design (PLAN.md) or the core architecture/flow without
  asking.
- Keep game rules in `src/logic/`: pure, Phaser-free and unit tested. Scenes
  only draw the state and pass input in.
- Put every tunable number in `src/config.ts`.
- Use a branch for each logical change in the existing checkout; never use
  worktrees or work on `main`.
- Always run check + test + build before marking a milestone complete. Run
  visual checks only when the user explicitly requests them.
- Stop after each milestone for the user's playtest and go-ahead.
- Never duplicate logic; extract a helper first.
- Prefer config tokens over raw values; `src/config.ts` is the single tuning
  and re-skin point.
- Never add co-author trailers or AI-attribution text; preserve the user's Git
  identity.
- Commit after checks pass; the user pushes after review unless explicitly
  requested otherwise.
- When in doubt about architecture, re-read this file.
