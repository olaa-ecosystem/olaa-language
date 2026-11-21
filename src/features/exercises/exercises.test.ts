import { gradeExercise, gradeText } from '.';
import type { Exercise } from './types';

describe('gradeText', () => {
  it('accepts canonical and alternative answers, ignoring case and punctuation', () => {
    expect(gradeText('hello, i am lan', ['Hello, I am Lan.']).correct).toBe(true);
    expect(gradeText("Hi I'm Lan", ['Hello, I am Lan.', "Hi, I'm Lan."]).correct).toBe(true);
  });

  it('accepts missing Vietnamese accents with a note', () => {
    const result = gradeText('toi an com', ['Tôi ăn cơm.']);
    expect(result).toMatchObject({ correct: true, note: 'accents' });
  });

  it('forgives a single typo on longer answers', () => {
    expect(gradeText('I lik apples', ['I like apples.'])).toMatchObject({
      correct: true,
      note: 'typo',
    });
  });

  it('rejects wrong and empty answers', () => {
    expect(gradeText('I eat bread', ['I eat rice.']).correct).toBe(false);
    expect(gradeText('   ', ['I eat rice.']).correct).toBe(false);
  });
});

describe('gradeExercise', () => {
  const base = { lessonId: 'u', lang: 'en' } as const;
  const cases: [Exercise, string, string][] = [
    [
      {
        ...base,
        id: 'c',
        kind: 'choice',
        instruction: null,
        prompt: 'p',
        options: ['a', 'b'],
        answerIndex: 1,
        audioText: null,
        passage: null,
      },
      '1',
      '0',
    ],
    [
      { ...base, id: 't', kind: 'text', instruction: null, prompt: 'p', accepted: ['went'] },
      'went',
      'go',
    ],
    [
      { ...base, id: 'd', kind: 'dictation', audioText: 'I like tea.' },
      'i like tea',
      'I like coffee',
    ],
    [{ ...base, id: 's', kind: 'say', text: 'Hola' }, 'said', ''],
    [{ ...base, id: 'f', kind: 'free', prompt: 'Write', model: null }, 'Some text', '  '],
    [
      {
        id: 'se',
        lessonId: 'u',
        kind: 'select',
        prompt: 'cat',
        promptLang: 'en',
        optionLang: 'vi',
        options: ['con mèo', 'con chó'],
        answer: 'con mèo',
      },
      'con mèo',
      'con chó',
    ],
    [
      {
        id: 'b',
        lessonId: 'u',
        kind: 'build',
        prompt: 'Tôi thích trà',
        promptLang: 'vi',
        answerLang: 'en',
        tiles: [],
        accepted: ['I like tea'],
      },
      'I like tea',
      'tea I like',
    ],
  ];

  it.each(cases)('grades %o', (exercise, right, wrong) => {
    expect(gradeExercise(exercise, right).correct).toBe(true);
    expect(gradeExercise(exercise, wrong).correct).toBe(false);
  });

  it('does not accept a one-letter slip in dictation', () => {
    const e: Exercise = {
      id: 'd',
      lessonId: 'u',
      kind: 'dictation',
      audioText: 'I like apples',
      lang: 'en',
    };
    expect(gradeExercise(e, 'I lik apples').correct).toBe(false);
  });
});
