# AGENTS.md

Project context and working rules for every agent and contributor in this repo.
This file is the source of truth for architecture, coding standards, validation,
and Git workflow. Follow these requirements on every change. Re-read this guide
when in doubt; keep shared instructions here and keep CLAUDE.md as a pointer.

<!--
TEMPLATE NOTES (delete this block once filled in)
- Replace every {{PLACEHOLDER}} with project specifics.
- Sections marked "Project-specific" describe this repo; fill them in.
- Sections not marked are standing rules shared across projects; keep them as
  written unless the project has a documented reason to differ.
-->

---

## What this is

<!-- Project-specific -->

{{One or two paragraphs: what the project is, who it is for, and its current
state (e.g. new build, redesign, maintenance). Link the design source of truth
(Figma file, wireframes) and any per-page or per-feature docs under docs/.}}

{{Inventory of pages / routes / features and the sections each contains. Note
which ones follow final designs and which still use interim layouts. Name the
components that are shared across pages.}}

## Companion docs (source of truth)

- **[PLAN.md](./PLAN.md)** — the build plan: component inventory, phases, and
  per-component spec. Read the relevant phase before starting it.
- **[README.md](./README.md)** — setup, local dev, deploy.
- {{Optional: CONTENT.md or other exports. If a doc is a snapshot rather than a
  source of truth, say so, and say where edits must be applied.}}
- **docs/** — {{per-page or per-feature docs, design-system notes}}.

Keep AGENTS.md, PLAN.md, and README.md **in sync with reality**. When a change
makes any of them stale — new component, new dependency, removed file, changed
command, new env var, new deploy step — updating the doc is **part of that
change, not a follow-up**.

---

## Stack & architecture

<!-- Project-specific: fill in, keep the standing rules below each item -->

- **Framework:** {{e.g. Astro (static output)}}. {{Component format}}.
  {{If a UI framework is present only for a narrow purpose (e.g. React for an
  embedded CMS studio), say so and forbid it elsewhere.}} Any other UI framework
  needs justification before adding. Content stays static where possible, with
  small scripts for interactive controls.
- **Content / CMS:** {{e.g. Sanity, fetched at build time; where config, schemas,
  and the client live; how env is read; how check/build behave when env is
  missing}}. What belongs in the CMS vs. code vs. an external source of truth is
  the **content-routing map in PLAN.md** — keep it authoritative.
- **Styling:** {{e.g. Tailwind CSS v4, CSS-first, no tailwind.config.js}}.
  {{Where tokens live, whether any CSS is generated and the commands to
  regenerate/check it}}. See [docs/design-system.md](./docs/design-system.md).
- **Data interface:** {{e.g. Astro Content Collections typed with Zod in
  src/content.config.ts; list of collections and singletons and their loaders}}.
- **TypeScript strict** ({{e.g. astro/tsconfigs/strict}}).
- `@/` path alias maps to `src/` (see `tsconfig.json`).
- **Dev toolbar off** (Astro projects). Disable it in `astro.config.mjs`:

    ```js
    devToolbar: {
      enabled: false,
    },
    ```

### Project layout

<!-- Project-specific: keep this tree current; one comment per entry -->

```text
{{config files at root, one line each}}
.env.example               # env template (copy to .env; .env is gitignored)
src/
  env.d.ts                 # typed env vars
  lib/                     # shared helpers
  styles/                  # tokens + global styles
  layouts/                 # page shells
  components/
    {{Section}}.astro      # one line per component
    ui/                    # small shared primitives
  content.config.ts        # collection schemas (Zod)
  scripts/                 # small client scripts for interactive controls
  data/
    site.ts                # code-owned config: nav, contact, socials, CTAs
  pages/                   # routes
public/                    # static assets (images, favicon)
```

Content that is structured and repeating → **collections**. Content that is
small, flat, and site-config-like (nav links, footer columns, socials, pricing
tiers) → **`src/data/site.ts`**. Don't force the latter into collections.

---

## Coding conventions

Apply these standards to every code, configuration, script, and documentation
change. Follow the existing architecture, naming, formatting, and tooling;
resolve conflicts before proceeding instead of silently bypassing a rule. Keep
changes focused, maintainable, typed, accessible, and appropriately validated.

- **TypeScript strict.** No `any` / `@ts-ignore` unless there's a written
  justification on the same line. The build fails on type errors; don't paper
  over them. Validate at boundaries (collection schemas, form input); trust
  internal types.
- **No comments unless the WHY is non-obvious** — a hidden constraint, a
  workaround, surprising behavior. Don't explain WHAT the code does. No `TODO`s
  without an owner.
- **DRY.** Extract a shared component/primitive _before_ the second copy exists,
  not before the first caller does. Shared primitives exist because they have
  ≥2 callers.
- **Single responsibility.** One component = one section or one repeated unit.
  Keep section components thin; push repeated markup into a child component.
- **Styling.** Utility classes in markup. Reach for **theme tokens** (color,
  spacing, type scale) rather than raw hex or arbitrary values. If a value isn't
  a token yet and will recur, add it to the theme first, then use it. Arbitrary
  values (`[#1E2D40]`) are a smell — they defeat the tokens-only re-skin.
- **Naming:** kebab-case files for non-components; **PascalCase** for
  components and types; camelCase for functions/variables; SCREAMING_SNAKE for
  constants and env vars. Descriptive names.
- **Imports:** absolute via the `@/` alias for internal modules
  (`@/components/...`, `@/data/site`); group framework → external → internal.
- **No dead code.** No commented-out blocks, no scaffolding for unagreed
  features. Prefer deletion over deprecation.
- **No emojis** in code, comments, or commit messages unless explicitly asked.

## Dependency policy

Keep dependencies minimal. **Do not add libraries unless the current phase
explicitly requires them.** Justify any new dependency in your message _before_
installing. Current intentional deps: {{list each dependency or group, with its
scope and why it is here}}.

---

## Development

<!-- Project-specific: dev server command and how to manage it -->

When starting the dev server, use background mode:

```
{{e.g. astro dev --background}}
```

{{How to stop / check status / read logs.}}

## Framework documentation

Full documentation: {{framework docs URL}}

Consult the relevant guides before working on related tasks:

- {{Routing / pages / dynamic routes}}
- {{Components}}
- {{Framework/islands integration}}
- {{Content / data}}
- {{Styling}}
- {{i18n, if applicable}}

---

## Testing

For a static, presentational site, the meaningful gate is **"does the page
build clean and render correctly,"** not unit coverage of markup.

Definition of done for any phase:

1. `{{npm run check}}` passes — zero type/content errors.
2. `{{npm run build}}` succeeds — no crash, no broken content references.
3. **Visual checks only when explicitly requested by the user.** Do not launch
   previews, capture/review screenshots, or run visual tests by default. When
   requested, check 360 / 768 / 1280px and the design's endpoint widths
   ({{e.g. 390 / 1440px}}).
4. Run applicable nonvisual tests for changed behavior. If the full e2e suite
   (`{{npm run test:e2e}}`) captures screenshots, run it only when visual checks
   are requested; otherwise select relevant tests that do not capture
   screenshots. {{List what the suite covers and which spec files are
   screenshot-free.}}
   Tests abort POST requests; never submit real signups or call external
   services from interaction tests. Add coverage with new interactive behavior.

Development browser testing uses `@playwright/test` and `@axe-core/playwright`.
{{One-time setup, e.g. `npm exec -- playwright install chromium`.}}

Don't fake unit tests for static components.

## Design system & UX standards

- **Pull colors, type, spacing from theme tokens** rather than inventing inline
  values. If tokens are generated from a design-tool export, regenerate the CSS
  instead of editing the generated file by hand. Keep page-level aliases in one
  global stylesheet — the entry point for any re-skin. Document new tokens in
  `docs/design-system.md` in the same change.
- {{Project typography policy, e.g. normal font style only; how semantic
  emphasis renders.}}
- **Contrast: WCAG AAA preferred, AA required site-wide.** Aim for AAA —
  **7:1 normal text, 4.5:1 large text** (≥24px, or ≥18.66px bold). A design
  color between AA and AAA may ship, but no text goes below **AA — 4.5:1
  normal, 3:1 large**. Meaningful non-text graphics need 3:1. **Verify pairs,
  don't eyeball them**, and record every pair below AAA, with its measured
  ratio, in the relevant page's doc. Decorative graphics are `aria-hidden` and
  carry no meaning on their own.
- **Semantic HTML first**, ARIA only when semantics aren't enough. Landmark
  elements (`header`/`nav`/`main`/`footer`). Every form control has a label.
  Every meaningful image has alt text (`alt=""` if decorative). Keyboard nav
  works on every interactive element; visible focus styles; tab order matches
  visual order.
- **External links open in a new tab.** Use one shared helper (e.g.
  `externalAttrs(href)` in `src/lib/links.ts`) on any anchor that can carry an
  external href, and include an sr-only hint so screen readers hear the target
  change. Internal routes, `mailto:` and `#` placeholders get nothing.
- **Mobile-first.** Author base styles for narrow screens, layer breakpoints up.
  Run visual breakpoint checks only when requested. Touch targets ≥44×44px.
- **States.** Loading/error/empty states for anything async (e.g. an empty
  collection must render sensibly). Honor `prefers-reduced-motion`.
- **Performance budget.** No client JS unless a component needs it; keep pages
  shippable as static HTML/CSS. No third-party scripts on the critical path.

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

<!-- Project-specific -->

{{Host and config file (e.g. Cloudflare Workers static assets via
wrangler.jsonc). What triggers production deploys and previews. How CMS
publishes trigger rebuilds. Where build-time env vars are set. Any constraint on
output mode (e.g. keep static; switching to SSR needs an adapter and a change to
this section). Point to README → Deploy for steps.}}

---

## Build phases

Work through **PLAN.md** one phase at a time.

- **Do not work ahead of the current phase.** Don't pull a "while I'm in here"
  task from a later phase without asking.
- Re-read the relevant PLAN.md section before starting a phase.
- Mark phases done in PLAN.md as they ship.

### Pre-completion checklist (run before finishing ANY phase)

1. `{{npm run check}}` passes — zero errors.
2. `{{npm run build}}` succeeds — no crash.
3. Run visual/responsive checks only if explicitly requested; otherwise record
   that they were not run.
4. No stray debug logging or dead code.
5. Docs updated (PLAN.md phase status; README / this file if touched).
6. Commit (do **not** push). Surface the PR description in chat.

---

## Domain glossary

<!-- Project-specific: define every term a newcomer would trip on -->

- **{{Term}}** — {{definition; where it lives in code if relevant}}.

## Copy & terminology

- User-visible strings use plain, external-facing language. Internal data terms
  (variables, props, types, file/route/field names) are **not** user copy and
  stay as-is.
- Write for a first-time reader with no prior context.
- Placeholder copy from wireframes (e.g. `@handle`, "LINK") stays clearly
  placeholder until real content is provided — don't invent authoritative-looking
  facts (counts, dates, names) beyond what the design states.

---

## Rules for agents (summary)

- Do NOT add features, services, or dependencies not described here or required
  by the current phase.
- Do NOT change the core architecture/flow without asking.
- Use a branch for each logical change in the existing checkout; never use
  worktrees or work on `main`.
- Always run check + build before marking a phase complete. Run visual checks
  only when the user explicitly requests them.
- Never duplicate logic/markup — extract a component first.
- Prefer theme tokens over raw values; the global stylesheet is the single
  re-skin point.
- Never add co-author trailers or AI-attribution text; preserve the user's Git
  identity.
- Commit after checks pass; the user pushes after review unless explicitly
  requested otherwise.
- When in doubt about architecture, re-read this file.
