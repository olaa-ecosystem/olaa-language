import type { DayKey } from '../utils/date';
import type { Exercise } from '../features/exercises';
import {
  newCard,
  reviewCard,
  type ReviewGrade,
  type SrsCard,
} from '../features/flashcards-srs/srs';
import type { ErrorCategory } from '../features/exercises/explain';
import { recordActivity, type StreakState } from '../features/learning-progress/streak';
import type { CurriculumLang, LevelUnit } from '../features/levels/types';

/**
 * Version 2 (2026-11-21): the old 9-lesson courses and the mascots were removed. Progress
 * lives per language in the level curriculum. `migrate.ts` upgrades version 1 data.
 */
export const STATE_VERSION = 2;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;

/** Progress in the level curriculum (A1–C2, HSK1–6) of one language. */
export interface LevelProgress {
  /** Best score (0–1) of each finished unit. */
  units: Record<string, number>;
  /** Best level-test score (0–1) of each level code. */
  tests: Record<string, number>;
  /** Unit vocabulary, reviewed with spaced repetition. */
  cards: Record<string, SrsCard>;
  /** Exercises answered wrongly, kept for targeted practice and review in later units. */
  mistakes: Record<string, Exercise>;
  /** How often each kind of mistake happened (PRD v1.0 §6.3). */
  mistakeCategories: Partial<Record<ErrorCategory, number>>;
}

export interface Profile {
  name: string;
}

export interface AppState {
  version: typeof STATE_VERSION;
  profile: Profile | null;
  /** Language being learned now. */
  levelLang: CurriculumLang;
  dailyGoalXp: number;
  soundOn: boolean;
  streak: StreakState;
  totalXp: number;
  xpByDay: Record<DayKey, number>;
  lessonsCompleted: number;
  /** "Can't listen now" pauses listening exercises until this time (ms). */
  listenOffUntil: number;
  levels: Partial<Record<CurriculumLang, LevelProgress>>;
}

export function initialState(): AppState {
  return {
    version: STATE_VERSION,
    profile: null,
    levelLang: 'en',
    dailyGoalXp: 20,
    soundOn: true,
    streak: { count: 0, longest: 0, lastActive: null },
    totalXp: 0,
    xpByDay: {},
    lessonsCompleted: 0,
    listenOffUntil: 0,
    levels: {},
  };
}

export function emptyLevelProgress(): LevelProgress {
  return { units: {}, tests: {}, cards: {}, mistakes: {}, mistakeCategories: {} };
}

export function levelProgress(state: AppState, lang: CurriculumLang): LevelProgress {
  return { ...emptyLevelProgress(), ...state.levels[lang] };
}

function withLevels(
  state: AppState,
  lang: CurriculumLang,
  update: (p: LevelProgress) => LevelProgress,
): AppState {
  return { ...state, levels: { ...state.levels, [lang]: update(levelProgress(state, lang)) } };
}

/* ---------- actions (pure) ---------- */

export function completeOnboarding(
  state: AppState,
  input: { name: string; lang: CurriculumLang; dailyGoalXp: number },
): AppState {
  return {
    ...state,
    profile: { name: input.name.trim() || 'Learner' },
    levelLang: input.lang,
    dailyGoalXp: input.dailyGoalXp,
  };
}

export function awardXp(state: AppState, amount: number, today: DayKey): AppState {
  if (amount <= 0) return state;
  return {
    ...state,
    totalXp: state.totalXp + amount,
    xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + amount },
    streak: recordActivity(state.streak, today),
  };
}

export function setLevelLang(state: AppState, lang: CurriculumLang): AppState {
  return state.levelLang === lang ? state : { ...state, levelLang: lang };
}

/** Finishing a unit keeps the best score, adds its words to flashcards and awards XP. */
export function finishUnit(
  state: AppState,
  input: { lang: CurriculumLang; unit: LevelUnit; score: number; xp: number; today: DayKey },
): AppState {
  const { lang, unit, score, xp, today } = input;
  const next = withLevels(state, lang, (p) => {
    const cards = { ...p.cards };
    for (const word of unit.vocab) {
      const id = `${unit.id}:${word.word}`;
      const back = word.sound ? `${word.vi} · ${word.sound}` : word.vi;
      cards[id] ??= newCard(id, word.word, back, unit.id, today);
    }
    return {
      ...p,
      cards,
      units: { ...p.units, [unit.id]: Math.max(p.units[unit.id] ?? 0, score) },
    };
  });
  return awardXp({ ...next, lessonsCompleted: next.lessonsCompleted + 1 }, xp, today);
}

export function finishLevelTest(
  state: AppState,
  input: { lang: CurriculumLang; level: string; score: number; xp: number; today: DayKey },
): AppState {
  const { lang, level, score, xp, today } = input;
  const next = withLevels(state, lang, (p) => ({
    ...p,
    tests: { ...p.tests, [level]: Math.max(p.tests[level] ?? 0, score) },
  }));
  return awardXp(next, xp, today);
}

export function applyLevelCardReview(
  state: AppState,
  lang: CurriculumLang,
  cardId: string,
  grade: ReviewGrade,
  today: DayKey,
): AppState {
  const card = levelProgress(state, lang).cards[cardId];
  if (!card) return state;
  return withLevels(state, lang, (p) => ({
    ...p,
    cards: { ...p.cards, [cardId]: reviewCard(card, grade, today) },
  }));
}

/**
 * Adds one word to the flashcards (from the glossary or a topic). A word already in the deck
 * keeps its schedule: one word, one review schedule (PRD 01 REQ-01-003).
 */
export function addWordCard(
  state: AppState,
  lang: CurriculumLang,
  input: { id: string; front: string; back: string; lessonId: string },
  today: DayKey,
): AppState {
  const cards = levelProgress(state, lang).cards;
  const front = input.front.trim().toLowerCase();
  if (cards[input.id] || Object.values(cards).some((c) => c.front.trim().toLowerCase() === front))
    return state;
  return withLevels(state, lang, (p) => ({
    ...p,
    cards: {
      ...p.cards,
      [input.id]: newCard(input.id, input.front, input.back, input.lessonId, today),
    },
  }));
}

export function recordMistake(
  state: AppState,
  lang: CurriculumLang,
  exercise: Exercise,
  category?: ErrorCategory,
): AppState {
  // Self-checked items (speaking, free writing) are not mistakes to practise again.
  if (exercise.kind === 'say' || exercise.kind === 'free') return state;
  return withLevels(state, lang, (p) => ({
    ...p,
    // Review copies are stored as plain exercises so they can come back again.
    mistakes: { ...p.mistakes, [exercise.id]: { ...exercise, review: undefined } as Exercise },
    mistakeCategories: category
      ? { ...p.mistakeCategories, [category]: (p.mistakeCategories[category] ?? 0) + 1 }
      : p.mistakeCategories,
  }));
}

export function resolveMistake(
  state: AppState,
  lang: CurriculumLang,
  exerciseId: string,
): AppState {
  if (!levelProgress(state, lang).mistakes[exerciseId]) return state;
  return withLevels(state, lang, (p) => {
    const mistakes = { ...p.mistakes };
    delete mistakes[exerciseId];
    return { ...p, mistakes };
  });
}

export function setDailyGoal(state: AppState, xp: number): AppState {
  return { ...state, dailyGoalXp: xp };
}

export function setSound(state: AppState, soundOn: boolean): AppState {
  return { ...state, soundOn };
}

export function pauseListening(state: AppState, until: number): AppState {
  return { ...state, listenOffUntil: until };
}
