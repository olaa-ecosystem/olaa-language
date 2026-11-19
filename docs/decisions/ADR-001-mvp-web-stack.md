# ADR-001: MVP web stack and local-only progress

- Status: Proposed (implemented on `feat/lesson-app-mvp`, pending review)
- Date: 2026-11-19
- Owners: OLAA Language team

## Context
The repository held documentation only. The product owner asked for a working, gamified
lesson app (learning path, short lessons, hearts/XP/streaks) themed around the OLAA mascot
set (bear, cat, dog, elephant, fish, frog, giraffe, rabbit, turtle, whale). `TECH_STACK.md`
listed a proposed stack and open decisions that block any scaffold.

## Decision
Resolve the open stack decisions for the MVP:

| Topic | Decision |
|---|---|
| Runtime | React 18.3 + TypeScript 5.6 (strict, `noUncheckedIndexedAccess`), Vite 5 |
| Package manager | pnpm 9 (`packageManager` field) |
| Router | Built-in hash router (`src/app/router.ts`) — no dependency, works on any static host |
| State | Single immutable app state + pure action functions (`src/stores/appState.ts`) exposed via `useSyncExternalStore` — no state library |
| Styling | Plain CSS with design tokens (`src/styles`), light + dark themes. Tailwind deferred |
| UI primitives | In-repo components; mascots are in-repo SVG with drop-in artwork override (`src/assets/mascots`) |
| Persistence | `localStorage` only, via a guarded adapter (`src/services/storage.ts`) |
| Audio | Browser Web Speech API for pronunciation, Web Audio for feedback chimes |
| Testing | Vitest + React Testing Library (unit + integration). Playwright deferred |
| Lint/format | ESLint 9 (typescript-eslint, react-hooks) + Prettier |
| CI | GitHub Actions: typecheck, lint, test, build |

Deferred (unchanged from TECH_STACK): OLAA ID auth, API client generation, server sync,
deployment provider.

## Alternatives considered
- React Router / Zustand: unnecessary for 7 routes and one store; can be adopted later
  behind the same module boundaries.
- Tailwind: postponed until the shared OLAA design system is defined.
- IndexedDB: overkill for a few KB of progress; revisit with sync.

## Consequences
- Progress is per-browser; clearing site data loses it. Profile page states this.
- Curriculum content is bundled TypeScript data (`src/features/curriculum/content.ts`).
- Exercise generation is deterministic per seed and fully unit-tested.

## Security / privacy impact
No accounts, no network calls besides the Google Fonts stylesheet; only a first name
(optional) is stored locally. No secrets or endpoints in the code.

## Rollback / migration
State is versioned (`version: 1`); unknown versions fall back to a fresh state. When sync
arrives, the local state shape becomes the import format for the first upload.
