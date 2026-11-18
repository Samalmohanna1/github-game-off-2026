# SHAPE SHIFT — Game Plan

A keyboard version of Japan's *Nōkabe* ("Brain Wall", a.k.a. Human Tetris) for a game jam with the theme **SHIFT**.

A wall with a hole cut in it comes toward the player. They slide their block figure under the hole with Space, then hold down a growing set of letter keys to pose the figure so it fits through. If the figure doesn't fit, the wall knocks it over.

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
| Art (M10b+) | A lit sci-fi grid stage with an editorial edge, after the user's mockup, all drawn in code | Deep forest green and near-black, warm cream, muted sage, and an acid lime accent. A cream runway with glowing lime edges on a glossy floor grid that meets a gridded back wall at a glowing lime seam, framed by lit cells, falling squares and floor streaks; each wall is a dark glass display panel in a neon lime frame with its hole cut out, which the figure completes when it clears the wall, its cells lighting up like the panel's pixels; cream cards (the HUD and the screens' headings) and a line-art bar, both with lime "//" slashes, solid badges for the popups, and on the screens, lime key cap buttons and dark cards. Clean edges, no texture: depth comes from light. The figure stays five blocks, styled as in the mocks. (M10 was an editorial collage with torn paper and a paper-grain filter; planned as one SVG per body part until the mocks arrived.) |
| Audio | Sound effects synthesized with Web Audio (M9), plus one music track | The track (`src/assets/audio/`, the user's) loops through each run and stops when the player loses; the game over plays it slowed, muffled and echoing. It loads in the background, so the title never waits for it. The effects are tuned to its key and use chiptune voices. |
| Fonts | Anton (display) and IBM Plex Mono (everything else) | Bundled from `@fontsource` (SIL OFL), never fetched at runtime. BootScene waits for them, because Phaser draws text once with whatever font is ready. |

### Rule: keep game logic separate from Phaser
Write the sequence/queue state machine, the letter generator, the difficulty curve and the scoring as **plain TS modules that don't import Phaser**. Phaser scenes only render that state and pass input into it. This keeps the core rules testable and easy to tune.

---

## 2. The core loop (one wall)

```
SPAWN → ALIGN → POSE → (SHIFT WALL?) → RESOLVE → next wall | GAME OVER
```

1. **SPAWN.** A wall appears far away, with its hole at a random lane. It starts moving toward the camera immediately. The hole's shape is visible from the start.
2. **ALIGN.** The player taps **Space** to slide the whole figure one lane toward the hole per tap. During a Shift Wall's warning, Space steps toward the lane the hole is about to slide to. Space lets a thumb line up either way without the hands leaving the letters. (Added in the M7 tuning pass as a step right that wrapped around. Changed after M7 to step toward the hole, because reaching for the arrows meant re-gripping the letters. After M10, the ← / → arrows were dropped, and Space is the only move.) **No letters appear until the figure's lane matches the hole's lane.** When they match, the floor tile the figure stands on lights up.
3. **POSE.** Letters appear **one at a time** in the prompt tray. Holding the current letter moves its body block into the target pose, and the letter turns green. The next letter appears once the current one is held. While lined up, that next letter waits on the right as a hollow preview chip and slides to the center when it becomes current, so the player can get a finger ready (added in the M7 tuning pass).
4. **SHIFT WALL** (walls 4+). Partway through the approach, the hole slides 1 lane. Held letters keep their blocks in place, but **new letters stop appearing until the player lines up again**, which they have to do while still holding letters.
5. **RESOLVE.**
   - **Pass:** once every letter is held and the figure is lined up, the pose **locks**. The wall rushes past (about 0.4s), and the player gets a timing bonus.
   - **Fail:** the wall reaches the figure first. It knocks the figure over, its blocks clatter onto the floor, and the run ends.

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
| Space, Shift, the arrow keys and all other non-letter keys | Never count as wrong keys. Space moves the figure, and the rest are ignored. |
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
- A dark **grid stage** (M10b, after the user's mockup): a glossy floor grid in the stage's perspective, continuing the runway's lanes and tile rows back to a **back wall** at the runway's far end, where the walls appear. The back wall's square grid carries the same lanes up the screen, and the two meet at a glowing lime **seam**, with light rising toward it. A fixed composition frames the play, clear of the wall's path: lit back-wall cells that breathe in one slow sweep, squares that fall slowly down to the seam and fade, and streaks of light running down the floor; the floor drifts toward the camera with a wave of light. The cream **runway** is drawn in perspective from the bottom corners toward the wall, its rows shading into the distance, with thin cream-gray seams and glowing lime edges. (Week 1 was a pale pink background with two floor lines. M10 was an editorial collage: a cream background with torn paper at its edges, and green verges beside the floor.)
- The wall comes in from the runway's far end, fading in there. It starts small (scale ≈ 0.35) and grows to full size at the figure's position. Drive everything from a single `progress` value, `t ∈ [0, 1]`, with an ease-in so the wall seems to speed up as it gets closer. Each wall shows a fresh random geometric pattern (M10b review 3): a quilt of square tiles, 2, 3 or 4 rows high, each a motif (quarter or half discs, discs, rings, triangles, halves, stripes, diamonds, dots) in one color on a ground in another, a few motifs per wall, in one of a handful of color schemes from the palette, in a thin cream frame. The hole is cut out of the pattern, so the runway and the void show through it, edged in a thin cream line. The wall is a pattern-completion puzzle: when the pose locks, the wall comes the rest of the way to the figure, where hole and pose line up cell for cell; the figure's pixels take the colors of the pattern's missing piece, row by row from the feet up, then the pattern's own detail fills in over them while a lime trace of the silhouette fades, so the wall looks whole; then the wall fades away. The figure itself never changes.
- A **bar** of key caps along the bottom, below the runway (M10b, after the mockup): a dark band with a thin stepped line along its foot, lime "//" slashes at its left end, a faint socket in its center for the current prompt, and at its right end one square per letter of the wall, lit lime as each is held. Its chips are angular cream key caps with dark letters, and letters flow right to left:
  - **Held** letters edged in lime, lined up left of the center, the latest nearest it. A newly held chip pops into place.
  - The **current** prompt in the center socket, framed in lime.
  - The **next** letter as a hollow, cream-outlined preview chip just right of center (only while lined up). It slides to the center when it becomes current.
  - **Slipped/queued** letters as coral chips on the right. A newly slipped chip wobbles.
  - **Capital** letters also carry a Shift mark (⇧) on their chip, because case alone is hard to read for letters like o/O, s/S and x/X.
- **SCORE** and the **WALL** number sit in the top corners, above the play area, on cream cards after the mockup: small cut outer corners, an inner edge slanting toward the middle, and lime "//" slashes beside it (a sage fold sat in that corner until M11 review 2). A dark caption in IBM Plex Mono over the dark number in Anton (M10b). A new score counts up, and each number pops when it changes. Text over the moving scene (the timing label, the SHIFT callout, the Caps Lock warning, the pause text) is bright inside a thick dark outline.

### Lanes
- `LANE_COUNT = 7` lanes across the stage.
- The floor's tiles are cut so the figure stands centered on a tile in its lane. That **lane tile** lights up green when the figure's lane matches the hole's lane. (Until M10's second review, each lane had a separate outlined strip in front of the figure.)
- The figure keeps its lane from one wall to the next. It doesn't recenter.

### The figure (5 blocks)
`head`, `torso`, `armL`, `armR`, `legs`. Each block has:
- A **neutral** rectangle, in grid cells relative to the figure's position.
- A list of **alt poses** (2–4 rectangles each), e.g. head shifted left/right, arm raised or out, legs offset or narrowed.

Put these in `src/data/poses.ts` so they're easy to edit. Use a cell grid such as 6 columns × 8 rows, at 24px per cell at full scale.

### Wall generation
1. Pick `N` blocks to change, where `N` is the key count for this wall (3–5).
2. For each of those blocks, pick one alt pose. Blocks that aren't picked stay neutral.
3. The **hole** is the union of every block's target rectangle, placed at the hole's lane. It is always **one piece** (M10): if no pose of the picked blocks makes one, the letters go to another set of blocks that can.
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
- **It reads as a change:** while the wall holds, a big **SHIFT** callout with an arrow pointing the hole's way pops up above the wall. The hole's new lane's tile gets an orange outline and chevrons until the player is lined up with it. As the hole slides, the screen gives a short sideways jolt the same way (skipped for reduced motion).
- The hole slides 1 lane, staying inside the stage, so one tap of Space lines up again. (It slid 1–2 lanes until the M7 follow-up.)
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

The timing label pops up big over the figure as the wall rushes past. The game over shows the run's own results only: nothing is saved between runs. (Until the M11 review, the best score was saved in `localStorage` and shown as BEST; the user found an all-time best beside one run's results confusing.)

---

## 7. Fail and restart

- When the player fails: the wall knocks the figure off its feet, toward the camera. It flails its arms as it topples toward the middle of the stage, and when it hits the floor its blocks come apart and bounce, low like wood rather than rubber, then tip flat and lie still. A screen shake goes with the landing. (Until the fifth M10 review, the figure fell into a pool with a splash of water particles and a ripple.)
- Game-over screen: the run's **Score** and **Walls cleared**. (It also showed the wall number where the run ended until M11 review 2; that is always walls cleared + 1.)
- **Restart:** ignore input for 1s, wait until **every key is released**, then any key or a click restarts. This stops keys still held from the failed wall from restarting the game straight away.

---

## 8. Tuning constants (`src/config.ts`)

```ts
LANE_COUNT = 7
WALL_START_SCALE = 0.32        // set with the figure's depth (0.35 at FIGURE_FLOOR_Y 530)
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
│  │  ├─ LaneTiles.ts
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
  - on a fail: a hit the moment the wall reaches the figure, then a game-show "whomp whomp whooom" (falling brassy notes, the last one long and sagging) as the figure lands
- (After the M9 playtest, the countdown replaced a wall rumble that swelled with `t`. The slip sound got lighter, and the Shift Wall alert and the hit were added. After the second playtest, the crowd "OOOH" that followed the hit was cut, and the hit moved up into a range laptop speakers play. After the third, the splash sound, which kept sounding like a second hit, was replaced by the "whomp whomp whooom". The visual splash stayed until the fifth M10 review.)
- (After M11, at the user's request: music. The user's track is the game's one sound file. Each run plays it from the top, looping, and it stops as the wall hits, so the fail's sounds play alone; the other screens are silent. It is mixed well under the effects (`AUDIO.music`). At first it played under every screen from the title's click; the user asked for it during play only. The effects were then matched to it: the track is in C minor at 90 BPM, so every pitched effect heard over it keeps to the C minor pentatonic scale. The clicks climb that scale from C5 (they climbed whole tones from E5), the PERFECT fanfare became a C minor arpeggio in 32nd notes at the track's tempo (it was C major, whose E clashed with the track's Eb), and the countdown and the Shift Wall chirps landed on C and G. The click and the fanfare took a chiptune pulse wave, to sit with the track's synths.)
- (Next, from options rendered offline for the user to listen to, in `../design-mocks/audio-options/`: the game over plays the track "after the show", slowed to 0.8 (so lower too), muffled and echoing, fading in as the screen shows. The fail became chiptune and in key. The hit is a thump on the chip bass voice (a triangle) under crunchy 8-bit noise, and the whomp plays G, Eb, C on the pulse wave over a triangle an octave down, each note bending down into place, the last one long, wobbling and sagging. It replaced the sawtooth "sad trombone" (G, F#, F) and its filter "wah". The user turned down all three title options: the muffled track opening up as a run starts, the intro bar looped, and a new chip loop. The title and How to play stay silent for now.)
- ✅ Each sound plays at its moment, the countdown follows `t`, and nothing plays before the player's first click (browser autoplay rules).

**M10: Art** (done)
- Re-skin the play screen from the design mocks (kept outside the repo, in `design-mocks/`): the collage palette and fonts, a pale disc behind the far end of the stage, the floor with verges and tile seams, a dark green wall with a clean paper hole, the figure as black blocks with cream seams and a shadow, a black key-cap tray, SCORE and WALL cards, and paper cards behind the timing label, the SHIFT callout, the Caps Lock warning and the pause panel. Every paper edge and outline is a pencil line. A paper grain lies over the stage. All of it is drawn in code.
- **One color system:** every color is named once in `PALETTE`: the mocks' swatches, the yellow and coral of the mock's logo, and darker steps of those for use on cream. Components only use roles (`COLORS`, `TEXT_COLORS`), and a test checks that every role comes from the palette. The alerts are two families: yellow/ochre for a Shift Wall, coral/red for a mistake.
- The mocks' blocky figure replaced the planned SVG body parts, and the HUD shows the wall number where the mocks show a run timer, since the game has none.
- (After the first M10 review: the collage scraps, grid paper and halftone were cut as tacked-on. The pale disc moved behind the stage, where it frames the incoming wall, and breathes and drifts very slowly. The grain boils, and every outline became a pencil line. The prototype alert colors were replaced by the palette. Holes are now always one piece: two stretched torso poses were added, since turning the torso alone always split the hole, and 5-letter walls could never be one piece.)
- (After the second M10 review: the torn paper went. Cards, torn edges, tilts and pencil lines were replaced by clean straight lines, and the HUD sits straight on the stage. The timing label, the SHIFT callout, the Caps Lock warning and the pause text are bright letters inside a thick dark outline. The floor took the disc's pale green. The lane strips were cut; the floor's tiles are cut so the figure stands centered on one, and that tile lights up. The one grain layer over the scene became a filter added to single elements (the stage, the disc, the floor and the wall), darkening and lightening each one's own colors.)
- (After the third M10 review: the grain read as harsh, so its sparse strong specks became a faint, fine nudge on every pixel. The backdrop disc was cut, and the figure moved 30 px further back (`FIGURE_FLOOR_Y` 560 to 530).)
- (After the fourth M10 review, from a reference image: torn sage, forest, stone and charcoal paper at the background's outer edges, two pieces gridded; the floor back to cream, its tiles faintly varied, with thinner, paler seams; a paper texture of soft mottle and fine grain, moderate on the background, very faint on the floor, faint on the wall, and none on the figure or the cutout; the cutout lost its outline; the figure's blocks are solid with split legs; the HUD is all Anton, its number bigger.)
- (After the fifth M10 review: the figure's blocks have their cream seams between cells again, the pixel look the user preferred. The figure stands further back (`FIGURE_FLOOR_Y` 530 to 495), and everything sized at its plane shrank by the same depth, so it still fits its lane. The cutout is really cut out: the floor and the background show through it, with no cream fill. On a fail the figure flails as it topples, and its blocks bounce low on the floor and come to rest, replacing the splash and the ripple.)
- (After the sixth M10 review: "further back" had meant toward the camera, into the empty floor behind the figure. The figure now stands one tile nearer than at first, on the front-most whole row of floor tiles (`FIGURE_FLOOR_Y` 495 to 560), and everything sized at its plane grew with it. On a fail it is knocked only a little further forward, since the floor ends there.)
- ✅ Every pose still fits its hole, and every hole is one piece. The fonts are bundled and loaded before any text is drawn, and the contrast and color-system tests pass.

**M10b: Grid void restyle** (done)
- A new visual direction for the play screen, from the user's brief: away from the distressed paper collage, toward a clean, minimal sci-fi look with an editorial identity, keeping the mocks' palette, bold geometry and the figure exactly as it is. Visual and UI only: the rules, timing, input and the figure don't change.
- The collage, the green verges and the paper-grain filter are gone. The background is the grid void, the floor is a clean cream runway, the HUD and the prompt tray are angular near-black panels with lime accents, and the tray became a centered console whose letters flow right to left (§3).
- Walls are image panels, from image files dropped into `src/assets/walls/` (no code change needed to add one). The hole is cut out of the image and edged in lime on ink, and a cleared wall completes its image, then a lime pulse marks the figure passing through. No images ship yet; until they do, walls are plain forest-green panels.
- Lime is the accent: the hole's edge, the spawn line, the HUD and console accents, held chips, PERFECT, and the success flashes. The bright mock green it replaces is no longer used.
- (After the M10b review: the horizon line, the fading squares, the lime pixels and the spawn line were cut, and the grid now melts into the dark behind a soft glow, moving only by its drift and a gentle wave of light. The runway lost its tile tones. The panels became solid charcoal with no inner grid; the key caps all cream, held ones edged in lime. The hole's edge became a single thin cream line. The lined-up tile became a thin outline that flashes in as a pad, since the full green tile read as a platform. The image completion replaced the lime flash and pass pulse: the wall stops at the figure, the figure's pixels take the image's colors and the picture fills in, then the wall fades. The 25 supplied photographs load in the background, so the title never waits for them.)
- (After the second M10b review, the user called it "boring and flat" and pointed back to their mockup and inspiration: the UI and background moved toward the mockup. The background became a lit grid stage (a floor grid meeting a gridded back wall at a glowing lime seam, with a hand-placed composition of lit squares and light pillars that breathe slowly, not random spawns); the runway got glowing lime edges and rows shading into the distance; the HUD became cream cards with lime slashes; the console became a line-art bar with slashes and a square per letter of the wall. The wall itself was left as it was.)
- (After the third M10b review: the background's squares now fall slowly to the seam and fade, with the floor's light pillars turned into streaks running down from it. The supplied wall photos were dropped at the user's request: every wall is a random geometric pattern drawn in code, and the completion fills the pattern back in.)
- (After the fourth M10b review: the patterns were toned down, then dropped, since the shapes cut from them were hard to see. Wall directions were rendered in the game for the user to choose from (`design-mocks/wall-options*/`), and the user picked the display panel: every wall is dark glass lined on the figure's cells, with dots, scanlines and a neon lime frame and hole edge, its grid following the hole as a Shift Wall slides it. The completion lights the figure's cells lime like the panel's pixels, then the panel fills back in. The timing label and the SHIFT callout, hard to read over the walls as outlined text, moved onto solid badges in a thick ink edge.)
- ✅ Every gameplay rule and test is unchanged, the contrast tests cover the new pairs (the wall's frame and the hole's edge against the void and the runway, the chips against the console), and the HUD, the console and the figure never overlap.

**M11: Title and game-over screens** (done)
- The title and game-over screens laid out from the mocks, in the M10b style: *SHAPE SHIFT* with a short how-to (Space to line up, hold letters, Shift for CAPS), and GAME OVER with the final score. The title keeps "Click to play" where the mock says "Press any key", because the itch.io frame only gets keyboard focus from a click (§2).
- As built, every screen uses only the play screen's parts on the grid stage: cream cards with lime slashes (the HUD's, made shared), badges as buttons, and key caps.
  - **Title:** the lockup after the mock, SHAPE stacked over SHIFT on a big cream card, tilted a little like the mock's paper, and a lime CLICK TO PLAY button.
  - **How to play:** its own screen between the title and the first wall. HOW TO PLAY, then three numbered steps, each with its keys and one sentence (01 LINE UP: Space; 02 HOLD ON: the letters, Shift for capitals; 03 FIT THROUGH: a PERFECT badge), and a START button. Any key or a click starts the run.
  - **Pause:** a veil, PAUSED on a card, and a lime CLICK TO RESUME button.
  - **Game over:** GAME OVER on a card (with the wall the run ended on) facing a card with the run's score and walls cleared, then a lime PLAY AGAIN button once §7's restart rule allows it.
  - The mock's MAIN MENU button is left out, since a second choice would change §7's "any key or a click restarts".
- (After the M11 review: the title dropped the stage scene and its controls bar for the stacked lockup, and the controls became the How to play screen. The buttons' ink edge is a filled shape, closed at every corner, and their text is centered on its letters rather than on Anton's line box, which had set it low. The game over shows only the run's results; the saved best score is gone.)
- (After M11 review 2, from the user's marked-up screenshots: each shape now has one job. Slanted cream cards are headings and the HUD, key cap shapes are things to press or study, and badges are passing call-outs. The cards lost their sage folds, and the title's lockup stands upright. The buttons became lime key cap shapes in a cream edge, like the how-to's Space key, set one gap below what comes before them. HOW TO PLAY and PAUSED share one heading card size, and both hints read PRESS ANY KEY OR CLICK. The game over follows the layout of the user's reference: GAME over OVER in big cream letters on the left, right-aligned so the E and R stack, as tall as a dark card on the right with the score and walls cleared, parted by the bar's stepped line, and PLAY AGAIN under the card. The wall the run ended on was dropped. The lockup was exported as an SVG with live Anton text to `../design-mocks/logo/` for the user to edit in Figma.)
- (After M11 review 3: the title and GAME OVER became stacked lockups, each line sized so the words span one width, flush on both sides: SHIFT grows to SHAPE's width, and OVER and GAME share one width with the block as tall as the results card. The SVG was regenerated to match. The how-to steps took the user's shorter copy. Text that looked blurry is fixed: text now lands on whole pixels (`roundPixels`), and the buttons pulse their shape, not their label. The game still draws at 1280×720 and the browser stretches it to the window, which softens everything slightly on large windows and high-density screens.)
- (After M11 review 4, from the user's mock: the game over is one centered dark card, bigger than before and edged in lime. GAME OVER sits at its top over a lime rule, and the score and walls cleared follow, parted by the bar's line. Play again and its hint sit below. The rows got more room, and to fit, walls cleared dropped to the HUD's number size. The GAME OVER lockup and its poster size were removed.)
- (After M11 review 5: the user generated title concepts and picked Option 2, offset diagonal, refined over two rounds of rendered mockups in `../design-mocks/title-options/`. The title is now a dark card in a lime edge holding SHAPE, large, over SHIFT, both in cream Anton leaning like the badges. SHIFT's right edge lies on the E's leaning right edge. The bar's line starts with its slashes under the S, as far left as the S reaches, and steps down into SHIFT's middle. The mockups' outlines were dropped, since the dark card gives the contrast. Every dark card's edge is now lime. The SVG in `../design-mocks/logo/` was regenerated to match.)
- (After M11 review 6: the user found the title flat and picked mock B, `../design-mocks/title-options/punch-B-plus-bigger-motif.png`. SHIFT is now lime. The card is lit like a wall, with a soft lime bloom outside its edge and the wall panel's glow inside, which was lowered on the wall too (`WALL_DISPLAY`). The bar's line is 1.5 times its size; at 2 times the slashes ran into the S. The line now ends at the top of SHIFT's S's lower tail, and the words sit closer. The SVG was regenerated, without the glow, which is a lighting effect.)
- ✅ A new player can start a run knowing the controls from the title and How to play screens.

**M12: Ship**
- itch.io HTML5 upload (zip of `dist/`), set the embed to 1280×720, add the mocks' fullscreen and mute buttons, and test in Chrome, Firefox and Safari.
- ✅ The itch.io build plays a full run in Chrome, Firefox and Safari, both embedded and fullscreen.

### Stretch goals (only if there's time)
- Shift Wall variant where the hole's **shape** changes too (one block's key gets swapped for a new letter).
- Daily seed (same walls for everyone) + a shareable score line.
- Option for AZERTY/QWERTZ layouts in the stretch scoring.

---

## 11. Open questions for later
- Should the lane-matched marker also flash briefly when a Shift Wall warning starts?
- Should the camera move in close on the figure for the last 20% of the approach?
