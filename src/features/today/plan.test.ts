import { describe, expect, it } from 'vitest';
import type { Topic } from '../topics/types';
import {
  ACTIVITY_DAYS_KEPT,
  dayMark,
  monthGrid,
  recordDone,
  shiftMonth,
  todayPlan,
  topicOfDay,
  type PlanInput,
} from './plan';

const topic = (id: string, cefr: string, hsk: string) =>
  ({ id, title: id, level: { cefr, hsk } }) as Topic;

const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  today: '2026-11-24',
  lang: 'en',
  xpToday: 0,
  goalXp: 20,
  dueCards: 3,
  mistakes: 0,
  nextUnit: { title: ['Chào hỏi', 'Greetings'], href: '#/unit/en/A1/a1-1' },
  topicOfDay: topic('t1', 'A1', 'HSK 1'),
  activity: {},
  ...over,
});

describe('recordDone', () => {
  it('counts per day and drops old days', () => {
    let log = recordDone({ '2020-01-01': { unit: 1 } }, '2026-11-24', 'unit');
    log = recordDone(log, '2026-11-24', 'unit');
    expect(log).toEqual({ '2026-11-24': { unit: 2 } });
    expect(ACTIVITY_DAYS_KEPT).toBeGreaterThan(30);
  });
});

describe('todayPlan', () => {
  it('lists what to do and ticks what is done', () => {
    const fresh = todayPlan(input());
    expect(fresh.map((t) => t.id)).toEqual(['unit', 'review', 'topic', 'sounds', 'goal']);
    expect(fresh.every((t) => !t.done)).toBe(true);

    const later = todayPlan(
      input({
        xpToday: 25,
        dueCards: 0,
        activity: { '2026-11-24': { unit: 1, topic: 1, sounds: 1 } },
      }),
    );
    expect(later.every((t) => t.done)).toBe(true);
  });

  it('adds mistakes only when there are some', () => {
    expect(todayPlan(input({ mistakes: 4 })).some((t) => t.id === 'mistakes')).toBe(true);
  });
});

describe('topicOfDay', () => {
  const topics = [topic('a', 'A1', 'HSK 1'), topic('b', 'B2', 'HSK 5'), topic('c', 'A2', 'HSK 2')];
  const codes = ['A1', 'A2', 'B1', 'B2'];
  it('picks a reachable topic, stable for the day', () => {
    const t = topicOfDay(topics, 'en', codes, 0, '2026-11-24');
    expect(t?.id).toBe('a');
    const t2 = topicOfDay(topics, 'en', codes, 1, '2026-11-24');
    expect(['a', 'c']).toContain(t2?.id);
    expect(topicOfDay(topics, 'en', codes, 1, '2026-11-24')).toBe(t2);
  });
});

describe('calendar helpers', () => {
  it('builds a Monday-first month grid', () => {
    const weeks = monthGrid('2026-11-24');
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('marks days and moves between months', () => {
    expect(dayMark('2026-11-25', '2026-11-24', 0, 20)).toBe('future');
    expect(dayMark('2026-11-24', '2026-11-24', 20, 20)).toBe('goal');
    expect(dayMark('2026-11-23', '2026-11-24', 5, 20)).toBe('some');
    expect(shiftMonth('2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftMonth('2026-01-15', -1)).toBe('2025-12-15');
  });
});
