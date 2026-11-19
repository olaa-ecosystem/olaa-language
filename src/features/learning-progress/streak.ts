import { addDays, type DayKey } from '../../utils/date';

export interface StreakState {
  count: number;
  longest: number;
  lastActive: DayKey | null;
}

/** Called when the learner earns XP on `today`. */
export function recordActivity(streak: StreakState, today: DayKey): StreakState {
  if (streak.lastActive === today) return streak;
  const continues = streak.lastActive === addDays(today, -1);
  const count = continues ? streak.count + 1 : 1;
  return { count, longest: Math.max(streak.longest, count), lastActive: today };
}

/** The streak to display: it is broken if neither today nor yesterday had activity. */
export function visibleStreak(streak: StreakState, today: DayKey): number {
  if (!streak.lastActive) return 0;
  return streak.lastActive === today || streak.lastActive === addDays(today, -1) ? streak.count : 0;
}

export function practicedToday(streak: StreakState, today: DayKey): boolean {
  return streak.lastActive === today;
}
