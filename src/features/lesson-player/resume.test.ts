import { clearSession, loadSession, saveSession } from './resume';
import type { Exercise } from '../exercises';
import { startSession } from './session';

const exercises = [
  {
    id: 'a',
    lessonId: 'l',
    kind: 'select',
    prompt: 'a',
    promptLang: 'en',
    optionLang: 'vi',
    options: [],
    answer: 'x',
  },
  {
    id: 'b',
    lessonId: 'l',
    kind: 'select',
    prompt: 'b',
    promptLang: 'en',
    optionLang: 'vi',
    options: [],
    answer: 'y',
  },
] as Exercise[];

describe('lesson resume', () => {
  it('resumes a session in progress for the same lesson level, and forgets it when cleared', () => {
    const session = { ...startSession(exercises, 0), position: 1, completed: 1 };
    saveSession({ lessonId: 'l', level: 0, exercises: exercises, session, savedAt: 1000 });
    expect(loadSession('l', 0, 2000)?.session.position).toBe(1);
    expect(loadSession('l', 1, 2000)).toBeNull();
    expect(loadSession('l', 0, 1000 + 8 * 24 * 3600 * 1000)).toBeNull();
    clearSession('l');
    expect(loadSession('l', 0, 2000)).toBeNull();
  });

  it('does not resume a session that has not started or is finished', () => {
    saveSession({
      lessonId: 'l',
      level: 0,
      exercises: exercises,
      session: startSession(exercises, 0),
      savedAt: 1,
    });
    expect(loadSession('l', 0, 2)).toBeNull();
  });
});
