/**
 * Events for other Olaa apps (contracts/events/language-events.md in olaa-platform).
 * Olaa Habits reads them to check off learning habits automatically (Habits PRD REQ-02-010/011).
 */
import type { AppState } from '../stores/appState';
import type { DayKey } from '../utils/date';

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
  if (next.activeCourseId && goal > 0 && before < goal && after >= goal) {
    events.push({
      type: 'language.daily_goal.completed',
      date: today,
      payload: { courseId: next.activeCourseId, xp: after, goalXp: goal },
    });
  }
  for (const [courseId, progress] of Object.entries(next.courses)) {
    if (!progress) continue;
    const old = prev.courses[courseId as keyof typeof prev.courses]?.lessonLevels ?? {};
    for (const [lessonId, level] of Object.entries(progress.lessonLevels)) {
      if (level >= 1 && (old[lessonId] ?? 0) === 0) {
        events.push({
          type: 'language.lesson.completed',
          date: today,
          payload: { courseId, lessonId },
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
