import { completeOnboarding, initialState, type AppState } from '../stores/appState';
import { detectEvents, eventDocument, eventId } from './habitEvents';

const today = '2026-11-19';
const base = completeOnboarding(initialState(), { name: 'An', lang: 'en', dailyGoalXp: 20 });

function withXp(state: AppState, xp: number): AppState {
  return { ...state, xpByDay: { ...state.xpByDay, [today]: xp } };
}

function withUnit(state: AppState, unitId: string, score: number): AppState {
  const p = state.levels.en ?? {
    units: {},
    tests: {},
    cards: {},
    mistakes: {},
    mistakeCategories: {},
  };
  return {
    ...state,
    levels: { ...state.levels, en: { ...p, units: { ...p.units, [unitId]: score } } },
  };
}

describe('detectEvents', () => {
  it('fires the daily goal once, when XP crosses the goal', () => {
    expect(detectEvents(withXp(base, 10), withXp(base, 20), today)).toEqual([
      {
        type: 'language.daily_goal.completed',
        date: today,
        payload: { courseId: 'en-vi', xp: 20, goalXp: 20 },
      },
    ]);
    expect(detectEvents(withXp(base, 20), withXp(base, 30), today)).toEqual([]);
    expect(detectEvents(withXp(base, 0), withXp(base, 10), today)).toEqual([]);
  });

  it('fires lesson completed only for a first completion', () => {
    const first = detectEvents(base, withUnit(base, 'a1-1', 0.8), today);
    expect(first).toEqual([
      {
        type: 'language.lesson.completed',
        date: today,
        payload: { courseId: 'en-vi', lessonId: 'a1-1' },
      },
    ]);
    const done = withUnit(base, 'a1-1', 0.8);
    expect(detectEvents(done, withUnit(done, 'a1-1', 1), today)).toEqual([]);
  });

  it('builds stable ids', () => {
    const [goal] = detectEvents(withXp(base, 0), withXp(base, 25), today);
    expect(goal && eventId('uid1', goal)).toBe('uid1_language.daily_goal.completed_2026-11-19');
  });
});

describe('eventDocument', () => {
  it('wraps an event in envelope v1 with its own id', () => {
    const event = {
      type: 'language.lesson.completed' as const,
      date: today,
      payload: { courseId: 'zh-vi', lessonId: 'h1-1' },
    };
    expect(eventDocument('uid1', event, 5)).toEqual({
      id: 'uid1_language.lesson.completed_zh-vi_h1-1',
      version: 1,
      ...event,
      userId: 'uid1',
      occurredAt: 5,
      source: 'language',
    });
  });
});
