import { completeOnboarding, initialState } from '../stores/appState';
import { fromRemoteDoc, initialSyncAction, toRemoteDoc } from './syncPolicy';

const fresh = initialState();
const started = completeOnboarding(initialState(), {
  name: 'An',
  buddy: 'bear',
  courseId: 'en-from-vi',
  dailyGoalXp: 20,
});

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
