# SHAPE SHIFT — Game Plan

A keyboard version of Japan's *Nōkabe* ("Brain Wall", a.k.a. Human Tetris) for a game jam with the theme **SHIFT**.

A wall with a hole cut in it comes toward the player. They slide their block figure under the hole with the arrow keys, then hold down a growing set of letter keys to pose the figure so it fits through. If the figure doesn't fit, the wall shoves it into the pool.

**How the theme fits:** the **Shift key** (uppercase letters need it), **shape-shifting** (the figure changes pose), and a **shifting wall** (the hole slides mid-approach on later walls).

---

## 1. Tech stack

| Area | Choice | Notes |
|---|---|---|
| Engine | **Phaser 4** (`npm install phaser`) | The API is nearly the same as Phaser 3, so v3 tutorials mostly still apply. Use the WebGL renderer. |
| Language | TypeScript | Plain JS works too. TS catches state-machine bugs early. |
| Build | Vite | Set `base: './'` so the build runs from a subfolder (for itch.io). |
| Tests | Vitest | For game logic only (see the "pure logic" rule below). |
| Resolution | 1280×720, `Phaser.Scale.FIT`, centered | |
| Art (Week 1) | Phaser shapes (rectangles/Graphics) only | No SVG yet. |
| Art (Week 2+) | One SVG per body part, cutout style | Phaser turns SVGs into flat images when it loads them, so it can't change a path's shape while the game runs. Animate by moving and rotating separate parts instead. Load SVGs at the largest size they'll appear (the wall grows as it gets closer). |

### Rule: keep game logic separate from Phaser
Write the sequence/queue state machine, the letter generator, the difficulty curve and the scoring as **plain TS modules that don't import Phaser**. Phaser scenes only render that state and pass input into it. This keeps the core rules testable and easy to tune.

---

## 2. The core loop (one wall)

```
SPAWN → ALIGN → POSE → (SHIFT WALL?) → RESOLVE → next wall | GAME OVER
```

1. **SPAWN.** A wall appears far away, with its hole at a random lane. It starts moving toward the camera immediately. The hole's shape is visible from the start.
2. **ALIGN.** The player taps **← / →** to slide the whole figure one lane per tap, or **Space** to step one lane toward the hole. During a Shift Wall's warning, Space steps toward the lane the hole is about to slide to. Space lets a thumb line up either way without the hands leaving the letters. (Added in the M7 tuning pass as a step right that wrapped around. Changed after M7 to step toward the hole, because reaching for the arrows meant re-gripping the letters.) **No letters appear until the figure's lane matches the hole's lane.** When they match, the lane marker under the figure lights up.
3. **POSE.** Letters appear **one at a time** in the prompt tray. Holding the current letter moves its body block into the target pose, and the letter turns green. The next letter appears once the current one is held. While lined up, that next letter waits on the right as a hollow preview chip and slides to the center when it becomes current, so the player can get a finger ready (added in the M7 tuning pass).
4. **SHIFT WALL** (walls 4+). Partway through the approach, the hole slides 1 lane. Held letters keep their blocks in place, but **new letters stop appearing until the player lines up again**, which they have to do while still holding letters.
5. **RESOLVE.**
   - **Pass:** once every letter is held and the figure is lined up, the pose **locks**. The wall rushes past (about 0.4s), and the player gets a timing bonus.
   - **Fail:** the wall reaches the figure first. It shoves the figure into the pool with a splash, and the run ends.

### Input rules (be exact here)

| Situation | Result |
|---|---|
| Correct current letter pressed | That block moves to its target pose and the letter is marked **held**. |
| Uppercase prompt (e.g. `A`) | Shift must be down **at the moment of the press** (`event.key === 'A'`). After that the player may let go of Shift. |
| Lowercase prompt (e.g. `j`) | Either case is accepted, so a player still holding Shift from an earlier letter isn't punished. |
| Uppercase prompt pressed without Shift | Counts as a **wrong key**. |
| A held letter is released before the pose locks (**slip**) | The block goes limp (back to neutral), the letter turns red, and it moves to the **end of the queue**. It can only be pressed again when it comes back around as the current prompt. |
| Any letter key that isn't the current prompt and isn't held | **Wrong key:** the wall jumps forward (`WRONG_KEY_JUMP`), rattles side to side and flashes. (Week 1 shook the camera; M8 shakes only the wall, so the tray stays still while the player reads it.) This includes pressing a slipped letter before its turn comes back. |
| Letter pressed during ALIGN (no prompt showing) | Counts as a **wrong key**. |
| Arrow keys, Space, Shift, and all other non-letter keys | Never count as wrong keys. Arrows and Space move the figure, and the rest are ignored. |
| Pose locked | Input is ignored until the next wall. Keys still held from this wall are ignored until they're released. |
| Window loses focus (`blur`) | Pause the game and show "Click to resume". Every held letter counts as slipped. |

### Implementation notes for input
- Use the browser's own `keydown`/`keyup` on `window` instead of Phaser key objects for letters.
- Use **`event.key`** to check which letter it is and its case **at press time**.
- Use **`event.code`** (e.g. `KeyA`) to track held keys. That way, letting go of Shift doesn't look like a different key being released.
- Ignore `event.repeat`.
- If Caps Lock is on (`event.getModifierState('CapsLock')` on any key event), show a "Caps Lock is on" warning during play. The rules above don't change, but with Caps Lock on, Shift + letter can produce a lowercase `event.key`.
- Call `preventDefault()` on arrow keys and Space, so they don't scroll the page.
- The game will run inside an iframe (itch.io), so the title screen needs **"Click to play"** to get keyboard focus.

---

## 3. Stage, lanes, wall and figure

### Layout (matches the concept sketch)
- Pale pink background, with a floor drawn in perspective as two lines running from the bottom corners toward the wall.
- The wall comes in from the far end. It starts small (scale ≈ 0.35) and grows to full size at the figure's position. Drive everything from a single `progress` value, `t ∈ [0, 1]`, with an ease-in so the wall seems to speed up as it gets closer.
- A white **prompt tray** across the bottom:
  - **Held** letters as green chips, lined up from the left.
  - The **current** prompt as a blue chip in the center.
  - The **next** letter as a hollow, blue-outlined preview chip just right of center (only while lined up). It slides to the center when it becomes current.
  - **Slipped/queued** letters as red chips on the right.
  - **Capital** letters also carry a Shift mark (⇧) on their chip, because case alone is hard to read for letters like o/O, s/S and x/X.

### Lanes
- `LANE_COUNT = 7` lanes across the stage.
- A **lane marker** (a floor strip) sits under each lane. The one under the figure lights up green when the figure's lane matches the hole's lane.
- The figure keeps its lane from one wall to the next. It doesn't recenter.

### The figure (5 blocks)
`head`, `torso`, `armL`, `armR`, `legs`. Each block has:
- A **neutral** rectangle, in grid cells relative to the figure's position.
- A list of **alt poses** (2–4 rectangles each), e.g. head shifted left/right, arm raised or out, legs offset or narrowed.

Put these in `src/data/poses.ts` so they're easy to edit. Use a cell grid such as 6 columns × 8 rows, at 24px per cell at full scale.

### Wall generation
1. Pick `N` blocks to change, where `N` is the key count for this wall (3–5).
2. For each of those blocks, pick one alt pose. Blocks that aren't picked stay neutral.
3. The **hole** is the union of every block's target rectangle, placed at the hole's lane.
4. Give each changed block one letter (§4).

### Pass/fail check
Decide this from the **game state, not pixel collisions**:
`pass = aligned && every required letter is held`, checked once the pose locks. If `t` reaches 1 before that happens, the player fails. The hole is drawn from the same data, so the visuals always match the rule.

---

## 4. Letter generation ("cross and stretch")

The goal is combos that make hands cross and fingers stretch, starting easy and getting harder.

- Store a **QWERTY coordinate map** for A–Z (row, column, with the row offset each keyboard row has) in `src/data/keyboard.ts`.
- Mark each letter as **left-hand** or **right-hand** side, using the standard touch-typing split.
- **Stretch score** for a combo, in a pure function `stretchScore(letters)`:
  - spread: the largest distance between any two keys
  - plus row spread (combos covering top, home and bottom rows are harder)
  - plus a cross penalty: points when the letters are split unevenly between the two sides, which forces one hand to reach across
  - plus a same-column penalty: two keys in the same finger column
- Each difficulty tier has a `[minScore, maxScore]` range. Generate random combos without repeated letters and **reject** any outside the range (about 200 tries max, then take the closest).
- **One finger per letter (walls 1–18):** before the last tier, never put two letters on the same touch-typing finger (e.g. C + D, J + M). Those pairs force a finger off its key into a cramped grip, while spread alone (Q + P) is easy because each hand takes one side. The last tier allows them, and the same-column penalty prices them in. (Added in the M7 tuning pass: before it, 59% of wall 7–9 combos and 89% of wall 10–12 combos had such a pair.)
- **Order** the letters so that each new one isn't right next to the last one. Next to each other is fine on the 3-letter walls 1–5.
- **Uppercase:** turn the tier's number of Shift letters into uppercase. **Never put two uppercase letters back to back.** (Windows opens a Sticky Keys pop-up if Shift is pressed 5 times quickly.)
- **Key limit:** never ask for more than **5 letters**, and use at most **4** on Shift Wall rounds. With an arrow key (or Space) and Shift on top, that's up to 7 keys pressed at once. Many keyboards can't register that many keys together ("key ghosting").

---

## 5. Difficulty curve

All numbers live in `src/config.ts`.

Each tier after the first adds **one** new demand (in bold), while the wall time eases down by half a second or less. Bands are two walls long through wall 9 and three walls long after that, where each new demand is a bigger step.

| Walls | Tier | Letters | Stretch | Wall time | Shift letters | Hole distance (lanes) | Shift Wall |
|---|---|---|---|---|---|---|---|
| 1–3 | Easy | 3 | Easy (close together, one hand OK) | 10.0s | 0 | 1–2 | No |
| 4–5 | Shift Walls | 3 | Easy | 10.0s | 0 | 1–2 | **Wall 4 always, then 30% of walls** |
| 6–7 | Four letters | **4** | Easy for four | 10.0s | 0 | 1–3 | 30% |
| 8–9 | Wider stretch | 4 | **Medium (hands start crossing)** | 9.5s | 0 | 1–3 | 30% |
| 10–12 | Capitals | 4 | Medium | 9.5s | **1** | 1–3 | 30% |
| 13–15 | Five letters | **5** (4 on Shift Wall rounds) | Medium for five | 9.0s | 1 | 1–4 | 35% |
| 16–18 | Two capitals | 5 (4 on Shift Wall rounds) | Medium for five | 9.0s | **1–2** | 2–5 | 35% |
| 19+ | Shared fingers | 5 (4 on Shift Wall rounds) | **Hard: two letters may share a finger** | −4% per wall from 8.5s, never under 3.5s | 1–2 | 2–6 | 40%, +5% per wall to 80% |

Lining up is in from wall 1. Early walls are slow enough that new players learn the whole mechanic at once. Shift Walls come first, on easy letters, so players learn the theme mechanic while their hands are still free. Walls 1–18 keep one finger per letter (§4), so their stretch ranges are set from those combos alone.

(M7 tuning history: wall times were first raised from 8 / 7 / 6 / 5.5s after playtesting stalled at walls 7–8. The table was then re-cut from five 3-wall bands into eight 2-wall bands, because several demands landed together at walls 10 and 13 and the curve felt flat, then sudden. Walls 9+ were still too hard after that, so the next round moved Shift Walls to wall 4 (they started at wall 13 before the pass), moved every finger demand two walls later, grew the bands from wall 10 to three walls, and gave walls 9 and up more time.)

### Shift Wall details
- Triggers at a random `t ∈ [0.3, 0.5]`, but only once at least one letter is held. (Moved earlier from `[0.35, 0.6]` in the M7 tuning pass, to leave more time after the shift.)
- **Every Shift Wall shifts:** it also triggers early once only one letter is left to hold, and the pose can't lock during the warning. Otherwise a quick player could finish an easy wall before `t` reached the trigger, and the shift would never happen. (Added in the M7 tuning pass, with Shift Walls moving to 3-letter walls.)
- **Warning first:** the wall flashes and an arrow appears on it for 0.3s before the hole slides.
- **The wall holds still** for 1s from the warning: through the warning, the slide and time to line up again, then it carries on.
- **It reads as a change:** while the wall holds, a big **SHIFT** callout with an arrow pointing the hole's way pops up above the wall. The lane marker under the hole's new lane gets an orange outline and chevrons until the player is lined up with it. As the hole slides, the screen gives a short sideways jolt the same way (skipped for reduced motion).
- The hole slides 1 lane, staying inside the stage, so one tap of Space or an arrow lines up again. (It slid 1–2 lanes until the M7 follow-up.)
- New letters stop appearing until the player lines up again. Held letters stay held.
- Shift Wall rounds score their 4 letters against a stretch range set for 4-letter combos. A range set for 5 letters would only accept the most cramped 4.

(The hold, the callout, the target lane and the jolt were added in the M7 tuning pass. Before them, a shift was over too fast to follow and didn't read as a change: it fires while the wall is still far off, where the wall is small and barely moving.)

---

## 6. Scoring

| Event | Points |
|---|---|
| Wall cleared | 100 |
| **PERFECT** (pose locked with `t ≤ 0.5`) | +150 |
| **GREAT** (`t ≤ 0.75`) | +75 |
| **CLOSE CALL** (otherwise) | +25 |
| PERFECT streak multiplier | ×(1 + 0.5 × streak), max ×3. Any result other than PERFECT resets it. |

The timing label pops up big over the figure as the wall rushes past. Save the best score in `localStorage`, wrapped in try/catch.

---

## 7. Fail and restart

- When the player fails: the wall shoves the figure backward, it flails and falls, and a splash of blue particles and a screen shake follow.
- Game-over screen: **Walls cleared**, **Score**, **Best**, and the wall number where the run ended.
- **Restart:** ignore input for 1s, wait until **every key is released**, then any key or a click restarts. This stops keys still held from the failed wall from restarting the game straight away.

---

## 8. Tuning constants (`src/config.ts`)

```ts
LANE_COUNT = 7
WALL_START_SCALE = 0.35
WRONG_KEY_JUMP = 0.03          // added to t (0.06 before the M7 tuning pass)
LOCK_RUSH_DURATION = 400       // ms
PROMPT_APPEAR_DELAY = 120      // ms after the previous letter is held
SHIFT_WALL_TELEGRAPH = 300     // ms
SHIFT_WALL_PAUSE = 1000        // ms the wall holds still, from the warning (M7 tuning)
SHIFT_WALL_T_RANGE = [0.3, 0.5]
PERFECT_T = 0.5
GREAT_T = 0.75
RESTART_LOCKOUT = 1000         // ms
MIN_WALL_TIME = 3.5            // s
MAX_LETTERS = 5
MAX_LETTERS_SHIFT_WALL = 4
DIFFICULTY_TIERS = [...]       // table in §5
```

Add a **debug overlay** (toggled with F2, which never counts as a wrong key). It shows: state, `t`, wall #, figure lane vs hole lane, the current prompt, the queue, held codes, and the stretch score.

On the dev server only, two URL options skip ahead for playtesting (added in the M7 tuning pass): `?wall=13` starts every run at wall 13, and `?shiftwall` makes every wall a Shift Wall. Published builds ignore them.

---

## 9. Project structure

```
shape-shift/
├─ index.html
├─ vite.config.ts            # base: './'
├─ src/
│  ├─ main.ts                # Phaser game config
│  ├─ config.ts              # all tuning constants
│  ├─ data/
│  │  ├─ keyboard.ts         # QWERTY coords + hand sides
│  │  └─ poses.ts            # block neutral + alt poses
│  ├─ logic/                 # PURE — no Phaser imports
│  │  ├─ sequence.ts         # prompt / held / slip queue state machine
│  │  ├─ letters.ts          # stretchScore + combo generator
│  │  ├─ difficulty.ts       # wall # → params
│  │  ├─ wall-gen.ts         # poses → hole cells + lane
│  │  └─ scoring.ts
│  ├─ input/
│  │  └─ KeyboardInput.ts    # native listeners → logic events
│  ├─ objects/
│  │  ├─ Wall.ts
│  │  ├─ Figure.ts
│  │  ├─ LaneMarkers.ts
│  │  └─ PromptTray.ts
│  └─ scenes/
│     ├─ BootScene.ts
│     ├─ TitleScene.ts       # "Click to play" (gets keyboard focus)
│     ├─ PlayScene.ts
│     └─ GameOverScene.ts
└─ tests/
   ├─ sequence.test.ts
   ├─ letters.test.ts
   └─ difficulty.test.ts
```

---

## 10. Milestones

### Week 1: grey prototype (is it fun with plain rectangles?)

**M0: Scaffold** (done)
- Vite + Phaser 4 + TS + Vitest, at 1280×720 FIT, with a Title → Play → GameOver flow.
- ✅ `npm run dev` runs, `npm run build` creates a `dist/` that works when opened from a subfolder, and `npm test` passes.

**M1: Stage and wall coming in** (done)
- Floor drawn in perspective, a wall driven by `t` with an ease-in, a placeholder rectangular hole, and the prompt tray area.
- ✅ The wall grows smoothly from far away to the figure's position in `wallTime`, then loops.

**M2: Figure, lanes, lining up** (done)
- A 5-block figure in neutral pose, ← / → lane movement (one lane per tap, held keys don't repeat), lane markers, and the hole at a random lane.
- ✅ The marker lights up only when the figure's lane = the hole's lane, and the figure can't leave the stage.

**M3: Letter sequence (`logic/sequence.ts` + tests)** (done)
- One-at-a-time prompts, holding, slip → back of queue, wrong-key jump, Shift-at-press rule, lowercase accepting either case, pause on blur.
- Letters only appear while lined up.
- ✅ Unit tests cover: a normal run; a slip in the middle; a slip on the last letter; re-pressing a slipped letter early (wrong key); uppercase without Shift (wrong key); releasing Shift after an uppercase press (still held); blur.

**M4: Pass/fail, scoring, game over** (done)
- Real hole made from the poses (`wall-gen.ts`), blocks moving into their target poses when held, pose lock + rush, timing labels, streak multiplier, fail shove + splash placeholder, game-over screen, restart lockout and the "release all keys" rule.
- ✅ A full run is playable from start to game over and back again.

**M5: Difficulty and letter generator (+ tests)** (done)
- `stretchScore`, picking letters by tier, letter ordering, uppercase letters never back to back, the tier table.
- ✅ Tests confirm each tier's combos fall in its score range, letters never repeat in a combo, uppercase never comes back to back, and the letter caps are never exceeded.

**M6: Shift Wall** (done)
- The warning, the hole sliding, letters pausing until lined up again, and the 4-letter cap.
- ✅ Holding 3 letters while tapping an arrow to line up again works, and the next letter appears right away.

**M7: Debug overlay and tuning pass** (done)
- F2 overlay. Playtest 10 runs and adjust `config.ts`.
- ✅ Wall 1 can be cleared by a new player, and wall 12+ is hard but doable.
- Follow-up from the M7 playtests: Space steps toward the hole, and Shift Walls slide 1 lane, so lining up again never needs a hand off the letters.

### Week 2: making it feel good, theme, ship

Built in this order (chosen after M7): feel and audio go on the grey box first, then the art swaps in underneath, then the title screen and the ship. Motion effects are skipped for players who prefer reduced motion, and none of them touch the game state.

**M8: Feel** (done)
- Squash and stretch when a block snaps into place, a limp slump back to neutral when a held letter slips, the wall rattling on a wrong key, slow motion on CLOSE CALL, and a big splash with water particles and a ripple on a fail.
- ✅ Each effect plays at its moment, the motion ones are skipped for reduced motion, and pass/fail still comes only from the game state.

**M9: Audio** (done)
- Synthesized in code with Web Audio, with no sound files:
  - a countdown tick-tock once the wall is in CLOSE CALL range (past `GREAT_T`), speeding up as `t` nears 1
  - a click when a key is held, a step higher for each letter in the wall
  - a quick cartoon "bloop" on a slip (the forced slips of a blur pause make no sound)
  - a fanfare on PERFECT
  - a Shift Wall alert heard from the side the hole is moving to, then a whoosh that way as it slides
  - on a fail: a hit the moment the wall reaches the figure, and a splash (fizz and rising bubbles) as the figure lands
- (After the M9 playtest, the countdown replaced a wall rumble that swelled with `t`. The slip sound got lighter, and the Shift Wall alert and the hit were added. After the second playtest, the crowd "OOOH" that followed the hit was cut, and the hit moved up into a range laptop speakers play. After the third, the splash lost its low plunk, which sounded like a second hit, and became fizz and bubbles.)
- ✅ Each sound plays at its moment, the countdown follows `t`, and nothing plays before the player's first click (browser autoplay rules).

**M10: Art**
- Replace the blocks with hand-written SVG cutout body parts, keeping the same 5 parts and pose data. Use game-show style lettering for the wall and tray.
- ✅ Every pose still fits its hole exactly, the SVGs load at the largest size they appear, and the contrast tests still pass.

**M11: Title screen**
- *SHAPE SHIFT*, with a short how-to (← → or Space to line up, hold letters, Shift for CAPS).
- ✅ A new player can start a run knowing the controls from the title screen alone.

**M12: Ship**
- itch.io HTML5 upload (zip of `dist/`), set the embed to 1280×720, add a fullscreen button, and test in Chrome, Firefox and Safari.
- ✅ The itch.io build plays a full run in Chrome, Firefox and Safari, both embedded and fullscreen.

### Stretch goals (only if there's time)
- Shift Wall variant where the hole's **shape** changes too (one block's key gets swapped for a new letter).
- Daily seed (same walls for everyone) + a shareable score line.
- Option for AZERTY/QWERTZ layouts in the stretch scoring.

---

## 11. Open questions for later
- Should the lane-matched marker also flash briefly when a Shift Wall warning starts?
- Should the camera move in close on the figure for the last 20% of the approach?
