/**
 * "Today": a daily study plan shown as a habit checklist, in the style of Olaa Habits.
 * The plan is computed from progress; ticks come from a small per-day activity log kept in
 * this browser (what was actually done today). The log is Language-owned data and is not
 * written to Olaa Habits: Habits learns about study through the events in
 * `services/habitEvents.ts` (contracts/events/language-events.md).
 */
import { createLocalStore, isRecord } from '../../services/localStore';
import { addDays, fromDayKey, toDayKey, type DayKey } from '../../utils/date';
import { hashString } from '../../utils/random';
import type { Topic } from '../topics/types';
import type { CurriculumLang } from '../levels/types';
import { topicLevelCode } from '../syllabus/syllabus';

export type ActivityKind = 'unit' | 'review' | 'mistakes' | 'topic' | 'sounds' | 'test';

/** Day → how many times each kind of activity was finished. */
export type ActivityLog = Record<DayKey, Partial<Record<ActivityKind, number>>>;

/** Days kept in the log; older days are dropped when a new one is recorded. */
export const ACTIVITY_DAYS_KEPT = 120;

export function recordDone(log: ActivityLog, day: DayKey, kind: ActivityKind): ActivityLog {
  const cutoff = addDays(day, -ACTIVITY_DAYS_KEPT);
  const next: ActivityLog = {};
  for (const [d, v] of Object.entries(log)) if (d > cutoff) next[d] = v;
  const today = next[day] ?? {};
  next[day] = { ...today, [kind]: (today[kind] ?? 0) + 1 };
  return next;
}

export const activityStore = createLocalStore<ActivityLog>(
  'olaa-language/activity',
  () => ({}),
  (v): v is ActivityLog => isRecord(v) && Object.values(v).every(isRecord),
);

export function logActivity(kind: ActivityKind): void {
  activityStore.set((log) => recordDone(log, toDayKey(new Date()), kind));
}

export interface PlanTask {
  id: ActivityKind | 'goal';
  title: [string, string];
  detail: [string, string] | null;
  done: boolean;
  /** Where the task opens. */
  href: string;
}

export interface PlanInput {
  today: DayKey;
  lang: CurriculumLang;
  xpToday: number;
  goalXp: number;
  dueCards: number;
  /** Cards in the deck; without any, there is nothing to review yet. */
  totalCards: number;
  mistakes: number;
  nextUnit: { title: [string, string]; href: string } | null;
  topicOfDay: Topic | null;
  activity: ActivityLog;
}

/** Today's checklist. Pure. */
export function todayPlan(input: PlanInput): PlanTask[] {
  const done = input.activity[input.today] ?? {};
  const count = (k: ActivityKind) => done[k] ?? 0;
  const tasks: PlanTask[] = [];
  tasks.push({
    id: 'unit',
    title: input.nextUnit
      ? [`Học bài: ${input.nextUnit.title[0]}`, `Study: ${input.nextUnit.title[1]}`]
      : ['Học một bài', 'Study one unit'],
    detail: ['Lý thuyết, từ mới và luyện tập', 'Rule, new words and practice'],
    done: count('unit') > 0 || count('test') > 0,
    href: input.nextUnit?.href ?? '#/path',
  });
  if (input.totalCards > 0)
    tasks.push({
      id: 'review',
      title:
        input.dueCards > 0
          ? [`Ôn ${input.dueCards} thẻ từ đến hạn`, `Review ${input.dueCards} due cards`]
          : ['Ôn thẻ từ', 'Review cards'],
      detail: input.dueCards > 0 ? null : ['Không còn thẻ đến hạn hôm nay', 'Nothing due today'],
      done: input.dueCards === 0,
      href: '#/words',
    });
  if (input.mistakes > 0 || count('mistakes') > 0)
    tasks.push({
      id: 'mistakes',
      title: ['Sửa lỗi sai', 'Fix mistakes'],
      detail: [`${input.mistakes} câu đang chờ`, `${input.mistakes} waiting`],
      done: count('mistakes') > 0,
      href: '#/practice/mistakes',
    });
  if (input.topicOfDay)
    tasks.push({
      id: 'topic',
      title: [`Chủ đề: ${input.topicOfDay.title}`, `Topic: ${input.topicOfDay.title}`],
      detail: ['Từ, mẫu câu và nói', 'Words, phrases and speaking'],
      done: count('topic') > 0,
      href: `#/topic/${encodeURIComponent(input.topicOfDay.id)}`,
    });
  tasks.push({
    id: 'sounds',
    title: ['Luyện phát âm 5 phút', '5 minutes of pronunciation'],
    detail: null,
    done: count('sounds') > 0,
    href: '#/practice/sounds',
  });
  tasks.push({
    id: 'goal',
    title: [`Đạt ${input.goalXp} XP hôm nay`, `Reach ${input.goalXp} XP today`],
    detail: [
      `${Math.min(input.xpToday, input.goalXp)} / ${input.goalXp} XP`,
      `${Math.min(input.xpToday, input.goalXp)} / ${input.goalXp} XP`,
    ],
    done: input.xpToday >= input.goalXp,
    href: '#/path',
  });
  return tasks;
}

/**
 * A topic for today, the same all day: chosen among topics that start at or below the
 * learner's level, so it is always within reach.
 */
export function topicOfDay(
  topics: Topic[],
  lang: CurriculumLang,
  levelCodes: string[],
  currentLevel: number,
  today: DayKey,
): Topic | null {
  const reachable = topics.filter((t) => {
    const i = levelCodes.indexOf(topicLevelCode(t, lang));
    return i >= 0 && i <= currentLevel;
  });
  const pool = reachable.length ? reachable : topics.slice(0, 1);
  return pool[hashString(`${today}:${lang}`) % Math.max(1, pool.length)] ?? null;
}

export type DayMark = 'goal' | 'some' | 'none' | 'future';

export function dayMark(day: DayKey, today: DayKey, xp: number, goal: number): DayMark {
  if (day > today) return 'future';
  if (xp >= goal && goal > 0) return 'goal';
  return xp > 0 ? 'some' : 'none';
}

/** Weeks of the month that contains `day`, Monday first; days outside the month are null. */
export function monthGrid(day: DayKey): (DayKey | null)[][] {
  const d = fromDayKey(day);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (DayKey | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < daysInMonth; i++)
    cells.push(toDayKey(new Date(d.getFullYear(), d.getMonth(), i + 1)));
  while (cells.length % 7) cells.push(null);
  const weeks: (DayKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Same day of another month (clamped), for month navigation. */
export function shiftMonth(day: DayKey, months: number): DayKey {
  const d = fromDayKey(day);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return toDayKey(target);
}
