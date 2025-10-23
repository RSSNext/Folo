# AGENTS.md

This file provides concise, agent-focused guidance for working in this monorepo. It consolidates the repository's CLAUDE.md guides, .cursor rules, Cursor rules improvements, and modern agent best practices.

## Project overview

- Monorepo managed by pnpm workspaces + Turbo.
- Apps:
  - `apps/desktop` – Electron app (Vite + React renderer is the primary web app)
  - `apps/mobile` – React Native app via Expo
  - `apps/ssr` – Minimal SSR site for external sharing
- Shared packages: `packages/internal` (components, atoms, hooks, store, utils, database, etc.).

## Setup commands

```bash
# Install deps
pnpm install

# Desktop – recommended (browser renderer)
cd apps/desktop && pnpm run dev:web

# Desktop – full Electron
cd apps/desktop && pnpm run dev:electron

# Mobile – Expo
cd apps/mobile && pnpm run dev
# or target platforms
cd apps/mobile && pnpm run ios
cd apps/mobile && pnpm run android

# SSR
cd apps/ssr && pnpm run dev

# Build web version (desktop renderer)
pnpm run build:web
```

## Quality gates (must-pass before commit/PR)

```bash
# 1) Typecheck first (required)
pnpm run typecheck

# 2) Lint and auto-fix
pnpm run lint:fix

# 3) Tests
pnpm run test
```

- Run the above at the root, or use per-package variants as needed.
- Follow this order strictly: typecheck → lint → test.

## Code style and conventions

- TypeScript strict; avoid `any` (use precise types). Comments in English. Keep solutions simple and maintainable.
- Prefer CSS transitions/animations for simple UI interactions. Use JS-driven motion only when necessary to avoid frame drops.
- Imports: use `pathe` instead of `node:path` for cross‑platform paths.
- Organize shared, reusable UI in `packages/internal/components`; app-specific UI stays in its app.

## Team preferences

- Prefer CSS transitions/animations over JS-based motion for simple interactions to avoid frame drops.
- Prefer simple, easy-to-maintain solutions.
- Avoid using the `any` type in TypeScript.
- Write code comments in English.

## Architecture quick reference

- State: Jotai for atoms, Zustand for complex stores, TanStack Query for server state.
- Database: Drizzle + SQLite (see `packages/internal/database`).
- Error handling: custom utils in `packages/internal/utils`; Sentry integrated.
- i18n: i18next with flat keys only; no `defaultValue`. Provide `en`, `zh-CN`, `ja` for each feature. Avoid conflicting dotted keys.

## UI system and design tokens

### Tailwind + Apple UIKit colors (Desktop/Web)

- Use Tailwind classes bound to Apple UIKit color tokens (light/dark adaptive). Prefix by CSS property:
  - System colors: `text-red`, `bg-blue`, `border-gray`, etc. for `red|orange|yellow|green|mint|teal|cyan|blue|indigo|purple|pink|brown|gray`.
  - Fill: `bg-fill[-secondary|-tertiary|-quaternary|-quinary]` and `bg-fill-vibrant[-secondary|-tertiary|-quaternary|-quinary]` (and `border-*` as needed).
  - Text: `text-text`, `text-text-secondary|tertiary|quaternary|quinary`, `text-text-vibrant(-secondary|-tertiary|-quaternary|-quinary)`.
  - Material: `bg-material-ultra-thick|thick|medium|thin|ultra-thin|opaque`.
  - Control: `bg-control-enabled|disabled`.
  - Interface: `bg-menu|popover|titlebar|sidebar|selection-focused|selection-focused-fill|selection-unfocused|selection-unfocused-fill|header-view|tooltip|under-window-background`.

These classes map to the UIKit color variables (see `.cursor rules/color` and `apps/desktop/AGENTS.md`).

### Icons (Desktop/Web)

- Prefer MingCute with `i-mgc-` prefix (e.g., `i-mgc-copy-cute-re`). Use `i-mingcute-` only if no `i-mgc-` exists.

### Motion (Desktop/Web)

- Use Framer Motion with LazyMotion via `m` from `motion/react` (e.g., `m.div`).
- Prefer spring presets from `@follow/components/constants/spring.js` (`Spring.presets.smooth|snappy|bouncy`).
- For simple micro-interactions, prefer CSS transitions first.

### React Native (Mobile)

- Styling: NativewindCSS; do not use external `StyleSheet.create` for new UI.
- Icons: use `@/apps/mobile/icons` only.
- Colors: use React Native UIKit color system (via `react-native-uikit-colors`) with Tailwind utilities:
  - Backgrounds: `system-background`, `secondary-system-background`, `tertiary-system-background`.
  - Grouped backgrounds: `system-grouped-background`, `secondary-system-grouped-background`, `tertiary-system-grouped-background`.
  - Labels: `label`, `secondary-label`, `tertiary-label`, `quaternary-label`.
  - Fills: `system-fill`, `secondary-system-fill`, `tertiary-system-fill`, `quaternary-system-fill`.
  - Separators: `separator`, `opaque-separator`, `non-opaque-separator`.
  - Semantic colors: `red|orange|yellow|green|mint|teal|cyan|blue|indigo|purple|pink|brown`, grays `gray..gray6`, and interactive `link`, `placeholder-text`.

## Component placement

1. Check existing components in `apps/desktop/layer/renderer/src/modules/renderer/components` for app-specific UI.
2. If generic and reusable, implement in `packages/internal/components` and export from the package index.

## Testing & CI tips

- Use Vitest for unit tests; co-locate tests near source files.
- After moving files or changing imports, run `pnpm lint` and `pnpm typecheck` for the affected package.
- CI expects `pnpm typecheck`, `pnpm lint`, and `pnpm test` to pass before merge.

## Agent workflow (Cursor-oriented improvements)

- Status updates: provide brief progress notes when running tool batches.
- Prefer semantic code search to explore unfamiliar areas; use exact grep only for symbols.
- Default to parallelizing independent searches/reads to reduce latency.
- Avoid multi-line speculative edits; keep edits minimal and targeted; preserve existing indentation.
- When editing TypeScript, do not introduce `any`; keep types precise.
- For UI, prefer CSS transitions for simple effects; use Framer Motion `m.*` only when needed.

## Context7 (up-to-date docs)

- Use Context7 to fetch current library docs before using APIs prone to change.
- Workflow:
  1. Resolve a library ID: resolve the library (e.g., React Native, Vite, TanStack Query).
  2. Fetch docs scoped to the topic (e.g., hooks, routing).
  3. Integrate code examples following our style rules.

## Sequential Thinking (step-by-step problem solving)

- Break work into small thought steps:
  1. Define immediate goal/assumption.
  2. Use suitable tool (search, code edit, error explainer, docs).
  3. Record the output/results.
  4. Decide next step or branch alternatives; compare trade-offs.
- Encourage rollback/iteration if new information contradicts prior steps.

## Subproject guides

- This root AGENTS.md sets global rules. Each app/package should include its own `AGENTS.md` (e.g., `apps/desktop/AGENTS.md`, `apps/mobile/AGENTS.md`). The closest guide to the edited file takes precedence when rules conflict.

## Quick checklists

- Implementation
  - [ ] Is code placed in the right package/app?
  - [ ] Type-safe (no `any`), readable names, English comments where needed.
  - [ ] Uses correct UIKit Tailwind tokens and icon sources.
  - [ ] For motion: CSS first; `m.*` only if necessary.

- Validation
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm lint:fix` passes cleanly
  - [ ] Tests updated and pass
