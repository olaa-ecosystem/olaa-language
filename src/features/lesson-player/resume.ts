/**
 * Resume a lesson where the learner left it (Ecosystem PRD v1.0 §6.1 "resume state").
 * One saved session per lesson, in this browser. Exercises are saved with it so the learner
 * continues the same questions, not a fresh shuffle.
 */
import type { Exercise } from '../exercises';
import type { SessionState } from './session';

const PREFIX = 'olaa-language/session/';
/** Older saved sessions are dropped rather than resumed. */
export const RESUME_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface SavedSession {
  lessonId: string;
  level: number;
  exercises: Exercise[];
  session: SessionState;
  savedAt: number;
}

export function saveSession(saved: SavedSession): void {
  try {
    localStorage.setItem(PREFIX + saved.lessonId, JSON.stringify(saved));
  } catch {
    // Without storage the lesson simply starts over next time.
  }
}

export function loadSession(lessonId: string, level: number, now: number): SavedSession | null {
  try {
    const raw = localStorage.getItem(PREFIX + lessonId);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedSession;
    const fresh = now - saved.savedAt < RESUME_MAX_AGE_MS;
    const valid =
      saved.lessonId === lessonId &&
      saved.level === level &&
      Array.isArray(saved.exercises) &&
      Array.isArray(saved.session?.queue) &&
      saved.session.position > 0 &&
      saved.session.position < saved.session.queue.length;
    return fresh && valid ? saved : null;
  } catch {
    return null;
  }
}

export function clearSession(lessonId: string): void {
  try {
    localStorage.removeItem(PREFIX + lessonId);
  } catch {
    // Nothing saved.
  }
}
