import type { Exercise } from '../exercises';

/**
 * A lesson session: every exercise must be answered correctly once. A wrong answer sends
 * the exercise to the back of the queue so the learner sees it again before finishing.
 */
export interface SessionState {
  queue: Exercise[];
  position: number;
  /** Number of distinct exercises in the session. */
  total: number;
  completed: number;
  firstTryCorrect: number;
  missedIds: string[];
  startedAt: number;
}

export function startSession(exercises: Exercise[], now: number): SessionState {
  return {
    queue: exercises,
    position: 0,
    total: exercises.length,
    completed: 0,
    firstTryCorrect: 0,
    missedIds: [],
    startedAt: now,
  };
}

export function currentExercise(session: SessionState): Exercise | null {
  return session.queue[session.position] ?? null;
}

export function isComplete(session: SessionState): boolean {
  return session.position >= session.queue.length;
}

/** With `retry` false (tests) a wrong answer is final: it is not asked again. */
export function answerCurrent(session: SessionState, correct: boolean, retry = true): SessionState {
  const exercise = currentExercise(session);
  if (!exercise) return session;
  if (!correct && !retry) {
    return {
      ...session,
      position: session.position + 1,
      completed: session.completed + 1,
      missedIds: [...session.missedIds, exercise.id],
    };
  }
  if (correct) {
    const firstTry = !session.missedIds.includes(exercise.id);
    return {
      ...session,
      position: session.position + 1,
      completed: session.completed + 1,
      firstTryCorrect: session.firstTryCorrect + (firstTry ? 1 : 0),
    };
  }
  return {
    ...session,
    position: session.position + 1,
    queue: [...session.queue, exercise],
    missedIds: session.missedIds.includes(exercise.id)
      ? session.missedIds
      : [...session.missedIds, exercise.id],
  };
}

/** Skips without penalty (e.g. "Can't listen now"). Counts as done but not as first-try. */
export function skipCurrent(session: SessionState): SessionState {
  if (!currentExercise(session)) return session;
  return { ...session, position: session.position + 1, completed: session.completed + 1 };
}

export function progressRatio(session: SessionState): number {
  return session.total ? session.completed / session.total : 0;
}

export interface SessionSummary {
  total: number;
  firstTryCorrect: number;
  accuracy: number;
  durationMs: number;
  perfect: boolean;
}

export function summarize(session: SessionState, now: number): SessionSummary {
  const accuracy = session.total ? session.firstTryCorrect / session.total : 0;
  return {
    total: session.total,
    firstTryCorrect: session.firstTryCorrect,
    accuracy,
    durationMs: now - session.startedAt,
    perfect: session.missedIds.length === 0,
  };
}

export const LESSON_XP = 10;
export const PERFECT_BONUS_XP = 5;

export function lessonXp(summary: SessionSummary): number {
  return LESSON_XP + (summary.perfect ? PERFECT_BONUS_XP : 0);
}
