import { completeOnboarding, initialState } from '../stores/appState';
import { fromRemoteDoc, initialSyncAction, toRemoteDoc } from './syncPolicy';

const fresh = initialState();
const started = completeOnboarding(initialState(), { name: 'An', lang: 'zh', dailyGoalXp: 20 });

describe('initialSyncAction', () => {
  it('does nothing when neither side has progress', () => {
    expect(initialSyncAction(fresh, 0, null)).toBe('none');
  });

  it('uploads device progress when the account is empty', () => {
    expect(initialSyncAction(started, 10, null)).toBe('push');
  });

  it('downloads into an empty device', () => {
    expect(initialSyncAction(fresh, 50, { state: started, updatedAt: 10 })).toBe('pull');
  });

  it('keeps the most recently changed copy', () => {
    expect(initialSyncAction(started, 10, { state: started, updatedAt: 20 })).toBe('pull');
    expect(initialSyncAction(started, 30, { state: started, updatedAt: 20 })).toBe('push');
    expect(initialSyncAction(started, 20, { state: started, updatedAt: 20 })).toBe('none');
  });
});

describe('remote document', () => {
  it('round-trips state', () => {
    const snapshot = fromRemoteDoc(toRemoteDoc(started, 42));
    expect(snapshot).toEqual({ state: started, updatedAt: 42 });
  });

  it('rejects malformed or other-version documents', () => {
    expect(fromRemoteDoc(null)).toBeNull();
    expect(fromRemoteDoc({ stateJson: '{', updatedAt: 1, schemaVersion: 1 })).toBeNull();
    expect(fromRemoteDoc({ ...toRemoteDoc(started, 1), schemaVersion: 999 })).toBeNull();
    expect(
      fromRemoteDoc({ stateJson: '{"version":999}', updatedAt: 1, schemaVersion: 1 }),
    ).toBeNull();
  });
});

describe('older account copies', () => {
  it('upgrades a version 1 copy: drops the old courses and the buddy, keeps the rest', () => {
    const v1 = {
      version: 1,
      profile: { name: 'Mai', buddy: 'frog' },
      activeCourseId: 'en-from-vi',
      dailyGoalXp: 30,
      soundOn: false,
      streak: { count: 4, longest: 9, lastActive: '2026-11-18' },
      totalXp: 120,
      xpByDay: { '2026-11-18': 30 },
      lessonsCompleted: 7,
      listenOffUntil: 0,
      courses: { 'en-from-vi': { lessonLevels: { 'u1-greetings': 2 }, cards: {}, mistakes: {} } },
      levelLang: 'es',
      levels: { es: { units: { 'es-a1-1': 0.9 }, tests: {}, cards: {} } },
    };
    const doc = { stateJson: JSON.stringify(v1), updatedAt: 5, schemaVersion: 1 };
    const state = fromRemoteDoc(doc)!.state;
    expect(state.version).toBe(2);
    expect(state.profile).toEqual({ name: 'Mai' });
    expect(state).not.toHaveProperty('courses');
    expect(state).not.toHaveProperty('activeCourseId');
    expect(state).toMatchObject({
      levelLang: 'es',
      dailyGoalXp: 30,
      soundOn: false,
      totalXp: 120,
      lessonsCompleted: 7,
    });
    expect(state.streak.longest).toBe(9);
    expect(state.levels.es).toMatchObject({
      units: { 'es-a1-1': 0.9 },
      mistakes: {},
      mistakeCategories: {},
    });
  });

  it('ignores copies from a newer app', () => {
    expect(
      fromRemoteDoc({ stateJson: '{"version":3}', updatedAt: 1, schemaVersion: 3 }),
    ).toBeNull();
  });
});
