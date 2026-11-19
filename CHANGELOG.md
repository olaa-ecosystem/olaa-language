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
