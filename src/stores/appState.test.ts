import type { Exercise } from '../features/exercises';
import {
  awardXp,
  completeOnboarding,
  initialState,
  levelProgress,
  recordMistake,
  resolveMistake,
  setLevelLang,
} from './appState';
import { migrateState } from './migrate';

const today = '2026-11-21';
const text: Exercise = {
  id: 'a1-1:3',
  lessonId: 'a1-1',
  kind: 'text',
  instruction: null,
  prompt: 'She ___ happy.',
  lang: 'en',
  accepted: ['is'],
};

describe('app state actions', () => {
  it('onboards a learner with a language and a daily goal', () => {
    const state = completeOnboarding(initialState(), {
      name: '  Mai ',
      lang: 'zh',
      dailyGoalXp: 30,
    });
    expect(state.profile).toEqual({ name: 'Mai' });
    expect(state.levelLang).toBe('zh');
    expect(state.dailyGoalXp).toBe(30);
  });

  it('awards XP and starts a streak', () => {
    const state = awardXp(initialState(), 15, today);
    expect(state.totalXp).toBe(15);
    expect(state.xpByDay[today]).toBe(15);
    expect(state.streak.count).toBe(1);
  });

  it('switches language without touching progress', () => {
    const s = setLevelLang(initialState(), 'es');
    expect(s.levelLang).toBe('es');
    expect(setLevelLang(s, 'es')).toBe(s);
  });

  it('records, counts and resolves mistakes per language', () => {
    let s = recordMistake(initialState(), 'en', text, 'grammar');
    s = recordMistake(s, 'en', { ...text, review: true }, 'grammar');
    const p = levelProgress(s, 'en');
    expect(Object.keys(p.mistakes)).toEqual([text.id]);
    expect(p.mistakes[text.id]?.review).toBeUndefined();
    expect(p.mistakeCategories).toEqual({ grammar: 2 });
    expect(levelProgress(s, 'es').mistakes).toEqual({});
    s = resolveMistake(s, 'en', text.id);
    expect(levelProgress(s, 'en').mistakes).toEqual({});
  });

  it('does not keep self-checked items as mistakes', () => {
    const say: Exercise = { id: 's', lessonId: 'a1-1', kind: 'say', text: 'Hello', lang: 'en' };
    expect(recordMistake(initialState(), 'en', say)).toEqual(initialState());
  });
});

describe('migrateState', () => {
  it('keeps current data and fills missing level fields', () => {
    const s = migrateState({
      ...initialState(),
      levels: { en: { units: { x: 1 }, tests: {}, cards: {} } },
    });
    expect(s?.levels.en).toEqual({
      units: { x: 1 },
      tests: {},
      cards: {},
      mistakes: {},
      mistakeCategories: {},
    });
  });

  it('rejects unknown data', () => {
    expect(migrateState(null)).toBeNull();
    expect(migrateState({ version: 99 })).toBeNull();
  });
});
