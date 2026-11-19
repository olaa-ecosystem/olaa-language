import type { MascotId } from '../types';
import type { DayKey } from '../utils/date';
import { MAX_LESSON_LEVEL, type Course, type CourseId, type Lesson } from '../features/curriculum';
import type { Exercise } from '../features/exercises';
import {
  newCard,
  reviewCard,
  type ReviewGrade,
  type SrsCard,
} from '../features/flashcards-srs/srs';
import type { ErrorCategory } from '../features/exercises/explain';
import { recordActivity, type StreakState } from '../features/learning-progress/streak';

export const STATE_VERSION = 1;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;

export interface CourseProgress {
  /** 0 = not started, 1..5 = times completed (capped). */
  lessonLevels: Record<string, number>;
  cards: Record<string, SrsCard>;
  /** Exercises answered wrongly, kept for targeted practice. */
  mistakes: Record<string, Exercise>;
  /** How often each kind of mistake happened (PRD v1.0 §6.3). */
  mistakeCategories?: Partial<Record<ErrorCategory, number>>;
}

export interface Profile {
  name: string;
  buddy: MascotId;
}

export interface AppState {
  version: typeof STATE_VERSION;
  profile: Profile | null;
  activeCourseId: CourseId | null;
  dailyGoalXp: number;
  soundOn: boolean;
  streak: StreakState;
  totalXp: number;
  xpByDay: Record<DayKey, number>;
  lessonsCompleted: number;
  /** "Can't listen now" pauses listening exercises until this time (ms). */
  listenOffUntil: number;
  courses: Partial<Record<CourseId, CourseProgress>>;
}

export function initialState(): AppState {
  return {
    version: STATE_VERSION,
    profile: null,
    activeCourseId: null,
    dailyGoalXp: 20,
    soundOn: true,
    streak: { count: 0, longest: 0, lastActive: null },
    totalXp: 0,
    xpByDay: {},
    lessonsCompleted: 0,
    listenOffUntil: 0,
    courses: {},
  };
}

export function emptyCourseProgress(): CourseProgress {
  return { lessonLevels: {}, cards: {}, mistakes: {} };
}

export function courseProgress(state: AppState, courseId: CourseId): CourseProgress {
  return state.courses[courseId] ?? emptyCourseProgress();
}

function withCourse(
  state: AppState,
  courseId: CourseId,
  update: (progress: CourseProgress) => CourseProgress,
): AppState {
  return {
    ...state,
    courses: { ...state.courses, [courseId]: update(courseProgress(state, courseId)) },
  };
}

/* ---------- actions (pure) ---------- */

export function completeOnboarding(
  state: AppState,
  input: { name: string; buddy: MascotId; courseId: CourseId; dailyGoalXp: number },
): AppState {
  return {
    ...state,
    profile: { name: input.name.trim() || 'Learner', buddy: input.buddy },
    activeCourseId: input.courseId,
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

export function finishLesson(
  state: AppState,
  input: { course: Course; lesson: Lesson; xp: number; today: DayKey },
): AppState {
  const { course, lesson, xp, today } = input;
  const next = withCourse(state, course.id, (progress) => {
    const cards = { ...progress.cards };
    for (const word of lesson.words) {
      const id = `${lesson.id}:${word.en}`;
      cards[id] ??= newCard(id, word[course.targetLang], word[course.baseLang], lesson.id, today);
    }
    const level = Math.min(MAX_LESSON_LEVEL, (progress.lessonLevels[lesson.id] ?? 0) + 1);
    return { ...progress, cards, lessonLevels: { ...progress.lessonLevels, [lesson.id]: level } };
  });
  return awardXp({ ...next, lessonsCompleted: next.lessonsCompleted + 1 }, xp, today);
}

export function recordMistake(
  state: AppState,
  courseId: CourseId,
  exercise: Exercise,
  category?: ErrorCategory,
): AppState {
  if (exercise.kind === 'match') return state;
  return withCourse(state, courseId, (p) => ({
    ...p,
    // Review copies are stored as plain exercises so they can come back again.
    mistakes: { ...p.mistakes, [exercise.id]: { ...exercise, review: undefined } as Exercise },
    mistakeCategories: category
      ? { ...p.mistakeCategories, [category]: (p.mistakeCategories?.[category] ?? 0) + 1 }
      : p.mistakeCategories,
  }));
}

export function resolveMistake(state: AppState, courseId: CourseId, exerciseId: string): AppState {
  if (!courseProgress(state, courseId).mistakes[exerciseId]) return state;
  return withCourse(state, courseId, (p) => {
    const mistakes = { ...p.mistakes };
    delete mistakes[exerciseId];
    return { ...p, mistakes };
  });
}

export function applyCardReview(
  state: AppState,
  courseId: CourseId,
  cardId: string,
  grade: ReviewGrade,
  today: DayKey,
): AppState {
  const card = courseProgress(state, courseId).cards[cardId];
  if (!card) return state;
  return withCourse(state, courseId, (p) => ({
    ...p,
    cards: { ...p.cards, [cardId]: reviewCard(card, grade, today) },
  }));
}

export function setDailyGoal(state: AppState, xp: number): AppState {
  return { ...state, dailyGoalXp: xp };
}

export function setSound(state: AppState, soundOn: boolean): AppState {
  return { ...state, soundOn };
}

export function switchCourse(state: AppState, courseId: CourseId): AppState {
  return { ...state, activeCourseId: courseId };
}

export function setBuddy(state: AppState, buddy: MascotId): AppState {
  return state.profile ? { ...state, profile: { ...state.profile, buddy } } : state;
}

export function pauseListening(state: AppState, until: number): AppState {
  return { ...state, listenOffUntil: until };
}
