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
with ← / →, then hold a growing set of letter keys (Shift for capitals) to pose
the figure so it fits through. If it doesn't fit, the wall shoves the figure
into the pool. It ships on itch.io as an HTML5 game, played on a desktop
keyboard.

Current state: **Week 1 grey-box prototype**, built one milestone at a time
(M0–M7, PLAN.md §10). Everything is drawn with Phaser shapes. SVG art, audio
and polish come in Week 2.

Scenes, one per screen:

| Scene | Status | Contents |
|---|---|---|
| `BootScene` | Final for Week 1 | Hands off to Title. Loads nothing until Week 2 art. |
| `TitleScene` | Interim | Game name, one-line how-to, "Click to play". The click gives the page keyboard focus inside the itch.io iframe. Restyled in Week 2. |
| `PlayScene` | Interim (M6) | The full Week 1 loop, driven by the difficulty curve (`planWall()` per wall: letter count, stretch range, Shift letters, wall time, hole distance, Shift Wall roll). A wall approaches with a hole cut from the poses (`wall-gen.ts`). ← / → line the figure up; the tray then prompts the wall's stretch-scored letters one at a time, and each held letter snaps its block into the target pose. Slips, wrong keys and the Shift rule follow PLAN.md §2. On a Shift Wall (wall 13+), the wall turns orange with an arrow, then the hole slides 1–2 lanes; held letters stay, and new ones wait until the figure lines up again. All letters held while lined up locks the pose: the wall rushes past, a PERFECT / GREAT / CLOSE CALL label pops over the figure, and the next wall starts. If the wall arrives first, it shoves the figure into a placeholder splash and the run ends. Capital chips carry a Shift mark, a warning shows while Caps Lock is on, and losing focus pauses behind a "Click to resume" panel. |
| `GameOverScene` | Interim | Walls cleared, score, best (saved in `localStorage`) and the wall reached. Restart follows PLAN.md §7: input is ignored for `RESTART_LOCKOUT`, then every key must be up ("Let go of every key" shows meanwhile) before a key or click restarts. |

Shared scene helpers live in `src/scenes/` (`ui.ts`, `text-styles.ts`,
`scene-keys.ts`). Game objects live in `src/objects/`: `Floor`, `LaneMarkers`,
`Wall`, `Figure`, `PromptTray`, `TimingLabel`, `PauseOverlay` and the
`playSplash()` placeholder. The best score lives in `src/storage/`. Keyboard input lives in `src/input/`:
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
- **Art:** Phaser shapes, rectangles and Graphics only until Week 2. No SVGs or
  image assets before then. Week 2 swaps in one SVG per body part and keeps the
  same five parts and pose data (PLAN.md §1).

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
  config.ts                # every tunable number (PLAN.md §8)
  data/                    # PURE: static game data
    keyboard.ts            # QWERTY row/x (with stagger), hand, finger per letter
    poses.ts               # block ids, neutral pose and alt poses on the grid
  input/
    KeyboardInput.ts       # native key/blur events -> moves, letters, pause, Caps Lock
    prevent-page-scroll.ts # arrows/Space never scroll the host page
  logic/                   # PURE: no Phaser imports
    approach.ts            # t clock, wrong-key jump, ease-in, wall scale
    lanes.ts               # lane moves, alignment, hole lane, lane x
    difficulty.ts          # wall # -> tier, wall time, Shift Wall roll, WallPlan
    letters.ts             # stretchScore, combo generator, ordering, capitals
    random.ts              # injectable random helpers (shuffle, pick, int)
    perspective.ts         # vanishing point, project(), floor edges
    restart.ts             # game-over lockout + "release every key" gate
    scoring.ts             # grades, wall points, PERFECT streak multiplier
    sequence.ts            # prompt / held / slip queue state machine + lock
    shift-wall.ts          # Shift Wall trigger, warning timer, slide target
    wall-gen.ts            # blocks + alt poses per wall, hole grid + outline
  objects/
    Floor.ts               # the two perspective floor lines
    LaneMarkers.ts         # floor strip per lane; lit = lined up
    Wall.ts                # wall + hole; wrong-key flash, Shift warning + slide
    Figure.ts              # five blocks in the neutral pose; slides lanes
    PromptTray.ts          # tray with held / current / slipped letter chips
    PauseOverlay.ts        # "Click to resume" panel shown on blur
    TimingLabel.ts         # PERFECT / GREAT / CLOSE CALL + points pop-up
    splash.ts              # placeholder pool splash of blue squares
  scenes/
    BootScene.ts           # hands off to Title
    TitleScene.ts          # "Click to play" (gets keyboard focus)
    PlayScene.ts           # the game: draws state, passes input in
    GameOverScene.ts       # run stats, best score, gated restart
    scene-keys.ts          # scene keys + RunResult handed to GameOver
    text-styles.ts         # Phaser text style built from config tokens
    ui.ts                  # pulsing prompt, reduced motion, window key events
  storage/
    best-score.ts          # best score in localStorage, every access guarded
tests/
  approach.test.ts         # t advance, wrong-key jump, ease-in, wall scale
  best-score.test.ts       # best score kept; corrupt or blocked storage
  config.test.ts           # config invariants + text and graphics contrast
  difficulty.test.ts       # tier table, wall time decay, Shift Wall chance, caps
  keyboard.test.ts         # all 26 letters, hand split, stagger, fingers
  lanes.test.ts            # lane moves, clamping, hole lane, lane geometry
  letters.test.ts          # stretchScore; per tier: range, no repeats, capitals, caps
  perspective.test.ts      # projection and floor geometry
  poses.test.ts            # neutral pose fits the grid, no overlaps
  purity.test.ts           # pure modules never import Phaser
  restart.test.ts          # lockout, release-every-key, click
  scoring.test.ts          # grades, points, streak multiplier and cap
  seeded.ts                # deterministic random for repeatable tests
  sequence.test.ts         # PLAN.md §2 input rules, incl. the M3 cases + lock
  shift-wall.test.ts       # trigger, warning, slide range, M6 line-up case
  wall-gen.test.ts         # valid poses for every block set, hole + outline
```

Everything in PLAN.md §9's layout now exists. Add new files to this tree when
they land (M7's debug overlay).

Where things go: rules, and the pure math they depend on (the `t` clock,
perspective) → `src/logic/`. Static game data such as the keyboard map and
pose tables → `src/data/`. Numbers you'd tweak while tuning →
`src/config.ts`. Browser storage → `src/storage/`, with every access guarded.
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
  thing on screen (`Wall`, `Figure`, `LaneMarkers`, `PromptTray`). Keep scenes
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
  inventing inline values. `config.ts` is the single re-skin point. Week 2 art
  replaces the shapes but keeps the same pose data and tokens.
- **Typography:** Week 1 uses the system sans stack in `FONT_FAMILY`, normal or
  bold only. Prompt letters use `CHIP_FONT_FAMILY` (Verdana, Tahoma), whose
  capital I has crossbars and can't be mistaken for a lowercase l; any future
  prompt font must keep I and l distinct. Game-show lettering for the wall and
  tray comes in Week 2.
- **Contrast: WCAG AAA preferred, AA required.** Aim for AAA — **7:1 normal
  text, 4.5:1 large text** (≥24px, or ≥18.66px bold). A color between AA and
  AAA may ship, but no text goes below **AA — 4.5:1 normal, 3:1 large**.
  Meaningful non-text graphics (the wall and its hole, floor lines, tray edge,
  lit vs unlit lane marker; held, current and slipped chips) need 3:1.
  **Verify pairs, don't eyeball them**: `tests/config.test.ts` measures every
  meaningful graphic color against what it sits on, measures each text color
  against every background it is drawn on (`TEXT_ON` in that test; add new
  pairs there), and keeps every font size at 24px or more. Text that fades or
  flashes must still meet AA at its faintest frame. Text drawn over the moving
  scene carries its own background: an opaque panel, or the timing label's
  thick white stroke. Record every pair below AAA, with its measured
  ratio, in the list below.
  - Pairs below AAA: none.
- **Keyboard first.** The game is played entirely on the keyboard, except the
  title's "Click to play", which PLAN.md §2 requires so the itch.io iframe gets
  keyboard focus. Game over restarts on any key or a click. During play, a
  warning shows while Caps Lock is on (PLAN.md §2).
- **Don't rely on color alone.** Held, current and slipped letters also differ
  by position in the tray (left, center, right; PLAN.md §3). Don't rely on case
  alone either: capital chips carry a drawn Shift mark (`SHIFT_MARK`). The
  Shift Wall warning is as bright as the wrong-key flash, so its arrow, not
  its orange, is what sets it apart.
- **Desktop only.** The game needs a physical keyboard. It renders at 1280×720
  and scales to fit; there is no mobile or touch layout.
- **Motion.** Honor `prefers-reduced-motion`: the pulsing prompts stay still
  and the wrong-key camera shake is skipped under it (`prefersReducedMotion()`
  in `src/scenes/ui.ts`). Feedback that carries meaning keeps a still
  alternative, such as the wall flash.
- **Performance budget.** One bundle (Phaser plus game code), no third-party
  scripts, no network requests at runtime. The best score is the only thing
  stored, in `localStorage`, wrapped in try/catch (PLAN.md §6).

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
  changes one block per letter, never lets blocks overlap, and prefers a
  one-piece silhouette. Turning the torso always parts it from one arm, so
  those walls can have a small gap.
- **Lane** — one of `LANE_COUNT` (7) columns across the stage. The figure and
  the hole each sit in one lane. The figure starts a run in the center lane and
  keeps its lane between walls (`src/logic/lanes.ts`).
- **Lane marker** — the floor strip under each lane. The one under the figure
  lights up green (filled, not just outlined) when the player is lined up.
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
  it; from wall 13 it drops `WALL_TIME_DECAY` (4%) per wall, never below
  `MIN_WALL_TIME` (`wallTimeFor()` in `src/logic/difficulty.ts`).
- **Vanishing point** — where the floor lines meet, at
  (`GAME_WIDTH / 2`, `HORIZON_Y`). Every depth is a scale toward it
  (`src/logic/perspective.ts`).
- **Figure plane** — the depth where the figure stands, on `FIGURE_FLOOR_Y`.
  It is scale 1: the wall reaches full size there.
- **Figure** — the player's five blocks: `head`, `torso`, `armL`, `armR`,
  `legs`.
- **Pose** — a block's rectangle(s) in grid cells. Each block has a neutral
  pose and 2–3 alt poses; the **target pose** is the alt pose a wall asks for
  (`src/data/poses.ts`). Holding a block's letter snaps it to its target, and a
  slip snaps it back to neutral.
- **Prompt** — the letter currently asked for, shown as the blue chip in the
  center of the tray. Letters appear one at a time: the next one shows
  `PROMPT_APPEAR_DELAY` after the previous hold, and only while lined up and
  not paused. Upcoming fresh letters stay hidden.
- **Prompt tray** — the white strip along the bottom: held letters (green,
  left, in the order held), the current prompt (blue, center), and slipped
  letters waiting their turn (red, right, in queue order). Capital letters
  carry a ⇧ Shift mark in the chip's top-right corner.
- **Caps Lock warning** — a line under the placeholder hint while Caps Lock is
  on. The state is read from every key event with `getModifierState`.
- **Held** — a prompted letter that was pressed correctly and is still down;
  its block sits in the target pose (from M4). Held keys are tracked by
  `event.code`.
- **Slip** — letting go of a held letter before the pose locks. Its block
  snaps back to neutral (from M4) and the letter goes to the end of the queue.
- **Queue** — the letters still to be prompted, including slipped ones; its
  head is the current prompt (`LetterSequence` in `src/logic/sequence.ts`).
- **Wrong key** — any letter that isn't the current prompt and isn't held,
  including a slipped letter pressed early, any letter while no prompt is
  showing (not lined up, or during the appear delay), and an uppercase prompt
  pressed without Shift. The wall jumps forward by `WRONG_KEY_JUMP` and
  flashes, and the camera shakes unless the player prefers reduced motion.
  Letters pressed with Ctrl, Cmd or Alt are shortcuts and are ignored.
- **Stale key** — a letter still held from the previous wall. It is ignored
  until released, so it can't slip or count on the new wall.
- **Pose lock** — every letter held while lined up. The pose freezes, the wall
  rushes past (`LOCK_RUSH_DURATION`, scaling to `RUSH_END_SCALE` and moving in
  front of the figure once past it), and input is ignored until the next wall.
  It is decided from game state (`maybeLock()` in `PlayScene`), never from pixels.
- **Fail** — `t` reaches 1 before the pose locks. The figure is shoved toward
  the camera into a placeholder splash, then the game-over screen shows.
- **Restart gate** — after a fail, input is ignored for `RESTART_LOCKOUT`, then
  every key held from the run must be released before a fresh key or a click
  restarts (`src/logic/restart.ts`).
- **Shift Wall** — from wall 13, partway through the approach, the hole slides
  `SHIFT_WALL_SLIDE` (1–2) lanes, staying on the stage. It fires once, at a
  random `t` in `SHIFT_WALL_T_RANGE` but not before a letter is held. First the
  wall turns `wallWarning` orange with an arrow pointing the way it will go for
  `SHIFT_WALL_TELEGRAPH`, then the hole slides (`src/logic/shift-wall.ts`).
  Held letters stay held; new letters wait until the figure lines up again,
  and show at once when it does. The chance starts at 50% on wall 13 and rises
  `SHIFT_WALL_CHANCE_STEP` per wall to `SHIFT_WALL_CHANCE_MAX`. Shift Wall
  rounds ask for at most `MAX_LETTERS_SHIFT_WALL` letters.
- **Stretch score** — how awkward a letter combo is to hold
  (`stretchScore()` in `src/logic/letters.ts`): the widest gap between two
  keys in key widths, plus `STRETCH_WEIGHTS` points per extra keyboard row, per
  letter beyond `HAND_CAPACITY` on one side, and per pair on the same finger.
  For scale: a-s-d is 2, f-g-h is 4, Q-P-Z is 12.5.
- **Tier** — a band of walls with its own letter count, stretch-score range,
  neighbor rule, wall time, Shift letters, hole distance and Shift Wall chance
  (`DIFFICULTY_TIERS` in config, PLAN.md §5). Each wall's letters are random
  distinct combos, retried until the score lands in the tier's range (and, from
  wall 4, until they can be ordered with no neighboring keys back to back).
- **PERFECT / GREAT / CLOSE CALL** — the timing grade at pose lock:
  `t ≤ PERFECT_T`, `t ≤ GREAT_T`, or later. A wall scores
  `WALL_CLEAR_POINTS` plus the grade's bonus (`src/logic/scoring.ts`).
- **Streak** — consecutive PERFECTs. A PERFECT's whole score is multiplied by
  1 + `STREAK_STEP` × the PERFECTs already in the streak, capped at
  `MAX_MULTIPLIER`, so the first PERFECT is ×1 and the second ×1.5. Any other
  grade scores ×1 and resets the streak (PLAN.md §6).
- **Key ghosting** — keyboards failing to register many keys held at once. It
  is why a wall asks for at most 5 letters, and 4 on Shift Walls.
- **Sticky Keys** — the Windows pop-up after 5 quick Shift presses. It is why
  two uppercase letters never come back to back.

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
