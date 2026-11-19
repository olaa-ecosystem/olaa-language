import type { Exercise } from '../exercises';
import {
  answerCurrent,
  currentExercise,
  isComplete,
  lessonXp,
  progressRatio,
  skipCurrent,
  startSession,
  summarize,
} from './session';

const ex = (id: string): Exercise => ({
  id,
  lessonId: 'l',
  kind: 'type',
  prompt: id,
  promptLang: 'vi',
  answerLang: 'en',
  accepted: [id],
});

describe('lesson session', () => {
  it('completes a perfect run', () => {
    let s = startSession([ex('a'), ex('b')], 0);
    s = answerCurrent(s, true);
    expect(progressRatio(s)).toBe(0.5);
    s = answerCurrent(s, true);
    expect(isComplete(s)).toBe(true);
    const summary = summarize(s, 5000);
    expect(summary).toMatchObject({ accuracy: 1, perfect: true, durationMs: 5000 });
    expect(lessonXp(summary)).toBe(15);
  });

  it('requeues missed exercises until answered', () => {
    let s = startSession([ex('a'), ex('b')], 0);
    s = answerCurrent(s, false);
    expect(currentExercise(s)?.id).toBe('b');
    s = answerCurrent(s, true);
    expect(isComplete(s)).toBe(false);
    expect(currentExercise(s)?.id).toBe('a');
    s = answerCurrent(s, true);
    expect(isComplete(s)).toBe(true);
    const summary = summarize(s, 1);
    expect(summary).toMatchObject({ firstTryCorrect: 1, accuracy: 0.5, perfect: false });
    expect(lessonXp(summary)).toBe(10);
  });

  it('skips without penalty', () => {
    let s = startSession([ex('a')], 0);
    s = skipCurrent(s);
    expect(isComplete(s)).toBe(true);
    expect(summarize(s, 0).perfect).toBe(true);
  });
});

describe('answerCurrent without retry', () => {
  it('moves on after a wrong answer and does not ask again', () => {
    const exercises = [
      { id: 'a', lessonId: 'l', kind: 'say', text: 'hola', lang: 'es' },
      { id: 'b', lessonId: 'l', kind: 'say', text: 'adiós', lang: 'es' },
    ] as Parameters<typeof startSession>[0];
    let s = startSession(exercises, 0);
    s = answerCurrent(s, false, false);
    s = answerCurrent(s, true, false);
    expect(isComplete(s)).toBe(true);
    expect(s.queue).toHaveLength(2);
    expect(summarize(s, 1000).accuracy).toBe(0.5);
  });
});
