# OLAA Language

Independent language-learning platform — bite-sized, gamified lessons with ten animal
study buddies.

## Product scope
- **In scope:** Curriculum, lessons, vocabulary, grammar, skills practice, flashcards/SRS, assessments, revision, learning progress and analytics.
- **Out of scope:** Full notebook editor, freeform canvas/PDF annotation, general-purpose habit tracker.

## Repository status
MVP web app (pre-release). Progress is stored locally in the browser; accounts and sync
are not implemented yet. See `docs/decisions/ADR-001-mvp-web-stack.md`.

### What works
- **Courses:** English for Vietnamese speakers, Vietnamese for English speakers.
- **Learning path:** 3 units, 9 lessons, unlocked in order, each replayable up to level 5.
- **Exercises:** select the meaning, pick the picture, build a sentence from tiles,
  type the translation, listen & build, match pairs. Lenient grading for missing accents
  and one-letter typos.
- **Motivation:** hearts (refill 1 per 30 min), XP, daily goal, day streak.
- **Practice hub:** fix mistakes, spaced-repetition flashcards, quick mixed practice —
  each earns a heart back.
- **Profile:** stats, weekly XP chart, change buddy, daily goal, course, sound, reset.
- **Accessible:** keyboard shortcuts (1–4 for answers, Enter to check/continue), labels,
  focus styles, reduced-motion support, light/dark themes, desktop to phone layouts.

## Development setup
Requires Node 20+ and pnpm 9 (`npm i -g pnpm@9` or `npx pnpm@9 …`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + integration tests
pnpm lint
pnpm typecheck
pnpm build        # static site in dist/ (deployable to any static host)
```

## Project layout
```
src/
  app/                 App root, shell, hash router
  components/          Shared UI, icons, mascots (SVG + artwork override)
  features/
    curriculum/        Courses, units, lessons, learning path
    exercises/         Exercise generation and grading
    lesson-player/     Lesson session engine and exercise views
    flashcards-srs/    Spaced repetition and review page
    revision-mistakes/ Practice hub and mistake practice
    learning-progress/ Hearts, streaks, daily goal, profile
    onboarding/        First-run flow
  services/            Local storage adapter
  stores/              App state (pure actions) and store hook
  utils/               Text, dates, RNG, speech, sound
tests/integration/     App-level tests
```

### Mascot artwork
The ten buddies ship as SVG components. To use original artwork files, drop
`bear.png`, `cat.png`, … into `src/assets/mascots/` — they replace the SVGs automatically.

## Start here
1. Read `docs/product/SCOPE.md`.
2. Read `docs/architecture/ARCHITECTURE.md` and `TECH_STACK.md`.
3. Review `docs/engineering/AI_AGENT_RULES.md` before using an AI coding agent.
4. Review the roadmap and requirements register.

## Security
See `SECURITY.md` and `docs/security/SECURITY_BASELINE.md`.

## Contributing
See `CONTRIBUTING.md`.
