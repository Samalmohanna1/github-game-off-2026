# SHAPE SHIFT

A keyboard take on Japan's "Human Tetris", made for GitHub Game Off 2026
(theme: SHIFT). A wall with a hole in it comes toward you. Line up under the
hole with ← / →, then hold the letters shown to pose your figure so it fits
through. Capital letters need Shift.

**Status:** Week 1 prototype, built in grey boxes. M0 (scaffold) and M1 (stage
and approaching wall) are done. See
[PLAN.md](./PLAN.md) for the design and milestones, and
[AGENTS.md](./AGENTS.md) for the working rules.

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

## Deploy (itch.io)

1. `npm run build`
2. Zip the **contents** of `dist/`, so `index.html` sits at the root of the zip.
3. On itch.io, upload the zip as an HTML5 game and set the embed size to
   1280×720.

The build uses relative paths, so it runs from whatever folder itch.io serves
it from. It does need to be served over HTTP: opening `dist/index.html`
straight from disk won't work, because browsers block module scripts on
`file://`. Use `npm run preview` to try the build locally.
