/**
 * Events for other Olaa apps (contracts/events/language-events.md in olaa-platform).
 * Olaa Habits reads them to check off learning habits automatically (Habits PRD REQ-02-010/011).
 */
import type { AppState } from '../stores/appState';
import type { DayKey } from '../utils/date';

/** Envelope version written with every event (contract: envelope v1). */
export const EVENT_VERSION = 1;

export type LanguageEvent =
  | {
      type: 'language.daily_goal.completed';
      date: DayKey;
      payload: { courseId: string; xp: number; goalXp: number };
    }
  | {
      type: 'language.lesson.completed';
      date: DayKey;
      payload: { courseId: string; lessonId: string };
    };

/** Events implied by a local change from `prev` to `next` on `today`. Pure. */
export function detectEvents(prev: AppState, next: AppState, today: DayKey): LanguageEvent[] {
  const events: LanguageEvent[] = [];
  const goal = next.dailyGoalXp;
  const before = prev.xpByDay[today] ?? 0;
  const after = next.xpByDay[today] ?? 0;
  if (next.profile && goal > 0 && before < goal && after >= goal) {
    events.push({
      type: 'language.daily_goal.completed',
      date: today,
      payload: { courseId: `${next.levelLang}-vi`, xp: after, goalXp: goal },
    });
  }
  // Level curriculum: the first time a unit is finished counts as a completed lesson.
  for (const [lang, progress] of Object.entries(next.levels)) {
    if (!progress) continue;
    const old = prev.levels[lang as keyof AppState['levels']]?.units ?? {};
    for (const unitId of Object.keys(progress.units)) {
      if (old[unitId] === undefined) {
        events.push({
          type: 'language.lesson.completed',
          date: today,
          payload: { courseId: `${lang}-vi`, lessonId: unitId },
        });
      }
    }
  }
  return events;
}

/** Fixed id per event, so sending it twice never creates a duplicate. */
export function eventId(uid: string, event: LanguageEvent): string {
  return event.type === 'language.daily_goal.completed'
    ? `${uid}_${event.type}_${event.date}`
    : `${uid}_${event.type}_${event.payload.courseId}_${event.payload.lessonId}`;
}

/** The Firestore document for an event: envelope v1 around the event (contract shape). */
export function eventDocument(uid: string, event: LanguageEvent, now: number) {
  return {
    id: eventId(uid, event),
    version: EVENT_VERSION,
    ...event,
    userId: uid,
    occurredAt: now,
    source: 'language' as const,
  };
}
