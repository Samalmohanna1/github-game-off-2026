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
| `PlayScene` | Placeholder (M0) | Any key or click ends the run. M1–M7 build the stage, wall, figure, lanes, prompt tray and rules here. |
| `GameOverScene` | Interim | Walls cleared, score, best, wall reached, restart prompt. The restart lockout and "release every key" rule arrive in M4. |

Shared scene helpers live in `src/scenes/` (`ui.ts`, `text-styles.ts`,
`scene-keys.ts`). Game objects (`Wall`, `Figure`, `LaneMarkers`, `PromptTray`)
arrive in `src/objects/` from M1.

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
  get `preventDefault()`.
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
  scenes/
    BootScene.ts           # hands off to Title
    TitleScene.ts          # "Click to play" (gets keyboard focus)
    PlayScene.ts           # the game; M0 placeholder for now
    GameOverScene.ts       # run stats + restart
    scene-keys.ts          # scene keys + RunResult handed to GameOver
    text-styles.ts         # Phaser text style built from config tokens
    ui.ts                  # pulsing prompt, scene-scoped window keydown
tests/
  config.test.ts           # config invariants + text contrast
  purity.test.ts           # pure modules never import Phaser
```

The planned folders from PLAN.md §9 arrive with their milestones: `src/data/`
(QWERTY map, poses), `src/logic/`, `src/input/KeyboardInput.ts` and
`src/objects/`. Add each to this tree when it lands.

Where things go: rules → `src/logic/`. Static game data such as the keyboard
map and pose tables → `src/data/`. Numbers you'd tweak while tuning →
`src/config.ts`. Anything that draws or listens → `scenes/`, `objects/` or
`input/`.

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
  bold only. Game-show lettering for the wall and tray comes in Week 2.
- **Contrast: WCAG AAA preferred, AA required.** Aim for AAA — **7:1 normal
  text, 4.5:1 large text** (≥24px, or ≥18.66px bold). A color between AA and
  AAA may ship, but no text goes below **AA — 4.5:1 normal, 3:1 large**.
  Meaningful non-text graphics (lit vs unlit lane marker; held, current and
  slipped chips) need 3:1. **Verify pairs, don't eyeball them**:
  `tests/config.test.ts` measures every `TEXT_COLORS` entry against the stage
  and keeps every font size at 24px or more. Text that fades or flashes must
  still meet AA at its faintest frame. Record every pair below AAA, with its
  measured ratio, in the list below.
  - Pairs below AAA: none.
- **Keyboard first.** The game is played entirely on the keyboard, except the
  title's "Click to play", which PLAN.md §2 requires so the itch.io iframe gets
  keyboard focus. Game over restarts on any key or a click.
- **Don't rely on color alone.** Held, current and slipped letters also differ
  by position in the tray (left, center, right; PLAN.md §3).
- **Desktop only.** The game needs a physical keyboard. It renders at 1280×720
  and scales to fit; there is no mobile or touch layout.
- **Motion.** Honor `prefers-reduced-motion` for decorative motion; the pulsing
  prompts stay still under it.
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
  rectangle, placed at the hole's lane (planned: `src/logic/wall-gen.ts`).
- **Lane** — one of `LANE_COUNT` (7) columns across the stage. The figure and
  the hole each sit in one lane. The figure keeps its lane between walls.
- **Lane marker** — the floor strip under each lane. The one under the figure
  lights up green when the player is lined up.
- **Lined up** (aligned) — the figure's lane equals the hole's lane. Letters
  only appear while lined up.
- **`t`** (progress) — the wall's approach from 0 (far away) to 1 (at the
  figure), with an ease-in. It drives the wall's scale and position. Reaching 1
  before the pose locks is a fail.
- **Wall time** — seconds a wall takes to go from `t` = 0 to 1. It shrinks as
  the difficulty rises, never below `MIN_WALL_TIME`.
- **Figure** — the player's five blocks: `head`, `torso`, `armL`, `armR`,
  `legs`.
- **Pose** — a block's rectangle(s) in grid cells. Each block has a neutral
  pose and alt poses; the **target pose** is the alt pose a wall asks for
  (planned: `src/data/poses.ts`).
- **Prompt** — the letter currently asked for, shown as the blue chip in the
  center of the tray. Letters appear one at a time.
- **Prompt tray** — the white strip along the bottom: held letters (green,
  left), the current prompt (blue, center), slipped or queued letters (red,
  right).
- **Held** — a prompted letter that was pressed correctly and is still down;
  its block sits in the target pose. Held keys are tracked by `event.code`.
- **Slip** — letting go of a held letter before the pose locks. Its block
  snaps back to neutral and the letter goes to the end of the queue.
- **Queue** — the letters still to be prompted, including slipped ones
  (planned: `src/logic/sequence.ts`).
- **Wrong key** — any letter that isn't the current prompt and isn't held,
  including a slipped letter pressed early, any letter while not lined up, and
  an uppercase prompt pressed without Shift. The wall jumps forward by
  `WRONG_KEY_JUMP`.
- **Pose lock** — every letter held while lined up. The pose freezes, the wall
  rushes past (`LOCK_RUSH_DURATION`), and input is ignored until the next wall.
- **Shift Wall** — from wall 13, the hole slides 1–2 lanes partway through the
  approach after a `SHIFT_WALL_TELEGRAPH` warning. New letters pause until the
  player lines up again.
- **Stretch score** — how awkward a letter combo is to hold: key spread, row
  spread, a cross-hand penalty and a same-column penalty (planned:
  `stretchScore()` in `src/logic/letters.ts`).
- **Tier** — a band of walls with its own letter count, stretch-score range,
  wall time and Shift letters (PLAN.md §5; `DIFFICULTY_TIERS` in config from
  M5).
- **PERFECT / GREAT / CLOSE CALL** — the timing grade at pose lock:
  `t ≤ PERFECT_T`, `t ≤ GREAT_T`, or later.
- **Streak** — consecutive PERFECTs. It sets the score multiplier,
  ×(1 + 0.5 × streak), capped at ×3 (PLAN.md §6).
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
  (the M0 Play screen says "Placeholder:"). Don't invent authoritative-looking
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
