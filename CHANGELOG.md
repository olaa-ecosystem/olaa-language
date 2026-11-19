# Changelog

All notable changes will be recorded here. Until the first release, this repository is in pre-development foundation stage.

## Unreleased
- Repository foundation initialized.
- MVP lesson app (React + Vite + TypeScript), see ADR-001:
  - Onboarding: choose course (English ⇄ Vietnamese), study buddy and daily goal.
  - Ten mascot buddies (bear, cat, dog, elephant, fish, frog, giraffe, rabbit, turtle, whale).
  - Learning path with 3 units / 9 lessons, sequential unlocking and 5 levels per lesson.
  - Six exercise types: select, picture, tile-build, type, listen, match pairs.
  - Hearts (time refill), XP, daily goal, streaks.
  - Practice hub: fix mistakes, spaced-repetition flashcards, quick practice (earn hearts).
  - Profile with stats, weekly XP chart, buddy and settings.
  - Unit + integration tests and GitHub Actions CI.
- Olaa ID sign-in and progress sync with Firebase (platform ADR-0004, PRD REQ-01-040/041):
  - Google and email/password sign-in on the welcome page and in Profile → Account.
  - Progress syncs to Firestore `language/{uid}`; most recent copy wins; other devices update live.
  - Sign-out clears this device; the account keeps the progress.
  - Without `VITE_FIREBASE_*` config the app stays local-only, as before.
  - `firebase.json` / `.firebaserc` to deploy the build to Firebase Hosting.
- Events for Olaa Habits (platform `contracts/events/language-events.md`): `language.daily_goal.completed`
  when today's XP first reaches the goal, `language.lesson.completed` on a lesson's first completion.
  Written to Firestore `events/` while signed in; ids are fixed so repeats are ignored.
- Ecosystem PRD v1.0, Language core (§6):
  - Hearts removed: mistakes no longer block learning; the "out of hearts" screen and heart refills are gone.
  - Wrong answers explain why (meaning, word order, missing/extra words, spelling, translation, listening, skipped)
    and are counted by category; Profile shows the most common ones.
  - Lessons open with a goal, estimated time, the new words and example sentences (with audio), and end with a
    recap and a "Next lesson" step.
  - A lesson left part-way can be continued where it stopped (saved in this browser for 7 days).
  - Review inside lessons: about a quarter of each lesson is earlier mistakes and due flashcards, starting with a
    warm-up; answers update the mistake list and the card schedule.

