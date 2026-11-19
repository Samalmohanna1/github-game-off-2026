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
Week 1 prototype (M0–M7), the M8 feel pass, the M9 synthesized audio (with
the user's music track added after M11), the M10 art for the play screen, the M10b grid void restyle and the M11 title,
pause and game-over screens are done. The palette and fonts come from design
mocks kept outside the repo (`../design-mocks/`). Everything is drawn in
code, the wall's display panel included (M10b review 4, picked from the wall
directions in `../design-mocks/wall-options*/`; supplied photos and
geometric patterns were tried and dropped).

Scenes, one per screen:

| Scene | Status | Contents |
|---|---|---|
| `BootScene` | Final (M10b) | Starts loading the track (`loadMusic()`) and rendering the menus' Standby (`loadStandby()`) in the background, so neither holds up the title, and waits for the bundled fonts (`loadFonts()`, giving up after `FONT_LOAD_TIMEOUT`), then hands off to Title. |
| `TitleScene` | Final (M11 review 6) | The grid stage, the lockup (`TitleLockup`, Option 2 of the user's title concepts) and a lime CLICK TO PLAY button below it, the two centered as one block. The lockup is a dark card lit like a wall (a lime bloom outside its lime edge, the wall panel's glow inside) with SHAPE in cream, large, over SHIFT in lime, both in Anton leaning like the badges, SHIFT's right edge on the E's leaning edge, and the bar's line, half as big again, starting with its slashes under the S and stepping down to the top of SHIFT's S's lower tail. (Until review 5 it was a cream card slanting both ways; review 3 made it a stacked lockup.) The click gives the page keyboard focus inside the itch.io iframe and leads to the interactive tutorial (`PlayScene` in its tutorial mode). The menus' music, Standby, starts here (`startMenuMusic()`), once the browser lets audio play, which on a fresh page is that click, and plays on through the tutorial. |
| `PlayScene` | Interim (M10b) | Three modes (`PlayStart`). **Tutorial**, after the title: the **interactive tutorial**, the real stage and rules on wall 1's plan, the wall waiting at its start until the player lines up, one step at a time on a dark card in the band above the wall (`TutorialPanel`): 1. LINE UP with Space, 2. HOLD ON to every letter, then, once the pose locks, 3. SCORE, as the HUD (hidden until then) fades in with the points, and a START button that waits for the completion and every key to be let go (`GatedPrompt`). A fail plays out and replays the tutorial wall; ENTER TO SKIP (top right, until step 3) goes to the count. Standby plays throughout. **Countdown**, after the tutorial: READY?, 3, 2, 1 on a lime badge where the first wall will appear (`ReadyCount`), a beat of the track each, with a beep per number and a higher one as the first wall comes with the music. **Run**, for Play again: straight into wall 1. Every run is the full Week 1 loop, driven by the difficulty curve (`planWall()` per wall: letter count, stretch range, Shift letters, wall time, hole distance, Shift Wall roll). A wall approaches with a hole cut from the poses (`wall-gen.ts`). Space lines the figure up, one lane toward the hole per press (during a Shift Wall's warning, toward the lane it is about to slide to); the arrow keys don't move it; the tray then prompts the wall's stretch-scored letters one at a time, and each held letter snaps its block into the target pose. Slips, wrong keys and the Shift rule follow PLAN.md §2. On a Shift Wall (wall 4+), the wall stops behind a SHIFT callout, turns orange with an arrow, and the hole slides 1 lane with a sideways jolt while the new lane's tile is marked on the floor; then the wall carries on; held letters stay, and new ones wait until the figure lines up again. All letters held while lined up locks the pose: a PERFECT / GREAT / CLOSE CALL label pops over the figure, the wall comes the rest of the way to the figure, the figure's cells light up lime like the panel's pixels and the panel fills back in (the completion), and the wall fades away as the next one fades in. Held blocks land with a squash, slipped ones slump back limp, a wrong key rattles the wall, and a CLOSE CALL plays the rush in slow motion. If the wall arrives first, it knocks the figure over: it topples toward the camera with its arms flailing, and its blocks come apart and bounce to a stop on the floor before the run ends. The music plays from the top through each run and stops as the wall hits (`Music`). Synthesized sounds (M9), tuned to its key, play over it: the countdown tick in CLOSE CALL range, clicks, slips, the PERFECT fanfare, the Shift Wall alert and whoosh; then, once it stops, the fail's hit and "whomp whomp whooom". Capital chips carry a Shift mark, a warning shows while Caps Lock is on, and losing focus pauses the game behind a veil, with PAUSED on a heading card and a lime CLICK TO RESUME button (`PauseOverlay`, M11). F2 toggles the debug overlay. Everything is drawn in the M10b art, a dark grid stage after the user's mockup: a glossy floor grid running back to a gridded back wall at the runway's far end, meeting it at a glowing lime seam, with lit cells that breathe, squares that fall slowly and fade, and streaks running down the floor; a cream runway with thin seams and glowing lime edges, where the figure stands centered on its lane's tile and the lined-up tile is marked; walls that are dark glass display panels lined on the figure's cells, with dots at the crossings, scanlines and the glow of a neon lime frame, with a see-through cutout in an equally thick lime edge; black blocks with cream seams between their cells and a cream edge; a dark line-art bar of cream key caps with lime slashes and a square per letter; SCORE and WALL on cream cards with lime slashes in the top corners; the timing label and the SHIFT callout on solid badges in a thick ink edge; and the Caps Lock warning in bright letters inside a thick dark outline. No texture anywhere. |
| `GameOverScene` | Final (M11 review 4) | After the user's mock, on the grid stage: one dark card in a lime edge, centered, with GAME OVER in cream Anton over a lime rule, then this run's SCORE and WALLS CLEARED (lime captions over cream numbers, the walls at the HUD's number size), parted by the bar's line; the card, Play again and its hint centered down the screen with room above and below. (Review 2 set GAME over OVER beside the card, and review 3 made it a stacked lockup.) No all-time best is kept or shown (M11 review), nor the wall the run ended on, which is always walls cleared + 1 (M11 review 2). Restart follows PLAN.md §7: input is ignored for `RESTART_LOCKOUT`, then every key must be up ("LET GO OF EVERY KEY TO PLAY AGAIN" shows meanwhile) before a key or click restarts, when a lime PLAY AGAIN button shows under the card over "PRESS ANY KEY OR CLICK". The music plays slowed, muffled and echoing under it (`AUDIO.gameOverMusic`), fading in as it shows, until the restart. |

Shared scene helpers live in `src/scenes/` (`ui.ts`, `text-styles.ts`,
`scene-keys.ts`). Game objects live in `src/objects/`:
`GridVoid`, `Floor`, `LaneTiles`, `Wall`, `Figure`, `Completion`,
`PromptTray`, `Hud`, `TimingLabel`, `ShiftCallout`, `PromptButton`,
`PauseOverlay` and `DebugOverlay`, plus `WallPanel` (paints
the wall's display panel into a texture), `ImagePieces` (that texture
cropped to rects, shared by the wall and the completion), and the drawing
helpers `drawCard()` (the cream cards) and `makeHeadingCard()` (a screen's
heading on one), `drawDarkCard()` (the dark cards), `drawBadge()` (the
badges), `fillSlash()` (the lime "//" slashes), `drawBarLine()` (the bar's
stepped line), `fillEdgedKeyCap()` (a key cap shape in a closed edge) and
`addKeyCap()` (a labeled key cap).
Keyboard input lives in `src/input/`:
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
  `roundPixels` on (M11 review 3: unscaled text lands on whole pixels, not
  blended across two),
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
- **Art:** drawn in code, with Phaser shapes and Graphics and one canvas
  texture for the wall's panel. M10b is a sci-fi grid stage with an
  editorial edge (PLAN.md §1, §3): a dark perspective grid, a cream runway,
  walls that are neon-framed display panels with their hole cut out, cream
  cards and a line-art bar with lime slashes, solid badges for the popups,
  and key cap buttons for the screens' prompts (M11 review 2). M11 sets the title, pause and game-over
  screens in the same language. Since M10b review 2 the stage follows the user's mockup: lit
  and layered, never flat (a glowing seam, a back wall, a glossy floor, lit
  squares). Clean edges and no texture. The figure stays the same five blocks
  and pose data, styled as in M10, and is never restyled without the user
  asking. Decoration has to earn its place and keep clear of play: the
  background stays atmospheric and must never compete with the wall, the
  figure or the prompts. (M10 was an editorial collage with torn paper at
  the background's edges and a paper-grain filter, both dropped in M10b.)
- **The wall panel** (M10b review 4) is the direction the user picked from
  the wall options rendered in `../design-mocks/wall-options*/` (supplied
  photos, then random geometric patterns, came before it). Every wall is the
  same dark glass display panel (`WallPanel`, `WALL_DISPLAY`), lined on the
  figure's own cells (`gridLines()` in `src/logic/wall-shape.ts`), so its
  grid runs along the hole's edges and is repainted as a Shift Wall's hole
  slides. Its neon lime frame and hole edge are drawn over it by `Wall`. No
  image files.
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
    audio/                 # the music track (the game's one sound file)
  audio/
    Synth.ts               # Web Audio sound effects, no files: tick, click, slip, fanfare, Shift alert, hit, whomp
    Music.ts               # loadMusic(): the track, fetched and decoded once; Music: a buffer looping in a style (the track as a run's music, stopped when the player loses, or the game over's, slowed, muffled, echoing; or Standby)
    standby.ts             # loadStandby(): the menus' Standby, rendered once offline into a seamless loop; startMenuMusic() / stopMenuMusic()
  data/                    # PURE: static game data
    keyboard.ts            # QWERTY row/x (with stagger), hand, finger per letter
    poses.ts               # block ids, neutral pose and alt poses on the grid
    void-art.ts            # the grid stage's fixed composition: lit back wall cells, falling squares, floor streaks
    standby.ts             # Standby's chords: pad voicing, bass note and bell melody per chord
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
    fall.ts                # the falling squares' cycles: where each is, and its fade in and out
    convex.ts              # chamfered rects: the key caps' angular shape, grown evenly for an edge (keyCapRect)
    perspective.ts         # vanishing point, project(), floor edges, tile seams + the figure's tile
    wall-shape.ts          # the wall's layout per lane, solid and hole rects, hole and frame edges, the panel's cell grid, a texture's cover fit and crops
    restart.ts             # game-over lockout + "release every key" gate (also the tutorial's Start)
    tutorial.ts            # the tutorial's steps: line up, hold, score; forward only
    ready-count.ts         # READY?, 3, 2, 1: which label shows when
    scoring.ts             # grades, wall points, PERFECT streak multiplier
    sequence.ts            # prompt / held / slip queue state machine + lock
    shift-wall.ts          # Shift Wall trigger, warning timer, slide target, wall hold
    countdown.ts           # countdown tick timing: silent until CLOSE CALL range, then speeding up
    sound-levels.ts        # MIDI and scale pitches; click, fanfare and whomp pitches
    standby-schedule.ts    # when each of Standby's notes plays: swells melting chord to chord, bells, loops
    wall-gen.ts            # blocks + alt poses per wall, hole grid
    tumble.ts              # the fail's fall: the figure topples, its blocks come apart and bounce to rest
    title-lockup.ts        # the title lockup's geometry: SHIFT on the E's leaning edge, the line from under the S into SHIFT, the card's padding
  objects/
    GridVoid.ts            # the grid stage: floor grid, back wall grid, lime seam, falling squares, floor streaks
    Floor.ts               # the cream runway: rows shading into the distance, thin seams, glowing lime edges
    Hud.ts                 # SCORE and WALL on cream cards with lime slashes in the top corners; count-up + pop
    LaneTiles.ts           # the figure's row of floor tiles: lined-up marker (flash, then outline), Shift Wall's target lane
    card.ts                # drawCard(): a cream card slanting on one side or both, with lime slashes; makeHeadingCard(); drawDarkCard()
    badge.ts               # drawBadge(): a solid parallelogram in a thick ink edge, plus its slashes
    slash.ts               # fillSlash(): one slanted stroke of the "//" motif, fading top to foot
    bar-line.ts            # drawBarLine(): the bar's thin stepped line and its slashes (the bar, the game-over card)
    vectors.ts             # points -> Phaser Vector2s; square-capped segment edges
    WallPanel.ts           # paints the wall's dark glass display panel into the canvas texture the wall and the completion show; glowInside(), shared with the title card
    ImagePieces.ts         # that texture covering the wall, cropped to rects (the wall's solid part, the completion's piece)
    Wall.ts                # the panel with a see-through cutout, in a lime frame and hole edge; flash + rattle, Shift warning + slide
    Figure.ts              # five black blocks with cell seams + shadow; squash on snap, limp slump on slip, topple on a fail
    Completion.ts          # the completion over the figure: its cells light up lime, the panel fills back in
    TitleLockup.ts         # the title: SHAPE over a lime SHIFT, leaning, on a dark card lit like a wall (drawn into a canvas texture), with the bar's line
    PromptTray.ts          # the bar: held / current (in its socket) / next preview / slipped key caps; a square per letter
    keycap.ts              # the key caps' chamfered shape; fillEdgedKeyCap(): it in a closed edge; addKeyCap(): a labeled cap (the tutorial's keys)
    PromptButton.ts        # a screen's call to action: a pulsing lime key cap in a cream edge (Click to play, Start, Click to resume, Play again)
    GatedPrompt.ts         # a button that waits for its lockout and every key to be let go (Play again, the tutorial's Start)
    TutorialPanel.ts       # the tutorial's step card (number, name, keys, one sentence) and ENTER TO SKIP
    ReadyCount.ts          # READY?, 3, 2, 1 on a lime badge before the first wall
    PauseOverlay.ts        # veil, PAUSED on a heading card, Click to resume button; shown on blur
    ShiftCallout.ts        # SHIFT + arrow on a yellow badge while a Shift Wall holds
    TimingLabel.ts         # PERFECT / GREAT / CLOSE CALL on a badge in the grade's color, points on an ink tab
    DebugOverlay.ts        # F2 panel: state, t, lanes, prompt, queue, held, stretch
  scenes/
    BootScene.ts           # starts loading the music, waits for fonts, hands off to Title
    fonts.ts               # loads the bundled font faces before any text is drawn
    TitleScene.ts          # the title lockup and "Click to play" (gets keyboard focus)
    PlayScene.ts           # the game: draws state, passes input in
    GameOverScene.ts       # one centered card: GAME OVER, the run's score and walls cleared; gated restart
    scene-keys.ts          # scene keys + RunResult handed to GameOver
    text-styles.ts         # Phaser text styles built from config tokens, plain and outlined
    ui.ts                  # Phaser's Web Audio context, reduced motion, number formatting, window key events
tests/
  approach.test.ts         # t advance, wrong-key jump, ease-in, wall scale
  config.test.ts           # config invariants + text and graphics contrast
  convex.test.ts           # chamfered rects: plain, and cut only where asked; key cap rects grown evenly
  fall.test.ts             # falling cycles wrap and start by phase; the fade is 0 at both ends, full between
  dev-options.test.ts      # ?wall / ?shiftwall parsing and fallbacks
  difficulty.test.ts       # tier table, wall time decay, Shift Wall chance, caps
  keyboard.test.ts         # all 26 letters, hand split, stagger, fingers
  lanes.test.ts            # Space steps toward the hole, hole lane, lane geometry, fall direction
  letters.test.ts          # stretchScore; per tier: range, no repeats, capitals, caps, fingers
  perspective.test.ts      # projection, floor geometry, tile seams centered on the figure
  poses.test.ts            # neutral pose fits the grid, no overlaps
  purity.test.ts           # pure modules never import Phaser
  restart.test.ts          # lockout (and a lockout of its own), release-every-key, click
  tutorial.test.ts         # steps in order, forward only, each reported once
  ready-count.test.ts      # READY? then 3, 2, 1, each its step, then over
  scoring.test.ts          # grades, points, streak multiplier and cap, start wall
  seeded.ts                # deterministic random for repeatable tests
  sequence.test.ts         # PLAN.md §2 input rules, incl. the M3 cases + lock
  shift-wall.test.ts       # trigger, warning, hold, slide range, M6 line-up case
  standby-schedule.test.ts # 8 bars at 90 BPM, C minor, repeats exactly, chords melt, bells in their chord, tails within a loop
  countdown.test.ts        # silent before CLOSE CALL range, speeds up, no catch-up bursts
  sound-levels.test.ts     # MIDI pitches, the key's scale, click steps, effects over the music in its key, fanfare rises an octave, whomp steps down
  title-lockup.test.ts     # SHIFT on the E's edge, the slashes under the S and clear of it, the line's step into SHIFT, even padding
  tumble.test.ts           # the fall lands after the hit, bounces low, never sinks, settles flat in time
  wall-gen.test.ts         # valid poses for every block set, one-piece holes, hole grid, the title's pose
  wall-shape.test.ts       # layout matches the figure per lane, rects tile the wall, edges (open or closed), the panel grid, cover fit and crops
```

Everything in PLAN.md §9's layout now exists, plus the F2 debug overlay. Add
new files to this tree when they land.

Where things go: rules, and the pure math they depend on (the `t` clock,
perspective, the fail's tumble, the wall's shape) → `src/logic/`. Static game data such as the keyboard map and
pose tables → `src/data/`. Numbers you'd tweak while tuning →
`src/config.ts`. Browser storage, if the game ever stores anything again →
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
  isn't a palette color. Green is the signature: the stage and the wall
  panel are greens and near-blacks, the cards and key caps cream, and lime
  is the accent: the seam, the runway's edges, the wall's neon frame and
  hole edge, the "//" slashes, lit squares, held and current key caps,
  PERFECT, a completion's cells and trace, and the screens' prompts. The
  alerts are two families: yellow/ochre means the
  hole is moving (Shift Walls), coral/red means a mistake (wrong key, slip,
  CLOSE CALL, Caps Lock). Add a new color to `PALETTE` first, then give it a
  role.
- **Visual hierarchy (M10b).** In order: the wall's cutout and its panel,
  the figure, the letter bar, the HUD, then the background. The stage should
  feel lit and deep, never flat (M10b review 2: "boring and flat"), but stay
  behind the play: its squares and streaks are a fixed composition kept off
  the wall's path (`src/data/void-art.ts`), never random spawns, and all its
  motion is slow and even (the floor's drift and wave, the squares breathing
  in one sweep). No architecture or large shapes. Nothing that plays
  or reads is decorated over: text over the scene sits on a solid badge or
  card, or is outlined (below).
- **Clean lines.** Every edge is a thin, plain straight line in its own
  role color: the wall's lime frame and the equally thick lime edge of its
  hole, the bar's stepped sage line, the lined-up marker and the target
  tile. The runway's lime edges, the seam and the wall's neon glow on
  purpose. Nothing else is drawn over a wall's panel.
- **No texture (M10b).** The paper-grain filter and the torn paper are
  gone; depth comes from light (gradients, glows, the seam's bloom), not
  texture. The figure, text, the bar and the chips stay clean, and the cutout is open, showing what is
  behind the wall.
- **UI after the mockup (M10b review 2).** Each shape has one job (M11
  review 2): a slanted cream card is a heading or the HUD, read at a
  glance; a key cap shape (two corners cut, two square) is something to
  press or study: the keys, the buttons and the dark cards; a
  parallelogram badge is a passing call-out. Cards (`drawCard()`, `CARD`)
  are cream with dark text, small cut corners on the straight side, a side
  slanting inward toward the foot (either side, or both) and lime "//"
  slashes beside it (`fillSlash()`), with no fold (M11 review 2). A card of
  any height keeps one slant angle. The HUD's cards face the middle; the
  headings (`makeHeadingCard()`, `HEADING_CARD`, one size on every screen)
  slant both ways. Badges
  (`drawBadge()`, `BADGE`) are solid parallelograms in a thick ink edge:
  the timing label and the SHIFT callout. Buttons (`PromptButton`,
  `PROMPT_BUTTON`) are lime key cap shapes in a cream edge, which pulse in
  size, set one gap below what comes before them, any hint under them. The
  bar is a dark band with a thin stepped line along its foot
  (`drawBarLine()`), lime slashes at its left end and a square per letter at
  its right. Key caps have 45-degree cut corners (`chamferedRect()`,
  `keyCapRect()`): cream with dark letters, lime-edged when held, framed in
  lime when current. Dark cards (`drawDarkCard()`, `DARK_CARD`) are as dark
  as the bar, cut like the key caps, in a lime edge (all of them since M11
  review 5): the title, the tutorial's step card and the game-over results, with a
  lime rule under GAME OVER. The title's card is lit like a wall: a lime
  bloom outside its edge and the wall panel's glow inside (M11 review 6). The screens (M11) are
  built only from these parts on the grid stage.
- **Typography:** each size in `FONT_SIZES` has a role (`FONT_ROLES`): display
  sizes (the title's two words, title, heading, the HUD's numbers) set in Anton, which has one weight and
  is never bolded; the rest (the cards' captions, the prompt letters and other
  technical detail) set in IBM Plex Mono, normal or bold. Prompt
  letters use `CHIP_FONT_FAMILY` (IBM Plex Mono), whose capital I has
  crossbars and can't be mistaken for a lowercase l; any future prompt font
  must keep I and l distinct. The title's words lean like the badges
  (`TITLE.lean`); Phaser can't lean text, so `TitleLockup` draws them into
  a canvas texture, with no outline (M11 review 5 dropped the keylines of
  the mockups: the dark card gives the contrast). Text stays unscaled where
  it can: scaling resamples it and blurs it, so the buttons pulse their
  shape and not their label.
- **Contrast: WCAG AAA preferred, AA required.** Aim for AAA — **7:1 normal
  text, 4.5:1 large text** (≥24px, or ≥18.66px bold). A color between AA and
  AAA may ship, but no text goes below **AA — 4.5:1 normal, 3:1 large**.
  Meaningful non-text graphics (the wall and its hole, the runway's lines,
  the lit tile and the target tile on the runway; held, current and slipped
  chips and the current chip's frame) need 3:1. The wall's panel is as dark
  as the void, so its lime frame (against the void and the glow behind it)
  and its hole's lime edge carry its contrast while the hole shows the void;
  nearer, the hole shows the cream runway, which the panel's darks set off.
  The badges stand out from the panel by their fill and from the runway by
  their ink edge. The cream cards stand out from the void, and the bar's
  line, slashes and letter squares (lit and unlit) read on the bar.
  Lime is too light to read on cream, so a deeper green marks the lined-up
  lane's tile; the black figure is only 1.5:1 on a dark wall and less on the
  void, so its cream edge outlines it there.
  **Verify pairs, don't eyeball them**: `tests/config.test.ts` measures every
  meaningful graphic color against what it sits on, measures each text color
  against every background it is drawn on (`TEXT_ON` in that test; add new
  pairs there), and keeps every font size at 24px or more. Text that fades or
  flashes must still meet AA at its faintest frame. Text over the moving
  scene sits on a solid badge, button or card (the timing label, the SHIFT
  callout, the screens' buttons and cards), so it never depends on what is
  behind;
  the Caps Lock warning is bright inside a thick `COLORS.textOutline` stroke
  (`outlinedStyle()`, `TEXT_OUTLINE`), and is measured against that outline;
  the rest sits on a chip, a dark card or the void (GAME OVER, the screens'
  hints). The buttons' cream edge sets them off the stage and the pause
  veil.
  Record every pair below AAA, with its measured ratio, in the list below.
  - Pairs below AAA: none.
- **Keyboard first.** The game is played entirely on the keyboard, except the
  title's "Click to play", which PLAN.md §2 requires so the itch.io iframe gets
  keyboard focus. The tutorial's Start and game over's Play again take any
  key or a click, and Enter skips the tutorial. During play, a
  warning shows while Caps Lock is on (PLAN.md §2).
- **Don't rely on color alone.** Held, current and slipped letters also differ
  by position in the tray (left, center, right; PLAN.md §3), and the next-letter
  preview is hollow where the others are filled. Show "not yet" with style,
  never with opacity: a faded chip would drop its letter below AA. Don't rely on case
  alone either: capital chips carry a drawn Shift mark (`SHIFT_MARK`). The
  Shift Wall warning is as bright as the wrong-key flash, so its arrow, not
  its amber, is what sets it apart.
- **Desktop only.** The game needs a physical keyboard. It renders at 1280×720
  and scales to fit (`Phaser.Scale.FIT`), so the HUD, the bar, the runway's
  perspective and the centered figure all scale together and keep their
  places at any window size; there is no separate mobile or touch layout.
- **Motion.** Honor `prefers-reduced-motion`: the pulsing prompts and the
  grid void stay still, and the wrong-key wall rattle, the block squash, the
  limp slump, the fail's arm flail, the chips' slides, pops and wobbles, the
  HUD's pop, the lined-up marker's flash and the cleared wall's grow as it
  leaves are skipped under it
  (`prefersReducedMotion()` in `src/scenes/ui.ts`). Fades are not motion and
  stay. Feedback that carries meaning keeps a still alternative, such as the
  wall flash, and blocks still land in their poses at once.
- **Performance budget.** One bundle (Phaser plus game code), no third-party
  scripts, and no requests at runtime beyond the game's own files (the
  bundled fonts and the music track). Nothing is stored: the game over shows only the run's own
  results (M11 review dropped the saved best score, PLAN.md §6).

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
  once the wall has passed it. Its edge is a thin cream line (M10b review),
  except along the floor, where it opens. (From the first M10 review to the
  fourth it was filled with cream while the wall was behind the figure.)
- **Wall panel** — what a wall shows (M10b review 4): dark glass shading
  from near-black to dark green, lined on the figure's own 26 px cells
  (`gridLines()`), with lime dots at the crossings, scanlines and a lime glow
  inside its edges from the neon frame (`WALL_DISPLAY`). The grid lies on the
  hole's cells, so the hole's edges run along it. `WallPanel` paints it into
  a canvas texture the size of the wall, repainted when the hole moves, and
  the wall shows it as cropped pieces of its solid part (`ImagePieces`,
  `src/logic/wall-shape.ts`), so the hole is truly cut out of it. The user
  picked it from wall directions rendered in the game
  (`../design-mocks/wall-options*/`). (The M10b review used supplied photos,
  and its third and fourth reviews random geometric patterns.)
- **Completion** — the signature moment (M10b review, `Completion`).
  On a pose lock the wall comes the rest of the way to the figure
  (`LOCK_RUSH_DURATION`), where its hole and the pose line up cell for cell.
  The figure's cells light up lime, row by row from the feet up, parted by
  dark seams like the panel's pixels; then the panel fills back in over
  them, so the wall looks whole, while a lime trace of the silhouette fades.
  The whole panel holds, then fades, growing slightly toward the camera, and
  the next wall fades in (`WALL_COMPLETE`). It is drawn over the figure and
  leaves with the wall, so the figure itself never changes. (M10b first had
  the hole fill in behind the figure, then a lime frame pulse as the wall
  rushed past; with images and patterns, the cells took the average colors
  of the picture under them.)
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
  `src/logic/perspective.ts`), so the figure stands centered on its tile.
  While the player is lined up, the figure's tile carries the **lined-up
  marker**, a thin deep green outline inset in it (`LANE_LIT`); each time
  the figure lines up, it flashes in as a filled pad that grows into place
  and settles to the outline. (It was a full filled tile until the M10b
  review, which read as a platform.) On
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
  bar's center socket, in a lime frame. Letters appear one at a time: the next one shows
  `PROMPT_APPEAR_DELAY` after the previous hold, and only while lined up and
  not paused.
- **Next-letter preview** — while lined up, the fresh letter after the current
  one waits just right of center as a hollow, cream-outlined chip (`view().next`
  in `src/logic/sequence.ts`), then slides to the center when it becomes
  current. Letters further back stay hidden, and a slipped next letter shows as
  coral instead.
- **Prompt tray** (the bar, M10b) — a dark band along the bottom, below the
  runway (`PromptTray`), with a thin stepped line along its foot, lime "//"
  slashes at its left end, and at its right end one square per letter of the
  wall, lit lime as each is held (`setLetters()`, from the wall's letter
  count). A faint socket in its center marks the current prompt's slot. Its
  chips are angular cream key caps with dark letters, and letters flow
  right to left: the hollow next-letter preview and slipped letters waiting
  their turn (coral) right of center in queue order, the current prompt (in
  the socket, framed in lime), and held letters (edged in lime) left of
  center, the latest nearest it. A chip that changes place slides there; a
  newly held one pops and a newly slipped one wobbles. Capital letters carry
  a ⇧ Shift mark in the chip's top-right corner. (M10b first made it a
  charcoal console panel; until then it was a plain
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
  warning. The pose freezes, the wall comes the rest of the way to the
  figure (`LOCK_RUSH_DURATION`) for the **completion** (above), then
  fades away, and input is ignored until the next wall. (Until the M10b
  review the wall rushed on past the figure, scaling up and fading.)
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
  restarts (`src/logic/restart.ts`). The tutorial's Start waits the same way,
  for `TUTORIAL.continueLockoutMs` (`GatedPrompt` shows both).
- **Tutorial** — the interactive tutorial, the Play scene's tutorial mode,
  between the title and the first run (it replaced the How to play screen of
  three static step cards). It plays wall 1's plan by the real rules, one
  step at a time (`TutorialSteps` in `src/logic/tutorial.ts`,
  forward only), each on a dark card that shows until the player has done it:
  1. LINE UP (Space), while the wall waits at its start, not even a wrong
  key pushing it on (`TutorialSteps.wallWaits`); 2. HOLD ON, as it comes at
  wall 1's speed (every letter; the card says capitals need
  Shift, though wall 1 has none), and, as the pose locks, 3. SCORE: the HUD
  fades in with the points, and the card says the faster you clear a wall,
  the more points you score. It is practice: its points don't carry over.
  Its Start leads to the **ready count**, READY?, 3, 2, 1, and the run starts
  from 0 on wall 1. A fail replays the tutorial wall from step 1. Enter skips
  to the count until step 3. Play again skips both.
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
- **Music** — the user's track in `src/assets/audio/`, the game's one sound
  file (added after M11), in C minor at 90 BPM, cut to loop. Boot starts
  `loadMusic()` (`src/audio/Music.ts`), which fetches and decodes it once in
  the background. Each run's `Music` plays it from the top as a gapless Web
  Audio loop, and stops it with a quick fade (`AUDIO.music.stopMs`) as the
  wall hits, so the fail's sounds play alone. The game over plays the same
  track "after the show" (`AUDIO.gameOverMusic`): slowed to 0.8, which also
  lowers it, through a lowpass, with an echo, fading in as the screen shows,
  under the end of the whomp, until the restart. The title and the tutorial
  play **Standby** instead (below). Like the synth it goes through Phaser's
  context and master node (`webAudio()` in `src/scenes/ui.ts`), so it is
  silent while the window is blurred and will follow the M12 mute. It is
  mixed well under the effects (`AUDIO.music`), since the track is mastered
  loud. A browser that can't fetch or decode it plays the game without
  music. (At first it played under every screen from the title's click and
  never stopped. The game-over version and the fail's new sound were picked
  from options rendered offline into `../design-mocks/audio-options/`.)
- **Standby** — the title and tutorial music (`AUDIO.standby`), picked
  from the second round of rendered options
  (`../design-mocks/audio-options-2/`): an ambient loop drawn in code, in the
  track's key and tempo but with none of its notes or sounds. A warm pad of
  detuned saws breathes through a slow lowpass on four 2-bar chords (Cm7,
  Abmaj7, Ebmaj9, Bbsus2; `src/data/standby.ts`), over a soft bass, with a
  sparse glassy bell melody echoing on the dotted eighth, all in a reverb.
  Boot renders it once, in the background, with an `OfflineAudioContext`
  (`loadStandby()` in `src/audio/standby.ts`): three loops' notes
  (`src/logic/standby-schedule.ts`) over two loops' time, keeping the
  second, whose start carries the tails of the first, so the buffer loops
  seamlessly. The title starts it (`startMenuMusic()`), fading in, it plays
  on through the tutorial, and the count into the first wall stops it (`stopMenuMusic()`).
  Restarts from game over never play it. Browsers allow no audio before the
  player's first interaction, so on a fresh page it starts with the title's
  click, just as the tutorial starts. (In round 1, two options were the game
  track itself, too close to the game music, and a chip loop didn't fit the
  game.)
- **Sounds** (M9) — every sound effect is synthesized in
  `src/audio/Synth.ts` from `AUDIO` in config, with no sound files. The
  pitched ones keep to the music's key (`AUDIO.key`, C minor pentatonic;
  `tests/sound-levels.test.ts` checks them), and they use chiptune voices to
  sit with its synths: the click, the fanfare and the whomp a pulse wave
  (`AUDIO.pulseDuty`), and the hit's thump and the whomp's low voice a
  triangle:
  - The **countdown**: silent until the wall is in CLOSE CALL range (past
    `GREAT_T`), then a tick-tock that speeds up as `t` nears 1 (`Countdown`
    in `src/logic/countdown.ts`, one per wall).
  - A click per held letter, rising a step up the key's scale each time.
  - A "bloop" on a slip, but not for the forced slips of a blur pause.
  - A fanfare on PERFECT: a quick C minor arpeggio up to the octave.
  - A Shift Wall alert panned to the side the hole is going, then a whoosh
    that way as it slides.
  - On a fail: a hit at once, a chip thump under a short smack of crunchy
    8-bit noise, then "whomp whomp whooom" as the figure lands: G, Eb, C,
    each bending down into its pitch over the triangle an octave under it,
    the last one long, wobbling and sagging. It runs on under the game-over
    screen and ends before restart is allowed. (A crowd "oooh" and a water
    splash sound were tried and cut. Until the music came, the hit was a
    sine thump with a smooth smack, and the whomp a sawtooth "sad trombone",
    G, F#, F, each note with a filter "wah".)

  The synth uses Phaser's audio context and master node, so audio unlocks on
  the first click and suspends while the window is blurred. Sounds are
  skipped while the context isn't running, so none queue up.
- **HUD** (M10b) — SCORE top-left and the WALL number top-right (`Hud`), each
  on a card after the mockup (slanted inner edge, lime slashes), above the play area: a dark caption in IBM Plex Mono over the
  dark number in Anton. The card grows with its number; a new score counts up, and each
  number pops when it changes. The mocks show a run timer top-right; the game
  has none, so the wall number takes its place.
- **Grid void** (the grid stage) — the background (`GridVoid`, M10b review 2,
  after the user's mockup): a glossy floor grid in the stage's perspective,
  continuing the runway's lanes and tile rows back to a **back wall** at the
  runway's far end, where the walls appear; the back wall's square grid
  carries the same lanes up the screen, with dots at its crossings. They
  meet at the **seam**, a glowing lime line with a soft bloom, and light
  rises toward it from both sides. A fixed composition
  (`src/data/void-art.ts`) frames it: lit back-wall cells that breathe in
  one slow sweep; squares that fall down their columns to the seam over
  6-10 s each, fading in and out with a faint trail (M10b review 3), some
  meeting their reflection rising up the glossy floor; and streaks of light
  running down the floor from the seam. The floor drifts toward the camera
  with a wave of light through its rows. All still
  for reduced motion. (Until M10b the background was a cream **collage**
  with torn paper at its edges; the first M10b pass had random glints, and
  its first review a faint grid melting into the dark, which read as flat.)
- **Runway** — the cream floor the figure stands on (`Floor`), its tile
  rows shading toward the deeper cream into the distance, with thin
  cream-gray seams and glowing lime lines down its sides. (M10 had filled
  green verges beside it and a paper-grain filter on it.)
- **Badge** — a solid parallelogram in a thick ink edge, leaning like the
  "//" slashes (`drawBadge()`, M10b review 4, when outlined text was lost
  against busy walls), with dark text: the timing label on its grade's
  color (PERFECT lime, GREAT cream, CLOSE CALL coral) with its points on an
  ink tab, and the SHIFT callout and its arrow on yellow. The edge is a
  filled shape, closed at every corner, and the text is centered on its
  letters (`centerGlyphs()`), not on Anton's line box (M11 review). (The
  screens' buttons were lime badges until M11 review 2.)
- **Button** — a screen's call to action (`PromptButton`, M11 review 2):
  dark Anton on a lime key cap shape, its top-left and bottom-right corners
  cut like the key caps, in a closed cream edge, its shape
  pulsing in size while its label holds still (M11 review 3):
  CLICK TO PLAY, START, CLICK TO RESUME, PLAY AGAIN. It sits one gap
  (`PROMPT_BUTTON.gapAbove`) below what comes before it, with any hint
  under it.
- **Card** — the cream panel of the HUD and the screens' headings
  (`drawCard()`, `CARD`): cut corners on its straight
  side, a side (or both) slanting inward toward its foot with lime slashes
  beside it. Every card keeps one slant angle. (A sage fold lay in the
  slanted side's foot until M11 review 2, and the title sat on one until
  review 5.)
- **Dark card** — a panel as dark as the bar, cut like a key cap, in a
  lime edge (`drawDarkCard()`; the title's is drawn lit, in `TitleLockup`):
  the title's lockup, the tutorial's step card, and
  the game-over card, with GAME OVER over a lime rule and the results parted
  by the bar's line (M11 review 4). (The How to play screen's step cards had
  sage edges until M11 review 5.)
- **Outlined text** — bright letters inside a thick dark stroke
  (`outlinedStyle()`, `TEXT_OUTLINE`), for the Caps Lock warning over the
  moving scene. (The timing label, the SHIFT callout and the pause text were
  outlined until M10b review 4 and M11 put them on badges and cards.)
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
