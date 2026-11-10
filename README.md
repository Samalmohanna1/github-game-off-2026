# SHAPE SHIFT

A keyboard take on Japan's "Human Tetris", made for GitHub Game Off 2026
(theme: SHIFT). A wall with a hole in it comes toward you. Line up under the
hole with ← / → (or Space, which steps toward the hole), then hold the letters shown to pose your figure so it fits
through. Capital letters need Shift.

**Status:** Week 2. M0–M10 are done: a full run plays from the title through
walls that get harder by a playtested difficulty curve, Shift Walls whose hole
slides mid-approach, scoring and a fail to the game-over screen and back, with
an F2 debug overlay for tuning. M8 added feel (squash and stretch, limp slips,
a rattling wall, slow motion on CLOSE CALL, a fail where the figure flails,
topples and its blocks bounce to a stop), M9 synthesized
sound with no audio files, and M10 the art of the design mocks, drawn in
code, in Anton and IBM Plex Mono. See [PLAN.md](./PLAN.md) for the
design and milestones, and [AGENTS.md](./AGENTS.md) for the working rules.

## Setup

Requires Node `^22.12`, `^24` or `>=26`.

```
npm install
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm test` | Unit tests (Vitest), run once |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run check` | Type check |
| `npm run build` | Type check, then production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

During play, **F2** toggles a debug overlay with the wall's state, timing,
lanes, letters and stretch score. Tuning values live in `src/config.ts`.

On the dev server, URL options skip ahead for playtesting (published builds
ignore them):

| URL | What it does |
|---|---|
| http://localhost:5173/?wall=13 | Every run, restarts included, starts at wall 13 |
| http://localhost:5173/?shiftwall | Every wall is a Shift Wall |
| http://localhost:5173/?wall=12&shiftwall | Both |

## Deploy (itch.io)

1. `npm run build`
2. Zip the **contents** of `dist/`, so `index.html` sits at the root of the zip.
3. On itch.io, upload the zip as an HTML5 game and set the embed size to
   1280×720.

The build uses relative paths, so it runs from whatever folder itch.io serves
it from. It does need to be served over HTTP: opening `dist/index.html`
straight from disk won't work, because browsers block module scripts on
`file://`. Use `npm run preview` to try the build locally.
