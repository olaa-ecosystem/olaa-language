# OLAA Language

## 1. Overview
OLAA Language is an independent language-learning application within the OLAA ecosystem.
Bite-sized, gamified lessons guided by ten animal study buddies (bear, cat, dog, elephant,
fish, frog, giraffe, rabbit, turtle, whale).

## 2. Mission
Provide a structured, measurable, and comprehensive language-learning environment.

## 3. Product Scope
- Structured curriculum
- Lessons and learning pathways
- Vocabulary management
- Grammar
- Listening
- Reading
- Speaking
- Writing
- Flashcards and spaced repetition
- Assessment and revision
- Progress tracking and analytics

## 4. Repository Independence
OLAA Language must remain independently buildable, testable, deployable, and maintainable.

## 5. Ecosystem Integration
- OLAA ID: shared identity
- OLAA API: shared platform access
- OLAA Note: optional note integration
- OLAA Habit: optional habit integration

## 6. Technology Stack
See docs/architecture/TECH_STACK.md and docs/decisions/ADR-001-mvp-web-stack.md
(React 18 + Vite 5 + strict TypeScript, pnpm, Vitest, ESLint, Prettier).

## 7. Architecture
See docs/architecture/ARCHITECTURE.md

### Project layout
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

## 8. Development

### Firebase (sign-in and sync)
Optional. Copy `.env.example` to `.env.local` and fill the `VITE_FIREBASE_*` values from
Firebase console → Project settings → Your apps → Web app. Without them the app runs local-only.
Firestore rules live in `olaa-platform/infrastructure/firebase/`.

Deploy to Firebase Hosting (project `olaa-ecosystem`):

```bash
pnpm build && npx firebase-tools deploy --only hosting
```

Requires Node 20+ and pnpm 9 (`npm i -g pnpm@9` or `npx pnpm@9 …`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + integration tests
pnpm lint
pnpm typecheck
pnpm build        # static site in dist/ (deployable to any static host)
```

Mascot artwork: the buddies ship as SVG components. Drop original files named
`bear.png`, `cat.png`, … into `src/assets/mascots/` to replace them automatically.

See CONTRIBUTING.md for workflow rules.

## 9. Security
See SECURITY.md and docs/security/

## 10. Status
MVP web app (pre-release). Progress is stored locally in the browser; OLAA ID sign-in and
sync are not implemented yet.

Implemented:
- **Courses:** English for Vietnamese speakers, Vietnamese for English speakers.
- **Learning path:** 3 units, 9 lessons, unlocked in order, replayable up to level 5.
- **Exercises:** select meaning, pick picture, build sentence from tiles, type translation,
  listen & build, match pairs — lenient on missing accents and one-letter typos.
- **Motivation:** hearts (refill 1 per 30 min), XP, daily goal, day streak.
- **Practice hub:** fix mistakes, spaced-repetition flashcards, quick practice.
- **Profile:** stats, weekly XP chart, buddy, daily goal, course, sound, reset.
- **Accessibility:** keyboard shortcuts, labels, focus styles, reduced motion, light/dark
  themes, desktop to phone layouts.
